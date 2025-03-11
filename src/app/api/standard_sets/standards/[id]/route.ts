import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_CONFIG } from '@/config/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization token is required' },
        { status: 401 }
      );
    }

    // Forward the request to the Legends API
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}/standards/${params.id}`,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        }
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