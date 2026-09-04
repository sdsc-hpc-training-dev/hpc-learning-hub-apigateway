# Combined Publication Dispositions

Status: CANDIDATE documentation. Publication does not approve implementation,
migrations, product policy, or any open decision. The existing v0.1 baseline is
unchanged.

## Review And Correction Scope

The [independent combined review](contracts-ingestion-independent-review.md)
returned two required P2 findings and two optional suggestions against the frozen
contract and ingestion drafts. The original report is preserved, including its
needs-correction verdict and historical machine-local evidence references.
Those references identify reviewer evidence, not portable implementation links.

Each author received one final correction pass. The coordinator reconciles their
combined publication and the affected NestJS behavior notes, without a second
review round or a redesign of the independently reviewed module graph.

| Finding                | Disposition | Publication correction                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1: Transcript scope   | Agree       | Contract AIDA-03/D-10, ingestion IW-023/T12/D4, and the NestJS behavior table require validated recording scope plus transcript kind, active snapshot and compatible embedding configuration. Missing/conflicting/unresolved context or video-to-transcript association cannot authorize a broader search. The exact controlled fallback remains undecided.                                    |
| R2: Register authority | Agree       | The central register and specialist D1-D5 crosswalk identify shared coverage and coordinated closure. D1 maps to D-05; D2 to D-01/D-05; D3 to D-09/D-05 storage; D4 to D-10/D-12; D5 to D-05/D-09 including archive limits, scratch cleanup and report/config serialization. Partial approval does not close remaining concerns. The technical companion is distinct from historical source I. |
| O1: Curated content    | Agree       | Gateway control and exclusion from worker permissions do not decide curated-path source, initial IDs, seeding, or authoring. D-12 remains open. The same qualification is added to NestJS ownership prose.                                                                                                                                                                                     |
| O2: Combined QA        | Agree       | Retain manual Markdown verification recipes for the spec requirement inventory/matrix, crosswalk labels, local links/anchors, unchanged v0.1, and unchanged reviewed SVG. These are not installed tooling or automated CI coverage. No application or CI configuration change.                                                                                                                 |

Author evidence: [contract dispositions](../contracts/review/contract-review-dispositions.md)
and [ingestion dispositions](../specs/review/ingestion-worker-review-dispositions.md).

## Integration Boundaries

- NestJS guest AIDA wording is qualified by D-03; the proposed general source set
  by D-10/ingestion D4; curated population by D-12; and the incompatible chunk
  uniqueness constraint by D-05. No module or import arrow changes.
- Keep all 2,291 canonical chunks. The independent review verified 96 repeated
  four-field tuple groups, 212 affected rows and 116 would-be lost rows, but zero
  duplicate canonical ID groups. No replacement key or diagram change is approved.
- Candidate contract and technical spec remain implementation guidance with
  explicit gates, not evidence that runtime services or migrations exist.
- No application, CI, migration, cloud, model, or data changes are included.
  Shared main/master checkouts are not updated by this release worktree.

## Reproducible Documentation Checks

From the Gateway checkout root, run the exact Node commands in the
[contract verification recipe](../contracts/review/validate-contract-docs.md)
and [combined verification recipe](validate-release-docs.md), then:

```sh
git diff --check
```

These validators check document structure and navigation, not semantic-policy
approval or runtime behavior. Required GitHub checks and the final default-branch
verification are recorded on the publication PR and in the coordinator handoff.

Local packaging QA found that standalone CommonJS documentation scripts are
outside the existing TypeScript project and fail its typed lint configuration.
The publication therefore retains their checks as manual Markdown recipes, not
installed scripts. Existing lint/TypeScript settings and required checks remain
unchanged. Maintained executable tooling would require a separately scoped
tooling change; it is not introduced by this documentation release.
