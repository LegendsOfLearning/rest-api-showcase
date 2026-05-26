"use client";

import { useState } from 'react';
import type { LoginLinkResponse } from '@/types/api';
import { ensureUserAndLoginLink } from '@/lib/api/loginLink';

interface SignIntoLegendsButtonProps {
  applicationUserId: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: 'teacher' | 'student';
  className?: string;
  auth?: 'google';
  returnUrl?: string;
  destination?: 'dashboard' | 'awakening_leaderboard';
}

export function SignIntoLegendsButton({
  applicationUserId,
  firstName,
  lastName,
  role = 'student',
  className = '',
  auth,
  returnUrl,
  destination,
}: SignIntoLegendsButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (target: 'awakening' | 'teacher_app') => {
    setLoading(target);
    setError(null);

    try {
      const response: LoginLinkResponse = await ensureUserAndLoginLink(
        {
          application_user_id: applicationUserId,
          first_name: firstName ?? undefined,
          last_name: lastName ?? undefined,
          role
        },
        {
          target,
          ttl_seconds: 60,
          auth,
          destination,
          return_url: returnUrl,
        }
      );
      
      // Redirect to the join URL
      window.location.href = response.join_url;
    } catch (err) {
      console.error('Error creating login link:', err);
      setError(err instanceof Error ? err.message : 'Failed to create login link');
      setLoading(null);
    }
  };

  // Students: just show Awakening button
  if (role === 'student') {
    return (
      <div className={className}>
        <button
          onClick={() => handleSignIn('awakening')}
          disabled={loading !== null}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-on-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading === 'awakening' ? 'Loading...' : 'Sign In to Awakening'}
        </button>
        {error && (
          <div className="mt-2 text-xs text-error">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Teachers: show both Teacher App and Awakening buttons
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleSignIn('teacher_app')}
          disabled={loading !== null}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-on-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading === 'teacher_app' ? 'Loading...' : 'Teacher App'}
        </button>
        <button
          onClick={() => handleSignIn('awakening')}
          disabled={loading !== null}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-surface text-foreground hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading === 'awakening' ? 'Loading...' : 'Awakening'}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-xs text-error">
          {error}
        </div>
      )}
    </div>
  );
}
