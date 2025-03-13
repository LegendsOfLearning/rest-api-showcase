import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import { validateAuth } from '../utils/apiHelpers';

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

    // Forward the request to the Legends API
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}/standard_sets`,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        params: Object.fromEntries(searchParams)
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API request failed:', error.response?.data || error);
    
    // If token is invalid, return 401
    if (error.response?.status === 401) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        message: error.response?.data?.error || 'API request failed',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
} 