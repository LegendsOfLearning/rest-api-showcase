import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionApiBaseUrl } from '@/lib/server/api-base';
import { SHOWCASE_ENVIRONMENT_COOKIE } from '@/lib/api/environment';

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete('auth_token');
  response.cookies.delete(SHOWCASE_ENVIRONMENT_COOKIE);
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  clearAuthCookies(response);
  return response;
}

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  // Best-effort revoke on server; ignore errors
  if (token) {
    try {
      await fetch(`${await sessionApiBaseUrl()}/v3/oauth2/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        // RFC 7009 token revocation - token is sufficient for confidential clients on our server
        body: new URLSearchParams({ token }).toString(),
        redirect: 'error',
      });
    } catch {
      // swallow – logout continues
    }
  }

  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}
