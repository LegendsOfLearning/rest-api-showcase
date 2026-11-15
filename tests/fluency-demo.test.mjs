import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as crypto from 'node:crypto';
function load(file, imports = {}, globals = {}) {
  const code = ts.transpileModule(readFileSync(new URL('../'+file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: n => { if (!(n in imports)) throw Error(n); return imports[n]; }, Buffer, Date, URL, URLSearchParams, AbortSignal, process: { env: { FLUENCY_DEMO_SESSION_SECRET: 'fake-test-signing-secret-with-enough-characters' } }, ...globals });
  return exports;
}
const sessions = load('src/lib/demo/session.ts', { 'node:crypto': crypto });
const fluency = load('src/lib/demo/fluency.ts');
test('signed session rejects tampering, expiry and extra token segments', () => {
  const a = sessions.newSession(), b = sessions.newSession();
  assert.notEqual(a.id, b.id);
  const signed = sessions.signSession({ ...a, assignment: 123 });
  assert.equal(sessions.readSession(signed).assignment, 123);
  assert.equal(sessions.readSession(signed+'x'), null);
  assert.equal(sessions.readSession(signed+'.extra'), null);
  assert.equal(sessions.readSession(sessions.signSession({ ...a, expires: Date.now()-1 })), null);
  const [body, sig] = signed.split('.');
  assert.equal(sessions.readSession(Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body,'base64url')), assignment: 456 })).toString('base64url')+'.'+sig), null);
});
test('reports keep missing values distinct from zero and calculate weighted accuracy', () => {
  assert.equal(fluency.summarize([]).answered, null);
  assert.equal(fluency.summarize([{ id: 's', activities: [{ id: 1, total_answered: 0, total_correct: 0 }] }]).percentCorrect, null);
  const summary = fluency.summarize([{ id: 's', activities: [{ id: 1, total_answered: 2, total_correct: 1 }, { id: 1, total_answered: 8, total_correct: 8 }] }]);
  assert.equal(summary.answered, 10); assert.equal(summary.percentCorrect, 90); assert.equal(summary.completedPlayers, 0);
});
function route(api) {
  return load('src/app/api/demo/fluency/route.ts', {
    'next/server': { NextResponse: { json(body, options) { return { body, status: options.status, cookies: { set() {} } }; } } },
    '@/lib/demo/client': { demoApi: api }, '@/lib/demo/fluency': fluency, '@/lib/demo/session': sessions,
  });
}
function request(body, cookie, origin = 'https://demo.example') {
  return { headers: new Headers({ origin }), nextUrl: new URL('https://demo.example/api/demo/fluency'), cookies: { get: () => cookie ? { value: cookie } : undefined }, text: async () => JSON.stringify(body) };
}
test('cross-site and unsigned launch cannot write to the API', async () => {
  let calls = 0; const r = route(async () => { calls++; });
  assert.equal((await r.POST(request({ action: 'launch', preset: 'family' }, undefined, 'https://evil.example'))).status, 403);
  assert.equal((await r.POST(request({ action: 'launch', preset: 'family' }))).status, 409);
  assert.equal(calls, 0);
});
test('results ignore requested IDs and exclude another visitor', async () => {
  const s = { ...sessions.newSession(), assignment: 123 };
  const paths = [];
  const r = route(async path => { paths.push(path); return { players: { entries: [{ id: `fluency-demo-${s.id}-student`, activities: [{ id: 1, total_answered: 3, total_correct: 2 }] }, { id: 'other-student', activities: [{ id: 1, total_answered: 100 }] }] } }; });
  const result = await r.POST(request({ action: 'results', assignment: 999 }, sessions.signSession(s)));
  assert.equal(result.status, 200); assert.match(paths[0], /^\/assignments\/123\?/); assert.equal(result.body.summary.answered, 3); assert.equal(result.body.players.length, 1);
});
test('preview uses fixed selectors and does not create per-visitor users', async () => {
  const calls = [];
  const r = route(async (path, body) => { calls.push({ path, body }); return { activities: [] }; });
  const result = await r.POST(request({ action: 'preview', preset: 'family', activities: [{ type: 'arbitrary' }] }));
  assert.equal(result.status, 200); assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/assignments'); assert.equal(calls[0].body.dry_run, true);
  assert.equal(calls[0].body.activities[0].type, 'awakening_fluency');
  assert.match(calls[0].body.start_date, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(calls[0].body.end_date, /^\d{4}-\d{2}-\d{2}$/);
});
test('API failures never return upstream credentials or launch URLs', async () => {
  const sentinel = 'fake-private-token-and-launch-url';
  const r = route(async () => { throw Error(sentinel); });
  const result = await r.POST(request({ action: 'preview', preset: 'family' }));
  assert.equal(result.status, 502); assert.ok(!JSON.stringify(result).includes(sentinel));
});
