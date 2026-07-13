import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-utils';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        driver: { select: { id: true, name: true, lat: true, lng: true } },
        rider: { select: { id: true, name: true, lat: true, lng: true } }
      }
    });

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    // Only the rider or the assigned driver may read a ride.
    if (ride.riderId !== session.id && ride.driverId !== session.id) {
      return NextResponse.json({ error: 'You are not part of this ride' }, { status: 403 });
    }

    return NextResponse.json(ride);
  } catch (error) {
    console.error('Fetch ride API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
