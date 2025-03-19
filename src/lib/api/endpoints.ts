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

export const API_ENDPOINTS = {
  TOKEN: 'https://api.smartlittlecookies.com/api/v3/oauth2/token',
  // User endpoints
  USERS: '/api/users',
  
  // Standards endpoints
  STANDARD_SETS: '/api/standard_sets',
  STANDARDS: (setId: string) => `/api/standard_sets/${setId}/standards`,
  
  // Assignment endpoints
  ASSIGNMENTS: '/api/assignments',
  ASSIGNMENT_JOIN: (assignmentId: number, studentId: string) => ({
    url: `/api/assignments/${assignmentId}/joins`,
    method: 'POST',
    body: {
      application_user_id: studentId
    }
  })
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