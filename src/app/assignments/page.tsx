"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import Link from 'next/link';
import type { AssignmentListResponse } from '@/types/api';

export default function AssignmentsListPage() {
  const router = useRouter();
  const [applicationUserId, setApplicationUserId] = useState('');
  const [assignmentsPage, setAssignmentsPage] = useState<AssignmentListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [includeActivities, setIncludeActivities] = useState(false);
  const [lastLoadedTeacherId, setLastLoadedTeacherId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async (pageToLoad = 1) => {
    const teacherId = applicationUserId.trim();

    if (!teacherId) {
      setAssignmentsPage(null);
      setLastLoadedTeacherId('');
      setPage(1);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        application_user_id: teacherId,
        page: String(pageToLoad),
        page_size: String(pageSize),
      });

      if (includeActivities) {
        params.set('include', 'activities');
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 25000);

      const res = await fetch(`${API_ENDPOINTS.ASSIGNMENTS}?${params.toString()}`, {
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      if (!res.ok) {
        let message = `Failed to load assignments (${res.status})`;
        try {
          const body = await res.json();
          if (typeof body?.error === 'string') message = body.error;
        } catch {
          // Keep status-based message.
        }
        throw new Error(message);
      }
      const data = await res.json();
      setAssignmentsPage(data);
      setPage(data.page_number || pageToLoad);
      setLastLoadedTeacherId(teacherId);
    } catch (e) {
      const message =
        e instanceof DOMException && e.name === 'AbortError'
          ? 'Assignment list timed out. Try a smaller page size or a specific teacher application_user_id.'
          : e instanceof Error ? e.message : 'Failed to load assignments';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAssignmentsPage(null);
    setLastLoadedTeacherId('');
    setPage(1);
    setError(null);
  }, [applicationUserId, pageSize, includeActivities]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
            <p className="text-sm text-muted mt-2">View assignments for one teacher in the current app</p>
          </div>
          <Link
            href="/assignments/build"
            className="rounded-lg bg-accent px-4 py-2 font-medium text-on-accent transition-colors hover:bg-accent-hover"
          >
            Create Assignment
          </Link>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_140px_160px_auto] lg:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Teacher application_user_id
              </label>
              <input
                type="text"
                value={applicationUserId}
                onChange={(e) => setApplicationUserId(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') fetchAssignments(1);
                }}
                placeholder="teacher-123"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Page size
              </label>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={includeActivities}
                onChange={(event) => setIncludeActivities(event.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Activities
            </label>
            <button
              onClick={() => fetchAssignments(1)}
              disabled={loading || !applicationUserId.trim()}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Load'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="portal-alert-error p-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!assignmentsPage && !error && (
          <div className="rounded-xl border border-border bg-surface-100 p-10 text-center">
            <h2 className="text-base font-semibold text-foreground">Enter a teacher ID to load assignments</h2>
            <p className="mt-2 text-sm text-muted">
              Unfiltered assignment lists can be large, so this demo scopes list requests to one application_user_id.
            </p>
          </div>
        )}

        {/* Assignments Table */}
        {assignmentsPage && (
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-border bg-surface-100 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {lastLoadedTeacherId}
              </h2>
              <p className="mt-1 text-xs text-muted">
                {assignmentsPage.total_entries} assignment{assignmentsPage.total_entries === 1 ? '' : 's'}
              </p>
            </div>
            <button
              onClick={() => fetchAssignments(page)}
              disabled={loading}
              className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    End Date
                  </th>
                  {includeActivities && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      Activities
                    </th>
                  )}
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {loading && !assignmentsPage ? (
                  <tr>
                    <td colSpan={includeActivities ? 7 : 6} className="px-6 py-12 text-center text-muted">
                      Loading assignments...
                    </td>
                  </tr>
                ) : assignmentsPage?.entries?.length ? (
                  assignmentsPage.entries.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className="hover:bg-surface-100 transition-colors cursor-pointer"
                      onClick={() => router.push(`/assignments/${assignment.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-muted">#{assignment.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-foreground">
                          {assignment.name || <span className="text-muted italic">Untitled</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          assignment.status === 'active' 
                            ? 'bg-success text-success'
                            : assignment.status === 'completed'
                            ? 'bg-info text-info'
                            : 'bg-surface-100 text-muted'
                        }`}>
                          {assignment.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {formatDate(assignment.start_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {formatDate(assignment.end_date)}
                      </td>
                      {includeActivities && (
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {assignment.activities?.length ? (
                              assignment.activities.map((activity, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex px-2 py-0.5 text-xs rounded-md bg-surface-200 text-foreground"
                                >
                                  {activity.type || 'unknown'}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted">No activities</span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/assignments/${assignment.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-accent hover:text-accent/80 transition-colors"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={includeActivities ? 7 : 6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-muted">No assignments found</p>
                        <Link
                          href="/assignments/build"
                          className="text-sm text-accent hover:text-accent/80 transition-colors"
                        >
                          Create your first assignment →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-border bg-surface-100">
            <button
              onClick={() => fetchAssignments(Math.max(1, page - 1))}
              disabled={loading || page <= 1}
              className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <div className="text-center">
              <p className="text-sm text-muted">
                Page {assignmentsPage.page_number} of {assignmentsPage.total_pages || 1}
              </p>
              <p className="mt-1 text-xs text-muted">
                {assignmentsPage.page_size} per page
              </p>
            </div>
            <button
              onClick={() => fetchAssignments(Math.min(assignmentsPage.total_pages, page + 1))}
              disabled={loading || page >= assignmentsPage.total_pages}
              className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
          )}
      </div>
    </div>
  );
}
