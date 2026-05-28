# Legends REST API Showcase

Public reference app for working with the Legends of Learning V3 REST API from one OAuth application.

This repository is intentionally app-scoped. It demonstrates the code a partner team or coding agent can reuse to build against Legends APIs: authenticate with client credentials, inspect content and standards, create test users, build assignments, generate launch links, and review request activity.

The first-party Legends Partner Portal remains private. Use it to create applications, rotate credentials, manage team access, and configure app branding before running this showcase.

## What This App Demonstrates

### Authentication

- Exchanges an OAuth client ID and client secret for an app access token.
- Stores the access token in an HTTP-only local cookie for the demo session.
- Proxies browser requests through Next.js route handlers so secrets never ship to the client.

### Content And Standards

- Browses content exposed through the V3 API.
- Searches content and standards.
- Inspects content metadata before using it in an assignment payload.
- Confirms standard IDs and standard-set IDs for API requests.

### Users And Launch

- Creates teacher and student test users.
- Generates teacher login links.
- Builds standard, content, fluency, and multi-activity assignments.
- Generates per-student join links and partner instant-join URLs.

### Agent-Friendly Source Map

- `src/app/api/auth/login/route.ts`: OAuth client-credentials login.
- `src/app/api/[...legends]/route.ts`: server-side API proxy.
- `src/app/api/reference/openapi/route.ts`: public OpenAPI link health check.
- `src/lib/api/endpoints.ts`: typed endpoint helpers.
- `src/components/assignments/AssignmentLauncher.tsx`: assignment and join-link examples.
- `src/app/partners/page.tsx`: launch and branded-player checks for the active app.

## What This App Does Not Do

- Manage partner workspaces or team members.
- Create, rotate, revoke, or reveal production API keys.
- Edit app branding.
- Replace the private first-party Partner Portal.

## Local Setup

### Prerequisites

- Node.js v18 or later
- pnpm or npm
- Legends API OAuth client credentials for one test application

### Install

```bash
git clone https://github.com/LegendsOfLearning/rest-api-showcase.git
cd rest-api-showcase
pnpm install
```

### Environment

Create `.env` in the repo root:

```env
LEGENDS_API_URL=https://api.legendsoflearning.com/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_LEGENDS_OPENAPI_SPEC_URL=https://api.legendsoflearning.com/api/v3/docs/openapi
```

The OpenAPI URL is optional and defaults to the production spec above. The app asks for the OAuth client ID and client secret on the local login page. Do not commit credentials or `.env` files.

### Run

```bash
pnpm dev
```

Open `http://localhost:3000`, sign in with one app's OAuth client credentials, and use the API pages as implementation examples.

## Project Structure

```text
rest-api-showcase/
├── src/
│   ├── app/              # Next.js app router pages and route handlers
│   │   ├── assignments/  # Assignment list and builder
│   │   ├── content/      # Content detail and discovery
│   │   ├── users/        # User management examples
│   │   ├── standards/    # Standards browsing
│   │   ├── search/       # Search examples
│   │   ├── chat/         # Optional agent helper
│   │   └── docs/         # Public implementation guide
│   ├── components/       # React components
│   ├── lib/              # API clients and utilities
│   └── contexts/         # React contexts
├── docs/                 # Supplemental API notes
└── package.json
```

## Development

```bash
pnpm dev
pnpm build
npx tsc --noEmit
```

Use conventional commit subjects:

```text
feat(showcase): add launch example
fix(assignments): preserve target player selection
chore(docs): update source map
```

## Review Checklist

- Keep the public app scoped to one OAuth application.
- Keep first-party partner management out of this repository.
- Keep request and response examples environment-safe.
- Do not commit API credentials or generated local artifacts.
- Run TypeScript and build checks for UI or API-client changes.

## Documentation

- API documentation notes: `docs/api-documentation.md`
- OpenAPI spec: `https://api.legendsoflearning.com/api/v3/docs/openapi`

## License

MIT License

Copyright (c) 2024 Legends of Learning

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
