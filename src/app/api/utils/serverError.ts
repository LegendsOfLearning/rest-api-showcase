/**
 * ✅ RECOMMENDED IMPLEMENTATION ✅
 * 
 * This demonstrates the proper server-side approach for handling API authentication and errors.
 * Key security features:
 * 1. OAuth credentials remain server-side only
 * 2. Proper error handling without leaking sensitive information
 * 3. Environment-aware error details (development vs production)
 * 4. Centralized error handling for consistent API responses
 */

import { NextResponse } from 'next/server';
import { ENV_CONFIG } from '@/config/env';

/**
 * Custom API error class for handling server-side errors
 */
export class ServerError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = 'INTERNAL_SERVER_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ServerError';
  }
}

interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
}

/**
 * Server-side error handler for API routes
 * This is the recommended pattern for handling errors in your API implementation
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  console.error('API Error:', error);

  if (error instanceof ServerError) {
    return NextResponse.json(
      {
        error: error.name,
        message: error.message,
        code: error.code,
        ...(ENV_CONFIG.IS_DEVELOPMENT && error.details ? { details: error.details } : {})
      },
      { status: error.status }
    );
  }

  // Handle axios errors
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const status = (error as any).response?.status || 500;
    const message = (error as any).response?.data?.message || 'External API error';
    
    return NextResponse.json(
      {
        error: 'ExternalApiError',
        message: ENV_CONFIG.IS_DEVELOPMENT ? message : 'An error occurred while processing your request',
        ...(ENV_CONFIG.IS_DEVELOPMENT ? { details: (error as any).response?.data } : {})
      },
      { status }
    );
  }

  // Handle unknown errors
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  return NextResponse.json(
    {
      error: 'InternalServerError',
      message: ENV_CONFIG.IS_DEVELOPMENT ? message : 'An internal server error occurred',
      ...(ENV_CONFIG.IS_DEVELOPMENT && error instanceof Error ? { stack: error.stack } : {})
    },
    { status: 500 }
  );
}

/**
 * Standard error types for API responses
 * Use these to maintain consistent error handling across your API
 */
export const ApiError = {
  NotFound: (message = 'Resource not found') => 
    new ServerError(message, 404, 'NOT_FOUND'),
    
  BadRequest: (message = 'Bad request') => 
    new ServerError(message, 400, 'BAD_REQUEST'),
    
  Unauthorized: (message = 'Unauthorized') => 
    new ServerError(message, 401, 'UNAUTHORIZED'),
    
  Forbidden: (message = 'Forbidden') => 
    new ServerError(message, 403, 'FORBIDDEN'),
    
  ValidationError: (details: any) => 
    new ServerError('Validation error', 400, 'VALIDATION_ERROR', details),
};

export function handleServerError(error: Error | ServerError | unknown): NextResponse {
  console.error('Server Error:', error);
  
  const isServerError = error instanceof ServerError;
  const status = isServerError ? error.status : 500;
  
  return NextResponse.json(
    {
      error: ENV_CONFIG.IS_DEVELOPMENT
        ? isServerError 
          ? error.message 
          : error instanceof Error 
            ? error.message 
            : 'Unknown error'
        : 'An internal server error occurred'
    },
    { status }
  );
} 