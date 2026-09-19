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

npm run migration:show
```

All migrations should be marked with `[X]` after the restore. Start NestJS and
verify that the catalog is available:

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
- [Persistence class diagram](docs/sdsc-learning-hub-persistence-class-diagram.md)
- [Implementation brief](docs/intern-implementation-brief.md)
- [System contracts](docs/contracts/agent-entrypoint.md)
- [Ingestion worker specification](docs/specs/ingestion-worker.md)
