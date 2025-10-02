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
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="px-4 py-2 text-sm text-gray-300 bg-gray-700/50 rounded hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-60"
      >
        {loading ? 'Logging out…' : 'Logout'}
      </button>
    </div>
  );
}


