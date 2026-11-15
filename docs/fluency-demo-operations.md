# Guided fluency demo

Public route: `/demo/fluency`. All API calls use the dedicated Legends production application, never a visitor's Showcase credentials.

Server configuration (production only):
- `FLUENCY_DEMO_CLIENT_ID`
- `FLUENCY_DEMO_CLIENT_SECRET`
- `FLUENCY_DEMO_APPLICATION_ID`
- `FLUENCY_DEMO_SESSION_SECRET` (at least 32 random characters)

Keep these server-only. Provision `fluency-demo-preview-teacher` in this application before enabling the route. Do not download production environment variables to disk or add credentials to preview deployments. Rotate the signing secret to invalidate existing demo sessions. Removing the signing secret disables API demo requests.

Each one-hour signed, httpOnly, Secure, SameSite=Strict cookie binds one synthetic teacher, learner, preset, and assignment. Launch requires an existing preview cookie; the server chooses all IDs. Requests accept preset keys only. Repeated launch uses a stable assignment idempotency key; join links can be refreshed without creating another assignment. Results filter the current assignment to the cookie's learner. No learner emails are created. Browser examples contain placeholders only; private play links remain in page memory.

The app is limited to 200 demo learners by checking the dedicated application's student list before creation. A per-instance burst guard allows 20 requests per source address per minute. The persistent cap is a conservative availability backstop, not an atomic distributed rate limiter; simultaneous requests near the cap may exceed it. Monitor dedicated app usage and add an edge rate rule for `/api/demo/fluency` for higher traffic. Never use a customer application for this route.

The public report returns recorded answers, correct answers, and accuracy. It does not claim per-fact mastery or timing. Missing counts remain unknown. The regular assignment detail screen reads current paginated `players.entries[].activities` fields and loads every page before calculating metrics.

First-time Awakening setup may still be required. Launching an assignment and displaying empty reports does not establish gameplay completion. Verify actual answers after playing before claiming end-to-end gameplay success.
