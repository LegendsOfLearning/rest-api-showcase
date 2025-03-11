import { NextRequest, NextResponse } from 'next/server';
import { validateAuthHeader, makeApiRequest, transformContentParams } from '../utils/apiHelpers';
import { Method } from 'axios';

// Valid HTTP methods
const VALID_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;
type HttpMethod = typeof VALID_METHODS[number];

// Common handler for all request methods
async function handleRequest(
  request: NextRequest,
  segments: string[],
  method: HttpMethod
) {
  try {
    // Validate auth header
    const authHeader = validateAuthHeader(request);
    if (authHeader instanceof NextResponse) {
      return authHeader;
    }

    // Get the path segments
    const path = segments.join('/');
    
    // Get query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Transform parameters for content endpoint if needed
    const params = path === 'content' 
      ? transformContentParams(searchParams)
      : searchParams;

    // Log request details for debugging
    if (path === 'users' || path === 'content') {
      console.log(`Processing ${method} request to /${path} endpoint`);
      console.log(`Request parameters: ${JSON.stringify(Object.fromEntries(params))}`);
    }

    // Get request body for POST/PUT methods
    let body = null;
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await request.json();
        if (path === 'users') {
          console.log(`Request body: ${JSON.stringify(body)}`);
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    }

    // Make the API request
    return makeApiRequest({
      path,
      method: method as Method,
      body,
      params,
      authHeader
    });
  } catch (error) {
    console.error('Request handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handler for GET requests
export async function GET(
  request: NextRequest,
  { params }: { params: { legends: string[] } }
) {
  return handleRequest(request, params.legends, 'GET');
}

// Handler for POST requests
export async function POST(
  request: NextRequest,
  { params }: { params: { legends: string[] } }
) {
  return handleRequest(request, params.legends, 'POST');
}

// Handler for PUT requests
export async function PUT(
  request: NextRequest,
  { params }: { params: { legends: string[] } }
) {
  return handleRequest(request, params.legends, 'PUT');
}

// Handler for DELETE requests
export async function DELETE(
  request: NextRequest,
  { params }: { params: { legends: string[] } }
) {
  return handleRequest(request, params.legends, 'DELETE');
} 