# Production continuity and preserved Batch01–03 precedents

At the post-Batch03 hardening watermark, Batch03 is OBJECTIVE_COMPLETE, 3/3, CLOSED, next action NONE. Always resolve fresh canonical closure pointers rather than treating this prose as live state. Batch01/02 closure and production knowledge are preserved. NONE closes production; a separately authorized bounded audit may proceed without opening a batch. Batch04 and R1.4 require explicit authority.

Read [post-Batch03 continuity evidence and recovery paths](../evidence/post-batch03-hardening-v0.1.md) before diagnosing a repeated interruption, missing funding visibility, QA access failure or successor recovery. That record includes finite binding checks and lightweight measurement fields; it is not an execution queue or a replacement orchestrator.

Run `node operations/orchestration/resolve.mjs` for current canonical truth and `node operations/orchestration/resolve.test.mjs` for deterministic routing/receipt/precedence protection. `actualBatch01()` is an explicit historical trace API retained unchanged. A JSON-array CLI argument is an explicit evidence-envelope evaluation, not current-state discovery or permission to execute; workers must first resolve current state and exit on NONE. Historical records do not override current pointers.

## Scope bootstrap on the existing resolver

Before each execution scope, resolve the three external authoritative sources by exact title (current-use overrides stale attached copies): `CREATOR-OS-CANONICAL-MEMORY-v0.3.8-CURRENT-USE.md`, `CREATOR-OS-SEMANTIC-LEDGER-v0.3.8.md`, `OPERATIONS-LEAD-ORCHESTRATOR-PLAYBOOK-v0.1.md`. Read their complete bytes, version metadata and material updates; do not publish private sources/identifiers into the public repository. Record each resolved source/version/hash and observation time in the private objective receipt. The repository is a consumer of the OS, not a parallel OS store.

Use `resolve.mjs --preflight PRIVATE_ENVELOPE.json`, read ALL `sources[].content` returned, then `resolve.mjs --admit-scope PRIVATE_ENVELOPE.json PRIVATE_READ_ACK.json`. Default `resolve.mjs` stays read-only for discovery/recovery and must not be mistaken for scope admission. The preflight route admits only bounded nonproduction work; production scopes need their existing separate authority and are intentionally rejected by this bounded route. It does not modify any watcher, producer or merge-token permission. Operators must not invoke mutation entrypoints without fresh admission/authority; this cannot prevent an arbitrary actor from bypassing SOPs outside these entrypoints.

Envelope contract (private, never commit): `scope_id`, `scope_kind=BOUNDED_NONPRODUCTION`, `objective`, freshly observed `source_main/observed_main/observed_at`, `completion_channel`, `requested_actions`, `domain_lanes` (always Operations, plus any module actually invoked), `authority={path,sha256,source_ref,allowed_actions,forbidden_actions}`, `external_sources=[{role,path,name,version,content_version,source_ref,sha256,observed_at}]`, `precedent={ref,decision,invariant_comparison,delta_evidence}`. External roles: `creator_os`, `semantic_ledger`, `operations_playbook`. Resolve current metadata even when reusing unchanged bytes; do not silently reuse an expired observation. Unknown Playbook numeric version may use its observed revision/content hash as `content_version`, not an invented version number. Observation freshness: one hour maximum, refresh sooner on an observed change.

Read acknowledgement: `scope_id`, `pack_sha256`, `read_at`, exact `read_sources=[{role,sha256}]`, and reasoned `authority_boundary`, `canonical_over_os_case_study`, `precedent_first`, `retry_escalation`, `independent_progression` under `reasoning`. Missing sources, wrong current title, stale observations, Skill/authority/hash drift, mismatched acknowledgement, changed canonical closure or production actions reject admission. Acknowledgement records accountability; it cannot mechanically prove comprehension. Read-pack output is not execution/quality/CI PASS. Precedent disposition must compare material invariants; departure needs delta evidence. After response-unknown, read back; after repeated method failure, use a permitted proven path only; review rejection never grants channel switching.

Refresh before PR/merge, on scope/source change or expiry. Repository source entries are labelled `worktree-on-base` and bound to actual content hashes: a candidate's local admission is NOT canonical installation. Verify remote exact head/main and protection separately using the existing protected-PR path. Independently blocked cloud verification must remain BLOCKED/UNVERIFIED without preventing admitted local preparation. At completion, retain a sanitized source/version/hash manifest and checkpoint at the shared objective channel; keep raw OS, authority envelope and private source locations private. Recommendation never activates Batch05/R1.4, paid work, configuration change or launch.

## Happy path and handoff (production)

1. Curriculum #3 supplies a versioned selection of existing reserved identities, fresh global purpose/collision evidence and explicit CURRICULUM_READY/UNIQUE_PURPOSE_PASS. Use the registry/hash lookup; never mint lesson IDs or treat batch ID as identity.
2. Practice #2 supplies explicit PRACTICE_PREPROD_READY/CONTRACT_PRECHECK. Operations receives one indexed batch handoff and resolves each lesson independently.
3. Operations confirms authorized source/provider/budget scope, canonical segment/speaker mapping and credential availability. Reuse correct asset hashes/receipts; synthesize only missing segments using the existing approved producer path. No paid calls at playback and no assumption that an earlier ephemeral credential is still available.
4. Ordinary high-quality audio QA → exact version/hash realization binding → one Practice #2 final batch disposition handoff. Accent is a soft target; concrete lexical/corruption/intelligibility/pronunciation/binding defects get targeted versioned repair. Keep accepted siblings.
5. Operations reuses full `vi-VN` support, rights provenance, fixed audio/cache, AI disclosure and existing inference/Dictation scoring boundaries. Stage the exact reviewed catalog/support/assets. Release independently through reviewed PR/Pages after authority and exact final Practice PASS.
6. Minimum desktop/mobile playback and binding, required Practice behavior, result, exact feedback context/backend write ACK and scoped rollback. Reuse the shared feedback-read capability while its invalidation conditions remain absent. Mark each PASS exact pair COMPLETE immediately.
7. At full batch completion, close queue and reconcile current indexes once; retain history and source hashes. Owner sees a consolidated exception/authority report rather than carrying files and commands between happy-path steps.

## Receipts and resumability

Identity for work is `lesson_id + lesson_asset_version + realization_id + stage + asset SHA256`; keep canonical input hash and actual output hash. `reconcileReceipt` returns REUSE only when all bindings match and the receipt passed. A changed realization/input/output is a binding mismatch, not permission to overwrite. A partial upload is MISSING/INCOMPLETE for only that operation. Confirm branch/tree/deployment truth after a response or stream interruption before retrying; a completed remote action can lack a usable local response.

The Batch01 immutable-asset receipt index records existing upload references. Correct assets are never regenerated or reuploaded. Natural learner playback and gate outcomes are carried by their original release evidence, not re-certified by this resolver.

## Recover solved blockers before escalation

Treat unknown funding as an internal reconciliation state, not an automatic Owner blocker. Reuse the proven Batch02/03 read-only Platform Billing/Usage route, permitted safe session recovery, secure repository producer preflight and outstanding reservation accounting. Current funding/access evidence is still mandatory; historical credit or successful synthesis cannot authorize a new call. For repeated tool failures, reconcile actual remote state and change to a permitted proven method. Honor method-specific browser/authentication approval; the historical Batch03 fallback grant is scope-limited. Stop only at the exact evidenced current failed invariant after permitted recovery and independent progression, with a resume condition.

Use the linked recovery/measurement record for finite producer/QA binding checks before expensive CI and for successor completion-channel pointers. Do not ask Owner to relay routine room status.

## Exception routes

| Trigger | Responsible lane | Resume boundary |
| --- | --- | --- |
| Duplicate/global purpose/Curriculum ambiguity | CURRICULUM_3 | Explicit corrected/versioned disposition |
| Practice/frozen scoring conflict, missing final realization disposition | PRACTICE_2 | Exact pair decision; Operations does not substitute |
| Concrete audio or support defect | OPERATIONS_4 | Only affected segment/bundle version; preserve siblings |
| Wrong hash, stale receipt or uncertain partial remote action | OPERATIONS_4 | Reconcile actual bytes/branch/receipt first |
| Repeated failure using same method | OPERATIONS_4 | Change method/capability; do not loop |
| Missing actual authority/budget/publication scope | OWNER | Concrete reviewable approval; no repeated request for existing authority |
| Breaking frozen contract | OWNER + owning lane | Stop; never weaken gates to pass |
| Isolated blocked lesson | Its owning lane | Continue all independent actionable lessons |
| Residual subtle accent uncertainty | Feedback → exception → versioned replacement | Nonblocking release uncertainty |

## Historical Batch01 → Batch02 readiness boundary (superseded activation route)

Operations readiness work and actual-trace replay are complete. The next lane is Curriculum #3 for Batch02 versioned preproduction inputs, followed by Practice #2. No Batch02 production/queue or paid request starts here. Work cannot activate another project conversation; that remains a cross-lane activation capability gap, explicitly recorded rather than hidden as full autonomy.

Existing GitHub Actions/Pages release runners provide the execution surface. Reuse their bounded per-pair evidence path when concrete Batch02 inputs arrive; this readiness step does not add a scheduler, IAM, secrets service, provider framework or new infrastructure. Before the next real synthesis, check the existing secure credential/session and remaining approved spend through the execution path; readiness replay does not certify future provider availability.

## Preserved Owner authorization 2026-10-05

[Passive watcher pilot](watchers/README.md) supersedes the earlier Owner prompt-courier handoff. Standing prepaid audio permission covers official1000 production/valid targeted repair, with actual budget reconciliation and paid-branch-only OWNER_FUNDING_REQUIRED; no per-action reapproval. The bounded resolver and frozen lane decisions remain unchanged.
