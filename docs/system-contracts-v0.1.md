# SDSC Learning Hub System Contracts v0.1

**Status:** Draft for team approval  
**Scope:** First implementation using immutable Snapshot v3, PostgreSQL with
`pgvector`, NestJS, Next.js, CILogon, and the NRP model APIs.

`Snapshot v3` names a schema family, not one unique dataset. The reviewed
initial fixture is:

```text
snapshot_id: snapshot-v3-20260805T002229Z
archive_sha256: 82B16349C93B88AD31FA8D08D76B2BA2A470C0E327151A6BD695B51967CC6945
```

Every import, benchmark, report, and comparison must identify both the exact
snapshot ID and archive checksum. Saying only "Snapshot v3" is insufficient.

This document defines the boundaries between the frontend, API Gateway,
ingestion worker, and AIDA. It deliberately describes what must cross each
boundary without prescribing every internal class or library.

## 1. Decisions That Apply Everywhere

1. The public catalog is usable without signing in.
2. The Next.js application calls the NestJS API Gateway. It does not query S3,
   PostgreSQL, `pgvector`, CILogon, or NRP directly.
3. PostgreSQL and `pgvector` are one database component for the MVP.
4. The API Gateway does not read Snapshot v3 from S3 during a user request.
5. A separate trusted ingestion worker imports an immutable snapshot into
   PostgreSQL and creates the embeddings required for retrieval.
6. Catalog records and AIDA citations use the same canonical material and
   resource IDs.
7. Snapshot relationship files are represented by explicit relational join
   tables. A generic polymorphic relationship table is not part of the active
   serving model.
8. The production AIDA router is an internal NestJS Gateway capability for the
   MVP. Python remains the offline training/evaluation tool and exports a
   language-neutral classifier artifact.
9. GraphRAG and Neo4j are research paths outside the first MVP and its pull
   request promotion gate.
10. Training-material submission and moderation are deferred. The Maintainer
    role only needs an authorization smoke-test page initially.

## 2. Sources Of Truth

| Concern                              | Authoritative source                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| Persisted entities and relationships | Gateway persistence class diagram                                                |
| HTTP requests and responses          | Gateway OpenAPI specification once implemented                                   |
| Snapshot input                       | Snapshot v3 manifest, checksums, canonical JSONL, portal JSON, and AIDA JSONL    |
| Route labels and expected behavior   | AIDA V2 benchmark and this contract                                              |
| Product behavior                     | Approved functional stories, personas, interview findings, and quality scenarios |
| Database shape                       | Versioned migrations in the Gateway repository                                   |

Generated frontend types may come from OpenAPI. They must not be maintained as
an unrelated second definition of the API.

## 3. Shared Identifiers And Enums

Canonical Snapshot v3 IDs are opaque strings. Clients must never derive one ID
from another or infer an entity type from an ID pattern.

Application-owned rows use UUIDs.

```text
UserRole      = LEARNER | MAINTAINER | ADMIN
AidaRoute     = catalog_api | general_rag | transcript_rag | abstain
AnswerMode    = grounded | partial | general | abstained
ChunkKind     = catalog_metadata | repository_session | slides | transcript
SnapshotStatus  = received | validated | active | rejected | retired
ImportRunStatus = pending | running | succeeded | failed
```

All public API dates use ISO 8601 UTC strings. URLs returned to the frontend
must be validated canonical URLs. Unknown optional values are `null`; an empty
string does not mean unknown.

## 4. Frontend To Gateway Contract

### 4.1 General Rules

- Base path: `/api/v1`.
- JSON is the default request and response format.
- The frontend renders loading, empty, error, unauthorized, partial-answer,
  and abstention states explicitly.
- The frontend never receives S3 credentials, database credentials, CILogon
  client secrets, NRP API keys, raw embeddings, or internal model prompts.
- A request ID is returned in API responses and logs for troubleshooting.

Standard error response:

```json
{
  "code": "MACHINE_READABLE_CODE",
  "message": "Human-readable explanation",
  "requestId": "uuid",
  "details": null
}
```

### 4.2 Public Catalog Surface

The first Gateway implementation must support these capabilities. Exact query
parameter names are finalized in OpenAPI before frontend integration.

```text
GET /materials
GET /materials/{materialId}
GET /materials/{materialId}/resources
GET /topics
GET /tools
GET /systems
GET /event-series
GET /event-editions
GET /learning-paths
GET /learning-paths/{pathId}
```

`GET /materials` supports pagination and filters grounded in explicit catalog
relationships, including topic, tool, system, event series/edition, instructor,
resource type, and search text. Catalog filtering does not call an LLM.

Minimum material response:

```json
{
  "id": "canonical-material-id",
  "title": "Material title",
  "description": "Description or null",
  "eventEditions": [],
  "topics": [],
  "tools": [],
  "systems": [],
  "instructors": [],
  "resources": [
    {
      "id": "canonical-resource-id",
      "title": "Resource title",
      "type": "video",
      "url": "https://example.org/resource",
      "verificationStatus": "content_verified"
    }
  ]
}
```

### 4.3 Authentication And Personal Data

The browser is redirected through CILogon, but the Gateway owns the OAuth/OIDC
callback, code exchange, local user creation, role lookup, and application
session.

- New authenticated users receive `LEARNER` by default.
- `MAINTAINER` and `ADMIN` are assigned only by an authorized administrator or
  controlled administrative process.
- The frontend uses a secure, HttpOnly, SameSite application session cookie.
- CILogon access or refresh tokens are never exposed to frontend JavaScript.
- Public catalog endpoints do not require authentication.
- Personal records are always scoped to the authenticated user.

Required personal capabilities:

```text
GET    /me
GET    /me/bookmarks
POST   /me/bookmarks
DELETE /me/bookmarks/{materialId}
GET    /me/progress
PUT    /me/progress/{materialId}
GET    /me/learning-paths
POST   /me/learning-paths
PUT    /me/learning-paths/{pathId}
DELETE /me/learning-paths/{pathId}
```

Bookmarks, progress, and personal paths are implementation increments after
the public catalog foundation; their schema remains in the persistence model
so migrations do not drift from the accepted learner experience.

## 5. Gateway Service Contract

The Gateway owns:

- authentication, application sessions, users, and roles;
- public catalog queries and catalog DTOs;
- bookmarks, progress, and personal learning paths;
- AIDA conversations, messages, citations, feedback, and coverage gaps;
- route selection and retrieval orchestration;
- calls to NRP for query embeddings and answer generation;
- authorization, validation, OpenAPI, logging, and request-level metrics.

The Gateway does not own:

- collecting or cleaning raw training data;
- building Snapshot v3;
- approving or promoting a snapshot;
- reading S3 on each web request;
- mutating imported canonical catalog rows through public endpoints;
- training the router model inside a user request.

Recommended NestJS module boundaries:

```text
AuthModule
UsersModule
CatalogModule
LearningModule
AidaModule
  Conversations
  Router
  Retrieval
  Synthesis
DatabaseModule
ObservabilityModule
```

The exact ORM remains a team decision, but migrations are checked into the
Gateway repository and are the only supported way to change shared tables.

## 6. Snapshot Ingestion Contract

### 6.1 Inputs

The worker accepts one of:

```text
--source s3://bucket/path/snapshot-v3.zip
--source C:/path/to/snapshot-v3.zip
```

The same worker code must support both inputs. Local development may mount the
ZIP read-only into the worker container.

Required Snapshot v3 content includes:

```text
snapshot.json
canonical/entities.jsonl
canonical/relationships.jsonl
canonical/aliases.jsonl
portal/*.json
aida/chunks.jsonl
aida/citation_index.jsonl
aida/material_cards.jsonl
aida/embedding_manifest.json
```

The worker verifies the archive checksum, manifest, schema version, internal
checksums, and required files before modifying serving data.

### 6.2 Processing

For one immutable `snapshotId`, the worker:

1. Creates an import run and records source URI, object checksum, code commit,
   configuration, and start time.
2. Validates required files, checksums, record shape, canonical IDs, and
   relationship endpoints.
3. Loads catalog entities into staging or snapshot-scoped tables.
4. Loads explicit join tables for Snapshot v3 relationships.
5. Imports the existing records from `aida/chunks.jsonl` without re-chunking.
6. Requests embeddings from the approved NRP embedding endpoint in bounded
   batches and stores them in `ChunkEmbedding`.
7. Builds or updates full-text and vector indexes.
8. Validates counts, referential integrity, vector dimensions, and retrieval
   smoke tests.
9. Marks the exact imported snapshot `ready` and activates it atomically only
   after every required gate passes.
10. Records completion, counts, timings, warnings, and errors.

Snapshot v3 contains chunks but its embedding manifest says embeddings were
not generated. Embedding generation is therefore worker behavior; arbitrary
new chunking is not.

### 6.3 Output And Safety Rules

- The worker writes directly to PostgreSQL using a restricted importer role.
- The importer role may write imported catalog, chunk, embedding, and import
  lifecycle tables. It may not read or modify users, sessions, conversations,
  bookmarks, progress, feedback, or roles.
- A failed import never replaces the currently active snapshot.
- Re-running the same snapshot and configuration is idempotent.
- An import with a reused snapshot ID but different checksum fails closed.
- The source snapshot is immutable. After validation, the active serving
  projection is atomically reconciled to the new snapshot while stable IDs are
  preserved; older source bundles remain immutable in S3.
- Logs and reports never contain credentials or full sensitive headers.

Acceptance checks for the reviewed `snapshot-v3-20260805T002229Z` fixture
include:

```text
530  training materials
1423 content resources
520  event editions
6    event series
49   people
21   topics
36   tools
5    systems
2291 content chunks
1161 transcript chunks
```

The general rule for later Snapshot v3-compatible artifacts is to compare
imported counts against the exact candidate manifest, not to hard-code these
fixture counts forever.

## 7. AIDA Contract

### 7.1 Request And Persistence

```text
POST /aida/conversations
GET  /aida/conversations
GET  /aida/conversations/{conversationId}
POST /aida/conversations/{conversationId}/messages
POST /aida/messages                       # guest or one-turn use
POST /aida/messages/{messageId}/feedback
DELETE /aida/conversations/{conversationId}
```

Public/guest AIDA may be supported without durable server-side history.
Authenticated conversation history is stored in PostgreSQL and can only be
read by its owner or an authorized administrator under an explicit support
procedure.

Minimum question request:

```json
{
  "text": "Where can I learn Slurm?",
  "contextMaterialId": null,
  "contextResourceId": null,
  "clientRequestId": "uuid"
}
```

Minimum answer response:

```json
{
  "messageId": "uuid",
  "answer": "Answer text",
  "route": "general_rag",
  "answerMode": "grounded",
  "limitations": null,
  "citations": [
    {
      "materialId": "canonical-material-id",
      "resourceId": "canonical-resource-id",
      "chunkId": "canonical-chunk-id",
      "title": "Supporting material",
      "url": "https://example.org/resource",
      "sourceKind": "slides"
    }
  ],
  "suggestedFollowUps": [],
  "coverageGap": false,
  "timingMs": {
    "queryEmbedding": 0,
    "routing": 0,
    "retrieval": 0,
    "timeToFirstToken": 0,
    "generation": 0,
    "total": 0
  },
  "requestId": "uuid"
}
```

The route describes how evidence was selected. The answer mode describes how
strongly the returned answer is supported. They are separate concepts.

### 7.2 Route Behavior

`catalog_api`

- Uses relational catalog queries.
- Handles exact IDs, titles, filters, links, resources, programs, and counts.
- Does not require an LLM for retrieval. An LLM may format prose only when
  doing so does not alter catalog facts.

`general_rag`

- Searches approved non-transcript and general-purpose chunks in `pgvector`.
- Supports explanations, comparisons, recommendations, and supporting
  materials.
- Returns canonical material/resource evidence.

`transcript_rag`

- Searches chunks constrained by `sourceKind = transcript`.
- Answers questions about what was said in recordings.
- Snapshot v3 does not preserve timestamps, so it cannot promise a deep link to
  the exact moment in a video.

`abstain`

- Handles unsupported, private, live, transactional, out-of-corpus, or unsafe
  requests.
- Does not fabricate an answer or claim that the corpus lacks information when
  retrieval merely failed.
- May provide an explicitly labeled general explanation only for safe,
  non-institutional concepts.

### 7.3 Router Interface

The router must return:

```json
{
  "route": "catalog_api",
  "confidence": 0.92,
  "scores": {
    "catalog_api": 0.92,
    "general_rag": 0.05,
    "transcript_rag": 0.02,
    "abstain": 0.01
  },
  "lowConfidence": false,
  "artifactVersion": "router-version",
  "embeddingModel": "qwen3-embedding",
  "fallbackReason": null
}
```

The runtime implementation must preserve:

- the four route labels;
- input normalization and any conversation-context policy;
- embedding model and dimensions when embeddings are classification features;
- classifier artifact, coefficients/classes, and normalization behavior;
- confidence threshold and deterministic fallback;
- model/training-data/configuration versions;
- golden input/output vectors and cross-language parity tests.

If confidence is below the approved threshold, the router uses a documented
safe fallback. It does not choose a route randomly or call every strategy.

Explicit product context takes precedence over text classification. When the
UI identifies an open recording and supplies its canonical material or
resource ID, a transcript question is routed to `transcript_rag` within that
scope. This supports follow-ups such as "What did the instructor mean?" that
a text-only classifier cannot classify reliably.

The router is also not the final groundedness decision. After retrieval, weak,
empty, or uncitable evidence can force an honest abstention even when the
initial route was `general_rag` or `transcript_rag`.

### 7.4 Retrieval And Evidence Rules

- Retrieval is always scoped to the active snapshot.
- A cited chunk must resolve to its resource and material.
- A grounded recommendation includes at least one valid canonical material or
  resource citation.
- A response cannot cite evidence that was not supplied to synthesis.
- Conversation summaries are context, not evidence.
- The Gateway stores messages, selected material scope, answer mode, route,
  citations, model/configuration versions, and bounded operational metrics.
- It does not store a duplicated full assembled prompt on every turn.

## 8. Ownership And Change Rules

| Contract area                                       | Primary owner                 | Required reviewers                         |
| --------------------------------------------------- | ----------------------------- | ------------------------------------------ |
| Database migrations and Gateway OpenAPI             | Gateway/persistence work      | Ingestion and frontend owners              |
| Catalog import mapping                              | Catalog ingestion work        | Gateway migration owner and snapshot owner |
| Chunks, embeddings, and retrieval smoke tests       | AIDA ingestion/retrieval work | Gateway and benchmark owners               |
| Router labels, thresholds, and model artifact       | AIDA/router work              | Gateway and benchmark owners               |
| Frontend API use and UI states                      | Frontend work                 | Gateway owner and UX lead                  |
| Snapshot schema, checksums, and candidate promotion | Data pipeline work            | Ingestion and benchmark owners             |

Breaking changes require:

1. A pull request changing this contract and the persistence diagram when
   applicable.
2. A versioned migration or OpenAPI change.
3. Updated fixtures and contract tests.
4. Review by both sides of the affected boundary.

## 9. Required Contract Tests

- OpenAPI response schemas match frontend fixtures.
- Public catalog works without authentication.
- Personal endpoints reject guests and cross-user access.
- New users receive `LEARNER`; clients cannot self-assign elevated roles.
- Snapshot v3 imports with expected counts and no broken foreign keys.
- Re-importing the same artifact is idempotent.
- A failed candidate does not replace the active snapshot.
- Every chunk resolves to a canonical resource/material as allowed by its type.
- Every embedding matches its declared model and dimensions.
- General RAG and Transcript RAG use their intended chunk scopes.
- AIDA citations resolve through the public material/resource DTOs.
- Low-confidence/unsupported questions take the documented fallback path.
- Conversation reads and deletes are owner-scoped.

## 10. Decisions Still To Finalize

- ORM and migration library.
- Exact filtering and pagination parameter names in OpenAPI.
- Whether first-response delivery is synchronous JSON or streamed.
- Conversation retention and deletion period.
- Exact router release artifact and quality thresholds after its current
  benchmark claims are reconciled.
- NRP embedding batching and retry limits, established through measured tests.

These decisions do not prevent the team from agreeing on the boundaries above.

## 11. Router Implementation Decision

Production routing will be implemented inside the NestJS Gateway. Python is
retained for offline classifier training, evaluation, and export.

The current Python runtime first calls NRP `qwen3-embedding`, L2-normalizes a
4,096-dimensional vector, and performs a four-class multinomial logistic
regression calculation. The local calculation is small; the NRP call dominates
latency. A separate Python service would add a deployment and network boundary
without removing the NRP dependency.

The NestJS implementation is not promoted until:

1. The current reproduced result of 12/20 primary and 17/20 acceptable
   validation matches is reconciled with the higher README claim.
2. Python exports a checksummed, language-neutral artifact containing ordered
   classes, coefficients, intercepts, normalization, confidence threshold,
   fallback behavior, embedding model/dimensions, training configuration, and
   source/benchmark versions.
3. Frozen 4,096-element vectors produce the same routes and probabilities in
   Python and TypeScript within the approved tolerance.
4. All 120 cached benchmark embeddings produce identical Python and TypeScript
   route labels.
5. NRP timeout, malformed vector, wrong dimension, zero vector, low
   confidence, missing context, and weak evidence all have controlled tests.
