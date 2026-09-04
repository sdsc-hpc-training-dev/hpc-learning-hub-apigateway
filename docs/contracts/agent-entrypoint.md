# Implementation Agent Entrypoint

Use [v0.2 candidate](system-contracts-v0.2-candidate.md) as a reviewable technical
specification, not a claim of approval or implemented features. The unchanged
[v0.1 baseline](../system-contracts-v0.1.md) remains the baseline. First read the
candidate's Reading Rules, Pinned Sources, Implementation Inventory and SH-01
through SH-04. Load only the responsibility sections below plus their cited
source sections and linked decisions.

| Responsibility                            | Requirements to load                               | Decision gates                    |
| ----------------------------------------- | -------------------------------------------------- | --------------------------------- |
| Gateway HTTP / Next.js                    | HTTP-01 through HTTP-05; AIDA-01/02 for AIDA views | D-02/03/04/07/11/12               |
| Gateway migrations / auth / personal data | HTTP-03/04; DATA-01/05/06; AIDA-01/05              | D-01/02/04/05/06/07/12            |
| Catalog importer                          | DATA-01 through DATA-03, DATA-05 through DATA-07   | D-01/05; D-11 for published links |
| Chunk / embedding ingestion               | DATA-01/02, DATA-04 through DATA-07; AIDA-03/04    | D-01/05/09/10                     |
| AIDA runtime / offline artifact           | AIDA-01 through AIDA-06; DATA-04/06                | D-02/03/06/07/08/09/10/11         |

Requirements and decisions have stable anchors, for example
[DATA-03](system-contracts-v0.2-candidate.md#DATA-03) and
[D-05](decisions-needed.md#D-05). Name requirement IDs in implementation tests.
Turn each Acceptance paragraph into executable assertions for the affected
boundary, including its negative case. Written acceptance cases are not test
results. Resolve missing wire fields before generating integrated frontend
fixtures or publishing OpenAPI.

Source precedence: fixed current scope first; B for boundary behavior, P for
domain constraints, I/R for specialist contracts. Conflicts go to the decision
register. Code establishes implemented status, not replacement requirements.
Physical schema comes from reviewed Gateway migrations once available. HTTP
types come from reviewed Gateway OpenAPI once available; neither exists at the
pinned starter revision. Do not create a second worker schema or independent
frontend API definitions.

Proceed with source-grounded invariants, supported mappings and deterministic
tests. Stop the affected portion when a decision is open, source data cannot
supply a field, identity/scope is ambiguous, or a proposed change alters shared
ownership. Cite the source and decision ID to the Control Agent for Fernando;
do not silently pick a default or reinterpret an example as approval.

Scope: static Snapshot v3 fixture, one DB/pgvector, restricted Python importer,
Next.js through Gateway, app-assigned roles and maintainer smoke page only.
No submission/moderation, automatic snapshot pipeline, GraphRAG/Neo4j or
production Python router. Classifier production promotion requires parity and
quality gates. No invented budgets, retention, retry limits, pagination defaults
or ORM selection. This documentation handoff itself authorizes no app, CI,
migration, deployment or external-system changes.

Validation instructions and source limitations are in the
[revision handoff](review/contract-revision-handoff.md). Run the local document
validator with `node docs/contracts/review/validate-contract-docs.cjs` from the
candidate worktree. It checks the documents, not application behavior.
