"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ClientCredentialsLoginFormProps = {
  nextPath: string;
  initialClientId?: string;
  appName?: string;
};

export function ClientCredentialsLoginForm({
  nextPath,
  initialClientId,
  appName,
}: ClientCredentialsLoginFormProps) {
  const router = useRouter();
  const [clientId, setClientId] = useState(initialClientId ?? "");
  const [clientSecret, setClientSecret] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedAppName = appName?.trim();

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId.trim(),
          client_secret: clientSecret,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setError(payload.message || `Authentication failed with HTTP ${response.status}.`);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Authentication failed before the API returned a response.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-8 shadow-xl">
      <div className="space-y-2 text-center">
        <div className="text-2xl font-bold text-foreground">Legends of Learning</div>
        <div className="text-sm font-semibold uppercase tracking-wider text-muted">REST API Showcase</div>
        <h1 className="pt-4 text-3xl font-bold text-foreground">
          {selectedAppName ? `Connect ${selectedAppName}` : "Connect one test app"}
        </h1>
        <p className="text-sm leading-6 text-muted">
          Use OAuth client credentials from a Legends app to run the public sample flows locally.
        </p>
        {initialClientId ? (
          <div className="mx-auto mt-3 max-w-full rounded-lg border border-border bg-surface-100 px-3 py-2 text-left">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Selected app</div>
            <code className="mt-1 block break-all text-xs text-foreground">{initialClientId}</code>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-6 rounded-lg border border-error bg-error p-4 text-sm text-error">
          {error}
        </div>
      ) : null}

      <form onSubmit={submitCredentials} className="mt-7 space-y-4">
        <label className="block space-y-2" htmlFor="client-id">
          <span className="block text-sm font-semibold text-foreground">Client ID</span>
          <input
            id="client-id"
            name="client_id"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            autoComplete="off"
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <label className="block space-y-2" htmlFor="client-secret">
          <span className="block text-sm font-semibold text-foreground">Client Secret</span>
          <input
            id="client-secret"
            name="client_secret"
            type="password"
            value={clientSecret}
            onChange={(event) => setClientSecret(event.target.value)}
            autoComplete="off"
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="portal-button-primary flex w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Connecting..." : "Open Showcase"}
        </button>
      </form>

      <div className="mt-6 rounded-lg border border-info bg-info p-4">
        <p className="text-sm leading-6 text-info">
          App creation, team access, key rotation, and branding stay in Legends first-party tooling.
        </p>
      </div>
    </section>
  );
}
