'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Car, MapPin, User, Navigation2 } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

interface LiveMapProps {
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  status?: string;
}

// Custom SVG Icons converted to Leaflet DivIcons.
// Markers use brand tokens (accent / on-accent) so they invert with the
// theme and stay legible on either the light or dark map tiles.
const createIcon = (iconNode: React.ReactNode, className: string = '') => {
  const html = renderToStaticMarkup(iconNode);
  return L.divIcon({
    html,
    className: `custom-leaflet-icon ${className}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Pickup — solid accent dot in an accent ring
const riderIcon = createIcon(
  <div className="w-8 h-8 rounded-full bg-accent/15 border-2 border-accent flex items-center justify-center shadow-lg backdrop-blur-md">
    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
  </div>
);

// Destination — hollow accent square (distinguished by form, not a second hue)
const destinationIcon = createIcon(
  <div className="w-8 h-8 rounded-none bg-accent/10 border-2 border-accent flex items-center justify-center shadow-lg backdrop-blur-md">
    <div className="w-2 h-2 border border-accent" />
  </div>
);

// Driver puck — accent fill, on-accent icon; generated per render for rotation
const getDriverIcon = (heading: number) => createIcon(
  <div
    className="w-10 h-10 rounded-full bg-accent border border-border flex items-center justify-center shadow-2xl transition-transform duration-300"
    style={{ transform: `rotate(${heading}deg)` }}
  >
    <Navigation2 size={20} className="text-on-accent fill-on-accent -mt-1" />
  </div>
);

// Helper to calculate distance and bearing
function getBearing(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const l1 = lat1 * Math.PI / 180;
  const l2 = lat2 * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(l2);
  const x = Math.cos(l1) * Math.sin(l2) - Math.sin(l1) * Math.cos(l2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// Map Controller for auto-zooming and centering
function MapController({ driverPos, pickup, dropoff, status }: any) {
  const map = useMap();
  useEffect(() => {
    if (!pickup) return;
    const bounds = L.latLngBounds([pickup]);
    if (dropoff && (status === 'IN_PROGRESS' || status === 'PENDING')) bounds.extend(dropoff);
    if (driverPos && status !== 'PENDING') bounds.extend(driverPos);

    map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16, duration: 1.5 });
  }, [driverPos, pickup, dropoff, status, map]);

  return null;
}

export function LiveMap({ pickupLat, pickupLng, dropoffLat, dropoffLng, status }: LiveMapProps) {
  const { resolvedTheme } = useTheme();
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState(0);
  const [eta, setEta] = useState<string>('');

  // Two-tone map: light tiles in the Milk White State, dark tiles in the Deep Blue State.
  const tileUrl = resolvedTheme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const pickup = pickupLat && pickupLng ? [pickupLat, pickupLng] as [number, number] : null;
  const dropoff = dropoffLat && dropoffLng ? [dropoffLat, dropoffLng] as [number, number] : null;

  // SIMULATION ENGINE
  useEffect(() => {
    if (!status || !pickup) return;

    let startPos: [number, number];
    let endPos: [number, number];
    let duration = 30000; // 30 seconds to reach target in simulation

    if (status === 'ACCEPTED') {
      // Simulate driver starting 0.02 degrees away
      startPos = driverPos || [pickup[0] - 0.01, pickup[1] - 0.01];
      endPos = pickup;
      setEta('4 MIN');
    } else if (status === 'ARRIVED') {
      setDriverPos(pickup);
      setEta('ARRIVED');
      return;
    } else if (status === 'IN_PROGRESS' && dropoff) {
      startPos = driverPos || pickup;
      endPos = dropoff;
      duration = 60000; // 1 minute to destination
      setEta('12 MIN');
    } else {
      return;
    }

    const startTime = Date.now();
    const bearing = getBearing(startPos[0], startPos[1], endPos[0], endPos[1]);
    setHeading(bearing);

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Easing function (smooth step)
      const ease = progress * progress * (3 - 2 * progress);

      const currentLat = startPos[0] + (endPos[0] - startPos[0]) * ease;
      const currentLng = startPos[1] + (endPos[1] - startPos[1]) * ease;

      setDriverPos([currentLat, currentLng]);

      // Update ETA text loosely based on progress
      if (status === 'ACCEPTED') {
        const mins = Math.max(1, Math.ceil(4 * (1 - ease)));
        setEta(`${mins} MIN`);
      } else if (status === 'IN_PROGRESS') {
        const mins = Math.max(1, Math.ceil(12 * (1 - ease)));
        setEta(`${mins} MIN`);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [status, pickupLat, pickupLng, dropoffLat, dropoffLng]);

  if (!pickup) {
    return (
      <div className="absolute inset-0 bg-surface w-full h-full z-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-[image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      {/* UI Overlay: ETA */}
      <AnimatePresence>
        {status && ['ACCEPTED', 'IN_PROGRESS'].includes(status) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-28 left-1/2 -translate-x-1/2 z-[400] flex flex-col items-center pointer-events-none"
          >
            <div className="glass-heavy px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-text-primary font-bold tracking-widest text-sm uppercase">{status === 'ACCEPTED' ? 'PICKUP IN' : 'DROPOFF IN'} {eta}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MapContainer
        center={pickup}
        zoom={14}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full bg-background"
      >
        <TileLayer
          key={resolvedTheme}
          url={tileUrl}
        />

        <MapController driverPos={driverPos} pickup={pickup} dropoff={dropoff} status={status} />

        {/* Pickup Marker */}
        <Marker position={pickup} icon={riderIcon} />

        {/* Dropoff Marker */}
        {dropoff && <Marker position={dropoff} icon={destinationIcon} />}

        {/* Driver Marker */}
        {driverPos && (status === 'ACCEPTED' || status === 'ARRIVED' || status === 'IN_PROGRESS') && (
          <Marker position={driverPos} icon={getDriverIcon(heading)} zIndexOffset={1000} />
        )}
      </MapContainer>

      {/* Aesthetic Overlays — fade the map into the brand canvas */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50 pointer-events-none z-[400]" />
      {/* Two-tone grid texture — border-tinted lines that flip with the theme */}
      <div className="absolute inset-0 bg-[image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60 pointer-events-none z-[400]" />
    </div>
  );
}
