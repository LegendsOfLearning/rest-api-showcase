"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LaunchReadinessPanel } from "@/components/partners/LaunchReadinessPanel";
import { PartnerVariablesPanel } from "@/components/partners/PartnerVariablesPanel";
import { SignIntoLegendsButton } from "@/components/users/SignIntoLegendsButton";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  buildLaunchReadinessModel,
  type VerificationProbeState,
} from "@/lib/partners/launchReadiness";
import type { ApplicationMeResponse } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.legendsoflearning.com";

type ProbeErrorResponse = {
  error?: string;
  message?: string;
};

async function loadCurrentApplication(): Promise<ApplicationMeResponse> {
  const response = await fetch(API_ENDPOINTS.APPLICATION_ME);

  if (!response.ok) throw new Error("Failed to load application");

  return response.json();
}

function joinPatterns(applicationSlug: string) {
  const encodedSlug = encodeURIComponent(applicationSlug);

  return [
    {
      label: "Content",
      path: `/v3/partner/${encodedSlug}/join/content/{content_id}`,
    },
    {
      label: "Content + Standard",
      path: `/v3/partner/${encodedSlug}/join/content/{content_id}/standards/{standard_id}`,
    },
    {
      label: "Standard",
      path: `/v3/partner/${encodedSlug}/join/standards/{standard_id}`,
    },
    { label: "Awakening", path: `/v3/partner/${encodedSlug}/join/awakening` },
  ];
}

export default function PartnersPage() {
  const [app, setApp] = useState<ApplicationMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docsProbe, setDocsProbe] = useState<VerificationProbeState>({ kind: "idle" });
  const [contentId, setContentId] = useState("");
  const [standardId, setStandardId] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCurrentApplication()
      .then((data: ApplicationMeResponse) => {
        if (!cancelled) setApp(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load application");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(() => {});
  };

  const buildJoinUrl = (pattern: string) => {
    let url = pattern;
    if (contentId) url = url.replace("{content_id}", contentId);
    if (standardId) url = url.replace("{standard_id}", standardId);
    return BASE_URL + url;
  };

  const isJoinReady = (pattern: string) => {
    if (pattern.includes("{content_id}") && !contentId) return false;
    if (pattern.includes("{standard_id}") && !standardId) return false;
    return true;
  };
  const partner = app?.partner;
  const branding = app?.branding ?? null;
  const partnerCode = partner?.code || branding?.code || undefined;
  const applicationSlug = app?.name || partnerCode;
  const appDisplayName = branding?.display_name ?? app?.name ?? "Selected app";
  const returnUrl = branding?.return_url;
  const patterns = applicationSlug ? joinPatterns(applicationSlug) : [];
  const readinessModel = buildLaunchReadinessModel({
    app,
    hasPartnerCode: Boolean(partnerCode),
    hasApplicationSlug: Boolean(applicationSlug),
    hasDisplayName: Boolean(branding?.display_name || app?.name),
    hasReturnUrl: Boolean(returnUrl),
    joinPatternCount: patterns.length,
    docsProbe,
  });

  useEffect(() => {
    if (!app?.id) {
      setDocsProbe({ kind: "idle" });
      return;
    }

    let cancelled = false;
    setDocsProbe({ kind: "loading" });

    fetch("/api/reference/openapi", {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (response.ok) {
          if (!cancelled) {
            setDocsProbe({ kind: "success", statusCode: response.status });
          }
          return;
        }

        let message = `Request failed with HTTP ${response.status}.`;
        try {
          const payload = (await response.json()) as ProbeErrorResponse;
          message = payload.error || payload.message || message;
        } catch {
          try {
            const text = await response.text();
            if (text) message = text;
          } catch {
            // Ignore response parsing failures and fall back to the default message.
          }
        }

        if (!cancelled) {
          setDocsProbe({ kind: "error", statusCode: response.status, message });
        }
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) {
          setDocsProbe({
            kind: "error",
            message: fetchError instanceof Error ? fetchError.message : "Verification request failed.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [app?.id]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="card">
          <p className="text-sm text-muted">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="rounded-2xl border border-error bg-error px-4 py-3 text-sm text-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">REST API Showcase</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold text-foreground">{appDisplayName} sample app</h1>
            <p className="mt-2 text-sm text-muted">
              {partner
                ? "This public sample shows the code path a partner app or coding agent can reuse for one OAuth application."
                : "This app is authenticated, but it does not have partner launch configuration yet. Partner launch flows need a partner code, return URL, and branding values configured outside this repo."}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface-100 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Active app</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{app?.name ?? "Unavailable"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-100 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Partner code</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{partnerCode ?? "Not configured"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-100 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">App ID</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{app?.id ?? "Unavailable"}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              App creation, team access, key rotation, and branding management stay in Legends first-party tooling.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-100"
            >
              View Integration Guide
            </Link>
          </div>
        </div>
      </div>

      <LaunchReadinessPanel model={readinessModel} />

      {/* Partner Config */}
      <div className="card">
        <h2 className="text-xl font-semibold text-foreground mb-4">Application Configuration</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted">App Name</label>
            <div className="mt-1 px-3 py-2 rounded-xl border border-border bg-surface-100 text-sm font-mono text-foreground">{app?.name ?? "—"}</div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted">App ID</label>
            <div className="mt-1 px-3 py-2 rounded-xl border border-border bg-surface-100 text-sm font-mono text-foreground">{app?.id ?? "—"}</div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted">Scopes</label>
            <div className="mt-1 px-3 py-2 rounded-xl border border-border bg-surface-100 text-sm font-mono text-foreground truncate">{app?.scopes ?? "—"}</div>
          </div>
        </div>
        <PartnerVariablesPanel
          branding={branding}
          appName={app?.name}
          eyebrow="Resolved app branding"
          className="mt-5"
          description="This is the effective app-first branding returned to the active OAuth application."
          readOnlyMessage="Branding is read-only in this public sample. Configure it in Legends first-party tooling before running launch checks."
        />
      </div>

      {/* Teacher Login Link — only show if partner is configured */}
      {partner && (
        <div className="card">
          <h2 className="text-xl font-semibold text-foreground mb-2">Teacher Login Link</h2>
          <p className="text-sm text-muted mb-4">
            Creates a teacher user and generates a login link with <code className="text-xs bg-surface-100 px-1.5 py-0.5 rounded">auth=google</code>
            {returnUrl && (
              <>
                {" "}
                and <code className="text-xs bg-surface-100 px-1.5 py-0.5 rounded">return_url={returnUrl}</code>
              </>
            )}
            . Clicking opens the Google OAuth flow, then redirects to the teacher app with the partner banner visible.
          </p>
          <div className="flex items-center gap-4">
            <SignIntoLegendsButton
              applicationUserId={`${partnerCode}-demo-teacher`}
              firstName={branding?.display_name ?? "Partner"}
              lastName="Demo Teacher"
              role="teacher"
              auth="google"
              returnUrl={returnUrl ?? undefined}
              destination="dashboard"
            />
            <span className="text-xs text-muted">User: {partnerCode}-demo-teacher</span>
          </div>
        </div>
      )}

      {/* Instant Join URLs — only show if partner code exists */}
      {partnerCode && (
        <div className="card">
          <h2 className="text-xl font-semibold text-foreground mb-2">Instant Join URLs</h2>
          <p className="text-sm text-muted mb-4">
            These URLs allow students to join directly via the partner flow. Enter a content or standard ID to generate ready-to-click links.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted">Content ID</label>
              <input
                type="text"
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
                placeholder="e.g. 12345"
                className="mt-1 w-full rounded-xl border border-border bg-surface-100 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted">Standard ID</label>
              <input
                type="text"
                value={standardId}
                onChange={(e) => setStandardId(e.target.value)}
                placeholder="e.g. 67890"
                className="mt-1 w-full rounded-xl border border-border bg-surface-100 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            {patterns.map((pattern) => {
              const ready = isJoinReady(pattern.path);
              const fullUrl = buildJoinUrl(pattern.path);

              return (
                <div key={pattern.label} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-100">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider w-36 flex-shrink-0">{pattern.label}</span>
                  <code className="flex-1 text-xs text-foreground font-mono truncate">{fullUrl}</code>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(fullUrl, pattern.label)}
                      disabled={!ready}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface text-foreground hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {copied === pattern.label ? "Copied!" : "Copy"}
                    </button>
                    {ready ? (
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-on-accent hover:bg-accent-hover transition-colors"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface text-muted cursor-not-allowed">Open</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
