import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-utils';
import { DEFAULT_TIER, isTierId, haversineKm, fareForTier } from '@/lib/fleet';
import { airportSurcharge, getAirport } from '@/lib/airports';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "RIDER") {
      return NextResponse.json({ error: 'Unauthorized. Only riders can request rides.' }, { status: 401 });
    }

    const { pickupLat, pickupLng, dropoffLat, dropoffLng, tier, airportCode, terminal } = await req.json();

    // Validate as finite numbers — a valid coordinate of 0 (equator/prime
    // meridian) must not be rejected as "missing".
    if ([pickupLat, pickupLng, dropoffLat, dropoffLng].some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
      return NextResponse.json({ error: 'Missing or invalid coordinates' }, { status: 400 });
    }

    // Never trust a client-supplied fare — derive it from the chosen tier +
    // distance (+ airport surcharge). Round distance the same way /estimate does
    // so the quoted price is exactly the charged price.
    const selectedTier = isTierId(tier) ? tier : DEFAULT_TIER;
    const airport = getAirport(airportCode);
    const distanceKm = Math.round(haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng) * 10) / 10;
    const fare = Math.round(fareForTier(selectedTier, distanceKm) + airportSurcharge(airportCode));

    const existingRide = await prisma.ride.findFirst({
      where: {
        riderId: session.id,
        status: { in: ["PENDING", "ACCEPTED", "ARRIVED", "IN_PROGRESS"] },
      },
    });

    if (existingRide) {
      return NextResponse.json({ error: 'You already have an active ride' }, { status: 400 });
    }

    const ride = await prisma.ride.create({
      data: {
        riderId: session.id,
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        tier: selectedTier,
        airportCode: airport ? airport.code : null,
        terminal: airport && terminal ? terminal : null,
        fare,
        status: "PENDING",
      },
    });

    return NextResponse.json(ride, { status: 201 });
  } catch (error) {
    console.error('Ride request API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
