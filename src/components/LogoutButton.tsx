'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      router.push('/login');
    } catch (err) {
      setError('Failed to logout');
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {error && (
        <span className="text-xs text-error absolute top-full right-0 mt-1 whitespace-nowrap z-10">{error}</span>
      )}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="rounded-full border border-border/60 px-3 md:px-4 py-2 text-sm text-muted hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-60"
      >
        {loading ? 'Logging out…' : 'Logout'}
      </button>
    </div>
  );
}


