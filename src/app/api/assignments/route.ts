import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import { validateAuth } from '../utils/apiHelpers';

export const dynamic = 'force-dynamic';

// Helper function to implement exponential backoff
async function delay(attempt: number) {
  const baseDelay = API_CONFIG.REQUEST.BASE_DELAY;
  const maxDelay = API_CONFIG.REQUEST.MAX_DELAY;
  const delayMs = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  await new Promise(resolve => setTimeout(resolve, delayMs));
}

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookie
    const authHeader = validateAuth(request);
    if (authHeader instanceof NextResponse) {
      return authHeader;
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Forward the request to the Legends API
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}/assignments`,
      {
        params: {
          page,
          limit,
        },
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to fetch assignments:', error.response?.data || error);
    
    return NextResponse.json(
      { 
        message: error.response?.data?.error || 'Failed to fetch assignments',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
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

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['type', 'standard_id', 'application_user_id'];
    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          message: 'Missing required fields',
          details: missingFields
        },
        { status: 400 }
      );
    }

    // Create the assignment
    let attempt = 0;
    while (attempt < API_CONFIG.REQUEST.MAX_RETRIES) {
      try {
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/assignments`,
          {
            type: body.type,
            standard_id: body.standard_id,
            application_user_id: body.application_user_id
          },
          {
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
            }
          }
        );
        return NextResponse.json(response.data);
      } catch (error: any) {
        if (error.code === 'ECONNRESET' && attempt < API_CONFIG.REQUEST.MAX_RETRIES - 1) {
          await delay(attempt);
          attempt++;
          continue;
        }
        throw error;
      }
    }
  } catch (error: any) {
    console.error('Failed to create assignment:', error.response?.data || error);
    
    return NextResponse.json(
      { 
        message: error.response?.data?.error || 'Failed to create assignment',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
} 