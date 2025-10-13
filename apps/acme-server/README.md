# @acme/acme-server

NestJS-based API server for the Acme application. Provides authentication, waste and product inventory, processing modules, processing runs orchestration with queue/worker, file storage via MinIO/S3, real-time updates via WebSockets, email notifications, Redis-backed sessions, and PostgreSQL using Drizzle ORM.

This README documents every implemented feature, module, endpoint, configuration, and script for the server package.

## Tech Stack
- NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/swagger`, websockets)
- Express 5 with `express-session`
- Redis 5 (`connect-redis`) for session store
- Drizzle ORM with PostgreSQL (`drizzle-orm`, `pg`, `postgres`)
- MinIO/S3 client (`@aws-sdk/client-s3`) for object storage
- BullMQ-like job queue wrapper (custom `QueueService`) for processing runs
- Socket.IO gateway for real-time events
- Nodemailer via `@nestjs-modules/mailer` for emails
- Validation with `nestjs-zod` and Zod
- Swagger OpenAPI with `nestjs-zod` patch

## App Bootstrap
- Global prefix: `v1` (see `src/main.ts` `app.setGlobalPrefix('v1')`).
- CORS: origins `http://localhost:3001`, `http://domain:3001`; methods `GET,POST,PUT,PATCH,DELETE,OPTIONS` (see `src/main.ts`).
- Swagger UI: `GET /api` (document factory from `src/main.ts`).
- Sessions: Express sessions stored in Redis using `REDIS_URL`.
- WebSocket adapter uses `express-socket.io-session` to share sessions (see `src/auth/auth.adapter.ts` and `src/main.ts`).

## Environment Variables
Refer to `.env.example` (mirrors below):
- Project: `COMPOSE_PROJECT_NAME`
- Server: `PORT`
- Database: `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `POSTGRES_HOST_PORT`
- Redis: `REDIS_URL`, `REDIS_PORT`, `REDIS_HOST_PORT`
- Mail: `MAIL_SERVICE`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `MAIL_SMTP_PORT`, `MAIL_UI_PORT`
- MinIO: `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_HOST_PORT`, `MINIO_CONSOLE_HOST_PORT`
- Drizzle Studio: `DRIZZLE_PORT`
- Custom API Keys: `PROMPTER_API_KEY`
- Session: `SESSION_SECRET` (used in `src/main.ts`, defaults to `keyboard cat` if unset)

## Scripts (package.json)
- `start`: Start server
- `start:dev`: Start with nodemon (watch)
- `start:debug`: Start with Nest debug/watch
- `start:prod`: Run compiled `dist/main`
- `build`: Compile TypeScript
- `test`, `test:watch`, `test:coverage`, `test:ui`: Vitest
- `start:worker`: Run background worker (`src/worker/bootstrap.ts`)
- `start:worker:watch`: Worker in watch mode
- `format`, `lint`: Biome
- `email:dev`: React Email preview server (port 3009)
- `clean`, `ci`, `release`, `publish`

## Modules Overview (src/app.module.ts)
- `LoggerModule`: centralized logging (writes under `apps/acme-server/logs/`).
- `DrizzleModule`: async provider for Postgres via Drizzle ORM.
- `RedisModule`: Redis client connection and DI service.
- `MinioModule`: file uploads/downloads via S3-compatible API.
- `QueueModule`: enqueuing processing run jobs.
- `SocketModule`: Socket.IO gateway for real-time events.
- `EmailModule`: email composition and sending.
- `AuthModule`: authentication, session-backed endpoints.
- Domain modules:
  - `WasteMaterialsModule` (types/definitions for waste materials)
  - `WasteInventoryModule` (CRUD for waste items)
  - `MissionsModule` (mission-related entities) [if present in `src/missions/`]
  - `ProcessingModulesModule` (factory/processing equipment lifecycle)
  - `ProcessingRecipesModule` (recipes for processing)
  - `ProductInventoryModule` (outputs/products stock)
  - `ResourceMonitoringModule` (resource metrics) [if present]
  - `ProcessingRunsModule` (orchestration of processing jobs)

## API Base URL
All REST endpoints below are under the global prefix: `/v1`.

### Auth (`src/auth/auth.controller.ts`)
Base: `/v1/auth`
- `POST /signin`
- `POST /signup`
- `GET /signout`
- `GET /me`
- `POST /forgot-password`
- `POST /reset-password`
- `POST /update-profile`
- `POST /verify-code`
- `POST /delete-account`

### Waste Inventory (`src/waste_inventory/waste_inventory.controller.ts`)
Base: `/v1/waste_inventory`
- `POST /` — create waste record
- `GET /` — list all waste records
- `GET /:id` — get one
- `PATCH /:id` — update
- `DELETE /:id` — delete

### Product Inventory (`src/product_inventory/product_inventory.controller.ts`)
Base: `/v1/api/products`
- `GET /` — list products
- `GET /:id` — get one
- `POST /` — create
- `PUT /:id/reserve` — reserve quantity
- `PUT /:id/consume` — consume quantity

### Processing Modules (`src/processing_modules/processing_modules.controller.ts`)
Base: `/v1/api/modules`
- `GET /` — list modules
- `GET /:id` — get module
- `POST /` — create module
- `PATCH /:id` — update module
- `POST /:id/reserve` — reserve module
- `POST /:id/release` — release module
- `POST /:id/maintenance` — set maintenance status

### Processing Recipes (`src/recipes/recipes.controller.ts`)
Base: `/v1/api/recipes`
- `GET /` — list recipes
- `POST /` — create recipe
- `PUT /:id` — update recipe
- `DELETE /:id` — delete recipe
- `POST /:id/validate` — validate recipe
- `GET /recommendations` — recommended recipes

### Processing Runs (`src/processing_runs/processing_runs.controller.ts`)
Base: `/v1/api/runs`
- `POST /` — create run (enqueues job)
- `GET /` — list runs
- `GET /:id` — get run details
- `POST /:id/cancel` — cancel run
- `POST /:id/retry` — retry run
- `GET /:id/logs` — stream or fetch logs

### File Uploads (MinIO) (`src/minio/minio.controller.ts`)
Base: `/v1/upload`
- `POST /` — multipart file upload (S3/MinIO). Returns stored path.
- `GET /:filename` — download/stream file by key

## Real-time WebSockets
- Namespace: `/ws` (see `src/socket/socket.constants.ts`)
- Events emitted (server → client):
  - `run_queued`
  - `run_started`
  - `run_progress`
  - `run_completed`
  - `run_failed`
  - `module_status_changed`
  - `alert_created`
- Adapter shares Express session with sockets (see `src/auth/auth.adapter.ts`).

## Queue & Worker
- `QueueModule` provides `QueueService` (BullMQ-like API) used by `ProcessingRuns` to enqueue jobs.
- Background worker entry: `src/worker/bootstrap.ts` with handler(s) under `src/worker/` (e.g., `run.handler.ts`).
- Use scripts: `pnpm start:worker` or `pnpm start:worker:watch`.

## Database (Drizzle + PostgreSQL)
- Async provider `DrizzleAsyncProvider` exposes a typed `NodePgDatabase<typeof schema>`.
- Schema imported via `~/drizzle` in services/repositories.
- `DATABASE_URL` required. Drizzle configured with `snake_case` casing.

## Sessions & Redis
- `REDIS_URL` required. App connects at boot for session store.
- Sessions configured with secure cookie options in `src/main.ts`.

## Email
- `EmailModule` wired for transactional mail (e.g., password reset/OTP). Configure SMTP settings via Mail env vars.
- Dev preview server available via `pnpm email:dev`.

## Logging
- Winston-based logger via `LoggerModule`. Logs are output to console and files under `apps/acme-server/logs/` (check module for transports).

## Running Locally
1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies from repo root: `pnpm i`.
3. Start Postgres, Redis, and MinIO locally (matching ports in `.env.example`).
4. Start API: `pnpm --filter @acme/acme-server start:dev`.
5. Optional: start worker: `pnpm --filter @acme/acme-server start:worker:watch`.
6. Open Swagger at `http://localhost:3000/api`. All endpoints live under `/v1`.

## CORS
Configured for origins `http://localhost:3001` and `http://domain:3001` with credentials enabled.

## Notes
- Global validation uses Zod pipes in controllers.
- Error handling uses `ErrorExceptionFilter` to normalize responses.
- Some modules listed in `AppModule` may be stubs or internal-only; consult each module folder for details.
