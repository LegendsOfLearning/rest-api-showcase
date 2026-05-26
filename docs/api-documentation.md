# Legends API Documentation

## API Overview
- Base URL: https://api.smartlittlecookies.com/api (production)
- API Version: v3 (automatically added to all requests)
- OpenAPI Spec: https://api.smartlittlecookies.com/api/v3/docs/openapi

## Authentication
- Uses 2-legged OAuth (client credentials flow)
- Token endpoint: `/v3/oauth2/token`
- The local login page asks for one app's OAuth client ID and client secret. Do not commit those values.
- `.env` only needs the API base URL for local runs:
  ```
  LEGENDS_API_URL=https://api.smartlittlecookies.com/api  # No /v3 suffix
  ```

## Assignment Creation Flow
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

## Common Gotchas
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

## User Management

### Create User
```typescript
POST /v3/users
{
  "application_user_id": string,  // Required
  "role": "teacher" | "student",  // Required
  "first_name": string,           // Optional
  "last_name": string,            // Optional
  "google_sub": string,           // Optional - Google subject identifier (see "Google OAuth Identity Verification" section below)
  "email": string                 // Optional - Email address. If provided and a user with this email already exists, the existing user will be linked to this application instead of creating a new user. Email matching is case-insensitive.
}
```

**Response:**
```typescript
{
  "user_id": number
}
```

**Behavior:**
- If `email` is provided and a user with that email exists (case-insensitive), the existing user is linked to the application (role must match)
- If `google_sub` is provided and a user with that `google_unique_id` exists, the existing user is linked to the application
- If `google_sub` is provided but no user exists, a new user is created with `google_unique_id` set
- If `email` is provided but no user exists, a new user is created normally
- If `google_sub` is provided, it is also stored as a claim on the application link. When the user later signs in via Google OAuth (`auth: "google"`), the Google account must match this `google_sub` or the sign-in is rejected with `google_identity_mismatch`. See **Google OAuth Identity Verification** below.
- Returns 422 error if:
  - User with `email` exists but has different role
  - User with `google_sub` exists but has different role
  - User with `application_user_id` already exists with different params
  - User with `google_sub` already linked to different `application_user_id`

### Create Login Link (no assignment)
```typescript
POST /v3/users/login_link
{
  "application_user_id": string,      // Required
  "role": "teacher" | "student",      // Required if user does not exist
  "first_name": string | null,        // Optional, used when creating user
  "last_name": string | null,         // Optional, used when creating user
  "target": "auto" | "awakening" | "teacher_app",
  "ttl_seconds": number,              // Optional, defaults to 10s, max 300s
  "auth": "google",                   // Optional - require Google sign-in before entering Legends
  "destination": "dashboard" | "awakening_leaderboard",  // Optional - where to land after sign-in
  "return_url": string,               // Optional - your callback URL for redirect after sign-in or on error
  "google_sub": string,               // Optional - Google subject identifier. Used when creating the user if they don't already exist.
  "email": string                     // Optional - Email address. If provided and a user with this email already exists, the existing user will be linked to this application instead of creating a new user. Email matching is case-insensitive. Used when creating the user if they don't already exist.
}
```

**Behavior:**
- Automatically creates the user if `application_user_id` does not exist (role required)
- If `email` is provided and a user with that email exists (case-insensitive), the existing user is linked to the application (role must match)
- If `google_sub` is provided and a user with that `google_unique_id` exists, the existing user is linked to the application
- `target: "auto"` sends teachers to the teacher app and students to Awakening
- Teachers may choose `awakening` to jump straight into player mode
- Students cannot target `teacher_app` (422 response)
- Links default to a 10-second TTL; you can extend up to 300 seconds via `ttl_seconds`
- When `auth: "google"` is set, the login link will redirect the user through Google OAuth before signing them in. If the user cancels or the Google account doesn't match, we redirect to your `redirect_uri` with an `error` query parameter (see **Google OAuth Identity Verification** below)

**Client Pattern:**
```typescript
import { ensureUserAndLoginLink } from '@/lib/api/loginLink';

const loginLink = await ensureUserAndLoginLink(
  {
    application_user_id: 'student-123',
    role: 'student',
    first_name: 'Demo',
    last_name: 'Student'
  },
  { target: 'awakening' }  // optional, defaults to 'auto'
);

window.location.href = loginLink.join_url;
```

See `src/lib/api/loginLink.ts` for a reusable helper that:
1. Calls `POST /v3/users` to create/idempotently update the user
2. Calls `POST /v3/users/login_link`
3. Returns the `join_url` so you can redirect immediately

## Type Definitions
```typescript
interface UserCreateRequest {
  application_user_id: string;
  role: 'teacher' | 'student';
  first_name?: string;
  last_name?: string;
  google_sub?: string;  // Optional - Google subject identifier
  email?: string;       // Optional - Email address. If provided and a user with this email already exists, the existing user will be linked to this application instead of creating a new user. Email matching is case-insensitive.
}

interface UserCreateResponse {
  user_id: number;
}

interface User {
  id: number;
  application_user_id: string;
  role: 'teacher' | 'student';
  first_name: string | null;
  last_name: string | null;
}

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

## Google OAuth Identity Verification

When you use `auth: "google"` in a login link, the user is redirected to Google to sign in before entering Legends. We verify that the Google account they authenticate with matches the identity you expect. This prevents users from signing in with the wrong Google account or one that belongs to someone else.

### How It Works

1. You create a user with an optional `google_sub` (the `sub` claim from Google's ID token — a stable unique identifier for a Google account)
2. You create a login link with `auth: "google"`
3. User is redirected to Google's consent screen
4. User signs in with Google
5. We verify the Google account matches, link it, and redirect back to your `redirect_uri`

### What Gets Verified

Two checks are performed when the user completes Google sign-in:

1. **Partner claim check** — If you provided a `google_sub` when creating the user, the Google account they sign in with must have the same `sub` value. This lets you enforce that a specific Google account is used.

2. **Existing link check** — If the user already has a linked Google account from a previous sign-in, the new sign-in must use the same Google account. This prevents account takeover.

Both checks must pass. If either fails, the user is redirected back to your `redirect_uri` with an error code.

### Creating a Login Link with Google Auth

```typescript
POST /v3/users/login_link
{
  "application_user_id": "teacher-42",
  "target": "teacher_app",
  "auth": "google",               // Requires Google sign-in
  "destination": "dashboard",     // Optional - where to land after sign-in
  "return_url": "https://your-app.com/callback"  // Optional - where to redirect back on completion or error
}
```

The response contains a `join_url` that, when visited, will redirect the user through Google OAuth before signing them in to Legends.

### Providing `google_sub` at User Creation

You can lock a user to a specific Google account by providing `google_sub` when creating them:

```typescript
POST /v3/users
{
  "application_user_id": "teacher-42",
  "role": "teacher",
  "first_name": "Jane",
  "last_name": "Smith",
  "google_sub": "110248495921238986420"  // From Google's ID token
}
```

After this, any Google sign-in for this user **must** use the Google account with sub `110248495921238986420`. Signing in with any other Google account will be rejected with `google_identity_mismatch`.

**When you don't provide `google_sub`:** The user can sign in with any Google account on their first sign-in. That account is then linked, and all subsequent sign-ins must use the same account.

### OAuth Error Codes

When something goes wrong during the Google OAuth flow, we redirect to your `redirect_uri` (or `return_url`) with an `error` query parameter:

```
https://your-app.com/callback?error=<error_code>
```

| Error Code | HTTP Context | Description |
|------------|-------------|-------------|
| `google_denied` | User action | User clicked "Cancel" or "No" on Google's consent screen, or closed the popup. |
| `google_identity_mismatch` | Verification failed | The Google account doesn't match. Either it doesn't match the `google_sub` you provided at user creation, or the user previously linked a different Google account. |
| `google_link_failed` | Constraint error | The Google account is already linked to a different Legends user. Two users cannot share the same Google account. |
| `google_auth_failed` | Token error | Google's token could not be verified. May be expired or malformed. Usually transient. |

### Handling Errors

```typescript
// In your callback handler
const url = new URL(window.location.href);
const error = url.searchParams.get('error');

if (error) {
  switch (error) {
    case 'google_denied':
      // User cancelled — offer to retry
      showMessage('Google sign-in was cancelled. Please try again.');
      break;

    case 'google_identity_mismatch':
      // Wrong Google account — tell them which account to use
      showMessage('You signed in with the wrong Google account. Please try again with the correct account.');
      break;

    case 'google_link_failed':
      // Google account belongs to someone else
      showMessage('This Google account is already linked to another user. Please use a different Google account.');
      break;

    case 'google_auth_failed':
      // Transient error — retry
      showMessage('Google authentication failed. Please try again.');
      break;

    default:
      showMessage('An error occurred. Please try again.');
  }
}
```

### Full Example: Google OAuth Login Flow

```typescript
// 1. Create user with google_sub (optional but recommended)
await fetch('/v3/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    application_user_id: 'teacher-42',
    role: 'teacher',
    first_name: 'Jane',
    last_name: 'Smith',
    google_sub: '110248495921238986420'  // Optional: lock to specific Google account
  })
});

// 2. Create login link with Google auth
const response = await fetch('/v3/users/login_link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    application_user_id: 'teacher-42',
    target: 'teacher_app',
    auth: 'google',
    destination: 'awakening_leaderboard',
    return_url: 'https://your-app.com/callback'
  })
});

const { join_url } = await response.json();

// 3. Redirect user — they'll go through Google OAuth, then into Legends
window.location.href = join_url;

// 4. Handle the callback in your app (see error handling above)
```

### Important Notes

- **`google_sub` is stable across sessions.** Google's `sub` claim never changes for a given user/application pair. It's safe to store and reuse.
- **First link is permanent.** Once a Google account is linked to a Legends user, it cannot be changed via the API. If a user needs to switch Google accounts, contact support.
- **No `google_sub`? No problem.** If you don't provide it, the first Google sign-in links whatever account the user chooses. All subsequent sign-ins enforce that same account.
- **One Google account per user.** A Google account can only be linked to one Legends user. Attempting to link it to a second user returns `google_link_failed`.
- **`auth: "google"` is optional.** Without it, login links sign the user in directly (no Google consent screen). Use `auth: "google"` when you need Google identity verification.

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

3. Google OAuth Errors (redirect-based):
   - `google_denied`: User cancelled Google sign-in
   - `google_identity_mismatch`: Google account doesn't match expected identity
   - `google_link_failed`: Google account already linked to another user
   - `google_auth_failed`: Google token verification failed

## Debugging Tips
1. API Client Logging:
   - Request URL and payload are logged
   - Response status and body are logged
   - JSON parse errors are caught and logged

2. Common Issues:
   - 404: Check if URL includes `/v3` correctly
   - 422: Check payload format matches OpenAPI spec
   - 401: Check token is being sent correctly
   - `google_identity_mismatch` on every sign-in: Check that the `google_sub` you provided at user creation matches the user's actual Google `sub` claim

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
6. When using Google OAuth, always handle redirect errors in your callback URL
7. Provide `google_sub` at user creation time when you know the user's Google account — this prevents them from accidentally linking the wrong one
