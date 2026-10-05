# Official Mặn 1000: passive activation pilot v0.1

Owner standing decisions are in [authority](../../../docs/content-pipeline/registry/official-1000-production-authority.json). Current pilot truth is [pilot registry](../../../docs/content-pipeline/registry/batch-02-watcher-pilot.json). Batch01 stays CLOSED12/12; Batch02 production stays closed until execution feasibility and owning-lane inputs are proved.

## Smallest supported experiment

GitHub merge-only PR webhook is supported. Direct file/push trigger is not advertised. Register one event automation scoped to the authority/pilot PR, without an independent schedule. On merge, the automation reads fresh canonical main and records `activation-probe-v0.1` in a scoped receipt PR. The probe performs no Curriculum/Practice decisions, no audio and no learner release. A repeated wake reuses the exact receipt. Receipt creation/merge must be observed remotely; registration is not execution proof. If no write tools or required lane context are available, record the exact gap and STOP pilot expansion. Do not silently downgrade to notification-only or build a framework.

## After probe

Activate versioned lane templates only after successful observed execution, authority separation and required private contract/input access. Curriculum starts from reserved identities and owning-lane disposition; Practice follows explicit Curriculum handoff; Operations follows explicit preproduction PASS. Merge events wake all lane watchers, each selects only its current work and silently exits otherwise. Initially serial scoped transitions prevent collisions; re-read canonical SHA before writing and use exact receipts. No durable lock or unattended throughput is claimed by this feasibility probe. An hourly scheduled watchdog is a separate fallback only after a missed-event/direct-write need is observed. Event watcher failure is routed, never masked by rerunning PASS gates.

## Scope and prepaid money

The standing authorization removes per-action approval, not funding verification. Existing secure provider path and hard controls remain. Reserve conservative expected next cost against actual funded prepaid balance minus unsettled/in-flight spend. On insufficient funding route OWNER_FUNDING_REQUIRED for the paid branch with minimum top-up and estimate basis. Unknown balance/cost requires a precise reconciliation/access exception, not an invented exhaustion/top-up. Independent non-audio work continues. Never recharge or create commitments.

These plain JSON/instruction templates are versioned and portable without native Skills. Package into Skill/Plugin only after production evidence justifies it. Product B needs independent authority/funding; no generic framework is built here.
