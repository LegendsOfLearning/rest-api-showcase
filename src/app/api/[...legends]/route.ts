import { NextRequest, NextResponse } from 'next/server';
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

// Function to get a valid OAuth token
async function getToken() {
  // Return cached token if it's still valid (with 5 min buffer)
  if (tokenCache && tokenCache.expires_at > Date.now() + 300000) {
    return tokenCache.access_token;
  }

  try {
    console.log('Requesting new OAuth token...');
    console.log(`API Base URL: ${LEGENDS_API_BASE_URL}`);
    console.log(`Client ID: ${LEGENDS_CLIENT_ID ? LEGENDS_CLIENT_ID.substring(0, 8) + '...' : 'undefined'}`);
    
    // Request new token
    const response = await axios.post(`${LEGENDS_API_BASE_URL}/oauth2/token`, {
      grant_type: 'client_credentials',
      client_id: LEGENDS_CLIENT_ID,
      client_secret: LEGENDS_CLIENT_SECRET,
    });

    console.log('OAuth token obtained successfully');
    
    // Cache the new token
    tokenCache = {
      access_token: response.data.access_token,
      expires_at: Date.now() + (response.data.expires_in * 1000),
    };

    return tokenCache.access_token;
  } catch (error) {
    console.error('OAuth token request failed:');
    if (axios.isAxiosError(error)) {
      console.error(`Status: ${error.response?.status}`);
      console.error(`Error message: ${JSON.stringify(error.response?.data)}`);
      console.error(`Request URL: ${error.config?.url}`);
      console.error(`Request data: ${JSON.stringify(error.config?.data)}`);
      
      if (error.response?.data?.error === 'invalid_client') {
        console.error('Client authentication failed due to unknown client, no client authentication included, or unsupported authentication method.');
        console.error('Please check your LEGENDS_CLIENT_ID and LEGENDS_CLIENT_SECRET environment variables.');
      }
    } else {
      console.error(`Unexpected error: ${error}`);
    }
    throw error;
  }
}

// Handler for GET requests
export async function GET(
  request: NextRequest,
  { params }: { params: { legends: string[] } }
) {
  return handleRequest(request, params.legends, 'GET');
}

// Handler for POST requests
export async function POST(
  request: NextRequest,
  { params }: { params: { legends: string[] } }
) {
  return handleRequest(request, params.legends, 'POST');
}

// Handler for PUT requests
export async function PUT(
  request: NextRequest,
  { params }: { params: { legends: string[] } }
) {
  return handleRequest(request, params.legends, 'PUT');
}

// Handler for DELETE requests
export async function DELETE(
  request: NextRequest,
  { params }: { params: { legends: string[] } }
) {
  return handleRequest(request, params.legends, 'DELETE');
}

// Common handler for all request methods
async function handleRequest(
  request: NextRequest,
  segments: string[],
  method: string
) {
  try {
    // Get the path segments
    const path = segments.join('/');
    
    const isUserEndpoint = path === 'users';
    const isContentEndpoint = path === 'content';
    
    if (isUserEndpoint) {
      console.log(`Processing ${method} request to /users endpoint`);
      if (method === 'POST' || method === 'PUT') {
        const body = await request.json();
        console.log(`Request body: ${JSON.stringify(body)}`);
      }
    }

    // Log content endpoint requests for debugging search
    if (isContentEndpoint) {
      console.log(`Processing ${method} request to /content endpoint`);
      
      // Get query parameters
      const url = new URL(request.url);
      const searchParams = url.searchParams;
      
      // Log all parameters for debugging
      const paramsObj = Object.fromEntries(searchParams);
      console.log(`Content request parameters: ${JSON.stringify(paramsObj)}`);
      
      // Handle search parameter - rename to query for the Legends API
      const searchParam = searchParams.get('search');
      if (searchParam) {
        console.log(`Search parameter detected: "${searchParam}"`);
        // Remove 'search' and add 'query' parameter for the Legends API
        searchParams.delete('search');
        searchParams.append('query', searchParam);
      }
      
      // Explicitly log the query parameter
      const queryParam = searchParams.get('query');
      console.log(`Search query parameter: "${queryParam}"`);
    }

    // Get a valid token
    const token = await getToken();

    // Get query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Prepare request options
    let requestBody = null;
    if (method === 'POST' || method === 'PUT') {
      requestBody = await request.json();
    }

    // Forward the request to Legends API
    console.log(`Forwarding ${method} request to ${LEGENDS_API_BASE_URL}/${path}`);
    
    // Get query parameters as an object
    const paramsObj = Object.fromEntries(searchParams);
    console.log(`Request parameters: ${JSON.stringify(paramsObj)}`);
    
    const response = await axios({
      method: method.toLowerCase(),
      url: `${LEGENDS_API_BASE_URL}/${path}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: requestBody,
      params: paramsObj,
    });

    // Return the response
    console.log(`Response status: ${response.status}`);
    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    console.error('API request failed:');
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorData = error.response?.data || { error: 'Internal Server Error' };
      
      console.error(`Status: ${status}`);
      console.error(`Error data: ${JSON.stringify(errorData)}`);
      console.error(`Request URL: ${error.config?.url}`);
      console.error(`Request method: ${error.config?.method?.toUpperCase()}`);
      console.error(`Request data: ${JSON.stringify(error.config?.data)}`);
      
      if (status === 401) {
        console.error('Authentication failed. Token might be invalid or expired.');
        // Force token refresh on next request
        tokenCache = null;
      }
      
      if (status === 422 && typeof errorData === 'object') {
        console.error('Validation error in request:');
        console.error(JSON.stringify(errorData, null, 2));
      }
      
      return NextResponse.json({
        ...errorData,
        debug: {
          request_url: error.config?.url,
          request_method: error.config?.method?.toUpperCase(),
          request_data: error.config?.data,
          error_message: error.message
        }
      }, { status });
    } else {
      console.error(`Unexpected error: ${error}`);
      return NextResponse.json({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          error_type: error instanceof Error ? error.constructor.name : typeof error
        }
      }, { status: 500 });
    }
  }
} 