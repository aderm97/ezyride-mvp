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
      return NextResponse.json({ error: 'Unauthorized. Only drivers can update ride status.' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    const ride = await prisma.ride.findUnique({ where: { id } });

    if (!ride || ride.driverId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const validTransitions: Record<string, string[]> = {
      ["ACCEPTED"]: ["ARRIVED", "CANCELED"],
      ["ARRIVED"]: ["IN_PROGRESS", "CANCELED"],
      ["IN_PROGRESS"]: ["COMPLETED"],
    };

    const allowedNext = validTransitions[ride.status];
    if (!allowedNext || !allowedNext.includes(status)) {
      return NextResponse.json({ error: `Invalid status transition from ${ride.status} to ${status}` }, { status: 400 });
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedRide);
  } catch (error) {
    console.error('Update ride status API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
