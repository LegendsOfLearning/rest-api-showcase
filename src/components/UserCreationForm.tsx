'use client';

import { useState } from 'react';
import axios from 'axios';

type UserCreationFormProps = {
  onUserCreated?: () => void;
};

export default function UserCreationForm({ onUserCreated }: UserCreationFormProps) {
  const [applicationUserId, setApplicationUserId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicationUserId || !firstName || !lastName || !role) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Only include email if it's provided and role is teacher
      const userData = {
        application_user_id: applicationUserId,
        first_name: firstName,
        last_name: lastName,
        role
      };
      
      // Only add email if it's provided and not empty for teachers
      if (role === 'teacher' && email.trim()) {
        Object.assign(userData, { email });
      }
      
      const response = await axios.post('/api/users', userData);
      
      setSuccess(`User created successfully with ID: ${response.data.user_id}`);
      
      // Reset form
      setApplicationUserId('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setRole('teacher');
      
      // Notify parent component
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(`Error: ${err.response?.data?.error || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-900">Create New User</h2>
        <p className="mt-1 text-sm text-slate-600">Create a new user account for testing purposes.</p>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg">
            <p>{success}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* User Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">User Type</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="student"
                    checked={role === 'student'}
                    onChange={() => setRole('student')}
                    className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-slate-700">Student</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="teacher"
                    checked={role === 'teacher'}
                    onChange={() => setRole('teacher')}
                    className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-slate-700">Teacher</span>
                </label>
              </div>
            </div>
            
            {/* Application User ID */}
            <div>
              <label htmlFor="applicationUserId" className="block text-sm font-medium text-slate-700 mb-1">
                Application User ID
              </label>
              <input
                type="text"
                id="applicationUserId"
                value={applicationUserId}
                onChange={(e) => setApplicationUserId(e.target.value)}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            
            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            
            {/* Email (for teachers) */}
            {role === 'teacher' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  If not provided, an email will be automatically generated.
                </p>
              </div>
            )}
            
            {/* Grade Level (for students) */}
            {role === 'student' && (
              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-slate-700 mb-1">
                  Grade Level
                </label>
                <select
                  id="gradeLevel"
                  value={applicationUserId}
                  onChange={(e) => setApplicationUserId(e.target.value)}
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Select Grade Level</option>
                  <option value="K">Kindergarten</option>
                  <option value="1">1st Grade</option>
                  <option value="2">2nd Grade</option>
                  <option value="3">3rd Grade</option>
                  <option value="4">4th Grade</option>
                  <option value="5">5th Grade</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="9">9th Grade</option>
                  <option value="10">10th Grade</option>
                  <option value="11">11th Grade</option>
                  <option value="12">12th Grade</option>
                </select>
              </div>
            )}
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create User'
                )}
              </button>
            </div>
          </div>
        </form>
        
        {/* User List */}
        {applicationUserId && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Created Users</h3>
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
              <ul className="divide-y divide-slate-200">
                <li className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{firstName} {lastName}</p>
                      <p className="text-sm text-slate-600">
                        {role === 'teacher' ? 'Teacher' : 'Student'} 
                        {role === 'student' && applicationUserId && ` - Grade ${applicationUserId}`}
                      </p>
                      {role === 'teacher' && email && (
                        <p className="text-sm text-slate-600">{email}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        ID: {applicationUserId}
                      </span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 