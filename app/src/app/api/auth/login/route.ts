import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth-utils';
import { isRateLimited, recordAttempt, clearLimit, clientIp } from '@/lib/rate-limit';

// Only *failed* logins count toward the limit; a success clears it. This
// throttles brute-force / credential stuffing without ever locking out a user
// who types the right password.
const LOGIN_MAX_FAILURES = 10;
const LOGIN_WINDOW_MS = 15 * 60_000;

export async function POST(req: Request) {
  try {
    const key = `login:${clientIp(req)}`;
    const rl = isRateLimited(key, LOGIN_MAX_FAILURES, LOGIN_WINDOW_MS);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
      recordAttempt(key, LOGIN_WINDOW_MS);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    clearLimit(key); // successful login — good users never accrue

    const token = signToken({ id: user.id, role: user.role });
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login API error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
