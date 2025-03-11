import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { API_CONFIG } from '@/config/api';
import { ENV_CONFIG } from '@/config/env';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

interface ApiError extends Error {
  status?: number;
  response?: any;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Rate limiting configuration
const rateLimits: Record<string, RateLimitConfig> = {
  default: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
};

// Rate limiting state
const requestCounts: Record<string, { count: number; resetTime: number }> = {};

/**
 * Check rate limits for a given endpoint
 */
function checkRateLimit(endpoint: string): void {
  const now = Date.now();
  const limit = rateLimits[endpoint] || rateLimits.default;
  
  if (!requestCounts[endpoint] || now > requestCounts[endpoint].resetTime) {
    requestCounts[endpoint] = { count: 0, resetTime: now + limit.windowMs };
  }
  
  if (requestCounts[endpoint].count >= limit.maxRequests) {
    throw new Error(`Rate limit exceeded for ${endpoint}`);
  }
  
  requestCounts[endpoint].count++;
}

/**
 * Sanitize request data to prevent common security issues
 */
function sanitizeRequestData(data: any): any {
  if (!data) return data;
  
  if (typeof data === 'object') {
    return Object.entries(data).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: typeof value === 'string' ? value.trim() : value
    }), {});
  }
  
  return data;
}

/**
 * Make an API request with enhanced security and error handling
 */
export async function makeApiRequest<T = any>(
  url: string,
  method: HttpMethod,
  data: any = null,
  headers: Record<string, string> = {}
): Promise<AxiosResponse<T>> {
  // Extract endpoint for rate limiting
  const endpoint = url.split('/').pop() || 'default';
  checkRateLimit(endpoint);
  
  const config: AxiosRequestConfig = {
    method,
    url,
    headers: {
      ...API_CONFIG.HEADERS.DEFAULT,
      ...headers
    },
    validateStatus: (status) => status < 500,
    timeout: 30000, // 30 second timeout
  };

  if (data) {
    const sanitizedData = sanitizeRequestData(data);
    
    if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
      const params = new URLSearchParams();
      Object.entries(sanitizedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      config.data = params.toString();
    } else {
      config.data = sanitizedData;
    }
  }

  try {
    const response = await axios(config);
    
    // Validate response content type
    const contentType = response.headers['content-type'];
    if (!contentType?.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }

    // Handle non-200 responses
    if (response.status >= 400) {
      const error = new Error(response.data.error || 'API request failed') as ApiError;
      error.status = response.status;
      error.response = response.data;
      throw error;
    }

    return response;
  } catch (error) {
    if (error instanceof AxiosError) {
      const apiError = new Error(
        ENV_CONFIG.IS_DEVELOPMENT 
          ? `API Error: ${error.response?.data?.error || error.message}`
          : 'An error occurred while processing your request'
      ) as ApiError;
      
      apiError.status = error.response?.status;
      apiError.response = error.response?.data;
      
      // Log detailed error in development
      if (ENV_CONFIG.IS_DEVELOPMENT) {
        console.error('API Request Failed:', {
          url,
          method,
          status: error.response?.status,
          error: error.response?.data
        });
      }
      
      throw apiError;
    }
    throw error;
  }
} 