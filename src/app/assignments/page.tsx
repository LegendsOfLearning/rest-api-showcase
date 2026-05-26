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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = applicationUserId 
        ? `${API_ENDPOINTS.ASSIGNMENTS}?include=activities&application_user_id=${encodeURIComponent(applicationUserId)}` 
        : `${API_ENDPOINTS.ASSIGNMENTS}?include=activities`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load assignments');
      const data = await res.json();
      setAssignmentsPage(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationUserId]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
            <p className="text-sm text-muted mt-2">View and manage all assignments</p>
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
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Filter by Teacher (application_user_id)
              </label>
              <input
                type="text"
                value={applicationUserId}
                onChange={(e) => setApplicationUserId(e.target.value)}
                placeholder="Enter teacher application_user_id (optional)"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchAssignments}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="portal-alert-error p-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Assignments Table */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Activities
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {loading && !assignmentsPage ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted">
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
                    <td colSpan={7} className="px-6 py-12 text-center">
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
          {assignmentsPage && assignmentsPage.total_pages > 1 && (
            <div className="px-6 py-4 border-t border-border bg-surface-100">
              <p className="text-sm text-muted">
                Showing page {assignmentsPage.page_number} of {assignmentsPage.total_pages} 
                ({assignmentsPage.total_entries} total assignments)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
