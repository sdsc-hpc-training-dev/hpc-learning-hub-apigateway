# Contract Review Dispositions

**Status:** One final local correction pass; candidate decisions remain open.
**Date:** 2026-09-03. **Reviewed contract:**
`2b076a74028a85f14ffb1ff72ac9d4012c33e944`.
**Reviewed companion:** `c6a63676b9cf3dff728037a2d921a3084476afd0`, read through
Git objects without modifying its author worktree. Final local commit is in
the task handoff, avoiding a self-referential hash here.

Review authority for this correction is Portal's requested combined independent
review, not an implementation approval. Report:
`C:/Users/ofgar/.codex/worktrees/gateway-contract-spec-independent-review/independent-review.md`;
SHA-256 `dde5e523e13edcaee1b3c0dd5f156a161abe41efc17f69ac1b45a56c44760060`.
No new reviewer, app/schema change, push, PR or merge was performed.

## Finding Dispositions

| Finding | Disposition and evidence                                                                                                                                        | Change / remaining coordination                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1 (P2) | **Agree.** Reviewed companion IW-023 used scope "when present"; T12 omitted missing/conflicting context, while contract AIDA-03 required valid recording scope. | AIDA-03 acceptance and D-10 explicitly gate separate missing/conflicting/unresolved scope cases and video-to-transcript association. No clarification/abstention/error option is selected; unscoped transcript search is not approved. Companion IW-023/T12/D4 and the affected NestJS annotation need the matching correction by their owners/Portal.                                                                                                                       |
| R2 (P2) | **Agree.** The original contract called its register sole while the specialist D1-D5 gates were unmapped; historical source I was not the new companion.        | Added the [crosswalk and closure rule](../decisions-needed.md#specialist-crosswalk), companion status separate from historical I, and responsibility-specific companion/crosswalk links in the entrypoint. Both applicable registers remain blocking until the same reviewed disposition is recorded in both; partial closure preserves residual gates. D5 explicitly retains archive limits, scratch cleanup and versioned report/config serialization alongside D-05/D-09. |
| O1      | **Agree; adopted.** DATA-01's "Runtime owns those records" included curated paths, although D-12 left population/provenance open.                               | DATA-01 now states Gateway access control and worker exclusion, without deciding curated creation/population or ID provenance. D-12 remains open.                                                                                                                                                                                                                                                                                                                            |
| O2      | **Agree; assigned to Portal, not performed here.** The contract validator does not cover the whole technical spec or combined publication.                      | Added only frozen-companion link resolution and this disposition file to contract-side checks. Portal owns integrated corrected-spec requirement/crosswalk/anchor QA and publication checks. No claim that local checks satisfy O2.                                                                                                                                                                                                                                          |

## Collision Evidence

The independent review's "Collision Verification" section verified the local
ZIP read-only and reproduced the companion's
[retained evidence](../../specs/review/ingestion-worker-technical-handoff.md#collision-evidence).
This author read both reports but did not repeat archive inspection. The
following are reviewer-verified results, replacing the earlier unverified
coordination wording:

| Observation                                                                       | Reviewer-verified value                                            |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Archive SHA-256                                                                   | `82b16349c93b88ad31fa8d08d76b2ba2a470c0e327151a6bd695b51967cc6945` |
| Manifest SHA-256                                                                  | `932f3d83d382b5d74d1062d06b31694f8eeb5fff872ad330a7638377f29a43b2` |
| Chunk-member SHA-256                                                              | `7e41c25406ac0803af33580342217b7a32621108639b681fe61106939b79644c` |
| Parsed chunk rows / duplicate canonical ID groups                                 | 2291 / 0                                                           |
| Repeated `(content_resource_id, chunk_index, chunking_version, text_hash)` groups | 96                                                                 |
| Rows in those groups / rows lost by retaining one per tuple                       | 212 / 116                                                          |

The review also verified representative material/event relationships: these are
distinct context-bearing canonical chunks, not duplicate IDs to discard.
D-05 / companion D1 remains an implementation blocker, including the small
shared-resource demonstration. Neither a replacement key nor deduplication is
approved. The source manifest's dirty build provenance remains disclosed in
the companion; later builder code is not proof of a clean build of these bytes.

## Final Validation Boundary

Crosslinks target intended combined relative paths. The historical guide at
`docs/specs/ingestion-worker.md` still exists in this isolated worktree; it does
not supply the technical companion's decision anchor. The companion handoff
is absent locally. Contract validation therefore uses the exact reviewed
companion Git objects via `--companion-revision`, not mutable author files or
GitHub links to local-only commits. Final corrected companion/architecture
wording and integrated links remain Portal's check. Execution results are
recorded in the [revision handoff](contract-revision-handoff.md#validation).
