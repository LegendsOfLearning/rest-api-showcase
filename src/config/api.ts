export const API_CONFIG = {
  BASE_URL: process.env.LEGENDS_API_BASE_URL || 'http://localhost:4000/api/v3',
  INTERNAL_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  VERSION: 'v3',
  ENDPOINTS: {
    TOKEN: '/oauth2/token',
    CONTENT: '/content',
    USERS: '/users',
    STANDARDS: '/standards',
    ASSIGNMENTS: '/assignments',
  },
  HEADERS: {
    DEFAULT: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    FORM: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  },
  // API request configuration
  REQUEST: {
    TIMEOUT: 30000,  // 30 seconds
    MAX_RETRIES: 3,
    BASE_DELAY: 1000, // Base delay for exponential backoff
    MAX_DELAY: 10000  // Maximum delay cap
  }
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, queryParams?: URLSearchParams): string => {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_CONFIG.BASE_URL}${normalizedEndpoint}`;
  return queryParams ? `${url}?${queryParams.toString()}` : url;
};

// Type-safe endpoint getter
export const getEndpoint = (key: keyof typeof API_CONFIG.ENDPOINTS): string => {
  return API_CONFIG.ENDPOINTS[key];
};

// Helper to get headers with auth token
export const getAuthHeaders = (token: string, isForm: boolean = false) => ({
  ...API_CONFIG.HEADERS[isForm ? 'FORM' : 'DEFAULT'],
  'Authorization': `Bearer ${token}`
}); 