import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-utils';
import { FLEET_TIERS, haversineKm, fareForTier, etaMinutes, isTierId } from '@/lib/fleet';
import { airportSurcharge } from '@/lib/airports';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pickupLat, pickupLng, dropoffLat, dropoffLng, tier, airportCode } = await req.json();

    // Validate as finite numbers — a valid coordinate of 0 must not be rejected.
    if ([pickupLat, pickupLng, dropoffLat, dropoffLng].some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
      return NextResponse.json({ error: 'Missing or invalid coordinates' }, { status: 400 });
    }

    const distanceKm = Math.round(haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng) * 10) / 10;
    const etaMin = etaMinutes(distanceKm);
    const surcharge = airportSurcharge(airportCode);

    // Fixed, all-in fare in whole Naira (incl. any airport surcharge) per tier.
    const estimates = FLEET_TIERS.map((t) => ({
      tier: t.id,
      name: t.name,
      description: t.description,
      maxPassengers: t.maxPassengers,
      luggage: t.luggage,
      exampleVehicles: t.exampleVehicles,
      fare: Math.round(fareForTier(t.id, distanceKm) + surcharge),
    }));

    // Backwards-compatible single-fare field when a specific tier is requested.
    const estimatedFare = isTierId(tier)
      ? Math.round(fareForTier(tier, distanceKm) + surcharge)
      : estimates[0].fare;

    return NextResponse.json({ distanceKm, etaMin, airportSurcharge: surcharge, estimates, estimatedFare });
  } catch (error) {
    console.error('Ride estimate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
