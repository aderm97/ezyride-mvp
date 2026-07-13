'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import dynamic from 'next/dynamic';
const LiveMap = dynamic(() => import('@/components/ui/LiveMap').then(m => m.LiveMap), { ssr: false, loading: () => <div className="absolute inset-0 bg-background" /> });
import { fetchApi } from '@/lib/api';
import { formatNaira } from '@/lib/fleet';
import { LogOut, MapPin, Power, Map as MapIcon, CheckCircle, Navigation, XCircle } from 'lucide-react';
import { RouteInfo } from '@/components/ui/RouteInfo';

export default function DriverPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [pendingRides, setPendingRides] = useState<any[]>([]);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadDriverData(); }, []);

  const loadDriverData = async () => {
    try {
      const userData = await fetchApi('/users/me');
      if (userData.role !== 'DRIVER') { router.push('/login'); return; }
      setUser(userData);
      setIsOnline(userData.isActive);

      try {
        const myActive = await fetchApi(`/rides?driverId=${userData.id}`);
        const current = myActive.find((r: any) => ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status));
        if (current) setActiveRide(current);
      } catch (e) { }

      setIsLoading(false);
    } catch { router.push('/login'); }
  };

  const toggleStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    // Send the driver's live position when going online so the backend can
    // rank pending pickups by real distance (PostGIS nearest-first dispatch).
    const send = (loc?: { lat: number; lng: number }) =>
      fetchApi('/users/location', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: newStatus, ...(loc || {}) }),
      }).catch(() => setIsOnline(!newStatus));

    if (newStatus && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => send({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => send(),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      send();
    }
  };

  const pollRides = async () => {
    if (!isOnline || activeRide) return;
    try {
      const rides = await fetchApi('/rides/poll/pending');
      setPendingRides(rides);
    } catch(e) {}
  };

  const pollActiveRide = async () => {
     if (!activeRide) return;
     try {
       const ride = await fetchApi(`/rides/${activeRide.id}`);
       setActiveRide(ride);
       if (ride.status === 'COMPLETED') { setTimeout(() => setActiveRide(null), 3000); }
     } catch(e) {}
  };

  useEffect(() => {
    const p1 = setInterval(pollRides, 3000);
    const p2 = setInterval(pollActiveRide, 2000);
    return () => { clearInterval(p1); clearInterval(p2); };
  }, [isOnline, activeRide]);

  const handleAccept = async (id: string) => {
    try {
      const data = await fetchApi(`/rides/${id}/accept`, { method: 'PATCH' });
      setActiveRide(data);
    } catch(err: any) { alert(err.message); }
  };

  const advanceStatus = async (status: string) => {
    try {
      const data = await fetchApi(`/rides/${activeRide.id}/status`, { 
        method: 'PATCH', body: JSON.stringify({ status })
      });
      setActiveRide(data);
    } catch(e) {}
  };

  const handleCancelRide = async () => {
    if (!activeRide) return;
    try {
      await fetchApi(`/rides/${activeRide.id}/cancel`, { method: 'PATCH' });
      setActiveRide(null);
    } catch (error: any) {
      alert(error.message || 'Failed to cancel ride');
    }
  };

  if (isLoading) return <div suppressHydrationWarning className="h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-t-2 border-text-primary animate-spin"/></div>;

  return (
    <div suppressHydrationWarning className="h-screen bg-background text-text-primary relative flex flex-col overflow-hidden font-body">
      <LiveMap 
        pickupLat={activeRide ? activeRide.pickupLat : pendingRides[0]?.pickupLat} 
        pickupLng={activeRide ? activeRide.pickupLng : pendingRides[0]?.pickupLng} 
        dropoffLat={activeRide ? activeRide.dropoffLat : pendingRides[0]?.dropoffLat}
        dropoffLng={activeRide ? activeRide.dropoffLng : pendingRides[0]?.dropoffLng}
        status={activeRide?.status} 
      />

      {/* Driver Header */}
      <div className="absolute top-0 w-full p-4 md:p-8 z-20 flex justify-between items-center pointer-events-none">
        <div className="glass-panel px-6 py-3 rounded-full flex gap-4 items-center border-border pointer-events-auto">
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${isOnline ? 'bg-text-primary' : 'bg-surface border border-border'}`} />
            <span className="font-semibold tracking-widest uppercase text-xs">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }} className="w-12 h-12 rounded-full glass-panel flex items-center justify-center active:scale-95 transition-transform pointer-events-auto border-border">
          <LogOut size={16} className="text-text-primary hover:text-text-secondary transition-colors" />
        </button>
      </div>

      <div className="absolute bottom-0 w-full z-20 p-4 pb-8 md:p-8 flex flex-col items-center">
        {!activeRide ? (
          <AnimatePresence mode="wait">
             {!isOnline ? (
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="flex flex-col items-center gap-8">
                 <button 
                  onClick={toggleStatus}
                  className="w-32 h-32 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-hover active:scale-95 transition-all duration-300"
                 >
                   <Power size={32} className="text-text-primary" />
                 </button>
                 <span className="font-light tracking-wider text-xl uppercase text-text-secondary">Initiate Shift</span>
               </motion.div>
             ) : (
               <div className="w-full max-w-lg flex flex-col gap-4">
                 {pendingRides.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-10 glass-heavy rounded-card text-center">
                      <div className="w-16 h-16 mx-auto rounded-panel bg-surface flex items-center justify-center mb-8 border border-border">
                        <MapIcon className="text-text-secondary" size={24} />
                      </div>
                      <h3 className="text-2xl font-light text-text-primary mb-2">Awaiting Assignment</h3>
                      <p className="text-text-secondary text-sm font-light">Monitoring local area for requests.</p>
                      <Button variant="outline" className="mt-10 mx-auto w-full py-4 uppercase tracking-widest text-xs" onClick={toggleStatus}>Go Offline</Button>
                    </motion.div>
                 ) : (
                   pendingRides.map(ride => (
                     <motion.div key={ride.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-heavy p-8 border border-border hover:border-text-primary transition-colors rounded-card">
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-[10px] uppercase tracking-widest text-text-primary font-semibold flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-text-primary animate-pulse" /> Dispatch · {ride.tier || 'standard'}
                          </span>
                          <span className="text-3xl font-light tracking-tight">{formatNaira(ride.fare)}</span>
                        </div>

                        {ride.airportCode && (
                          <div className="mb-4 flex items-center gap-2 text-[10px] tracking-widest uppercase text-text-secondary">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                            {ride.airportCode}{ride.terminal ? ' ' + ride.terminal : ''} airport transfer
                          </div>
                        )}

                        <RouteInfo
                          pickupLat={ride.pickupLat}
                          pickupLng={ride.pickupLng}
                          dropoffLat={ride.dropoffLat}
                          dropoffLng={ride.dropoffLng}
                        />
                        <Button className="w-full mt-8 py-5 uppercase tracking-widest text-xs" variant="primary" onClick={() => handleAccept(ride.id)}>
                          Accept Assignment
                        </Button>
                     </motion.div>
                   ))
                 )}
               </div>
             )}
          </AnimatePresence>
        ) : (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }} className="w-full max-w-lg glass-heavy p-8 border border-border rounded-card">
             <div className="flex justify-between items-center mb-8 border-b border-border pb-6">
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-light">Active Assignment</span>
                  <span className="text-[10px] tracking-widest uppercase text-text-secondary">{activeRide.tier || 'standard'} · {formatNaira(activeRide.fare)}</span>
                </div>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-text-secondary">{activeRide.status.replace('_', ' ')}</span>
             </div>

             {activeRide.airportCode && (
               <div className="mb-4 flex items-center gap-2 text-[10px] tracking-widest uppercase text-text-secondary">
                 <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                 {activeRide.airportCode}{activeRide.terminal ? ' ' + activeRide.terminal : ''} airport transfer
               </div>
             )}

             <RouteInfo
               pickupLat={activeRide.pickupLat}
               pickupLng={activeRide.pickupLng}
               dropoffLat={activeRide.dropoffLat}
               dropoffLng={activeRide.dropoffLng}
             />

             <div className="flex flex-col gap-4 mt-8">
                {activeRide.status === 'ACCEPTED' && (
                  <Button className="w-full py-5 uppercase tracking-widest text-xs" variant="primary" onClick={() => advanceStatus('ARRIVED')}>
                     Confirm Arrival
                  </Button>
                )}
                {activeRide.status === 'ARRIVED' && (
                  <Button className="w-full py-5 uppercase tracking-widest text-xs" variant="primary" onClick={() => advanceStatus('IN_PROGRESS')}>
                     Commence Journey
                  </Button>
                )}
                {activeRide.status === 'IN_PROGRESS' && (
                  <Button className="w-full py-5 bg-text-primary text-background uppercase tracking-widest text-xs font-semibold hover:bg-text-secondary" variant="primary" onClick={() => advanceStatus('COMPLETED')}>
                     Conclude Journey
                  </Button>
                )}
                {activeRide.status === 'COMPLETED' && (
                  <div className="p-6 rounded-panel bg-surface border border-border text-center">
                     <span className="text-lg font-light text-text-primary block mb-2">Assignment Concluded</span>
                     <span className="text-text-primary font-semibold text-2xl">{formatNaira(activeRide.fare)}</span>
                  </div>
                )}
                {activeRide.status === 'CANCELED' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-panel bg-surface border border-border text-center"
                  >
                    <span className="text-lg font-light text-text-secondary">Assignment Cancelled</span>
                  </motion.div>
                )}
                {activeRide.status !== 'COMPLETED' && activeRide.status !== 'CANCELED' && activeRide.status !== 'IN_PROGRESS' && (
                  <button
                    onClick={handleCancelRide}
                    className="w-full mt-4 rounded-full py-4 border border-border text-text-secondary hover:text-text-primary font-semibold text-xs uppercase tracking-widest transition-all"
                  >
                     Abort Assignment
                  </button>
                )}
             </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
