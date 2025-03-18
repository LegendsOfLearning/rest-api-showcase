/**
 * API Client for Legends of Learning API
 * OpenAPI Spec: https://app.smartlittlecookies.com/api/v3/docs/openapi
 * 
 * SECURITY NOTICE:
 * This is a SERVER-SIDE ONLY client that handles OAuth2 client credentials flow.
 * - Client secrets are only used server-side
 * - Tokens are managed server-side
 * - Frontend MUST use /api/[...legends] proxy which adds auth
 * 
 * Authentication Flow:
 * 1. Frontend makes request to /api/[...legends] proxy
 * 2. Proxy checks for valid token in session cookie
 * 3. If no token or expired, proxy gets new token using this client
 * 4. Proxy adds token and forwards request to Legends API
 * 5. On 401, proxy refreshes token and retries once
 */

import { 
  User, 
  StandardSet, 
  Standard, 
  AssignmentCreateRequest,
  AssignmentCreateResponse,
  AssignmentJoinRequest,
  AssignmentJoinResponse,
  LaunchResponse, 
  PaginatedResponse,
  StandardsResponse
} from '@/types/api';
import { cookies } from 'next/headers';

// From OpenAPI spec
interface OAuth2TokenRequest {
  grant_type: 'client_credentials';
  client_id: string;
  client_secret: string;
}

interface OAuth2TokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  created_at: string;
}

const TOKEN_COOKIE = 'legends_token';
const TOKEN_EXPIRY = 7200; // 2 hours in seconds

class APIClient {
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    // Verify we're server-side
    if (typeof window !== 'undefined') {
      throw new Error('APIClient can only be instantiated server-side');
    }

    this.baseUrl = (process.env.LEGENDS_API_URL || '').replace(/\/$/, '');
    this.apiKey = process.env.LEGENDS_API_KEY || '';
    this.apiSecret = process.env.LEGENDS_API_SECRET || '';

    if (!this.baseUrl || !this.apiKey || !this.apiSecret) {
      throw new Error('Missing required environment variables for Legends API');
    }
  }

  private async getAccessToken(): Promise<string> {
    const cookieStore = await cookies();
    const storedToken = cookieStore.get(TOKEN_COOKIE);

    if (storedToken?.value) {
      console.log('[Auth] Using token from cookie');
      return storedToken.value;
    }

    const tokenUrl = `${this.baseUrl}/v3/oauth2/token`;
    console.log('[Auth] Requesting new token');

    const tokenRequest: OAuth2TokenRequest = {
      grant_type: 'client_credentials',
      client_id: this.apiKey,
      client_secret: this.apiSecret,
    };

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(tokenRequest as unknown as Record<string, string>),
      });

      if (!response.ok) {
        throw new Error(`Auth error: ${response.status} ${response.statusText}`);
      }

      const data: OAuth2TokenResponse = await response.json();
      
      // Store token in cookie
      const cookieStore = await cookies();
      cookieStore.set(TOKEN_COOKIE, data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: TOKEN_EXPIRY
      });

      return data.access_token;
    } catch (error) {
      console.error('[Auth] Token request failed:', error);
      throw error;
    }
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    
    // Add /v3 prefix if not present
    const url = endpoint.startsWith('/v3') 
      ? `${this.baseUrl}${endpoint}`
      : `${this.baseUrl}/v3${endpoint}`;

    console.log('[API] Request:', {
      url,
      method: options.method || 'GET',
      hasBody: !!options.body
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear token cookie and retry once
        const cookieStore = await cookies();
        cookieStore.delete(TOKEN_COOKIE);
        return this.fetch<T>(endpoint, options);
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // User endpoints
  async getUsers(): Promise<PaginatedResponse<User>> {
    return this.fetch<PaginatedResponse<User>>('/users');
  }

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    return this.fetch<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createTeacher(firstName: string, lastName: string): Promise<User> {
    return this.createUser({
      role: 'teacher',
      first_name: firstName,
      last_name: lastName,
      application_user_id: `teacher_${Date.now()}`, // Generate a unique ID
    });
  }

  // Standards endpoints
  async getStandardSets(): Promise<PaginatedResponse<StandardSet>> {
    return this.fetch<PaginatedResponse<StandardSet>>('/standard_sets');
  }

  async getStandards(setId: string): Promise<StandardsResponse> {
    return this.fetch<StandardsResponse>(`/standard_sets/${setId}/standards`);
  }

  // Assignment endpoints
  async createAssignment(standardId: number | string, applicationUserId: string): Promise<AssignmentCreateResponse> {
    console.log('Creating assignment with:', { standardId, applicationUserId });
    const numericStandardId = typeof standardId === 'string' ? parseInt(standardId, 10) : standardId;
    
    if (isNaN(numericStandardId)) {
      throw new Error(`Invalid standard_id: ${standardId}`);
    }
    
    const payload = {
      type: 'standard',
      standard_id: numericStandardId,
      application_user_id: applicationUserId
    };
    console.log('Assignment payload:', payload);
    return this.fetch<AssignmentCreateResponse>('/assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getJoinLink(assignmentId: number, studentId: string): Promise<AssignmentJoinResponse> {
    console.log('Getting join link for:', { assignmentId, studentId });
    const payload = {
      application_user_id: studentId,
      target: 'awakening'
    };
    console.log('Join link payload:', payload);
    return this.fetch<AssignmentJoinResponse>(`/assignments/${assignmentId}/join`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Combined launch flow
  async launchStandard(standardId: number | string, studentIds: string[]): Promise<LaunchResponse> {
    console.log('Launching standard:', { standardId, studentIds });
    
    // First create the assignment using the first student's ID as the creator
    const assignment = await this.createAssignment(standardId, studentIds[0]);
    console.log('Assignment created:', assignment);

    // Then get join links for each student
    const joinPromises = studentIds.map(async (studentId) => {
      const joinResponse = await this.getJoinLink(assignment.assignment_id, studentId);
      console.log('Join link created for student:', { studentId, joinResponse });
      return {
        student_id: studentId,
        launch_url: joinResponse.join_url,
      };
    });

    const student_links = await Promise.all(joinPromises);
    console.log('All student links created:', student_links);

    return {
      assignment_id: assignment.assignment_id,
      student_links,
    };
  }
}

// Create a singleton instance
const apiClient = new APIClient();
export default apiClient; 