# Contract Revision Handoff

**Status:** Local candidate, pending Fernando's review. Baseline unchanged.
**Date:** 2026-09-03. **Authoring:** one author; one self-review; no delegated
review, experiments or application implementation.

## Frozen Source And Worktree

- Gateway baseline / fetched `origin/main`:
  `fda21d619dcc5119f1133501bafa8cc7e800c7cf` (unchanged from the supplied revision).
- Worktree:
  `C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway-agent-ready-contracts`.
- Branch: `codex/agent-ready-contracts`. The final handoff message supplies the
  frozen commit; this file deliberately does not contain its own commit hash.
- Frontend source: `9a59ec48d41d65f77117f9cfdb450fc3800bca28`; design source:
  `4e318f39d2208bfc5dc99239d67445db70174e77`.
- Backend source: targeted v3 schema/builder/manifest Git objects at
  `5b9085d8717e31ffbb06e5621992ff05a14fbe89`; backend checkout HEAD stayed
  `5b9facf4f68e51c1f63574fc2551cede2f48eea2`. No corpus/archive download.
- Router evidence is the pinned Gateway verdict's report of router revision
  `d1297843b1660b14afe94589bc6a5ea886302267`, not a new router review or rerun.

Exact source paths/links and precedence are in the
[candidate](../system-contracts-v0.2-candidate.md#pinned-sources). All inspected
external repository content was read from the named Git objects, not unfinished
worktree changes. Gateway has no tracked AGENTS.md; ancestor locations were
checked. Read `.github/GITFLOW.md`; the user explicitly requested this isolated
local `codex/` branch, not a direct GitFlow release branch.

## Deliverables And Changes

- [Candidate contract](../system-contracts-v0.2-candidate.md): 22 requirement IDs
  with source and positive/negative acceptance criteria; status separates target
  design from the unimplemented Gateway starter.
- [Decision register](../decisions-needed.md): 12 bounded open decisions,
  recommendations explicitly proposed, and work that can proceed independently.
- [Agent entrypoint](../agent-entrypoint.md): responsibility-specific reading and
  stop rules; no replacement meeting assignments or persona prompt.
- This handoff and [local validator](validate-contract-docs.cjs).

Three principal clarifications from v0.1:

1. Minimum DTO examples are not exhaustive wire schemas. Unknown query names,
   null/omission rules, mutation replay, nested items and delivery remain gated;
   canonical IDs stay opaque and source ID patterns do not become API patterns.
2. Importer and runtime ownership are separated down to protected tables,
   explicit join direction/provenance, unchanged chunks and embedding compatibility.
   `INSTANCE_OF` is edition-to-series. `ready` is not silently added to the enum;
   sparse snapshot schemas do not certify complete DB mappings.
3. AIDA route is independent of support mode. Transcript kind plus validated
   recording scope plus active snapshot are required together. Citations can be
   material-only; missing URLs and video-to-transcript mapping need decisions.
   The NestJS classifier is an unpromoted target, not an accomplished port.

No existing document, diagram, README, meeting note, application, migration,
package/lockfile or CI file is changed. No final OpenAPI was fabricated.

## Review Decisions

Fernando's consequential product/security choices are guest AIDA (D-03),
identity/session/elevation policy (D-04), retention/deletion/support access
(D-06), delivery (D-07), context/fallback behavior (D-10) and curated-path source
(D-12). Confirm snapshot activation authority/readiness (D-01) as part of the
static-fixture boundary. D-02/D-05/D-08/D-09/D-11 need the named technical owners
to propose exact API, schema, classifier, embedding and citation contracts for
approval, not Fernando inventing numerical defaults.

Known ambiguity audit: all requested topics were checked against pinned sources.
ORM, pagination/filter names, retention, sync/stream, classifier release and
embedding settings remain open. Guest transient storage is clear in P but guest
availability differs from B. R supplies `1e-6` parity tolerance, while B asks for
approved tolerance; keep that evidence instead of claiming no tolerance exists.
The backend S tree contains review/validation records absent from R's reviewed
router copy; neither tree establishes that the other has been repaired.

Additional coordination evidence: Portal relayed Einstein's report of 96 chunk
groups colliding under P's proposed resource/index/version/text-hash unique key
in the reviewed hash-matched ZIP. This author did not inspect that ZIP/report.
D-05 explicitly blocks finalizing the incompatible constraint/full import until
the combined review verifies the tuples and model owners resolve the conflict.
Preserving every canonical chunk remains required; no revised key or discarded
chunk is approved by this candidate.

## Validation

Run from this worktree:

```text
node docs/contracts/review/validate-contract-docs.cjs
git diff --check
git diff --cached --check
git diff --name-only fda21d619dcc5119f1133501bafa8cc7e800c7cf
git status --short
```

Validation outcome is recorded after execution below. The validator checks
document structure, requirement/decision references, local links/anchors, five
JSON examples and selected scalar/enum properties. It does not pretend the
examples constitute a final wire schema. Immutable external source links are
checked against local Git objects, not remote page availability.

**Execution record:** Passed local document validator: four Markdown documents,
22 requirement source/acceptance sections, 12 defined decisions, five parsed
JSON examples and 40 local links/anchors. All 11 external immutable source-link
targets passed `git cat-file -e` in their named local repositories. `node
--check` passed for the validator. Prettier 3.9.6 checked all five added files
successfully using the existing Gateway installation; no dependency install or
package change. Both unstaged/staged `git diff --check` passed. Staged file
inventory contains only these five additions under `docs/contracts/`. Baseline
blob remained `e2d2a3dc0897f2837d3ac0a9110219fd7df395a1`.

Self-review completed: required fields versus examples; source/persistence/wire
enum distinctions; imported/runtime ownership; unsupported source records;
canonical/context/citation integrity; activation, retention and replay gates;
router parity versus product quality; every normative requirement's source
and observable criterion. Corrections explicitly gated the reported chunk-key
conflict and made the document validator tolerate Windows checkout line endings.
Application unit/E2E/import/parity/canary tests are specified
only, not run. No archive checksum or full-fixture totals were recomputed.

## Parallel Work And Publication

NestJS diagram author: coordinate state casing/readiness/activation (D-01),
physical mapping/grants and empty conversations (D-05), deletion policy (D-06),
and scoped retrieval/nullable citations (D-10/D-11). The imported-versus-runtime
boundary remains unchanged; do not add guest persistence or a Python runtime.

Next.js diagram author: coordinate provisional endpoint/DTO contracts (D-02),
guest AIDA (D-03), sign-in/role matrix (D-04), delivery (D-07), recording scope
(D-10) and curated-path source (D-12). Older submission UI is out of scope.
These are review coordination points, not instructions to edit their diagrams.
No parallel author's worktree or unfinished diagram was inspected or modified.

Publication update: Fernando authorized publication after review/corrections.
The existing task **Portal, FrontEnd and BackEnd**
(`01a03f13-2e7b-7b40-afb0-b97f6fa5557c`, local) is the sole release coordinator
for both repositories and their actual default branches through protections/
checks. This author freezes local documentation only and does not push or merge.
Portal will arrange one combined independent review, then send one correction
request. This author will provide agree/disagree dispositions and a final local
commit for that bounded pass; candidate decisions remain explicitly candidate.
