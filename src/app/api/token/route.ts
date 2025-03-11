import { NextResponse } from 'next/server';
import axios from 'axios';

// Cache for the OAuth token
let tokenCache: {
  access_token: string;
  expires_at: number;
} | null = null;

// Environment variables
const LEGENDS_API_BASE_URL = process.env.LEGENDS_API_BASE_URL || 'https://api.legendsoflearning.com/api/v3';
const LEGENDS_CLIENT_ID = process.env.LEGENDS_CLIENT_ID;
const LEGENDS_CLIENT_SECRET = process.env.LEGENDS_CLIENT_SECRET;

// Validate required environment variables
if (!LEGENDS_CLIENT_ID || !LEGENDS_CLIENT_SECRET) {
  throw new Error('Missing required environment variables: LEGENDS_CLIENT_ID and LEGENDS_CLIENT_SECRET must be set');
}

// Function to make API request with retry
async function makeApiRequest(
  url: string, 
  method: string, 
  data: any, 
  headers?: Record<string, string>, 
  retries = 3
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await axios({
        method,
        url,
        data,
        headers,
        timeout: 10000 // 10 second timeout
      });
    } catch (error: any) {
      console.error(`API request failed (attempt ${attempt}/${retries}):`, error.message);
      
      // If it's a connection reset error, retry
      const isConnectionReset = 
        error.code === 'ECONNRESET' || 
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('socket hang up');
      
      if (attempt === retries || !isConnectionReset) throw error;
      
      // Wait before retrying (exponential backoff)
      const delay = 1000 * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  // This should never be reached due to the throw in the loop,
  // but TypeScript needs it for type safety
  throw new Error('Failed after all retries');
}

// GET handler for token endpoint
export async function GET() {
  try {
    // Return cached token if it's still valid (with 5 min buffer)
    if (tokenCache && tokenCache.expires_at > Date.now() + 300000) {
      return NextResponse.json({ access_token: tokenCache.access_token });
    }

    console.log('Requesting new OAuth token...');
    
    try {
      // Request new token with retry
      const response = await makeApiRequest(
        `${LEGENDS_API_BASE_URL}/oauth2/token`,
        'post',
        {
          grant_type: 'client_credentials',
          client_id: LEGENDS_CLIENT_ID,
          client_secret: LEGENDS_CLIENT_SECRET,
        }
      );

      console.log('OAuth token obtained successfully');
      
      // Cache the new token
      tokenCache = {
        access_token: response.data.access_token,
        expires_at: Date.now() + (response.data.expires_in * 1000),
      };

      return NextResponse.json({ access_token: tokenCache.access_token });
    } catch (error: any) {
      if (error.code === 'ECONNRESET' || error.message?.includes('ECONNRESET')) {
        console.error('Connection reset error when obtaining token:', error);
        return NextResponse.json(
          { 
            error: 'Connection to the authentication server was reset. Please try again.',
            details: { code: error.code, message: error.message }
          },
          { status: 503 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('OAuth token request failed:');
    
    if (axios.isAxiosError(error)) {
      console.error(`Status: ${error.response?.status}`);
      console.error(`Error message: ${JSON.stringify(error.response?.data)}`);
      
      if (error.response?.data?.error === 'invalid_client') {
        console.error('Client authentication failed due to unknown client, no client authentication included, or unsupported authentication method.');
        console.error('Please check your LEGENDS_CLIENT_ID and LEGENDS_CLIENT_SECRET environment variables.');
      }
      
      return NextResponse.json(
        { error: error.response?.data?.error || 'Failed to obtain token' },
        { status: error.response?.status || 500 }
      );
    } else {
      console.error(`Unexpected error: ${error}`);
      return NextResponse.json(
        { 
          error: 'Internal Server Error',
          details: { code: error.code, message: error.message }
        },
        { status: 500 }
      );
    }
  }
} 