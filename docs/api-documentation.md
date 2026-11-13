# Partner API quickstart

Use one shared Partner API to provision app-linked users, create content or Awakening activities, launch individual learners, and retrieve results. Fluency uses this assignment flow. Partner-specific selection, identity handoff and commercial terms belong in your integration agreement.

[Open the staging Showcase](https://api-showcase.legendsoflearning.com/login?environment=staging&next=%2Fpartners) · [Fluency assignment walkthrough](https://console.legendsoflearning.com/docs/fluency-assignments) · [API reference](https://console.legendsoflearning.com/docs/partner-rest-api)

## 1. Connect the intended application

| Environment | REST API base | Partner MCP |
| --- | --- | --- |
| Staging / test | `https://api.smartlittlecookies.com/api/v3` | `https://api.smartlittlecookies.com/partner/mcp` |
| Production | `https://api.legendsoflearning.com/api/v3` | `https://api.legendsoflearning.com/partner/mcp` |

Use separate applications and credentials for each environment. In the Showcase, select **Staging / test** for synthetic development and check the visible environment/application after login. The `app.smartlittlecookies.com` and `app.legendsoflearning.com` aliases also serve the corresponding API; the bases above are the canonical examples here.

Your backend exchanges its `client_id` and `client_secret` at `POST /oauth2/token`, relative to that REST base, with `grant_type=client_credentials`. Send `Authorization: Bearer {access_token}` on subsequent requests. Use the returned `expires_in`; acquire a token again when needed rather than inventing a refresh-token flow. Verify `GET /applications/me` identifies the expected app before writes.

The issuer may return an already active application token. Clearing a browser/client session must not revoke it: other clients may share it. Intentional `/oauth2/revoke` is an invalidation of that token for all clients sharing it, not routine cleanup. Keep credentials/tokens in protected server storage and out of browser code, prompts, logs and shared documents.

Console workspace membership, OAuth application credentials and separately managed service API keys are distinct. A service key is not a `client_secret`. [Registration](https://console.legendsoflearning.com/docs/registration) explains access; [permissions](https://console.legendsoflearning.com/docs/partner-rest-api#permissions) describes the application scope boundary.

## 2. Resolve stable users and choose the activity

Use external `application_user_id` values scoped to your application and a trusted tenant/identity mapping. Internal numeric user IDs are different identifiers. Authorize the creator and audience on your backend; do not accept a student identity from an untrusted launch query.

Create or retrieve the creator and learner through `/users`. Teacher creation requires nonempty `first_name` and `last_name`; synthetic examples can use fictional names. Linking an existing same-role account by email/Google identity is different from creating a new account and does not itself permit partner sign-in. Protected staff and relevant email-linked existing accounts can return 403 for login/join; recover with direct Legends sign-in. Do not rename or replace the underlying identity of a linked account. See [identity and launch](https://console.legendsoflearning.com/docs/partner-rest-api#identity-and-launch).

Choose an activity supported by the contract:

| Activity | Request entry |
| --- | --- |
| Content | `content_id` and its applicable `standard_id` |
| Fluency | `type: "awakening_fluency"`, `fluency_facts`; no `standard_id` needed |
| Other Awakening activities | Explicit mastery, focus or timed type; timed also needs `play_duration_seconds` |

Discover current IDs with `/standard_sets`, `/standard_sets/{id}/standards`, `/content` or `/searches`. Standard-set IDs are strings and must be URL-encoded; standards/content IDs are numeric. For search, use `hits[].content.id` or `hits[].standard.id`; the outer `hits[].id` is a fresh display UUID. Collection envelopes/pagination differ: standard sets use `results`, standards/content use `entries`; content uses `per_page`, standards use `page_size`.

## 3. Create the approved assignment

Call `POST /assignments` with the creator's external ID and an `activities` array. Use returned catalog IDs; numbers below are illustrative:

```json
{
  "application_user_id": "partner-test-teacher-001",
  "name": "Practice",
  "activities": [{"content_id": 1234, "standard_id": 5678}]
}
```

Save `assignment_id`. This `activities` form supports a stable `Idempotency-Key` for retries of the same logical creation and supports `dry_run`; legacy top-level `type: "standard"` / `type: "content"` requests implement neither feature. Do not assume a legacy retry is deduplicated or a legacy dry run prevents creation; reconcile an uncertain legacy response before retrying. If supplying a schedule, supply both dates. Optional target-user fields require the users to exist; an untargeted assignment can provision learners on first use if your audience policy permits it. The API creates/lists/reads assignments and creates joins; it has no public assignment update/delete operation.

## 4. Launch one authorized learner

Create or resolve the learner when needed, then call **plural** `POST /assignments/{id}/joins`:

```json
{"application_user_id":"partner-test-student-001","target":"awakening"}
```

Use Awakening for fluency/standard activities. The API also accepts `web` for supported content experiences. Send the individual learner to the returned `join_url` exactly as returned; do not share it across students or publish it in a lesson resource. Current assignment tokens last 24 hours. Standalone `/users/login_link` has a separate 10-second default, configurable up to 300 seconds; it is not the same launch contract. No default iframe integration is established by these URLs.

## 5. Read the results that exist

Read `GET /assignments/{id}?view=player&page=1&page_size=10&include=activities,players`, then `GET /students/{application_user_id}?view=assignment&page=1&page_size=10` when learner history is needed.

Only the assignment's `players` envelope is paginated. Aggregate arrays such as `by_player` are separate and can contain one row per PlayerActivity, including multiple activity rows for the same learner; do not count them as one combined row per learner. Activity detail includes answered/correct counts, correctness percentage, recorded playtime seconds and start/completion fields. A zero-answer percentage can be null; a configured duration is not observed playtime. See [reporting](https://console.legendsoflearning.com/docs/partner-rest-api#reporting).

Learner/standard reports first resolve app-linked learners but may aggregate their broader nondeleted activity history, including native/shared/migrated activity. They are not guaranteed to contain only assignments created by your application or a requested date window. Assignment access is based on creator membership in the calling app; it is not an immutable origin tag.

For fluency, returned `fluency_facts` are the configured exercise pool, not measured per-fact mastery. There is no public per-fact attempts, latency, trial history or adaptive-progress contract. Verify populated results with actual synthetic play before promising a results-dependent pilot, gradebook update or webhook workflow.

## References and examples

- [Fluency: assignment → learner launch → results](https://console.legendsoflearning.com/docs/fluency-assignments)
- [REST API contract and scopes](https://console.legendsoflearning.com/docs/partner-rest-api)
- [Partner MCP: server-to-server Bearer client](https://console.legendsoflearning.com/docs/partner-mcp)
- [Otus Insights addendum](https://console.legendsoflearning.com/docs/otus-insights) — a labeled partner example, not a prerequisite for using the API
- [Swagger](https://api.smartlittlecookies.com/api/v3/docs/swagger-ui) · [OpenAPI](https://api.smartlittlecookies.com/api/v3/docs/openapi) · [Public Showcase source](https://github.com/LegendsOfLearning/rest-api-showcase)

## Application permissions


Business routes enforce the calling application's configured scopes. For resources in the configured scope hierarchy, including `users` and `assignments`, `access` implies `write`, which implies `read`. For example, `assignments:write` includes `assignments:read`. `content_reviews` and `searches` require their explicit grants; do not infer unsupported write/read scope variants. Requesting a narrower token scope does not create a read-only guarantee when the application still has broader configured grants; use a separately restricted application for that boundary.

| Operations | Required application scope |
| --- | --- |
| `GET /applications/me`, `GET /users`, `GET /users/{id}`, `GET /users/{id}/mastery_completed_v2_count` | `users:read` |
| `POST /users`, `PUT /users/{id}`, `POST /users/login_link` | `users:write` |
| `GET /standard_sets`, `GET /standard_sets/{id}/standards` | `standards:read` |
| `GET /content`, `GET /content/{id}` | `content:read` |
| `GET /content/{id}/reviews` | `content_reviews:read` |
| `POST /searches` | `searches:write` |
| `GET /assignments`, `GET /assignments/{id}`, `GET /students/{application_user_id}`, `GET /standards/{id}` | `assignments:read` |
| `POST /assignments` | `assignments:write` |
| `POST /assignments/{id}/joins`, `POST /content_links`, `DELETE /content_links/{token}` | `assignment_joins:write` |

[Partner MCP](https://console.legendsoflearning.com/docs/partner-mcp) uses the same grants. Discovering a tool does not grant permission to execute it.


## Fluency assignments

Fluency is a shared Partner API capability. Create an `awakening_fluency` activity through `/assignments`, launch learners through `/assignments/{id}/joins`, and read the existing assignment/player reports. Use the same application credentials and learner identities as other assignment activities.

[Staging Showcase fluency builder](https://api-showcase.legendsoflearning.com/login?environment=staging&next=%2Fassignments%2Fbuild%3Ftype%3Dfluency) · [Authentication and permissions](https://console.legendsoflearning.com/docs/partner-rest-api) · [Partner MCP](https://console.legendsoflearning.com/docs/partner-mcp)

Download [the Python API client](https://console.legendsoflearning.com/docs/examples/partner-api/partner_client.py) and [the fluency walkthrough](https://console.legendsoflearning.com/docs/examples/partner-api/fluency_quickstart.py) into the same directory. Run `python3 fluency_quickstart.py --help` for protected credential prompts, staging defaults and explicit-facts/fallback options.

### Before you start

Use the designated staging application and synthetic teacher/student identities. Check `/applications/me`; ensure effective user, assignment and join scopes. The configured hierarchy grants `users:write` → `users:read` and `assignments:write` → `assignments:read`; other operations still require their documented explicit grants. A narrower requested token scope is not a substitute for configuring a restricted application's grants.

All paths below are relative to `https://api.smartlittlecookies.com/api/v3`. Fluency takes facts directly; no standards lookup or `standard_id` is needed. Register the creator and learner through `/users` with stable external IDs; include nonempty teacher names. Existing-account sign-in restrictions still apply.

### 1. Create a fluency assignment

Send `POST /assignments` with an idempotency key for this logical assignment:

```json
{
  "application_user_id": "partner-test-teacher-001",
  "name": "Arithmetic practice",
  "activities": [{
    "type": "awakening_fluency",
    "fluency_facts": [
      {"a": 3, "b": 4, "op": "add"},
      {"a": 14, "b": 6, "op": "sub"},
      {"a": 6, "b": 7, "op": "mul"},
      {"a": 12, "b": 3, "op": "div"}
    ]
  }]
}
```

The response contains `assignment_id`. The server associates a curated fluency learning objective internally for launch and reporting; this does not change your fact pool. Existing explicit `standard_id` requests remain supported. The type alias `fluency` and the `facts` field alias are also accepted. Operands must be integers; operations are `add`, `sub`, `mul`, `div`. Division requires a nonzero divisor and an integer quotient. Invalid facts return 422.

A nonempty explicit `fluency_facts` list takes precedence over the learner's current focus. The list is an exercise pool: the runtime samples facts and does not promise every configured fact is attempted. If facts are omitted or empty, fluency falls back to the persisted Math Basecamp daily-target/practice mix; an empty list does not request zero practice. That fallback depends on learner state. The compatibility `facts` alias exists, but use `fluency_facts` for new clients.

`awakening_mastery`, `awakening_focus` and `awakening_timed` are distinct activity types. Timed requires positive `play_duration_seconds`; configured duration is not measured time spent. These types do not create a partner-facing assessment/trial-submission engine or let the partner reset global adaptive progression.

### 2. Launch the learner into Awakening

Send `POST /assignments/{assignment_id}/joins`:

```json
{"application_user_id":"partner-test-student-001","target":"awakening"}
```

Resolve the learner and their authorized audience on your backend. Return the generated `join_url` only to that learner and open it exactly as returned. Keep it out of prompts, logs, screenshots and shared resources. Assignment joins currently expire after 24 hours; generate them on demand.

The Showcase's fluency builder supports an explicit fact pool and selects Awakening. Use the API walkthrough to exercise omitted-facts fallback; the builder does not claim to configure the persisted daily practice mix.

### 3. Read assignment and learner results

Use `GET /assignments/{id}?view=player&include=activities,players&page=1&page_size=10`. Follow `players` pagination. Its `entries[].activities[]` can include:

| Field | Meaning |
| --- | --- |
| `id`, `type` | Activity identity and type |
| `total_answered`, `total_correct` | Recorded activity counts |
| `percent_correct` | Percentage from recorded counts; may be null when no questions were answered |
| `reported_playtime_sec` | Recorded playtime in seconds |
| `started_at`, `completed_at` | Recorded activity timestamps; completion can be absent |

`by_player` is a separate aggregate view derived from PlayerActivity rows and may contain several rows per learner. It is not the paginated player-detail envelope. Read `/students/{application_user_id}?view=assignment` for learner assignment history, with the broader-history boundary in the [reporting contract](https://console.legendsoflearning.com/docs/partner-rest-api#reporting).

The assignment's returned `fluency_facts` describes configuration. It does **not** report mastery, attempts or latency for each fact. There is no dedicated public per-fact fluency analytics/trial-history API, and total V2 mastery stars from `/users/{id}/mastery_completed_v2_count` are not a count of fluent arithmetic facts.

### Verify a populated pilot

Use two authorized synthetic learners, explicit facts and omitted-facts fallback. Check assignment creation/idempotency, individual Awakening launch, actual practice and populated result fields against the agreed definition. Successful creation, a launch shell or an empty report alone does not prove gameplay completion or adaptive/per-fact analytics. Agree additional reporting needs before promising them.

## Partner MCP authentication

Partner MCP uses the same environment-specific application access token in an explicit `Authorization: Bearer` header. Your backend obtains/renews it via `grant_type=client_credentials`. The endpoint URL alone does not provide interactive ChatGPT/browser consent, OAuth client registration or a partner refresh flow. Staff MCP OAuth is separate. Keep tokens out of tool arguments. [Connection guide](https://console.legendsoflearning.com/docs/partner-mcp).

## Reuse with a coding agent

Read this maintained guide and the environment’s live OpenAPI before copying code. Give the agent no credentials, user records or launch URLs. Store credentials through your protected backend setup. Reuse the server-side endpoint/proxy pattern rather than browser cookies or this demo’s authentication as a production identity model. Verify authorization, idempotent retries and populated results in your own application.

- `src/app/api/auth/login/route.ts`: allowlisted environment-specific client-credentials exchange.
- `src/app/api/[...legends]/route.ts`: server-only Bearer proxy.
- `src/lib/api/endpoints.ts`: REST endpoint helpers.
- `src/components/assignments/AssignmentLauncher.tsx`: teacher-created assignments, fluency and plural joins.
- `src/app/api/auth/logout/route.ts`: local cookie cleanup without revoking shared application tokens.

The private Console manages workspaces, applications and access. This public repo demonstrates one application’s API use; it does not create production credentials or replace a partner’s own user/audience authorization.
