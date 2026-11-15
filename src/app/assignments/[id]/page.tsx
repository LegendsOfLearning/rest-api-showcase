"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import Link from 'next/link';
import { summarize, type ReportPlayer } from '@/lib/demo/fluency';
import type { AssignmentDetailResponse } from '@/types/api';

type ViewType = 'default' | 'activity' | 'activity_by_player' | 'player' | 'standard' | 'standard_by_student';

type Player = ReportPlayer & { first_name?: string; last_name?: string };

type ActivityWithStats = NonNullable<AssignmentDetailResponse['assignment']['activities']>[0] & {
  totalPlayers: number;
  completedPlayers: number;
  completionRate: number;
};

type ExtendedAssignmentDetailResponse = Omit<AssignmentDetailResponse, 'players'> & {
  players?: { entries: Player[]; total_pages: number };
  standards?: Array<{
    id: number;
    label?: string;
    code?: string;
    average_score?: number;
  }>;
};

export default function AssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params?.id as string;
  const [assignment, setAssignment] = useState<ExtendedAssignmentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<ViewType>('default');

  useEffect(() => {
    if (!assignmentId) return;
    
    const fetchAssignment = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({ view: detailView === 'default' ? 'player' : detailView, include: 'activities,players,by_activity', page_size: '100' });
        const url = `${API_ENDPOINTS.ASSIGNMENT(Number(assignmentId))}?${query}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load assignment');
        const data = await res.json();
        const players = [...(data.players?.entries ?? [])];
        for (let page = 2; page <= (data.players?.total_pages ?? 1); page++) {
          const next = await fetch(`${url}&page=${page}`);
          if (!next.ok) throw new Error('Failed to load all player results');
          players.push(...((await next.json()).players?.entries ?? []));
        }
        data.players = { ...data.players, entries: players };
        setAssignment(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId, detailView]);

  // Calculate metrics from assignment data
  const metrics = useMemo(() => {
    if (!assignment) return null;

    const assignmentData = assignment.assignment;
    const activities = assignmentData.activities || [];
    const playersArray = assignment.players?.entries ?? [];
    const totals = summarize(playersArray);
    const totalPlayers = totals.players, completedPlayers = totals.completedPlayers;
    const completionRate = totalPlayers ? completedPlayers / totalPlayers * 100 : 0;
    const activityStats: ActivityWithStats[] = activities.map(activity => {
      const participants = playersArray.filter(p => p.activities?.some(a => a.id === activity.id));
      const completed = participants.filter(p => {
        const rows = p.activities?.filter(a => a.id === activity.id) ?? [];
        return rows.length > 0 && rows.every(a => a.completed_at);
      });
      return { ...activity, totalPlayers: participants.length, completedPlayers: completed.length, completionRate: participants.length ? completed.length / participants.length * 100 : 0 };
    });
    const avgPlaytime = totals.playtimeSec !== null && totalPlayers ? totals.playtimeSec / totalPlayers / 60 : null;

    return {
      totalPlayers,
      completedPlayers,
      completionRate,
      avgPlaytime: avgPlaytime === null ? '—' : Math.round(avgPlaytime),
      activityStats,
      startDate: assignmentData?.start_date,
      endDate: assignmentData?.end_date,
      status: assignmentData?.status,
    };
  }, [assignment]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted">Loading assignment data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="w-full">
        <div className="max-w-7xl mx-auto">
          <div className="portal-alert-error p-6">
            <p className="mb-4">{error || 'Assignment not found'}</p>
            <Link
              href="/assignments"
              className="text-sm text-accent hover:text-accent/80 transition-colors"
            >
              ← Back to Assignments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const assignmentData = assignment.assignment || {};

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/assignments"
              className="text-sm text-muted hover:text-foreground transition-colors mb-2 inline-block"
            >
              ← Back to Assignments
            </Link>
            <h1 className="text-3xl font-bold text-foreground">
              {assignmentData.name || `Assignment #${assignmentData.id || assignmentId}`}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                assignmentData.status === 'active' 
                  ? 'bg-success text-success'
                  : assignmentData.status === 'completed'
                  ? 'bg-info text-info'
                  : 'bg-surface-100 text-muted'
              }`}>
                {assignmentData.status || 'Unknown'}
              </span>
              {assignmentData.start_date && (
                <span className="text-sm text-muted">
                  {new Date(assignmentData.start_date).toLocaleDateString()}
                  {assignmentData.end_date && ` → ${new Date(assignmentData.end_date).toLocaleDateString()}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Selector */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted mr-2">Data View:</span>
            {(['default', 'activity', 'activity_by_player', 'player', 'standard', 'standard_by_student'] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setDetailView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  detailView === v
                    ? 'bg-accent text-on-accent'
                    : 'bg-surface-100 text-foreground hover:bg-surface-200'
                }`}
              >
                {v.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="text-sm text-muted mb-1">Players with recorded activity</div>
              <div className="text-3xl font-bold text-foreground">{metrics.totalPlayers}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="text-sm text-muted mb-1">Completed</div>
              <div className="text-3xl font-bold text-foreground">{metrics.completedPlayers}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="text-sm text-muted mb-1">Completion Rate</div>
              <div className="text-3xl font-bold text-foreground">{metrics.completionRate.toFixed(1)}%</div>
              <div className="mt-2 h-2 bg-surface-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all"
                  style={{ width: `${metrics.completionRate}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="text-sm text-muted mb-1">Avg Playtime</div>
              <div className="text-3xl font-bold text-foreground">{metrics.avgPlaytime}</div>
              <div className="text-xs text-muted mt-1">minutes</div>
            </div>
          </div>
        )}

        {/* Activity Performance */}
        {metrics && metrics.activityStats.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Activity Performance</h2>
            <div className="space-y-4">
              {metrics.activityStats.map((activity, idx) => (
                <div key={activity.id || idx} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-foreground">
                        {activity.type || 'Unknown'} Activity #{activity.id || idx + 1}
                      </div>
                      {activity.standard_id && (
                        <div className="text-sm text-muted">Standard ID: {activity.standard_id}</div>
                      )}
                      {activity.content_id && (
                        <div className="text-sm text-muted">Content ID: {activity.content_id}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {activity.completedPlayers} / {activity.totalPlayers}
                      </div>
                      <div className="text-xs text-muted">
                        {activity.completionRate.toFixed(1)}% complete
                      </div>
                    </div>
                  </div>
                  <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all"
                      style={{ width: `${activity.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player Data */}
        {assignment.players && (() => {
          const playersArray = assignment.players.entries;
          return playersArray.length > 0 ? (
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Players ({playersArray.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {playersArray.slice(0, 10).map((player) => {
                    const completed = player.activities?.length && player.activities.every(a => a.completed_at);
                    return (
                      <tr key={player.id} className="hover:bg-surface-100">
                        <td className="px-4 py-3 text-sm font-mono text-muted">#{player.id}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{[player.first_name, player.last_name].filter(Boolean).join(' ') || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted">
                          {completed ? 'Completed' : 'In Progress'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {playersArray.length > 10 && (
                <div className="px-4 py-3 text-sm text-muted text-center border-t border-border">
                  Showing 10 of {playersArray.length} players
                </div>
              )}
            </div>
          </div>
          ) : null;
        })()}

        {/* Standards Performance */}
        {assignment.standards && assignment.standards.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Standards Performance ({assignment.standards.length})
            </h2>
            <div className="space-y-3">
              {assignment.standards.map((standard, idx) => (
                <div key={standard.id || idx} className="border border-border rounded-lg p-4">
                  <div className="font-medium text-foreground mb-1">
                    {standard.label || standard.code || `Standard #${standard.id}`}
                  </div>
                  {standard.code && (
                    <div className="text-sm text-muted font-mono">{standard.code}</div>
                  )}
                  {standard.average_score !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted">Average Score</span>
                        <span className="font-medium text-foreground">
                          {standard.average_score.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent transition-all"
                          style={{ width: `${standard.average_score}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw Data View (Collapsible) */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <details className="group">
            <summary className="cursor-pointer text-lg font-semibold text-foreground mb-4 list-none">
              <div className="flex items-center justify-between">
                <span>Raw Data</span>
                <span className="text-sm text-muted group-open:hidden">Click to expand</span>
                <span className="text-sm text-muted hidden group-open:inline">Click to collapse</span>
              </div>
            </summary>
            <div className="overflow-auto mt-4">
              <pre className="text-xs bg-surface-100 p-4 rounded-lg border border-border overflow-x-auto">
                {JSON.stringify(assignment, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
