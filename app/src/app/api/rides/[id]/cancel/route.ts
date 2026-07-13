import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-utils';


export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const ride = await prisma.ride.findUnique({ where: { id } });

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    const isRider = ride.riderId === session.id;
    const isDriver = ride.driverId === session.id;

    if (!isRider && !isDriver) {
      return NextResponse.json({ error: 'You are not part of this ride' }, { status: 403 });
    }

    const riderCancellable: string[] = ["PENDING", "ACCEPTED", "ARRIVED"];
    const driverCancellable: string[] = ["ACCEPTED", "ARRIVED"];

    const allowed = isRider ? riderCancellable : driverCancellable;

    if (!allowed.includes(ride.status)) {
      return NextResponse.json({ error: `Cannot cancel a ride with status: ${ride.status}` }, { status: 400 });
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: { status: "CANCELED" },
    });

    return NextResponse.json(updatedRide);
  } catch (error) {
    console.error('Cancel ride API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
