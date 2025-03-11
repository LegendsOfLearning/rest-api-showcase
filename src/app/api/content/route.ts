/**
 * ✅ RECOMMENDED IMPLEMENTATION ✅
 * 
 * This route demonstrates the proper server-side approach for API integration:
 * 1. Server-side OAuth token management
 * 2. Proper parameter validation
 * 3. Secure error handling
 * 4. Type-safe API responses
 * 
 * When implementing your own integration:
 * - Follow this pattern of server-side token management
 * - Never expose OAuth credentials to the client
 * - Always validate and sanitize input parameters
 * - Use proper error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_CONFIG } from '@/config/api';

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
    const pageSize = parseInt(searchParams.get('per_page') || '20', 10);
    const type = searchParams.get('type');
    const grades = searchParams.get('grades')?.split(',') || [];
    const supportsTts = searchParams.get('supports_tts') === 'true';
    const supportsIpad = searchParams.get('supports_ipad') === 'true';
    const subject = searchParams.get('subject');
    const query = searchParams.get('query');
    
    // Transform parameters for Legends API
    const params: Record<string, any> = {
      page,
      page_size: pageSize
    };
    
    // Add optional parameters
    if (type) params.game_type = type;
    if (supportsTts) params.supports_tts = true;
    if (supportsIpad) params.supports_ipad = true;
    if (query) params.q = query;
    
    // Forward the request to the Legends API
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}/content`,
      {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    // The response format already matches our frontend expectations
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Content fetch failed:', error.response?.data || error);
    
    return NextResponse.json(
      { 
        message: error.response?.data?.error || 'Content fetch failed',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
} 