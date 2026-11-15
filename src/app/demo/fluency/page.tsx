'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { presets, example, isPreset, type Preset, type summarize } from '@/lib/demo/fluency';
type Fact = { a: number; b: number; op: string };
const symbols: Record<string, string> = { add: '+', sub: '−', mul: '×', div: '÷' };
export default function FluencyDemo() {
  const [preset, setPreset] = useState<Preset>('family');
  const [facts, setFacts] = useState<Fact[] | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [assignmentId, setAssignmentId] = useState<number>();
  const [summary, setSummary] = useState<ReturnType<typeof summarize> | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/demo/fluency', { cache: 'no-store' }).then(r => r.json()).then(data => {
      if (active && data.assignmentId && isPreset(data.preset)) {
        setPreset(data.preset); setAssignmentId(data.assignmentId);
        setFacts([]);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  const payload = JSON.stringify(example(preset), null, 2);
  const curl = `# Set TOKEN to your own application access token.\n# Replace the two date placeholders with YYYY-MM-DD dates.\ncurl https://api.legendsoflearning.com/api/v3/assignments \\\n  -H "Authorization: Bearer $TOKEN" \\\n  -H 'Content-Type: application/json' \\\n  -H 'Idempotency-Key: my-fluency-example-1' \\\n  --data '${payload}'`;
  async function step(action: string) {
    setBusy(action); setError('');
    try {
      const response = await fetch('/api/demo/fluency', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, preset }), cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (action === 'preview') setFacts(data.activities?.[0]?.fluency_facts ?? []);
      if (action === 'launch') { setJoinUrl(data.joinUrl); setAssignmentId(data.assignmentId); }
      if (action === 'results') setSummary(data.summary);
    } catch (e) { setError(e instanceof Error ? e.message : 'Please retry.'); }
    finally { setBusy(''); }
  }
  function download() {
    const script = `#!/usr/bin/env python3\n"""Run with your own app token and existing teacher: TOKEN=... TEACHER_ID=... python3 fluency-demo.py"""\nimport os, json, urllib.request, datetime, uuid\nbody = json.loads(${JSON.stringify(payload)})\nnow = datetime.datetime.now(datetime.timezone.utc)\nbody.update(application_user_id=os.environ['TEACHER_ID'], start_date=now.date().isoformat(), end_date=(now+datetime.timedelta(days=1)).date().isoformat())\nbody['dry_run'] = True  # Change to False to create an assignment.\nrequest = urllib.request.Request('https://api.legendsoflearning.com/api/v3/assignments', data=json.dumps(body).encode(), headers={'Authorization': 'Bearer '+os.environ['TOKEN'], 'Content-Type': 'application/json', 'Idempotency-Key': str(uuid.uuid4())})\nwith urllib.request.urlopen(request) as response:\n    print(json.dumps(json.load(response), indent=2))\n`;
    const url = URL.createObjectURL(new Blob([script], { type: 'text/x-python' }));
    const a = document.createElement('a'); a.href = url; a.download = 'fluency-demo.py'; a.click(); URL.revokeObjectURL(url);
  }
  const button = 'rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-40 hover:bg-indigo-700 transition';
  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><Link href="/demo/fluency" className="font-bold tracking-tight">Legends of Learning <span className="ml-2 hidden font-normal text-slate-500 sm:inline">/ API demos</span></Link><Link href="/docs" className="shrink-0 text-sm font-semibold text-indigo-600">Integration guide ↗</Link></div></header>
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Live production demo · synthetic learner</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">From facts to fluency.</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">Preview a fact pool, launch practice in Awakening, then check the answers your learner actually recorded. No API credentials needed.</p>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-xl font-bold"><span className="mr-3 text-indigo-600">01</span>Choose the practice</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">{(Object.keys(presets) as Preset[]).map(key => <button key={key} disabled={!!assignmentId || !!busy} onClick={() => { setPreset(key); setFacts(null); }} aria-pressed={preset === key} className={`rounded-xl border p-4 text-left text-sm font-semibold disabled:opacity-60 ${preset === key ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-200 hover:border-indigo-300'}`}>{presets[key].label}</button>)}</div>
          <p className="mt-4 text-sm text-slate-500">Families include inverse facts. Ranges include both operand endpoints. Exact facts stay exactly as supplied.</p>
          <button className={`${button} mt-6`} disabled={!!busy || !!assignmentId} onClick={() => step('preview')}>{busy === 'preview' ? 'Previewing…' : 'Preview fact pool'}</button>
          {facts && <div className="mt-6"><p className="mb-3 text-sm font-semibold">{facts.length} facts returned by the API</p><div className="flex max-h-64 flex-wrap gap-2 overflow-auto">{facts.map((f, i) => <span key={i} className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm">{f.a} {symbols[f.op] ?? f.op} {f.b}</span>)}</div></div>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold"><span className="mr-3 text-indigo-600">02</span>Play it</h2>
          <p className="mt-5 text-sm leading-6 text-slate-600">Create a private demo learner and a practice assignment. Your demo session lasts one hour. First-time learners may need to complete Awakening setup before practice.</p>
          <button className={`${button} mt-6 w-full`} disabled={(!facts?.length && !assignmentId) || !!busy} onClick={() => step('launch')}>{busy === 'launch' ? 'Preparing…' : assignmentId ? 'Refresh play link' : 'Prepare practice'}</button>
          {joinUrl && <a href={joinUrl} target="_blank" rel="noreferrer noopener" className="mt-3 block rounded-xl bg-emerald-600 px-5 py-3 text-center font-semibold text-white">Open Awakening ↗</a>}
          <p className="mt-4 text-xs leading-5 text-slate-500">Keep this page open to check results. Play links are private and expire; refresh the link if needed.</p>
        </section>
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-bold"><span className="mr-3 text-indigo-600">03</span>See real results</h2><button className={button} disabled={!assignmentId || !!busy} onClick={() => step('results')}>{busy === 'results' ? 'Checking…' : 'Refresh results'}</button></div>
        {!summary || !summary.answered ? <p className="mt-5 text-slate-500">No answers recorded yet. Play a few questions, then refresh. Results can take a moment to appear.</p> : <div className="mt-6 grid grid-cols-3 gap-4">{[['Answered', summary.answered], ['Correct', summary.correct ?? '—'], ['Accuracy', summary.percentCorrect === null ? '—' : `${summary.percentCorrect}%`]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</div>}
        {assignmentId && <p className="mt-4 text-xs text-slate-400">Assignment {assignmentId} · Results are scoped to your demo learner.</p>}
      </section>
      <section className="mt-10"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-bold">Build the same flow</h2><p className="mt-2 text-sm text-slate-500">Use your own teacher and token. The example matches your selected practice.</p></div><div className="flex gap-3"><button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={async () => { try { await navigator.clipboard.writeText(curl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setError('Select and copy the example below.'); } }}>{copied ? 'Copied' : 'Copy cURL'}</button><button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={download}>Download Python</button></div></div><pre className="mt-5 max-h-96 overflow-auto rounded-2xl bg-slate-900 p-6 text-xs leading-6 text-slate-100">{curl}</pre><p className="mt-3 text-sm text-slate-500">Python runs a dry-run preview by default. The <Link className="text-indigo-600 underline" href="/docs#fluency-assignments">integration guide</Link> covers user creation, assignment joins, and reporting.</p></section>
    </div>
  </main>;
}
