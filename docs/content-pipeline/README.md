# Mặn — Shared Artifact Registry

Phase 3 is **CLOSED**. The Content Production Pipeline Contract v0.2 is now **FROZEN**. This directory still does not open a lesson production queue.

## Two stores, one lookup

The public repository contains **only metadata and orchestration files**. Detailed workbooks remain in the access-controlled ChatGPT Library at the exact paths indexed in [registry/artifacts.json](registry/artifacts.json). Publishing those workbooks to this public repository would expose the Curriculum and Practice specifications.

| Object | Source of truth |
| --- | --- |
| Artifact identity, current version, lifecycle, dependencies, hash, next lane | `registry/artifacts.json` and `registry/pipeline.json` on reviewed `main` |
| Workbook contents, including the frozen v0.3 interface | Exact Library file named by the registry, verified against SHA-256 |
| Future lesson rows | `registry/lessons.json`, currently empty; `registry/lesson-registry.schema.json` is the integration envelope |
| Chat attachment | Draft, export or human review only; never the cross-lane handoff record |

An agent in any lane reads the GitHub `main` registry (public read), selects the artifact's `id@version`, searches the connected Library by the **exact filename/path**, downloads it directly through its own Library access, and verifies its SHA-256 against the registry. Duplicate Library filenames are resolved by path and hash. No chat attachment transfer is part of the happy path. Library access still depends on the account/connector permissions of the acting lane; a room cannot call another room automatically.

The first five workbook records are the Curriculum v0.1, Practice v0.1, integration Candidate v0.1, Freeze-ready v0.2, and **unchanged** Frozen Curriculum ↔ Practice v0.3. Their metadata and checksums were recorded from accessible Library files. Workbook data is not committed to the public repo.

## Read current state without guessing

```sh
node docs/content-pipeline/validate.mjs next
node docs/content-pipeline/validate.mjs current content-pipeline-contract
node docs/content-pipeline/validate.mjs route PRACTICE_CONFLICT
```

After downloading the five indexed workbooks into a local folder, verify their bytes:

```sh
node docs/content-pipeline/validate.mjs next --local-artifacts /path/to/downloaded-files
```

The validator fails for a missing, duplicated or inconsistent registry record, broken version chain, missing dependency, invalid route, or mismatched local SHA-256. `HASH_VERIFIED` means the workbook bytes were checked; it does **not** claim every workbook cell has been semantically converted or reviewed.

## Lifecycle and routing

Artifact statuses are `DRAFT`, `CANDIDATE`, `REVIEW_READY`, `FREEZE_READY`, `FROZEN`, `SUPERSEDED`. `content-pipeline-contract@v0.2` is **FROZEN**; `v0.1` remains `SUPERSEDED`. Curriculum ↔ Practice `v0.3` remains **FROZEN**. The production queue stays disabled. The pre-Batch-01 Global-Readiness non-breaking extension is recorded: canonical English lesson assets and learner-support locale bundles have separate identity and versioning; Vietnamese (`vi-VN`) remains full/default/required for Mặn V1 official publication.

`registry/pipeline.json` maps exception codes deterministically: `RETURN_TO_CURRICULUM` and `DUPLICATE` → #3; `PRACTICE_CONFLICT` → #2; `IMPLEMENTATION_ISSUE` → #4; genuine `OWNER_DECISION_REQUIRED` → Owner. Normal sequence: Curriculum → Practice → pre-production gate → production queue → #4 → QA → Calibration → registry update. A valid pre-production plan does not prove final Practice grounding: produced `target_anchors[]` and post-production validation are still required.

Routing files specify **deterministic handoff**, not background execution or chat-to-chat calls. The next lane must be activated in its own room or automation before doing work. Future automation can watch merged registry changes, validate dependencies and notify a lane; none is claimed to exist now.

## Global Lesson Registry foundation

`registry/lessons.json` contains zero rows. Its schema reserves stable `lesson_id`, `unique_purpose_id` and classification, Curriculum/Practice spec references and versions, pre-production/final readiness, batch assignment, production/QA/calibration references, blocker, and next responsible lane. Detailed Curriculum/Practice state semantics remain owned by #3/#2. The Pipeline Contract is frozen, but do not import/populate the 1,000 concept map, open Batch 01, or enable the production queue until #4 completes the separate Production Readiness / Batch 01 preparation gate.

## Pre-Batch-01 global-readiness gate

`global-readiness-compatibility-check@v0.1` is indexed in the Shared Artifact Registry. Its result is **NON_BREAKING_EXTENSION_NEEDED**: Curriculum, Practice and frozen contracts are already learner-support-locale-neutral, but current Product/Tech content wording still couples official English lessons to Vietnamese translation as a core field. #4 must formalize a separate support-locale bundle/reference layer before Batch 01. This is non-breaking: lesson identity, Unique Purpose, progression, target anchors and frozen contracts stay unchanged. #4 implemented the reference-only envelope and policy in `registry/support-bundles.schema.json`, `registry/support-bundles.json` and `registry/support-locale-policy.json`; no lesson or support bundle records were populated.

## Batch 01 preparation

[`registry/batch-01-readiness.json`](registry/batch-01-readiness.json) remains the machine-readable preparation record. Curriculum #3 has now published the first versioned reserved-identity snapshot and calibration selection:

- `global-lesson-registry-snapshot@v0.1`: all 1,000 reserved lesson identities/purposes, kept in the access-controlled Library.
- `batch-01-curriculum-selection@v0.1`: 12 proposed calibration lessons using existing IDs only.
- `registry/batch-01-curriculum-inputs.json`: public orchestration metadata confirming `UNIQUE_PURPOSE_PASS` + `CURRICULUM_READY` for the selected IDs without exposing Curriculum content.

The proposed 12 are not a new Curriculum truth or fixed production quota. The design uses one complete `SF065` A1→C2 spiral chain plus one contrasting lesson per level, yielding two lessons at each A1–C2 level, both strands, 3 `NEW` and 9 `OVERLAP_JUSTIFIED` paths, and 12 distinct primary listening skills/phenomena. `DUPLICATE=0`; all future RESERVED purposes remain protected by the snapshot.

Batch 01 is still **not open** and the production queue stays disabled. Practice #2 has published `batch-01-practice-preproduction-evidence@v0.1`: all 12 selected lessons are `PRACTICE_PREPROD_READY`, with `Final_PRACTICE_READY=false`; `Anchor_Intent` remains planning-only and produced `target_anchors[]` are still required for final grounding. Next action is `VALIDATE_CONTRACT_PRECHECK_AND_QUEUE_SAFETY` → #4. #4 validates `CONTRACT_PRECHECK_VALID`, source/version references, queue safety and the four-gate `PRODUCTION_READY` composite before any separate queue-opening change. PNG9 empirical calibration remains pending for mass production.

## Updating the registry

Create a separate branch, place a new version in the access-controlled artifact store, verify its content/hash, update this registry and machine-readable routing only as allowed by lane ownership, validate, inspect diff, then PR/merge and read the files back on `main`. The freeze record for v0.2 is `registry/freeze-manifests/content-pipeline-contract-v0.2.json`. Never overwrite a `FROZEN` workbook; use versioned governance for breaking changes. Repository write permission is not freeze authority. Changes to production Firebase, UI or Rules are outside this foundation.

## Learner-support locale boundary

The English `canonical_transcript`, `segments[]`, `target_anchors[]`, `lesson_id` and Unique Purpose remain the one canonical lesson asset. Learner translations, glosses and explanations live in separately versioned support bundles keyed by `lesson_id`, canonical asset version and locale; optional `support_bundle_refs[]` in each lesson registry record points to those bundle versions. The empty support registry contains reference metadata only, never translation text or private lesson content. Support-only edits increment bundle version and do not silently rewrite English, anchors or Curriculum/Practice states. Translations may map to stable segment or anchor IDs but are never the source of offsets.

For an official Mặn V1 lesson, publication in the Vietnamese experience requires a matching `vi-VN` bundle with full coverage and passing QA. `vi-VN` remains the default. Additional locales can reference the same English lesson without a new lesson ID or Unique Purpose. This is a publication policy, not a fifth preproduction gate. Existing pilot content and private user lessons are unchanged; the new reference fields are optional and there is no migration or deploy in this step. Future ingestion writes English to the canonical asset, writes Vietnamese to an access-controlled support bundle, verifies alignment/QA and rights, then publishes only when the V1 support policy passes.
