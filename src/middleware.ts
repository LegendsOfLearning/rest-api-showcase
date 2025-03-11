import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ENV_CONFIG } from './config/env';

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100     // 100 requests per minute
};

// Rate limiting state
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  const headers = response.headers;
  headers.set('X-DNS-Prefetch-Control', 'off');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'same-origin');
  headers.set('X-XSS-Protection', '1; mode=block');
  
  if (ENV_CONFIG.IS_PRODUCTION) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    headers.set('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://api.smartlittlecookies.com;"
    );
  }

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.ip || 'unknown';
    const now = Date.now();
    
    let clientRequests = requestCounts.get(ip);
    
    // Reset count if window has passed
    if (!clientRequests || now > clientRequests.resetTime) {
      clientRequests = { count: 0, resetTime: now + RATE_LIMIT.windowMs };
    }
    
    // Increment request count
    clientRequests.count++;
    requestCounts.set(ip, clientRequests);
    
    // Check if rate limit exceeded
    if (clientRequests.count > RATE_LIMIT.maxRequests) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Please try again later'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((clientRequests.resetTime - now) / 1000))
          }
        }
      );
    }
    
    // Add rate limit headers
    headers.set('X-RateLimit-Limit', String(RATE_LIMIT.maxRequests));
    headers.set('X-RateLimit-Remaining', String(RATE_LIMIT.maxRequests - clientRequests.count));
    headers.set('X-RateLimit-Reset', String(Math.ceil(clientRequests.resetTime / 1000)));
  }

  // Add auth token to Legends API requests
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const token = request.cookies.get('auth_token')?.value;
    if (token && !request.nextUrl.pathname.startsWith('/api/token')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 