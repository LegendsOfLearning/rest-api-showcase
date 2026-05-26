"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApplicationMeResponse } from "@/types/api";

type LoadState =
  | { kind: "idle" | "loading" }
  | { kind: "ready"; app: ApplicationMeResponse }
  | { kind: "unavailable" };

const APP_SCOPED_PREFIXES = [
  "/partners",
  "/content",
  "/standards",
  "/users",
  "/search",
  "/assignments",
  "/students",
  "/chat",
];

function scopeSummary(scopes?: string | null): string {
  if (!scopes) return "Scopes unavailable";

  const parts = scopes
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  if (parts.length === 0) return "Scopes unavailable";
  if (parts.length <= 2) return parts.join(", ");

  return `${parts.slice(0, 2).join(", ")} +${parts.length - 2}`;
}

export function AppContextStrip() {
  const pathname = usePathname();
  const [state, setState] = useState<LoadState>({ kind: "idle" });
  const isAppScoped = useMemo(() => {
    if (!pathname) return false;

    return APP_SCOPED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }, [pathname]);

  useEffect(() => {
    if (!isAppScoped) {
      setState({ kind: "idle" });
      return;
    }

    let cancelled = false;
    setState({ kind: "loading" });

    fetch(API_ENDPOINTS.APPLICATION_ME, {
      headers: { "x-console-background": "true" },
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as ApplicationMeResponse;
      })
      .then((app) => {
        if (cancelled) return;
        setState(app ? { kind: "ready", app } : { kind: "unavailable" });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "unavailable" });
      });

    return () => {
      cancelled = true;
    };
  }, [isAppScoped]);

  if (!isAppScoped) return null;

  if (state.kind !== "ready") {
    return (
      <div className="flex min-w-0 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-muted" aria-hidden="true" />
        <span>{state.kind === "loading" ? "Loading app context" : "No active app context"}</span>
        <Link href="/login" className="font-semibold text-accent hover:text-accent-hover">
          Sign in
        </Link>
      </div>
    );
  }

  const { app } = state;
  const launchCode = app.partner?.code || app.branding?.code || "No launch code";

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
        <span className="truncate font-semibold text-foreground">{app.name}</span>
      </span>
      <span className="hidden rounded-full border border-border bg-surface px-3 py-1.5 text-muted md:inline-flex">
        Launch code: <span className="ml-1 font-mono text-foreground">{launchCode}</span>
      </span>
      <span className="hidden max-w-[280px] truncate rounded-full border border-border bg-surface px-3 py-1.5 text-muted xl:inline-flex">
        {scopeSummary(app.scopes)}
      </span>
    </div>
  );
}
