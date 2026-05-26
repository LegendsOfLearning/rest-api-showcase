const sourceMap = [
  {
    path: "src/app/api/auth/login/route.ts",
    label: "OAuth login",
    detail: "Exchanges one app's client ID and secret for an access token.",
  },
  {
    path: "src/app/api/[...legends]/route.ts",
    label: "API proxy",
    detail: "Keeps bearer tokens server-side while the UI calls local routes.",
  },
  {
    path: "src/lib/api/endpoints.ts",
    label: "Endpoint helpers",
    detail: "Centralizes V3 paths used by the app pages and components.",
  },
  {
    path: "src/components/assignments/AssignmentLauncher.tsx",
    label: "Assignments",
    detail: "Shows assignment creation, join links, target players, and request payloads.",
  },
];

const launchExamples = [
  {
    title: "Teacher login",
    body: "Create or reuse an app-scoped teacher identity, request a login link, then send the teacher through Legends auth.",
  },
  {
    title: "Student join",
    body: "Create an assignment, request per-student joins, and open the returned launch URLs in the intended player.",
  },
  {
    title: "Instant launch",
    body: "Build partner launch URLs for content, standards, content plus standard, and Awakening targets.",
  },
];

export default function DocsPage() {
  return (
    <div className="max-w-6xl space-y-6">
      <section className="card">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Public reference</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Agent Integration Guide</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          This showcase is the source a partner can hand to an agent when they want a working Legends REST API integration pattern. It assumes one OAuth application is already configured outside this repo.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Boundary</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface-100 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">This repo</p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                App-scoped API calls, request payloads, launch examples, activity logging, and read-only resolved app context.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-100 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Private tooling</p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                Partner access, app creation, credentials, team members, audit logs, and branding configuration.
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Use it with agents</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Point an agent at this repo, provide sandbox credentials separately, and ask it to copy the relevant endpoint helper plus UI flow into the partner app.
          </p>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {launchExamples.map((example) => (
          <article key={example.title} className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-foreground">{example.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{example.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">Source map</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {sourceMap.map((item) => (
            <article key={item.path} className="rounded-lg border border-border bg-surface-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
                <code className="rounded border border-border bg-surface px-2 py-1 text-[11px] text-muted">
                  {item.path}
                </code>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
