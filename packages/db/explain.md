Nice — I mapped your full Drizzle schema into a practical application design, listed the REST endpoints you’ll need, explained how resources relate, and added implementation & operational notes (auth, soft-delete, transactions, background jobs, search, uploads, pagination, etc.). I didn’t ask any clarifying questions — I made reasonable decisions based on your schema. Use this as your API roadmap.

# 1 — High-level overview

Your domain models represent a multi-tenant system (organizations) that manages missions, mission crews, waste-materials, processing modules & recipes, simulation runs that produce products, and common concerns (users, apiKeys, attachments, comments, auditLogs, settings, searchIndex).
Multi-tenancy is modeled via `organizations.id` referenced from many tables. Soft deletes are modeled by `deleted_at`. Many tables have `version` for optimistic concurrency.

# 2 — Important relations (how things connect)

* `organizations` is the tenant root. Most data belongs to an organization.
* `users.organization_id` → `organizations.id`. Users have roles in `user_roles` and assignments in `mission_crew`.
* `missions.organization_id` → `organizations`. Missions have `mission_crew`, `simulation_runs`, `products`.
* `simulation_runs.mission_id` → `missions.id` and `simulation_runs.created_by` → `users.id`. SimulationRuns produce `products`.
* `processing_recipes.organization_id` → `organizations`. Recipes produce `product_type` and are referenced by `products.recipe_id`.
* `processing_modules.organization_id` → `organizations` (equipment).
* `waste_materials.organization_id` → `organizations`.
* `comments` can reference arbitrary entities via `entity_type` + `entity_id` and are self-referential (parent\_comment\_id).
* `search_index` stores pre-computed searchable content for entities.

# 3 — Recommended REST endpoints (grouped by resource)

I list canonical endpoints (CRUD + common actions). Use organization scoping for tenant-safe access (either in path or via auth claims). Use JSON body for creates/updates. Use `PATCH` for partial updates.

## Organization (multi-tenant)

* `GET /organizations` — list organizations (admin).
* `POST /organizations` — create org.
* `GET /organizations/:orgId` — get org.
* `PATCH /organizations/:orgId` — edit org (settings, version check).
* `DELETE /organizations/:orgId` — soft-delete (set deleted\_at) or hard delete for super-admin.

## Users & Auth

* `POST /auth/login` — returns access token (JWT) or session cookie.
* `POST /auth/refresh` — refresh token.
* `GET /users` — list users (filter by org).
* `POST /organizations/:orgId/users` — create user in org.
* `GET /users/:userId` — get user.
* `PATCH /users/:userId` — update profile (use `version` check).
* `DELETE /users/:userId` — soft-delete.
* `GET /users/:userId/roles` — get roles.
* `POST /users/:userId/roles` — grant role (body: role, granted\_by).
* `DELETE /users/:userId/roles/:role` — revoke.

## API Keys

* `GET /users/:userId/api-keys`
* `POST /users/:userId/api-keys` — create (returns raw key once; store only hash).
* `PATCH /api-keys/:id` — enable/disable, expiry.
* `DELETE /api-keys/:id`

## Missions & Crew

* `GET /organizations/:orgId/missions`
* `POST /organizations/:orgId/missions`
* `GET /missions/:missionId`
* `PATCH /missions/:missionId`
* `DELETE /missions/:missionId` (soft-delete)
* `GET /missions/:missionId/crew`
* `POST /missions/:missionId/crew` — assign user (body: user\_id, role, specialization)
* `DELETE /missions/:missionId/crew/:crewId` — remove or mark removed\_at

## Waste Materials & Catalog

* `GET /organizations/:orgId/waste-materials`
* `POST /organizations/:orgId/waste-materials`
* `GET /waste-materials/:id`
* `PATCH /waste-materials/:id`
* `DELETE /waste-materials/:id`

## Processing Modules (equipment)

* `GET /organizations/:orgId/modules`
* `POST /organizations/:orgId/modules`
* `GET /processing-modules/:id`
* `PATCH /processing-modules/:id` — status, throughput
* `DELETE /processing-modules/:id`

## Processing Recipes

* `GET /organizations/:orgId/recipes`
* `POST /organizations/:orgId/recipes`
* `GET /processing-recipes/:id`
* `PATCH /processing-recipes/:id`
* `DELETE /processing-recipes/:id`

## Simulation Runs

* `GET /missions/:missionId/simulations` — list runs for mission
* `POST /missions/:missionId/simulations` — start a simulation (creates simulationRuns row, enqueue background job)
* `GET /simulation-runs/:id` — get run status & results
* `PATCH /simulation-runs/:id/cancel` — request cancel
* `GET /simulation-runs/:id/logs` — optional streaming logs for debugging
* Real-time progress: use WebSocket or Server-Sent Events at `/simulations/:id/subscribe` (see special flows below).

## Products

* `GET /missions/:missionId/products`
* `GET /products/:id`
* `POST /products` — usually produced by simulation pipeline, but optionally manual create
* `PATCH /products/:id`
* `DELETE /products/:id`

## Comments & Attachments

* `GET /:entityType/:entityId/comments`
* `POST /:entityType/:entityId/comments` — body: content, attachments\[] (IDs)
* `PATCH /comments/:id`
* `DELETE /comments/:id`
* Attachments (file upload flow — presigned):

  * `POST /attachments/presign` — request presigned URL (body: filename, mime\_type, size, checksum) → returns `{ uploadUrl, attachmentMetadata }`
  * `POST /attachments/complete` — register uploaded file (server verifies checksum and metadata)
  * `GET /attachments/:id/download` — either redirect to S3 or stream

## Audit logs

* `GET /organizations/:orgId/audit-logs` — read-only (admin), supports filters by entity, user, date-range

## Settings

* `GET /organizations/:orgId/settings`
* `POST /organizations/:orgId/settings` (system vs org scope)
* `GET /users/:userId/settings`
* `PATCH /settings/:id`

## Search & Indexing

* `GET /search?q=...&entity_type=...&orgId=...&tags=...` — use `search_index` table
* `POST /search/reindex` — admin endpoint to re-index an entity or the whole org (enqueue job)

## Admin & Operations

* `POST /admin/rebuild-search`
* `GET /health` — app & DB health check
* `GET /version` — service version and migrations status

# 4 — Payload & parameters (examples)

Example: create mission
`POST /organizations/:orgId/missions`
Body:

```json
{
  "name": "Mars Settlement Alpha",
  "description": "Test mission",
  "launch_date": "2031-07-10T12:00:00Z",
  "landing_date": "2031-12-10T12:00:00Z",
  "crew_size": 8,
  "settings": { "recycle_target_kg_per_day": 100 }
}
```

Example: start simulation
`POST /missions/:missionId/simulations`
Body:

```json
{
  "name": "Optimize brick output",
  "run_type": "throughput_optimization",
  "config": { "target": "brick", "time_horizon_days": 30 }
}
```

Response includes `id`, `status: queued`, `created_at`.

# 5 — Special flows & implementation notes

### Simulation runs & background processing

* Start run: create `simulation_runs` row with `status = queued`, `config` JSON, enqueue job (e.g., Redis queue).
* Worker picks job, sets `status = running`, updates `progress_percent`, stores `results` when finished and creates `products` rows inside a DB transaction.
* Use WebSocket/SSE to push progress to clients (subscribe using simulation run id).
* Persist logs to a file store or a `simulation_logs` table (if you want).

### File Uploads (attachments)

* Use presigned URLs (S3/MinIO) for upload. Client calls `POST /attachments/presign` and server returns an upload URL and a temporary attachment record. After upload, client calls `POST /attachments/complete` to finalize.
* Use `checksum_sha256` to deduplicate and create unique index for identical files.

### Search

* Keep `search_index` updated on create/update/delete OR run periodic re-index jobs.
* For high quality search, convert `search_vector` to `tsvector` and create a `GIN` index: faster text search.
* Use `search_index.tags` (jsonb) and GIN index for tag filters.

### Soft deletes & partial indexes

* Many partial indexes use `WHERE deleted_at IS NULL`. Ensure every query excludes soft-deleted rows by default (`WHERE deleted_at IS NULL` or add a global query filter at ORM level).

### Concurrency control

* Use `version` column for optimistic locking. On update: `UPDATE ... WHERE id = :id AND version = :currentVersion` and increment `version`.
* Alternatively use `SELECT FOR UPDATE` within transactions when a stronger lock is needed.

### Transactions & integrity

* Multi-row changes (e.g., simulation run producing many `products`) must be in a transaction so partial results aren’t persisted on failure.
* Use FK constraints (already in schema) + transactional worker.

### Pagination & filtering

* Provide `limit`, `offset` or cursor (`created_at,id`) pagination.
* Filtering examples: `GET /missions?status=active&organization_id=:orgId&limit=20&page=2`
* Sorting: `?sort=created_at:desc` or separate params.

### Security & RBAC

* Authentication: JWT Bearer tokens or session cookies.
* Authorization: check organization membership and roles (admin, mission\_commander, crew\_member, etc.). Use `user_roles` table to resolve permissions.
* API keys: support granular `permissions` JSON for scopes; store hash only (you already do `key_hash`).
* Rate-limiting (per-user, per-org), IP audit via `audit_logs`.

### Audit logs

* Insert audit log row on critical actions (create/update/delete/grant-role). Consider async logging if write volume is high.

# 6 — Performance & indexing notes (from your schema)

* You already added many helpful indexes (org indexes, partial indexes excluding deleted rows).
* `search_index.tags` should be GIN (you used that in SQL) — good.
* For `search_vector` consider using `tsvector` + `GIN` functional index for full-text queries.
* For heavy simulation data, partition `simulation_runs` or archive old runs.

# 7 — Error handling & status codes (patterns)

* `200 OK` for GET, `201 Created` for POST with `Location` header.
* `204 No Content` for successful DELETE (soft-delete) or successful action that returns nothing.
* `400 Bad Request` for invalid payloads, `401 Unauthorized`, `403 Forbidden`.
* `404 Not Found` for missing resources or wrong org scope.
* `409 Conflict` for optimistic lock/version mismatch or unique index violations.
* Return a consistent error body:

```json
{ "error": "ValidationError", "message": "...", "details": {...} }
```

# 8 — Suggested monitoring & infra

* Background worker dashboard (jobs queue) to monitor simulation tasks.
* Metrics (prometheus): request latency, queue length, simulation run durations, error rates.
* Health & readiness endpoints.

# 9 — Example SQL snippets for common queries

* Get mission with crew:

```sql
SELECT m.*, json_agg(mc.*) AS crew
FROM missions m
LEFT JOIN mission_crew mc ON mc.mission_id = m.id AND mc.removed_at IS NULL
WHERE m.id = :missionId AND m.deleted_at IS NULL
GROUP BY m.id;
```

* List active runs for mission:

```sql
SELECT * FROM simulation_runs WHERE mission_id = :id AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 50;
```

# 10 — Next steps checklist (pick what you want me to produce)

* [ ] Full OpenAPI spec (paths, request/response schemas) for all endpoints above.
* [ ] Example worker implementation pattern (pseudo-code) for simulation runs.
* [ ] Presigned upload flow code example (server + S3).
* [ ] GraphQL schema equivalent of the REST design.
* [ ] DB migration script idempotent for your environment.
* [ ] Add full-text search implementation (tsvector + triggers + reindex job).

Tell me which of those you want next and I’ll generate it (OpenAPI, worker pseudocode, sample SQL, or presigned upload code).

