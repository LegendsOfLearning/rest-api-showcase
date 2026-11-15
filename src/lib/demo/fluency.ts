export const presets = {
  family: { label: 'Multiplication family', activity: { type: 'awakening_fluency', fluency_fact_families: [{ a: 3, b: 9, op: 'mul' }] } },
  range: { label: 'Addition range · 0–5', activity: { type: 'awakening_fluency', fluency_fact_ranges: [{ op: 'add', min: 0, max: 5 }] } },
  exact: { label: 'Three exact facts', activity: { type: 'awakening_fluency', fluency_facts: [{ a: 2, b: 3, op: 'add' }, { a: 7, b: 4, op: 'sub' }, { a: 3, b: 9, op: 'mul' }] } },
} as const;
export type Preset = keyof typeof presets;
export function isPreset(value: unknown): value is Preset { return typeof value === 'string' && Object.hasOwn(presets, value); }
export type ReportActivity = { id: number; total_answered?: number | null; total_correct?: number | null; reported_playtime_sec?: number | null; started_at?: string | null; completed_at?: string | null };
export type ReportPlayer = { id: string; activities?: ReportActivity[] };
export function summarize(players: ReportPlayer[]) {
  const activities = players.flatMap(p => p.activities ?? []);
  const sum = (field: 'total_answered' | 'total_correct' | 'reported_playtime_sec') => {
    const values = activities.map(a => a[field]).filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0);
    return values.length && values.length === activities.length ? values.reduce((a, b) => a + b, 0) : null;
  };
  const answered = sum('total_answered'), correct = sum('total_correct');
  return { answered, correct, percentCorrect: answered !== null && answered > 0 && correct !== null ? Math.round(correct / answered * 100) : null,
    playtimeSec: sum('reported_playtime_sec'), players: players.length,
    completedPlayers: players.filter(p => p.activities?.length && p.activities.every(a => a.completed_at)).length };
}
export function example(practice: Practice) {
  return { application_user_id: 'demo-teacher', name: 'Fluency API demo', start_date: 'REPLACE_START_DATE', end_date: 'REPLACE_END_DATE', activities: [practiceActivity(practice)] };
}

export type PracticeFact = { a: number; b: number; op: 'add' | 'sub' | 'mul' | 'div' };
export type PracticeRange = { op: 'add' | 'mul'; min: number; max: number };
export type Practice = { mode: 'exact' | 'family'; facts: PracticeFact[] } | { mode: 'range'; ranges: PracticeRange[] };
export function defaultPractice(preset: Preset): Practice {
  if (preset === 'range') return { mode: 'range', ranges: presets.range.activity.fluency_fact_ranges.map(r => ({ ...r })) };
  return { mode: preset, facts: (preset === 'family' ? presets.family.activity.fluency_fact_families : presets.exact.activity.fluency_facts).map(f => ({ ...f })) };
}
export function parsePractice(value: unknown): Practice {
  if (!value || typeof value !== 'object') throw new Error('Choose exact facts, families, or ranges.');
  const input = value as Record<string, unknown>;
  if (!['exact', 'family', 'range'].includes(String(input.mode))) throw new Error('Choose exact facts, families, or ranges.');
  const rows = input.mode === 'range' ? input.ranges : input.facts;
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 20) throw new Error('Enter between 1 and 20 rows.');
  const integer = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 144;
  if (input.mode === 'range') return { mode: 'range', ranges: rows.map(r => {
    if (!r || !['add', 'mul'].includes(r.op) || !integer(r.min) || !integer(r.max) || r.min > r.max || r.max > (r.op === 'add' ? 10 : 12)) throw new Error('Ranges need inclusive bounds: addition 0–10 or multiplication 0–12, with minimum ≤ maximum.');
    return { op: r.op, min: r.min, max: r.max };
  }) };
  return { mode: input.mode as 'exact' | 'family', facts: rows.map(r => {
    if (!r || !['add', 'sub', 'mul', 'div'].includes(r.op) || !integer(r.a) || !integer(r.b)) throw new Error('Facts need an operator and whole-number operands from 0 to 144.');
    if (r.op === 'div' && (r.b === 0 || r.a % r.b !== 0)) throw new Error('Division needs a nonzero divisor and a whole-number answer.');
    if (r.op === 'sub' && r.a < r.b) throw new Error('Subtraction needs a nonnegative answer.');
    return { a: r.a, b: r.b, op: r.op };
  }) };
}
export function practiceActivity(practice: Practice) {
  if (practice.mode === 'range') return { type: 'awakening_fluency', fluency_fact_ranges: practice.ranges };
  if (practice.mode === 'family') return { type: 'awakening_fluency', fluency_fact_families: practice.facts };
  return { type: 'awakening_fluency', fluency_facts: practice.facts };
}
