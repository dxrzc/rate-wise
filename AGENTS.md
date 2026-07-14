# AGENTS.md — RateWise Backend

This file covers the **NestJS backend** in `src/`. The `frontend/` directory is a separate Next.js project with its own `AGENTS.md`. The `chat-bot/` directory is another independent project.

## Prerequisites

- **Node 22.21.1** (pinned in `.nvmrc`, enforced via `engine-strict=true` in `.npmrc`). Use `nvm use` before any command.
- **Docker** must be running. `npm run dev` and `npm run test:e2e` orchestrate their own Docker Compose stacks.
- **Ollama** (`llama3.2:3b`) is pulled automatically by an `ollama-puller` sidecar in the dev compose stack.

## Install

```sh
npm ci --legacy-peer-deps
```

`--legacy-peer-deps` is mandatory due to a known `@nestjs/apollo` ↔ Apollo Server v5 peer conflict (see `Dockerfile:4-7`). Do not attempt to "fix" it.

## Common commands

| Command | Notes |
|---|---|
| `npm run dev` | Full stack via `docker/base.compose.yml` + `docker/dev.compose.yml`. App at `:3000`, GraphQL at `/graphql`, Mailpit UI at `:8025`, RedisInsight at `:5540`. Hot-reloads inside container. |
| `npm run build` | `nest build` → `dist/` |
| `npm run start` | `nest start` (standalone, no Docker) |
| `npm run lint` | ESLint with `--fix` on `{src,testing}/**/*.ts`. Run **after any code change**. |
| `npm run test:unit` | Jest `testing/jest-configs/jest.unit.config.ts` |
| `npm run test:components` | Jest `testing/jest-configs/jest.components.config.ts` |
| `npm run test:integration` | Jest `testing/jest-configs/jest.integration.config.ts` (launches TestContainers) |
| `npm run test:e2e` | Node script that spins up a Traefik + production stack, runs jest, tears down |
| `npm run migration:generate <Name>` | Runs **inside dev container**; writes to `db/migrations/<Name>/` |
| `npm run dev:migration:run` | Applies pending migrations against dev postgres |
| `npm run dev:migration:revert` | Reverts last migration |

## Testing strategy (4 layers)

All test specs live under `testing/suites/<layer>/specs/`. Each layer has its own Jest config in `testing/jest-configs/`. The `testing/tsconfig.json` defines path aliases (`@unit/*`, `@components/*`, `@integration/*`, `@e2e/*`, `@testing/tools/*`).

- **Unit** (`test:unit`) — pure business logic, no I/O.
- **Components** (`test:components`) — module, guard, or middleware tested in isolation. Uses helper imports from `testing/suites/components/imports/` (e.g. `createTypeormImport` with `synchronize: true`, `createCacheImport`, `createDisabledLoggerImport`, `createGqlImport`). Requires a running PostgreSQL provided by `globalSetup`.
- **Integration** (`test:integration`) — boots the real `AppModule` with TestContainers (PostgreSQL 17.5 + Redis auth + Redis cache + Mailpit). DB is cloned per file via `cloneDatabase` helper. BullMQ queues are **mocked** (`EmailsQueueMock`, `PaginationCacheQueueMock`) to prevent Worker background threads. Custom jest matchers: `toContainCookie`, `emailSentToThisAddress`, `toFailWith`, `notToFail` (registered in `set-jest.ts`).
- **E2E** (`test:e2e`) — `scripts/run-e2e-tests.js` brings up `docker/e2e.compose.yml` (Traefik + production build app with isolated volumes), waits for healthcheck, runs jest, then `docker compose down --volumes`. App is accessed via `https://localhost` through Traefik. A fresh `HttpClient` instance per test to avoid session cookie sharing.

**Rules:**
- ESLint enforces cross-suite import restrictions: integration specs cannot `import` from `@unit/*`, `@e2e/*`, `@components/*`, and vice versa.
- `toContainCookie` and `emailSentToThisAddress` matchers are integration-only (linter error if used in unit/components).
- **Never edit jest config files or test setup files unless explicitly asked.**

## Architecture notes

- **`src/app/app.module.ts`** is the single root module. Non-API infrastructure (TypeORM, GraphQL, Cache, Throttler, Bull, Sessions, Tokens, HttpLogger) is wired via `forRootAsync` — **do not hardcode environment values inside feature modules**. The pattern keeps modules testable in isolation.
- **3 separate Redis instances:**
  - `REDIS_AUTH_URI` — sessions + tokens (fail-fast, `disableOfflineQueue: true`)
  - `REDIS_QUEUES_URI` — BullMQ background jobs (retries indefinitely queued messages)
  - `REDIS_CACHE_URI` — `cache-manager` via `@keyv/redis` (record-level cache, fail-fast)
- **Cursor-based pagination** (`src/pagination/`) keyed on `(createdAt, id)` from `BaseEntity`. Cache populated async by `PaginationCacheProducer`/`PaginationCacheConsumer` (BullMQ). Every paginated query receives `LIMIT+1` to detect `hasNextPage`.
- **Auth:** cookie-based sessions (`express-session` + `connect-redis`). Session middleware applied globally (`AppModule.configure`). At most `MAX_USER_SESSIONS` per user. REST endpoints at `/auth/verify-account`, `/auth/delete-account`, `/auth/sign-out-all` process link-based token actions.
- **Seed** (`src/seed/`): registered only when `NODE_ENV !== 'production'` (gated in `app.module.ts:153-156`). In production, `AdminService.onModuleInit` auto-seeds admin + 4 users/8 items. Dev/test environments expose a `runSeed` GraphQL mutation.
- **AI** (`src/ai/`): REST endpoint `POST /ai/chat` — streams model responses via `ollama-ai-provider-v2` + `@ai-sdk/anthropic` (fallback). Registered only when `NODE_ENV !== 'integration'` (`app.module.ts:166-169`). Uses `llama3.2:3b` pulled at compose startup.

## Code conventions

- **GraphQL docs**: create `src/<module>/graphql/docs/<operation>.docs.ts` (typed `QueryOptions` / `MutationOptions`) and import it in the resolver. Schema is code-first (`autoSchemaFile: true` in components test import, `autoSchemaFile: 'schema.gql'` in production config).
- **Resolver decorator stack** (order matters):
  ```ts
  @Public()                         // or @Roles(UserRole.CREATOR)
  @RateLimit(RateLimitTier.RELAXED) // see src/common/rate-limit/rate-limit.profiles.ts
  @RequireAccountStatus(AccountStatus.ACTIVE)
  @Query(() => ItemModel, findItemByIdDocs)
  ```
- **Errors**: use `GqlHttpError` (`src/common/errors/graphql-http.error`) — provides typed HTTP + GraphQL error mapping via `catchEverythingFilter`.
- **Config access**: inject the typed config service (`src/config/services/*ConfigService`). Never read `process.env` directly in business logic.
- **Logging**: inject `HttpLoggerService` (request-scoped, JSON-structured) via `HttpLoggerModule.forFeature({ context: ClassName.name })`. Use `SystemLogger.getInstance()` only for startup/fatal bootstrap logging.
- **Migrations**: TypeORM with `synchronize: false` everywhere except `testing/suites/components/imports/create-typeorm.import.ts`. Generate via `npm run migration:generate`, never by hand.
- **Rate limiting**: 4 tiers (`ULTRA_CRITICAL`, `CRITICAL`, `BALANCED`, `RELAXED`) defined in `src/common/rate-limit/rate-limit.profiles.ts`. Uses `@nest-lab/throttler-storage-redis` with a dedicated Redis connection.

## Branch / PR conventions

- PRs target `main`, `development`, or `release/**` branches.
- Fill out `.github/pull_request_template.md` — check applicable test coverage boxes.
- CI pipeline runs ESLint (reviewdog in PR review mode), unit, components, and integration tests on every PR. E2E tests **only run when PR base ref is `main`** (see `.github/workflows/ci-validate.yml:100`).
- Git commits validated by `@commitlint/config-conventional` via Husky pre-commit hook.
- Docker images published on `v*.*.*` tags via `.github/workflows/ci-artifacts.yml` (Docker Hub: `diegordgzdev/ratewise`).

## References (read, do not duplicate)

- `README.md` — full architecture writeup
- `testing/README.md` — test suite directory layout (1 paragraph)
- `frontend/AGENTS.md` — Next.js frontend rules (scoped to that directory)
