# Legends of Learning API Integration Guide

## Environment Setup

Create a `.env` file in your project root with the following required variables:

```env
# The base URL should include /api but NOT /v3
LEGENDS_API_KEY=your_client_id
LEGENDS_API_SECRET=your_client_secret
LEGENDS_API_URL=https://app.smartlittlecookies.com/api  # Note: includes /api but NOT /v3
```

## API Version and Base URL

All API endpoints are prefixed with:
1. Base URL from environment (includes `/api`)
2. API version (`/v3`)
3. Endpoint path

For example, to call the users endpoint:
```
${LEGENDS_API_URL}/v3/users
```

## Authentication Flow

The API uses OAuth 2.0 Client Credentials flow for server-to-server authentication.

### 1. Getting an Access Token

**Full URL Example:** `https://app.smartlittlecookies.com/api/v3/oauth2/token`

**Headers:**
```
Content-Type: application/x-www-form-urlencoded
Accept: application/json
```

**Body Parameters:**
```
grant_type=client_credentials
client_id={your_api_key}
client_secret={your_api_secret}
```

**Response:**
```json
{
  "access_token": "your_access_token",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 2. Using the Access Token

All subsequent API requests must include the access token in the Authorization header:

```
Authorization: Bearer your_access_token
Content-Type: application/json
```

## Available Endpoints

### Users

1. **Get Users**
   - `GET /users`
   - Returns list of all users

2. **Create User**
   - `POST /users`
   - Body:
     ```json
     {
       "name": "string",
       "email": "string",
       "role": "teacher" | "student"
     }
     ```

### Standards

1. **Get Standard Sets**
   - `GET /standard_sets`
   - Returns list of all standard sets

2. **Get Standards in a Set**
   - `GET /standard_sets/{setId}/standards`
   - Returns list of standards in the specified set

### Launch

1. **Launch Standard**
   - `POST /launch`
   - Body:
     ```json
     {
       "teacher_id": "string",
       "standard_id": "string",
       "student_ids": ["string"]
     }
     ```
   - Returns:
     ```json
     {
       "id": "string",
       "teacher_id": "string",
       "standard_id": "string",
       "student_links": [
         {
           "student_id": "string",
           "launch_url": "string"
         }
       ],
       "created_at": "string"
     }
     ```

## Error Handling

The API uses standard HTTP status codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized (invalid/expired token)
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

When an error occurs, the response will include an error message:

```json
{
  "error": "Error description"
}
```

## Implementation Example

Our `APIClient` class handles authentication and request management automatically:

1. Manages token lifecycle
2. Automatically refreshes expired tokens
3. Retries failed requests when appropriate
4. Provides typed responses for TypeScript safety

Example usage:

```typescript
import apiClient from '@/lib/api/client';

// Get all users
const users = await apiClient.getUsers();

// Create a new user
const newUser = await apiClient.createUser({
  name: "John Doe",
  email: "john@example.com",
  role: "student"
});

// Get standard sets
const standardSets = await apiClient.getStandardSets();

// Get standards in a set
const standards = await apiClient.getStandards("set_id");

// Launch a standard
const launch = await apiClient.launchStandard({
  teacher_id: "teacher_123",
  standard_id: "standard_456",
  student_ids: ["student_789"]
});
```

## Best Practices

1. **Environment Variables**
   - Never hardcode API credentials
   - Use environment variables for all sensitive data
   - Keep .env file out of version control

2. **Error Handling**
   - Always wrap API calls in try/catch blocks
   - Handle token expiration gracefully
   - Provide meaningful error messages to users

3. **Type Safety**
   - Use TypeScript interfaces for all API requests/responses
   - Validate data before sending to API
   - Handle null/undefined values appropriately
