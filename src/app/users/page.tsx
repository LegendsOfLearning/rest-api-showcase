'use client';

import { useEffect, useState, useMemo } from 'react';
import { User } from '@/types/api';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { SignIntoLegendsButton } from '@/components/users/SignIntoLegendsButton';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher'>('all');
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    application_user_id: '',
    role: 'student' as 'student' | 'teacher',
    google_sub: '',
    email: ''
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newUser,
          ...(newUser.google_sub ? { google_sub: newUser.google_sub } : {}),
          ...(newUser.email ? { email: newUser.email } : {})
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      setNewUser({
        first_name: '',
        last_name: '',
        application_user_id: '',
        role: 'student',
        google_sub: '',
        email: ''
      });
      setIsCreating(false);
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = searchQuery === '' || 
        user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.application_user_id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  return (
    <div className="space-y-8">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Roster Management</p>
            <h1 className="text-2xl font-semibold text-foreground">Users</h1>
            <p className="text-sm text-muted mt-2">Create teachers and students, then generate instant login links.</p>
          </div>
          <button onClick={() => setIsCreating(true)} className="btn-primary text-xs whitespace-nowrap">
            Add user
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-error bg-error px-4 py-3 text-sm text-error">{error}</div>}

      {isCreating && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Create new user</h2>
              <p className="text-sm text-muted">Provide minimal details—API will scaffold the rest.</p>
            </div>
            <button type="button" onClick={() => setIsCreating(false)} className="text-sm text-muted hover:text-foreground">
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-muted">First name</label>
                <input
                  type="text"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, first_name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-surface-100 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted">Last name</label>
                <input
                  type="text"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, last_name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-surface-100 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-muted">External user ID</label>
                <input
                  type="text"
                  value={newUser.application_user_id}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, application_user_id: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-surface-100 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as 'student' | 'teacher' }))}
                  className="mt-1 w-full rounded-xl border border-border bg-surface-100 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-muted">Email (optional)</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="mt-1 w-full rounded-xl border border-border bg-surface-100 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                />
                <p className="mt-1 text-xs text-muted">Links to existing user if email matches</p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted">Google sub (optional)</label>
                <input
                  type="text"
                  value={newUser.google_sub}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, google_sub: e.target.value }))}
                  placeholder="Link to an existing Google account"
                  className="mt-1 w-full rounded-xl border border-border bg-surface-100 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary">
                Create user
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 mb-4 pb-4 border-b border-border">
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full rounded-xl border border-border bg-surface-100 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>
          <div className="sm:w-48">
            <label className="block text-xs uppercase tracking-widest text-muted mb-2">Filter by role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'student' | 'teacher')}
              className="w-full rounded-xl border border-border bg-surface-100 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              <option value="all">All roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
        </div>
        <div className="mb-4 text-sm text-muted">
          Showing {filteredUsers.length} of {users.length} users
        </div>
        <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-border text-xs uppercase tracking-widest text-muted">
          <div>First</div>
          <div>Last</div>
          <div>ID</div>
          <div>Role</div>
          <div className="text-right">Details</div>
          <div className="text-right">Login link</div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-muted">No users found matching your search.</div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-6 gap-4 items-center px-4 py-4 text-sm">
                <div className="font-medium text-foreground">{user.first_name}</div>
                <div className="font-medium text-foreground">{user.last_name}</div>
                <div className="font-mono text-xs text-muted">{user.application_user_id}</div>
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'teacher' ? 'bg-info text-info' : 'bg-success text-success'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="text-right text-accent">
                  <a href={`/users/${user.id}`} className="hover:underline text-sm">
                    View
                  </a>
                </div>
                <div className="text-right">
                  <SignIntoLegendsButton
                    applicationUserId={user.application_user_id}
                    firstName={user.first_name}
                    lastName={user.last_name}
                    role={user.role}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}