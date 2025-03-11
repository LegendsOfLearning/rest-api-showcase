import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_CONFIG } from '@/config/api';

// Helper function to implement exponential backoff
async function delay(attempt: number) {
  const baseDelay = API_CONFIG.REQUEST.BASE_DELAY;
  const maxDelay = API_CONFIG.REQUEST.MAX_DELAY;
  const delayMs = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  await new Promise(resolve => setTimeout(resolve, delayMs));
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token is required' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    
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
          'Authorization': `Bearer ${token}`,
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
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token is required' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['teacher_id', 'standard_id', 'title'];
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

    // First, ensure the teacher exists
    let attempt = 0;
    while (attempt < API_CONFIG.REQUEST.MAX_RETRIES) {
      try {
        await axios.get(
          `${API_CONFIG.BASE_URL}/users/${body.teacher_id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        );
        break;
      } catch (error: any) {
        if (error.code === 'ECONNRESET' && attempt < API_CONFIG.REQUEST.MAX_RETRIES - 1) {
          await delay(attempt);
          attempt++;
          continue;
        }
        throw error;
      }
    }

    // Create the assignment
    attempt = 0;
    while (attempt < API_CONFIG.REQUEST.MAX_RETRIES) {
      try {
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/assignments`,
          body,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
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