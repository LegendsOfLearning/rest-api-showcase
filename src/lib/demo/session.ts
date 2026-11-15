import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
export type DemoSession = { id: string; expires: number; preset?: string; assignment?: number };
const lifetime = 60 * 60 * 1000;
function secret() { const key = process.env.FLUENCY_DEMO_SESSION_SECRET; if (!key || key.length < 32) throw new Error('Demo unavailable'); return key; }
export function newSession(): DemoSession { return { id: randomUUID(), expires: Date.now() + lifetime }; }
export function signSession(session: DemoSession): string {
  const value = Buffer.from(JSON.stringify(session)).toString('base64url');
  return value + '.' + createHmac('sha256', secret()).update(value).digest('base64url');
}
export function readSession(value?: string): DemoSession | null {
  if (!value || value.length > 2048) return null;
  try {
    const [body, signature, extra] = value.split('.');
    if (!body || !signature || extra) return null;
    const expected = createHmac('sha256', secret()).update(body).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const s = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!/^[a-f0-9-]{36}$/.test(s.id) || !Number.isFinite(s.expires) || s.expires < Date.now() || s.expires > Date.now() + lifetime || (s.assignment !== undefined && (!Number.isSafeInteger(s.assignment) || s.assignment < 1))) return null;
    return s;
  } catch { return null; }
}
