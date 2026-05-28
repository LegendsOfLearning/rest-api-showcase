/**
 * API Client for chat tools
 * Server-side only - uses cookies from Next.js headers for authentication
 */

import { cookies } from 'next/headers';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || null;
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Get auth token from cookies
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('No auth token found. Please login.');
  }

  // Build the API URL - endpoint should be like '/searches' or '/content/123'
  // The proxy route expects paths without /api prefix, and adds /v3 automatically
  const baseUrl = process.env.LEGENDS_API_URL || 'https://api.legendsoflearning.com/api';
  const url = `${baseUrl}/v3${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `API request failed with status ${response.status}: ${errorBody}`
    );
  }

  return response.json();
}

export async function ensureUser(applicationUserId: string, role: 'teacher' | 'student') {
  try {
    const response = await fetch(`${process.env.LEGENDS_API_URL || 'https://api.legendsoflearning.com/api'}/v3/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({
        application_user_id: applicationUserId,
        role,
        first_name: role === 'teacher' ? 'Chat' : 'Chat',
        last_name: role === 'teacher' ? 'Teacher' : 'Student',
      }),
    });
    // API returns 201 when created, 200 if exists - both are fine
    if (!response.ok && response.status !== 200 && response.status !== 201) {
      const text = await response.text();
      throw new Error(`ensureUser failed (${response.status}): ${text}`);
    }
    return response.json().catch(() => ({}));
  } catch (error) {
    // If it's already an Error, rethrow; otherwise wrap it
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to ensure user: ${String(error)}`);
  }
}

export { apiFetch };
