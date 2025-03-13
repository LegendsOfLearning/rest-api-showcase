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

// POST handler for creating assignment joins
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const assignmentId = params.id;
    const body = await request.json();
    
    // Validate required fields
    if (!body.application_user_id) {
      return NextResponse.json(
        { error: 'Missing required field: application_user_id is required' },
        { status: 400 }
      );
    }
    
    // Create the join URL
    let attempt = 0;
    while (attempt < API_CONFIG.REQUEST.MAX_RETRIES) {
      try {
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/assignments/${assignmentId}/joins`,
          {
            application_user_id: body.application_user_id,
            target: body.target || 'awakening'
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        );
        
        return NextResponse.json(response.data, { status: 201 });
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
    console.error('Failed to create join URL:', error.response?.data || error);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.error || error.message || 'Failed to create join URL',
        details: error.response?.data || { code: error.code, message: error.message }
      },
      { status: error.response?.status || 500 }
    );
  }
} 