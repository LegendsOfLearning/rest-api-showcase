/**
 * ⚠️ DEMO PURPOSES ONLY ⚠️
 * 
 * This file is part of a simplified demo implementation.
 * In a production environment, you should:
 * 1. NEVER expose OAuth credentials to the client
 * 2. ALWAYS handle authentication server-side
 * 3. Use proper session management
 * 4. Implement proper CSRF protection
 * 
 * See the server-side implementation in /app/api for the recommended approach
 * that properly handles OAuth2 client credentials flow server-side.
 */

'use client';

export class ClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ClientError';
  }
}

/**
 * Client-side error handler for demo purposes
 * In production, use proper error boundaries and logging
 */
export function handleClientError(error: unknown): { message: string; status?: number } {
  console.error('Client Error:', error);

  if (error instanceof ClientError) {
    return {
      message: error.message,
      status: error.status
    };
  }

  // Handle API response errors
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as any).response;
    return {
      message: response?.data?.message || 'An error occurred',
      status: response?.status
    };
  }

  // Handle other errors
  return {
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    status: 500
  };
}

/**
 * Demo error types - for illustration only
 * In production, errors should be handled server-side with proper security measures
 */
export const ClientErrors = {
  NetworkError: (message: string = 'Network error occurred') => 
    new ClientError(message, 0, 'NETWORK_ERROR'),
  
  ValidationError: (message: string) => 
    new ClientError(message, 400, 'VALIDATION_ERROR'),
  
  AuthError: (message: string = 'Authentication required') => 
    new ClientError(message, 401, 'AUTH_ERROR'),
}; 