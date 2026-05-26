"use client";

import { AssignmentLauncher } from '@/components/assignments/AssignmentLauncher';
import Link from 'next/link';

export default function AssignmentsBuildPage() {
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Build Assignment</h1>
            <p className="text-sm text-muted mt-2">Create new assignments with standards, content, or multi-activity combinations</p>
          </div>
          <Link
            href="/assignments"
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-100 transition-colors"
          >
            ← Back to List
          </Link>
        </div>

        {/* Builder Component */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <AssignmentLauncher />
        </div>
      </div>
    </div>
  );
}

