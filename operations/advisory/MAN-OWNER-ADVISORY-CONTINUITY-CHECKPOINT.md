# MẶN — OWNER ADVISORY CONTINUITY CHECKPOINT
Version: v0.1 — 2026-10-15
Status: OWNER-APPROVED DECISION RECORD; PUBLICATION REVIEW REQUIRED FOR GITHUB MAIN
Role: #1 Integration Advisor / Creator Liaison; advisory continuity, NOT production authority.

## Precedence and update rule
Owner-initiated updates ONLY, on explicit Owner request. No automatic polling, background updates or recurring tasks. On each requested update, reconcile canonical main, State Resolver, current execution receipts and this checkpoint; append dated delta, update status and synchronize Drive archive after review. Drive is ARCHIVE_ONLY / NON_AUTHORITATIVE. Never infer production permission, PR merge, Firebase change or pilot approval from this document. Reuse valid PASS.

## Owner decisions — confirmed 2026-10-15
D-01: All signed-in history reads/writes are isolated by verified Firebase UID; a new UID has zero history unless it already owns valid new-store data. Shared browser must never leak A's history to B.
D-02: Returning limited-pilot accounts use one-time lazy migration ONLY for legacy records with reliable ownership evidence. Idempotent, partial-failure safe; verify new-store write before retiring old active read/write. Do not silently assign unowned legacy records to current UID, or delete them indiscriminately. Guest history stays separate. Direction approved; production migration NOT authorized or completed.
D-03: Confirmed risks require root-cause analysis, smallest sufficient fix, targeted tests, rollback, cost and maintenance assessment. RESOLVED requires matching acceptance evidence.
D-04: Unverified risks require proportionate verification; fix if confirmed. BLOCKED is not FAIL; document access blockers and minimal Owner assistance without blind retries.
D-05: Keep architecture lightweight, maintainable, upgradable, quota/cost conscious, scalable. Distinguish registered, DAU, concurrent; model 10/100/1000 and do not claim load capacity without evidence. Avoid speculative infrastructure.
D-06: Existing production gates unchanged: cloud progress OFF; no automatic deployment, Rules/Auth/IAM/billing change, production migration, new batch/R1.4, internal pilot or public launch.
D-07: Owner approves publication of this Mặn-owned continuity record and an archived Drive copy in the Mặn read-first/succession folder. Future rolling updates ONLY when Owner instructs.

## Time-bounded evidence at 2026-10-15
Batch04 6/6 CLOSED / OBJECTIVE_COMPLETE; no next production batch. PR #183 OPEN/DRAFT/NOT MERGED, head 24a15c0e39cc7fe7d0af1272aaa6a41ad57f99f1 at last GitHub check. #4 reported Milestone7 checkpoint v8, not independently read back from private channel. D1 direct owner_feedback Firestore create abuse/cost exposure: local pause candidate prepared, not deployed. D2 legacy Practice history keys man_batch02_evidence_v1 and man_comprehension_history_v1 lack per-record UID: attribution gap, not proven cloud disclosure. D3 latest READY backup, billing continuity, budget alert recipients and delivered ACK remain unverified. Existing backup schedule not proof of latest READY. Learning core has substantive PASS; end-to-end real-user journey, account switching, crash/storage denial, physical browsers and cloud progress not fully accepted. Internal pilot CONDITIONAL / not approved; broad public launch NOT_READY.

## Next bounded acceptance
Reconcile current canonical and #4 receipts. Prepare UID-scoped history cutover tests guest→A→B→A, new UID zero, verified pilot lazy migration, reload/crash/denied storage/concurrent tabs. Prepare containment of feedback abuse/cost with truthful UI and support fallback. Read-only verify Rules/Auth, backup, billing, alert delivery when access allows. Adopt privacy/deletion/retention/support and incident owner through separate Owner decisions. Assess Firestore reads/writes/hot docs, listeners, asset bandwidth, cost and concurrency by nonproduction evidence. For each risk report CONFIRMED/UNVERIFIED/PREPARED/TESTED/RESOLVED/BLOCKED/OWNER_DECISION_REQUIRED, source watermark, acceptance, rollback and remaining authority. STOP after Owner-requested bounded work.

## Resume pointers
Canonical: https://github.com/bttdavid1948-sudo/my-dictation-app
Prelaunch: operations/prelaunch/checkpoint.json ; operations/prelaunch/D1-D3-decision-package.md
PR183: https://github.com/bttdavid1948-sudo/my-dictation-app/pull/183
Drive resolver: https://docs.google.com/document/d/1lPocjsIDigFhmyq61N4_lYTOPUzWdvFJl0Z0oSDHTBo/edit
Drive matrix: https://docs.google.com/document/d/1XQp1hBaQG5SkrGAsRZJCvYt04sYPhT2j8XLyZCq_djM/edit
Do not ask Owner to repeat D-01 through D-07 unless newer Owner instruction supersedes.