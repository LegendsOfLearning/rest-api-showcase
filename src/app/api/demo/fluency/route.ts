import { NextRequest, NextResponse } from 'next/server';
import { demoApi } from '@/lib/demo/client';
import { isPreset, presets, summarize, type ReportPlayer } from '@/lib/demo/fluency';
import { newSession, readSession, signSession, type DemoSession } from '@/lib/demo/session';
export const runtime = 'nodejs';
const cookie = '__Host-fluency-demo';
// A small burst guard supplements the persistent 200-learner application cap.
const requests = new Map<string, { count: number; until: number }>();
function allowed(request: NextRequest) {
  const key = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? 'local';
  const now = Date.now();
  for (const [k, v] of requests) if (v.until < now) requests.delete(k);
  if (requests.size > 1000) return false;
  const entry = requests.get(key) ?? { count: 0, until: now + 60000 };
  requests.set(key, entry);
  return ++entry.count <= 20;
}
function reply(body: unknown, session?: DemoSession, status = 200) {
  const response = NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
  if (session) response.cookies.set(cookie, signSession(session), { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: Math.max(0, Math.floor((session.expires - Date.now()) / 1000)) });
  return response;
}
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return reply({ message: 'Open the demo on this site to continue.' }, undefined, 403);
  if (!allowed(request)) return reply({ message: 'Please wait a minute before trying again.' }, undefined, 429);
  if (Number(request.headers.get('content-length')) > 1024) return reply({ message: 'Request too large.' }, undefined, 413);
  try {
    if (!process.env.FLUENCY_DEMO_SESSION_SECRET) return reply({ message: 'The demo is being prepared. Please try again shortly.' }, undefined, 503);
    const text = await request.text();
    if (text.length > 1024) return reply({ message: 'Request too large.' }, undefined, 413);
    const input = JSON.parse(text);
    if (!['preview', 'launch', 'results'].includes(input.action)) return reply({ message: 'Choose a demo step.' }, undefined, 400);
    let session = readSession(request.cookies.get(cookie)?.value);
    if (input.action === 'results') {
      if (!session?.assignment) return reply({ message: 'Launch a practice session first.' }, undefined, 409);
      const data = await demoApi(`/assignments/${session.assignment}?view=player&include=activities,players&page=1&page_size=100`);
      const envelope = data.players as { entries?: ReportPlayer[] } | undefined;
      const players = (envelope?.entries ?? []).filter(p => p.id === `fluency-demo-${session!.id}-student`);
      return reply({ assignmentId: session.assignment, summary: summarize(players), players }, session);
    }
    const preset: unknown = input.preset;
    if (!isPreset(preset)) return reply({ message: 'Choose an example.' }, undefined, 400);
    if (input.action === 'launch' && !session) return reply({ message: 'Preview the fact pool first.' }, undefined, 409);
    session ??= newSession();
    if (session.preset && session.preset !== input.preset && session.assignment) return reply({ message: 'This practice session already has an assignment. Finish it before starting a new example in a private window.' }, session, 409);
    const teacher = `fluency-demo-${session.id}-teacher`, student = `fluency-demo-${session.id}-student`;
    if (input.action === 'launch' && !session.assignment) {
      const limit = await demoApi('/users?role=student&page=201&page_size=1');
      if (!Array.isArray(limit) || limit.length) return reply({ message: 'The demo has reached its capacity. Please contact the Legends API team.' }, session, 429);
    }
    // Set identities first, using idempotent user upserts; no emails or real learner data.
    if (input.action === 'launch') await demoApi('/users', { application_user_id: teacher, role: 'teacher', first_name: 'Demo', last_name: 'Teacher' });
    const now = new Date(), end = new Date(session.expires);
    const assignment = { application_user_id: teacher, name: 'Fluency API demo', start_date: now.toISOString(), end_date: end.toISOString(), activities: [presets[preset].activity] };
    if (input.action === 'preview') {
      const data = await demoApi('/assignments', { ...assignment, application_user_id: 'fluency-demo-preview-teacher', dry_run: true });
      return reply({ activities: data.activities }, session);
    }
    await demoApi('/users', { application_user_id: student, role: 'student', first_name: 'Demo', last_name: 'Learner' });
    if (!session.assignment) {
      // Stable payload and key make retries (including a lost HTTP response) safe.
      assignment.start_date = new Date(session.expires - 60 * 60 * 1000).toISOString();
      const created = await demoApi('/assignments', assignment, `fluency-demo-${session.id}-${input.preset}`);
      const id = Number(created.assignment_id);
      if (!Number.isSafeInteger(id) || id < 1) throw new Error('Invalid assignment');
      session = { ...session, assignment: id, preset: input.preset };
    }
    const join = await demoApi(`/assignments/${session.assignment}/joins`, { application_user_id: student, target: 'awakening' });
    if (typeof join.join_url !== 'string' || new URL(join.join_url).protocol !== 'https:') throw new Error('Invalid join');
    return reply({ assignmentId: session.assignment, joinUrl: join.join_url }, session);
  } catch {
    return reply({ message: 'The demo could not complete this step. Please retry.' }, undefined, 502);
  }
}
