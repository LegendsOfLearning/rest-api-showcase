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

const API_VERSION = process.env.LEGENDS_API_VERSION || 'v3';

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
    const isDev = process.env.NODE_ENV !== 'production';
    const configuredBase = process.env.LEGENDS_API_URL || '';
    const defaultDevBase = 'http://localhost:4000/api';
    const defaultProdBase = 'https://api.smartlittlecookies.com/api';
    // In development, force localhost unless an explicit localhost override is set
    const baseUrl = isDev
      ? (configuredBase && /^(https?:\/\/)(localhost|127\.0\.0\.1)/i.test(configuredBase) ? configuredBase : defaultDevBase)
      : (configuredBase || defaultProdBase);
    const url = `${baseUrl}${apiPath}`;
    
    console.log('[API] Proxying request:', {
      url,
      method: request.method,
      hasToken: !!token,
      pathname,
      apiPath,
      baseUrl,
      envBase: process.env.LEGENDS_API_URL
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

    // Pass-through only: no pre-validation or business logic

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
      const requestId = response.headers.get('x-request-id') || response.headers.get('x-requestid') || undefined;
      const contentType = response.headers.get('content-type') || '';
      let rawText: string | undefined;
      let parsed: unknown = undefined;

      try {
        rawText = await response.text();
        if (contentType.includes('application/json')) {
          try {
            parsed = JSON.parse(rawText || '{}');
          } catch {
            // keep rawText
          }
        }
      } catch {
        // ignore body read errors
      }

      const isRecord = (value: unknown): value is Record<string, unknown> => (
        typeof value === 'object' && value !== null
      );

      let detail: string | undefined = undefined;
      if (isRecord(parsed)) {
        if (typeof parsed.error === 'string') {
          detail = parsed.error;
        } else if (typeof parsed.message === 'string') {
          detail = parsed.message;
        } else if (isRecord(parsed.error) && typeof parsed.error.message === 'string') {
          detail = parsed.error.message;
        }
      }
      // Normalize error structures from various backends to a consistent errors map
      let errors: Record<string, string | string[]> | undefined = undefined;
      if (isRecord(parsed)) {
        const topErrors = parsed.errors as unknown;
        const invalidParamsTop = (parsed as { invalid_params?: unknown }).invalid_params;

        if (topErrors && typeof topErrors === 'object' && !Array.isArray(topErrors)) {
          errors = topErrors as Record<string, string | string[]>;
        } else if (Array.isArray(invalidParamsTop)) {
          // RFC 7807 style invalid_params: [{ name, reason }]
          const map: Record<string, string[]> = {};
          for (const item of invalidParamsTop as unknown[]) {
            const record = (item || {}) as { name?: unknown; reason?: unknown };
            const key = typeof record.name === 'string' ? record.name : 'unknown';
            const reason = typeof record.reason === 'string' ? record.reason : JSON.stringify(record);
            map[key] = map[key] ? [...map[key], reason] : [reason];
          }
          errors = map;
        } else if (Array.isArray(topErrors)) {
          // Some APIs return an array of strings like ["field: message"]
          const map: Record<string, string[]> = {};
          for (const entry of topErrors as unknown[]) {
            if (typeof entry === 'string') {
              const parts = entry.split(':');
              const key = parts.shift()?.trim() || 'error';
              const msg = parts.join(':').trim() || entry;
              map[key] = map[key] ? [...map[key], msg] : [msg];
            } else if (entry && typeof entry === 'object') {
              const rec = entry as Record<string, unknown>;
              const k = String(rec.field ?? rec.name ?? 'error');
              const v = String(rec.message ?? rec.reason ?? JSON.stringify(entry));
              map[k] = map[k] ? [...map[k], v] : [v];
            }
          }
          errors = map;
        } else if (parsed.error && isRecord(parsed.error)) {
          const nested = parsed.error as Record<string, unknown>;
          if (nested.errors && typeof nested.errors === 'object' && !Array.isArray(nested.errors)) {
            errors = nested.errors as Record<string, string | string[]>;
          } else if (Array.isArray((nested as { invalid_params?: unknown }).invalid_params)) {
            const map: Record<string, string[]> = {};
            for (const item of (nested as { invalid_params: unknown[] }).invalid_params) {
              const record = (item || {}) as { name?: unknown; reason?: unknown };
              const key = typeof record.name === 'string' ? record.name : 'unknown';
              const reason = typeof record.reason === 'string' ? record.reason : JSON.stringify(record);
              map[key] = map[key] ? [...map[key], reason] : [reason];
            }
            errors = map;
          } else if (nested.fields && typeof nested.fields === 'object') {
            errors = nested.fields as Record<string, string | string[]>;
          }
        }
      }

      console.error('[API] Request failed:', {
        url,
        status: response.status,
        statusText: response.statusText,
        requestId,
        detail,
        errors,
        raw: rawText
      });

      let code: string | undefined;
      let hint: string | undefined;
      let docsUrl: string | undefined;
      if (isRecord(parsed) && parsed.error && isRecord(parsed.error)) {
        code = typeof parsed.error.code === 'string' ? parsed.error.code : undefined;
        hint = typeof parsed.error.hint === 'string' ? parsed.error.hint : undefined;
        docsUrl = typeof parsed.error.docs_url === 'string' ? parsed.error.docs_url : undefined;
      } else if (isRecord(parsed)) {
        code = typeof parsed.code === 'string' ? parsed.code : undefined;
        hint = typeof parsed.hint === 'string' ? parsed.hint : undefined;
        docsUrl = typeof parsed.docs_url === 'string' ? parsed.docs_url : undefined;
      }

      const body: Record<string, unknown> = {
        error: detail || `API error: ${response.status} ${response.statusText}`,
      };
      if (code) body.code = code;
      if (hint) body.hint = hint;
      if (docsUrl) body.docs_url = docsUrl;
      if (errors) body.errors = errors;
      if (requestId) body.requestId = requestId;
      if (!detail && rawText && !contentType.includes('application/json')) body.raw = rawText;

      const json = NextResponse.json(body, { status: response.status });
      if (requestId) json.headers.set('x-request-id', requestId);
      return json;
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
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    // Include upstream hint when connection fails
    const hint = message.includes('ECONNREFUSED') || message.includes('fetch failed')
      ? 'Upstream API unreachable. In dev, ensure backend is running at http://localhost:4000 and LEGENDS_API_URL is not forcing production.'
      : undefined;
    const body: Record<string, unknown> = { error: message };
    if (hint) body.hint = hint;
    return NextResponse.json(body, { status: 500 });
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