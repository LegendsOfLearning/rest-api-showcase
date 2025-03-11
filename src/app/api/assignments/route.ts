import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Get the API base URL from environment variables
const LEGENDS_API_BASE_URL = process.env.LEGENDS_API_BASE_URL || 'https://api.legendsoflearning.com/api/v3';

// Function to get a valid token from the proxy endpoint with retry
async function getToken(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Use our own proxy to get a token
      const response = await axios.get('/api/token');
      return response.data.access_token;
    } catch (error) {
      console.error(`Failed to get token (attempt ${attempt}/${retries}):`, error);
      if (attempt === retries) throw error;
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Function to make API request with retry
async function makeApiRequest(
  url: string, 
  method: string, 
  data: any, 
  headers: Record<string, string>, 
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

// Function to ensure a user exists
async function ensureUserExists(applicationUserId: string, role: string, firstName: string, lastName: string) {
  console.log(`Ensuring user exists: ${applicationUserId} (${role})`);
  
  try {
    // First try to get the user
    const response = await axios.get(`/api/users?application_user_id=${applicationUserId}`);
    const users = response.data.users;
    
    if (users && users.length > 0) {
      console.log(`User ${applicationUserId} already exists`);
      return users[0];
    }
  } catch (error) {
    console.log(`User ${applicationUserId} not found, will create`);
  }
  
  // User doesn't exist, create it
  try {
    const createResponse = await axios.post('/api/users', {
      application_user_id: applicationUserId,
      role,
      first_name: firstName,
      last_name: lastName
    });
    
    console.log(`User ${applicationUserId} created successfully`);
    return createResponse.data;
  } catch (error: any) {
    // If error contains "User already exists" then it's fine, just get the user
    if (error.response?.data?.error?.includes('User already exists')) {
      console.log(`User ${applicationUserId} already exists (from error)`);
      const response = await axios.get(`/api/users?application_user_id=${applicationUserId}`);
      return response.data.users[0];
    }
    
    console.error(`Failed to create user ${applicationUserId}:`, error.response?.data || error.message);
    throw error;
  }
}

// POST handler for creating assignments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Assignment creation request:', body);
    
    // Validate required fields
    if (!body.type || !body.standard_id || !body.application_user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: type, standard_id, and application_user_id are required' },
        { status: 400 }
      );
    }
    
    // Ensure the teacher exists
    await ensureUserExists(
      body.application_user_id,
      'teacher',
      body.teacher_first_name || 'Demo',
      body.teacher_last_name || 'Teacher'
    );
    
    // Forward the request to the Legends API with retry
    const token = await getToken();
    
    try {
      const response = await makeApiRequest(
        `${LEGENDS_API_BASE_URL}/assignments`,
        'post',
        {
          type: body.type,
          standard_id: body.standard_id,
          application_user_id: body.application_user_id
        },
        {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      );
      
      console.log('Assignment created successfully:', response.data);
      return NextResponse.json(response.data, { status: 201 });
    } catch (error: any) {
      if (error.code === 'ECONNRESET' || error.message?.includes('ECONNRESET')) {
        console.error('Connection reset error when creating assignment:', error);
        return NextResponse.json(
          { 
            error: 'Connection to the API server was reset. Please try again.',
            details: { code: error.code, message: error.message }
          },
          { status: 503 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Failed to create assignment:', error);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.error || error.message || 'Failed to create assignment',
        details: error.response?.data || { code: error.code, message: error.message }
      },
      { status: error.response?.status || 500 }
    );
  }
} 