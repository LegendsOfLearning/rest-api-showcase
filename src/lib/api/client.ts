/**
 * API Client for Legends of Learning API
 * OpenAPI Spec: https://app.smartlittlecookies.com/api/v3/docs/openapi
 * 
 * SECURITY NOTICE:
 * This is a SERVER-SIDE ONLY client that handles OAuth2 client credentials flow.
 * - Client secrets are only used server-side
 * - Tokens are managed server-side via auth_token cookie
 * - Frontend MUST use /api/[...legends] proxy which adds auth
 * 
 * Authentication Flow:
 * 1. Frontend makes request to /api/[...legends] proxy
 * 2. Proxy uses auth_token from cookie
 * 3. If token is invalid/expired, user is redirected to login
 */

import { 
  User, 
  StandardSet, 
  AssignmentCreateResponse,
  AssignmentJoinResponse,
  LaunchResponse, 
  PaginatedResponse,
  StandardsResponse
} from '@/types/api';
import { cookies } from 'next/headers';

class APIClient {
  private baseUrl: string;

  constructor() {
    // Verify we're server-side
    if (typeof window !== 'undefined') {
      throw new Error('APIClient can only be instantiated server-side');
    }

    this.baseUrl = (process.env.LEGENDS_API_URL || '').replace(/\/$/, '');

    if (!this.baseUrl) {
      throw new Error('Missing LEGENDS_API_URL environment variable');
    }
  }

  private async getAccessToken(): Promise<string> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      throw new Error('No auth token found. Please login.');
    }

    return token;
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
        throw new Error('Session expired. Please login again.');
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