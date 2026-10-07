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

### 5. Start Mailpit for local email testing

The login endpoint sends verification codes over SMTP. Mailpit captures these
messages so you can test login without delivering email to a real inbox.
The current Compose file contains only PostgreSQL; start Mailpit separately:

```bash
docker run -d \
  --name learning-hub-mailpit \
  -p 127.0.0.1:1025:1025 \
  -p 127.0.0.1:8025:8025 \
  axllent/mailpit
```

Open [the Mailpit inbox](http://localhost:8025) to read the login codes. SMTP
listens on port `1025`, matching the API's defaults. These ports follow the
[Mailpit Docker documentation](https://mailpit.axllent.org/docs/install/docker/).
If the named container already exists, use `docker start learning-hub-mailpit`.

You can set the email settings explicitly in `.env`:

```dotenv
SMTP_HOST=localhost
SMTP_PORT=1025
AUTH_EMAIL_FROM=HPC Learning Hub <auth@example.org>
```

Restart NestJS after changing `.env`. The current email service uses SMTP;
`RESEND_API_KEY` is not read. These settings are for the API running on your host.
Mailpit captures messages locally; it does not forward them to recipients.

### Seed an administrator

After applying migrations, set `ADMIN_EMAIL`, `ADMIN_USERNAME`, and `ADMIN_PASS`
in `.env`. The password must contain 15–128 characters; replace the short
example password before running the seed.

```bash
npx ts-node src/database/seed/seed-admin-account.ts
```

The script normalizes the email and username, hashes the password with scrypt,
and creates or updates the account by email. Rerunning it resets that account's
password and assigns `ADMIN`. Run the script directly: the current `seed:admin`
npm command points to the curated learning path seed.

### 6. Start NestJS

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

| Endpoint                           | Access        | Description                                                |
| ---------------------------------- | ------------- | ---------------------------------------------------------- |
| `POST /api/v1/users`               | Public        | Register a learner; returns `201` with an account summary. |
| `POST /api/v1/auth/login`          | Public        | Check credentials and email a code; returns `202`.         |
| `POST /api/v1/auth/verify-login`   | Public        | Verify the code and set a session cookie; returns `204`.   |
| `POST /api/v1/auth/logout`         | Authenticated | Revoke the current session and clear its cookie; `204`.    |
| `GET /api/v1/me`                   | Authenticated | Return the current account and role; `200`.                |
| `GET /api/v1/users`                | `ADMIN`       | List account summaries; `200`.                             |
| `PATCH /api/v1/users/:userId/role` | `ADMIN`       | Assign `LEARNER`, `MAINTAINER`, or `ADMIN`; `200`.         |

Account summaries contain only `id`, `email`, `username`, and `role`. Registration
accepts `email`, `username`, and `password`; clients cannot assign a role.
Usernames contain 3–50 letters, digits, or underscores, and passwords contain
15–128 characters. Email and username identities are normalized to lowercase.

Login accepts `emailOrUsername` and `password`. It returns a `challengeId` and
`expiresAt`, but does not establish a session. Verification accepts that
`challengeId` and the six-digit `code` from Mailpit. Codes expire after ten
minutes, allow at most five incorrect attempts, and can be used only once.
An SMTP delivery failure returns `503`.

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

### Test email login

With Mailpit and NestJS running, register a learner and request a login code:

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H 'Content-Type: application/json' \
  -d '{"email":"learner@example.org","username":"learner","password":"long passphrase here"}'

curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"emailOrUsername":"learner","password":"long passphrase here"}'
```

For an existing account, start with login. Copy `challengeId` from its response
and read the code at [http://localhost:8025](http://localhost:8025). Replace the
placeholder values below, verify the code, and use the saved cookie:

```bash
curl -c /tmp/learning-hub-cookies.txt \
  -X POST http://localhost:3000/api/v1/auth/verify-login \
  -H 'Content-Type: application/json' \
  -d '{"challengeId":"replace-with-challenge-id","code":"123456"}'

curl -b /tmp/learning-hub-cookies.txt http://localhost:3000/api/v1/me

curl -b /tmp/learning-hub-cookies.txt -c /tmp/learning-hub-cookies.txt \
  -X POST http://localhost:3000/api/v1/auth/logout
```

Logout waits for session revocation before clearing the cookie. Further requests
using that session return `401`, including repeated logout requests.

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
an existing `materialId` and a unique, nonnegative integer `position`; a material
can appear only once per path. Empty paths are allowed. Existing materials from
older catalog snapshots can still be referenced.

PATCH preserves omitted fields, replaces the entire item list when `items` is
supplied, and accepts `items: []` or `description: null` to clear those fields.
An empty PATCH body is rejected. Ownership always comes from the session;
missing or non-owned paths return `404`. Create returns `201`, reads and updates
return `200`, and delete returns `204` without a body. See the
[authentication design](docs/local-authentication-and-authorization-design.md)
for example payloads.

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
catalog materials, and removes the accounts, sessions, and their paths when the
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
unused UUID and `personalMissingMaterialId` to a nonexistent material ID. Run the
entire folder in order; it captures the created path IDs automatically and
deletes those paths at the end. Cookie-jar handling is disabled for these requests
so each case uses only its explicit session header.
The admin folder additionally needs `personalPathOwnerId` and `adminUserToken`
for a third account with an administrator session. It changes the test learner's
role and restores it to `LEARNER` at the end.

## Stop the local services

Stop PostgreSQL while preserving its data, and stop Mailpit if you started it:

```bash
docker compose stop postgres
docker stop learning-hub-mailpit
```

Start it again later with:

```bash
docker compose start postgres
docker start learning-hub-mailpit
```

## Development workflow

Create feature branches from `dev` and open feature pull requests back into
`dev`. See [.github/GITFLOW.md](.github/GITFLOW.md) for the complete workflow.

## Architecture documentation

- [NestJS module architecture](docs/architecture/nestjs-modules.md)
- [Local authentication and authorization](docs/local-authentication-and-authorization-design.md)
- [Persistence class diagram](docs/sdsc-learning-hub-persistence-class-diagram.md)
- [Implementation brief](docs/intern-implementation-brief.md)
- [System contracts](docs/contracts/agent-entrypoint.md)
- [Ingestion worker specification](docs/specs/ingestion-worker.md)
