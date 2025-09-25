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
    const search = request.nextUrl.search || '';
    const apiPath = pathname.startsWith('v3/')
      ? `/${pathname}${search}`
      : `/${API_VERSION}/${pathname}${search}`;
    const url = `${process.env.LEGENDS_API_URL}${apiPath}`;
    
    console.log('[API] Proxying request:', {
      url,
      method: request.method,
      hasToken: !!token,
      pathname,
      apiPath
    });

    // Build headers by preserving incoming ones (except Cookie), override Authorization
    const outgoingHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'cookie') return;
      outgoingHeaders[key] = value;
    });
    outgoingHeaders['Authorization'] = token ? `Bearer ${token}` : '';
    // Ensure Accept JSON by default, but do not clobber explicit header
    if (!outgoingHeaders['Accept'] && !outgoingHeaders['accept']) {
      outgoingHeaders['Accept'] = 'application/json';
    }

    // Propagate Idempotency-Key if present (case-insensitive)
    const idempotencyKey = request.headers.get('Idempotency-Key') || request.headers.get('idempotency-key');
    if (idempotencyKey) {
      outgoingHeaders['Idempotency-Key'] = idempotencyKey;
    }

    // Only attach body for methods that can have one
    const method = request.method.toUpperCase();
    const hasBody = !['GET', 'HEAD'].includes(method);
    const body = hasBody ? await request.text() : undefined;

    const response = await fetch(url, {
      method,
      headers: outgoingHeaders,
      body,
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

    const contentType = response.headers.get('content-type') || '';
    if (response.status === 204) {
      return NextResponse.json({}, { status: 204 });
    }
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { 'content-type': contentType || 'text/plain' }
    });

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

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return proxyRequest(request);
}

export async function HEAD(request: NextRequest) {
  return proxyRequest(request);
}