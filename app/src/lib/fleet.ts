// Ezyride fleet catalog + fare logic — single source of truth shared by the
// /api/fleet/tiers, /api/rides/estimate and /api/rides/request routes.
// Fares are in whole Nigerian Naira (NGN), matching Ride.fare (Float) and the
// "From ₦X" pricing shown on the landing page. Fair, distance-based model:
// fare = baseFare + perKm × distance (+ any airport surcharge).

export type TierId = 'economy' | 'standard' | 'executive' | 'luxury' | 'suv';

export interface FleetTier {
  id: TierId;
  name: string;
  description: string;
  maxPassengers: number;
  luggage: string;
  exampleVehicles: string[];
  baseFare: number; // NGN — starting price (the "From" figure)
  perKm: number;    // NGN per kilometre
}

export const FLEET_TIERS: FleetTier[] = [
  {
    id: 'economy',
    name: 'Economy',
    description: 'Smart, quiet city EVs for solo travellers and light luggage.',
    maxPassengers: 3,
    luggage: '2 cabin bags',
    exampleVehicles: ['Renault 5 E-Tech', 'MG4'],
    baseFare: 8000,
    perKm: 200,
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Spacious long-range sedans. Our most popular class.',
    maxPassengers: 4,
    luggage: '2 large + 2 cabin',
    exampleVehicles: ['Tesla Model 3', 'BYD Seal'],
    baseFare: 12000,
    perKm: 300,
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Business-class comfort with corporate-trained chauffeurs.',
    maxPassengers: 4,
    luggage: '3 large + 2 cabin',
    exampleVehicles: ['Tesla Model S', 'BMW i5'],
    baseFare: 22000,
    perKm: 450,
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Flagship EVs with reclining rear seats and white-glove service.',
    maxPassengers: 3,
    luggage: '3 large + 2 cabin',
    exampleVehicles: ['Mercedes EQS', 'Porsche Taycan'],
    baseFare: 40000,
    perKm: 700,
  },
  {
    id: 'suv',
    name: 'Premium SUV',
    description: 'Seven seats and cavernous luggage for families and groups.',
    maxPassengers: 6,
    luggage: '5 large + 4 cabin',
    exampleVehicles: ['Kia EV9', 'Volvo EX90'],
    baseFare: 30000,
    perKm: 550,
  },
];

export const DEFAULT_TIER: TierId = 'standard';

export function isTierId(value: unknown): value is TierId {
  return typeof value === 'string' && FLEET_TIERS.some((t) => t.id === value);
}

export function getTier(id: string): FleetTier | undefined {
  return FLEET_TIERS.find((t) => t.id === id);
}

/** Great-circle distance in kilometres. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Fixed, all-in fare (whole Naira) for a tier over a given distance. */
export function fareForTier(tierId: TierId, distanceKm: number): number {
  const tier = getTier(tierId);
  if (!tier) return 0;
  return Math.round(tier.baseFare + tier.perKm * distanceKm);
}

/** A simple ETA estimate in minutes for the given distance. */
export function etaMinutes(distanceKm: number): number {
  return Math.max(8, Math.round(distanceKm * 1.6));
}

/** Format a Naira amount for display, e.g. 12460 → "₦12,460". */
export function formatNaira(amount: number): string {
  return '₦' + Math.round(amount).toLocaleString('en-NG');
}
