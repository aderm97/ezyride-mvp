import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-utils';


export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "DRIVER") {
      return NextResponse.json({ error: 'Unauthorized. Only drivers can accept rides.' }, { status: 401 });
    }

    const { id } = await params;

    const ride = await prisma.ride.findUnique({ where: { id } });

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    if (ride.status !== "PENDING") {
      return NextResponse.json({ error: 'Ride is no longer available' }, { status: 400 });
    }

    // Atomic update to avoid race conditions
    const updatedRideCount = await prisma.ride.updateMany({
      where: {
        id,
        status: "PENDING",
      },
      data: {
        driverId: session.id,
        status: "ACCEPTED",
      },
    });

    if (updatedRideCount.count === 0) {
       return NextResponse.json({ error: 'Ride is no longer available' }, { status: 400 });
    }

    const finalRide = await prisma.ride.findUnique({ where: { id } });
    return NextResponse.json(finalRide);
  } catch (error) {
    console.error('Accept ride API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
