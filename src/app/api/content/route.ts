import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import { validateAuth, transformContentParams } from '../utils/apiHelpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookie
    const authHeader = validateAuth(request);
    if (authHeader instanceof NextResponse) {
      return authHeader;
    }
    
    // Get query parameters and transform them
    const { searchParams } = new URL(request.url);
    const transformedParams = transformContentParams(searchParams);
    
    // Forward the request to the Legends API
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}/content`,
      {
        params: Object.fromEntries(transformedParams),
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        }
      }
    );
    
    // Transform the response to match the new structure
    const transformedData = {
      ...response.data,
      entries: response.data.entries.map((entry: any) => {
        const { audience, banner, stat, ...rest } = entry;
        return {
          ...rest,
          grade_levels: Object.entries(audience || {})
            .filter(([key, value]) => value === true)
            .map(([key]) => key === 'k' ? 'K' : key.slice(1)),
          stats: stat
        };
      })
    };
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { message: 'Error fetching content' },
      { status: 500 }
    );
  }
} 