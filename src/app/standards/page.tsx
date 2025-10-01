'use client'

import { useState } from 'react'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export default function StandardsAggPage() {
  const [standardId, setStandardId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<unknown>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(API_ENDPOINTS.STANDARD_AGG(standardId))
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
        <h1 className="text-2xl font-bold text-gray-900">Standards</h1>

        <div className="bg-white border rounded p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-700 mb-1">standard_id</label>
              <input value={standardId} onChange={e => setStandardId(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="4086" />
            </div>
            <div className="flex md:justify-end md:col-span-2">
              <button onClick={fetchData} disabled={!standardId || loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300">{loading ? 'Loading…' : 'Fetch'}</button>
            </div>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        {result != null ? (
          <div className="bg-white border rounded p-4">
            <h3 className="font-semibold mb-2">Response</h3>
            <pre className="text-xs overflow-auto bg-gray-50 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>
          </div>
        ) : null}
      </div>
    </div>
  )
} 