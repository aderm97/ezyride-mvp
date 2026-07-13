import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

// Fail closed: never fall back to a hardcoded secret. Resolved lazily so a
// missing env var surfaces at request time (401/500) rather than baking an
// insecure default into the build.
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET env var is required and must be at least 16 chars');
  }
  return secret;
}

export interface SessionUser {
  id: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export function signToken(payload: SessionUser): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded !== 'object' || decoded === null) return null;
    const { id, role } = decoded as Record<string, unknown>;
    if (typeof id !== 'string' || typeof role !== 'string') return null;
    return { id, role };
  } catch {
    return null;
  }
}

/** Returns a validated {id, role} session, or null. Never returns a partial. */
export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}
