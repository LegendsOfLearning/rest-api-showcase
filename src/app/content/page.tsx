"use client";

import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { ContentListResponse } from '@/types/api';

export default function ContentPage() {
  const [filters, setFilters] = useState<Record<string, string>>({ page: '1', per_page: '20' });
  const [data, setData] = useState<ContentListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters);
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
  }, []);

  const setFilter = (key: string, value: string) => setFilters(prev => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Content Browser</h1>

        <div className="bg-white rounded border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game Type</label>
              <select value={filters.game_type || ''} onChange={e => setFilter('game_type', e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">Any</option>
                <option value="instructional">Instructional</option>
                <option value="question">Question</option>
                <option value="simulation">Simulation</option>
                <option value="video">Video</option>
                <option value="hands_on">Hands On</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supports TTS</label>
              <select value={filters.supports_tts || ''} onChange={e => setFilter('supports_tts', e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">Any</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supports iPad</label>
              <select value={filters.supports_ipad || ''} onChange={e => setFilter('supports_ipad', e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">Any</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Size</label>
              <select value={filters.per_page} onChange={e => setFilter('per_page', e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={fetchData} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300">{loading ? 'Loading...' : 'Apply'}</button>
            {error && <span className="ml-3 text-sm text-red-600">{error}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.entries.map(item => (
            <a key={item.id} href={`/content/${item.id}`} className="bg-white rounded border overflow-hidden hover:shadow">
              <img src={item.image} alt="" className="w-full h-40 object-cover" />
              <div className="p-3">
                <div className="font-medium">{item.game}</div>
                <div className="text-xs text-gray-500">{item.type} • {item.content_type}</div>
                <div className="text-xs text-gray-500 mt-1">TTS: {item.supports_tts ? 'Yes' : 'No'} • iPad: {item.supports_ipad ? 'Yes' : 'No'}</div>
              </div>
            </a>
          ))}
        </div>

        {data && (
          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => { setFilter('page', String(Math.max(1, (Number(filters.page)||1) - 1))); fetchData(); }} disabled={loading || (data.page_number <= 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <div className="text-sm text-gray-600">Page {data.page_number} / {data.total_pages}</div>
            <button onClick={() => { setFilter('page', String((Number(filters.page)||1) + 1)); fetchData(); }} disabled={loading || (data.page_number >= data.total_pages)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
