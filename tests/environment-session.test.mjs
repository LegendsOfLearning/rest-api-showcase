import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, imports = {}, globals = {}) {
  const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require(name) { if (!(name in imports)) throw new Error('Unexpected import: ' + name); return imports[name]; }, URL, URLSearchParams, process: { env: { NODE_ENV: 'production' } }, console: { log() {}, error() {} }, ...globals });
  return exports;
}

const environment = load('src/lib/api/environment.ts');
const bases = { defaultShowcaseEnvironment: () => 'production', legendsApiBaseUrl: (env) => environment.showcaseApiBases[environment.parseShowcaseEnvironment(env)] };
function responseMock() {
  return { NextResponse: { json(body, options = {}) { return { body, status: options.status ?? 200, cookies: { values: {}, deleted: [], set(name, value, flags) { this.values[name] = { value, flags }; }, delete(name) { this.deleted.push(name); } } }; } } };
}
function route(file, fetch) {
  return load(file, { 'next/server': responseMock(), '@/lib/server/api-base': bases, '@/lib/api/environment': environment }, { fetch });
}
const request = (body) => ({ json: async () => body });

for (const bad of ['https://example.com/api', 'https://api.smartlittlecookies.com/api', 'STAGING', '', null, {}, 'production/../staging']) {
  test('reject untrusted environment ' + JSON.stringify(bad), () => assert.throws(() => environment.parseShowcaseEnvironment(bad)));
}
test('staging login mints against only staging and binds both cookies', async () => {
  const urls = [];
  const api = route('src/app/api/auth/login/route.ts', async (url) => { urls.push(url); return { ok: true, json: async () => ({ access_token: 'fake-staging-token' }) }; });
  const result = await api.POST(request({ client_id: 'fake-client', client_secret: 'fake-secret', environment: 'staging' }));
  assert.equal(result.status, 200);
  assert.deepEqual(urls, ['https://api.smartlittlecookies.com/api/v3/oauth2/token']);
  assert.equal(result.cookies.values.auth_token.value, 'fake-staging-token');
  assert.equal(result.cookies.values.showcase_environment.value, 'staging');
  assert.equal(result.cookies.values.showcase_environment.flags.httpOnly, true);
});
test('invalid environment cannot trigger an upstream credential request', async () => {
  let calls = 0;
  const api = route('src/app/api/auth/login/route.ts', async () => { calls++; });
  const result = await api.POST(request({ client_id: 'fake-client', client_secret: 'fake-secret', environment: 'https://example.com' }));
  assert.equal(result.status, 400);
  assert.equal(calls, 0);
});
test('production failure never retries credentials against staging', async () => {
  const urls = [];
  const api = route('src/app/api/auth/login/route.ts', async (url) => { urls.push(url); return { ok: false, status: 422 }; });
  const result = await api.POST(request({ client_id: 'fake-client', client_secret: 'fake-secret', environment: 'production' }));
  assert.equal(result.status, 422);
  assert.deepEqual(urls, ['https://api.legendsoflearning.com/api/v3/oauth2/token']);
  assert.deepEqual(Object.keys(result.cookies.values), []);
});
test('SSO validates token and expected application in the selected environment', async () => {
  const urls = [];
  const api = route('src/app/api/auth/session/route.ts', async (url) => { urls.push(url); return { ok: true, json: async () => ({ id: 26 }) }; });
  const result = await api.POST(request({ access_token: 'fake-staging-token', environment: 'staging', application_id: '26' }));
  assert.equal(result.status, 200);
  assert.deepEqual(urls, ['https://api.smartlittlecookies.com/api/v3/applications/me']);
  assert.equal(result.cookies.values.showcase_environment.value, 'staging');
});
test('wrong-environment SSO denies without host fallback or cookies', async () => {
  const urls = [];
  const api = route('src/app/api/auth/session/route.ts', async (url) => { urls.push(url); return { ok: false, status: 401 }; });
  const result = await api.POST(request({ access_token: 'fake-staging-token', environment: 'production', application_id: 26 }));
  assert.equal(result.status, 401);
  assert.deepEqual(urls, ['https://api.legendsoflearning.com/api/v3/applications/me']);
  assert.deepEqual(Object.keys(result.cookies.values), []);
});
test('SSO for another application never sets an authenticated session', async () => {
  const api = route('src/app/api/auth/session/route.ts', async () => ({ ok: true, json: async () => ({ id: 17 }) }));
  const result = await api.POST(request({ access_token: 'fake-token', environment: 'production', application_id: 26 }));
  assert.equal(result.status, 401);
  assert.deepEqual(Object.keys(result.cookies.values), []);
});
test('session upstream preserves legacy configuration and rejects invalid explicit cookies', async () => {
  let cookie;
  const api = load('src/lib/server/api-base.ts', { 'next/headers': { cookies: async () => ({ get: () => cookie }) }, '@/lib/api/environment': environment, process: { cwd: () => '/task' } }, { process: { env: { NODE_ENV: 'production', LEGENDS_API_URL: 'https://api.legendsoflearning.com/api' } } });
  assert.equal(await api.sessionApiBaseUrl(), 'https://api.legendsoflearning.com/api');
  cookie = { value: 'staging' };
  assert.equal(await api.sessionApiBaseUrl(), 'https://api.smartlittlecookies.com/api');
  cookie = { value: 'https://example.com' };
  await assert.rejects(() => api.sessionApiBaseUrl());
});

test('browser logout clears cookies without revoking a potentially shared token', async () => {
  let calls = 0;
  const api = route('src/app/api/auth/logout/route.ts', async () => { calls++; });
  const response = await api.POST();
  assert.equal(response.status, 200);
  assert.deepEqual(Array.from(response.cookies.deleted), ['auth_token', 'showcase_environment']);
  assert.equal(calls, 0);
});
