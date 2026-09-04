# Ingestion Technical Handoff

**Date/status:** 2026-09-03; frozen-source technical candidate, documentation only.

**Worktree:** `C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway-technical-ingestion-spec`

**Branch:** `codex/technical-ingestion-spec`

**Deliverables:** [Technical contract](../ingestion-worker.md) and this handoff. Frozen commit supplied with task handoff; `git log -1 --format=%H` identifies it without a self-referential hash.

## Evidence

- Gateway `origin/main` fetched/pinned at `fda21d619dcc5119f1133501bafa8cc7e800c7cf`, matching requested baseline. No migrations, ORM dependency or migration command there. README/GitFlow and task-economy handbook read; no AGENTS.md found in inspected repo/ancestor paths.
- Backend v3 source/benchmark read with `git show` at `5b9085d8717e31ffbb06e5621992ff05a14fbe89` (`codex/aida-mvp-benchmark-v2`, including origin-tracking ref). Checkout remained at `5b9facf4f68e51c1f63574fc2551cede2f48eea2`; its v2 files were not mistaken for v3 authority. No backend fetch/writes/generation/evaluation.
- Exact ZIP `C:/Users/ofgar/Downloads/snapshot-v3 (2).zip`; archive/manifest digests below. All 16 checked canonical/AIDA/portal member hashes matched. Targeted structured reads without extraction or graph corpus traversal. Manifest declares source commit `ccbdbe4b6a44ca7d16cc04b16ec0d2db73f5361e` and dirty source tree; preserved, not recast as a clean later build.
- Entity/chunk counts match the frozen Gateway contract. Additional counts: 4,379 relationships, 144 aliases, 698 resource-file entries, 96 groups colliding under proposed compound chunk uniqueness; no duplicate relationship pairs observed. This is bounded mapping evidence, not full import validation.

## Collision Evidence

Retained report of the existing read-only ZIP audit. Grouping used the exact four logical fields from the persistence diagram; `collision_group_count` counts groups, not duplicate canonical IDs. Representative groups below retain exact IDs/hash so review can reproduce the conflict without opening text payloads. No replacement constraint is approved.

```json
{
  "archive_sha256": "82b16349c93b88ad31fa8d08d76b2ba2a470c0e327151a6bd695b51967cc6945",
  "manifest_sha256": "932f3d83d382b5d74d1062d06b31694f8eeb5fff872ad330a7638377f29a43b2",
  "member": "snapshot-v3/aida/chunks.jsonl",
  "member_sha256": "7e41c25406ac0803af33580342217b7a32621108639b681fe61106939b79644c",
  "chunk_count": 2291,
  "group_by": [
    "content_resource_id",
    "chunk_index",
    "chunking_version",
    "text_hash"
  ],
  "collision_group_count": 96,
  "representative_groups": [
    {
      "content_resource_id": "30000158",
      "chunk_index": 0,
      "chunking_version": "word-window-v2",
      "text_hash": "b2fa1e6921f30602aaaef7f8b8ecce265a35ba59a0d8aca1d15b9c59993766f2",
      "members": [
        {
          "id": "70000317",
          "material_id": "20000041",
          "event_edition_id": "10000041"
        },
        {
          "id": "70000491",
          "material_id": "20000066",
          "event_edition_id": "10000066"
        }
      ]
    },
    {
      "content_resource_id": "30000158",
      "chunk_index": 1,
      "chunking_version": "word-window-v2",
      "text_hash": "bd056da4b3ad138da1dd8857e9d11182219f1ac38d91a78483048a1abbcb786b",
      "members": [
        {
          "id": "70000318",
          "material_id": "20000041",
          "event_edition_id": "10000041"
        },
        {
          "id": "70000492",
          "material_id": "20000066",
          "event_edition_id": "10000066"
        }
      ]
    }
  ]
}
```

The source-key grouping operation was PowerShell `Group-Object content_resource_id,chunk_index,chunking_version,text_hash`, retaining groups with `Count -gt 1`, on parsed JSONL from .NET `ZipArchive.OpenRead`. These distinct canonical chunks must all survive ingestion. Migration design must reconcile the diagram's constraint before claiming full-fixture compatibility (D1); neither deduplicating chunks nor changing their IDs is an acceptable shortcut.

## Corrections And Integration

Physical SQL stays a migration dependency. Import uses explicit typed joins/restricted direct DB access, no worker DDL/personal access/runtime-citation import/separate schema. Migrations, data import, normal app/DB restart and explicit test reset are separate operations. M1 does not pretend to implement M2 activation. Verified chunks use **word** windows; no source embeddings or transcript timestamps exist. `ready` is conflicting prose, not an approved enum. Router 4,096-dimensional L2 inputs are not a corpus/index contract. Curated-path population remains unresolved, not necessarily runtime-created.

For **Srujam**, D1/D2 require migration-backed chunk uniqueness, enum/grant/keying/isolation choices. Reconcile global stable IDs/restricted deletion with replacement and protected learner/history FKs. Index creation belongs to migrations/approved maintenance, not importer grants.

For **Mio/Arnav**, the mapping/acceptance matrix bounds parser validation, closed fixture, synthetic embeddings, restricted import, source-filtered lookup, retry evidence and persistent restart. D3 is corpus/query compatibility, distinct from router evaluation. No separate assignment document was added.

For the **system-contract author**, carry D1's actual collision, D2's `ready` discrepancy and M1/M2 distinction, D3's undecided embedding/storage pairing, and D4's curated-path/general-scope ambiguity into consistency review. The pinned benchmark branch has an older five-strategy experiment config; it is not four-route importer authority. No unmerged author files were read, edited, linked or treated as approved.

**Fernando-level decisions only:** confirm the non-transcript general retrieval boundary and where curated-path ownership should be decided; approve scope/authorization before enabling production replacement. Concrete migration corrections, config proposals and measured operational values should first be resolved by engineering under D1-D3/D5, not escalated as micro-approvals. No decision is needed to publish explicitly candidate documentation after review.

## Validation And Boundary

Passed: `git diff --check`; targeted Prettier check; relative/reference-link and anchor existence; balanced fences/tables; 32 unique requirement IDs, all referenced by the acceptance matrix; JSON collision example parsed with `ConvertFrom-Json`. Source schemas/manifests were also parsed structurally; ZIP hashing used SHA-256. No SQL/YAML snippet claims a final migration or worker API.

Narrow reproducible commands from this worktree:

```powershell
git diff --check
git diff --stat
git status --short --branch
node 'C:/Users/ofgar/OneDrive/Documents/Interactive video/hpc-learning-hub-apigateway/node_modules/prettier/bin/prettier.cjs' --check docs/specs/ingestion-worker.md docs/specs/review/ingestion-worker-technical-handoff.md
git -C C:/Users/ofgar/Projects/GithubProjects/intVid/intvid-backend show 5b9085d8717e31ffbb06e5621992ff05a14fbe89:schemas/citation-chunk-v3.schema.json
Get-FileHash -LiteralPath 'C:/Users/ofgar/Downloads/snapshot-v3 (2).zip' -Algorithm SHA256
```

One source/consistency self-review pass. The matrix specifies future tests, not an executed DB suite: no app/migration/CI changes, worker implementation, import, live NRP/S3 requests, cloud jobs, credentials or new reviewers/agents. No push/PR/merge. Portal is sole release coordinator; one requested combined-review correction/disposition pass may follow freeze. Shared main and other authors' worktrees remain untouched.
