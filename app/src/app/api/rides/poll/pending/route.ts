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

    // Fetch pending rides
    const pendingRides = await prisma.ride.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // The driver's current location drives nearest-first dispatch.
    const driver = await prisma.user.findUnique({
      where: { id: session.id },
      select: { lat: true, lng: true },
    });

    if (driver?.lat != null && driver?.lng != null) {
      // Haversine distance calculation in JavaScript to avoid PostGIS dependency errors
      const toRad = (value: number) => (value * Math.PI) / 180;
      const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371e3; // Earth radius in meters
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const ridesWithDistance = pendingRides.map(r => ({
        ...r,
        distanceMeters: getDistance(r.pickupLat, r.pickupLng, driver.lat!, driver.lng!),
      }));

      ridesWithDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);
      
      return NextResponse.json(ridesWithDistance.slice(0, take));
    }

    return NextResponse.json(pendingRides.slice(0, take));
  } catch (error) {
    console.error('Poll pending rides API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
