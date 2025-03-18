/**
 * Legends API Route Handler
 * 
 * URL Handling:
 * 1. Frontend makes requests to /api/{endpoint}
 * 2. This handler:
 *    - Strips /api/ prefix
 *    - Adds /v3/ prefix
 *    - Forwards to ${LEGENDS_API_URL}/v3/{endpoint}
 * 
 * Example:
 * 1. Frontend: GET /api/users
 * 2. Handler strips: users
 * 3. Handler forwards to: ${LEGENDS_API_URL}/v3/users
 * 
 * @see src/lib/api/endpoints.ts for all available endpoints
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const TOKEN_COOKIE = 'legends_token';
const TOKEN_EXPIRY = 7200; // 2 hours
const API_VERSION = 'v3';

async function getNewToken(): Promise<string> {
  // LEGENDS_API_URL already includes /api
  const tokenUrl = `${process.env.LEGENDS_API_URL}/${API_VERSION}/oauth2/token`;
  console.log('[Auth] Requesting new token');
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.LEGENDS_API_KEY || '',
      client_secret: process.env.LEGENDS_API_SECRET || '',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Auth] Token request failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Store token in cookie
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY
  });

  return data.access_token;
}

async function proxyRequest(request: NextRequest, retried = false): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE)?.value;
    
    // Remove /api prefix and ensure /v3 prefix
    const pathname = request.nextUrl.pathname.replace(/^\/api\//, '');
    const url = `${process.env.LEGENDS_API_URL}/v3/${pathname}`;
    
    console.log('[API] Proxying request:', {
      url,
      method: request.method,
      hasToken: !!token,
      pathname
    });

    const response = await fetch(url, {
      method: request.method,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    // If unauthorized and not retried yet, get new token and retry once
    if (response.status === 401 && !retried) {
      console.log('[API] Unauthorized, getting new token...');
      await getNewToken();
      return proxyRequest(request, true);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Request failed:', {
        url,
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
} 