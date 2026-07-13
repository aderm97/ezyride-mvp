import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // Scope strictly to the caller — a user only ever sees their own rides.
    // The riderId/driverId query params are ignored (they were an IDOR vector).
    const where: any =
      session.role === 'DRIVER' ? { driverId: session.id } : { riderId: session.id };
    if (status) where.status = status;

    const rides = await prisma.ride.findMany({
      where,
      include: {
        rider: { select: { id: true, name: true, lat: true, lng: true } },
        driver: { select: { id: true, name: true, lat: true, lng: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rides);
  } catch (error) {
    console.error('Fetch rides API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
