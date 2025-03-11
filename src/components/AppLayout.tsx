'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export function LoginForm() {
  const { login, lastClientId } = useAuth();
  const [clientId, setClientId] = useState(lastClientId || '');
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(clientId, clientSecret);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Legends of Learning API Demo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your API credentials to test the REST API
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="client-id" className="sr-only">
                Client ID
              </label>
              <input
                id="client-id"
                name="client_id"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="client-secret" className="sr-only">
                Client Secret
              </label>
              <input
                id="client-secret"
                name="client_secret"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Client Secret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Authentication failed
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? 'Authenticating...' : 'Test API Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, logout, lastClientId } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-violet-800 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center px-3 py-1 rounded text-white font-semibold text-sm">
                LEGENDS
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                href="/standards"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  pathname === '/standards'
                    ? 'bg-white/10 text-white'
                    : 'text-indigo-100 hover:text-white hover:bg-white/10'
                }`}
              >
                Standards
              </Link>
              <Link
                href="/content"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  pathname === '/content'
                    ? 'bg-white/10 text-white'
                    : 'text-indigo-100 hover:text-white hover:bg-white/10'
                }`}
              >
                Content Search
              </Link>
              <Link
                href="/assignments"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  pathname === '/assignments'
                    ? 'bg-white/10 text-white'
                    : 'text-indigo-100 hover:text-white hover:bg-white/10'
                }`}
              >
                Assignments
              </Link>
              <Link
                href="/users"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  pathname === '/users'
                    ? 'bg-white/10 text-white'
                    : 'text-indigo-100 hover:text-white hover:bg-white/10'
                }`}
              >
                Users
              </Link>
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-indigo-100">
                <span className="font-medium text-white">{lastClientId?.slice(0, 8)}...</span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-300 text-sm">
              &copy; {new Date().getFullYear()} Legends of Learning
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-slate-300 hover:text-white transition-colors">
                Documentation
              </a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 