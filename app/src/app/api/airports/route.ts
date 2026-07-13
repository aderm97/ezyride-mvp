import { NextResponse } from 'next/server';
import { AIRPORTS } from '@/lib/airports';

// Public catalog of supported airports + terminals.
export async function GET() {
  return NextResponse.json(AIRPORTS);
}
