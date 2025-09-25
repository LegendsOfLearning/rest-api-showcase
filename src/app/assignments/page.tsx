"use client";

import { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { AssignmentCreateResponse, AssignmentDetailResponse, ContentDetail } from '@/types/api';
import ContentPickerModal, { type PickedContent } from '@/components/content/ContentPickerModal';
import StandardPickerModal from '@/components/content/StandardPickerModal';

type ActivityRow = {
  type?: 'mini_game' | 'video';
  content_id?: string;
  standard_id?: string;
  questions?: { id: string; standard_id: string }[];
};

type ActivityUiState = {
  selectedContent?: PickedContent | null;
  loadingContent?: boolean;
  error?: string | null;
};

export default function AssignmentsBuilderPage() {
  const [applicationUserId, setApplicationUserId] = useState('');
  const [name, setName] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [activities, setActivities] = useState<ActivityRow[]>([{}]);
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [selectedStandardId, setSelectedStandardId] = useState<string>('');
  const [detailView, setDetailView] = useState<'default' | 'activity' | 'activity_by_player' | 'player' | 'standard' | 'standard_by_student'>('default');
  const [result, setResult] = useState<unknown>(null);
  const [assignment, setAssignment] = useState<AssignmentDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpenForIndex, setPickerOpenForIndex] = useState<number | null>(null);
  const [stdPickerOpenForIndex, setStdPickerOpenForIndex] = useState<number | null>(null);
  const [activityUi, setActivityUi] = useState<Record<number, ActivityUiState>>({});

  const addActivity = () => setActivities(prev => [...prev, {}]);
  const updateActivity = (idx: number, patch: Partial<ActivityRow>) => setActivities(prev => prev.map((a, i) => i === idx ? { ...a, ...patch } : a));
  const removeActivity = (idx: number) => setActivities(prev => prev.filter((_, i) => i !== idx));

  // Keep type hinted from selectedContent if user hasn't explicitly chosen type
  const inferredTypeFromContent = (content?: PickedContent | null): ActivityRow['type'] | undefined => {
    if (!content) return undefined;
    const gameType = content.game_type?.toLowerCase();
    const ctype = content.content_type?.toLowerCase();
    if (ctype === 'video') return 'video';
    if (gameType === 'instructional' || gameType === 'quiz' || gameType === 'simulation') return 'mini_game';
    return undefined;
  };

  const setActivityUiState = (idx: number, patch: Partial<ActivityUiState>) => setActivityUi(prev => ({ ...prev, [idx]: { ...prev[idx], ...patch } }));

  // When content_id is present without selectedContent (e.g., pasted id), fetch lightweight details for preview
  useEffect(() => {
    activities.forEach((a, idx) => {
      const ui = activityUi[idx] || {};
      if (a.content_id && !ui.selectedContent && !ui.loadingContent) {
        setActivityUiState(idx, { loadingContent: true, error: null });
        fetch(API_ENDPOINTS.CONTENT_DETAIL(a.content_id))
          .then(async res => {
            if (!res.ok) throw new Error('Failed to fetch content');
            const data: ContentDetail = await res.json();
            const picked: PickedContent = {
              id: data.id,
              name: data.game,
              description: data.description,
              thumbnail_url: data.image,
              game_type: data.type,
              content_type: data.content_type,
            };
            setActivityUiState(idx, { selectedContent: picked, loadingContent: false });
            // Infer type if empty
            setActivities(prev => prev.map((row, i) => i === idx ? { ...row, type: row.type || inferredTypeFromContent(picked) } : row));
          })
          .catch(e => setActivityUiState(idx, { error: e instanceof Error ? e.message : 'Failed to load', loadingContent: false }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities.map(a => a.content_id).join(',')]);

  const buildPayload = () => {
    const normalized = activities.map(a => {
      const out: any = {};
      // do not send type; server infers based on content_id
      if (a.content_id) out.content_id = Number(a.content_id);
      if (a.standard_id) out.standard_id = Number(a.standard_id);
      return out;
    });
    const body: any = { application_user_id: applicationUserId };
    if (name) body.name = name;
    if (normalized.length > 0) body.activities = normalized;
    return body;
  };

  const create = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAssignment(null);
    try {
      const payload = buildPayload();
      const url = dryRun ? `${API_ENDPOINTS.ASSIGNMENTS}?dry_run=true` : API_ENDPOINTS.ASSIGNMENTS;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
      const text = await res.text();
      let json: any;
      try { json = JSON.parse(text); } catch { json = { raw: text }; }
      if (!res.ok) {
        throw new Error(json?.error || json?.errors || `Request failed (${res.status})`);
      }
      setResult(json);
      if (!dryRun && (json as AssignmentCreateResponse).assignment_id) {
        const detailsRes = await fetch(API_ENDPOINTS.ASSIGNMENT((json as AssignmentCreateResponse).assignment_id));
        if (detailsRes.ok) setAssignment(await detailsRes.json());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Assignments Builder</h1>

        <div className="bg-white border rounded p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Teacher application_user_id</label>
              <input value={applicationUserId} onChange={e => setApplicationUserId(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="teacher-123" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name (optional)</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Idempotency-Key (optional)</label>
              <input value={idempotencyKey} onChange={e => setIdempotencyKey(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="uuid" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input id="dryrun" type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} />
            <label htmlFor="dryrun" className="text-sm text-gray-700">Dry run (validate only)</label>
          </div>
        </div>

        <div className="bg-white border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Activities</h2>
            <button onClick={addActivity} className="px-3 py-1 border rounded">Add Activity</button>
          </div>
          <div className="space-y-3">
            {activities.map((a, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div />
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Content</label>
                  {activityUi[idx]?.selectedContent ? (
                    <div className="border rounded overflow-hidden flex items-center">
                      <img src={activityUi[idx]!.selectedContent!.thumbnail_url} alt="" className="w-16 h-16 object-cover" />
                      <div className="flex-1 p-2">
                        <div className="text-sm font-medium line-clamp-1" title={activityUi[idx]!.selectedContent!.name}>{activityUi[idx]!.selectedContent!.name}</div>
                        <div className="text-xs text-gray-500">{activityUi[idx]!.selectedContent!.game_type} • {activityUi[idx]!.selectedContent!.content_type}</div>
                      </div>
                      <div className="pr-2 flex gap-2">
                        <button
                          onClick={() => setPickerOpenForIndex(idx)}
                          className="text-xs px-2 py-1 border rounded"
                        >Change</button>
                        <button
                          onClick={() => { setActivityUiState(idx, { selectedContent: null }); updateActivity(idx, { content_id: '' }); }}
                          className="text-xs px-2 py-1 border rounded text-red-600"
                        >Clear</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPickerOpenForIndex(idx)}
                        className="px-3 py-2 border rounded"
                      >Select Content…</button>
                      <input
                        value={a.content_id || ''}
                        onChange={e => updateActivity(idx, { content_id: e.target.value })}
                        className="flex-1 px-2 py-2 border rounded"
                        placeholder="or paste an ID"
                      />
                    </div>
                  )}
                  {activityUi[idx]?.loadingContent && <div className="text-xs text-gray-500 mt-1">Loading content…</div>}
                  {activityUi[idx]?.error && <div className="text-xs text-red-600 mt-1">{activityUi[idx]?.error}</div>}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">standard_id (optional)</label>
                  <div className="flex gap-2">
                    <input value={a.standard_id || ''} onChange={e => updateActivity(idx, { standard_id: e.target.value })} className="flex-1 px-2 py-2 border rounded" placeholder="defaults if empty" />
                    <button onClick={() => setStdPickerOpenForIndex(idx)} className="px-3 py-2 border rounded">Pick…</button>
                  </div>
                </div>
                <div className="md:col-span-5 flex justify-end">
                  <button onClick={() => removeActivity(idx)} className="text-sm text-red-600">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={create} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300">{loading ? 'Submitting...' : 'Create Assignment'}</button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>

        {result && (
          <div className="bg-white border rounded p-4">
            <h3 className="font-semibold mb-2">Result</h3>
            <pre className="text-xs overflow-auto bg-gray-50 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        {assignment && (
          <div className="bg-white border rounded p-4 space-y-3">
            <div className="flex items-center gap-2">
              {(['default','activity','activity_by_player','player','standard','standard_by_student'] as const).map(v => (
                <button key={v} onClick={async () => {
                  setDetailView(v);
                  // refetch with view param except default
                  const url = v === 'default' ? API_ENDPOINTS.ASSIGNMENT(assignment.assignment.id) : `${API_ENDPOINTS.ASSIGNMENT(assignment.assignment.id)}?view=${v}`;
                  const res = await fetch(url);
                  if (res.ok) setAssignment(await res.json());
                }} className={`px-2 py-1 text-xs border rounded ${detailView===v ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}>{v.replaceAll('_',' ')}</button>
              ))}
            </div>
            <h3 className="font-semibold">Assignment Details</h3>
            <pre className="text-xs overflow-auto bg-gray-50 p-3 rounded">{JSON.stringify(assignment, null, 2)}</pre>
          </div>
        )}
      </div>
      <ContentPickerModal
        open={pickerOpenForIndex !== null}
        onClose={() => setPickerOpenForIndex(null)}
        onSelect={(picked) => {
          if (pickerOpenForIndex === null) return;
          const idx = pickerOpenForIndex;
          setActivityUiState(idx, { selectedContent: picked, error: null });
          // Default LO preselect: if content has associated standards in detail API, leave to server; otherwise keep optional input empty
          updateActivity(idx, { content_id: String(picked.id) });
          setPickerOpenForIndex(null);
        }}
      />
      <StandardPickerModal
        open={stdPickerOpenForIndex !== null}
        onClose={() => setStdPickerOpenForIndex(null)}
        onSelect={(std) => {
          if (stdPickerOpenForIndex === null) return
          const idx = stdPickerOpenForIndex
          updateActivity(idx, { standard_id: String(std.id) })
          setStdPickerOpenForIndex(null)
        }}
      />
    </div>
  );
}


