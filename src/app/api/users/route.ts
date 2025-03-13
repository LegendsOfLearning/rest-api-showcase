import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import { validateAuth } from '../utils/apiHelpers';

export const dynamic = 'force-dynamic';

const LEGENDS_API_BASE_URL = process.env.LEGENDS_API_BASE_URL || 'http://localhost:4000/api/v3';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookie
    const authHeader = validateAuth(request);
    if (authHeader instanceof NextResponse) {
      return authHeader;
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '10';
    const role = searchParams.get('role');
    const applicationUserId = searchParams.get('application_user_id');

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.set('page', page);
    queryParams.set('per_page', perPage);
    if (role) queryParams.set('role', role);
    if (applicationUserId) queryParams.set('application_user_id', applicationUserId);

    // Make request to Legends API
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}/users?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        }
      }
    );

    // Get the users array and total count from the response
    const users = response.data.users || [];
    const totalCount = users.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / parseInt(perPage)));

    // Return response
    return NextResponse.json({
      users,
      total_pages: totalPages,
      page: parseInt(page),
      total_count: totalCount
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', message: error.response?.data?.error || error.message },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookie
    const authHeader = validateAuth(request);
    if (authHeader instanceof NextResponse) {
      return authHeader;
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.application_user_id || !body.first_name || !body.last_name || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields: application_user_id, first_name, last_name, and role are required' },
        { status: 400 }
      );
    }

    // Create user through Legends API
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/users`,
      body,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        }
      }
    );
    
    return NextResponse.json({ 
      message: 'User created successfully',
      user_id: response.data.id 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', message: error.response?.data?.error || error.message },
      { status: error.response?.status || 500 }
    );
  }
} 