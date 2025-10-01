'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { ContentListEntry, ContentListResponse, GlobalSearchParams, GlobalSearchResponse, SearchResult } from '@/types/api';

export type PickedContent = {
  id: number;
  name: string;
  description?: string;
  thumbnail_url: string;
  game_type?: string;
  content_type?: string;
  is_question_game?: boolean;
};

type ContentPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (content: PickedContent) => void;
  initialQuery?: string;
};

type Tab = 'search' | 'browse';

export function ContentPickerModal({ open, onClose, onSelect, initialQuery }: ContentPickerModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [q, setQ] = useState(initialQuery || '');
  const [searchType, setSearchType] = useState<'all' | 'game' | 'video'>('all');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<GlobalSearchResponse | null>(null);

  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [browseData, setBrowseData] = useState<ContentListResponse | null>(null);
  const [browsePage, setBrowsePage] = useState(1);
  // Previously fetched standard sets for potential filters; removed as currently unused.

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Previously fetched standard sets for potential filters; removed as currently unused.

  // Debounced search
  useEffect(() => {
    if (!open || activeTab !== 'search') return;
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      const params: GlobalSearchParams = {
        q: q || undefined,
        content_type: searchType === 'all' ? undefined : searchType,
        page: 1,
        page_size: 12,
      };
      setSearchLoading(true);
      setSearchError(null);
      try {
        const res = await fetch(API_ENDPOINTS.SEARCHES, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: controller.signal,
        });
        if (!res.ok) {
          const body: unknown = await res.json().catch(() => ({}));
          const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
          const message = isRecord(body) && isRecord(body.error) && typeof body.error.message === 'string' ? body.error.message : undefined
          throw new Error(message || `Search failed (${res.status})`);
        }
          const data: GlobalSearchResponse = await res.json();
        setSearchResults(data);
      } catch (e) {
        if (e && typeof e === 'object' && 'name' in e && (e as { name?: string }).name === 'AbortError') return;
        setSearchError(e instanceof Error ? e.message : 'Search failed');
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [q, searchType, open, activeTab]);

  // Browse fetch
  useEffect(() => {
    if (!open || activeTab !== 'browse') return;
    let cancelled = false;
    async function run() {
      setBrowseLoading(true);
      setBrowseError(null);
      try {
        const params = new URLSearchParams({ page: String(browsePage), per_page: '12' });
        const res = await fetch(`${API_ENDPOINTS.CONTENT}?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch content');
        const data: ContentListResponse = await res.json();
        if (!cancelled) setBrowseData(data);
      } catch (e) {
        if (!cancelled) setBrowseError(e instanceof Error ? e.message : 'Failed to fetch');
      } finally {
        if (!cancelled) setBrowseLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [open, activeTab, browsePage]);

  const normalizedSearchHits: PickedContent[] = useMemo(() => {
    if (!searchResults) return [];
    return searchResults.hits
      .filter(h => h.content_type !== 'standard')
      .map((hit: SearchResult) => {
        if (hit.content_type === 'standard') {
          return null as unknown as PickedContent;
        }
        const c = (hit as { content_type: 'content'; content: { id: number; name: string; description?: string; thumbnail_url: string; game_type?: string; content_type?: string } }).content;
        return {
          id: c.id,
          name: c.name,
          description: c.description,
          thumbnail_url: c.thumbnail_url,
          game_type: c.game_type,
          content_type: c.content_type,
        } as PickedContent;
      })
      .filter(Boolean) as PickedContent[];
  }, [searchResults]);

  const normalizedBrowseEntries: PickedContent[] = useMemo(() => {
    if (!browseData) return [];
    return browseData.entries.map((e: ContentListEntry) => ({
      id: e.id,
      name: e.game,
      description: e.description,
      thumbnail_url: e.image,
      game_type: e.type,
      content_type: e.content_type,
    }));
  }, [browseData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center p-6">
        <div className="w-full max-w-5xl bg-white rounded-lg border shadow-lg overflow-hidden" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="font-semibold">Select Content</div>
            <button onClick={onClose} aria-label="Close" className="px-2 py-1 text-gray-600 hover:text-gray-900">✕</button>
          </div>

          <div className="px-4 pt-3">
            <div className="inline-flex rounded-md border overflow-hidden">
              <button onClick={() => setActiveTab('search')} className={`px-3 py-1.5 text-sm ${activeTab==='search' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>Search</button>
              <button onClick={() => setActiveTab('browse')} className={`px-3 py-1.5 text-sm ${activeTab==='browse' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>Browse</button>
            </div>
          </div>

          {activeTab === 'search' && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                <input
                  autoFocus
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search by name, description, tags..."
                  className="md:col-span-4 w-full px-3 py-2 border rounded"
                />
                <div className="md:col-span-2">
                  <div className="grid grid-cols-4 gap-1">
                    {(['all','game','video'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setSearchType(t)}
                        className={`px-2 py-1 text-xs rounded border ${searchType===t ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
                      >{t.replace('_', ' ')}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="min-h-60 border rounded overflow-hidden">
                {searchLoading ? (
                  <div className="p-6 text-sm text-gray-600">Searching…</div>
                ) : searchError ? (
                  <div className="p-6 text-sm text-red-600">{searchError}</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3">
                    {normalizedSearchHits.map(item => (
                      <button
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className="text-left bg-white rounded border hover:shadow focus:shadow outline-none"
                      >
                        <img src={item.thumbnail_url} alt="" className="w-full h-36 object-cover rounded-t" />
                        <div className="p-3">
                          <div className="font-medium line-clamp-1" title={item.name}>{item.name}</div>
                          {item.game_type && (
                            <div className="text-xs text-gray-500 mt-0.5">{item.game_type} • {item.content_type}</div>
                          )}
                        </div>
                      </button>
                    ))}
                    {!searchResults && <div className="p-6 text-sm text-gray-500">Type to search.</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'browse' && (
            <div className="p-4 space-y-3">
              <div className="min-h-60 border rounded overflow-hidden">
                {browseLoading ? (
                  <div className="p-6 text-sm text-gray-600">Loading…</div>
                ) : browseError ? (
                  <div className="p-6 text-sm text-red-600">{browseError}</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3">
                    {normalizedBrowseEntries.map(item => (
                      <button
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className="text-left bg-white rounded border hover:shadow focus:shadow outline-none"
                      >
                        <img src={item.thumbnail_url} alt="" className="w-full h-36 object-cover rounded-t" />
                        <div className="p-3">
                          <div className="font-medium line-clamp-1" title={item.name}>{item.name}</div>
                          {item.game_type && (
                            <div className="text-xs text-gray-500 mt-0.5">{item.game_type} • {item.content_type}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {browseData && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setBrowsePage(p => Math.max(1, p - 1))}
                    disabled={browseLoading || browseData.page_number <= 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >Prev</button>
                  <div className="text-sm text-gray-600">Page {browseData.page_number} / {browseData.total_pages}</div>
                  <button
                    onClick={() => setBrowsePage(p => (browseData ? Math.min(browseData.total_pages, p + 1) : p + 1))}
                    disabled={browseLoading || (browseData?.page_number ?? 1) >= (browseData?.total_pages ?? 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >Next</button>
                </div>
              )}
            </div>
          )}

          <div className="px-4 py-3 border-t flex items-center justify-end">
            <button onClick={onClose} className="px-3 py-1.5 border rounded">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentPickerModal;


