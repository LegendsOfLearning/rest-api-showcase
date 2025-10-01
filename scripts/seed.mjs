/*
 Seed script for Legends REST API Showcase

 This script:
 - Obtains an OAuth2 access token using CLIENT_ID/CLIENT_SECRET
 - Creates one teacher and 20-30 students
 - Picks a few activities (standards and content) and creates an assignment
 - Creates join links for each student

 Requirements (env):
 - LEGENDS_API_URL (e.g. https://api.smartlittlecookies.com/api or http://localhost:4000/api)
 - LEGENDS_API_VERSION (default v3)
 - CLIENT_ID and CLIENT_SECRET for OAuth2 client credentials

 Usage:
   npm run seed
   or
   CLIENT_ID=xxx CLIENT_SECRET=yyy LEGENDS_API_URL=http://localhost:4000/api node scripts/seed.mjs
*/

/* eslint-disable no-console */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function assertEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
}

function getEnv() {
  const apiBaseUrl = (process.env.LEGENDS_API_URL || 'https://api.smartlittlecookies.com/api').replace(/\/$/, '');
  const apiVersion = process.env.LEGENDS_API_VERSION || 'v3';
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  assertEnv('CLIENT_ID', clientId);
  assertEnv('CLIENT_SECRET', clientSecret);
  return { apiBaseUrl, apiVersion, clientId, clientSecret };
}

async function fetchToken(baseUrl, version, clientId, clientSecret) {
  const url = `${baseUrl}/${version}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  }).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to obtain token (${res.status}): ${text}`);
  }
  const data = await res.json();
  if (!data?.access_token) throw new Error('Token response missing access_token');
  return data.access_token;
}

function makeApi(baseUrl, version, accessToken) {
  const root = `${baseUrl}/${version}`;
  const authHeaders = () => ({
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });

  const get = async (path) => {
    const res = await fetch(`${root}${path}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  };
  const post = async (path, bodyObj) => {
    const res = await fetch(`${root}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(bodyObj ?? {}),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`POST ${path} failed: ${res.status} ${res.statusText} — ${text}`);
    }
    return res.json().catch(() => ({}));
  };

  return { get, post };
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(role) {
  const firsts = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Quinn', 'Avery', 'Jamie', 'Morgan', 'Cameron', 'Rowan', 'Charlie', 'Drew'];
  const lasts = ['Rivera', 'Patel', 'Nguyen', 'Smith', 'Johnson', 'Lee', "O'Neil", 'Khan', 'Garcia', 'Lopez', 'Martin', 'Kim', 'Brown', 'Clark'];
  const first = role === 'teacher' ? randomChoice(firsts) : randomChoice(firsts);
  const last = randomChoice(lasts);
  return { first, last };
}

function generateIds() {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const teacherId = `seed-teacher-${ts}-${rand}`;
  const studentId = (n) => `seed-student-${ts}-${n.toString().padStart(2, '0')}`;
  return { teacherId, studentId };
}

async function pickStandard(api) {
  const sets = await api.get(`/standard_sets?page=1&page_size=100`);
  const setEntries = Array.isArray(sets?.results) ? sets.results : [];
  if (setEntries.length === 0) throw new Error('No standard sets available to pick from');
  const set = setEntries[0];
  const standards = await api.get(`/standard_sets/${set.id}/standards?page=1&page_size=100`);
  const entries = Array.isArray(standards?.entries) ? standards.entries : [];
  if (entries.length === 0) throw new Error('No standards available in set');
  const chosen = randomChoice(entries);
  return { id: chosen.id, label: chosen.standard };
}

async function pickContent(api, limit = 5) {
  const page = await api.get(`/content?page=1&per_page=50`);
  const entries = Array.isArray(page?.entries) ? page.entries : [];
  const games = entries.filter((e) => (e?.content_type || '').toLowerCase() !== 'video');
  return games.slice(0, limit).map((e) => ({ id: e.id, name: e.game }));
}

async function createUser(api, role, first, last, applicationUserId) {
  const body = { role, first_name: first, last_name: last, application_user_id: applicationUserId };
  const user = await api.post(`/users`, body);
  return user;
}

async function main() {
  const { apiBaseUrl, apiVersion, clientId, clientSecret } = getEnv();
  console.log('[seed] Base URL:', `${apiBaseUrl}/${apiVersion}`);

  const accessToken = await fetchToken(apiBaseUrl, apiVersion, clientId, clientSecret);
  const api = makeApi(apiBaseUrl, apiVersion, accessToken);

  // Select activities
  console.log('[seed] Selecting standard and content…');
  const standard = await pickStandard(api).catch((e) => { throw new Error(`Standard selection failed: ${e.message}`); });
  const contents = await pickContent(api, 3).catch(() => []);
  console.log('[seed] Picked standard:', standard);
  console.log('[seed] Picked content ids:', contents.map((c) => c.id));

  // Create teacher
  const { teacherId, studentId } = generateIds();
  const teacherName = generateName('teacher');
  console.log('[seed] Creating teacher:', teacherId);
  const teacher = await createUser(api, 'teacher', teacherName.first, teacherName.last, teacherId);
  await sleep(100);

  // Create students
  const studentCount = Number(process.env.SEED_STUDENT_COUNT || 24);
  const createdStudents = [];
  for (let i = 0; i < studentCount; i += 1) {
    const sid = studentId(i + 1);
    const nm = generateName('student');
    try {
      const stu = await createUser(api, 'student', nm.first, nm.last, sid);
      createdStudents.push(stu);
    } catch (e) {
      console.error(`[seed] Failed to create student ${sid}:`, e.message);
    }
    await sleep(50);
  }
  console.log(`[seed] Created students: ${createdStudents.length}/${studentCount}`);

  // Create assignment with multiple activities
  const activities = [];
  if (standard?.id) activities.push({ standard_id: Number(standard.id) });
  for (const c of contents.slice(0, 2)) activities.push({ content_id: Number(c.id) });
  if (activities.length === 0) activities.push({ standard_id: Number(standard.id) });

  const assignmentName = `Seed Assignment ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;
  console.log('[seed] Creating assignment with activities:', activities);
  const assignment = await api.post(`/assignments`, {
    application_user_id: teacherId,
    name: assignmentName,
    activities,
  });
  if (!assignment?.assignment_id) {
    throw new Error('Assignment creation did not return assignment_id');
  }
  console.log('[seed] Created assignment:', assignment.assignment_id);

  // Create join links for each student
  const joinResults = [];
  for (const stu of createdStudents) {
    const aid = assignment.assignment_id;
    const url = `/assignments/${aid}/joins`;
    try {
      const jr = await api.post(url, { application_user_id: stu.application_user_id, target: 'awakening' });
      joinResults.push({ student: stu.application_user_id, join_url: jr?.join_url });
    } catch (e) {
      console.error(`[seed] Join link failed for ${stu.application_user_id}:`, e.message);
    }
    await sleep(25);
  }

  // Optional: attempt to hit a few join URLs to register session starts (best-effort)
  const pingCount = Math.min(3, joinResults.length);
  for (let i = 0; i < pingCount; i += 1) {
    const j = joinResults[i];
    if (!j.join_url || typeof j.join_url !== 'string') continue;
    try {
      await fetch(j.join_url, { method: 'GET' }).catch(() => {});
    } catch {
      // ignore
    }
  }

  console.log('\n[seed] Done. Summary:');
  console.log('  Teacher:', teacherId, `(${teacherName.first} ${teacherName.last})`);
  console.log('  Students:', createdStudents.length);
  console.log('  Assignment ID:', assignment.assignment_id);
  console.log('  Sample join URLs:');
  for (const j of joinResults.slice(0, 5)) {
    console.log('   -', j.student, '->', j.join_url || '(no url)');
  }

  console.log('\nYou can now open:');
  console.log(' - /assignments (builder) to inspect payloads');
  console.log(' - /students to query aggregates by student (use the seeded student IDs)');
  console.log(' - /standards to query aggregates by standard');
}

main().catch((err) => {
  console.error('[seed] Error:', err);
  process.exitCode = 1;
});


