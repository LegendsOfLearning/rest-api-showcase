import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete('auth_token');
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
      await fetch(API_ENDPOINTS.TOKEN_REVOKE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        // RFC 7009 token revocation - token is sufficient for confidential clients on our server
        body: new URLSearchParams({ token }).toString(),
      });
    } catch {
      // swallow – logout continues
    }
  }

  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}
