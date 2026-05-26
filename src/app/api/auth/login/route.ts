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
        'Accept': 'application/json',
        'User-Agent': 'Legends-REST-API-Showcase/1.0',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id,
        client_secret,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      // Read response text first (can only read once)
      const errorText = await tokenResponse.text();
      let errorMessage = 'Invalid credentials';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error_description || errorJson.error || errorJson.message || errorMessage;
      } catch {
        // If not JSON, use the text as error message
        errorMessage = errorText || errorMessage;
      }
      
      console.error('Token error response:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorText,
        url: API_ENDPOINTS.TOKEN
      });
      
      return NextResponse.json(
        { message: errorMessage },
        { status: tokenResponse.status || 401 }
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
