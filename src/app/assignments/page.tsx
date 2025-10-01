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
  standard_label?: string;
  standard_code?: string;
  standard_image_url?: string;
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
  const [topLevelStandard, setTopLevelStandard] = useState<{ id?: number; label?: string; code?: string; image_url?: string } | null>(null);
  const [detailView, setDetailView] = useState<'default' | 'activity' | 'activity_by_player' | 'player' | 'standard' | 'standard_by_student'>('default');
  const [result, setResult] = useState<unknown>(null);
  const [assignment, setAssignment] = useState<AssignmentDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  type ApiError = {
    status: number
    title: string
    requestId?: string
    errors?: Record<string, string | string[]>
    detail?: string
    code?: string
    hint?: string
    docs_url?: string
    raw?: string
    parsed?: unknown
  }
  const [apiError, setApiError] = useState<ApiError | null>(null)
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

  // Preselect default standard via backend normalization (dry_run)
  const preselectDefaultStandard = async (idx: number, contentId: number) => {
    const buildStdImageUrl = (key?: string) => {
      if (!key) return undefined;
      if (/^https?:\/\//i.test(key)) return key;
      // If key already has an extension/path, prefix with standards base
      const base = 'https://content.legendsoflearning.com/standards/';
      if (/\.(png|jpg|jpeg|gif)$/i.test(key)) return `${base}${key}`;
      return `${base}${key}.png`;
    };
    try {
      if (activities[idx]?.standard_id) return; // already set
      // Prefer server normalization when teacher is provided; otherwise fall back to content detail
      if (applicationUserId) {
        try {
          const res = await fetch(`${API_ENDPOINTS.ASSIGNMENTS}?dry_run=true`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              application_user_id: applicationUserId,
              activities: [{ content_id: contentId }],
            }),
          });
          if (res.ok) {
            type DryRunResponse = { activities?: Array<{ learning_objective_id?: number | string }> };
            const body = (await res.json().catch(() => ({}))) as DryRunResponse;
            const loId = Array.isArray(body.activities) ? body.activities[0]?.learning_objective_id : undefined;
            if (loId) {
              // resolve label/code/image via content detail
              const dres = await fetch(API_ENDPOINTS.CONTENT_DETAIL(contentId));
              if (dres.ok) {
                const detail: ContentDetail = await dres.json();
                const match = (detail.standards || []).find(s => Number(s.id) === Number(loId));
                updateActivity(idx, {
                  standard_id: String(loId),
                  standard_label: (match ? match.standard : undefined),
                  standard_code: (match ? (match as { ngss_dci_name?: string }).ngss_dci_name : undefined),
                  standard_image_url: buildStdImageUrl((match ? (match as { image_key?: string }).image_key : undefined)),
                });
                return;
              }
              updateActivity(idx, { standard_id: String(loId) });
              return;
            }
          }
        } catch {}
      }

      // Fallback: derive default LO from the first standard listed in content detail
      try {
        const dres = await fetch(API_ENDPOINTS.CONTENT_DETAIL(contentId));
        if (dres.ok) {
          const detail: ContentDetail = await dres.json();
          const first = (detail.standards || [])[0] as { id?: number; standard?: string; ngss_dci_name?: string; image_key?: string } | undefined;
          if (first && first.id) {
            updateActivity(idx, {
              standard_id: String(first.id),
              standard_label: first.standard,
              standard_code: first.ngss_dci_name,
              standard_image_url: buildStdImageUrl(first.image_key),
            });
          }
        }
      } catch {}
    } catch {}
  };

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
              is_question_game: !!data.is_question_game,
            };
            setActivityUiState(idx, { selectedContent: picked, loadingContent: false });
            // Infer type if empty
            setActivities(prev => prev.map((row, i) => i === idx ? { ...row, type: row.type || inferredTypeFromContent(picked) } : row));
            // Immediately preselect default LO for non-question games; require manual pick for question games
            if (!picked.is_question_game && picked.content_type !== 'video') {
              preselectDefaultStandard(idx, picked.id);
            }
          })
          .catch(e => setActivityUiState(idx, { error: e instanceof Error ? e.message : 'Failed to load', loadingContent: false }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities.map(a => a.content_id).join(',')]);

  const buildPayload = () => {
    const normalized = activities.map(a => {
      const out: { content_id?: number; standard_id?: number } = {};
      // do not send type; server infers based on content_id
      if (a.content_id) out.content_id = Number(a.content_id);
      // apply top-level standard by default if activity doesn't have one
      const lo = a.standard_id ? Number(a.standard_id) : (topLevelStandard?.id ? Number(topLevelStandard.id) : undefined);
      if (lo) out.standard_id = lo;
      return out;
    })
    // Filter out empty entries so preview always mirrors what will be sent
    .filter(item => typeof item.content_id === 'number' || typeof item.standard_id === 'number');
    const body: { application_user_id: string; name?: string; activities?: { content_id?: number; standard_id?: number }[] } = { application_user_id: applicationUserId };
    if (name) body.name = name;
    if (normalized.length > 0) body.activities = normalized;
    return body;
  };

  // Build a live request preview for optimal DX
  const requestPreview = useMemo(() => {
    const body = buildPayload();
    const url = dryRun ? `${API_ENDPOINTS.ASSIGNMENTS}?dry_run=true` : API_ENDPOINTS.ASSIGNMENTS;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return { method: 'POST', url, headers, body };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, applicationUserId, name, idempotencyKey, dryRun, topLevelStandard]);

  // Compute the underlying Legends API URL that the proxy forwards to
  const upstreamUrl = useMemo(() => {
    const base = (process.env.LEGENDS_API_URL || 'https://api.smartlittlecookies.com/api').replace(/\/$/, '');
    const version = process.env.LEGENDS_API_VERSION || 'v3';
    const rel = requestPreview.url || '';
    const qIndex = rel.indexOf('?');
    const pathOnly = (qIndex >= 0 ? rel.slice(0, qIndex) : rel).replace(/^\/api\/?/, '');
    const qs = qIndex >= 0 ? rel.slice(qIndex) : '';
    const withVersion = pathOnly.startsWith(`${version}/`) ? pathOnly : `${version}/${pathOnly}`;
    return `${base}/${withVersion}${qs}`;
  }, [requestPreview.url]);

  const curlSnippet = useMemo(() => {
    const headerParts = Object.entries(requestPreview.headers || {}).map(([k, v]) => `-H '${k}: ${v}'`).join(' ');
    const data = JSON.stringify(requestPreview.body).replace(/'/g, "'\\''");
    return `curl -X ${requestPreview.method} '${upstreamUrl}' ${headerParts} -d '${data}'`;
  }, [requestPreview, upstreamUrl]);

  const create = async () => {
    setLoading(true);
    setError(null);
    setApiError(null);
    setResult(null);
    setAssignment(null);
    try {
      const payload = buildPayload();
      const url = dryRun ? `${API_ENDPOINTS.ASSIGNMENTS}?dry_run=true` : API_ENDPOINTS.ASSIGNMENTS;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
      const text = await res.text();
      let json: unknown;
      try { json = JSON.parse(text); } catch { json = { raw: text }; }
      if (!res.ok) {
        const requestId = res.headers.get('x-request-id') || res.headers.get('x-requestid') || undefined
        const status = res.status
        // Try to normalize common error shapes
        const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
        let detail: string | undefined
        if (isRecord(json)) {
          if (typeof json.error === 'string') detail = json.error
          else if (typeof json.message === 'string') detail = json.message
          else if (isRecord(json.error) && typeof json.error.message === 'string') detail = json.error.message
        }
        const errors: Record<string, string | string[]> | undefined = (isRecord(json) && json.errors && typeof json.errors === 'object' ? (json.errors as Record<string, string | string[]>) : undefined)
        // Bubble up additional hints/code/docs when provided
        const code = isRecord(json) ? (typeof json.code === 'string' ? json.code : (isRecord(json.error) && typeof json.error.code === 'string' ? json.error.code : undefined)) : undefined
        const hint = isRecord(json) ? (typeof json.hint === 'string' ? json.hint : (isRecord(json.error) && typeof json.error.hint === 'string' ? json.error.hint : undefined)) : undefined
        const docs_url = isRecord(json) ? (typeof json.docs_url === 'string' ? json.docs_url : (isRecord(json.error) && typeof json.error.docs_url === 'string' ? json.error.docs_url : undefined)) : undefined
        setApiError({
          status,
          title: `${status} ${res.statusText}`,
          requestId,
          errors,
          detail,
          code,
          hint,
          docs_url,
          raw: text,
          parsed: json,
        })
        throw new Error(detail || `Request failed (${status})`);
      }
      setResult(json as unknown);
      if (!dryRun && (json as Partial<AssignmentCreateResponse>).assignment_id) {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-none p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Assignments Builder</h1>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {/* Left pane: Builder */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Teacher application_user_id</label>
                <input value={applicationUserId} onChange={e => setApplicationUserId(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" placeholder="teacher-123" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Name (optional)</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Idempotency-Key (optional)</label>
                <input value={idempotencyKey} onChange={e => setIdempotencyKey(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" placeholder="uuid" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input id="dryrun" type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} />
              <label htmlFor="dryrun" className="text-sm text-slate-700 dark:text-slate-300">Dry run (validate only)</label>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Activities</h2>
                <button onClick={addActivity} className="px-3.5 py-2 border rounded-md">Add Activity</button>
              </div>
            {/* Top-level standard selection */}
            <div className="mb-5">
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Assignment Standard (optional)</label>
              {topLevelStandard?.id ? (
                <div className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden flex items-center">
                  {topLevelStandard.image_url ? (
                    <img src={topLevelStandard.image_url} alt="" className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-md" />
                  ) : (
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 rounded-md">STD</div>
                  )}
                  <div className="flex-1 p-2">
                    <div className="text-sm font-medium line-clamp-1" title={topLevelStandard.label || `Standard #${topLevelStandard.id}`}>{topLevelStandard.code ? `${topLevelStandard.code} • ` : ''}{topLevelStandard.label || `Standard #${topLevelStandard.id}`}</div>
                    <div className="text-xs text-gray-500">ID: {topLevelStandard.id}</div>
                  </div>
                  <div className="pr-2 flex gap-2">
                    <button onClick={() => setStdPickerOpenForIndex(-1)} className="text-xs px-2.5 py-1.5 border rounded-md">Change</button>
                    <button onClick={() => setTopLevelStandard(null)} className="text-xs px-2.5 py-1.5 border rounded-md text-red-600">Clear</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={topLevelStandard?.id ? String(topLevelStandard.id) : ''} onChange={e => setTopLevelStandard(e.target.value ? { id: Number(e.target.value) } : null)} className="flex-1 px-2 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" placeholder="applies when activity has no standard_id" />
                  <button onClick={() => setStdPickerOpenForIndex(-1)} className="px-3.5 py-2 border rounded-md">Pick…</button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: activities editor */}
              <div className="lg:col-span-7 space-y-5">
                {activities.map((a, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-5 items-start">
                  <div className="md:col-span-3">
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Content</label>
                    {activityUi[idx]?.selectedContent ? (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex items-center bg-white/90 dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-shadow px-2 py-2">
                        <img src={activityUi[idx]!.selectedContent!.thumbnail_url} alt="" className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-md" />
                        <div className="flex-1 p-2">
                          <div className="text-sm font-medium line-clamp-1 text-slate-900 dark:text-slate-100" title={activityUi[idx]!.selectedContent!.name}>{activityUi[idx]!.selectedContent!.name}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">{activityUi[idx]!.selectedContent!.game_type} • {activityUi[idx]!.selectedContent!.content_type}</div>
                        </div>
                        <div className="pr-2 flex gap-2">
                          <button
                            onClick={() => setPickerOpenForIndex(idx)}
                            className="text-xs px-2.5 py-1.5 border rounded-md"
                          >Change</button>
                          <button
                            onClick={() => { setActivityUiState(idx, { selectedContent: null }); updateActivity(idx, { content_id: '' }); }}
                            className="text-xs px-2.5 py-1.5 border rounded-md text-red-600"
                          >Clear</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPickerOpenForIndex(idx)}
                          className="px-3.5 py-2 border rounded-md"
                        >Select Content…</button>
                        <input
                          value={a.content_id || ''}
                          onChange={e => updateActivity(idx, { content_id: e.target.value })}
                          className="flex-1 px-2 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                          placeholder="or paste an ID"
                        />
                      </div>
                    )}
                    {activityUi[idx]?.loadingContent && <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">Loading content…</div>}
                    {activityUi[idx]?.error && <div className="text-xs text-red-600 mt-2">{activityUi[idx]?.error}</div>}
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Standard (optional)</label>
                    {a.standard_id ? (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex items-center bg-white/90 dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-shadow px-2 py-2">
                        {a.standard_image_url ? (
                          <img src={a.standard_image_url} alt="" className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-md" />
                        ) : (
                          <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 rounded-md">STD</div>
                        )}
                        <div className="flex-1 p-2">
                          <div className="text-sm font-medium line-clamp-1" title={a.standard_label || `Standard #${a.standard_id}`}>{a.standard_code ? `${a.standard_code} • ` : ''}{a.standard_label || `Standard #${a.standard_id}`}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">ID: {a.standard_id}</div>
                        </div>
                        <div className="pr-2 flex gap-2">
                          <button onClick={() => setStdPickerOpenForIndex(idx)} className="text-xs px-2.5 py-1.5 border rounded-md">Change</button>
                          <button onClick={() => updateActivity(idx, { standard_id: '', standard_label: '', standard_code: '', standard_image_url: '' })} className="text-xs px-2.5 py-1.5 border rounded-md text-red-600">Clear</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input value={a.standard_id || ''} onChange={e => updateActivity(idx, { standard_id: e.target.value })} className="flex-1 px-2 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" placeholder="defaults to game’s standard" />
                        <button onClick={() => setStdPickerOpenForIndex(idx)} className="px-3.5 py-2 border rounded-md">Pick…</button>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-6 flex justify-end">
                    <button onClick={() => removeActivity(idx)} className="text-sm text-red-600 hover:text-red-700">Remove</button>
                  </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
          
          {/* Right pane: API Raw */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700 p-5 shadow-sm space-y-3">
            <h3 className="font-semibold">API Request & Response</h3>
            <div className="text-xs text-slate-600 dark:text-slate-400">POST <code className="font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700">{upstreamUrl}</code></div>
            <div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Headers</div>
              <pre className="text-xs overflow-auto bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 p-3 rounded border border-slate-200 dark:border-slate-700">{JSON.stringify(requestPreview.headers, null, 2)}</pre>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Body</div>
              <pre className="text-xs overflow-auto bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 p-3 rounded border border-slate-200 dark:border-slate-700">{JSON.stringify(requestPreview.body, null, 2)}</pre>
            </div>
            {apiError && (
              <div className="rounded-md border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 space-y-2">
                <div className="text-sm font-semibold">Request failed: {apiError.title}</div>
                {apiError.requestId && (
                  <div className="text-xs">Request-ID: <code className="font-mono">{apiError.requestId}</code></div>
                )}
                {apiError.detail && <div className="text-xs">{apiError.detail}</div>}
                {(apiError.code || apiError.hint || apiError.docs_url) && (
                  <div className="text-xs space-y-1">
                    {apiError.code && <div><span className="font-medium">Code:</span> <code className="font-mono">{apiError.code}</code></div>}
                    {apiError.hint && <div><span className="font-medium">Hint:</span> {apiError.hint}</div>}
                    {apiError.docs_url && <div><a className="text-blue-700 underline" href={apiError.docs_url} target="_blank" rel="noreferrer">Docs</a></div>}
                  </div>
                )}
                {apiError.errors && (
                  <div className="text-xs">
                    <div className="font-medium mb-1">Errors</div>
                    <ul className="list-disc pl-5 space-y-0.5">
                      {Object.entries(apiError.errors).map(([field, msg]) => {
                        const message = Array.isArray(msg) ? msg.join(', ') : String(msg);
                        return <li key={field}><code className="font-mono">{field}</code>: {message}</li>;
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">curl</div>
              <pre className="text-xs overflow-auto bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 p-3 rounded border border-slate-200 dark:border-slate-700">{curlSnippet}</pre>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={create} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300">{loading ? 'Submitting…' : 'Send Request'}</button>
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
            {result !== null && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Response</div>
                <pre className="text-xs overflow-auto bg-gray-50 dark:bg-slate-900/60 p-3 rounded border border-slate-200 dark:border-slate-700">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Assignment details stays below */}
        {assignment && (
          <div className="bg-white border rounded p-4 space-y-3 mt-6">
            <div className="flex items-center gap-2">
              {(['default','activity','activity_by_player','player','standard','standard_by_student'] as const).map(v => (
                <button key={v} onClick={async () => {
                  setDetailView(v);
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
          preselectDefaultStandard(idx, picked.id);
          setPickerOpenForIndex(null);
        }}
      />
      <StandardPickerModal
        open={stdPickerOpenForIndex !== null}
        onClose={() => setStdPickerOpenForIndex(null)}
        onSelect={(std) => {
          if (stdPickerOpenForIndex === null) return
          if (stdPickerOpenForIndex === -1) {
            setTopLevelStandard({ id: std.id, label: std.label, code: (std as { code?: string }).code, image_url: (std as { image_url?: string }).image_url })
          } else {
            const idx = stdPickerOpenForIndex
            updateActivity(idx, { standard_id: String(std.id), standard_label: std.label, standard_code: (std as { code?: string }).code, standard_image_url: (std as { image_url?: string }).image_url })
          }
          setStdPickerOpenForIndex(null)
        }}
      />
    </div>
  );
}


