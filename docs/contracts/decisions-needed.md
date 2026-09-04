# Decisions Needed

**Status:** Open candidate decisions for Fernando and the affected owners.
No recommendation below is approved policy. Approval records should name the
choice, owner/reviewer and affected requirement IDs, then update the candidate
and relevant schema/tests together. Source keys and exact revisions are in the
[candidate source table](system-contracts-v0.2-candidate.md#pinned-sources).
No implementation in the pinned Gateway closes these questions.

<a id="D-01"></a>

## D-01: Snapshot Readiness And Activation

**Uncertainty/evidence:** B 6.2 says mark `ready`, but B 3 and P section 2 have
no such member and use different enum casing. B 5 excludes Gateway promotion;
B 6.2 gives the worker atomic activation. F limits work to the static fixture,
not an automatic replacement lifecycle. P requires at most one active snapshot.
**Affected:** migration/importer/runtime retrieval; DATA-05, SH-02, AIDA-04.
**Consequence:** incompatible status values or activation without clear authority;
readers may mix snapshots if the active reference changes mid-answer.
**Options / proposal:** recommend treating readiness as completed validation
gates, not a new enum value, with separately authorized atomic activation of the
fixed fixture. Alternatively explicitly approve a new state and migration.
Confirm DB enum encoding, transition table, activation actor and per-answer
snapshot consistency before implementing activation. No automatic lifecycle.
**Can proceed:** staging, validation, static fixture parsing and failure-isolation
tests; no undocumented `ready` state or promotion endpoint.

<a id="D-02"></a>

## D-02: HTTP Completion And Mutation Semantics

**Uncertainty/evidence:** B 4.2 explicitly defers query names to OpenAPI; 4.2/7.1
show minimum objects only. B 4.3/7.1 list routes without full schemas. C has no
OpenAPI. R's "Required runtime DTO" uses `query`, snake_case context and `scope`,
where B uses `text` and camelCase. `clientRequestId` has no replay contract.
**Affected:** Gateway/OpenAPI, Next.js, AIDA; SH-04, HTTP-01/02/04, AIDA-01/02/05.
**Consequence:** clients guess incompatible bodies, filters, envelopes, errors,
pagination or retries that can duplicate turns and writes.
**Options / proposal:** recommend retaining B's public paths and camelCase,
adapting explicitly to internal router inputs. Publish reviewed operation-level
OpenAPI before frontend integration, not an inferred exhaustive schema. For
B's minimum examples, propose required displayed keys with `null` for optional
unknown scalar values; approve exceptions explicitly. Specify nested arrays,
vocabulary/resource encodings, `/me` fields, personal/feedback bodies and success
responses. Choose filter combination semantics, stable sort/tie order and one
pagination scheme with measured limits; no default numbers proposed here.
Choose per-operation duplicate/retry and concurrent-update behavior (including
whether clientRequestId is a user-scoped idempotency key and how reuse with a
changed payload behaves), unknown-ID/ownership statuses, error code/details
catalogue and success request-ID placement. Do not infer these from HTTP verbs.
**Can proceed:** domain services, ownership guards, source-grounded DTO fragments
and tests of invariants; affected HTTP serialization and frontend integration
wait for their operation's approved contract. This can close per operation.

<a id="D-03"></a>

## D-03: Guest AIDA

**Uncertainty/evidence:** B 7.1 says public/guest AIDA "may" be supported; P
"Learner and AIDA records" says public AIDA remains account-free and anonymous
interactions are transient. D stories favor public discovery; F specifically
requires authenticated persistence but does not settle guest availability.
**Affected:** product, Gateway Aida/auth, Next.js; AIDA-01/02.
**Consequence:** accidental authentication gate or durable anonymous history;
guest feedback/message IDs cannot be designed safely from authenticated tables.
**Options / proposal:** recommend transient account-free one-turn AIDA with no
durable guest conversations, consistent with P; alternative is an explicit
authenticated-only first release. Decide whether `/aida/messages` also supports
authenticated one-turn use, and whether guest feedback exists. Any guest abuse
controls need separate approved limits, not guessed budgets.
**Can proceed:** public catalog and owner-scoped authenticated history. Do not
create anonymous durable records or advertise an undecided guest capability.

<a id="D-04"></a>

## D-04: Identity, Session And Role Provisioning

**Uncertainty/evidence:** B 4.3 specifies CILogon ownership/cookie properties but
no auth routes, session lifetime, CSRF policy or exact SameSite mode. P requires
unique normalized email, one identity per user and unique issuer/subject but
does not resolve a new issuer/subject sharing an existing email. T asks for a
maintainer-only smoke page without an ADMIN inheritance rule.
**Affected:** Gateway Auth/Users, security reviewer, Next.js; HTTP-03, DATA-06.
**Consequence:** unsafe account linking/elevation or incompatible sign-in flow.
**Options / proposal:** recommend issuer/subject as the authenticated identity
and controlled review of email collisions, never silent email-only linking.
Approve identity/email normalization, collision response, sign-in/callback/
logout routes, session/CSRF settings, controlled elevation/bootstrap process,
and explicit smoke-page role matrix. Alternative account-linking policy needs
an explicit verified linking procedure. No role-management API is implied.
**Can proceed:** default LEARNER, prohibition on claim/client elevation,
owner-scoping and cookie-secret isolation tests. Account linking and session
lifecycle implementation wait for security review.

<a id="D-05"></a>

## D-05: Authoritative Migration And Import Mapping

**Uncertainty/evidence:** B 5/10 leaves ORM open; I labels SQL names proposed and
forbids a separate worker schema. P is a domain diagram, not DDL. S's schemas
constrain only a subset of emitted fields; relationship schema allows three
types absent from P. I creates a run after initial identity validation whereas
B 6.2 creates one before validation; P's run references a snapshot. P stores
`bucketObjectKey`, while local `--source` and run configuration need durable
representation. P conversation multiplicity is 1..* messages despite a create
conversation route with no required first message.
On 2026-09-03 Portal also relayed Einstein's report of 96 chunk groups colliding
under P's `(contentResourceId, chunkIndex, chunkingVersion, textHash)` unique
key in the hash-matched reviewed ZIP. This is a reported compatibility blocker,
not independently verified evidence from this author; exact report/tuples await
the combined review. DATA-04 forbids dropping or changing supplied chunks.
**Affected:** Srujam, Mio, Arnav; DATA-01 through DATA-06, AIDA-01.
**Consequence:** importer/schema incompatibility, lost error provenance, silent
record loss or a failure to create an initially empty conversation.
**Options / proposal:** recommend Srujam publishes the first reviewed migration
contract with exact SQL names/types/nulls, constraints and least-privilege grants;
select ORM/library there. Include a source-path-to-column mapping for nullable
source data/aliases/resource files, source provenance and configuration, trusted
expected checksum delivery, and errors before a valid snapshot is known.
Unsupported relationship/chunk records should fail validation with an explicit
report (proposal), not be discarded. If present in the fixture, resolve their
mapping with Young before import. Verify the reported colliding chunk tuples
and ask the model owners whether the composite uniqueness rule needs revision;
do not choose a revised key or silently deduplicate. Approve empty conversation
creation or require
a first message. Define same-config replay, concurrent attempts and resumption
without inventing retry limits. These are missing pieces of the current
boundary, not authorization to create a second schema or new snapshot pipeline.
**Can proceed:** supported parsers/mappings, fixed deterministic fixture tests,
logical constraints and candidate migration design; DB integration waits on
the relevant migration and collision disposition. Full archive mappings cannot be certified by these
sparse schemas alone.

<a id="D-06"></a>

## D-06: History Deletion, Retention And Support Access

**Uncertainty/evidence:** B 10 leaves retention/deletion period open. P says
conversation deletion should hard-delete and cascade, subject to adopted
audit/retention policy. B 7.1 allows support-admin reads only under an explicit
procedure; none is supplied.
**Affected:** Fernando/security, Gateway persistence/Aida, Next.js; AIDA-01/05,
DATA-06. **Consequence:** premature retention promises, orphaned personal data
or unauthorized support access.
**Options / proposal:** recommend owner-initiated hard deletion with P's cascade
unless a documented audit requirement demands a scoped exception. Approve
retention period, deletion completion semantics, any audit exception and the
support authorization procedure together. Alternative soft deletion is a
contract change, not a silent implementation choice.
**Can proceed:** owner isolation, cascade design and synthetic tests. Do not
claim deployed deletion/retention guarantees or enable broad admin reads.

<a id="D-07"></a>

## D-07: Answer Delivery And Turn Transactions

**Uncertainty/evidence:** B 10 explicitly leaves synchronous versus streamed
delivery open; B's minimum response includes timings while P permits nullable
generation metrics. P models messages and run failures but does not settle
persist-before-generation, cancellation or partial response behavior.
**Affected:** Gateway Aida, Next.js, persistence; AIDA-02/05, SH-04.
**Consequence:** incompatible client parsing, fake zero timings, duplicated or
invisible failed/partial turns.
**Options / proposal:** select synchronous JSON or a reviewed streaming protocol.
Synchronous JSON is the smaller first integration proposal, not a decision.
Specify timing units/origins/null availability, failure after response begins,
cancel/disconnect behavior, message/run transaction boundaries and replay
behavior coordinated with D-02. No timeout/token/latency budgets are adopted.
**Can proceed:** internal answer/evidence objects and failure fixtures; public
delivery and durable turn-completion behavior wait for this decision.

<a id="D-08"></a>

## D-08: Classifier Export And Promotion Policy

**Uncertainty/evidence:** B 11 requires reconciliation, exported artifact and
approved probability tolerance. R specifies `1e-6`, yet its quality thresholds
are expressly proposals. No exported release, pinned environment or successful
NestJS parity result appears in C. R's reproduced metrics concern its separately
reviewed router copy; S's benchmark files do not prove that copy is repaired.
**Affected:** Mio/offline training, Arnav/runtime, benchmark/Gateway owners;
AIDA-06. **Consequence:** promotion based on documentation claims rather than
reproducible parity and acceptable product quality.
**Options / proposal:** retain offline Python and gated NestJS inference.
Recommend confirming R's `1e-6` numerical tolerance and immutable language-neutral
export; name the exact release/schema, class order, normalization/tie/zero-vector
rules, provider revision, thresholds/fallback and approved quality gate. Do not
treat 80%/90%/70% as already approved or tune on held-out labels. Reconcile the
metric discrepancy with evidence before promotion; no model escalation.
**Can proceed:** exporter/parity harness and deterministic router adapters.
Do not make the port the default production router before all gates pass.

<a id="D-09"></a>

## D-09: Retrieval Embedding Configuration

**Uncertainty/evidence:** B 10 leaves NRP batching/retry limits to measurement;
I "Required Configuration" demands model/provider/dimension/normalization,
distance, top_k, timeout/retry policy and hash. Snapshot embeddings are not
generated. R's 4096-dimensional classifier and prototype retry constants do not
approve the chunk/query embedding configuration.
**Affected:** Arnav, Mio, Gateway NRP/retrieval and benchmark owners; DATA-04/07.
**Consequence:** incompatible vectors, unreproducible retrieval or uncontrolled
request retries.
**Options / proposal:** recommend one explicit versioned compatible chunk/query
configuration with content-hash binding and measured bounded batches/retries;
approve model/version/dimension/normalization/distance/index compatibility and
top_k before real ingestion. Alternative configurations require distinct
versioned embeddings/index compatibility, not mixed vectors. No numeric retry,
batch, timeout or top_k default is proposed as policy.
**Can proceed:** deterministic test embeddings, configuration recording and
wrong-dimension/model rejection tests. Production provider settings and live
measurements require separate authorization.

<a id="D-10"></a>

## D-10: Scope, Evidence Fallback And Coverage Gaps

**Uncertainty/evidence:** B 7.3/R require explicit recording context to override
classification, but B's question has IDs without an explicit scope field. R
names `scope` without defining its values. A video resource does not itself
identify a transcript chunk's resource; P supplies material/resource joins but
no dedicated video-transcript association. B 7.2 permits safe general fallback;
R's abstain executor has no retrieval/generation. General RAG's exact allowlist,
weak-evidence thresholds, low-confidence behavior and coverage-gap reasons are
not finalized.
**Affected:** product, Gateway Router/Retrieval, Next.js, benchmark; AIDA-02/03/04/06.
**Consequence:** wrong-recording answers, overly broad transcript retrieval,
unsupported groundedness claims or telemetry confusing outages with corpus gaps.
**Options / proposal:** recommend an explicit reviewed context DTO with IDs,
scope semantics and conflict checks. For an open video, define how to select
its transcript resource(s); do not treat video ID equality as transcript
matching. Reject or clarify unresolved/conflicting scope rather than broaden it
(proposal). Approve a general-chunk allowlist, evidence/coverage-gap rules and
deterministic fallbacks; decide whether safe general explanations use the
abstain route or are unavailable in the initial release. Retain independent
route and answerMode and always filter transcript kind plus valid scope.
**Can proceed:** canonical FK checks, source-kind/active-snapshot filtering,
citation validation and scope-isolation fixtures; ambiguous scope/fallback
behavior waits for approval.

<a id="D-11"></a>

## D-11: Resource And Citation Serialization

**Uncertainty/evidence:** B 4.2/7.1 examples always show URL/title and chunk
sourceKind. P allows material-only citations with null resource/chunk IDs.
S builder `resource_entity` can emit null canonical URLs; `source_location` may
be a local path. D FUS-05 asks for verified canonical resources. No exhaustive
verification/status wire enum, URL policy or material-only citation encoding
is defined by B.
**Affected:** catalog/AIDA DTO owners, importer, Next.js; HTTP-02, AIDA-02/04.
**Consequence:** fabricated links, filesystem paths exposed as URLs, or rejection
of valid material-only citations.
**Options / proposal:** recommend resolving titles/links from canonical data and
using a reviewed null/omission representation for absent links/sourceKind;
render unavailable resources without inventing an external URL. Decide the
actual serialization, allowed URL validation rule and resource visibility by
verification/status. Optional material-page link representation needs explicit
API approval, not a guessed frontend route.
**Can proceed:** canonical ID integrity and citations with existing verified
links. Do not fabricate timestamp URLs, titles, or source-kind values to fill
mandatory fields.

<a id="D-12"></a>

## D-12: Curated Learning Path Source And IDs

**Uncertainty/evidence:** B lists public learning-path reads; P defines
CuratedLearningPath with string `id`, ordered items and `isPublished`. F/B say
app-owned identifiers are UUIDs. I forbids the worker from managing curated as
well as personal paths. No curated-path snapshot input, seed process, publication
actor or source-ID contract is defined. Older design stories want a beginner
path but do not supply canonical records.
**Affected:** Gateway Learning/migrations, frontend, product; SH-02, HTTP-01.
**Consequence:** fabricated curriculum, guessed path IDs or importer ownership
of runtime content.
**Options / proposal:** recommend Gateway-controlled reviewed seed content with
app UUIDs if these are app-owned paths, retaining canonical material references;
alternatively identify an external canonical path source and opaque ID contract.
Approve initial content owner, ID provenance and public publication predicate.
Do not introduce an editing/submission workflow just to populate the read API.
**Can proceed:** ordered-path domain constraints and personal UUID paths;
curated publication/data seeding waits for the identified source and approval.
