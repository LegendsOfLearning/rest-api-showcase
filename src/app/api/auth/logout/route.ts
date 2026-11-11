import { NextResponse } from 'next/server';
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
  // Client-credentials grants can reuse an application's active token. This
  // browser does not own it; revoking it would disconnect other integrations.
  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}
