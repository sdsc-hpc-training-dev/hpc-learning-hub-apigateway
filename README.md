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

### 5. Start NestJS

```bash
npm run start:dev
```

The API uses the `/api/v1` base path. Check the current root endpoint with:

```bash
curl http://localhost:3000/api/v1
```

Training Library reads are available at:

```text
GET /api/v1/materials
GET /api/v1/materials/:materialId
GET /api/v1/materials/:materialId/resources
GET /api/v1/topics
GET /api/v1/tools
GET /api/v1/systems
GET /api/v1/event-series
GET /api/v1/event-editions
```

`GET /materials` accepts `search`, `topic`, `tool`, `system`, `eventSeries`,
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
