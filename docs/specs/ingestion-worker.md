# Ingestion Worker Specification

**Date:** Wednesday, September 2, 2026  
**Primary owners:** Mio and Arnav  
**Database migration owner:** Srujam  
**Status:** First implementation specification

## What We Are Building

The ingestion worker is a small Python application that reads one exact HPC
Learning Hub snapshot and loads the information needed by the website and AIDA
into PostgreSQL with `pgvector`.

The worker is not part of the normal web-request path. It runs when we need to
load or replace a snapshot. The website and AIDA then read the prepared data
from PostgreSQL instead of downloading files from S3 for every request.

The first goal is intentionally small:

> Load one training material, its resource, its searchable chunks, and its
> embeddings into a local PostgreSQL/pgvector database, then retrieve one of
> those chunks with a vector search.

Once that works, use the same approach for the rest of Snapshot v3.

## Documents To Use

These documents are the source of truth for this work:

1. [Persistence class diagram](../sdsc-learning-hub-persistence-class-diagram.md)
2. [System contracts v0.1](../system-contracts-v0.1.md)
3. [AIDA router architecture verdict](../aida-router-architecture-verdict.md)
4. [Young's pipeline and latency review](../young-data-ingestion-and-rag-automation-review.md)
5. [AIDA V2 benchmark](https://github.com/sdsc-hpc-training-dev/intvid-backend/tree/codex/aida-mvp-benchmark-v2/benchmarks/aida-mvp-v2)

If this specification and the class diagram disagree, stop and raise the
question before creating a second interpretation in code.

## How Srujam, Mio, And Arnav Work Together

Srujam owns the official NestJS database migrations. Mio and Arnav own the
Python worker that fills the imported-data tables.

Mio and Arnav do not need to wait for the complete Gateway implementation. They
can start the parser, mapping code, Docker environment, and tests immediately.
They only need the first group of migrations before performing the complete
database integration test.

Do not maintain a separate permanent SQL schema inside the worker. If a table
or field is missing, propose the change to Srujam and update the Gateway
migration. Both applications must use the same schema.

## Tables Required By The Worker

The names below are the proposed PostgreSQL table names. Srujam may adjust the
final naming convention in the first migration, but after that all three
developers must use the Gateway migrations.

### 1. Snapshot And Import Tracking

| Table                    | Why it exists                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `catalog_snapshots`      | Identifies the exact snapshot, schema version, S3 object, checksum, record counts, and activation status.            |
| `snapshot_import_runs`   | Records each attempt to import a snapshot, including start/end time, worker version, counts, and success or failure. |
| `snapshot_import_errors` | Records useful errors without losing the entire history of an import attempt.                                        |

These tables make the import reproducible. Saying only "Snapshot v3" is not
enough; every run must record the exact snapshot ID and SHA-256 checksum.

### 2. Catalog Records

| Table                    | Snapshot information stored there                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| `event_series`           | Recurring programs or series.                                                                   |
| `event_editions`         | Individual dated events or sessions.                                                            |
| `training_materials`     | The canonical material users see and AIDA recommends.                                           |
| `content_resources`      | Videos, transcripts, slides, repositories, webpages, and other resources attached to materials. |
| `content_resource_files` | Selected file paths and hashes belonging to repository resources.                               |
| `people`                 | Instructors and other named people represented by the snapshot.                                 |
| `topics`                 | Canonical subject areas used for search and filtering.                                          |
| `tools`                  | Software tools taught by materials.                                                             |
| `systems`                | Computing systems such as Expanse.                                                              |

### 3. Aliases

| Table                  | Why it exists                                              |
| ---------------------- | ---------------------------------------------------------- |
| `event_series_aliases` | Connects alternative series names to one canonical series. |
| `topic_aliases`        | Connects alternative topic names to one canonical topic.   |
| `tool_aliases`         | Connects alternative tool names to one canonical tool.     |
| `system_aliases`       | Connects alternative system names to one canonical system. |

Aliases improve search and matching without creating duplicate canonical
records.

### 4. Relationships

| Table                   | Relationship represented                  |
| ----------------------- | ----------------------------------------- |
| `event_series_editions` | Event series to individual event edition. |
| `event_materials`       | Event edition to training material.       |
| `material_resources`    | Training material to its resources.       |
| `material_topics`       | Training material to topics.              |
| `material_tools`        | Training material to tools.               |
| `material_systems`      | Training material to computing systems.   |
| `material_instructors`  | Training material to instructors.         |

Use these specific relationship tables. Do not also create a generic table
containing arbitrary source and target entity types. The specific tables give
PostgreSQL real foreign keys and make mistakes easier to detect.

Each relationship must preserve the canonical IDs and the available snapshot
evidence, extraction method, review status, trust class, and source document.

### 5. AIDA Retrieval Data

| Table              | Why it exists                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `content_chunks`   | Stores the searchable text supplied by Snapshot v3, including its material/resource IDs, source kind, position, hashes, and provenance. |
| `chunk_embeddings` | Stores one or more vector representations of each chunk, including the embedding model, dimensions, version, and content hash.          |

Snapshot v3 already supplies the content chunks. Do not silently create a
different set of chunks during ingestion. Load the supplied chunks first. Any
future rechunking experiment must have a new, documented chunking version.

Snapshot v3 does not supply embeddings. The worker creates those using the
agreed embedding configuration and stores them in `chunk_embeddings`.

## Tables The Worker Must Not Manage

The worker does not create or update user activity:

- `users`
- `auth_identities`
- `bookmarks`
- `learning_progress`
- personal or curated learning paths
- `aida_conversations`
- `aida_messages`
- `aida_answer_runs`
- `aida_citations`
- `aida_feedback`
- `aida_coverage_gaps`

Those records are created by the Gateway while people use the application.
Keeping this boundary prevents a data import from changing accounts,
bookmarks, or conversation history.

## First Migration Group

Srujam should provide these tables first because they unblock the initial worker
demonstration:

1. `catalog_snapshots`
2. `snapshot_import_runs`
3. `snapshot_import_errors`
4. `training_materials`
5. `content_resources`
6. `material_resources`
7. `content_chunks`
8. `chunk_embeddings`

This is enough to prove the complete path without implementing the entire
catalog at once.

The migration must also:

- enable the `vector` PostgreSQL extension;
- create foreign keys between the tables;
- enforce unique canonical IDs and relationship pairs;
- enforce one embedding per chunk/model/version combination;
- add a vector index compatible with the agreed distance function;
- add indexes for `snapshot_id`, `material_id`, `content_resource_id`, and
  `source_kind`.

## Suggested Division Of Work

### Mio: Catalog Mapping And Validation

- Read and validate the snapshot manifest.
- Map Snapshot v3 entities, aliases, and relationships to database rows.
- Preserve stable IDs and provenance.
- Compare source counts with imported counts.
- Report missing references, duplicates, and unsupported records.

### Arnav: Chunks, Embeddings, And Retrieval Test

- Load the supplied Snapshot v3 chunks.
- Generate embeddings using the shared model and configuration.
- Store vectors and their model/version information.
- Implement a small vector-retrieval test filtered by source kind.
- Confirm that a retrieved chunk resolves back to the correct resource and
  training material.

### Shared Work

- Python application structure and command-line interface.
- Docker Compose environment for PostgreSQL/pgvector and the worker.
- Import-run status and error reporting.
- Integration tests and short documentation.
- Coordination with Srujam whenever a migration needs to change.

This split is a starting point, not a wall. Review each other's pull requests
because the catalog IDs and chunks must connect correctly.

## Import Sequence

The first implementation should follow this order:

1. Receive a local snapshot path or an S3 object reference.
2. Read the manifest and verify the exact snapshot ID and checksum.
3. Create a `snapshot_import_runs` record.
4. Validate the required files and basic record structure.
5. Load canonical catalog records.
6. Load aliases and relationships after their referenced records exist.
7. Load the supplied content chunks.
8. Generate and store missing embeddings.
9. Compare source and imported counts and check foreign keys.
10. Mark the import successful only after all required checks pass.
11. Leave the previous working data unchanged when the import fails.

The production version will load into staging and activate a validated snapshot
as one operation. The first local implementation may use an empty development
database, but it should still record failures and be safe to run again.

## Required Configuration

Do not hide important experiment settings inside Python constants. Record:

- snapshot ID and checksum;
- worker version;
- chunking version from the snapshot;
- embedding provider, model, dimensions, and normalization;
- vector distance function;
- retrieval `top_k`;
- request timeout and retry policy.

Young, Mio, and Arnav should agree on these settings before comparing RAG
results. The worker should print or save a configuration hash with every run.

## Testing Expectations

### Pull Requests

Use a small fixed fixture and deterministic test embeddings. Pull-request tests
should not depend on a live NRP service.

Test at least:

- valid manifest and checksum;
- rejected invalid checksum;
- correct material/resource relationship;
- rejected missing foreign key;
- chunk loading without accidental rechunking;
- repeat import without duplicate rows;
- failure recorded in `snapshot_import_errors`;
- vector query returning the expected chunk and canonical IDs.

### Manual Or Nightly Test

Use the agreed NRP embedding model on a small documented subset. Record provider
latency and total ingestion time separately from local database time.

## Definition Of Done For The First Demonstration

The first worker milestone is complete when the team can demonstrate:

1. PostgreSQL with `pgvector` starts locally in Docker.
2. The Gateway migrations apply to an empty database.
3. The Python worker imports the approved small Snapshot v3 fixture.
4. Source and imported counts match for the selected records.
5. A second run does not create duplicates.
6. A vector query returns the expected content chunk.
7. The chunk links back to a real content resource and training material using
   the canonical IDs.
8. An invalid snapshot fails clearly without damaging the previous data.
9. The repository contains a short command sequence another team member can
   run without private knowledge.

Do not attempt to ingest the entire snapshot or optimize performance before
this small demonstration works reliably.
