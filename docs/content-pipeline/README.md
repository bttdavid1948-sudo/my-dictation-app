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

Artifact statuses are `DRAFT`, `CANDIDATE`, `REVIEW_READY`, `FREEZE_READY`, `FROZEN`, `SUPERSEDED`. `content-pipeline-contract@v0.2` is **FROZEN**; `v0.1` remains `SUPERSEDED`. Curriculum ↔ Practice `v0.3` remains **FROZEN**. The production queue stays disabled. A narrow pre-Batch-01 Global-Readiness check found **NON_BREAKING_EXTENSION_NEEDED**: #4 must first separate learner-support locale data from canonical English lesson identity/content while keeping Vietnamese (`vi-VN`) full/default/required for Mặn V1.

`registry/pipeline.json` maps exception codes deterministically: `RETURN_TO_CURRICULUM` and `DUPLICATE` → #3; `PRACTICE_CONFLICT` → #2; `IMPLEMENTATION_ISSUE` → #4; genuine `OWNER_DECISION_REQUIRED` → Owner. Normal sequence: Curriculum → Practice → pre-production gate → production queue → #4 → QA → Calibration → registry update. A valid pre-production plan does not prove final Practice grounding: produced `target_anchors[]` and post-production validation are still required.

Routing files specify **deterministic handoff**, not background execution or chat-to-chat calls. The next lane must be activated in its own room or automation before doing work. Future automation can watch merged registry changes, validate dependencies and notify a lane; none is claimed to exist now.

## Global Lesson Registry foundation

`registry/lessons.json` contains zero rows. Its schema reserves stable `lesson_id`, `unique_purpose_id` and classification, Curriculum/Practice spec references and versions, pre-production/final readiness, batch assignment, production/QA/calibration references, blocker, and next responsible lane. Detailed Curriculum/Practice state semantics remain owned by #3/#2. The Pipeline Contract is frozen, but do not import/populate the 1,000 concept map, open Batch 01, or enable the production queue until #4 completes the separate Production Readiness / Batch 01 preparation gate.

## Pre-Batch-01 global-readiness gate

`global-readiness-compatibility-check@v0.1` is indexed in the Shared Artifact Registry. Its result is **NON_BREAKING_EXTENSION_NEEDED**: Curriculum, Practice and frozen contracts are already learner-support-locale-neutral, but current Product/Tech content wording still couples official English lessons to Vietnamese translation as a core field. #4 must formalize a separate support-locale bundle/reference layer before Batch 01. This is non-breaking: lesson identity, Unique Purpose, progression, target anchors and frozen contracts stay unchanged.

## Batch 01 preparation

[`registry/batch-01-readiness.json`](registry/batch-01-readiness.json) is the machine-readable preparation record. `PAUSED_PRE_GLOBAL_READINESS` means Batch 01 is **not open**: there are no selected lessons or proposed count, no versioned reserved-identity snapshot, and the production queue stays disabled. This record does not certify per-lesson gates.

After #4 completes and verifies the non-breaking support-locale separation, the pipeline returns to the existing Batch 01 flow: #3 publishes a versioned Global Lesson Registry snapshot covering future RESERVED purposes and a justified A1–C2 calibration selection using existing IDs; #2 supplies Practice preproduction evidence; #4 checks the four explicit preproduction gates, contract references and queue safety. `DUPLICATE` or `OPEN` purpose conflicts block production. The count is proposed with evidence, not prescribed here; PNG9 empirical calibration remains required before mass production. Each lane reads shared canonical files directly, without Owner transferring attachments.

Opening Batch 01 or enabling the production queue requires a separate reviewed change backed by the snapshot and per-lesson evidence. Production and QA status references remain owned by #4; this preparation does not redefine Curriculum or Practice semantics.

## Updating the registry

Create a separate branch, place a new version in the access-controlled artifact store, verify its content/hash, update this registry and machine-readable routing only as allowed by lane ownership, validate, inspect diff, then PR/merge and read the files back on `main`. The freeze record for v0.2 is `registry/freeze-manifests/content-pipeline-contract-v0.2.json`. Never overwrite a `FROZEN` workbook; use versioned governance for breaking changes. Repository write permission is not freeze authority. Changes to production Firebase, UI or Rules are outside this foundation.
