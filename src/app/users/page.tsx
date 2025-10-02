'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/api';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import Link from 'next/link';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    application_user_id: '',
    role: 'student' as 'student' | 'teacher'
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.USERS);
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.USERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      // Reset form and refresh users
      setNewUser({
        first_name: '',
        last_name: '',
        application_user_id: '',
        role: 'student'
      });
      setIsCreating(false);
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Users</h1>
            <p className="mt-1 text-gray-400">Manage users and roles</p>
          </div>
          <div className="flex gap-4">
            <Link 
              href="/"
              className="px-4 py-2 text-sm text-gray-300 bg-gray-700/50 rounded hover:bg-gray-700 hover:text-white transition-colors"
            >
              Back to Launch
            </Link>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 text-sm text-gray-300 bg-gray-700/50 rounded hover:bg-gray-700 hover:text-white transition-colors"
            >
              Add User
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 p-4 mb-6 rounded">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {isCreating && (
          <div className="mb-8 bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={newUser.application_user_id}
                  onChange={(e) => setNewUser(prev => ({ ...prev, application_user_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'student' | 'teacher' }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm text-gray-300 bg-gray-700/50 rounded hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 text-gray-400 text-sm">
            <div>First Name</div>
            <div>Last Name</div>
            <div>User ID</div>
            <div>Role</div>
            <div className="text-right">Actions</div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              Loading users...
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {users.map(user => (
                <div key={user.id} className="grid grid-cols-5 gap-4 p-4 items-center text-gray-300">
                  <div>{user.first_name}</div>
                  <div>{user.last_name}</div>
                  <div className="font-mono text-sm">{user.application_user_id}</div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'teacher' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="text-right">
                    <Link href={`/users/${user.id}`} className="text-blue-400 hover:text-blue-300">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 