import { NextResponse } from 'next/server';
import { FLEET_TIERS } from '@/lib/fleet';

// Public catalog of the five EV tiers. Drives the rider tier selector.
export async function GET() {
  return NextResponse.json(FLEET_TIERS);
}
