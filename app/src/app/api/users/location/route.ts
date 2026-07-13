import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-utils';


export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lat, lng, isActive } = await req.json();

    const dataToUpdate: any = {};
    if (lat !== undefined) dataToUpdate.lat = lat;
    if (lng !== undefined) dataToUpdate.lng = lng;
    if (isActive !== undefined && session.role === "DRIVER") {
      dataToUpdate.isActive = isActive;
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: dataToUpdate,
      select: {
        id: true,
        role: true,
        lat: true,
        lng: true,
        isActive: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
