import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError, Method } from 'axios';
import { API_CONFIG } from '@/config/api';

// Types
interface ApiRequestConfig {
  path: string;
  method: Method;
  body?: any;
  params?: URLSearchParams;
  authHeader?: string;
}

interface LegendsApiErrorResponse {
  error?: string;
  message?: string;
  [key: string]: any;
}

interface TransformedParams {
  q?: string;
  game_type?: string;
  grade_levels?: string;
  supports_tts?: string;
  supports_ipad?: string;
  page?: string;
  page_size?: string;
}

// Logger utility
const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  error: (message: string, error: any) => {
    console.error(`[ERROR] ${message}:`, error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};

// Get token from cookie
export function getTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get('auth_token')?.value || null;
}

// Validate auth from cookie
export function validateAuth(request: NextRequest): string | NextResponse {
  const token = getTokenFromCookies(request);
  if (!token) {
    logger.error('Missing auth token cookie', { url: request.url });
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }
  return `Bearer ${token}`;
}

// Transform search parameters for content endpoint
export function transformContentParams(searchParams: URLSearchParams): URLSearchParams {
  const transformedParams = new URLSearchParams();
  const paramsMap: Record<string, string> = {
    query: 'q',
    type: 'game_type',
    per_page: 'page_size',
    standard_set: 'standard_set',
    school_level: 'school_level'
  };
  
  // Log original parameters
  logger.debug('Original parameters:', Object.fromEntries(searchParams));
  
  // Map simple parameters
  Object.entries(paramsMap).forEach(([original, transformed]) => {
    const value = searchParams.get(original);
    if (value) {
      transformedParams.append(transformed, value);
    }
  });
  
  // Handle grades parameter
  const gradesParam = searchParams.get('grades');
  if (gradesParam) {
    const grades = gradesParam.split(',');
    transformedParams.append('grade_levels', JSON.stringify(grades));
  }
  
  // Handle boolean parameters
  ['supports_tts', 'supports_ipad'].forEach(param => {
    const value = searchParams.get(param);
    if (value === 'true') {
      transformedParams.append(param, 'true');
    }
  });
  
  // Handle pagination
  const page = searchParams.get('page');
  if (page) {
    transformedParams.append('page', page);
  }
  
  // Log transformed parameters
  logger.debug('Transformed parameters:', Object.fromEntries(transformedParams));
  
  return transformedParams;
}

// Add helper function to transform search response
export function transformSearchResponse(response: any) {
  if (!response.hits) return response;
  
  return {
    ...response,
    hits: response.hits.map((hit: any) => {
      const { data, content_type, ...rest } = hit;
      const transformedHit = {
        ...rest,
        content_type: content_type === 'standard' ? 'standard' : 'content'
      };
      
      if (data?.content_type) {
        const { grades, standard, learning_objective, subject, ...contentTypeRest } = data.content_type;
        transformedHit.data = {
          content_type: {
            ...contentTypeRest,
            grade_levels: grades,
            standard_set: standard,
            standard: learning_objective,
            subject: {
              ...subject,
              school_level: subject?.grade_level
            }
          }
        };
      }
      
      return transformedHit;
    })
  };
}

// Make API request with error handling
export async function makeApiRequest({
  path,
  method,
  body = null,
  params,
  authHeader
}: ApiRequestConfig): Promise<NextResponse> {
  const requestUrl = `${API_CONFIG.BASE_URL}/${path}`;
  const requestParams = params ? Object.fromEntries(params) : undefined;
  
  logger.debug('Making API request', {
    method,
    path,
    params: requestParams,
    hasBody: !!body,
    hasAuth: !!authHeader
  });

  try {
    const response = await axios({
      method: method.toLowerCase(),
      url: requestUrl,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      data: body,
      params: requestParams,
    });

    logger.debug('API request successful', {
      status: response.status,
      path,
      method
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    const axiosError = error as AxiosError<LegendsApiErrorResponse>;
    logger.error('API request failed', {
      error: axiosError.response?.data || axiosError.message,
      status: axiosError.response?.status,
      path,
      method
    });
    
    if (axiosError.response?.status === 401) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        message: axiosError.response?.data?.error || 'API request failed',
        details: axiosError.response?.data || axiosError.message
      },
      { status: axiosError.response?.status || 500 }
    );
  }
} 