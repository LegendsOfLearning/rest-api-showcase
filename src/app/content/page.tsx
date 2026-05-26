"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { ContentListResponse, Standard, StandardSet } from '@/types/api';

export const dynamic = 'force-dynamic';

function ContentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const standardIdFromUrl = searchParams?.get('standard_id');
  
  const [standardSets, setStandardSets] = useState<StandardSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [standards, setStandards] = useState<Standard[]>([]);
  const [selectedStandardIds, setSelectedStandardIds] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<Record<string, string>>({ 
    page: '1', 
    per_page: '20',
    ...(standardIdFromUrl && { standard_ids: standardIdFromUrl })
  });
  const [data, setData] = useState<ContentListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStandards, setLoadingStandards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch standard sets on mount
  useEffect(() => {
    async function fetchStandardSets() {
      try {
        let page = 1;
        const pageSize = 100;
        let all: StandardSet[] = [];

        while (true) {
          const response = await fetch(API_ENDPOINTS.STANDARD_SETS({ page, pageSize }));
          if (!response.ok) break;
          const data = await response.json();
          const results: StandardSet[] = Array.isArray(data?.results) ? data.results : [];
          all = all.concat(results);

          const total: number | undefined = typeof data?.total_count === "number" ? data.total_count : undefined;
          const perPage: number = typeof data?.per_page === "number" ? data.per_page : pageSize;

          const reachedTotal = typeof total === "number" ? all.length >= total : false;
          const isLastBySize = results.length < perPage;

          if (reachedTotal || isLastBySize) break;
          page += 1;
        }

        setStandardSets(all);
      } catch (e) {
        console.error("Error fetching standard sets:", e);
      }
    }
    fetchStandardSets();
  }, []);

  // Fetch standards when a set is selected
  useEffect(() => {
    async function fetchStandards() {
      if (!selectedSetId) {
        setStandards([]);
        return;
      }

      setLoadingStandards(true);
      try {
        const response = await fetch(API_ENDPOINTS.STANDARDS(selectedSetId));
        if (!response.ok) throw new Error('Failed to load standards');
        const data = await response.json();
        if (!data?.entries) {
          throw new Error("Invalid response format");
        }
        const sorted = [...data.entries].sort((a, b) => a.standard.localeCompare(b.standard));
        setStandards(sorted);
      } catch (e) {
        console.error("Error fetching standards:", e);
        setStandards([]);
      } finally {
        setLoadingStandards(false);
      }
    }
    fetchStandards();
  }, [selectedSetId]);

  // Initialize from URL param
  useEffect(() => {
    if (standardIdFromUrl) {
      setSelectedStandardIds([standardIdFromUrl]);
      // Don't set filters here - let the fetchData handle it via selectedStandardIds
    }
  }, [standardIdFromUrl]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      // Handle standard_ids - convert array to comma-separated string
      if (selectedStandardIds.length > 0) {
        params.set('standard_ids', selectedStandardIds.join(','));
      }
      
      const res = await fetch(`${API_ENDPOINTS.CONTENT}?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch content');
      }
      const body: ContentListResponse = await res.json();
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStandardIds]);

  const setFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleStandardToggle = (standardId: number) => {
    const idStr = String(standardId);
    setSelectedStandardIds(prev => 
      prev.includes(idStr) 
        ? prev.filter(id => id !== idStr)
        : [...prev, idStr]
    );
  };

  const clearStandardFilter = () => {
    setSelectedStandardIds([]);
    setSelectedSetId('');
    setStandards([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { standard_ids, ...rest } = filters;
    setFilters(rest);
    router.push('/content');
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Browser</h1>
          <p className="mt-2 text-sm text-muted">Browse games and videos by filters</p>
        </div>

        <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-6">
          {/* Standard Filter Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Filter by Standard</label>
              <select
                value={selectedSetId}
                onChange={(e) => {
                  setSelectedSetId(e.target.value);
                  setSelectedStandardIds([]);
                }}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Choose a standard set...</option>
                {standardSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedSetId && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Standards {selectedStandardIds.length > 0 && `(${selectedStandardIds.length} selected)`}
                </label>
                {loadingStandards ? (
                  <div className="text-sm text-muted py-4">Loading standards...</div>
                ) : standards.length === 0 ? (
                  <div className="text-sm text-muted py-4">No standards available</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-surface divide-y divide-border/60">
                    {standards.map((standard) => {
                      const isSelected = selectedStandardIds.includes(String(standard.id));
                      return (
                        <label
                          key={standard.id}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-accent/10"
                              : "hover:bg-surface-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleStandardToggle(standard.id)}
                            className="h-4 w-4 rounded border-border text-accent focus:ring-2 focus:ring-accent focus:ring-offset-2"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground break-words">
                              {standard.standard}
                            </div>
                            {standard.description && (
                              <div className="text-xs text-muted mt-1 line-clamp-1">
                                {standard.description}
                              </div>
                            )}
                            <div className="text-xs text-muted mt-1">
                              ID: {standard.id}
                              {standard.standard_code && ` • Code: ${standard.standard_code}`}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedStandardIds.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/30">
                <div>
                  <div className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">
                    Filtered by {selectedStandardIds.length} {selectedStandardIds.length === 1 ? 'Standard' : 'Standards'}
                  </div>
                  <div className="text-sm text-foreground">
                    {selectedStandardIds.join(', ')}
                  </div>
                </div>
                <button
                  onClick={clearStandardFilter}
                  className="text-xs text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-100"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Other Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Game Type</label>
              <select 
                value={filters.game_type || ''} 
                onChange={e => setFilter('game_type', e.target.value)} 
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">Any</option>
                <option value="instructional">Instructional</option>
                <option value="question">Question</option>
                <option value="simulation">Simulation</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Supports TTS</label>
              <select 
                value={filters.supports_tts || ''} 
                onChange={e => setFilter('supports_tts', e.target.value)} 
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Supports iPad</label>
              <select 
                value={filters.supports_ipad || ''} 
                onChange={e => setFilter('supports_ipad', e.target.value)} 
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Page Size</label>
              <select 
                value={filters.per_page} 
                onChange={e => setFilter('per_page', e.target.value)} 
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:border-accent focus:outline-none"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button 
              onClick={fetchData} 
              disabled={loading} 
              className="px-6 py-2.5 bg-accent text-on-accent rounded-lg hover:bg-accent-hover disabled:bg-surface-200 disabled:text-muted transition-colors font-medium"
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
            {error && <span className="text-sm text-error">{error}</span>}
          </div>
        </div>

        {/* Content Grid */}
        {data && data.entries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.entries.map(item => (
              <a 
                key={item.id} 
                href={`/content/${item.id}`} 
                className="rounded-lg border border-border bg-surface overflow-hidden hover:border-accent hover:shadow-md transition-all group"
              >
                <img src={item.image} alt="" className="w-full h-40 object-cover" />
                <div className="p-4">
                  <div className="font-medium text-foreground group-hover:text-accent transition-colors">{item.game}</div>
                  <div className="text-xs text-muted mt-1">{item.type} • {item.content_type}</div>
                  <div className="text-xs text-muted mt-1">TTS: {item.supports_tts ? 'Yes' : 'No'} • iPad: {item.supports_ipad ? 'Yes' : 'No'}</div>
                </div>
              </a>
            ))}
          </div>
        ) : data && data.entries.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-100 p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Content Found</h3>
            <p className="text-muted">Try adjusting your filters to see more results</p>
          </div>
        ) : null}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => { 
                setFilter('page', String(Math.max(1, (Number(filters.page)||1) - 1))); 
                fetchData(); 
              }} 
              disabled={loading || (data.page_number <= 1)} 
              className="px-4 py-2 rounded-lg border border-border bg-surface text-foreground hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="text-sm text-muted">
              Page {data.page_number} of {data.total_pages}
            </div>
            <button 
              onClick={() => { 
                setFilter('page', String((Number(filters.page)||1) + 1)); 
                fetchData(); 
              }} 
              disabled={loading || (data.page_number >= data.total_pages)} 
              className="px-4 py-2 rounded-lg border border-border bg-surface text-foreground hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContentPage() {
  return (
    <Suspense fallback={<div className="w-full p-8 text-center text-muted">Loading...</div>}>
      <ContentPageContent />
    </Suspense>
  );
}
