// Ezyride supported airports — pickup metadata + fixed pickup surcharge.
// Shared by /api/airports, /api/rides/estimate and /api/rides/request.

export interface Airport {
  code: string;        // IATA
  name: string;
  city: string;
  lat: number;
  lng: number;
  terminals: string[];
  pickupSurcharge: number; // NGN, added to the fare for airport pickups
}

export const AIRPORTS: Airport[] = [
  {
    code: 'LHR',
    name: 'London Heathrow',
    city: 'London',
    lat: 51.4700,
    lng: -0.4543,
    terminals: ['T2', 'T3', 'T4', 'T5'],
    pickupSurcharge: 6000,
  },
  {
    code: 'LOS',
    name: 'Murtala Muhammed International',
    city: 'Lagos',
    lat: 6.5774,
    lng: 3.3213,
    terminals: ['T1', 'T2'],
    pickupSurcharge: 3500,
  },
  {
    code: 'DXB',
    name: 'Dubai International',
    city: 'Dubai',
    lat: 25.2532,
    lng: 55.3657,
    terminals: ['T1', 'T2', 'T3'],
    pickupSurcharge: 5000,
  },
];

export function getAirport(code?: string | null): Airport | undefined {
  if (!code) return undefined;
  return AIRPORTS.find((a) => a.code === code);
}

export function airportSurcharge(code?: string | null): number {
  return getAirport(code)?.pickupSurcharge ?? 0;
}
