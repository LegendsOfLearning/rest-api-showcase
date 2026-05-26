import { API_ENDPOINTS } from './endpoints';
import type { LoginLinkRequest, LoginLinkResponse, UserCreateRequest } from '@/types/api';

function buildHeaders(headers?: HeadersInit) {
  return {
    'Content-Type': 'application/json',
    ...(headers || {}),
  };
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }
    throw new Error(`Request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
  }

  return response.json();
}

export async function ensureUserExists(user: UserCreateRequest): Promise<void> {
  await postJson(API_ENDPOINTS.USERS, user);
}

export async function createLoginLink(request: LoginLinkRequest): Promise<LoginLinkResponse> {
  return postJson<LoginLinkResponse>(API_ENDPOINTS.USER_LOGIN_LINK, request);
}

export async function ensureUserAndLoginLink(
  user: UserCreateRequest,
  overrides: Partial<Omit<LoginLinkRequest, 'application_user_id'>> = {}
): Promise<LoginLinkResponse> {
  await ensureUserExists(user);

  const loginPayload: LoginLinkRequest = {
    application_user_id: user.application_user_id,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name,
    target: overrides.target ?? 'auto',
    ttl_seconds: overrides.ttl_seconds,
    auth: overrides.auth,
    destination: overrides.destination,
    return_url: overrides.return_url,
  };

  return createLoginLink(loginPayload);
}

