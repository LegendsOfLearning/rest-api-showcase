'use client'

import { useState } from 'react'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export default function StudentsPage() {
  const [applicationUserId, setApplicationUserId] = useState('')
  const [view, setView] = useState<'assignment' | 'standard'>('assignment')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<unknown>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const base = API_ENDPOINTS.STUDENT(applicationUserId)
      const url = view ? `${base}?view=${view}` : base
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Students</h1>

        <div className="card space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm text-foreground mb-1">application_user_id</label>
              <input value={applicationUserId} onChange={e => setApplicationUserId(e.target.value)} className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground" placeholder="student-123" />
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1">View</label>
              <select value={view} onChange={e => setView(e.target.value as 'assignment' | 'standard')} className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground">
                <option value="assignment">by assignment</option>
                <option value="standard">by standard</option>
              </select>
            </div>
            <div className="flex md:justify-end">
              <button onClick={fetchData} disabled={!applicationUserId || loading} className="px-4 py-2 bg-accent text-on-accent rounded disabled:bg-surface-200 disabled:text-muted">{loading ? 'Loading…' : 'Fetch'}</button>
            </div>
          </div>
          {error && <div className="text-sm text-error">{error}</div>}
        </div>

        {result != null ? (
          <div className="card">
            <h3 className="font-semibold mb-2">Response</h3>
            <pre className="overflow-auto rounded bg-surface-100 p-3 text-xs text-foreground">{JSON.stringify(result, null, 2)}</pre>
          </div>
        ) : null}
      </div>
    </div>
  )
}

