'use client';

import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { GlobalSearchParams, GlobalSearchResponse, GameType, GradeLevel, SubjectArea, SearchContentType, StandardSet } from '@/types/api';

const gameTypes: GameType[] = ['instructional', 'quiz', 'simulation'];
const gradeLevels: GradeLevel[] = ['K','1','2','3','4','5','6','7','8','9','10','11','12'];
const subjectAreas: SubjectArea[] = ['math','science','social studies'];

export default function SearchPage() {
  const [params, setParams] = useState<GlobalSearchParams>({ content_type: 'game', page: 1, page_size: 10 });
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [standardSets, setStandardSets] = useState<StandardSet[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_ENDPOINTS.SEARCHES, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        if (!res.ok) {
          const body: unknown = await res.json().catch(() => ({}));
          const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
          const message = isRecord(body) && isRecord(body.error) && typeof body.error.message === 'string' ? body.error.message : undefined;
          throw new Error(message || 'Search failed');
        }
        const data: GlobalSearchResponse = await res.json();
        if (!cancelled) setResults(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Search failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // intentionally run only once on mount for initial search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let page = 1;
        const pageSize = 500;
        const all: StandardSet[] = [];
        for (let i = 0; i < 1000; i += 1) { // safety guard
          const res = await fetch(API_ENDPOINTS.STANDARD_SETS({ page, pageSize }));
          const data: unknown = await res.json();
          type SetsPage = { results?: StandardSet[]; total_count?: number; per_page?: number };
          const d = (data || {}) as SetsPage;
          const results: StandardSet[] = Array.isArray(d.results) ? d.results : [];
          all.push(...results);
          const total: number | undefined = typeof d.total_count === 'number' ? d.total_count : undefined;
          const perPage: number = typeof d.per_page === 'number' ? d.per_page : pageSize;
          const reachedTotal = typeof total === 'number' ? all.length >= total : false;
          const isLastBySize = results.length < perPage;
          if (reachedTotal || isLastBySize) break;
          page += 1;
        }
        if (!cancelled) setStandardSets(all);
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleArrayParam = <T extends string>(key: keyof GlobalSearchParams, value: T) => {
    setParams(prev => {
      const current = (prev[key] as T[] | undefined) || [];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Global Search</h1>
        <div className="bg-white rounded border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Query</label>
              <input value={params.q || ''} onChange={e => setParams(p => ({ ...p, q: e.target.value }))} className="w-full px-3 py-2 border rounded" placeholder="Search term" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <select value={params.content_type || 'game'} onChange={e => setParams(p => ({ ...p, content_type: e.target.value as SearchContentType }))} className="w-full px-3 py-2 border rounded">
                <option value="game">Game</option>
                <option value="video">Video</option>
                <option value="standard">Standard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard Set</label>
              <select
                value={params.standard_set || ''}
                onChange={e => {
                  const value = e.target.value;
                  setParams(p => ({ ...p, standard_set: value || undefined }));
                }}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All Standard Sets</option>
                {standardSets.map(set => (
                  <option key={set.id} value={set.name}>{set.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Lexile</label>
              <input type="number" value={params.max_lexile_level || ''} onChange={e => setParams(p => ({ ...p, max_lexile_level: e.target.value ? Number(e.target.value) : undefined }))} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Game Types</div>
              <div className="flex flex-wrap gap-2">
                {gameTypes.map(gt => (
                  <button key={gt} onClick={() => toggleArrayParam('game_types', gt)} className={`px-2 py-1 text-xs rounded border ${((params.game_types||[]).includes(gt) ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-300 text-gray-700')}`}>{gt}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Grade Levels</div>
              <div className="flex flex-wrap gap-2">
                {gradeLevels.map(gl => (
                  <button key={gl} onClick={() => toggleArrayParam('grade_levels', gl)} className={`px-2 py-1 text-xs rounded border ${((params.grade_levels||[]).includes(gl) ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-300 text-gray-700')}`}>{gl}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Subject Areas</div>
              <div className="flex flex-wrap gap-2">
                {subjectAreas.map(sa => (
                  <button key={sa} onClick={() => toggleArrayParam('subject_areas', sa)} className={`px-2 py-1 text-xs rounded border ${((params.subject_areas||[]).includes(sa) ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-300 text-gray-700')}`}>{sa}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => {
              // manual search trigger
              (async () => {
                setLoading(true);
                setError(null);
                try {
                  const res = await fetch(API_ENDPOINTS.SEARCHES, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params),
                  });
                  if (!res.ok) {
                    const body: unknown = await res.json().catch(() => ({}));
                    const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
                    const message = isRecord(body) && isRecord(body.error) && typeof body.error.message === 'string' ? body.error.message : undefined;
                    throw new Error(message || 'Search failed');
                  }
                  const data: GlobalSearchResponse = await res.json();
                  setResults(data);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Search failed');
                } finally {
                  setLoading(false);
                }
              })();
            }} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300">{loading ? 'Searching...' : 'Search'}</button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </div>

        <div className="bg-white rounded border border-gray-200">
          {results ? (
            <div>
              <div className="px-4 py-2 text-sm text-gray-600 border-b">Total: {results.total_count} | Page {results.page} / {Math.ceil(results.total_count / (results.per_page || 1))}</div>
              <div className="divide-y">
                {results.hits.map(hit => (
                  <div key={`${hit.content_type}-${hit.id}`} className="p-4">
                    {hit.content_type === 'standard' ? (
                      <div className="flex items-start gap-4">
                        <img src={(hit as { content_type: 'standard'; standard: { image: string } }).standard.image} alt="" className="w-16 h-16 object-cover rounded" />
                        <div>
                          <div className="font-medium">{(hit as { content_type: 'standard'; standard: { name: string } }).standard.name}</div>
                          <div className="text-sm text-gray-600">{(hit as { content_type: 'standard'; standard: { description: string } }).standard.description}</div>
                          <div className="text-xs text-gray-500">Set: {(hit as { content_type: 'standard'; standard: { standard_set: string } }).standard.standard_set}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <img src={(hit as { content_type: 'content'; content: { thumbnail_url: string } }).content.thumbnail_url} alt="" className="w-16 h-16 object-cover rounded" />
                        <div>
                          <div className="font-medium">{(hit as { content_type: 'content'; content: { name: string } }).content.name}</div>
                          <div className="text-sm text-gray-600">{(hit as { content_type: 'content'; content: { description: string } }).content.description}</div>
                          <div className="text-xs text-gray-500">Type: {(hit as { content_type: 'content'; content: { content_type: string; game_type: string } }).content.content_type} | Game: {(hit as { content_type: 'content'; content: { content_type: string; game_type: string } }).content.game_type}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 text-gray-500">No results yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}


