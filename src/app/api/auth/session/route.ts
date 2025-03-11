import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Get session
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token');
  
  return NextResponse.json({
    token: token?.value || null,
  });
}

// Update session
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    const response = NextResponse.json({ success: true });
    
    if (token) {
      // Set cookie with token
      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
    } else {
      // Remove cookie
      response.cookies.delete('auth_token');
    }
    
    return response;
  } catch (error) {
    console.error('Session update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
} 