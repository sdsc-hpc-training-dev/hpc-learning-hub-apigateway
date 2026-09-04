# Independent Gateway Contract And Ingestion Review

## Verdict

**needs-correction**

Two required findings (both P2), two optional suggestions. This is one fresh independent combined review of the frozen documents, not implementation approval. The required corrections are a contradictory transcript-scope rule and an incomplete combined decision/authority handoff. Neither requires redesigning the system or settling the underlying product decisions before candidate publication.

The verified chunk-key conflict is an implementation blocker already explicitly gated by both candidates, not an additional publication-blocking finding. Do not deduplicate valid canonical IDs, silently revise the persistence diagram, or interpret publication as approval of a replacement key.

Preflight: approved Sol/high, expected usage Moderate; handbook read. Source/author trees remained read-only. Only this report and its documentation QA script were written in the assigned output directory. No further reviewer or agent was used.

## Required Findings

### R1 - P2: Transcript scope is mandatory in the contract but optional in the spec

**Owner:** Einstein spec; coordinator integration for the impacted architecture annotation. Lorentz contract owns the corresponding D-10 disposition.

**Exact references:** [ingestion-worker.md:145](<C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway-technical-ingestion-spec/docs/specs/ingestion-worker.md:145>) (IW-023), line 212 (T12), and line 243 (D4); [system-contracts-v0.2-candidate.md:706](<C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway-agent-ready-contracts/docs/contracts/system-contracts-v0.2-candidate.md:706>), lines 709-722 (AIDA-03); [decisions-needed.md:220](<C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway-agent-ready-contracts/docs/contracts/decisions-needed.md:220>) (D-10).

**Evidence:** IW-023 requires transcript kind but adds material/resource scope only "when present." AIDA-03 requires the selected recording's canonical scope together with transcript kind and active snapshot, explicitly forbids wider searching when context is missing/conflicting/unresolved, and requires a controlled missing-context result. Spec D4 gates the general allowlist and curated paths, not this transcript discrepancy. T12 exercises supplied recording scope but does not specify the missing/conflicting-context negative case. The original v0.1 section 7.3 and router verdict's Recommended MVP Architecture establish context precedence; they do not resolve the two candidates' different missing-context behavior.

**Impact:** An implementer following the ingestion smoke-test contract can accept a source-kind-only search over all transcripts, while Gateway acceptance rejects that behavior. A query classified as transcript with no usable recording context can pass the spec test and return another recording's evidence. This is a documentation consistency defect, not a claim that such runtime code exists.

**Bounded fix:** Make IW-023 and T12 explicitly stop/gate missing, conflicting, or unresolved recording scope under the shared D-10 decision. Require the approved controlled outcome without inventing whether it is clarification, abstention, or an error. Keep source-kind and snapshot/configuration filtering independently required. Identify video-to-transcript association as part of that gate. If optional unscoped transcript search is intentionally desired instead, report it as a named unresolved conflict in both documents; do not silently choose it. Add an integration note for the same "when supplied" wording at [nestjs-modules.md:217](<C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway-nestjs-architecture/docs/architecture/nestjs-modules.md:217>); no module graph redesign is needed.

**Publication gate:** Correct or explicitly block the conflicting wording before combined candidate publication. The exact fallback policy may remain unresolved afterward.

### R2 - P2: The combined package claims one decision register while supplying two unmapped registers

**Owner:** Coordinator integration, with Lorentz contract and Einstein spec supplying their cross-references.

**Exact references:** [system-contracts-v0.2-candidate.md:828](<C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway-agent-ready-contracts/docs/contracts/system-contracts-v0.2-candidate.md:828>), lines 27-36 (historical I source); [agent-entrypoint.md:10](<C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway-agent-ready-contracts/docs/contracts/agent-entrypoint.md:10>) through line 16 and lines 26-32; [ingestion-worker.md:13](<C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway-technical-ingestion-spec/docs/specs/ingestion-worker.md:13>), line 19, and lines 234-244.

**Evidence:** The contract calls `decisions-needed.md` the "sole decision register"; the responsibility entrypoint names only D-01 through D-12. The technical spec independently gates capabilities on D1-D5, with no crosswalk or link to the contract register. These identifiers are not interchangeable: spec D3 is embedding compatibility, while contract D-03 is guest AIDA; spec D4 spans general retrieval and curated paths, while contract D-04 is identity/security. Contract source I is explicitly the original baseline guide, not the reviewed technical candidate. That historical pin is valid, but the combined handoff never identifies the new spec's companion status or how its gates participate in the supposedly sole register.

**Impact:** A migration/ingestion implementer using the selective entrypoint can miss a spec-only gate, or a coordinator can close one register while the corresponding capability remains blocked in the other. In particular, spec D5 also gates archive limits, scratch cleanup, and report/config serialization, beyond the contract's production embedding limits. A successful local-link validator does not establish integrated decision coverage.

**Bounded fix:** Add one explicit combined-publication crosswalk and precedence note. Either make spec D1-D5 named subordinate decisions in the central register or describe linked specialist registers instead of claiming exclusivity. At minimum map spec D1 to contract D-05, D2 to D-01/D-05, D3 to D-09 plus D-05 storage, D4 to D-10/D-12, and D5 to the relevant D-05/D-09 concerns plus its remaining archive/report gates. Preserve all unresolved statuses and name how closure propagates. Identify the frozen technical candidate separately from historical source I, and link it plus its mapped decisions from the importer entrypoint rows. No decision needs to be approved simply to add this integration information.

**Publication gate:** The central-versus-specialist authority and gate mapping must be unambiguous before the package is handed to implementation agents.

## Optional Suggestions

### O1 - Clarify curated-path population versus Gateway control

**Owner:** Lorentz contract. [system-contracts-v0.2-candidate.md:326](<C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway-agent-ready-contracts/docs/contracts/system-contracts-v0.2-candidate.md:326>) through line 330 groups curated paths into "Runtime owns those records." D-12 already correctly says population source/owner/IDs remain unsettled, and spec lines 105 and 243 explicitly avoid assuming runtime creation. Clarify that the statement preserves Gateway control and excludes importer access, without deciding curated content creation/provenance. This is not an additional blocker because D-12 already supplies the qualification.

### O2 - Retain a combined-document QA target

**Owner:** Coordinator integration. [validate-contract-docs.cjs:6](<C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway-agent-ready-contracts/docs/contracts/review/validate-contract-docs.cjs:6>) through line 11 lists only contract-side documents. Its declared scope is honest and its checks pass. Consider a small additional documentation check covering the technical spec's requirement inventory, local links, and the new decision crosswalk. The review's [verify-frozen-docs.cjs](C:/Users/ofgar/.codex/worktrees/gateway-contract-spec-independent-review/verify-frozen-docs.cjs) demonstrates frozen-object checks without touching author worktrees. No app/CI change is required by this suggestion.

## Collision Verification

Independently verified from the supplied local ZIP, opened read-only without extraction. Retained JSON at [ingestion-worker-technical-handoff.md:22](<C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway-technical-ingestion-spec/docs/specs/review/ingestion-worker-technical-handoff.md:22>) through line 74 was treated as factual evidence to check, not an author verdict.

| Item                                                 | Verified result                                                            |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| Archive SHA-256                                      | `82b16349c93b88ad31fa8d08d76b2ba2a470c0e327151a6bd695b51967cc6945`         |
| `snapshot-v3/snapshot.json` SHA-256                  | `932f3d83d382b5d74d1062d06b31694f8eeb5fff872ad330a7638377f29a43b2`         |
| `snapshot-v3/aida/chunks.jsonl` SHA-256              | `7e41c25406ac0803af33580342217b7a32621108639b681fe61106939b79644c`         |
| Parsed chunk records / duplicate canonical ID groups | 2,291 / 0                                                                  |
| Repeated four-field tuple groups                     | 96                                                                         |
| Rows within those groups                             | 212                                                                        |
| Rows lost if retaining only one row per tuple        | 116                                                                        |
| Kind counts                                          | 533 catalog metadata; 444 repository session; 153 slides; 1,161 transcript |

Grouping was exactly `(content_resource_id, chunk_index, chunking_version, text_hash)`. Representative index-zero rows are `70000317` -> material `20000041`, event `10000041`, and `70000491` -> material `20000066`, event `10000066`. Both use resource `30000158`, version `word-window-v2`, and hash `b2fa1e6921f30602aaaef7f8b8ecce265a35ba59a0d8aca1d15b9c59993766f2`. The retained index-one pair `70000318`/`70000492` and its hash also match.

Targeted relationship verification found `HAS_RESOURCE` rows `60000557` and `60000884` connecting those two materials to the shared resource, and `HAS_MATERIAL` rows `60000553` and `60000880` connecting the respective events/materials. These are distinct context-bearing canonical chunk records, not duplicate IDs to discard.

The incompatible target is [persistence diagram:723](<C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway/docs/sdsc-learning-hub-persistence-class-diagram.md:723>) at baseline. The later pinned builder's `chunks_for_resource` at [catalog_snapshot.py:1234](C:/Users/ofgar/Projects/GithubProjects/intVid/intvid-backend/processing/catalog_snapshot.py:1234) through line 1240 includes event/material in identity construction, supporting the context distinction. Builder evidence is not a claim that it cleanly produced the reviewed ZIP: the actual manifest records code `ccbdbe4b6a44ca7d16cc04b16ec0d2db73f5361e` and `code_state.dirty = true`.

Contract DATA-06/D-05 and spec D1/T07 correctly stop incompatible constraint/full-import work while preserving all IDs. Selecting a new key, deleting rows, or changing the diagram remains an engineering/model-owner decision. The small fixture also includes the shared-resource case, so its migration compatibility must be resolved before that DB demonstration can pass.

## Decisions Still Unresolved

The table distinguishes publication correctness from implementation readiness. R1/R2 must first make the gates consistent; the choices below can then remain open in published candidate documents.

| Decision area                                                                                                                                                              | Implementation blocked                                                                             | Blocks candidate publication by itself?                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Contract D-01; spec D2: enum encoding/readiness, activation actor, coherent snapshot visibility                                                                            | Activation/replacement; M1 still needs explicit attempt/validation semantics                       | No                                                            |
| Contract D-05; spec D1: migrations, physical mapping/nulls/grants, chunk collision, durable pre-manifest failures/local provenance, embedding metadata                     | Relevant DB integration; preservation-compatible shared-resource test/full import                  | No; collision is already explicit                             |
| Contract D-02: operation-level DTOs, pagination/errors, request IDs/replay/concurrency                                                                                     | Affected HTTP integration and final OpenAPI                                                        | No                                                            |
| Contract D-03: guest AIDA availability/persistence boundary                                                                                                                | Advertising/enabling the undecided guest capability                                                | No                                                            |
| Contract D-04: identity/email collisions, sessions/CSRF, role matrix/provisioning                                                                                          | Those auth/security implementations                                                                | No                                                            |
| Contract D-06/D-07: retention/support access, deletion, response delivery/turn transactions                                                                                | Those history and delivery behaviors                                                               | No                                                            |
| Contract D-08: classifier artifact, reconciled results, parity and quality promotion                                                                                       | Production router promotion                                                                        | No                                                            |
| Contract D-09; spec D3/D5: semantic model/revision/input/hash/dimension/normalization compatibility, index/storage/distance, drift/reuse and measured operational settings | Real generation/lookup and affected archive/report operations; synthetic settings must be explicit | No                                                            |
| Contract D-10; spec D4: general allowlist, transcript context/association, evidence thresholds/fallback/coverage gaps                                                      | Unsettled retrieval/fallback policy                                                                | No after R1 explicitly reconciles or gates the scope conflict |
| Contract D-11/D-12; spec D4: resource/citation missing links, curated source/IDs/publication                                                                               | Affected serialization and curated publication/seeding                                             | No                                                            |

Stable-ID retention, candidate isolation with global canonical IDs, failed-active-rerun behavior, uncertain commit recovery, and no personal-data access remain required safety constraints, not permission to invent a replacement lifecycle. Spec M2 describes obligations if replacement is later authorized, not a mandate for automatic snapshot management.

## NestJS Boundary Impacts Only

No fresh review of the unchanged module graph was performed. The new documents preserve the existing feature ownership, one PostgreSQL/pgvector database, external restricted Python importer, Gateway migrations, and read-only runtime retrieval. No additional module, deployment, generic relationship table, GraphRAG/Neo4j store, or submission workflow is implied.

For combined publication, annotate the affected behavior statements rather than treating the earlier independent review as approval of newly gated product policy: [nestjs-modules.md:86](<C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway-nestjs-architecture/docs/architecture/nestjs-modules.md:86>) assumes public one-turn AIDA (now D-03); line 216 lists the general set (D-10/spec D4); line 217 has optional supplied transcript scope (R1); line 197's Gateway-side curated concern does not settle initial content/source/IDs (D-12). Line 204's instruction to retain constraints must be read subject to the newly evidenced chunk-constraint gate. These are integration annotations, not new findings against the graph or requests for another architecture review.

## Verification Actually Performed

### Frozen Versions

All source contents used for document/code judgments were read with `git show <commit>:<path>`, not mutable checkout contents. Local file links above identify paths/line locations; the following revisions define the reviewed text even if a checkout later moves.

| Source                                               | Revision                                   |
| ---------------------------------------------------- | ------------------------------------------ |
| Original Gateway baseline                            | `fda21d619dcc5119f1133501bafa8cc7e800c7cf` |
| Contract additions and validator                     | `2b076a74028a85f14ffb1ff72ac9d4012c33e944` |
| Technical ingestion spec and retained collision JSON | `c6a63676b9cf3dff728037a2d921a3084476afd0` |
| Previously reviewed NestJS boundaries, impacts only  | `b8fe21ca4c33cb1c2ccb40ea6efad24fdac72efc` |
| Targeted backend schemas/manifest/builder            | `5b9085d8717e31ffbb06e5621992ff05a14fbe89` |

The original persistence diagram, v0.1 contract, implementation brief, router verdict, original ingestion guide, September 2 meeting-plan section, package metadata, tracked `src/` inventory and starter source/tests were read. The meeting entry is a plan with decisions to confirm, not evidence of later approval. The baseline has `GET /` -> `Hello World!`, empty feature imports, no DB/ORM dependency or migration command, and only starter tests. No migration-backed behavior or exhaustive OpenAPI was inferred.

Targeted backend reads: `schemas/canonical-entity-v3.schema.json`, `schemas/canonical-relationship-v3.schema.json`, `schemas/citation-chunk-v3.schema.json`, `benchmarks/aida-mvp-v2/benchmark_manifest.json`, relevant portions of `docs/catalog-snapshot-v3.md` and `processing/catalog_snapshot.py` (`text_hash`, relationship construction/direction, chunk identity/fields, AIDA projection/embedding manifest). No unrelated history, held-out answers, full raw corpus, or router repository/model was reviewed.

### Commands And Results

- `git rev-parse <revision>^{commit}` resolved all five frozen commits.
- `git show <revision>:<path>` supplied source contents; `git ls-tree -r --name-only <baseline> -- src package.json migrations prisma test` and `package.json` confirmed starter-only status.
- `git diff --check <baseline> <contract-or-spec-freeze> -- docs` passed for both freezes. Exact v0.1 content was unchanged in both author freezes.
- `node C:/Users/ofgar/.codex/worktrees/gateway-contract-spec-independent-review/verify-frozen-docs.cjs` passed. The frozen author validator ran in a read-only Git-object filesystem adapter, first for its original tree and then with the frozen spec overlaid: each run reported 4 documents, 22 requirements, 12 decisions, 5 parsed JSON examples, and 40 local links/anchors. Additional checks passed for the spec's 32 unique requirements, coverage by acceptance-matrix references, 5 distinct local link targets, and retained collision JSON parsing.
- Tool versions: Node `v20.18.3`, Git `2.48.1.windows.1`. These pure documentation checks did not use the application's pinned Node `22.23.2` / npm `10.9.8` environment and are not an application build/test result.
- `Get-FileHash -LiteralPath 'C:/Users/ofgar/Downloads/snapshot-v3 (2).zip' -Algorithm SHA256`, .NET `ZipFile.OpenRead`, and SHA-256 over the manifest/chunk member streams established the hashes above. Structured `ConvertFrom-Json` parsing plus `Group-Object content_resource_id,chunk_index,chunking_version,text_hash` and `Count -gt 1` reproduced the collision count. Separate case-sensitive ID grouping found zero duplicate ID groups. Only IDs/metadata/counts were retained/displayed, not chunk text.
- Read the actual manifest's identity/provenance/counts and embedding manifest's `not-generated`, null dimensions, and 1,200-word/100-word-overlap `word-window-v2` declarations. Parsed relationship types/counts confirmed 4,379 relationships across the seven mapped types and no `PREREQUISITE_OF`, `SUPERSEDED_BY`, or `RELATED_TO` in this fixture; selected shared-resource joins matched the examples.
- One supplemental PowerShell command initially failed syntax parsing before running and was corrected. The added QA script initially mistook inline `file_hashes[path]` code for a Markdown reference; excluding inline code corrected that reviewer-side false positive. Both corrected checks passed; neither was counted as a source defect.

### Limits And Non-Actions

This was documentation/source QA only. No PostgreSQL instance, migration, importer, app suite, container, cloud/S3 call, embedding/generation service, classifier parity/training/quality evaluation, or live model test ran. No upstream test suite, full corpus audit, remote URL reachability check, rendered-document review, or exhaustive DTO validation is claimed. Only archive/manifest/chunk-member hashes were independently recomputed; the author's broader 16-member checksum claim was not independently repeated. Entity counts beyond the parsed chunk/relationship counts were read from the verified manifest, not independently recounted from all entity rows.

No source/author files, app/CI/migrations, database, or Git state were changed. No commit, push, PR, merge, or publication was performed. The author's self-review and the earlier architecture review were not adopted as this review's verdict.
