'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { User } from '@/types/api';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<{ first_name: string | null; last_name: string | null }>({ first_name: null, last_name: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_ENDPOINTS.USER(id));
        if (!res.ok) throw new Error(res.status === 404 ? 'User not found' : 'Failed to load user');
        const body = await res.json();
        setUser(body);
        setForm({ first_name: body.first_name ?? null, last_name: body.last_name ?? null });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const save = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(API_ENDPOINTS.USER(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: form.first_name, last_name: form.last_name }),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setUser(updated);
      setSuccess('Saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!id) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <button onClick={() => router.push('/users')} className="text-sm text-blue-600 hover:underline">← Back to Users</button>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">User #{id}</h1>
        {loading ? (
          <div className="mt-4 text-gray-600">Loading...</div>
        ) : error ? (
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r text-sm text-red-700">{error}</div>
        ) : user ? (
          <div className="mt-4 bg-white border rounded p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">First Name</label>
                <input value={form.first_name ?? ''} onChange={e => setForm(prev => ({ ...prev, first_name: e.target.value || null }))} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Last Name</label>
                <input value={form.last_name ?? ''} onChange={e => setForm(prev => ({ ...prev, last_name: e.target.value || null }))} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
            <div className="text-sm text-gray-600">Role: <span className="font-medium">{user.role}</span></div>
            <div className="text-sm text-gray-600">External ID: <span className="font-mono">{user.application_user_id}</span></div>
            <div className="flex items-center gap-3">
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300">{saving ? 'Saving...' : 'Save'}</button>
              {success && <span className="text-sm text-green-700">{success}</span>}
              {error && <span className="text-sm text-red-700">{error}</span>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}


