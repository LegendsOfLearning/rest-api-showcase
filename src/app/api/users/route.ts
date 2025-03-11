import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for users
let users: any[] = [];
let nextId = 1;

export async function GET() {
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.application_user_id || !body.first_name || !body.last_name || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields: application_user_id, first_name, last_name, and role are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = users.find(user => user.application_user_id === body.application_user_id);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with different params', user_id: existingUser.id },
        { status: 409 }
      );
    }
    
    // Create new user
    const newUser = {
      id: nextId++,
      application_user_id: body.application_user_id,
      first_name: body.first_name,
      last_name: body.last_name,
      role: body.role,
      email: body.email || `${body.application_user_id}@example.com`,
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    
    return NextResponse.json({ 
      message: 'User created successfully',
      user_id: newUser.id 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 