/**
 * Environment configuration
 * DO NOT expose sensitive values to the client
 */
export const ENV_CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_BASE_URL: process.env.LEGENDS_API_BASE_URL || 'http://localhost:4000/api/v3',
  INTERNAL_API_BASE_URL: process.env.INTERNAL_API_BASE_URL || 'http://localhost:3000',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
};

// Validate required environment variables
export function validateEnv() {
  const required = ['API_BASE_URL'];
  const missing = required.filter(key => !ENV_CONFIG[key as keyof typeof ENV_CONFIG]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and environment configuration.'
    );
  }
  
  // Validate URL format
  try {
    new URL(ENV_CONFIG.API_BASE_URL);
    new URL(ENV_CONFIG.INTERNAL_API_BASE_URL);
  } catch (error) {
    throw new Error('Invalid URL format in environment configuration');
  }
  
  return ENV_CONFIG;
} 