# HPC Learning Hub System Contracts v0.2 Candidate

**Status:** Candidate for Fernando's review, not an approved replacement for
[v0.1](../system-contracts-v0.1.md). **Source freeze:** 2026-09-03.
The baseline remains unchanged. Requirement IDs below are stable.

## Reading Rules

`Required` means an inherited target requirement, not an assertion that the
baseline draft was approved or that code implements it. `Implemented` means
observed at the pinned revision. `Proposed` requires approval of the linked
decision before implementation. `Undecided` blocks only the named portion.
Each requirement has its own source and observable acceptance criterion.
Acceptance criteria here are specifications, not executed application tests.

The fixed scope supplied for this revision takes precedence: HPC Learning Hub;
Next.js through NestJS; one PostgreSQL database with pgvector; Gateway-owned
migrations and restricted Python importer; one immutable static fixture; no
automatic snapshot lifecycle, submission/drafts/moderation, GraphRAG, or Neo4j.
Runtime personal data and authenticated AIDA history belong to the Gateway.
Classifier inference in NestJS is a target subject to parity gates, not a
completed port. The maintainer surface is an authorization smoke page only.
These fixed instructions are recorded as source **F** in this document.

### Pinned Sources

Gateway sources **B/P/I/R/T/C** all refer to commit
`fda21d619dcc5119f1133501bafa8cc7e800c7cf`, fetched and resolved from `origin/main`.
Relative links resolve in this candidate's worktree; use that commit when
consulting historical evidence after subsequent edits.

| Key | Source and authority                                                                                                                                                                                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B   | [System contracts v0.1](../system-contracts-v0.1.md): cross-system baseline, status Draft for team approval.                                                                                                                                                                                                                                                                           |
| P   | [Persistence model](../sdsc-learning-hub-persistence-class-diagram.md): domain entities, constraints, ownership; not executable DDL or HTTP schemas.                                                                                                                                                                                                                                   |
| I   | [Historical ingestion guide](https://github.com/sdsc-hpc-training-dev/hpc-learning-hub-apigateway/blob/fda21d619dcc5119f1133501bafa8cc7e800c7cf/docs/specs/ingestion-worker.md): baseline worker boundary, initial demonstration, configuration and tests; not the companion candidate.                                                                                                |
| R   | [Router verdict](../aida-router-architecture-verdict.md): target and release gates; reports review of `sdsc-llm-dev/aida-router` at `d1297843b1660b14afe94589bc6a5ea886302267`. That router repository was not re-evaluated here.                                                                                                                                                      |
| T   | [Implementation brief](../intern-implementation-brief.md): owner assignments and integration sequence.                                                                                                                                                                                                                                                                                 |
| C   | [main.ts](../../src/main.ts), [module](../../src/app.module.ts), [controller](../../src/app.controller.ts), [service](../../src/app.service.ts), [package.json](../../package.json), [unit test](../../src/app.controller.spec.ts), [E2E test](../../test/app.e2e-spec.ts): implementation evidence only.                                                                              |
| S   | Backend `intvid-backend`, local benchmark branch commit `5b9085d8717e31ffbb06e5621992ff05a14fbe89`: [snapshot description][snapshot-doc], [entity schema][entity-schema], [relationship schema][relationship-schema], [chunk schema][chunk-schema], targeted [builder sections][snapshot-builder], [benchmark manifest][benchmark-manifest]. No archive was downloaded or revalidated. |
| U   | Frontend `9a59ec48d41d65f77117f9cfdb450fc3800bca28`: [page][frontend-page] and [sanity test][frontend-test]. No Gateway integration observed in this tracked starter.                                                                                                                                                                                                                  |
| D   | Design `4e318f39d2208bfc5dc99239d67445db70174e77`: [functional stories][stories], [personas][personas], [design decisions][design]. Product context, subordinate to F and the later Gateway scope.                                                                                                                                                                                     |

The backend checkout HEAD was `5b9facf4f68e51c1f63574fc2551cede2f48eea2`
(older v2 sources); S was read through immutable Git objects from the locally
available v3 benchmark branch, without changing that checkout. S is schema and
builder evidence, not proof that every emitted value is present in the archive.
The benchmark manifest identifies the same fixture as B.

### Companion Candidate

The [Ingestion Worker Technical Contract](../specs/ingestion-worker.md#12-decision-register-and-sources)
is a separately reviewed companion, not historical source I or an approved
override. Its reviewed local freeze was
`c6a63676b9cf3dff728037a2d921a3084476afd0`; Portal coordinates the corrected
combined version. Its `IW-*` requirements and specialist `D1`-`D5` gates participate
through the [crosswalk and closure rule](decisions-needed.md#specialist-crosswalk).
This candidate does not approve its labeled proposals by linking them.

Source I's immutable link identifies only the original guide at the pinned
Gateway baseline; every I citation retains that historical meaning after
integration replaces the relative `docs/specs/ingestion-worker.md` path.
The companion and contract share unresolved gates; neither can close one by
silently overriding the other. Portal verifies their final crosslinks and
consistent transcript-scope wording before publication.

### Implementation Inventory

C implements only `GET /` returning `Hello World!`; its tests cover that starter.
There is no `/api/v1` prefix, auth, catalog, database adapter, importer, AIDA,
OpenAPI, or migration in the pinned Gateway tracked tree. None of the boundary
requirements below is claimed implemented. Generated OpenAPI becomes HTTP
authority only after its contract decisions are reviewed; starter behavior does
not override targets. Unfinished parallel architecture diagrams are not sources.

## Shared Rules

<a id="SH-01"></a>

### SH-01: Source Precedence And Change Control

**Required. Owner:** affected boundary owners; **consumer:** all implementers.
Implementers MUST preserve F, then use B for cross-system behavior, P for domain
constraints, and I/R for their specialist contracts. A consequential conflict
between these documents is a decision, not a license to choose silently. Code
and older prototypes establish implementation status only. A proposed completion
in [decisions-needed](decisions-needed.md) MUST remain unimplemented until its
decision is recorded; unaffected requirements can proceed. Breaking changes
require affected-owner review, a contract update, migration/OpenAPI changes as
applicable, and updated fixtures/tests. No duplicate frontend schema authority.

**Source:** F; B sections 2, 8; I "Documents To Use"; T "Questions To Raise Before
Coding". **Acceptance:** given a DTO/schema disagreement, review identifies a
decision ID and blocks that field; a change to a shared table includes its
Gateway migration and consumer tests, not a private worker schema.

<a id="SH-02"></a>

### SH-02: IDs, Enums And Scalar Values

**Required. Owner:** Gateway/schema owners; **consumer:** worker/frontend/AIDA.
Boundary values MUST follow this shared vocabulary. Canonical IDs are opaque
strings, preserved byte-for-byte, never inferred from prefixes or converted to
numbers. Application-owned IDs are UUIDs. A material ID and a resource ID are
different references even when both are strings. Curated path identity has an
unresolved origin: [D-12](decisions-needed.md#D-12).

| Name                    | Values / interpretation                                                                                                                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UserRole`              | `LEARNER`, `MAINTAINER`, `ADMIN`; one role per user.                                                                                                                                                                                                                                                 |
| `AidaRoute`             | `catalog_api`, `general_rag`, `transcript_rag`, `abstain`.                                                                                                                                                                                                                                           |
| `AnswerMode`            | `grounded`, `partial`, `general`, `abstained`; independent of route.                                                                                                                                                                                                                                 |
| `ChunkKind`             | `catalog_metadata`, `repository_session`, `slides`, `transcript`.                                                                                                                                                                                                                                    |
| `SnapshotStatus`        | B spellings: `received`, `validated`, `active`, `rejected`, `retired`. P uses uppercase domain symbols. `ready` is not defined. Storage/transition decision: [D-01](decisions-needed.md#D-01).                                                                                                       |
| `ImportRunStatus`       | B spellings: `pending`, `running`, `succeeded`, `failed`; P uses uppercase domain symbols. Database encoding pending D-01/D-05.                                                                                                                                                                      |
| P-only domain enums     | `ResourceType`: `CATALOG_METADATA`, `REPOSITORY`, `REPOSITORY_SESSION`, `SLIDES`, `TRANSCRIPT`, `VIDEO`, `WEBPAGE`; `AidaMessageRole`: `USER`, `ASSISTANT`; `AidaRunStatus`: `RUNNING`, `SUCCEEDED`, `FAILED`; `AidaFeedbackRating`: `HELPFUL`, `NOT_HELPFUL`. These do not finalize HTTP encodings. |
| Public dates            | ISO 8601 UTC strings; no implicit local timezone.                                                                                                                                                                                                                                                    |
| Unknown optional values | JSON `null`, not `""`. Omission versus a required nullable key is specified only where sources settle it.                                                                                                                                                                                            |
| Public URLs             | Validated canonical URLs; not filesystem locations or credentials. Missing-link policy is D-11.                                                                                                                                                                                                      |

P's uppercase AIDA/ChunkSourceKind symbols express the same concepts as the
lowercase boundary values above, not additional allowed wire spellings. The
database encoding is not chosen here. Snapshot-specific numeric-ID validation
in S is an input-adapter concern, not a new HTTP ID pattern.

**Source:** F; B section 3; P enums and implementation notes; S schemas.
**Acceptance:** round-trip an opaque canonical ID unchanged; never construct a
resource ID from a material ID. Reject an unrecognized route rather than map it
to a fifth strategy. Serialize a known public date in UTC and an unknown
description as `null`, never an empty-string sentinel.

<a id="SH-03"></a>

### SH-03: Runtime Isolation And Secrets

**Required. Owner:** Gateway/frontend/worker; **consumer:** users and operators.
Next.js MUST call the Gateway for application data. Normal Gateway requests
MUST NOT read the snapshot archive from S3. Frontend code/responses MUST NOT
contain DB/S3 credentials, CILogon client secrets or provider tokens, NRP keys,
raw embeddings, or internal prompts. Browser navigation to CILogon for sign-in
is allowed; browser token exchange is not. Logs/import reports exclude
credentials and full sensitive headers. No material mutation endpoints or
deferred systems are introduced by this contract.

**Source:** F; B sections 1, 4.1, 4.3, 5, 6.3; T "Simple System View".
**Acceptance:** with S3 unreachable and prepared DB data, catalog reads still
work; inspect browser traffic/bundle and API error responses for test secret
markers and raw vectors, finding none. Import failure logs redact test headers.

<a id="SH-04"></a>

### SH-04: HTTP Errors And Correlation

**Required minimum, incomplete transport policy. Owner:** Gateway;
**consumer:** frontend. JSON is the default; base path is `/api/v1`.
Errors MUST use the B envelope below, and API responses/logs MUST be correlatable
by request ID. `code` and `message` are strings; `requestId` is a UUID-shaped
application identifier; `details` is nullable, with non-null structure undecided.
Success-header placement, status/code catalogue, validation details, unknown-ID
behavior and retry semantics are [D-02](decisions-needed.md#D-02), not invented
here. `clientRequestId` is not automatically the server request ID.

Synthetic valid envelope; code is illustrative, not an assigned production code:

```json
{
  "code": "EXAMPLE_ERROR",
  "message": "Illustrative failure",
  "requestId": "00000000-0000-4000-8000-000000000001",
  "details": null
}
```

**Source:** B sections 3, 4.1. **Acceptance:** an induced request failure returns
all four fields and correlates with a sanitized log entry; a raw Nest exception
body without this envelope fails. Assert exact HTTP status after D-02 closes.

## Gateway And Frontend HTTP

<a id="HTTP-01"></a>

### HTTP-01: Public Catalog Operations

**Required capabilities; wire completion undecided. Owner:** Gateway Catalog;
**consumer:** Next.js. All paths below are relative to `/api/v1`, read-only and
public. Gateway MUST supply these capabilities without requiring a session.

| Operation                                             | Input / result known from B                                                                                                  | Unsettled wire portion                                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `GET /materials`                                      | Paginated material discovery; filters for topic, tool, system, event series/edition, instructor, resource type, search text. | Query names/types, filter combination logic, sort/tie order, page scheme/default/limit/envelope. |
| `GET /materials/{materialId}`                         | Canonical material ID; minimum material result below.                                                                        | Missing ID behavior, exhaustive DTO.                                                             |
| `GET /materials/{materialId}/resources`               | Canonical material ID; attached resources.                                                                                   | Collection envelope, ordering, missing/unavailable resource policy.                              |
| `GET /topics`, `GET /tools`, `GET /systems`           | Canonical vocabulary discovery.                                                                                              | Query/response schemas and ordering.                                                             |
| `GET /event-series`, `GET /event-editions`            | Canonical events/series discovery.                                                                                           | Query/response schemas and ordering.                                                             |
| `GET /learning-paths`, `GET /learning-paths/{pathId}` | Public curated paths; distinct from personal paths.                                                                          | DTO/publication predicate and curated ID/content source, D-12.                                   |

Filtering MUST use explicit catalog relationships and no LLM. Event dates and
resource verification/status are not invented material publication/freshness
fields. Exact wire completion is [D-02](decisions-needed.md#D-02); absent routes
such as public person detail or event detail are not implied by this list.

**Source:** B sections 4.2, 9; P "Relational catalog"; F.
**Acceptance:** with no cookie and the model client disabled, query a fixture's
topic and get only related materials; a transcript mention without a catalog
relationship does not create a match. Exercise every listed public capability
against approved OpenAPI once D-02 is resolved, including empty results and
pagination boundaries. No guessed query spelling is an acceptance oracle.

<a id="HTTP-02"></a>

### HTTP-02: Minimum Material Projection

**Required minimum only. Owner:** Gateway; **consumer:** Next.js and citations.
The material projection MUST retain the fields and meanings below. It is not a
closed JSON Schema; arrays with unspecified item shapes do not become `string[]`
or object DTOs by inference. Missing-source policies are D-02/D-11.

| Field                                                        | Known type / rule                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `id`, `title`                                                | Canonical material string ID; string title.                                |
| `description`                                                | String or `null`.                                                          |
| `eventEditions`, `topics`, `tools`, `systems`, `instructors` | Arrays; nested schemas not defined by B.                                   |
| `resources`                                                  | Array of minimum resource objects.                                         |
| `resources[].id`, `.title`                                   | Canonical resource string ID; string title.                                |
| `resources[].type`                                           | Resource type string; B demonstrates `video`, not a complete wire enum.    |
| `resources[].url`                                            | Canonical URL string when available; absent-link representation undecided. |
| `resources[].verificationStatus`                             | String; `content_verified` is an example, not an exhaustive enum.          |

Synthetic API projection, not a Snapshot v3 input record. `example-*` identifiers
are placeholders that a test fixture must explicitly seed; no actual snapshot
ID is fabricated. Empty relationships mean known empty in this example only.

```json
{
  "id": "example-material-A",
  "title": "Example training",
  "description": null,
  "eventEditions": [],
  "topics": [],
  "tools": [],
  "systems": [],
  "instructors": [],
  "resources": [
    {
      "id": "example-resource-A",
      "title": "Example recording",
      "type": "video",
      "url": "https://example.org/recording",
      "verificationStatus": "content_verified"
    }
  ]
}
```

**Source:** B section 4.2; P ContentResource/MaterialResource.
**Acceptance:** a seeded material-resource join yields the same canonical IDs
in detail and resource-list results; a resource attached only to another
material is not included. Unknown description is `null`. Compare completed
OpenAPI response schemas to frontend fixtures, not only this minimal example.

<a id="HTTP-03"></a>

### HTTP-03: Authentication And Roles

**Required security boundary; auth wire/session policy undecided. Owner:**
Gateway Auth/Users; **consumer:** Next.js. Gateway MUST own CILogon callback,
code exchange, local user creation, role lookup and application session. New
users receive `LEARNER`; elevation requires an authorized administrator or
controlled administrative process, never a client request or CILogon role
claim. Sessions use Secure, HttpOnly, SameSite cookies; provider access/refresh
tokens are not exposed to frontend JavaScript. Personal records are scoped
from the authenticated identity, not a submitted `userId`.

Auth initiation/callback/logout routes, exact SameSite mode, CSRF/session
lifecycle and email/issuer-subject collision handling are
[D-04](decisions-needed.md#D-04). No auth URL or automatic account linking is
specified here. Maintainer smoke authorization has no submission workflow;
whether `ADMIN` also accesses that page needs D-04's explicit role matrix.

**Source:** F; B section 4.3; P "Learner and AIDA records", identity constraints;
T "Frontend Team". **Acceptance:** sign in a new test identity claiming an
elevated role and observe local `LEARNER`; client role edits do not elevate it.
A properly provisioned maintainer passes the smoke check; a learner/guest does
not. Inspect cookie flags and browser-visible data for no provider tokens.

<a id="HTTP-04"></a>

### HTTP-04: Personal Learning Operations

**Required later increments after catalog. Owner:** Gateway Learning/Users;
**consumer:** authenticated Next.js. Gateway MUST support these capabilities
with owner scoping; guests and cross-user requests do not read/change records.
No path identifier can substitute for authorization.

| Operations                                                                                                                   | Known boundary and persisted constraints                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /me`                                                                                                                    | Current authenticated user; response fields not defined.                                                                                                                                         |
| `GET /me/bookmarks`, `POST /me/bookmarks`, `DELETE /me/bookmarks/{materialId}`                                               | Canonical material reference; unique `(userId, materialId)`. POST body/response not defined.                                                                                                     |
| `GET /me/progress`, `PUT /me/progress/{materialId}`                                                                          | Canonical material reference; persisted `progressPercent` decimal in inclusive range 0..100; unique `(userId, materialId)`. Exact JSON input not defined.                                        |
| `GET /me/learning-paths`, `POST /me/learning-paths`, `PUT /me/learning-paths/{pathId}`, `DELETE /me/learning-paths/{pathId}` | App UUID path owned by user; title/description and ordered material items in P. Item positions non-negative, unique per path; no duplicate material within a path. Bodies/envelopes not defined. |

P's row fields are not automatically writable HTTP fields. D-02 covers body
schemas, duplicate bookmark behavior, update concurrency, path replace/reorder
atomicity, retries and delete repeat behavior. No progress DELETE route is
added to satisfy older stories; reset/removal needs that decision. Persistence
constraints can proceed independently of endpoint completion.

**Source:** B sections 4.3, 9; P sections 1 and "Required constraints and indexes".
**Acceptance:** user A cannot access/delete B's path or read B's bookmarks by
injecting an owner ID. DB writes of progress -1/101 fail and 0/100 pass; duplicate
bookmark pairs/path positions/path materials fail uniqueness checks. HTTP
duplicate response assertions wait for D-02.

<a id="HTTP-05"></a>

### HTTP-05: Frontend Observable States

**Required. Owner:** Next.js; **consumer:** learners. Frontend MUST render
loading, empty, error, unauthorized, grounded, partial, general and abstained
states, preserving the distinction between AIDA route and support mode.
Frontend integration uses generated or contract-checked OpenAPI types, not an
independently invented API. Maintainer page remains only an authorization smoke
test. No claim of available material timestamps or freshness is fabricated.

**Source:** B sections 2, 4.1; T "Frontend Team", "Gateway and frontend handoff";
F. **Acceptance:** approved mock responses for each state produce distinct,
accessible UI states; a retrieval failure is not displayed as proof that the
catalog has no relevant material. Public browsing remains available signed out.

## Ingestion And Persistence

<a id="DATA-01"></a>

### DATA-01: Schema And Database Access Ownership

**Required. Owner:** Srujam/Gateway migrations; **consumer:** Mio/Arnav's Python
worker and Gateway repositories. Both applications MUST use the same versioned
Gateway migrations in one PostgreSQL database with the `vector` extension.
P's four namespaces are logical ownership groups, not four databases. Physical
table/column spelling, types, nullability and ORM are
[D-05](decisions-needed.md#D-05); I's snake_case table names are proposals.

Importer access MUST be restricted to imported catalog, typed aliases/joins,
chunks, embeddings and import lifecycle data. It MUST NOT read or modify
users, identities, sessions, roles, bookmarks, progress, personal/curated paths,
conversations, messages, answer runs, citations, feedback or coverage gaps.
Gateway controls access to those records; importer is not a general application
DB user. Curated paths remain excluded from the worker without deciding their
population source, creation process or ID provenance; those remain D-12.

**Source:** F; B sections 5, 6.3; I "Tables The Worker Must Not Manage", "First
Migration Group"; P implementation notes. **Acceptance:** apply Gateway
migrations to an empty local DB; worker imports using its own restricted role.
For each protected table, attempts to SELECT/INSERT/UPDATE/DELETE under that
role fail; permitted fixture import succeeds. No worker-managed permanent DDL.

<a id="DATA-02"></a>

### DATA-02: Immutable Input And Verification

**Required. Owner:** worker; **consumer:** Gateway serving projection.
The worker MUST accept `--source` as either an S3 archive URI or a local archive
path using the same implementation. These are argument examples, not a chosen
executable name or a live bucket:

```text
--source s3://example-bucket/fixture.zip
--source C:/fixtures/fixture.zip
```

The reviewed fixture is exactly:

```json
{
  "snapshot_id": "snapshot-v3-20260805T002229Z",
  "archive_sha256": "82b16349c93b88ad31fa8d08d76b2ba2a470c0e327151a6bd695b51967cc6945"
}
```

This JSON identifies an input, not a new CLI configuration schema. Before
modifying serving data, worker MUST verify archive checksum, `snapshot.json`,
schema version, internal checksums, required files, record shapes and references.
Required file families are `canonical/entities.jsonl`, `relationships.jsonl`,
`aliases.jsonl` under `canonical/`; `portal/*.json`; and `chunks.jsonl`,
`citation_index.jsonl`, `material_cards.jsonl`, `embedding_manifest.json` under
`aida/`. The manifest is at archive root. Use the exact archive's inventory;
do not interpret a wildcard as permission to omit a manifest-listed file.
No new snapshot production/download pipeline is authorized.

Trusted expected-checksum delivery, malformed/pre-manifest failure recording and
local-path provenance storage are D-05. Reading a checksum from the same
untrusted input alone cannot establish the expected archive identity.

**Source:** F; B sections 6.1-6.3; I "Import Sequence"; S benchmark manifest.
**Acceptance:** identical local/S3 fixture bytes map to the same canonical
records using a fake S3 adapter; corrupt an archive byte or required internal
file and no serving row changes. A reused ID with a different checksum fails
closed. Report exact snapshot ID/checksum, not just "v3".

<a id="DATA-03"></a>

### DATA-03: Canonical Projection And Join Mapping

**Required supported mapping. Owner:** Mio; **consumer:** migration/catalog
owners. Import MUST preserve canonical IDs and provenance using explicit joins,
not an additional active generic relationship table. S input `Material` maps
to P `TrainingMaterial`; other supported entity type names correspond to P.
`snapshotId` on imported domain rows comes from manifest `snapshot_id`, not
from an invented per-record field.

| S relationship `type` | S endpoints                                       | P join and fields                                                                                                            |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `INSTANCE_OF`         | EventEdition `source_id`, EventSeries `target_id` | `EventSeriesEdition.eventEditionId`, `.eventSeriesId` respectively. Direction is deliberately reversed from the join's name. |
| `HAS_MATERIAL`        | EventEdition -> Material                          | `EventMaterial.eventEditionId`, `.materialId`.                                                                               |
| `HAS_RESOURCE`        | Material -> ContentResource                       | `MaterialResource.materialId`, `.resourceId`.                                                                                |
| `COVERS_TOPIC`        | Material -> Topic                                 | `MaterialTopic.materialId`, `.topicId`.                                                                                      |
| `TEACHES_TOOL`        | Material -> Tool                                  | `MaterialTool.materialId`, `.toolId`.                                                                                        |
| `TARGETS_SYSTEM`      | Material -> System                                | `MaterialSystem.materialId`, `.systemId`.                                                                                    |
| `TAUGHT_BY`           | Material -> Person                                | `MaterialInstructor.materialId`, `.personId`.                                                                                |

Every supported join maps S `id` -> `relationshipId`, `evidence` -> `evidence`,
`extraction_method` -> `extractionMethod`, `review_status` -> `reviewStatus`,
`trust_class` -> `trustClass`, `source_document` -> `sourceDocument`.
S requires nonempty strings for these provenance fields. Aliases dispatch by
`entity_type` to P's four typed alias tables; `canonical_id` -> the typed FK,
`alias`/`source` unchanged, `review_status` -> `reviewStatus`.

S also allows `PREREQUISITE_OF`, `SUPERSEDED_BY`, `RELATED_TO`; P does not map
them. Do not silently discard or place them in a generic table: D-05 blocks
import of such records pending a documented mapping/rejection policy. The
archive's actual occurrence counts were not inspected here.

P's deliberate flattening remains required: material repository/commit metadata
to `sourceRepository`/`sourceCommit`; event source date/time/ID/file to their
explicit columns; resource `file_paths`/`file_hashes` to `ContentResourceFile`.
P remains the single field catalogue. Exact optional extraction/fallback rules
not stated there are D-05, not guessed from naming conventions.

**Source:** B sections 1, 6.2; P "Relational catalog"; I "Relationships";
S relationship schema and builder `curation_entity_rows`, event relationship
construction. **Acceptance:** seed one of each supported relationship and
assert exact endpoint/provenance mapping and FK validity; reverse an endpoint
type or remove its target and validation fails. An unsupported type surfaces
an explicit blocked mapping, not a success with silently reduced counts.

<a id="DATA-04"></a>

### DATA-04: Chunk Preservation And Embedding Separation

**Required. Owner:** Arnav/worker; **consumer:** Gateway Retrieval.
Worker MUST import existing chunk records without rechunking or changing text,
IDs, offsets, hashes or chunking version. These are source-to-domain names,
not HTTP fields or finalized SQL names:

| S chunk field                                                  | P ContentChunk field / known type                                                                                                             |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `material_id`, `content_resource_id`, `event_edition_id` | `id`, `materialId`, `contentResourceId`, `eventEditionId`: canonical strings. S requires all four; P allows optional event context generally. |
| `source_kind`, `section`, `chunk_index`                        | `sourceKind` (ChunkKind), `section` (string), `chunkIndex` (integer).                                                                         |
| `offsets.word_start`, `offsets.word_end`                       | `wordStart`, `wordEnd`: integers, start <= end; preserve source offsets.                                                                      |
| `text`, `text_hash`, `source_hash`                             | `text` nonempty string; `textHash` hash string; `sourceHash` may be null in builder output. No fabricated hash for missing source content.    |
| `source_entity_id`, `source_location`                          | `sourceEntityId`, `sourceLocation`: source strings, not necessarily navigable URLs.                                                           |
| `provenance`, `chunking_version`, `language`                   | `provenance` JSON object, `chunkingVersion` string, `language` string as supplied.                                                            |

`snapshotId` comes from DATA-03. S's chunk schema requires several keys without
constraining their types and does not require `source_kind` or `chunk_index`;
the builder emits them. Schema validation alone is insufficient for the serving
model. Missing/unsupported serving fields are D-05, not defaults to transcript
or index zero. Transcript timestamps are unavailable in this fixture.

`embedding_model = not-generated` in the input is not a serving model name.
Worker MUST generate separate `ChunkEmbedding` rows with app UUID `id`,
canonical `chunkId`, `embeddingModel`, `embeddingVersion`, integer `dimensions`,
`contentHash`, vector `embedding`, and `createdAt`. Model/provider/version,
dimension, normalization and distance compatibility with runtime query vectors
are explicit configuration, not inferred from router dimension alone.
[D-09](decisions-needed.md#D-09) blocks production embedding configuration,
batch sizes, timeout/retry limits and top_k.

**Source:** F; B sections 6.2, 9; P section 4; I "Required Configuration";
S chunk schema, builder `chunks_for_resource` and `write_aida`.
**Acceptance:** compare all supplied chunk IDs/text/hashes/offsets before and
after import; repeat import leaves them unchanged. A deterministic matching
vector returns its chunk and canonical parents; wrong dimension/model/config
is rejected rather than queried in an incompatible index. No NRP dependency
in deterministic PR tests.

<a id="DATA-05"></a>

### DATA-05: Import State, Atomicity And Replay

**Required invariants; lifecycle details undecided. Owner:** worker and Gateway
migrations; **consumer:** runtime readers/operators. Each import MUST retain an
attempt record with identity/checksum, worker version/code commit, configuration
and hash, start/completion, counts, timings, warnings and failures. P's
`SnapshotImportRun`/`SnapshotImportError` are the domain model; fields not yet
represented physically are D-05. Error records retain stage, source path/record,
code/message/details when available without secrets.

Imports MUST stage or isolate data before transactional activation; validate
counts, FKs, dimensions, indexes and retrieval smoke checks first. Failed
imports do not replace or partially modify the active serving projection.
There is at most one active snapshot (P requires a partial unique index).
Re-importing the same snapshot and configuration is idempotent for serving
rows; a new attempt record is not a duplicate catalog row. A reused snapshot
ID with changed checksum fails closed. Do not mutate the source archive.

`ready` versus the enum and activation authority are
[D-01](decisions-needed.md#D-01). Do not add that enum member silently. These
safety invariants apply to the static fixture; they do not authorize automatic
new-snapshot lifecycle work. Initial local demonstration may use an empty DB
per I. Exact replay/configuration equivalence, concurrent imports, resumability
and pre-validation errors remain D-05. No retry count or exit-code scheme is
approved here.

**Source:** F; B sections 6.2-6.3; P "Snapshot import and activation";
I "Import Sequence". **Acceptance:** seed working projection A, inject failure
after partial candidate load and observe A unchanged plus a failed attempt;
repeat valid import yields unchanged serving counts. Concurrent activation
cannot leave two active rows. Switching visibility never exposes a mixed
projection. Test the agreed status transitions only after D-01 closes.

<a id="DATA-06"></a>

### DATA-06: Integrity Constraints And Indexes

**Required target; named compatibility blocker below. Owner:** Gateway migrations;
**consumer:** all DB writers/readers. Migrations MUST preserve P's "Required
constraints and indexes" as the domain target, stopping for the named D-05
conflict rather than blindly implementing an incompatible constraint. That
section is the single domain constraint catalogue, including:

- Unique normalized user email, identity per user and issuer/subject pair;
  bookmark/progress per user/material; path positions and materials per path.
- Unique canonical IDs, relationship IDs and FK pairs, normalized typed aliases,
  event edition's series, resource/path file pair, chunk resource/index/version/
  text-hash tuple and embedding chunk/model/version tuple.
- Unique conversation/sequence, answer run per assistant message, coverage gap
  per run and feedback per assistant message/user. Feedback owner matches the
  conversation; answer runs attach only to assistant messages.
- Valid context FKs; progress range and nonnegative path/message/citation
  positions; word-offset ordering; configured embedding dimension;
  `activatedAt` present only for active/retired snapshots.
- Catalog/full-text/filter/FK/snapshot indexes; source-kind/chunk-text and a
  distance-compatible pgvector index; conversation owner/time and message
  sequence indexes. HNSW versus IVFFlat is not selected here.
- Cascades for user-owned data, imported joins and chunk embeddings; restrict
  removal of canonical entities referenced by learner data or AIDA history.
  Preserve stable-ID references rather than break them.

**Verified compatibility blocker:** the combined independent review verified
96 groups / 212 rows colliding under P's
`(contentResourceId, chunkIndex, chunkingVersion, textHash)` uniqueness rule,
with zero duplicate canonical ID groups among 2291 chunks. Tuple deduplication
would lose 116 rows. See [evidence attribution](review/contract-review-dispositions.md#collision-evidence).
This author read the review and retained companion evidence, not the ZIP.
D-05 blocks finalizing this constraint/import compatibility until the model
owners approve a preservation-compatible resolution, including the small
shared-resource fixture; verification did not approve a replacement key.
Neither dropping canonical chunks nor adding a field to the key is approved.
DATA-04's preservation rule remains in force.

Identity normalization details are D-04; physical constraints/nullable columns
and local archive key representation are D-05; retention/deletion exceptions
are D-06. A global DB role is not a substitute for owner checks in the Gateway.

**Source:** P "Required constraints and indexes"; I "First Migration Group".
**Acceptance:** after the named compatibility decision, migration tests exercise
every approved unique/check/FK with a
valid insert and an invalid counterpart (e.g. duplicate series for an edition,
answer run on a user message, feedback by another user). Deleting a referenced
material fails without deleting the learner's record. Introspect required
indexes and prove the configured vector query executes against the shared DB.

<a id="DATA-07"></a>

### DATA-07: Fixture And Integration Gates

**Required. Owner:** worker/retrieval; **consumer:** Gateway and benchmark owners.
Tests MUST compare against the exact selected fixture/manifest, not an arbitrary
schema-family count. Full reviewed-fixture expectations from B are:

| Entity                     | Count |
| -------------------------- | ----: |
| Training materials         |   530 |
| Content resources          |  1423 |
| Event editions             |   520 |
| Event series               |     6 |
| People                     |    49 |
| Topics                     |    21 |
| Tools                      |    36 |
| Systems                    |     5 |
| Chunks                     |  2291 |
| Transcript chunks (subset) |  1161 |

Start with a documented subset containing one material, resource, relationship,
chunks and deterministic embeddings; its counts are the subset's counts, not
the full totals. A full import is not required for the first local demonstration.
PR tests use fixed small fixtures without live NRP. Measured provider tests are
separate work, not authorized by this documentation task.

**Source:** B sections 6.3, 9; I "Testing Expectations", "Definition Of Done".
**Acceptance:** local migration/import/replay/vector-query test returns the
seeded chunk and valid parents; invalid checksum/missing FK is rejected and
recorded. Full-fixture validation, when separately run, reports each total
above, zero broken references, and exact identity/checksum. No passing full
import is claimed from a passing subset.

## AIDA

<a id="AIDA-01"></a>

### AIDA-01: Conversation HTTP Ownership

**Required authenticated capabilities; guest policy undecided. Owner:** Gateway
Aida; **consumer:** Next.js. Gateway MUST own persisted authenticated history
and enforce conversation ownership on reads, writes, deletion and feedback.
Support-admin access needs an explicit procedure; `ADMIN` alone does not define
one. The importer has no access.

| Operation (relative to `/api/v1`)                    | Contract known / pending                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `POST /aida/conversations`                           | Create owned conversation; creation body/empty-history handling D-02/D-05.   |
| `GET /aida/conversations`                            | Owner history; envelope/order/pagination D-02.                               |
| `GET /aida/conversations/{conversationId}`           | App UUID; owner's conversation; message sequence persisted by P.             |
| `POST /aida/conversations/{conversationId}/messages` | App UUID; question minimum below; persistence transaction/replay D-02/D-07.  |
| `POST /aida/messages`                                | Listed guest or one-turn capability; enablement/authentication policy D-03.  |
| `POST /aida/messages/{messageId}/feedback`           | App UUID assistant message; feedback by owner; body/rating encoding D-02.    |
| `DELETE /aida/conversations/{conversationId}`        | Owner deletion; hard-delete/cascade target subject to D-06 retention policy. |

Auth required for persisted personal history. Public catalog access does not
settle guest AIDA availability. Do not create anonymous durable conversations
while waiting for [D-03](decisions-needed.md#D-03). Physical conversation
deletion/retention is [D-06](decisions-needed.md#D-06).

**Source:** F; B sections 7.1, 9; P "Learner and AIDA records", constraints.
**Acceptance:** A creates history; B/guest cannot enumerate, read, append to,
delete or give feedback on it via guessed IDs. Authorized owner can retrieve
their stored sequence. A support-admin access test requires the approved
procedure, not blanket administrator access.

<a id="AIDA-02"></a>

### AIDA-02: Question And Answer Minimum Fields

**Required minimum; full wire schema undecided. Owner:** Gateway Aida;
**consumer:** Next.js. AIDA MUST preserve B's question/answer field meanings.
"Listed" below means minimum B example, not finalized required-key/nullability
rules for every endpoint. Request text is a string; constraints for blank text,
length and omission are D-02. Context is optional semantically; its missing-key
versus `null` encoding needs D-02. No client-selected route/model/owner is added.

| Object                  | Fields and known types                                                                                                                                                                                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Question                | `text`: string; `contextMaterialId`, `contextResourceId`: canonical string or `null`; `clientRequestId`: UUID. D-02 settles whether that ID is required and its replay semantics.                                                                                                                                                |
| Answer identity/content | `messageId`, `requestId`: UUIDs; `answer`: string; `route`: AidaRoute; `answerMode`: AnswerMode; `limitations`: string or `null`.                                                                                                                                                                                                |
| Answer evidence         | `citations`: array (below); `suggestedFollowUps`: array with item schema not finalized; `coverageGap`: boolean, reason/trigger rules pending D-10.                                                                                                                                                                               |
| `timingMs`              | `queryEmbedding`, `routing`, `retrieval`, `timeToFirstToken`, `generation`, `total`: millisecond measurements. P permits absent generation/token measurements for deterministic catalog/abstention; D-07 settles wire nulls, availability and streaming lifecycle. Zero is not silently substituted for unavailable measurement. |
| Citation                | `materialId`: canonical string always; `resourceId`, `chunkId`: canonical string or `null` per P; `title`, `url`, `sourceKind` shown in B. `sourceKind` uses ChunkKind when a chunk exists; null/omission for material-only citations and missing URL/title handling are D-11.                                                   |

Synthetic context-bearing request (seed the placeholder IDs and their valid
relationship; this is not a real snapshot question):

```json
{
  "text": "What did the instructor mean?",
  "contextMaterialId": "example-material-A",
  "contextResourceId": "example-resource-A",
  "clientRequestId": "00000000-0000-4000-8000-000000000002"
}
```

Synthetic minimum answer for a separately seeded slide resource/chunk. Timings
are illustrative measured values, not latency targets; follow-up item schema
is deliberately not invented by populating the empty array.

```json
{
  "messageId": "00000000-0000-4000-8000-000000000003",
  "answer": "The example slide explains the concept.",
  "route": "general_rag",
  "answerMode": "grounded",
  "limitations": null,
  "citations": [
    {
      "materialId": "example-material-A",
      "resourceId": "example-resource-B",
      "chunkId": "example-chunk-B",
      "title": "Example slide",
      "url": "https://example.org/slides",
      "sourceKind": "slides"
    }
  ],
  "suggestedFollowUps": [],
  "coverageGap": false,
  "timingMs": {
    "queryEmbedding": 20,
    "routing": 2,
    "retrieval": 8,
    "timeToFirstToken": 80,
    "generation": 100,
    "total": 130
  },
  "requestId": "00000000-0000-4000-8000-000000000004"
}
```

First-response delivery is [D-07](decisions-needed.md#D-07). These examples do
not select synchronous JSON over a stream or define event frames.

**Source:** B sections 7.1, 7.4; P citation/nullability notes.
**Acceptance:** complete approved DTOs retain separate route/mode and canonical
references; a partial answer is not coerced to `grounded` by a RAG route. A
material-only citation is not rejected merely for null resource/chunk IDs;
final URL/sourceKind serialization waits for D-11. No retry is assumed safe
solely because the question includes `clientRequestId`.

<a id="AIDA-03"></a>

### AIDA-03: Route Execution And Scope

**Required route behavior; unresolved scope policy is D-10. Owner:** Gateway
Router/Retrieval; **consumer:** Synthesis/Next.js. Execution MUST respect:

| Route            | Retrieval and evidence boundary                                                                                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog_api`    | Relational catalog queries for exact IDs/titles/filters/links/resources/programs/counts; no LLM required for retrieval. Optional prose formatting cannot alter catalog facts.                                                           |
| `general_rag`    | pgvector over approved non-transcript/general-purpose chunks. Exact allowlist and evidence thresholds need D-10; do not silently search every chunk.                                                                                    |
| `transcript_rag` | Predicate `sourceKind = transcript`, active snapshot, and selected recording's canonical material/resource scope together. Recording scope is not a substitute for the source-kind predicate.                                           |
| `abstain`        | Unsupported/private/live/transactional/out-of-corpus/unsafe questions; no fabricated corpus answer. B allows a labeled safe non-institutional general explanation while R describes no-generation abstain: D-10 settles the difference. |

Explicit open-recording product context MUST precede text classification for
transcript questions, including context-dependent follow-ups. A missing,
conflicting or unresolved context does not authorize a wider transcript search.
[D-10](decisions-needed.md#D-10) blocks the exact fallback and the mapping from a
video resource to its transcript resource(s); material and resource ID equality
is not a valid substitute for that relationship. B's camelCase request versus
R's `query`/`material_id`/`content_resource_id`/`scope` interface is D-02/D-10.

**Source:** F; B sections 7.2-7.4; R "Recommended MVP Architecture", "Required
runtime DTO"; T Arnav boundary. **Acceptance:** seed transcript chunks inside
and outside selected scope, plus slides inside it; transcript retrieval returns
only in-scope transcript chunks. An open-recording follow-up overrides a
contradictory text-only classifier. Separate missing, conflicting and unresolved
recording-context cases remain gated by D-10, including unresolved video-to-
transcript association. After approval, each returns the approved controlled
outcome, never unscoped transcript retrieval. This criterion does not choose
clarification, abstention or an error; the companion's IW-023/T12/D4 share this
gate. Catalog answers survive disabled
LLM retrieval.

<a id="AIDA-04"></a>

### AIDA-04: Evidence Integrity And Honest Support

**Required. Owner:** Retrieval/Synthesis; **consumer:** learner and history.
Retrieval MUST use the active snapshot; each cited chunk resolves to its
canonical resource/material and belongs to the evidence supplied to synthesis.
Conversation summaries are context, not evidence. A grounded recommendation
includes at least one valid canonical material or resource citation (every
citation still identifies a material per P). Weak/empty/uncitable evidence can
force `answerMode = abstained` after a RAG route. Retrieval failure does not
establish absence of information from the corpus. No fabricated timestamp
deep link is returned for this fixture.

`route` records evidence selection, not a renamed answer mode. Exact evidence
thresholds/coverage-gap reasons and fallback are D-10; snapshot consistency
during activation is D-01. Citation missing-link serialization is D-11.

**Source:** B sections 7.2-7.4, 9; P AidaCitation; S timestamp capability manifest.
**Acceptance:** a model-produced citation to an unprovided chunk fails output
validation; a retired-snapshot chunk is excluded from retrieval. A grounded
recommendation with no valid canonical citation fails. Empty/uncitable evidence
produces honest unsupported output under the approved policy; an injected DB
failure does not produce "the corpus contains no information" as a fact.

<a id="AIDA-05"></a>

### AIDA-05: Persisted Turns And Privacy

**Required persisted facts; transaction/deletion policy undecided. Owner:**
Gateway Aida; **consumer:** owner history and authorized operational support.
Gateway MUST retain user/assistant content, canonical UI scope, route/mode,
citations, model/configuration versions, rolling summary and bounded operational
metrics in P's conversation/message/run records. It MUST NOT store a duplicate
assembled prompt on every turn, system/developer/retrieved-context prompts,
credentials or provider secrets. Summary is context, not evidence.

P defines message `sequence`, summary `summaryThroughSequence`, and positional
citations; no fixed history window, token budget, summary trigger or retention
period is approved. Server owns identity and message sequence. Generation/run
fields may be nullable for deterministic results as specified by P. Exact
commit/rollback behavior for user-message persistence, model failure, concurrent
turns, cancellation and replay is D-02/D-07. Deletion cascades await D-06.

**Source:** F; B sections 7.1, 7.4; P section 4 and learner/AIDA notes.
**Acceptance:** an authenticated completed answer can be reconstructed from
owner-scoped messages, scope, run metadata and citations; inspection finds no
assembled prompt or secret markers. Duplicate sequence/run/citation ownership
violations fail DATA-06. Failure/duplicate-turn tests use the approved
transaction policy, not an inferred `clientRequestId` deduplication rule.

<a id="AIDA-06"></a>

### AIDA-06: Router Release And Parity Gates

**Required target/gates, not implemented. Owner:** Mio offline artifact;
Arnav NestJS runtime; **consumer:** Gateway Aida. Runtime classifier MUST remain
unpromoted until B section 11 and R's release gates are met. Python is offline
training/evaluation/export, not a new production service or request subprocess.

Current reviewed math is L2-normalized `qwen3-embedding` input of 4096 dimensions
and four-class multinomial logistic regression. This describes the reviewed
router, not the RAG chunk embedding configuration. Release artifact contains
schema/artifact versions; ordered classes; 4 x 4096 coefficients and four
intercepts; dtype/shape; normalization including zero-norm behavior; softmax/
argmax/tie policy; confidence threshold and fallback; training configuration;
benchmark/split/embedding hashes; fixture identity; provider model/revision;
source/dependency versions; creation time and coefficient checksum. The exact
serialization/export release is [D-08](decisions-needed.md#D-08).

Internal router-result minimum from B: `route` (AidaRoute), `confidence`
(number), `scores` (number for each AidaRoute), `lowConfidence` (boolean),
`artifactVersion` (string), `embeddingModel` (string), `fallbackReason`
(string or null). Threshold, score-validation tolerance, context-override score
representation and fallback DTO completion need D-08/D-10. No random route or
fan-out to every strategy on low confidence.

**Source:** F; B sections 7.3, 11; R "Porting Contract", "Porting And Release
Gate". **Acceptance / promotion evidence:**

- Reconcile the reported 12/20 primary and 17/20 acceptable validation matches
  versus the higher README claim using locked source/environment evidence.
  These are R's reported results, not runs performed in this task.
- Publish immutable checksummed export and repaired inventory, including cached
  embeddings. S has review/validation files; that does not repair R's separately
  reviewed router copy or establish its cached-embedding hash.
- Frozen 4096-element vectors yield matching routes and probabilities within
  R's specified `1e-6`; B refers to approved tolerance, so D-08 confirms approval
  before promotion. All 120 cached embeddings have identical Python/TypeScript
  route labels. Port parity is not an accuracy claim.
- R requires at least ten additional context-aware transcript validation cases.
  Timeout, rate limit, malformed/wrong-dimension/zero vector, missing artifact,
  low confidence, missing/conflicting context and weak evidence return controlled
  results, never an unhandled request failure. Exact result policy is D-08/D-10.
- Freeze quality/fallback policy before held-out quality evaluation. R's
  80%/90%/70% accuracy/recall thresholds are proposals, not adopted limits.
  The 40-question held-out split is not used for tuning; cached-vector port
  equivalence is separate from labeled quality evaluation. No benchmark,
  training, live canary, load test or classifier port was run in this task.

## Implementation Gates

Load the [agent entrypoint](agent-entrypoint.md) for responsibility-specific
sections. [Decisions needed](decisions-needed.md) coordinates the contract and
linked specialist gates through its crosswalk; examples never close a decision.
Source mappings, security invariants and small
deterministic tests can proceed while affected wire/configuration portions are
blocked. Do not generate a purportedly final OpenAPI from these minimum fields.

[snapshot-doc]: https://github.com/sdsc-hpc-training-dev/intvid-backend/blob/5b9085d8717e31ffbb06e5621992ff05a14fbe89/docs/catalog-snapshot-v3.md
[entity-schema]: https://github.com/sdsc-hpc-training-dev/intvid-backend/blob/5b9085d8717e31ffbb06e5621992ff05a14fbe89/schemas/canonical-entity-v3.schema.json
[relationship-schema]: https://github.com/sdsc-hpc-training-dev/intvid-backend/blob/5b9085d8717e31ffbb06e5621992ff05a14fbe89/schemas/canonical-relationship-v3.schema.json
[chunk-schema]: https://github.com/sdsc-hpc-training-dev/intvid-backend/blob/5b9085d8717e31ffbb06e5621992ff05a14fbe89/schemas/citation-chunk-v3.schema.json
[snapshot-builder]: https://github.com/sdsc-hpc-training-dev/intvid-backend/blob/5b9085d8717e31ffbb06e5621992ff05a14fbe89/processing/catalog_snapshot.py
[benchmark-manifest]: https://github.com/sdsc-hpc-training-dev/intvid-backend/blob/5b9085d8717e31ffbb06e5621992ff05a14fbe89/benchmarks/aida-mvp-v2/benchmark_manifest.json
[frontend-page]: https://github.com/sdsc-hpc-training-dev/hpc-learning-hub-frontend/blob/9a59ec48d41d65f77117f9cfdb450fc3800bca28/app/page.tsx
[frontend-test]: https://github.com/sdsc-hpc-training-dev/hpc-learning-hub-frontend/blob/9a59ec48d41d65f77117f9cfdb450fc3800bca28/app/__tests__/sanity.test.tsx
[stories]: https://github.com/sdsc-hpc-training-dev/training-landing-page/blob/4e318f39d2208bfc5dc99239d67445db70174e77/docs/functional-user-stories.md
[personas]: https://github.com/sdsc-hpc-training-dev/training-landing-page/blob/4e318f39d2208bfc5dc99239d67445db70174e77/docs/user-personas.md
[design]: https://github.com/sdsc-hpc-training-dev/training-landing-page/blob/4e318f39d2208bfc5dc99239d67445db70174e77/docs/design-decisions.md
