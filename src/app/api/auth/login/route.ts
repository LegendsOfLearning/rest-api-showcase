import { NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export async function POST(request: Request) {
  try {
    const { client_id, client_secret } = await request.json();

    if (!client_id || !client_secret) {
      return NextResponse.json(
        { message: 'Client ID and Client Secret are required' },
        { status: 400 }
      );
    }

    // Get OAuth token using provided credentials
    const tokenResponse = await fetch(API_ENDPOINTS.TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id,
        client_secret,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({}));
      console.error('Token error response:', await tokenResponse.text().catch(() => 'Could not get response text'));
      return NextResponse.json(
        { message: error.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Create response with success message
    const response = NextResponse.json({ success: true });

    // Set the auth cookie with the token
    response.cookies.set('auth_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Failed to authenticate' },
      { status: 500 }
    );
  }
} 