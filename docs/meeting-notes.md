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

**Architecture follow-up:** [Proposed NestJS module diagram and folder layout](architecture/nestjs-modules.md)
(documentation proposal for review, not an implementation claim).

**Documents to use:** [persistence class diagram](sdsc-learning-hub-persistence-class-diagram.md),
[system contracts v0.1](system-contracts-v0.1.md), and the
[Gateway repository README](../README.md).

- Finish the Gateway quality gates: formatting, linting, type checking, tests,
  coverage, build, dependency scanning, and migration validation.
- Check that the GitFlow workflows and protected branch rules work as
  documented.
- Finish the NestJS package diagram. It should show the main modules,
  controllers, services, database code, and external services.
- Begin the database implementation using the approved class diagram and
  contracts.
- Create the first PostgreSQL/pgvector migrations so Mio and Arnav can use the
  same tables in their ingestion tests.
- Start with one small example that works from beginning to end: store a
  training material in PostgreSQL and retrieve it through the Gateway. Use that
  example as the pattern for the remaining database work.

### Shing and Keyura: Frontend

**Documents to use:** [frontend repository](https://github.com/sdsc-hpc-training-dev/hpc-learning-hub-frontend),
[functional user stories](https://github.com/sdsc-hpc-training-dev/training-landing-page/blob/main/docs/functional-user-stories.md),
[user personas](https://github.com/sdsc-hpc-training-dev/training-landing-page/blob/main/docs/user-personas.md),
and [architectural stories and quality scenarios](https://github.com/sdsc-hpc-training-dev/training-landing-page/blob/main/docs/architectural-user-stories-and-quality-scenarios.md).

- Agree on how the frontend work will be divided and identify pages or
  components that they will need to coordinate on.
- Confirm whether they can manage that split or need help making the
  responsibilities clearer.
- Review the Next.js structure, current design, and plan for connecting to the
  Gateway.
- Check the frontend pipeline: linting, type checking, tests, production build,
  and branch protection.
- Add or verify accessibility checks using `eslint-plugin-jsx-a11y`, Playwright,
  and `axe`.
- Complete one learner task from beginning to end instead of building several
  disconnected screens.

### Mio and Arnav: Router and Ingestion Worker

**Documents to use:** [AIDA router verdict](aida-router-architecture-verdict.md),
[system contracts v0.1](system-contracts-v0.1.md),
[persistence class diagram](sdsc-learning-hub-persistence-class-diagram.md),
[ingestion worker specification](specs/ingestion-worker.md),
[AIDA V2 benchmark](https://github.com/sdsc-hpc-training-dev/intvid-backend/tree/codex/aida-mvp-benchmark-v2/benchmarks/aida-mvp-v2),
and the [current Python router](https://github.com/sdsc-llm-dev/aida-router).

- Continue working on the four router choices: Catalog/API, General RAG,
  Transcript RAG, and Abstention.
- Mio will continue training and evaluating the router in Python and save the
  trained model in a versioned file that another application can read.
- Arnav will test whether NestJS can read that file and make the same routing
  choices as Python.
- Begin the Python ingestion worker after the basic router input and output are
  agreed upon.
- They do not need to wait for the entire Gateway implementation. They can run
  PostgreSQL with `pgvector` locally in Docker and test loading a small part of
  Snapshot v3.
- Use the approved class diagram and contracts for the test database. Once
  Srujam's official migrations are ready, use those migrations instead of
  maintaining separate tables.
- Compare the RAG and Transcript RAG settings with Young. Everyone must use the
  same snapshot, chunks, embedding model, retrieval settings, and generation
  model before comparing results.

### Young: Snapshot Pipeline

**Documents to use:** [pipeline and latency review](young-data-ingestion-and-rag-automation-review.md),
[snapshot ingestion contract](system-contracts-v0.1.md#6-snapshot-ingestion-contract),
[AIDA V2 benchmark](https://github.com/sdsc-hpc-training-dev/intvid-backend/tree/codex/aida-mvp-benchmark-v2/benchmarks/aida-mvp-v2),
and the [intvid-backend repository](https://github.com/sdsc-hpc-training-dev/intvid-backend).

- Measure how much time is spent creating the query embedding, retrieving
  content, waiting for the first response token, generating the answer, and
  retrying failed requests. This should help explain the 40-second responses.
- Compare the RAG configuration directly with Mio and Arnav and document one
  shared configuration for future tests.
- Show how the raw data is currently collected and identify the manual steps,
  people, credentials, and permissions involved.
- Raw-data automation is important but not urgent. First make the existing
  benchmark understandable and repeatable.
- Keep the quick pull-request test separate from the slower test that more
  closely matches the real system.

### Architecture Decisions To Confirm

- PostgreSQL and `pgvector` are one database component.
- Snapshot files stay in S3. The ingestion worker loads the catalog and AIDA
  data into PostgreSQL.
- The website and normal Gateway requests read from PostgreSQL, not S3.
- The class diagram's specific relationship tables are the ones we will use.
  Do not create a second generic relationship table.
- Python is used to train and evaluate the router. NestJS is the preferred
  place to run the trained router when users ask questions.
- Do not use a shared external vector database for pull-request tests.
- Material submission, shared learning paths, GraphRAG, and Neo4j are not part
  of the first implementation.

### Deliverables For The Next Meeting

- **Srujam:** working Gateway checks, the package diagram, the first migrations,
  and one small database example.
- **Shing and Keyura:** their division of work, working frontend checks,
  accessibility results, and one complete learner task.
- **Mio and Arnav:** router progress, a small Snapshot v3 ingestion test using
  PostgreSQL/pgvector, and a shared list of RAG settings.
- **Young:** a report showing where the RAG test time is spent, the shared RAG
  settings, and a walkthrough of how raw data is collected.

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
