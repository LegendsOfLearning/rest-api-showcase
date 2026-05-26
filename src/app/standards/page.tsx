'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { Standard, StandardSet } from '@/types/api';

export default function StandardsPage() {
  const router = useRouter();
  const [standardSets, setStandardSets] = useState<StandardSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStandards, setLoadingStandards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStandardClick = (standardId: number) => {
    router.push(`/content?standard_id=${standardId}`);
  };

  // Fetch standard sets on mount
  useEffect(() => {
    async function fetchStandardSets() {
      setLoading(true);
      setError(null);
      try {
        let page = 1;
        const pageSize = 100;
        let all: StandardSet[] = [];

        while (true) {
          const response = await fetch(API_ENDPOINTS.STANDARD_SETS({ page, pageSize }));
          if (!response.ok) throw new Error('Failed to load standard sets');
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
        setError(e instanceof Error ? e.message : "Failed to load standard sets");
      } finally {
        setLoading(false);
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
      setError(null);
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
        setError(e instanceof Error ? e.message : "Failed to load standards");
        setStandards([]);
      } finally {
        setLoadingStandards(false);
      }
    }
    fetchStandards();
  }, [selectedSetId]);

  const selectedSet = standardSets.find(s => s.id === selectedSetId);

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Standards</h1>
          <p className="mt-2 text-sm text-muted">Browse learning standards by standard set</p>
        </div>

        {/* Standard Set Selector */}
        <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Select Standard Set</label>
            {loading ? (
              <div className="text-sm text-muted">Loading standard sets...</div>
            ) : (
              <select
                value={selectedSetId}
                onChange={(e) => setSelectedSetId(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Choose a standard set...</option>
                {standardSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </select>
            )}
            {selectedSet && (
              <p className="mt-2 text-sm text-muted">
                {standards.length > 0 ? `${standards.length} standards found` : 'No standards available'}
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl border border-error bg-error px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="text-error text-xl">⚠️</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-error">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Standards List */}
        {selectedSetId && (
          <div className="rounded-xl border border-border bg-surface-100 p-6">
            {loadingStandards ? (
              <div className="text-center py-12">
                <div className="text-muted">Loading standards...</div>
              </div>
            ) : standards.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted">No standards found for this set</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedSet?.name || 'Standards'}
                  </h2>
                  <span className="text-sm text-muted bg-surface px-3 py-1 rounded-full border border-border">
                    {standards.length} {standards.length === 1 ? 'standard' : 'standards'}
                  </span>
                </div>
                
                <div className="grid gap-3">
                  {standards.map((standard) => (
                    <button
                      key={standard.id}
                      onClick={() => handleStandardClick(standard.id)}
                      className="rounded-lg border border-border bg-surface p-4 hover:border-accent hover:shadow-md transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground mb-1 break-words group-hover:text-accent transition-colors">
                            {standard.standard}
                          </div>
                          {standard.description && (
                            <div className="text-sm text-muted mt-1 line-clamp-2">
                              {standard.description}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                            <span>ID: {standard.id}</span>
                            {standard.grade_levels && standard.grade_levels.length > 0 && (
                              <span>Grades: {standard.grade_levels.join(', ')}</span>
                            )}
                            {standard.subject?.subject_area && (
                              <span>Subject: {standard.subject.subject_area}</span>
                            )}
                            {standard.standard_code && (
                              <span>Code: {standard.standard_code}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedSetId && !loading && (
          <div className="rounded-xl border-2 border-dashed border-border bg-surface-100 p-12 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Select a Standard Set</h3>
            <p className="text-muted">Choose a standard set from the dropdown above to view its standards</p>
          </div>
        )}
      </div>
    </div>
  );
}
