# Mặn — Content pipeline

Current operational truth is **Batch02 OBJECTIVE_COMPLETE, 12/12 COMPLETE, queue CLOSED, remaining 0, active exceptions 0, next action NONE**. PR138 is the preserved learner release; PR139 is canonical close. No Batch03 is opened.

Read [current closure index](registry/batch-02-closure-evidence-index.json), its hash-bound [completion checkpoint](registry/batch-02-completion-checkpoint.json), then [pipeline current pointers](registry/pipeline.json). Run `node operations/orchestration/resolve.mjs` for current state. Batch01 registries and Batch02 preproduction/preparation/pilot records are historical evidence, not current routing. They remain addressable and unchanged; their embedded next actions and CURRENT labels are scoped to their recorded revision. The closure index, not artifact-specific version lookup, selects current operational truth.

The public repo contains approved learner catalog/audio/support and sanitized operational indexes. Curriculum/Practice workbooks and full QA packets remain access controlled. Frozen Pipeline v0.2 and Curriculum ↔ Practice v0.3 are unchanged. Historical evidence is retained under `registry/history/batch-01-pre-close-20261005`; historical routes/counts do not drive current execution.

Accent is a soft quality target. Fine accent uncertainty is accepted; concrete learner-outcome defects go through feedback → exception routing → versioned replacement. Desktop Chromium and Pixel5 mobile emulation are verified; physical devices, acoustic certification and calibrated proficiency are not claimed.

Reusable existing capabilities include fixed/cacheable audio, scoped catalogs, inference/Dictation separation, feedback context/write and shared read capability, scoped rollback, and per-pair release verification. No paid synthesis occurs at learner playback.

**Historical v0.1 failure, superseded for the v0.2 receipt route:** The real event watcher read canonical and created [receipt PR109](https://github.com/bttdavid1948-sudo/my-dictation-app/pull/109), but automatic approval rejected its merge for unrecognized exact-merge authorization. Event activation is observed; unattended canonical transition is BLOCKED, not PASS. Both feasibility probes are paused; no Batch02 production starts. See the current pilot record for exact attempts and the smallest supported authority-propagation option.

## Historical scoped activation result2026-10-05

**WATCHER_SCOPED_CANONICAL_RECEIPT_PASS** supersedes the earlier current blocker/stop instructions for this receipt-only route. Owner explicitly authorized the minimal repository gate after PR110. PR111 installed it; the real merge event activated Work, which created PR112. CI run37274836503 and trusted gate run37274856518 PASS; the gate merged112 at2026-10-05T06:55:14Z, receipt observable at f6e9b3b. PR109 is superseded historical failed evidence, never merged as proof. Current next action: **BATCH_02_ORCHESTRATED_PREPRODUCTION_PILOT → CURRICULUM_3**, then owning Practice disposition. Batch02 production remains closed; receipt-only gate cannot merge semantic/content/code transitions. Audio standing authority is unchanged; no audio spend. See registry/batch-02-watcher-pilot.json for indexed canonical evidence.
