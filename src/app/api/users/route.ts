import { NextRequest, NextResponse } from 'next/server';
import { validateAuth, makeApiRequest } from '../utils/apiHelpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookie
    const authHeader = validateAuth(request);
    if (authHeader instanceof NextResponse) {
      return authHeader;
    }

    // Get query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Make the API request using the helper
    return makeApiRequest({
      path: 'users',
      method: 'GET',
      params: searchParams,
      authHeader
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookie
    const authHeader = validateAuth(request);
    if (authHeader instanceof NextResponse) {
      return authHeader;
    }

    // Get request body
    const body = await request.json();
    
    // Make the API request using the helper
    return makeApiRequest({
      path: 'users',
      method: 'POST',
      body,
      authHeader
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 