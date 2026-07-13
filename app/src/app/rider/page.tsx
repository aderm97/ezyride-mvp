'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { fetchApi } from '@/lib/api';
import { formatNaira } from '@/lib/fleet';
import { LogOut, Check } from 'lucide-react';

const LiveMap = dynamic(() => import('@/components/ui/LiveMap').then(m => m.LiveMap), { ssr: false, loading: () => <div className="absolute inset-0 bg-background" /> });

interface TierEstimate {
  tier: string;
  name: string;
  description: string;
  maxPassengers: number;
  luggage: string;
  exampleVehicles: string[];
  fare: number;
}

// Lagos city centre — sensible fallback for a Naira / Lagos service.
const LAGOS = { lat: 6.5244, lng: 3.3792 };

// Live-ride stages: distinct, reassuring copy + a 3-step journey position.
const STAGES: Record<string, { label: string; line: string; step: number }> = {
  ACCEPTED:    { label: 'On the way',  line: 'Your chauffeur is en route to you.', step: 1 },
  ARRIVED:     { label: 'Arrived',     line: 'Your chauffeur is waiting at the pickup point.', step: 2 },
  IN_PROGRESS: { label: 'In transit',  line: 'Sit back — you are on your way.', step: 3 },
};

export default function RiderPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Ride Booking State
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [scheduleType, setScheduleType] = useState('On-Demand');

  const [bookingState, setBookingState] = useState<'IDLE' | 'TIERS' | 'SEARCHING' | 'LIVE' | 'COMPLETED'>('IDLE');

  // Tier selection + pricing
  const [estimates, setEstimates] = useState<TierEstimate[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; etaMin: number } | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('standard');
  const [coords, setCoords] = useState<{ pickup: any; dropoff: any } | null>(null);
  const [isPricing, setIsPricing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);



  const [rideId, setRideId] = useState('');
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  // Lightweight toast (replaces jarring alert()).
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    loadRiderData();
  }, []);


  const loadRiderData = async () => {
    try {
      const userData = await fetchApi('/users/me');
      if (userData.role !== 'RIDER') { router.push('/login'); return; }
      setUser(userData);

      try {
        const myRides = await fetchApi('/rides');
        const current = myRides.find((r: any) => ['PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status));
        if (current) {
          setActiveRide(current);
          setRideId(current.id);
          if (current.tier) setSelectedTier(current.tier);
          setBookingState(current.status === 'PENDING' ? 'SEARCHING' : 'LIVE');
          if (current.driver) setDriverInfo(current.driver);
          pollRideStatus(current.id);
        }
      } catch (e) {}

      // Auto-detect location for a frictionless pickup
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
              const data = await res.json();
              setPickup(data?.display_name ? data.display_name.split(',')[0] : 'Current Location');
            } catch {
              setPickup('Current Location');
            }
          },
          (error) => {
            console.warn("Geolocation blocked or failed. Falling back to Lagos.", error);
            setCurrentLocation(LAGOS);
            setPickup('Lagos'); // Let the user know we defaulted to Lagos
          }
        );
      } else {
        setCurrentLocation(LAGOS);
        setPickup('Lagos');
      }

      setIsMounted(true);
    } catch { router.push('/login'); }
  };

  const geocodeAddress = async (address: string) => {
    if (address === 'Current Location') return currentLocation || LAGOS;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {}
    return currentLocation || LAGOS;
  };

  // Step 1 → 2: geocode, fetch fixed fares for every tier, show the selector.
  const handleSeePrices = async () => {
    if (!pickup.trim() || !destination.trim()) {
      showToast('Enter a pickup and a destination to see prices.');
      return;
    }
    setIsPricing(true);
    try {
      const pickupCoords = await geocodeAddress(pickup);
      const dropoffCoords = await geocodeAddress(destination);
      setCoords({ pickup: pickupCoords, dropoff: dropoffCoords });

      const res = await fetchApi('/rides/estimate', {
        method: 'POST',
        body: JSON.stringify({
          pickupLat: pickupCoords.lat,
          pickupLng: pickupCoords.lng,
          dropoffLat: dropoffCoords.lat,
          dropoffLng: dropoffCoords.lng,
        })
      });
      setEstimates(res.estimates || []);
      setRouteInfo({ distanceKm: res.distanceKm, etaMin: res.etaMin });
      setBookingState('TIERS');
    } catch (err) {
      console.error(err);
      showToast('We couldn’t fetch prices just now. Please try again.');
    } finally {
      setIsPricing(false);
    }
  };

  // Step 2 → 3: request the ride with the chosen tier (fare re-derived server-side).
  const handleRequestVehicle = async () => {
    if (!coords) { setBookingState('IDLE'); return; }
    setBookingState('SEARCHING');
    try {
      const rideData = await fetchApi('/rides/request', {
        method: 'POST',
        body: JSON.stringify({
          pickupLat: coords.pickup.lat,
          pickupLng: coords.pickup.lng,
          dropoffLat: coords.dropoff.lat,
          dropoffLng: coords.dropoff.lng,
          tier: selectedTier,
        })
      });
      setActiveRide(rideData);
      setRideId(rideData.id);
      pollRideStatus(rideData.id);
    } catch (err) {
      console.error(err);
      showToast('We couldn’t request your ride. Please try again.');
      setBookingState('TIERS');
    }
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  // Poll the whole lifecycle — SEARCHING → LIVE (accepted/arrived/in-transit)
  // → COMPLETED — so the rider always sees the true, current stage.
  const pollRideStatus = (id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetchApi(`/rides/${id}`);
        setActiveRide(res);
        if (res.driver) setDriverInfo(res.driver);
        switch (res.status) {
          case 'PENDING':
            setBookingState('SEARCHING');
            break;
          case 'ACCEPTED':
          case 'ARRIVED':
          case 'IN_PROGRESS':
            setBookingState('LIVE');
            break;
          case 'COMPLETED':
            setBookingState('COMPLETED');
            stopPolling();
            break;
          case 'CANCELED':
            stopPolling();
            setBookingState('IDLE');
            showToast('Your chauffeur had to cancel — request another when you’re ready.');
            break;
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);
  };

  // Cleanup timers on unmount (logout / navigation).
  useEffect(() => () => { stopPolling(); if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const handleCancelRide = async () => {
    if (rideId) {
      try { await fetchApi(`/rides/${rideId}/cancel`, { method: 'PATCH' }); } catch (e) {}
    }
    stopPolling();
    resetBooking();
  };

  const resetBooking = () => {
    setBookingState('IDLE');
    setDestination('');
    setEstimates([]);
    setRouteInfo(null);
    setCoords(null);
    setActiveRide(null);
    setDriverInfo(null);
    setRideId('');
  };

  const handleLogout = async () => {
    if (activeRide || rideId) {
      try { await fetchApi(`/rides/${activeRide?.id || rideId}/cancel`, { method: 'PATCH' }); } catch(e) {}
    }
    localStorage.removeItem('token');
    router.push('/login');
  };

  const selectedEstimate = estimates.find((e) => e.tier === selectedTier);
  const stage = activeRide ? STAGES[activeRide.status] : undefined;
  const canCancel = activeRide && (activeRide.status === 'ACCEPTED' || activeRide.status === 'ARRIVED');

  if (!isMounted) return <div suppressHydrationWarning className="h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-t-2 border-accent animate-spin"/></div>;

  return (
    <div suppressHydrationWarning className="h-screen bg-background text-text-primary relative flex flex-col overflow-hidden font-body">

      <LiveMap
        pickupLat={activeRide?.pickupLat || coords?.pickup?.lat || currentLocation?.lat}
        pickupLng={activeRide?.pickupLng || coords?.pickup?.lng || currentLocation?.lng}
        dropoffLat={activeRide?.dropoffLat || coords?.dropoff?.lat}
        dropoffLng={activeRide?.dropoffLng || coords?.dropoff?.lng}
        status={activeRide?.status}
      />

      <div className="absolute top-8 w-full p-4 md:p-8 z-20 flex justify-between items-center pointer-events-none mt-4">
        <div className="glass-panel rounded-full px-6 py-3 flex items-center gap-4 pointer-events-auto">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-on-accent">
            {user?.name.charAt(0)}
          </div>
          <span className="font-semibold tracking-widest uppercase text-xs text-text-primary">{user?.name}</span>
        </div>
        <button onClick={handleLogout} className="w-12 h-12 rounded-full glass-panel flex items-center justify-center active:scale-95 transition-transform pointer-events-auto">
          <LogOut size={16} className="text-text-primary hover:text-text-secondary transition-colors" />
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <div className="glass-heavy rounded-full px-5 py-3 flex items-center gap-2 max-w-[92vw]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
              <span className="text-xs text-text-primary text-center">{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 w-full z-20 p-4 md:p-8 pb-8 flex justify-center">
        <div className="glass-heavy rounded-card p-8 w-full max-w-lg shadow-[var(--shadow-lift)]">
          <AnimatePresence mode="wait">

            {/* STATE 1: IDLE / INPUT */}
            {bookingState === 'IDLE' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-border">
                  <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-text-primary">SCHEDULE</h2>
                  <select
                    value={scheduleType}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="bg-transparent text-sm text-text-secondary outline-none appearance-none cursor-pointer"
                  >
                    <option value="On-Demand">On-Demand</option>
                    <option value="Book Ahead">Book Ahead</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <div className="flex gap-4 items-start pb-6 border-b border-border">
                    <div className="w-2 h-2 bg-accent mt-[10px]" />
                    <div className="flex-1 flex flex-col">
                      <span className="text-[10px] text-text-secondary tracking-[0.15em] uppercase mb-1">PICKUP</span>
                      <input
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        className="bg-transparent border-none text-text-primary text-lg font-light outline-none placeholder:text-text-secondary"
                        placeholder="Current Location"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 items-start py-6 border-b border-border mb-6">
                    <div className="w-2 h-2 border border-accent mt-[10px]" />
                    <div className="flex-1 flex flex-col">
                      <span className="text-[10px] text-text-secondary tracking-[0.15em] uppercase mb-1">DESTINATION</span>
                      <input
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="bg-transparent border-none text-text-primary text-lg font-light outline-none placeholder:text-text-secondary"
                        placeholder="Select Destination..."
                      />
                    </div>
                  </div>
                </div>



                <button
                  onClick={handleSeePrices}
                  disabled={isPricing}
                  className="w-full rounded-full bg-accent text-on-accent py-4 font-semibold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
                >
                  {isPricing ? 'Finding your prices…' : 'See prices & choose class'}
                </button>
              </motion.div>
            )}

            {/* STATE 2: TIER SELECTION */}
            {bookingState === 'TIERS' && (
              <motion.div key="tiers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex justify-between items-center mb-5 pb-5 border-b border-border">
                  <button onClick={() => setBookingState('IDLE')} className="text-xs tracking-widest uppercase text-text-secondary hover:text-text-primary transition-colors">← Edit</button>
                  <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-text-primary">Choose your class</h2>
                  {routeInfo && (
                    <span className="text-[11px] tracking-wider uppercase text-text-secondary">{routeInfo.distanceKm} km · {routeInfo.etaMin} min</span>
                  )}
                </div>


                <div className="flex flex-col gap-2 max-h-[44vh] overflow-y-auto -mx-1 px-1">
                  {estimates.map((e) => {
                    const active = e.tier === selectedTier;
                    return (
                      <button
                        key={e.tier}
                        onClick={() => setSelectedTier(e.tier)}
                        className={`text-left w-full flex items-center justify-between gap-4 p-4 border rounded-panel transition-colors ${active ? 'border-accent bg-accent/10' : 'border-border hover:border-border-strong'}`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tracking-wide uppercase text-text-primary">{e.name}</span>
                            <span className="text-[10px] text-text-secondary">· {e.maxPassengers} seats</span>
                          </div>
                          <p className="text-xs text-text-secondary mt-1 truncate">{e.description}</p>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-text-primary whitespace-nowrap">{formatNaira(e.fare)}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleRequestVehicle}
                  className="w-full mt-6 rounded-full bg-accent text-on-accent py-4 font-semibold text-sm hover:bg-accent-hover transition-colors"
                >
                  Request {selectedEstimate?.name || 'Vehicle'}{selectedEstimate ? ` · ${formatNaira(selectedEstimate.fare)}` : ''}
                </button>
              </motion.div>
            )}

            {/* STATE 3: SEARCHING */}
            {bookingState === 'SEARCHING' && (
              <motion.div key="searching" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 border-t-2 border-accent border-r-2 rounded-full animate-spin mb-6" />
                <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-2 text-text-primary">Finding your chauffeur</h3>
                <p className="text-xs text-text-secondary tracking-widest uppercase text-center">Matching you with the nearest Ezyride {selectedEstimate?.name || ''} chauffeur…</p>
                <button onClick={handleCancelRide} className="w-full mt-8 rounded-full border border-border text-text-secondary py-4 font-semibold text-sm hover:bg-surface transition-colors">
                  Cancel Request
                </button>
              </motion.div>
            )}

            {/* STATE 4: LIVE — status-driven journey */}
            {bookingState === 'LIVE' && stage && (
              <motion.div key="live" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-accent">{stage.label}</h3>
                    <span className="text-[10px] tracking-widest uppercase text-text-secondary">{activeRide.tier}</span>
                  </div>
                  <p className="text-sm text-text-secondary">{stage.line}</p>

                  {/* 3-step progress */}
                  <div className="flex items-center gap-1.5 mt-5">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${s <= stage.step ? 'bg-accent' : 'bg-border'}`} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center font-bold text-xl uppercase text-on-accent">
                    {driverInfo?.name?.charAt(0) || '—'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold uppercase tracking-widest text-text-primary">{driverInfo?.name || 'Assigning chauffeur…'}</p>
                    <p className="text-xs text-text-secondary mt-1">Professional Chauffeur</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 mb-6 border-y border-border">
                  <span className="text-xs tracking-widest uppercase text-text-secondary">Fixed fare</span>
                  <span className="text-lg font-bold tracking-tight text-text-primary">{formatNaira(activeRide.fare)}</span>
                </div>

                {canCancel ? (
                  <button onClick={handleCancelRide} className="w-full rounded-full border border-border text-text-secondary py-4 font-semibold text-sm hover:bg-surface hover:text-text-primary transition-colors">
                    Cancel Booking
                  </button>
                ) : (
                  <p className="text-center text-[11px] tracking-widest uppercase text-text-secondary py-2">Enjoy the ride</p>
                )}
              </motion.div>
            )}

            {/* STATE 5: COMPLETED — trip summary */}
            {bookingState === 'COMPLETED' && (
              <motion.div key="completed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-accent mx-auto mb-6 flex items-center justify-center"
                >
                  <Check size={28} className="text-on-accent" strokeWidth={2.5} />
                </motion.div>
                <h3 className="text-lg font-bold tracking-tight text-text-primary mb-1">You’ve arrived</h3>
                <p className="text-sm text-text-secondary mb-6">Thank you for riding with Ezyride.</p>

                <div className="text-left border-y border-border py-5 mb-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-accent mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-text-primary truncate">{pickup || 'Pickup'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 border border-accent mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-text-primary truncate">{destination || 'Destination'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs tracking-widest uppercase text-text-secondary">{activeRide?.tier} · {driverInfo?.name || 'Chauffeur'}</span>
                    <span className="text-lg font-bold tracking-tight text-text-primary">{activeRide ? formatNaira(activeRide.fare) : ''}</span>
                  </div>
                </div>

                <button onClick={resetBooking} className="w-full rounded-full bg-accent text-on-accent py-4 font-semibold text-sm hover:bg-accent-hover transition-colors">
                  Book another ride
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
