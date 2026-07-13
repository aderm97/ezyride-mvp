import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth-utils';
import { isRateLimited, recordAttempt, clientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // Throttle automated signup abuse / enumeration: 10 / 10 min / IP.
    const key = `register:${clientIp(req)}`;
    const rl = isRateLimited(key, 10, 10 * 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }
    recordAttempt(key, 10 * 60_000);

    const { email, password, name, role: requestedRole, inviteCode } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Riders sign up freely. Chauffeur accounts require a valid invite code
    // (handed out during onboarding) — never open self-service. Fails closed:
    // if DRIVER_INVITE_CODE isn't configured, no one can register as a driver.
    let role = 'RIDER';
    if (requestedRole === 'DRIVER') {
      const expected = process.env.DRIVER_INVITE_CODE;
      if (!expected || inviteCode !== expected) {
        return NextResponse.json(
          { error: 'A valid driver invite code is required to register as a chauffeur.' },
          { status: 403 }
        );
      }
      role = 'DRIVER';
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role },
    });

    // Payload must match what the rest of the app reads (session.id / session.role).
    const token = signToken({ id: user.id, role: user.role });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('Register API error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
