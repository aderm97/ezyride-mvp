import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "DRIVER") {
      return NextResponse.json({ error: 'Unauthorized. Only drivers can poll for rides.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsedTake = parseInt(searchParams.get('take') || '10', 10);
    const take = Number.isFinite(parsedTake) ? Math.min(Math.max(parsedTake, 1), 50) : 10;

    // The driver's current location drives PostGIS nearest-first dispatch.
    const driver = await prisma.user.findUnique({
      where: { id: session.id },
      select: { lat: true, lng: true },
    });

    if (driver?.lat != null && driver?.lng != null) {
      // Real geospatial ranking: order pending pickups by great-circle distance
      // from the driver using PostGIS geography (ST_Distance). The distance is
      // returned so the UI can surface "N km away".
      const rides = await prisma.$queryRaw`
        SELECT r.*,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(r."pickupLng", r."pickupLat"), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${driver.lng}, ${driver.lat}), 4326)::geography
          ) AS "distanceMeters"
        FROM "Ride" r
        WHERE r.status = 'PENDING'
        ORDER BY "distanceMeters" ASC
        LIMIT ${take}
      `;
      return NextResponse.json(rides);
    }

    // No driver location yet → newest-first fallback.
    const pendingRides = await prisma.ride.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return NextResponse.json(pendingRides);
  } catch (error) {
    console.error('Poll pending rides API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
