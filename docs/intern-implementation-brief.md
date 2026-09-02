# SDSC Learning Hub: Implementation Brief For The Team

## What We Are Building Now

We are turning the Learning Hub prototype and Snapshot v3 into one working
system.

In this document, the initial reviewed fixture is
`snapshot-v3-20260805T002229Z`, archive SHA-256
`82B16349C93B88AD31FA8D08D76B2BA2A470C0E327151A6BD695B51967CC6945`.
"Snapshot v3" by itself describes a format and is not enough to identify the
data used in an import or experiment.

Visitors should be able to browse and search SDSC training materials without
signing in. A signed-in learner will later be able to save materials, track
progress, keep learning paths, and return to AIDA conversations. AIDA will
answer from the same catalog shown by the website and will link people back to
real materials and resources.

For this phase, we are not building the training-submission workflow,
GraphRAG, Neo4j, or a separately deployed routing service.

## The Simple System View

```text
Snapshot v3 in NRP storage
  -> Ingestion worker
      -> PostgreSQL + pgvector

User
  -> Next.js website
      -> NestJS API Gateway
          -> PostgreSQL + pgvector
          -> NRP model APIs
```

PostgreSQL stores the catalog, learner data, and AIDA conversations. The
`pgvector` extension in that same PostgreSQL database stores the vectors used
by General RAG and Transcript RAG.

The website never talks directly to the bucket, database, or NRP. The Gateway
is the only runtime backend used by the website.

## Frontend Team: Web Experience And API Consumer

The frontend team owns:

- the public catalog, material, event, and curated-path pages;
- the CILogon sign-in entry and signed-in navigation states;
- the learner bookmark, progress, personal-path, and conversation screens as
  their Gateway endpoints become available;
- the Maintainer-only authorization smoke-test page, without a submission form;
- AIDA loading, grounded, partial, general, abstained, and error states;
- accessibility and contract tests against the Gateway OpenAPI definition.

The frontend must not invent API response shapes or call PostgreSQL, S3,
CILogon token endpoints, or NRP directly.

## Why We Need To Agree On Contracts First

Srujam, Mio, and Arnav will all touch the same database model from different
directions:

- Srujam builds the database foundation and the Gateway persistence layer.
- Mio imports the catalog portion of Snapshot v3.
- Arnav imports the AIDA chunks and creates/searches embeddings.

If each person invents tables independently, the pieces will not join cleanly.
The class diagram and system contract therefore define one shared model. Each
person may run a separate local database, but everyone must use the same
checked-in migrations.

## Ownership

### Srujam: Persistence Foundation And Conversations

Srujam owns:

- selecting and configuring the agreed NestJS ORM;
- PostgreSQL plus `pgvector` local configuration;
- versioned migrations and migration conventions;
- database connection and transaction helpers;
- users, CILogon identities, and roles;
- AIDA conversations, messages, citations, and feedback;
- the first OpenAPI skeleton and common error responses.

Srujam is the migration gatekeeper. This does not mean he writes every table.
It means schema changes from Mio and Arnav follow one convention and receive
his review before merging.

### Mio: Catalog Ingestion

Mio owns the part of the worker that reads Snapshot v3 catalog data and loads:

- snapshots and import provenance;
- event series and event editions;
- training materials and content resources;
- people, topics, tools, and systems;
- explicit relationship join tables;
- aliases and the validation report.

Mio should not create a generic relationship table in parallel with the
explicit join tables. She should not create a separate catalog schema outside
the approved migrations.

Mio also remains the owner of the existing Python router training and
evaluation work. That Python code will produce a versioned, language-neutral
classifier artifact after its current validation results are reconciled. This
router work follows the first catalog-ingestion milestone; it should not block
loading Snapshot v3 into the database.

### Arnav: AIDA Retrieval Ingestion

Arnav owns the part of the worker that:

- imports the existing records in `aida/chunks.jsonl`;
- does not re-chunk Snapshot v3 during the first implementation;
- calls the approved NRP embedding endpoint in bounded batches;
- stores embeddings in PostgreSQL/`pgvector`;
- creates vector indexes and retrieval queries;
- verifies General RAG against general chunks;
- verifies Transcript RAG using `source_kind = transcript`;
- returns canonical material, resource, and chunk IDs with evidence.

After the retrieval-ingestion milestone, Arnav owns the small NestJS router
inference module. It consumes Mio's exported classifier artifact and must match
Python on frozen golden vectors before it becomes the default. Explicit UI
scope, such as an open recording ID, takes priority over text classification.

### Young: Source Data And Snapshot Quality

Young continues to own the upstream data pipeline:

- acquiring and versioning raw inputs;
- producing the immutable candidate snapshot;
- publishing checksums, manifests, and pipeline configuration;
- running snapshot validation and inexpensive retrieval benchmarks;
- storing reports and promoting only the exact candidate that passed.

Young should review the ingestion mapping because his pipeline defines the
snapshot contract, but he does not need to rewrite the Gateway importer.

## How The Work Joins Together

1. The team approves persistence model v0.1 and the system contract.
2. Srujam merges the database foundation into `dev`.
3. Mio and Arnav branch from that updated `dev` branch.
4. Mio and Arnav add migrations only through the agreed migration process.
5. The worker runs both stages against one local PostgreSQL+pgvector instance.
6. The Gateway reads the imported data through repositories/services and
   exposes stable API DTOs to the frontend.
7. The frontend builds against the OpenAPI contract, not against guessed JSON.

The ingestion milestone comes before the production router port. This keeps
Mio and Arnav from debugging database loading, vector search, and classifier
parity simultaneously.

Suggested feature branches:

```text
feature/persistence-foundation
feature/catalog-ingestion
feature/aida-vector-ingestion
```

## First Integration Demonstration

The first useful demonstration is intentionally small:

1. Start PostgreSQL+pgvector locally with one command.
2. Apply all migrations to an empty database.
3. Import Snapshot v3 from a mounted local ZIP or the NRP bucket.
4. Show one material and its resources through a Gateway endpoint.
5. Run one General RAG query and return a valid material/resource citation.
6. Run one Transcript RAG query and show that only transcript chunks were
   searched.
7. Sign in or use a test identity and save one AIDA conversation with its
   citations.
8. Run the import again and prove that it does not create duplicates.

That demonstration proves the pieces agree. It is more valuable than building
many controllers before one complete path works.

## Definition Of Done

### Persistence foundation

- A new developer can start PostgreSQL+pgvector locally.
- Migrations run forward on an empty database.
- Tests use the same schema as local development.
- Database credentials are not committed.
- The importer uses a restricted database role.

### Catalog ingestion

- Imported counts match Snapshot v3 and its manifest.
- Canonical IDs are preserved.
- Every explicit relationship has valid foreign keys.
- Catalog search and filters do not require an LLM.
- A failed import leaves the prior active snapshot unchanged.

### AIDA ingestion and retrieval

- All Snapshot v3 chunks are imported once.
- Embedding model, dimensions, and version are recorded.
- General and transcript retrieval are tested separately.
- Results include canonical evidence IDs.
- Timing distinguishes embedding, retrieval, generation, and total latency.

### Gateway and frontend handoff

- OpenAPI describes the implemented endpoints.
- The frontend uses generated or contract-checked types.
- Public pages work without authentication.
- Personal data is protected by the Gateway.
- Loading, empty, error, partial, and abstention states are visible and
  accessible.

## Documents To Read

Read these in order:

1. [Gateway persistence class diagram](sdsc-learning-hub-persistence-class-diagram.md).
2. [SDSC Learning Hub System Contracts v0.1](system-contracts-v0.1.md).
3. [Functional user stories](https://github.com/sdsc-hpc-training-dev/training-landing-page/blob/main/docs/functional-user-stories.md).
4. [User personas](https://github.com/sdsc-hpc-training-dev/training-landing-page/blob/main/docs/user-personas.md).
5. [Architectural stories and quality scenarios](https://github.com/sdsc-hpc-training-dev/training-landing-page/blob/main/docs/architectural-user-stories-and-quality-scenarios.md).
6. Snapshot v3 manifest and schema documentation in the immutable archive.
7. [AIDA V2 benchmark](https://github.com/sdsc-hpc-training-dev/intvid-backend/tree/codex/aida-mvp-benchmark-v2/benchmarks/aida-mvp-v2)
   instructions for the part of the system you own.
8. [AIDA router architecture verdict](aida-router-architecture-verdict.md).
9. [Young data-ingestion and RAG automation review](young-data-ingestion-and-rag-automation-review.md).

The class diagram answers "what is stored." The contract answers "what each
part promises to the other parts." Your branch answers "how your part keeps
that promise."

## Questions To Raise Before Coding

Raise a design question when:

- the snapshot cannot supply a required field;
- a contract would require duplicating a source of truth;
- a migration conflicts with another active branch;
- the implementation would expose credentials or personal data;
- an AIDA citation cannot resolve to a real material/resource;
- a test requires changing the agreed route or metric definition.

Do not silently invent a second schema or change a contract inside code. Put
the proposed change in a small pull request so the affected owners can review
it together.
