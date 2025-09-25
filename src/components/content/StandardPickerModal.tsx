import { useEffect, useMemo, useState } from 'react'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { StandardsResponse, StandardSet, Standard } from '@/types/api'

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (standard: { id: number; label: string }) => void
}

export default function StandardPickerModal({ open, onClose, onSelect }: Props) {
  const [sets, setSets] = useState<StandardSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string>('')
  const [standards, setStandards] = useState<Standard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function run() {
      try {
        const res = await fetch(API_ENDPOINTS.STANDARD_SETS)
        const data = await res.json()
        const results = (data?.results || []) as StandardSet[]
        if (!cancelled) setSets(results)
      } catch {
        if (!cancelled) setSets([])
      }
    }
    run()
    return () => { cancelled = true }
  }, [open])

  useEffect(() => {
    if (!open || !selectedSetId) return
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(API_ENDPOINTS.STANDARDS(selectedSetId))
        if (!res.ok) throw new Error('Failed to load standards')
        const data: StandardsResponse = await res.json()
        if (!cancelled) setStandards(data.entries)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [open, selectedSetId])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center p-6">
        <div className="w-full max-w-3xl bg-white rounded-lg border shadow-lg overflow-hidden" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="font-semibold">Select Standard (optional)</div>
            <button onClick={onClose} aria-label="Close" className="px-2 py-1 text-gray-600 hover:text-gray-900">✕</button>
          </div>

          <div className="p-4 space-y-3">
            <select value={selectedSetId} onChange={e => setSelectedSetId(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="">Select a Standard Set…</option>
              {sets.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <div className="min-h-60 border rounded overflow-hidden">
              {loading ? (
                <div className="p-6 text-sm text-gray-600">Loading…</div>
              ) : error ? (
                <div className="p-6 text-sm text-red-600">{error}</div>
              ) : (
                <div className="divide-y">
                  {standards.map(std => (
                    <button
                      key={std.id}
                      onClick={() => onSelect({ id: std.id, label: std.standard })}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    >{std.standard}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-3 border-t flex items-center justify-end">
            <button onClick={onClose} className="px-3 py-1.5 border rounded">Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}
