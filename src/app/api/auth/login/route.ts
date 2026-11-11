import { NextResponse } from 'next/server';
import { defaultShowcaseEnvironment, legendsApiBaseUrl } from '@/lib/server/api-base';
import { parseShowcaseEnvironment, SHOWCASE_ENVIRONMENT_COOKIE } from '@/lib/api/environment';

const API_VERSION = process.env.LEGENDS_API_VERSION || 'v3';

export async function POST(request: Request) {
  try {
    const { client_id, client_secret, environment: requestedEnvironment } = await request.json();
    if (typeof client_id !== 'string' || typeof client_secret !== 'string' || !client_id || !client_secret) {
      return NextResponse.json({ message: 'Client ID and Client Secret are required.' }, { status: 400 });
    }
    let environment;
    try { environment = requestedEnvironment === undefined ? defaultShowcaseEnvironment() : parseShowcaseEnvironment(requestedEnvironment); }
    catch { return NextResponse.json({ message: 'Select staging or production before connecting.' }, { status: 400 }); }
    const tokenResponse = await fetch(`${legendsApiBaseUrl(environment)}/${API_VERSION}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id, client_secret }).toString(),
      cache: 'no-store',
      redirect: 'error',
    });
    if (!tokenResponse.ok) {
      return NextResponse.json({ message: `Could not connect to ${environment === 'staging' ? 'staging / test' : 'production'}. Check that these credentials were issued for this environment.` }, { status: tokenResponse.status });
    }
    const tokenData = await tokenResponse.json();
    if (typeof tokenData.access_token !== 'string' || !tokenData.access_token) {
      return NextResponse.json({ message: 'The API did not return an access token.' }, { status: 502 });
    }
    const response = NextResponse.json({ success: true, environment });
    const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, maxAge: 60 * 60, path: '/' };
    response.cookies.set('auth_token', tokenData.access_token, options);
    response.cookies.set(SHOWCASE_ENVIRONMENT_COOKIE, environment, options);
    return response;
  } catch {
    return NextResponse.json({ message: 'Could not reach the selected environment. Try again.' }, { status: 502 });
  }
}
