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

const API_VERSION = 'v3';

async function proxyRequest(request: NextRequest): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    // Remove /api prefix and ensure /v3 prefix
    const pathname = request.nextUrl.pathname.replace(/^\/api\//, '');
    const apiPath = `/${API_VERSION}/${pathname}`;
    const url = `${process.env.LEGENDS_API_URL}${apiPath}`;
    
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

    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
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