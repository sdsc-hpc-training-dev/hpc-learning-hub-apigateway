# HPC Learning Hub Meeting Notes

This file is the shared, repository-backed record of Learning Hub meetings.
Entries are kept in **reverse chronological order**: add each new meeting
directly above the previous meeting. Use the full weekday and date.

Historical entries below were normalized from the working Google Doc. Repeated
instructions were shortened, but the decisions, assignments, and useful links
were retained. Personal contact information is intentionally excluded.

## Wednesday, September 2, 2026

**Status:** Meeting plan. Update this entry after the meeting using the
transcript and actual decisions.

### Purpose

Align the Portal, Gateway, AIDA, and data-pipeline work around one persistence
model and one set of contracts. Confirm ownership and agree on a small
end-to-end demonstration for the following meeting.

### Srujam: API Gateway

- Finish the Gateway quality gates: formatting, linting, type checking, tests,
  coverage, build, dependency scanning, and migration validation.
- Review whether the GitFlow workflows and protected branch rules behave as
  documented.
- Finish the NestJS package/module diagram. It should show modules,
  controllers, services, persistence adapters, and external integrations.
- Begin the persistence implementation using the approved class diagram and
  contracts.
- Prioritize the initial PostgreSQL/pgvector migrations because the ingestion
  worker depends on them.
- Implement one working catalog vertical slice before creating every planned
  entity and repository.

### Shing and Keyura: Frontend

- Explain how the frontend work is divided and identify shared components or
  routes that require coordination.
- Confirm whether they can manage the split independently or need a narrower
  assignment.
- Review the Next.js architecture, current design, and API integration plan.
- Inspect the frontend quality pipeline: linting, type checking, tests, build,
  and branch protection.
- Add or verify accessibility checks using `eslint-plugin-jsx-a11y`, Playwright,
  and `axe`.
- Demonstrate one complete learner journey rather than several disconnected
  screens.

### Mio and Arnav: Router and Ingestion Worker

- First, ask Arnav how long he expects to remain on the project. Assign critical
  ownership with that date in mind.
- Freeze the four AIDA routes: `catalog_api`, `general_rag`,
  `transcript_rag`, and `abstain`.
- Mio owns Python-based router training and evaluation and exports a versioned,
  language-neutral classifier artifact.
- Arnav implements the NestJS runtime inference module and parity tests.
- Python does not need to remain a production service if NestJS can reproduce
  the same predictions from the exported logistic-regression artifact.
- Run cached benchmark embeddings through Python and NestJS and require
  matching route decisions.
- After the router contract is stable, begin the Python ingestion worker.
- Run PostgreSQL with `pgvector` locally using Docker and apply the
  Gateway-owned migrations. Do not create a competing private schema.
- Load Snapshot v3 catalog metadata, supplied chunks, and generated embeddings;
  validate record counts and foreign keys.

### Young: Snapshot Pipeline

- Add detailed latency measurements for query embedding, local retrieval,
  first token, generation, retries, and total request time.
- Compare his RAG configuration directly with Mio and Arnav's configuration.
- Standardize the snapshot ID/checksum, source filters, chunking version,
  embedding model, dimensions, normalization, similarity metric, `top_k`,
  generation model, prompt version, timeouts, and retries.
- Walk Fernando through how raw data is currently obtained and identify manual
  steps, data owners, credentials, and permissions.
- Treat raw-data acquisition automation as important but not urgent. First make
  the current benchmark measurable and reproducible.
- Keep the fast pull-request smoke test separate from slower nightly or manual
  production-parity tests.

### Architecture Decisions To Confirm

- PostgreSQL and `pgvector` are one database component.
- Snapshot archives remain immutable in S3.
- The ingestion worker reads the snapshot and writes the serving catalog,
  chunks, and embeddings using the Gateway-owned migrations.
- The normal API and frontend do not read S3 during user requests.
- Explicit relationship join tables are authoritative; do not also implement a
  generic polymorphic relationship table.
- Python remains the offline router training/evaluation environment. NestJS is
  the preferred production inference runtime.
- Do not introduce a shared external vector database into pull-request tests.
- Material submission, shared learning paths, GraphRAG, and Neo4j remain outside
  the first MVP implementation.

### Deliverables For The Next Meeting

- **Srujam:** green Gateway quality gates, reviewed package diagram, initial
  migrations, and one functioning persistence slice.
- **Shing and Keyura:** documented work split, green frontend pipeline,
  accessibility scan results, and one complete learner journey.
- **Mio and Arnav:** router artifact contract, Python/NestJS parity result,
  shared retrieval configuration, and a local ingestion-worker demonstration.
- **Young:** stage-level latency report, comparison against the shared retrieval
  configuration, and a raw-data acquisition walkthrough.
- **Team demonstration:** load Snapshot v3 into local PostgreSQL/pgvector,
  return one catalog material through the Gateway, and retrieve evidence for
  one General RAG and one Transcript RAG question.

### Reference Documents

- [Implementation brief](intern-implementation-brief.md)
- [System contracts v0.1](system-contracts-v0.1.md)
- [Persistence class diagram](sdsc-learning-hub-persistence-class-diagram.md)
- [AIDA router verdict](aida-router-architecture-verdict.md)
- [Young pipeline and latency review](young-data-ingestion-and-rag-automation-review.md)

## Friday, August 28, 2026

### Portal and Gateway

- Review quality pipelines, GitHub Actions, GitFlow, and branch management.
- Incorporate the final small design changes from Avery's report.
- Start the accessible implementation in `v1.0.0` from the latest approved
  prototype.
- Use `eslint-plugin-jsx-a11y`, Playwright with `axe`, and Siteimprove for
  accessibility evaluation.
- Review the persistence class relationships and the identified domains.
- Create package/module diagrams for both the NestJS Gateway and Next.js
  frontend.
- Confirm whether the interview work is complete before the next meeting.

### AIDA and Data

- Demonstrate the existing AIDA client, chunking, embeddings, retrieval, and
  reported metrics.
- Clarify whether the prototype is one application or several components and
  whether it uses PostgreSQL or a vector database.
- Review the General RAG and Transcript RAG pipelines.
- Plan an ingestion worker owned jointly by Mio and Arnav.
- Preserve raw-data acquisition automation and RAG tuning as future work.

## Thursday, July 16, 2026

### UI Action Plan

- Review the [first-time-user interview findings](https://github.com/sdsc-hpc-training-dev/training-landing-page/tree/main/docs/ux-testing/2026-07-16-first-time-user-landing-page),
  including the findings and action items.
- Review the [functional user stories](https://github.com/sdsc-hpc-training-dev/training-landing-page/blob/main/docs/functional-user-stories.md),
  happy paths, personas, and [SDSC brand guidance](https://www.sdsc.edu/about/brand.html).
- Explore the available snapshot and include its actual data in the prototype
  when available.
- Prepare an implementation plan covering the landing page, user workflows,
  SDSC styling, and mocked AIDA interactions before writing code.
- Implement the reviewed plan as a runnable prototype. AI-assisted development
  is encouraged, but its design and code must be reviewed by the team.

## Wednesday, July 15, 2026

### Young: Backend Repository and Canonical Pipeline

- Clean the `intvid-backend` repository and establish the agreed GitFlow branch
  model.
- Consolidate useful work into the long-lived branches, remove obsolete feature
  branches, and create a verified release tag.
- Build `feature/canonical-content-pipeline-v2` from `develop`.
- Produce one canonical dataset for materials, resources, topics, tools,
  systems, events, relationships, URLs, and provenance.
- Preserve stable identifiers across portal, AIDA, Neo4j, and GraphRAG
  projections.
- Validate the improved pipeline on a representative fixture before producing a
  full snapshot.
- Generate a 120-question candidate benchmark with source-grounded gold answers
  and evidence. Retrieval-system answers must never become gold answers.

### Mio and Arnav: Graph Experiments

- Mio: build the next Microsoft GraphRAG index from the canonical snapshot and
  run the existing 26-question benchmark.
- Arnav: import the same graph into Neo4j and run a comparable benchmark.
- Record model and configuration versions, indexing time, entity and
  relationship counts, failures, duplicates, answer quality, median latency,
  p95 latency, and maximum latency.
- Preserve canonical IDs and provenance in both projections.

### UI

- Use grayscale prototypes before the next Avery review so that visual color
  preferences do not distract from structure and interaction.
- Wait for the improved snapshot before designing the complete data-backed
  workflows.

## Wednesday, July 8, 2026

### UX Team

- Review the canonical content inventory produced by the backend team.
- Create `v0.0.3` from `v0.0.2`.
- Organize the prototype around: Learn, Library, Events, Series, Ask AIDA, and
  Sign In.
- Include sections for starting a learning path, exploring the library, finding
  events and recordings, browsing programs, asking AIDA, and a simple training
  submission call to action.
- Deliver a working prototype, design rationale, assumptions, open questions,
  and mapping between page sections and personas.

### Backend UI Projection

- Create a modular frontend exporter without breaking existing outputs.
- Generate realistic UI data for materials, series, learning paths, and data
  quality reporting from the normalized pipeline inputs.
- Define and document input/output schemas, tests, assumptions, and risks before
  implementation.

### Mio and Arnav: Repository Quality

- Consolidate each repository into a verified baseline release.
- Establish feature, development, release, and main branch workflows.
- Add Python quality gates for Ruff, pytest coverage, mypy, Semgrep, dependency
  audit, Bandit, and duplication checks.

## Wednesday, July 1, 2026

### UX Prototype

- Preserve `v0.0.0` and `v0.0.1`; create `v0.0.2` for the next iteration.
- Extend the logged-out landing page so navigation leads to meaningful sections
  on the same page.
- Keep Ask AIDA and Sign In visible.
- Use warm, clear copy and restrained motion to make the prototype feel like a
  modern learning product rather than an institutional directory.
- Define five user personas and associate the documented happy paths with them.
- Store persona documentation and the presentation in the repository and team
  drive.
- Maintain a date-stamped, append-only context handoff without sensitive data.

### Data Pipeline

- Create and release a stable refactored pipeline baseline.
- Produce a comprehensive Canonical Content Inventory covering content types,
  sources, duplication, reliability, missing fields, classification, and
  frontend recommendations.
- Store the report and a date-stamped context handoff in the backend repository.

## Wednesday, June 24, 2026

### Initial UX and Delivery Practices

- Document at least 20 learner happy paths and begin the user-journey map.
- Include bookmarking, signing up, asking AIDA, and finding relevant materials.
- Confirm the repository baseline, release, and context diagram.

### GitFlow and CI

- Use short-lived `feature/*` branches, `develop`, and `main`.
- Require quality gates before feature-to-development and
  development-to-main merges.
- Use direct hotfix branches from `main` only for urgent corrections.
- Keep `develop` synchronized after updates to `main`.
- Proposed Python gates included Ruff, pytest coverage, mypy, Semgrep,
  dependency audit, Bandit, and duplication checks.

## Entry Template

Copy this section to the top of the file after the introduction for each new
meeting.

```markdown
## Weekday, Month Day, Year

**Status:** Planned | Completed

### Purpose

- Why we are meeting.

### Updates

- What was demonstrated or completed.

### Decisions

- Decisions made during the meeting.

### Assignments Before The Next Meeting

- **Owner:** Concrete deliverable and acceptance condition.

### Open Questions And Risks

- Items requiring follow-up.

### References

- Pull requests, reports, diagrams, transcripts, and recordings.
```
