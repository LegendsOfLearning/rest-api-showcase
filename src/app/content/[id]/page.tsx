'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { ContentDetail, ContentReviewsResponse } from '@/types/api';

export default function ContentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [reviews, setReviews] = useState<ContentReviewsResponse | null>(null);
  const [tab, setTab] = useState<'details' | 'reviews'>('details');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(API_ENDPOINTS.CONTENT_DETAIL(id));
        if (!res.ok) throw new Error('Failed to load content');
        setContent(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id || tab !== 'reviews') return;
    (async () => {
      try {
        const res = await fetch(API_ENDPOINTS.CONTENT_REVIEWS(id));
        if (!res.ok) throw new Error('Failed to load reviews');
        setReviews(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
  }, [id, tab]);

  if (!id) return null;

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Content #{id}</h1>
        </div>
        {error && (
          <div className="bg-error border-l-4 border-error p-4 mb-4 rounded-r">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}
        {content && (
          <div className="overflow-hidden rounded border border-border bg-surface">
            <img src={content.image} alt="" className="w-full h-56 object-cover" />
            <div className="p-4">
              <div className="text-sm text-muted">{content.type} • {content.content_type}</div>
              <h2 className="text-xl font-semibold mt-1">{content.game}</h2>
              <p className="text-foreground mt-2">{content.description}</p>
              <div className="mt-3 text-sm text-muted">Duration: {content.estimated_duration ?? '—'}</div>
            </div>
          </div>
        )}

        <div className="mt-6 border-b border-border">
          <nav className="-mb-px flex gap-6">
            <button className={`py-2 border-b-2 ${tab==='details'?'border-accent text-accent':'border-transparent text-muted'}`} onClick={()=>setTab('details')}>Details</button>
            <button className={`py-2 border-b-2 ${tab==='reviews'?'border-accent text-accent':'border-transparent text-muted'}`} onClick={()=>setTab('reviews')}>Reviews</button>
          </nav>
        </div>

        {tab === 'details' && content && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Standards</h3>
              <ul className="text-sm text-foreground list-disc pl-5 space-y-1">
                {content.standards.map(s => (
                  <li key={s.id}>{s.standard} ({s.ngss_dci_name})</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Version</h3>
              <div className="text-sm text-foreground">{content.version ? `${content.version.language_key} • v${content.version.api_version}` : '—'}</div>
              <h3 className="font-medium mt-4 mb-2">Stats</h3>
              <div className="text-sm text-foreground">Teacher Rating: {content.stats?.teacher_rating_avg ?? '—'}</div>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="mt-4">
            {!reviews ? (
              <div className="text-muted">Loading...</div>
            ) : (
              <div className="space-y-3">
                {reviews.entries.map(r => (
                  <div key={r.id} className="rounded border border-border bg-surface p-3">
                    <div className="text-sm text-muted">Score: {r.score} • {new Date(r.created_at).toLocaleString()}</div>
                    <div className="text-foreground mt-1">{r.review}</div>
                    <div className="text-xs text-muted mt-1">{r.teacher?.name || r.tester_display_name || 'Anonymous'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
