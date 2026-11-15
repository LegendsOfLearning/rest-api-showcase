const base = 'https://api.legendsoflearning.com/api/v3';
let cached: { token: string; expires: number } | undefined;
export class DemoApiError extends Error { constructor(public status: number) { super('The demo API could not complete this step. Please retry.'); } }
export async function demoApi(path: string, body?: unknown, idempotencyKey?: string): Promise<Record<string, unknown>> {
  if (!process.env.FLUENCY_DEMO_CLIENT_ID || !process.env.FLUENCY_DEMO_CLIENT_SECRET || !process.env.FLUENCY_DEMO_APPLICATION_ID) throw new Error('Demo unavailable');
  if (!cached || cached.expires < Date.now()) {
    const response = await fetch(base + '/oauth2/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.FLUENCY_DEMO_CLIENT_ID, client_secret: process.env.FLUENCY_DEMO_CLIENT_SECRET }), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new DemoApiError(response.status);
    const auth = await response.json();
    if (typeof auth.access_token !== 'string') throw new DemoApiError(502);
    const check = await fetch(base + '/applications/me', { headers: { Authorization: `Bearer ${auth.access_token}` }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!check.ok || String((await check.json()).id) !== process.env.FLUENCY_DEMO_APPLICATION_ID) throw new DemoApiError(502);
    cached = { token: auth.access_token, expires: Date.now() + Math.min(Number(auth.expires_in) || 300, 300) * 1000 - 10000 };
  }
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${cached.token}`, 'Content-Type': 'application/json', ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!response.ok) { if (response.status === 401) cached = undefined; throw new DemoApiError(response.status); }
  return response.json();
}
