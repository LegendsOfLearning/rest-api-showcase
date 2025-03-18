import { 
  User, 
  StandardSet, 
  Standard, 
  LaunchResponse, 
  PaginatedResponse,
  StandardsResponse
} from '@/types/api';

/**
 * Frontend API service that uses the /api/[...legends] proxy
 * This service is safe to use in client components
 */
class FrontendAPI {
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `/api${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // User endpoints
  async getUsers(): Promise<PaginatedResponse<User>> {
    return this.fetch<PaginatedResponse<User>>('/v3/users');
  }

  // Standards endpoints
  async getStandardSets(): Promise<PaginatedResponse<StandardSet>> {
    return this.fetch<PaginatedResponse<StandardSet>>('/v3/standard_sets');
  }

  async getStandards(setId: string): Promise<StandardsResponse> {
    return this.fetch<StandardsResponse>(`/v3/standard_sets/${setId}/standards`);
  }

  // Launch flow
  async launchStandard(standardId: number | string, studentIds: string[]): Promise<LaunchResponse> {
    return this.fetch<LaunchResponse>('/v3/assignments', {
      method: 'POST',
      body: JSON.stringify({
        type: 'standard',
        standard_id: standardId,
        student_ids: studentIds
      }),
    });
  }
}

// Create a singleton instance
const frontendAPI = new FrontendAPI();
export default frontendAPI; 