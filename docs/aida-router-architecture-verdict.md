# AIDA Router Architecture Verdict

**Repository reviewed:** `sdsc-llm-dev/aida-router`  
**Reviewed commit:** `d1297843b1660b14afe94589bc6a5ea886302267` (`main`)  
**Review date:** 2026-09-02  
**Scope:** SDSC Learning Hub AIDA MVP; no repository files were modified.

## Executive Verdict

Use **NestJS for production router inference and request orchestration, while retaining Python only for offline training and evaluation**.

The current router is not a Python-heavy AI service. Its runtime decision is:

1. send the user's question to NRP `qwen3-embedding`;
2. L2-normalize the returned 4,096-dimensional vector;
3. run a four-class multinomial logistic-regression matrix calculation;
4. choose the largest probability.

That calculation is tiny: approximately 16,388 floating-point weights and intercepts, or about 65 KB when exported as float32. The NRP network call dominates routing latency. A separate Python deployment would therefore add operations, failure modes, credential handling, and a network hop without supplying meaningful runtime capability.

The router's four current labels match the approved MVP exactly:

| Repository label | MVP responsibility                                                    |
| ---------------- | --------------------------------------------------------------------- |
| `catalog_api`    | Find and return canonical materials, sessions, identifiers, and links |
| `general_rag`    | Answer grounded questions across indexed learning content             |
| `transcript_rag` | Answer within the transcript of the recording currently in context    |
| `abstain`        | Decline when the available SDSC evidence is insufficient              |

GraphRAG and Neo4j are correctly absent from this MVP router. Do not reintroduce them through the runtime port.

**Important shipping gate:** the classifier should not be treated as production-ready yet. Re-running the checked-in V2 training path produced **12/20 primary validation matches and 17/20 acceptable matches**, while the README claims 18/20 and 19/20. The higher documentation claim is not reproducible from the reviewed commit and current declared dependencies.

## What The Repository Actually Implements

### Router

`EmbeddingRouter.decide()` ignores its `context` argument, calls NRP for an embedding, normalizes it, runs `predict_proba`, and marks but does not replace low-confidence decisions. See [`embedding_router.py`](https://github.com/sdsc-llm-dev/aida-router/blob/d1297843b1660b14afe94589bc6a5ea886302267/llm-client/app/router/embedding_router.py#L20-L47).

The NRP client hard-codes:

- endpoint: `https://ellm.nrp-nautilus.io/v1`;
- embedding model: `qwen3-embedding`;
- answer model: `gpt-oss`;
- four attempts with increasing 2, 4, 6, and 8 second waits;
- a 120-second embedding timeout.

See [`nrp.py`](https://github.com/sdsc-llm-dev/aida-router/blob/d1297843b1660b14afe94589bc6a5ea886302267/llm-client/app/nrp.py#L18-L57).

This means the router is **not 100% deterministic Python**. The fitted classifier is deterministic for a fixed vector and model artifact, but its input depends on a remote neural embedding service whose unpinned model revision can change.

### Training

Training uses scikit-learn `LogisticRegression(C=10, class_weight="balanced", max_iter=5000)` over normalized cached question embeddings. It trains on 60 development questions, evaluates on 20 validation questions, and writes a Python `joblib` bundle containing only the classifier, training split, and a few metrics. See [`train.py`](https://github.com/sdsc-llm-dev/aida-router/blob/d1297843b1660b14afe94589bc6a5ea886302267/llm-client/app/router/train.py#L42-L89).

The model is not distributed as a versioned release artifact. `router.joblib` is ignored and regenerated locally. Dependencies specify minimum versions rather than an exact lock. Therefore two developers can legally install different scikit-learn versions and produce artifacts that differ.

### Retrieval And Answering

The current prototype executors are:

- `catalog_api`: custom in-memory BM25 over Snapshot v3 metadata, followed by one NRP answer call;
- `general_rag`: NRP query embedding plus cosine search over a local NumPy vector collection, followed by one NRP answer call;
- `transcript_rag`: the same vector collection filtered by the active material or resource identifier;
- `abstain`: a fixed response with no retrieval or LLM call.

The registry contains exactly those four executors. See [`registry.py`](https://github.com/sdsc-llm-dev/aida-router/blob/d1297843b1660b14afe94589bc6a5ea886302267/llm-client/app/routes/registry.py#L1-L16) and the route definitions in [`domain.py`](https://github.com/sdsc-llm-dev/aida-router/blob/d1297843b1660b14afe94589bc6a5ea886302267/llm-client/app/domain.py#L12-L25).

For production, retain the route behavior and contracts, but replace the local filesystem, custom BM25, and NumPy serving stores with PostgreSQL full-text search and pgvector adapters. Do not port prototype storage mechanics line for line.

### HTTP Application

The repository is a local prototype served by Python's standard-library `ThreadingHTTPServer` on `127.0.0.1`. It permits CORS from any origin, has no authentication layer, no Dockerfile, no GitHub Actions workflow, and no unit or contract test suite. See [`http_api.py`](https://github.com/sdsc-llm-dev/aida-router/blob/d1297843b1660b14afe94589bc6a5ea886302267/llm-client/app/http_api.py#L40-L105) and [`http_api.py`](https://github.com/sdsc-llm-dev/aida-router/blob/d1297843b1660b14afe94589bc6a5ea886302267/llm-client/app/http_api.py#L152-L171).

It is useful experimental code, not a deployable production boundary.

## Evaluation Findings

### Reproduced result

The reviewed training command was run in an isolated environment against the checked-in cached embeddings. It reported:

```text
trained on 60 development questions
validation primary 12/20  acceptable 17/20
```

The README instead reports four-route primary validation of 18/20 and acceptable validation of 19/20. See [`README.md`](https://github.com/sdsc-llm-dev/aida-router/blob/d1297843b1660b14afe94589bc6a5ea886302267/llm-client/README.md#L57-L74). A configuration comment supports the reproduced 12/20 result and says that C=10 reaches the V2 validation plateau. See [`config.py`](https://github.com/sdsc-llm-dev/aida-router/blob/d1297843b1660b14afe94589bc6a5ea886302267/llm-client/app/config.py#L66-L79).

The held-out test split was not used for this architecture decision and should remain untouched until the team freezes the final router and evaluation procedure.

### V2 benchmark coverage

The V2 benchmark has 120 questions:

- 40 `catalog_api`;
- 32 `general_rag`;
- 24 `transcript_rag`;
- 24 `abstain`.

Its split is 60 development, 20 validation, and 40 held-out test questions. The validation split includes only two transcript questions, so transcript-routing quality cannot yet be estimated with confidence. The manifest records 1,161 transcript chunks but zero timestamped transcript chunks, making timestamp accuracy explicitly unscorable. See [`benchmark_manifest.json`](https://github.com/sdsc-llm-dev/aida-router/blob/d1297843b1660b14afe94589bc6a5ea886302267/llm-client/benchmarks/aida-mvp-v2/benchmark_manifest.json#L1-L34) and [`benchmark_manifest.json`](https://github.com/sdsc-llm-dev/aida-router/blob/d1297843b1660b14afe94589bc6a5ea886302267/llm-client/benchmarks/aida-mvp-v2/benchmark_manifest.json#L167-L172).

### Reproducibility gaps

The following must be fixed before the model can be a production dependency:

1. The README result does not match the executable V2 result.
2. `question_emb.npz` is tracked but is not listed in the V2 manifest's SHA-256 inventory.
3. The manifest references `QUESTION_REVIEW.md` and `validation_report.json`, but those files are absent from the reviewed tree.
4. The embedding model revision, embedding dimension, preprocessing contract, scikit-learn version, NumPy version, training commit, and coefficient checksum are not recorded in the model bundle.
5. Runtime routing requires NRP, but embedding failures are not converted into a controlled abstention or service response before route execution.
6. Low confidence only produces a UI flag. It does not trigger a defined fallback.
7. The classifier ignores conversation and UI context even though transcript questions often require the identity of the recording currently open.
8. No CI tests prove equivalence among training, artifact export, and runtime inference.

## Deployment Options

| Option                                           | Infrastructure and cost                                                                                                                                                                                | Latency                                                                                                         | Parity risk                                                                                                                  | Testability                                                                                          | Ownership and operations                                                                                           | Verdict                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| **1. Independent Python service**                | Requires another deployable, image, health checks, scaling policy, logs, NRP secret, and service-to-service security. Direct cloud cost may be modest if co-hosted, but operational cost is permanent. | Adds an internal network hop; NRP remains the dominant delay.                                                   | Lowest numerical porting risk because it runs the original sklearn object.                                                   | Can be good after adding real API, unit, integration, and contract tests; none exist now.            | Splits AIDA runtime ownership between NestJS and Python.                                                           | Technically possible, but unjustified for this classifier.           |
| **2. Python behind NestJS**                      | Usually becomes a subprocess or sidecar plus NestJS. It still needs both runtimes, packaging, memory, failure handling, and lifecycle coordination.                                                    | Adds process serialization or internal HTTP overhead; NRP remains dominant.                                     | Low at first, but glue behavior can diverge.                                                                                 | Hardest option to test under concurrency and failure.                                                | Ambiguous ownership; debugging crosses two runtimes inside one product.                                            | **Do not choose.** It combines the disadvantages of options 1 and 3. |
| **3. NestJS inference; offline Python training** | One production runtime and one NRP credential path. The coefficient calculation consumes negligible CPU and memory. Python runs only in reproducible training/evaluation jobs.                         | Removes the internal service hop. End-to-end time is still principally NRP embedding plus retrieval/generation. | Requires a strict exported artifact and golden-vector parity suite. Once that exists, risk is low and continuously testable. | Best contract-test surface: frozen vectors test math without NRP; live canaries test NRP separately. | NestJS team owns runtime behavior; Mio can own model/benchmark lifecycle without carrying production service duty. | **Recommended.**                                                     |

Estimated engineering effort:

- Option 1: little code migration, but approximately 5-10 developer days to package and harden the service, integrate it securely, and establish tests and observability; ongoing operations remain.
- Option 2: approximately 2-4 days of glue initially, followed by the highest maintenance burden.
- Option 3: approximately 3-5 developer days for an exporter, NestJS inference module, NRP client integration, parity tests, and DTO/telemetry contracts.

These are planning estimates, not vendor-price quotations. The important cost difference is an additional always-maintained service, not the few kilobytes of classifier memory.

## Recommended MVP Architecture

```text
Learning Hub UI
  -> NestJS API Gateway
     -> authentication, authorization, rate limits, conversation context
     -> AIDA Router
        1. explicit UI scope override
           current recording + material/resource ID -> transcript_rag
        2. otherwise NRP qwen3-embedding
        3. normalized vector -> exported logistic-regression coefficients
        4. confidence/evidence policy -> selected route or abstain
     -> Retrieval adapter
        catalog_api    -> PostgreSQL metadata/full-text query
        general_rag    -> pgvector search across approved content chunks
        transcript_rag -> pgvector search scoped to active recording/material
        abstain        -> no retrieval and no generation
     -> NRP answer synthesis for grounded routes
     -> canonical response DTO with citations and Learning Hub targets
```

Two refinements are necessary:

1. **Product context must take precedence over text classification.** When the UI says the user is asking within an open recording, route deterministically to `transcript_rag` and carry a canonical `material_id` or `content_resource_id`. A text-only classifier cannot reliably interpret follow-ups such as “What did she mean by that?”
2. **Honest abstention must also be an output guard.** Keep `abstain` as a route, but also abstain after retrieval when evidence is empty, weak, or uncitable. Otherwise an unusual but relevant question can be misrouted and answered without support.

## Porting Contract

Do not port the sklearn pickle. Export a language-neutral, immutable model release containing the following.

### Required model artifact

`router-model.v1.json` or equivalent binary plus JSON manifest:

- schema and artifact versions;
- ordered classes: `abstain`, `catalog_api`, `general_rag`, `transcript_rag`;
- 4 x 4,096 coefficient matrix and four intercepts;
- numeric dtype and array shape;
- exact L2 normalization rule, including zero-norm handling;
- multinomial softmax and argmax/tie behavior;
- confidence threshold and its actual fallback behavior;
- training split, C, class weights, solver, maximum iterations, and random-state policy;
- benchmark ID and hashes of questions, labels, split definition, and cached embeddings;
- Snapshot v3 ID and archive SHA-256;
- NRP embedding endpoint, model name, model revision or provider version when obtainable, and expected dimension;
- source commit, Python, scikit-learn, and NumPy versions;
- creation timestamp and SHA-256 of the exported coefficients.

### Required golden tests

1. **Math parity fixture:** frozen 4,096-element vectors with expected logits, probabilities, confidence, low-confidence flag, and route. NestJS and Python must agree on every route and on probabilities within `1e-6`.
2. **Full benchmark parity:** inference over all 120 cached V2 embeddings must produce 100% identical route labels in Python and NestJS. This checks the port without contacting NRP.
3. **Embedding canary:** a small fixed set of harmless questions with expected dimension, normalization, and vector similarity/checksum tolerances. Run separately against NRP to detect provider drift without confusing it with classifier drift.
4. **Context fixtures:** recording-scoped, material-scoped, conversation follow-up, contextless, empty-query, and conflicting-context cases with expected routing behavior.
5. **Failure fixtures:** NRP timeout, rate limit, malformed vector, wrong dimension, zero vector, missing artifact, and weak evidence. Every case must return a controlled DTO, never an unhandled request failure.

### Required runtime DTO

Preserve or explicitly version:

- request: trimmed `query`, optional `material_id`, optional `content_resource_id`, explicit `scope`, and conversation identifier or summarized context;
- router result: `route`, `confidence`, per-route `scores`, `low_confidence`, artifact version, and embedding model version;
- answer result: grounded answer, canonical material/resource IDs, citations/cards, abstention flag and reason;
- timing: embedding, routing math, retrieval, generation, and total milliseconds;
- trace: request/correlation ID without logging secrets or unrestricted conversation content.

## Porting And Release Gate

The NestJS implementation may be built now, but it should not become the default production router until all gates below pass:

1. Reproduce training from a locked environment and reconcile the 12/20 result with every README and report.
2. Repair the V2 manifest and publish the exact cached embeddings and exported model as immutable, checksummed artifacts.
3. Add at least ten context-aware transcript validation cases; two validation examples are insufficient.
4. Achieve 100% Python/TypeScript route parity over frozen embeddings and the benchmark.
5. Agree on an actual quality gate before opening the held-out test split. A reasonable MVP proposal is at least 80% primary validation accuracy, at least 90% acceptable-route accuracy, and no route below 70% recall, reported with raw counts because the set is small.
6. Define low-confidence and weak-evidence behavior. A flag alone is not a safety policy.
7. Add NestJS unit, contract, integration, timeout, and load tests, plus per-route latency and error dashboards.
8. Spend the 40-question test split once, after the artifact and policy are frozen, and publish the result without further tuning against it.

## Actions By Owner

### Mio: model and evaluation owner

1. Make the 12/20 versus 18/20 discrepancy reproducible and correct the documentation.
2. Lock the Python training environment and create the language-neutral model exporter and manifest.
3. Repair the V2 artifact inventory, including the cached embedding SHA-256 and missing review/validation records.
4. Add context-aware transcript cases and report per-route confusion, recall, confidence calibration, NRP embedding latency, and end-to-end latency separately.
5. Produce the frozen-vector and embedding-canary fixtures for Arnav.

### Arnav: NestJS runtime owner

1. Implement the four-label router as a NestJS module that consumes Mio's versioned artifact.
2. Implement explicit transcript scope overrides and controlled abstention/failure behavior.
3. Add one shared NRP client with timeouts, bounded retries, observability, and secret handling owned by the API Gateway.
4. Implement retrieval interfaces for PostgreSQL full-text search and pgvector; keep route logic independent from storage details.
5. Enforce Python/TypeScript golden parity in GitHub Actions and expose the versioned request/response DTO.

## Bottom Line

The repository has arrived at the correct **four product strategies**, but the deployable boundary is wrong for production and the current quality claim is not reproducible. Keep Mio's Python work as an offline model-development and evaluation tool. Have Arnav run the exported classifier directly in NestJS, where authentication, context, retrieval orchestration, failure policy, and telemetry already belong. This gives the MVP one runtime, one owner for request behavior, no additional service to operate, and an auditable path from a versioned benchmark to a production decision.
