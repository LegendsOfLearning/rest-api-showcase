import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_CONFIG } from '@/config/api';

export const dynamic = 'force-dynamic';

// Cookie configuration
const COOKIE_CONFIG = {
  name: 'auth_token',
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/'
  }
};

// Set auth cookie helper
function setAuthCookie(response: NextResponse, token: string, expiresIn: number) {
  response.cookies.set({
    ...COOKIE_CONFIG,
    name: COOKIE_CONFIG.name,
    value: token,
    maxAge: expiresIn,
    ...COOKIE_CONFIG.options
  });
}

// Clear auth cookie helper
function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    ...COOKIE_CONFIG,
    name: COOKIE_CONFIG.name,
    value: '',
    maxAge: 0,
    ...COOKIE_CONFIG.options
  });
}

// Login - exchange credentials for token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Use provided credentials or fall back to env vars
    const client_id = body.client_id || process.env.LEGENDS_CLIENT_ID;
    const client_secret = body.client_secret || process.env.LEGENDS_CLIENT_SECRET;

    if (!client_id || !client_secret) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id and client_secret are required' },
        { status: 400 }
      );
    }

    // Create form data exactly as specified in the API docs
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', client_id);
    formData.append('client_secret', client_secret);

    // Debug log the request
    console.log('Making token request to:', `${API_CONFIG.BASE_URL}/oauth2/token`);
    console.log('Request body:', formData.toString());

    // Make request exactly as specified in the API docs
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/oauth2/token`,
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    // Debug log the response
    console.log('Token response:', response.data);

    const { access_token, expires_in } = response.data;
    
    if (!access_token || !expires_in) {
      console.error('Invalid token response:', response.data);
      return NextResponse.json(
        { error: 'Invalid token response from authentication server' },
        { status: 500 }
      );
    }

    // Set token in cookie and return success
    const nextResponse = NextResponse.json({ 
      success: true,
      expires_in: expires_in
    });
    
    setAuthCookie(nextResponse, access_token, expires_in);
    return nextResponse;

  } catch (error: any) {
    // Debug log the error
    console.error('Auth error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }
    });

    return NextResponse.json(
      { error: error.response?.data?.error_description || 'Authentication failed' },
      { status: error.response?.status || 500 }
    );
  }
}

// Logout - clear the cookie
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearAuthCookie(response);
  return response;
} 