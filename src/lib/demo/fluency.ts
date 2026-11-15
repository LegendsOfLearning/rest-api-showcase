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
export function example(preset: Preset) {
  return { application_user_id: 'demo-teacher', name: 'Fluency API demo', start_date: 'REPLACE_START_DATE', end_date: 'REPLACE_END_DATE', activities: [presets[preset].activity] };
}
