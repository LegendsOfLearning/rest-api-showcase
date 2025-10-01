/**
 * Legends of Learning API Endpoints
 * 
 * URL Structure:
 * - Frontend requests: /api/{endpoint}
 * - Route handler adds /v3: ${LEGENDS_API_URL}/v3/{endpoint}
 * 
 * Example:
 * Frontend request: /api/users
 * Becomes: https://api.smartlittlecookies.com/api/v3/users
 * 
 * IMPORTANT: 
 * 1. Frontend code should NEVER include /v3 in requests
 * 2. Route handler automatically adds /v3
 * 3. LEGENDS_API_URL includes /api already
 */

// Base URL and version from environment variable, with fallback
const API_BASE_URL = process.env.LEGENDS_API_URL || 'https://api.smartlittlecookies.com/api';
const API_VERSION = process.env.LEGENDS_API_VERSION || 'v3';

export const API_ENDPOINTS = {
  // OAuth token endpoint (special case - includes full URL with /v3)
  TOKEN: `${API_BASE_URL}/${API_VERSION}/oauth2/token`,
  TOKEN_REVOKE: `${API_BASE_URL}/${API_VERSION}/oauth2/revoke`,
  
  // User endpoints
  USERS: '/api/users',
  USER: (id: number | string) => `/api/users/${id}`,
  
  // Standards endpoints
  STANDARD_SETS: '/api/standard_sets',
  STANDARDS: (setId: string) => `/api/standard_sets/${setId}/standards`,
  
  // Assignment endpoints
  ASSIGNMENTS: '/api/assignments',
  ASSIGNMENT: (id: number | string) => `/api/assignments/${id}`,
  ASSIGNMENT_JOIN: (assignmentId: number, studentId: string, target: 'awakening' | 'web' = 'awakening') => ({
    url: `/api/assignments/${assignmentId}/joins`,
    method: 'POST',
    body: {
      application_user_id: studentId,
      target
    }
  }),

  // Searches
  SEARCHES: '/api/searches',

  // Content
  CONTENT: '/api/content',
  CONTENT_DETAIL: (id: number | string) => `/api/content/${id}`,
  CONTENT_REVIEWS: (id: number | string) => `/api/content/${id}/reviews`,

  // Aggregates
  STUDENT: (applicationUserId: string) => `/api/students/${applicationUserId}`,
  STANDARD_AGG: (id: number | string) => `/api/standards/${id}`,

  // Docs (proxied via API route)
  DOCS_SWAGGER_UI: '/api/docs/swagger-ui'
} as const;

// Example usage:
// fetch(API_ENDPOINTS.USERS)
// fetch(API_ENDPOINTS.STANDARD_SETS)
// fetch(API_ENDPOINTS.STANDARDS('123'))
// fetch(API_ENDPOINTS.ASSIGNMENTS)
// 
// // Join assignment example:
// const join = API_ENDPOINTS.ASSIGNMENT_JOIN(123, 'student-1');
// fetch(join.url, {
//   method: join.method,
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify(join.body)
// }) 