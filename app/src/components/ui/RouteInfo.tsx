'use client';
import { useEffect, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface RouteInfoProps {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  pickupName?: string;
  dropoffName?: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data?.address) {
      const a = data.address;
      const road = a.road || a.pedestrian || a.neighbourhood || '';
      const area = a.suburb || a.city_district || a.town || a.city || '';
      return [road, area].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export function RouteInfo({ pickupLat, pickupLng, dropoffLat, dropoffLng, pickupName, dropoffName }: RouteInfoProps) {
  const [pickup, setPickup] = useState(pickupName || 'Loading...');
  const [dropoff, setDropoff] = useState(dropoffName || 'Loading...');

  useEffect(() => {
    if (!pickupName) {
      reverseGeocode(pickupLat, pickupLng).then(setPickup);
    } else {
      setPickup(pickupName);
    }
  }, [pickupLat, pickupLng, pickupName]);

  useEffect(() => {
    if (!dropoffName) {
      reverseGeocode(dropoffLat, dropoffLng).then(setDropoff);
    } else {
      setDropoff(dropoffName);
    }
  }, [dropoffLat, dropoffLng, dropoffName]);

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-0 relative overflow-hidden">
      {/* Vertical connector line */}
      <div className="absolute left-[27px] top-[28px] bottom-[28px] w-[2px] bg-gradient-to-b from-accent to-accent/20 opacity-50" />

      {/* Pickup */}
      <div className="flex items-start gap-3 py-2 relative z-10">
        <div className="mt-0.5 w-5 h-5 bg-accent/20 border border-accent rounded-full flex items-center justify-center flex-shrink-0">
          <div className="w-2 h-2 bg-accent rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-0.5">Pickup</p>
          <p className="text-sm text-text-primary font-medium truncate">{pickup}</p>
        </div>
      </div>

      {/* Dropoff */}
      <div className="flex items-start gap-3 py-2 relative z-10">
        <div className="mt-0.5 w-5 h-5 bg-accent/20 border border-accent rounded-sm flex items-center justify-center flex-shrink-0 rotate-45">
          <div className="w-2 h-2 bg-accent rounded-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-0.5">Destination</p>
          <p className="text-sm text-text-primary font-medium truncate">{dropoff}</p>
        </div>
      </div>
    </div>
  );
}
