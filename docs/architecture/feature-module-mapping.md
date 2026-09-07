# Shared Feature Boundaries

**Revision: `feature-boundaries-2026-09-04`.** One design for the
[NestJS MD](nestjs-modules.md) / [SVG](assets/nestjs-modules.svg) and
[Next.js MD](https://github.com/sdsc-hpc-training-dev/hpc-learning-hub-frontend/blob/master/docs/architecture/nextjs-modules.md) /
[SVG](https://github.com/sdsc-hpc-training-dev/hpc-learning-hub-frontend/blob/master/docs/architecture/assets/nextjs-modules.svg).
All named folders/classes are proposed; both applications remain starters.

## Same Vocabulary, Different Responsibilities

**Share learner-facing feature names, not identical module trees.** Next.js
routes compose views, components and hooks; NestJS modules group controllers,
services and private repositories. A backend service can serve several pages.
Folders do not finalize HTTP routes, DTOs, tables or deployment boundaries.

| Order / screen                              | Frontend feature under `features/`                                       | Gateway module / service                                                         | Data or supporting responsibility                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **FIRST: View Training Library**            | `training-library/TrainingLibraryView.tsx`, `TrainingLibraryFilters.tsx` | `TrainingLibraryModule` / `TrainingLibraryController` / `TrainingLibraryService` | Imported materials, canonical vocabularies, filters/counts and explicit joins; read-only repository.                                          |
| **FIRST: View Material Detail**             | `training-library/MaterialDetail.tsx`                                    | Same controller/service as Library                                               | Material/resource lookup, `MaterialResource`, resource files and canonical links; same read-only repository.                                  |
| LATER: Learning Paths                       | `learning-paths/`                                                        | `LearningPathsModule` / `LearningPathsService`, reusing `TrainingLibraryService` | Public curated paths and ordered canonical material references; source/IDs/population remain D-12.                                            |
| LATER: Events & Recordings                  | `events/`                                                                | `TrainingLibraryModule` / `TrainingLibraryService`                               | Event editions, series/edition and event/material joins; recordings are resources, not a separate catalog.                                    |
| LATER: Programs & Series                    | `programs/`                                                              | Same Training Library service                                                    | `EventSeries` collections, not a new Programs API/table.                                                                                      |
| LATER: Start Here                           | `start-here/` composed by `app/page.tsx`                                 | Reuse Training Library and Learning Paths reads                                  | Introductory selections/navigation; no StartHereModule or new persistence.                                                                    |
| LATER: Sign in / Create account             | `auth/`                                                                  | `AuthModule` / `AuthService` -> `UsersModule` / `UsersService`                   | Gateway CILogon/session flow, accounts and local roles; maintainer smoke page only.                                                           |
| LATER: My Learning, saved/progress controls | `my-learning/`                                                           | `MyLearningModule` / `MyLearningService`, using Auth and Training Library        | Owner-scoped bookmarks, progress, personal paths/items. No path-visibility feature.                                                           |
| LATER: Ask AIDA and conversation history    | `aida/`                                                                  | `AidaModule` / `AidaService`, using Auth and Training Library                    | Four MVP strategies; imported chunks/embeddings read-only, owned conversation persistence. History stays AIDA even under a My Learning route. |

## What Changed And Why

- **`CatalogModule` / `CatalogService` -> `TrainingLibraryModule` /
  `TrainingLibraryService`.** Names now match the first screen. Imported catalog
  remains a useful data term; the service also supports events, programs, path
  references and AIDA. No separate module per page.
- **`LearningModule` -> `LearningPathsModule` + `MyLearningModule`.** Public
  curated discovery and authenticated personal continuity have distinct data
  and access responsibilities. Personal path editing stays in My Learning;
  no visibility toggle, publication workflow or duplication of path ownership.
- **Frontend `catalog/` -> `training-library/`, `learning-paths/`, `events/`,
  `programs/`; `learning/` -> `my-learning/`; explicit `start-here/`.** These
  are small UI feature folders, not new backend services. Keep both initial
  views together in Training Library.
- **Retain `auth/`, `aida/`, Auth, Users, Database and Observability.** Account
  UI is not an identity provider. AIDA orchestration and backend infrastructure
  retain legitimate internal boundaries. Shared frontend UI and transport stay
  outside features; all migrations stay Gateway-owned.

## Evidence And Limits

Fetched bases: Gateway `07374369f95a4d342647dc1fb428e64ef1a02e63`, frontend
`30c9dbced5adc48248fcef6ae1d4a681015fa2d5`. Design remote `main` remains
[`deaf8e5371dd46fd525c0d668c49e3b50aa0aa46`](https://github.com/sdsc-hpc-training-dev/training-landing-page/tree/deaf8e5371dd46fd525c0d668c49e3b50aa0aa46/v1.0.0):
v1.0.0 navigation, Library and Material views plus
[functional stories](https://github.com/sdsc-hpc-training-dev/training-landing-page/blob/deaf8e5371dd46fd525c0d668c49e3b50aa0aa46/docs/functional-user-stories.md)
and Fernando's September 4 screenshots establish vocabulary and first-view order.
Older live v0.0.6/Snapshot v2 screens are UI reference, **not v3 schema authority**.

[Candidate contracts and open decisions](../contracts/agent-entrypoint.md)
remain authoritative gates, not settled by this publication. Library/Detail
are public relational reads, independent of login, AIDA, vectors and S3 at
request time. Python owns restricted ingestion, not users/conversations or
curated paths. No app/schema/contract changes, submissions, moderation or
GraphRAG/Neo4j. Later means after the two initial views, not a new scope decision.
