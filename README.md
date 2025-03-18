# Legends One-Shot API Integration

A Next.js application for managing and launching educational standards.

## API Documentation
- Base URL: https://app.smartlittlecookies.com/api
- API Version: v3 (automatically added to all requests)
- OpenAPI Spec: https://app.smartlittlecookies.com/api/v3/docs/openapi

## Key Features
1. Users Management
   - List and manage teachers/students
   - Each user must have a unique `application_user_id`

2. Standards Launch Flow
   - Filter standards by standard set
   - Select a standard
   - Launch assignments for multiple students
   - Get unique join links per student

## Important Implementation Rules

### Authentication
- Uses 2-legged OAuth (client credentials flow)
- Token endpoint: `/v3/oauth2/token`
- Requires API key and secret in `.env`:
  ```
  LEGENDS_API_KEY=your_key
  LEGENDS_API_SECRET=your_secret
  LEGENDS_API_URL=https://app.smartlittlecookies.com/api  # No /v3 suffix
  ```

### Assignment Creation Flow
1. Create Assignment
   ```typescript
   POST /v3/assignments
   {
     "type": "standard",           // Required, must be "standard"
     "standard_id": number,        // Required, must be numeric
     "application_user_id": string // Required, use student ID
   }
   ```

2. Get Join Links
   ```typescript
   POST /v3/assignments/{assignment_id}/join
   {
     "application_user_id": string, // Student's ID
     "target": "awakening"         // Required, must be "awakening"
   }
   ```

### Common Gotchas
1. API URL Structure
   - Base URL should NOT include `/v3`
   - `/v3` is added automatically to all API requests
   - Token endpoint is at `/v3/oauth2/token`
   - Assignment endpoint is at `/v3/assignments`

2. Standard IDs
   - Must be numbers in API calls
   - Convert string IDs: `parseInt(standard_id, 10)`
   - Validate: `if (isNaN(standardId)) throw error`

3. User IDs
   - Always use `application_user_id`
   - Never use internal IDs for API calls
   - Format: string (e.g., "demo-student-1")

4. Assignment Creation
   - No teacher ID needed (handled by API key)
   - Use student's ID as `application_user_id`
   - Must specify `type: "standard"`

5. Join Links
   - Separate request per student
   - Must specify `target: "awakening"`
   - Returns `join_url` not `launch_url`

### Type Definitions
```typescript
interface AssignmentCreateRequest {
  type: 'standard';
  standard_id: number;
  application_user_id: string;
}

interface AssignmentCreateResponse {
  assignment_id: number;
}

interface AssignmentJoinRequest {
  application_user_id: string;
  target: 'awakening';
}

interface AssignmentJoinResponse {
  join_url: string;
}

interface LaunchResponse {
  assignment_id: number;
  student_links: {
    student_id: string;
    launch_url: string;
  }[];
}
```

## Development Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`

3. Start development server:
   ```bash
   npm run dev
   ```

## Testing Launch Flow
Test payload format:
```json
{
  "standard_id": "13552",
  "student_ids": ["demo-student-1"]
}
```

Expected response:
```json
{
  "assignment_id": 1234,
  "student_links": [
    {
      "student_id": "demo-student-1",
      "launch_url": "https://..."
    }
  ]
}
```

## Error Handling
1. Validate request payload:
   - Required fields present
   - `student_ids` is non-empty array
   - `standard_id` is valid number

2. Common API Errors:
   - 422: Invalid parameters
   - 401: Authentication failed
   - 404: Resource not found
   - Check response body for detailed error messages

## Debugging
1. API Client Logging:
   - Request URL and payload are logged
   - Response status and body are logged
   - JSON parse errors are caught and logged

2. Common Issues:
   - 404: Check if URL includes `/v3` correctly
   - 422: Check payload format matches OpenAPI spec
   - 401: Check token is being sent correctly

## Best Practices
1. Always check OpenAPI spec for:
   - Exact endpoint paths
   - Required fields
   - Field types and formats
   - Enum values

2. Use TypeScript interfaces that match API exactly
3. Validate all inputs before API calls
4. Handle all error cases explicitly
5. Log API responses for debugging