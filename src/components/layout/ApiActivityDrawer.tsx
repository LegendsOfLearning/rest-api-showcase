"use client";

import { useApiActivity } from "@/contexts/api-activity";
import { useMemo } from "react";
import { getV3Path } from "@/lib/api-path";

export function ApiActivityDrawer() {
  const { entries, drawerOpen, setDrawerOpen, selectedEntry, selectEntry, clearEntries } = useApiActivity();

  const drawerClasses = useMemo(
    () =>
      `fixed inset-y-0 right-0 w-full lg:w-96 bg-surface border-l border-border transform transition-transform duration-300 z-50 flex flex-col ${
        drawerOpen ? "translate-x-0" : "translate-x-full"
      }`,
    [drawerOpen]
  );

  const v3Path = useMemo(() => getV3Path(selectedEntry), [selectedEntry]);

  return (
    <aside className={drawerClasses}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Insights</p>
          <h2 className="text-lg font-semibold text-foreground">API Activity</h2>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="rounded-full border border-border/60 px-3 py-1 text-sm text-muted hover:text-foreground"
          aria-label="Close drawer"
        >
          Close
        </button>
      </div>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Request detail panel at the top */}
        {selectedEntry && (
          <div className="border-b border-border px-5 py-5 flex-shrink-0">
            <div className="text-sm font-mono text-foreground">
              {selectedEntry.method} · {v3Path}
            </div>
          </div>
        )}
        
        {/* Request list panel - scrollable, reverse order (newest at top) */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between text-xs text-muted flex-shrink-0">
          <span>{entries.length} recent call{entries.length === 1 ? "" : "s"}</span>
          {entries.length > 0 && (
            <button type="button" onClick={clearEntries} className="text-accent hover:text-accent/80">
              Clear
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => selectEntry(entry.id)}
              className={`w-full text-left px-5 py-4 hover:bg-surface-100 transition-colors ${
                selectedEntry?.id === entry.id ? "bg-accent/5" : ""
              }`}
            >
              <div className="text-sm font-mono text-foreground">
                {entry.method} · {getV3Path(entry)}
              </div>
            </button>
          ))}
          {entries.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted">
              Trigger any action in the app to see real-time API logs for this browser session.
            </div>
          )}
        </div>
          </div>
      </div>
    </aside>
  );
}
