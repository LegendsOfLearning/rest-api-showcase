import type { ApplicationMeResponse } from "@/types/api";

export type LaunchCapabilityId =
  | "teacher_login"
  | "assignment_join"
  | "instant_join"
  | "awakening";

export type ReadinessStatus = "ready" | "warning" | "error" | "loading";

export type VerificationProbeState =
  | { kind: "idle" | "loading" }
  | { kind: "success"; statusCode: number }
  | { kind: "error"; statusCode?: number; message: string };

export type ReadinessCheck = {
  id: string;
  label: string;
  detail: string;
  status: ReadinessStatus;
  capabilities: LaunchCapabilityId[];
};

export type CapabilityStatus = {
  id: LaunchCapabilityId;
  label: string;
  summary: string;
  status: ReadinessStatus;
  requirements: string[];
};

export type LaunchReadinessModel = {
  summary: {
    label: string;
    detail: string;
    status: ReadinessStatus;
  };
  checks: ReadinessCheck[];
  capabilities: CapabilityStatus[];
};

const CAPABILITY_LABELS: Record<LaunchCapabilityId, string> = {
  teacher_login: "Teacher login links",
  assignment_join: "Assignment joins",
  instant_join: "Partner instant joins",
  awakening: "Awakening launches",
};

const STATUS_PRIORITY: ReadinessStatus[] = ["error", "warning", "loading", "ready"];

function splitScopes(scopes: string | null | undefined): string[] {
  return (scopes || "")
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function aggregateStatus(statuses: ReadinessStatus[]): ReadinessStatus {
  for (const status of STATUS_PRIORITY) {
    if (statuses.includes(status)) return status;
  }

  return "ready";
}

type BuildArgs = {
  app: ApplicationMeResponse | null;
  hasPartnerCode: boolean;
  hasApplicationSlug: boolean;
  hasDisplayName: boolean;
  hasReturnUrl: boolean;
  joinPatternCount: number;
  docsProbe: VerificationProbeState;
};

export function buildLaunchReadinessModel({
  app,
  hasPartnerCode,
  hasApplicationSlug,
  hasDisplayName,
  hasReturnUrl,
  joinPatternCount,
  docsProbe,
}: BuildArgs): LaunchReadinessModel {
  const scopeList = splitScopes(app?.scopes);

  const checks: ReadinessCheck[] = [
    {
      id: "active-app",
      label: "Active application",
      status: app?.id && app?.name ? "ready" : "error",
      detail:
        app?.id && app?.name
          ? `${app.name} (${app.id}) is active in the console.`
          : "Select an application to verify launch readiness.",
      capabilities: ["teacher_login", "assignment_join", "instant_join", "awakening"],
    },
    {
      id: "partner-code",
      label: "Partner code",
      status: hasPartnerCode ? "ready" : "error",
      detail: hasPartnerCode
        ? "The active app resolves to a partner code for launch routes."
        : "Missing partner code. Launch routes cannot be generated for this app.",
      capabilities: ["teacher_login", "assignment_join", "instant_join", "awakening"],
    },
    {
      id: "branding",
      label: "Branding payload",
      status: hasDisplayName ? "ready" : "warning",
      detail: hasDisplayName
        ? "The active app returns partner-facing branding values."
        : "No app display name is set. Launches can work, but partner-facing branding will be generic.",
      capabilities: ["teacher_login", "awakening"],
    },
    {
      id: "return-url",
      label: "Return URL",
      status: hasReturnUrl ? "ready" : "warning",
      detail: hasReturnUrl
        ? "A return URL is configured for flows that send users back to the partner experience."
        : "No return URL is configured. Login links can still work, but they will not redirect back to a partner destination.",
      capabilities: ["teacher_login", "awakening"],
    },
    {
      id: "scopes",
      label: "Configured scopes",
      status: scopeList.length > 0 ? "ready" : "error",
      detail:
        scopeList.length > 0
          ? `Active app scopes: ${scopeList.join(", ")}.`
          : "No application scopes are configured. The console cannot treat this app as launch-ready.",
      capabilities: ["teacher_login", "assignment_join", "instant_join", "awakening"],
    },
    {
      id: "console-session",
      label: "Showcase app session",
      status: app ? "ready" : "error",
      detail: app
        ? "The showcase loaded the selected OAuth app context and can re-run checks after sign-in changes."
        : "The showcase could not confirm an active app session for launch verification.",
      capabilities: ["teacher_login", "assignment_join", "instant_join", "awakening"],
    },
    {
      id: "openapi",
      label: "API reference",
      status:
        docsProbe.kind === "success"
          ? "ready"
          : docsProbe.kind === "loading" || docsProbe.kind === "idle"
            ? "loading"
            : "error",
      detail:
        docsProbe.kind === "success"
          ? `The public OpenAPI spec responded with HTTP ${docsProbe.statusCode}.`
          : docsProbe.kind === "error"
            ? docsProbe.statusCode
              ? `The public OpenAPI spec returned HTTP ${docsProbe.statusCode}: ${docsProbe.message}`
              : `The public OpenAPI spec check failed: ${docsProbe.message}`
            : "Checking the public OpenAPI spec.",
      capabilities: ["teacher_login", "assignment_join", "instant_join", "awakening"],
    },
    {
      id: "launch-shape",
      label: "Generated launch-link shape",
      status: hasApplicationSlug && joinPatternCount > 0 ? "ready" : "error",
      detail:
        hasApplicationSlug && joinPatternCount > 0
          ? `${joinPatternCount} launch route patterns are available for the active app.`
          : "The active app is missing the routing fields needed to build launch links.",
      capabilities: ["assignment_join", "instant_join", "awakening"],
    },
  ];

  const capabilities: CapabilityStatus[] = (
    Object.entries(CAPABILITY_LABELS) as [LaunchCapabilityId, string][]
  ).map(([id, label]) => {
    const relevantChecks = checks.filter((check) => check.capabilities.includes(id));
    const status = aggregateStatus(relevantChecks.map((check) => check.status));
    const blockingChecks = relevantChecks.filter((check) => check.status !== "ready");

    return {
      id,
      label,
      status,
      summary:
        status === "ready"
          ? "All required verification checks passed."
          : status === "loading"
            ? "Verification is still running for this capability."
            : `${blockingChecks[0]?.label || "Verification"} needs attention.`,
      requirements:
        blockingChecks.length > 0
          ? blockingChecks.map((check) => check.detail)
          : [],
    };
  });

  const summaryStatus = aggregateStatus(capabilities.map((capability) => capability.status));
  const readyCount = capabilities.filter((capability) => capability.status === "ready").length;

  return {
    summary: {
      label:
        summaryStatus === "ready"
          ? "Launch-ready"
          : summaryStatus === "loading"
            ? "Verifying"
            : "Action needed",
      detail:
        summaryStatus === "ready"
          ? `All ${capabilities.length} launch capability checks passed for the active application.`
          : `${readyCount} of ${capabilities.length} launch capabilities are fully ready for the active application.`,
      status: summaryStatus,
    },
    checks,
    capabilities,
  };
}
