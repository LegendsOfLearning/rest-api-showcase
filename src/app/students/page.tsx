'use client'

import { useState } from 'react'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export default function StudentsPage() {
  const [applicationUserId, setApplicationUserId] = useState('')
  const [view, setView] = useState<'assignment' | 'standard'>('assignment')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>

        <div className="bg-white border rounded p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-700 mb-1">application_user_id</label>
              <input value={applicationUserId} onChange={e => setApplicationUserId(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="student-123" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">View</label>
              <select value={view} onChange={e => setView(e.target.value as any)} className="w-full px-3 py-2 border rounded">
                <option value="assignment">by assignment</option>
                <option value="standard">by standard</option>
              </select>
            </div>
            <div className="flex md:justify-end">
              <button onClick={fetchData} disabled={!applicationUserId || loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300">{loading ? 'Loading…' : 'Fetch'}</button>
            </div>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        {result && (
          <div className="bg-white border rounded p-4">
            <h3 className="font-semibold mb-2">Response</h3>
            <pre className="text-xs overflow-auto bg-gray-50 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}


