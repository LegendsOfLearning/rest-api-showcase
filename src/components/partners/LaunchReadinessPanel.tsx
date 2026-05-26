import type {
  CapabilityStatus,
  LaunchReadinessModel,
  ReadinessCheck,
  ReadinessStatus,
} from "@/lib/partners/launchReadiness";

function statusClasses(status: ReadinessStatus): string {
  switch (status) {
    case "ready":
      return "border-success bg-success text-success";
    case "warning":
    case "loading":
      return "border-warning bg-warning text-warning";
    case "error":
      return "border-error bg-error text-error";
    default:
      return "border-border bg-surface-100 text-muted";
  }
}

function statusLabel(status: ReadinessStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "warning":
      return "Needs review";
    case "loading":
      return "Checking";
    case "error":
      return "Blocked";
    default:
      return "Unknown";
  }
}

function StatusBadge({ status }: { status: ReadinessStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClasses(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function CapabilityCard({ capability }: { capability: CapabilityStatus }) {
  const hasRequirements = capability.requirements.length > 0;

  return (
    <article className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{capability.label}</p>
          <p className="mt-1 text-sm text-muted">{capability.summary}</p>
        </div>
        <StatusBadge status={capability.status} />
      </div>
      {hasRequirements ? (
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {capability.requirements.map((requirement) => (
            <li key={requirement} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-border" aria-hidden="true" />
              <span>{requirement}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function CheckRow({ check }: { check: ReadinessCheck }) {
  return (
    <div className="rounded-xl border border-border bg-surface-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{check.label}</p>
          <p className="mt-1 text-sm text-muted">{check.detail}</p>
        </div>
        <StatusBadge status={check.status} />
      </div>
    </div>
  );
}

export function LaunchReadinessPanel({ model }: { model: LaunchReadinessModel }) {
  return (
    <section className="card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Launch readiness</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Verify this sample app before sharing launch links</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Review app context, public API reference health, and launch capabilities from one app-scoped panel.
          </p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 ${statusClasses(model.summary.status)}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em]">{model.summary.label}</p>
          <p className="mt-1 text-sm">{model.summary.detail}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {model.capabilities.map((capability) => (
          <CapabilityCard key={capability.id} capability={capability} />
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted">Verification checks</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {model.checks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </div>
      </div>
    </section>
  );
}
