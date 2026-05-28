"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/partners";
  return value;
}

export function ShowcaseSsoClient() {
  const router = useRouter();
  const [message, setMessage] = useState("Opening selected app in the REST API Showcase...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const nextPath = safeNextPath(params.get("next"));

    window.history.replaceState(null, "", "/sso");

    if (!accessToken) {
      setError("Console did not provide a showcase session.");
      return;
    }

    let cancelled = false;

    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken }),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };

        if (!response.ok) {
          throw new Error(payload.message || `Session handoff failed with HTTP ${response.status}.`);
        }

        if (!cancelled) {
          setMessage("Session ready. Opening showcase...");
          router.replace(nextPath);
          router.refresh();
        }
      })
      .catch((handoffError: unknown) => {
        if (!cancelled) {
          setError(handoffError instanceof Error ? handoffError.message : "Session handoff failed.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-6 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-xl">
        <div className="text-2xl font-bold text-foreground">Legends of Learning</div>
        <div className="mt-2 text-sm font-semibold uppercase tracking-wider text-muted">REST API Showcase</div>
        <h1 className="pt-4 text-3xl font-bold text-foreground">
          {error ? "Session handoff failed" : "Opening Showcase"}
        </h1>
        <p className={`mt-3 text-sm leading-6 ${error ? "text-error" : "text-muted"}`}>
          {error || message}
        </p>
        {error ? (
          <a href="/login" className="portal-button-secondary mt-6 px-4 py-3 text-sm">
            Use Client Credentials
          </a>
        ) : null}
      </section>
    </main>
  );
}
