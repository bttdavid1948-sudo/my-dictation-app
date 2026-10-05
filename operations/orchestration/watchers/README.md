# Official Mặn 1000: passive activation pilot v0.1

Owner standing decisions are in [authority](../../../docs/content-pipeline/registry/official-1000-production-authority.json). Current pilot truth is [pilot registry](../../../docs/content-pipeline/registry/batch-02-watcher-pilot.json). Batch01 stays CLOSED12/12; Batch02 production stays closed until execution feasibility and owning-lane inputs are proved.

## Smallest supported experiment

GitHub merge-only PR webhook is supported. Direct file/push trigger is not advertised. Register one event automation scoped to the authority/pilot PR, without an independent schedule. On merge, the automation reads fresh canonical main and records `activation-probe-v0.1` in a scoped receipt PR. The probe performs no Curriculum/Practice decisions, no audio and no learner release. A repeated wake reuses the exact receipt. Receipt creation/merge must be observed remotely; registration is not execution proof. If no write tools or required lane context are available, record the exact gap and STOP pilot expansion. Do not silently downgrade to notification-only or build a framework.

## After probe

Activate versioned lane templates only after successful observed execution, authority separation and required private contract/input access. Curriculum starts from reserved identities and owning-lane disposition; Practice follows explicit Curriculum handoff; Operations follows explicit preproduction PASS. Merge events wake all lane watchers, each selects only its current work and silently exits otherwise. Initially serial scoped transitions prevent collisions; re-read canonical SHA before writing and use exact receipts. No durable lock or unattended throughput is claimed by this feasibility probe. An hourly scheduled watchdog is a separate fallback only after a missed-event/direct-write need is observed. Event watcher failure is routed, never masked by rerunning PASS gates.

## Scope and prepaid money

The standing authorization removes per-action approval, not funding verification. Existing secure provider path and hard controls remain. Reserve conservative expected next cost against actual funded prepaid balance minus unsettled/in-flight spend. On insufficient funding route OWNER_FUNDING_REQUIRED for the paid branch with minimum top-up and estimate basis. Unknown balance/cost requires a precise reconciliation/access exception, not an invented exhaustion/top-up. Independent non-audio work continues. Never recharge or create commitments.

These plain JSON/instruction templates are versioned and portable without native Skills. Package into Skill/Plugin only after production evidence justifies it. Product B needs independent authority/funding; no generic framework is built here.

## Historical result before fresh v0.2 probe2026-10-05

PR108 canonicalized the two standing decisions. Its event actually activated the worker, which read fresh canonical and independently created one receipt file/branch/PR109. Automatic approval rejected the exact merge, citing unrecognized merge authorization. The receipt is only on that branch and its PASS-labelled preparation is not accepted as canonical probe PASS. Both event and one-shot scheduled fallback probes are paused. The scheduled run request was accepted asynchronously; completion was not observed and is not claimed. STOP expansion at the approval-authority propagation gap. Do not retry/bypass the rejected merge, create a GitHub Actions auto-merge workaround, or call a root/manual merge proof of unattended activation. The smallest next evaluation is supported recognition of narrowly scoped standing watcher merge authority; a one-off exact PR109 approval would only close the receipt, not prove future production autonomy. No lane-template workers or Batch02 production have been activated.

## Current scoped activation result2026-10-05

**WATCHER_SCOPED_CANONICAL_RECEIPT_PASS** supersedes the earlier current blocker/stop instructions for this receipt-only route. Owner explicitly authorized the minimal repository gate after PR110. PR111 installed it; the real merge event activated Work, which created PR112. CI run37274836503 and trusted gate run37274856518 PASS; the gate merged112 at2026-10-05T06:55:14Z, receipt observable at f6e9b3b. PR109 is superseded historical failed evidence, never merged as proof. Current next action: **BATCH_02_ORCHESTRATED_PREPRODUCTION_PILOT → CURRICULUM_3**, then owning Practice disposition. Batch02 production remains closed; receipt-only gate cannot merge semantic/content/code transitions. Audio standing authority is unchanged; no audio spend. See registry/batch-02-watcher-pilot.json for indexed canonical evidence.

## Curriculum passive-activation lane v0.1

Owner authorized a standing Curriculum #3 lane for `OFFICIAL_MAN_1000_ONLY`. The trusted merge surface is deliberately smaller than a content/code writer: candidate PRs may only carry the versioned Curriculum preproduction disposition plus the canonical routing/index mirrors listed in `curriculum-transition-allowlist.v0.1.json`. The gate fails closed on any Practice/Operations override, queue enablement, frozen-contract change, transcript/content/audio mutation, private/user lesson scope or arbitrary code mutation. Curriculum semantic work still comes from the versioned private Curriculum specification + full reserved-identity snapshot; the public repo stores only sanitized transition evidence. PASS routes to Practice #2; true breaking authority routes Owner. No action/already processed is silent and idempotent.


## Practice passive-activation lane v0.1

Owner authorized a standing Practice #2 lane for `OFFICIAL_MAN_1000_ONLY`. It reuses the same trusted-main, State Resolver and scoped merge pattern as Curriculum. Candidate Practice transitions are limited to versioned preproduction disposition evidence plus canonical routing/index mirrors. The gate fails closed on Curriculum semantic mutation, Operations/audio/production work, queue enablement, final PRACTICE_READY/produced CONTRACT_VALID claims, frozen-contract/Product Direction mutation, private/user scope or arbitrary code/content changes. PASS may issue `PRACTICE_PREPROD_READY` and specification-level `CONTRACT_PRECHECK_VALID`; only when all four preproduction gates are explicit PASS may it canonicalize `PRODUCTION_READY` and route `OPERATIONS_4`. Practice conflicts remain in Practice; Curriculum defects route Curriculum; breaking authority routes Owner.

Repository gate installation is distinct from activation of a persistent semantic worker. Current tool surface does not expose registration of a new merge-event Work worker, so active watcher registration must be evidenced separately; repo configuration alone is never reported as a live watcher.
