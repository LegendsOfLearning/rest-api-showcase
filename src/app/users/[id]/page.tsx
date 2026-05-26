'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { User, UserUpdateRequest } from '@/types/api';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserUpdateRequest>({ first_name: null, last_name: null, google_sub: null, email: null });
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
        setForm({
          first_name: body.first_name ?? null,
          last_name: body.last_name ?? null,
          google_sub: body.google_sub ?? null,
          email: body.email ?? null,
        });
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
      const payload: UserUpdateRequest = {};
      if (form.first_name !== user?.first_name) payload.first_name = form.first_name;
      if (form.last_name !== user?.last_name) payload.last_name = form.last_name;
      if (form.google_sub !== user?.google_sub) payload.google_sub = form.google_sub;
      if (form.email !== user?.email) payload.email = form.email;

      const res = await fetch(API_ENDPOINTS.USER(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setUser(updated);
      setForm({
        first_name: updated.first_name ?? null,
        last_name: updated.last_name ?? null,
        google_sub: updated.google_sub ?? null,
        email: updated.email ?? null,
      });
      setSuccess('Saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = user && (
    form.first_name !== user.first_name ||
    form.last_name !== user.last_name ||
    form.google_sub !== user.google_sub ||
    form.email !== user.email
  );

  if (!id) return null;

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.push('/users')} className="text-sm text-accent hover:underline">← Back to Users</button>
        <h1 className="text-2xl font-bold text-foreground mt-2">User #{id}</h1>
        {loading ? (
          <div className="mt-4 text-muted">Loading...</div>
        ) : error && !user ? (
          <div className="mt-4 bg-error border-l-4 border-error p-4 rounded-r text-sm text-error">{error}</div>
        ) : user ? (
          <div className="mt-4 space-y-6">
            {/* Read-only info */}
            <div className="rounded border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-foreground mb-3">User Info</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted">Role</span>
                  <p className="font-medium capitalize">{user.role}</p>
                </div>
                <div>
                  <span className="text-muted">External ID</span>
                  <p className="font-mono text-xs">{user.application_user_id}</p>
                </div>
                <div>
                  <span className="text-muted">Google Sub</span>
                  <p className={`font-mono text-xs ${user.google_sub ? '' : 'text-muted italic'}`}>
                    {user.google_sub || 'Not set'}
                  </p>
                </div>
                <div>
                  <span className="text-muted">Email Claim</span>
                  <p className={`text-xs ${user.email ? '' : 'text-muted italic'}`}>
                    {user.email || 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            {/* Editable form */}
            <div className="rounded border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-foreground mb-4">Edit User</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted mb-1">First Name</label>
                    <input
                      value={form.first_name ?? ''}
                      onChange={e => setForm(prev => ({ ...prev, first_name: e.target.value || null }))}
                      className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-1">Last Name</label>
                    <input
                      value={form.last_name ?? ''}
                      onChange={e => setForm(prev => ({ ...prev, last_name: e.target.value || null }))}
                      className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-medium text-foreground mb-3">Google Identity</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted mb-1">Google Sub</label>
                      <input
                        value={form.google_sub ?? ''}
                        onChange={e => setForm(prev => ({ ...prev, google_sub: e.target.value || null }))}
                        className="w-full rounded border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                        placeholder="e.g. 117293847592013475"
                      />
                      <p className="text-xs text-muted mt-1">Google&apos;s unique identifier (sub claim)</p>
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-1">Email Claim</label>
                      <input
                        type="email"
                        value={form.email ?? ''}
                        onChange={e => setForm(prev => ({ ...prev, email: e.target.value || null }))}
                        className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                        placeholder="e.g. user@school.edu"
                      />
                      <p className="text-xs text-muted mt-1">Email for identity matching</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={save}
                    disabled={saving || !hasChanges}
                    className="px-4 py-2 bg-accent text-on-accent rounded disabled:bg-surface-200 disabled:text-muted transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {hasChanges && !saving && (
                    <button
                      onClick={() => setForm({
                        first_name: user.first_name ?? null,
                        last_name: user.last_name ?? null,
                        google_sub: user.google_sub ?? null,
                        email: user.email ?? null,
                      })}
                      className="px-4 py-2 text-muted hover:text-foreground transition-colors"
                    >
                      Reset
                    </button>
                  )}
                  {success && <span className="text-sm text-success">{success}</span>}
                  {error && <span className="text-sm text-error">{error}</span>}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
