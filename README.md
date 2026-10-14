# HPC Learning Hub API Gateway

NestJS API Gateway for the HPC Learning Hub. The project uses PostgreSQL with
pgvector and TypeORM migrations.

## Prerequisites

- Node.js `22.23.2`
- npm `10.9.8`
- Docker with Docker Compose

## Run locally

### 1. Install dependencies

```bash
npm install
```

### 2. Create the environment file

```bash
cp .env.example .env
```

Update `DB_PASSWORD` in `.env` if needed. The `.env` file is ignored by Git.
The API loads it through NestJS configuration, and database scripts load it
through `dotenv`. Environment values are strings.

### 3. Start PostgreSQL

```bash
docker compose up -d postgres
docker compose ps
```

The PostgreSQL service is ready when its status says `healthy`.

To follow its logs:

```bash
docker compose logs -f postgres
```

### 4. Apply the database migrations

```bash
npm run migration:run
npm run migration:show
```

Applied migrations are marked with `[X]` by `migration:show`.

Migrations are not applied automatically when NestJS starts. Run
`npm run migration:run` whenever you pull a new migration.

### Authentication database model

Authentication uses a CILogon identity model with local application sessions
and roles. The TypeORM entities are registered and the CILogon migration is available.
CILogon login endpoints are still pending.

| Table                     | Purpose and constraints                                                                                                                                                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`                   | Local UUID, required unique username, nullable unique email, nullable `display_name` and `last_login_at`, one role defaulting to `LEARNER`, and managed timestamps.                                                                                            |
| `auth_identities`         | CILogon identity linked to a user. Unique `(issuer, subject)` identifies the external account; unique `user_id` permits one identity per user. Optional `identity_provider` and `institution` hold profile metadata. Deleting a user cascades to its identity. |
| `oidc_login_transactions` | Temporary sign-in state: unique `state_hash`, `nonce`, `pkce_verifier`, `browser_binding_hash`, nullable `return_to` and `consumed_at`, expiry, and creation time. Expiry is indexed; no user foreign key is required before sign-in.                          |
| `auth_sessions`           | Existing local application sessions, with hashed tokens, expiry, and revocation. Deleting a user cascades to its sessions.                                                                                                                                     |

Email and username are profile fields; CILogon authentication will look up the
validated issuer and subject. Roles remain local and are not assigned from
provider claims. Bookmarks and personal paths continue referencing `users.id`.
The PKCE verifier is excluded from default TypeORM selects; the callback lookup
must explicitly select it. Expiry checks, single-use consumption, browser
binding, and cleanup still need to be implemented in the login service.

The CILogon migration creates the identity and login-transaction tables and
updates `users`. Keep historical migrations intact. Running `migration:run` applies only checked-in migrations;
it does not generate schema changes from the entities. Apply the CILogon
migration after restoring a snapshot that predates it.
See the [authentication design](docs/local-authentication-and-authorization-design.md)
for entity fields, relationships, and the planned sign-in flow.

### Restore the committed database snapshot

The repository includes a populated PostgreSQL snapshot at
`src/database/snapshots/learning-hub.dump`. Use either the migrations above to
create an empty database or the snapshot to restore the saved catalog. Do not
run migrations before restoring the snapshot because the snapshot already
contains the schema and migration history.

First, confirm that PostgreSQL can read the snapshot:

```bash
docker compose exec -T postgres pg_restore --list \
  < src/database/snapshots/learning-hub.dump \
  | head
```

Then remove the existing database volume, start a fresh PostgreSQL container,
and restore the snapshot:

> **Warning:** `docker compose down --volumes` permanently deletes the current
> local PostgreSQL data.

```bash
docker compose down --volumes
docker compose up -d postgres

docker compose exec -T postgres sh -c \
  'until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do sleep 1; done'

docker compose exec -T postgres sh -c \
  'pg_restore \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --no-owner \
    --no-privileges \
    --exit-on-error' \
  < src/database/snapshots/learning-hub.dump

npm run migration:run
npm run migration:show
```

The snapshot contains its own migration history. Apply any newer migrations
after restoring it; all migrations should then be marked with `[X]`. Start NestJS
and verify that the catalog is available:

```bash
npm run start:dev
curl 'http://localhost:3000/api/v1/materials?page=1&pageSize=1'
```

### Replace the committed snapshot

To update the snapshot from the currently running local database:

```bash
docker compose exec -T postgres sh -c \
  'pg_dump \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --format=custom \
    --no-owner \
    --no-privileges' \
  > src/database/snapshots/learning-hub.dump
```

Run the `pg_restore --list` validation command above before committing the
replacement snapshot.

### Seed an administrator

After a user has signed in with CILogon, set `ADMIN_USER_ID` in `.env` to their
local user UUID and run `npm run seed:admin`. The script requires a linked
`AuthIdentity` and promotes that account to `ADMIN`. It does not create an
account or match users by email or provider role claims.

### 5. Start NestJS

```bash
npm run start:dev
```

The API uses the `/api/v1` base path. Check the current root endpoint with:

```bash
curl http://localhost:3000/api/v1
```

### Health endpoint

`GET /api/v1/health` is a lightweight process health endpoint. It always
returns HTTP `200` with:

```json
{
  "status": "ok"
}
```

Public catalog and learning-path reads are available at:

```text
GET /api/v1/health
GET /api/v1/materials
GET /api/v1/materials/:materialId
GET /api/v1/materials/:materialId/resources
GET /api/v1/topics
GET /api/v1/tools
GET /api/v1/systems
GET /api/v1/event-series
GET /api/v1/event-series/:seriesId
GET /api/v1/event-editions
GET /api/v1/event-editions/:eventId
GET /api/v1/learning-paths
GET /api/v1/learning-paths/:pathId
```

`GET /api/v1/materials` accepts `search`, `topic`, `tool`, `system`, `eventSeries`,
`eventEdition`, `instructor`, `resourceType`, `page`, and `pageSize` query
parameters. Relationship filters use canonical IDs.

### Authentication and users

The table describes the target CILogon API. The two CILogon routes are planned;
the remaining routes retain their session and role behavior after the switch.

| Endpoint                            | Access        | Description                                                                                |
| ----------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| `GET /api/v1/auth/cilogon/login`    | Public        | Start sign-in and redirect to CILogon; planned.                                            |
| `GET /api/v1/auth/cilogon/callback` | Public        | Validate sign-in, find/create the local user, set a session cookie, and redirect; planned. |
| `POST /api/v1/auth/logout`          | Authenticated | Revoke the current session and clear its cookie; `204`.                                    |
| `GET /api/v1/me`                    | Authenticated | Return the current account and role; `200`.                                                |
| `GET /api/v1/users`                 | `ADMIN`       | List account summaries; `200`.                                                             |
| `PATCH /api/v1/users/:userId/role`  | `ADMIN`       | Assign `LEARNER`, `MAINTAINER`, or `ADMIN`; `200`.                                         |

First successful CILogon sign-in will create a local `LEARNER` account.
Subsequent sign-ins resolve the same account through its issuer and subject.

Account summaries currently contain `id`, `email`, `username`, and `role`.
Their response types still need to handle nullable email. The entity's new
`displayName` and `lastLoginAt` fields are not automatically added to responses.

Sessions expire after 24 hours. The cookie is named `session` in development
and `__Host-session` when `NODE_ENV=production`. Both use HttpOnly,
SameSite=Lax, and path `/`; production also sets Secure and requires HTTPS.
The database stores token hashes, and the raw token is never returned in JSON.
Browser requests must include the cookie; curl can preserve it with `-c` and `-b`.

To change a user's role, send `{ "role": "MAINTAINER" }` to the role endpoint.
Missing sessions return `401`, authenticated non-admins return `403`, invalid
input returns `400`, and missing target users return `404`. Demoting the final
administrator returns `409`. Role changes take effect on the next request using
existing sessions. Concurrent role changes are serialized in a transaction to
preserve the final administrator.

Logout waits for session revocation before clearing the cookie. Further requests
using that session return `401`, including repeated logout requests.

### Saved materials

Saved materials are bookmarks and require a session cookie:

| Endpoint                                  | Description                                         |
| ----------------------------------------- | --------------------------------------------------- |
| `GET /api/v1/me/bookmarks`                | List the caller's saved materials; `200`.           |
| `POST /api/v1/me/bookmarks`               | Save an existing catalog material; `201`.           |
| `DELETE /api/v1/me/bookmarks/:materialId` | Remove the caller's bookmark by material ID; `204`. |

POST accepts a canonical material ID, rather than a bookmark UUID:

```json
{
  "materialId": "replace-with-material-id"
}
```

The ID must be a nonblank string of up to 254 characters. POST returns `id`,
`materialId`, and `createdAt`; GET returns an array of the same fields, newest
saves first, or `[]` when none exist. Full catalog material details are available
from `GET /api/v1/materials/:materialId`.

All authenticated roles can manage their own bookmarks. Ownership comes from
the session, and clients cannot supply a user ID. Missing sessions return `401`,
invalid input returns `400`, nonexistent materials return `404` on POST, and
saving the same material twice returns `409`. DELETE returns `204` without a
body even if the caller has no bookmark for that material; it does not remove
another user's bookmark. Removing a bookmark leaves existing personal-path
items intact.

### Personal learning paths

Personal learning paths require a session cookie:

| Endpoint                                   | Description                                       |
| ------------------------------------------ | ------------------------------------------------- |
| `GET /api/v1/me/learning-paths`            | List the caller's paths and ordered items; `200`. |
| `POST /api/v1/me/learning-paths`           | Create a personal path; `201`.                    |
| `GET /api/v1/me/learning-paths/:pathId`    | Retrieve one caller-owned path; `200`.            |
| `PATCH /api/v1/me/learning-paths/:pathId`  | Update fields or replace its items; `200`.        |
| `DELETE /api/v1/me/learning-paths/:pathId` | Delete the path and its items; `204`.             |

Create accepts a nonblank `title` (up to 200 characters), optional `description`
(up to 5000 characters), and optional `items` (up to 1000). Each item contains
an existing `materialId` bookmarked by the caller and a unique, nonnegative
integer `position`; a material can appear only once per path. Empty paths are
allowed. Existing materials from older catalog snapshots can still be referenced
when bookmarked.

PATCH preserves omitted fields, replaces the entire item list when `items` is
supplied, and accepts `items: []` or `description: null` to clear those fields.
An empty PATCH body is rejected. Ownership always comes from the session;
missing or non-owned paths return `404`. Create returns `201`, reads and updates
return `200`, and delete returns `204` without a body. See the
[authentication design](docs/local-authentication-and-authorization-design.md)
for example payloads.

Create and item replacement validate every supplied material against the
caller's bookmarks and the catalog. Unbookmarked materials return `400`, and a
rejected replacement leaves the path unchanged. After removing a bookmark,
title or description changes still work when `items` is omitted, but resubmitting
that material in `items` requires bookmarking it again.

List returns `[]` when the caller has no paths. Each path contains `id`, `title`,
`description`, `createdAt`, `updatedAt`, and `items` ordered by `position`.
List order is most recently updated first. All authenticated roles can manage
their own paths; administrator access does not grant access to other users' paths.
Invalid path UUIDs return `400`. Deleting a path also removes its items.

## Inspect PostgreSQL

Open a PostgreSQL prompt inside the container:

```bash
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Useful commands inside `psql`:

```sql
\conninfo
\dt public.*
\d+ catalog_snapshots
\dx
SELECT * FROM migrations ORDER BY timestamp;
\q
```

## Run checks

```bash
# Unit tests
npm test

# Unit tests with coverage thresholds
npm run test:cov

# Formatting, linting, and type checking
npm run format:check
npm run lint:check
npm run typecheck

# Build the application
npm run build

# Duplication and unused-code checks
npm run duplicates:check
npm run unused:check
```

Run the production build after `npm run build`:

```bash
npm run start:prod
```

### Postman API tests

With PostgreSQL running, migrations applied, and a populated catalog, run:

```bash
npm run test:api
```

This starts the API and runs the Postman collection. The runner creates two
temporary learners, one administrator, and their sessions, selects two active
catalog materials and bookmarks them for the path owner, and removes the
accounts, sessions, bookmarks, and their paths when the
run finishes, including when assertions fail. Email delivery is not required. Use a local or
dedicated test database.

If the API is already running, use `npm run newman:run`. To run individual folders:

```bash
npm run newman:run -- --folder "Personal Learning Paths"

# Administrator access and role changes
npm run newman:run -- --folder "Admin User Management"
```

The personal-path folder covers all five routes, authentication, owner isolation,
input validation, persisted updates, item ordering, empty paths, and deletion.
The admin folder checks both admin routes, rejects learner and maintainer access,
and verifies promotions and demotions using existing sessions. Final-admin and
concurrent-demotion protection are covered by unit tests.
GitHub Actions applies migrations after restoring the catalog snapshot and runs
the same collection with temporary sessions.

To run that folder directly in Postman, use two fresh learner accounts with valid
sessions and set `baseURL`, `personalPathCookieName` (`session` locally),
`personalPathOwnerToken`, `personalPathOtherToken`, `personalPathOtherId`,
`personalMaterialA`, and `personalMaterialB`. Set `personalMissingPathId` to an
unused UUID and `personalMissingMaterialId` to a nonexistent material ID. Bookmark
both `personalMaterialA` and `personalMaterialB` using the path owner's session
before running the personal-path folder. Run the
entire folder in order; it captures the created path IDs automatically and
deletes those paths at the end. Cookie-jar handling is disabled for these requests
so each case uses only its explicit session header.
The admin folder additionally needs `personalPathOwnerId` and `adminUserToken`
for a third account with an administrator session. It changes the test learner's
role and restores it to `LEARNER` at the end.

## Stop the local services

Stop PostgreSQL while preserving its data:

```bash
docker compose stop postgres
```

Start it again later with:

```bash
docker compose start postgres
```

## Development workflow

Create feature branches from `dev` and open feature pull requests back into
`dev`. See [.github/GITFLOW.md](.github/GITFLOW.md) for the complete workflow.

## Architecture documentation

- [NestJS module architecture](docs/architecture/nestjs-modules.md)
- [CILogon authentication and local authorization](docs/local-authentication-and-authorization-design.md)
- [Persistence class diagram](docs/sdsc-learning-hub-persistence-class-diagram.md)
- [Implementation brief](docs/intern-implementation-brief.md)
- [System contracts](docs/contracts/agent-entrypoint.md)
- [Ingestion worker specification](docs/specs/ingestion-worker.md)
