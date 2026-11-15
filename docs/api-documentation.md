# Partner API quickstart

Create an assignment for a synthetic learner, launch it in Awakening, and read the recorded results. You need application credentials for the environment you use. [Get credentials](https://console.legendsoflearning.com/docs/registration#path-a-partner-application-v3-rest) or [try the fluency demo](https://api-showcase.legendsoflearning.com/demo/fluency) first.

![Partner assignment flow: authenticate the backend, link teacher and learner, create and launch practice, then read recorded results.](/docs/diagrams/partner-assignment-flow.svg)

## 1. Connect your application

| Environment | REST API base |
| --- | --- |
| Staging / test | `https://api.smartlittlecookies.com/api/v3` |
| Production | `https://api.legendsoflearning.com/api/v3` |

Start in staging with synthetic users. All paths below are relative to the API base. The `app.smartlittlecookies.com` and `app.legendsoflearning.com` aliases also serve the corresponding API.

Your backend sends form-encoded `grant_type=client_credentials`, `client_id` and `client_secret` to `POST /oauth2/token`. Use the returned token as `Authorization: Bearer {access_token}`, then call `GET /applications/me` to confirm the application.

Store credentials on your server. Use `expires_in` to request a new token when needed. Normal logout should clear local state without revoking a token that other clients may share. See [authentication and scopes](https://console.legendsoflearning.com/docs/partner-rest-api#environments-and-authentication).

## 2. Link a teacher and learner

Send a separate `POST /users` request for each identity:

```json
{"application_user_id":"partner-test-teacher-001","role":"teacher","first_name":"Integration","last_name":"Teacher"}
```

```json
{"application_user_id":"partner-test-student-001","role":"student","first_name":"Integration","last_name":"Student"}
```

Keep these external IDs stable within your application. Teacher names must be nonempty. The response's numeric `user_id` is a different identifier: use it for user-detail and update routes, and use the external ID for assignment creation, joins and student reports.

Derive identities and audience permissions from your authenticated backend. Existing-account linking has additional [sign-in restrictions](https://console.legendsoflearning.com/docs/partner-rest-api#identity-and-launch).

## 3. Preview and create an assignment

Use an `activities` array and the teacher's external ID. Discover content and standard IDs in your environment; the numbers below are examples.

```json
{
  "application_user_id": "partner-test-teacher-001",
  "name": "Practice",
  "activities": [{"content_id": 1234, "standard_id": 5678}]
}
```

Send this body to `POST /assignments` with `dry_run: true` to preview. Remove `dry_run` to create, include a stable `Idempotency-Key` for retries, and save `assignment_id`. If you supply a schedule, include both dates as `YYYY-MM-DD`.

For arithmetic practice, follow [Fluency assignments](https://console.legendsoflearning.com/docs/fluency-assignments): supply facts, family seeds or ranges directly without a standard lookup. The [REST reference](https://console.legendsoflearning.com/docs/partner-rest-api#assignment-capabilities) covers other activity types, audience fields and legacy request limits.

## 4. Launch the learner

Send `POST /assignments/{id}/joins`:

```json
{"application_user_id":"partner-test-student-001","target":"awakening"}
```

Open the returned `join_url` for that learner exactly as returned. Generate it when the learner launches and keep it out of shared resources and logs. Assignment joins currently last 24 hours. A new learner may need to complete Awakening setup.

Use Awakening for fluency and standard activities; supported content can also use `web`. Standalone login links and iframe integration have separate rules in [identity and launch](https://console.legendsoflearning.com/docs/partner-rest-api#identity-and-launch).

## 5. Read results after practice

Call `GET /assignments/{id}?view=player&page=1&page_size=10&include=activities,players`.

Read recorded counts and playtime from `players.entries[].activities[]`, and follow the `players` pagination metadata. Empty results are expected before practice. Configured fluency facts describe the exercise pool; they do not report per-fact mastery.

The [reporting reference](https://console.legendsoflearning.com/docs/partner-rest-api#reporting) explains aggregate rows, units, completion fields and learner-history scope. Test with two synthetic learners and check populated results before using them for a pilot or gradebook workflow.

## Continue with code

[Download the Python examples](https://console.legendsoflearning.com/docs/tools-and-examples), replay calls in the [staging Showcase](https://api-showcase.legendsoflearning.com/login?environment=staging&next=%2Fpartners), or run the same operations through [Partner MCP](https://console.legendsoflearning.com/docs/partner-mcp). The [Otus Insights example](https://console.legendsoflearning.com/docs/otus-insights) shows a partner-specific recommendation and teacher-confirmation flow.

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

Create fluency practice with an `awakening_fluency` assignment activity. Use the same application credentials, learner IDs, joins and reports as other Partner API activities.

[Staging Showcase fluency builder](https://api-showcase.legendsoflearning.com/login?environment=staging&next=%2Fassignments%2Fbuild%3Ftype%3Dfluency) · [Authentication and permissions](https://console.legendsoflearning.com/docs/partner-rest-api) · [Partner MCP](https://console.legendsoflearning.com/docs/partner-mcp)

Download [the Python API client](https://console.legendsoflearning.com/docs/examples/partner-api/partner_client.py) and [the fluency walkthrough](https://console.legendsoflearning.com/docs/examples/partner-api/fluency_quickstart.py) into the same directory. Run `python3 fluency_quickstart.py --help` for protected credential prompts, staging defaults and explicit-facts/fallback options.

Try the [editable fluency demo](https://api-showcase.legendsoflearning.com/demo/fluency) without credentials. Its fact editor, generator and code examples use the same selectors described below.

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

The response contains `assignment_id`. The server supplies the internal fluency learning objective used for launch and reporting while preserving your fact pool. Existing explicit `standard_id` requests remain supported. The type alias `fluency` and the `facts` field alias are also accepted. Operands must be integers; operations are `add`, `sub`, `mul`, `div`. Division requires a nonzero divisor and an integer quotient. Invalid facts return 422.

A nonempty explicit `fluency_facts` list takes precedence over the learner's current focus. The runtime samples the exercise pool, so a learner may not attempt every configured fact. If facts are omitted or empty, fluency falls back to the persisted Math Basecamp daily-target/practice mix; an empty list does not request zero practice. That fallback depends on learner state. The compatibility `facts` alias exists, but use `fluency_facts` for new clients.

`awakening_mastery`, `awakening_focus` and `awakening_timed` are distinct activity types. Timed requires positive `play_duration_seconds`; configured duration is not measured time spent. These types do not create a partner-facing assessment/trial-submission engine or let the partner reset global adaptive progression.

#### Families and operator ranges

![The seed 3 × 9 expands to 3 × 9, 9 × 3, 27 ÷ 3 and 27 ÷ 9.](/docs/diagrams/fluency-family.svg)

Use one input mode per activity: exact `fluency_facts`, `fluency_fact_families`, or `fluency_fact_ranges`.

```json
{"type":"awakening_fluency","fluency_fact_families":[{"op":"mul","a":3,"b":9}]}
```

This selects the existing Basecamp family: `3×9`, `9×3`, `27÷3`, `27÷9`. Addition `2+3` includes `2+3`, `3+2`, `5−2`, `5−3`. Seeds may use `add`, `sub`, `mul` or `div`; unsupported catalog families return an indexed 422. Repeated facts are deduplicated.

```json
{"type":"awakening_fluency","fluency_fact_ranges":[{"op":"add","min":0,"max":10},{"op":"mul","min":0,"max":12}]}
```

Range bounds are inclusive and apply to both operands. `add` supports 0 to 10 and `mul` supports 0 to 12; `min` must not exceed `max`. Ranges generate only the selected operators, including zero operands. Use families to include inverse relationships. Overlapping ranges are deduplicated.

Each new selector accepts 1 to 250 entries. Explicit empty/null selectors, conflicting input modes, invalid bounds, and unsupported families return 422. Omitted/empty raw facts retain the existing daily-mix fallback when neither new selector is supplied.

Send `dry_run: true` with the normal assignment request to inspect the expanded `activities[].fluency_facts` before creating. Creation stores that same fixed pool; assignment reads return it. Families/ranges do not enable adaptive progression, target weighting, mastered-fact infilling, or A/B presentation rotation. The original shorthand is not retained in reports.

### 2. Launch the learner into Awakening

Send `POST /assignments/{assignment_id}/joins`:

```json
{"application_user_id":"partner-test-student-001","target":"awakening"}
```

Resolve the learner and their authorized audience on your backend. Return the generated `join_url` only to that learner and open it exactly as returned. Keep it out of prompts, logs, screenshots and shared resources. Assignment joins currently expire after 24 hours; generate them on demand.

A new learner's first launch includes Awakening onboarding. Reuse a prepared synthetic learner for a short practice demo.

The Showcase builder previews exact facts, families and ranges and launches Awakening. Use the API walkthrough to test the learner's saved daily mix; the builder does not configure that mix.

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

The assignment's returned `fluency_facts` describes configuration. It does not report mastery, attempts or latency for each fact. There is no dedicated public per-fact fluency analytics/trial-history API, and total V2 mastery stars from `/users/{id}/mastery_completed_v2_count` are not a count of fluent arithmetic facts.

### Verify a populated pilot

Use two authorized synthetic learners, explicit facts and omitted-facts fallback. Check assignment creation/idempotency, individual Awakening launch, actual practice and populated result fields against the agreed definition. Successful creation, a launch shell or an empty report alone does not prove gameplay completion or adaptive/per-fact analytics. Agree additional reporting needs before promising them.

## Continue building

[Developer documentation](https://console.legendsoflearning.com/docs) has the REST reporting contract, Partner MCP setup and separate user sign-in guides. [Tools and examples](https://console.legendsoflearning.com/docs/tools-and-examples) links the Python clients, OpenAPI schemas and source repositories.

This Showcase demonstrates API calls for one application. Your backend must authorize teachers, learners and assignment audiences. Keep credentials and learner launch URLs out of prompts and shared logs.
