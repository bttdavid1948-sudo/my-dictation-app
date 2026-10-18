# PR183 — Production readiness review / checkpoint

Status: DRAFT_PREPARED / PRODUCTION_NO_GO. Owner scope: REVIEW + PREPARE, with minimal nonproduction fixes. Observation: 2026-10-14 UTC. No merge, deployment, production configuration/data mutation or migration performed.

## Exact objects and inheritance

- Canonical main: `0d7e2405885b837f251de08cc23632dca6f3cfc8`.
- **Exact reviewed PR183 head: `24a15c0e39cc7fe7d0af1272aaa6a41ad57f99f1`**, tree `141f4829d353df2d39b83e0909e14c638328bf7c`; draft/open/unmerged.
- Final Milestone E handoff: `04375b2c8abe5485570ab8fbcdfaa7dae0efe6dc`; checkpoint blob `32250ac1805d6a2a7658223f679912deead4c1d3`, evidence blob `0ad87870f1bb8bee9b1814f6b05b12db25233103`, both fetched again. Earlier Library E1 is superseded for completion by this immutable E handoff, not used as final evidence.
- This review branch adds a **separate fix proposal** on that handoff. It does not update PR183, main or any production runtime. Review SHA above remains the object of the verdict; proposed fixes have their own content hashes in `PR183-READINESS-EVIDENCE.json`.
- Fresh canonical resolver: Batch04 6/6 COMPLETE, CLOSED/NONE; no Batch05/R1.4. Forms Milestone E v3 frozen; no Forms work. Older Creator OS case-study batch state does not override current Mặn state.
- Fresh bounded scope admitted using existing resolver, current-use OS/ledger/playbook and owning Skill. Sanitized hashes are in the evidence JSON. Private authority/source locations and contents are excluded.

## Decision table

| Scope | Verdict | Evidence / exit condition |
|---|---|---|
| Review and retain PR183 as nonproduction candidate | **GO** | Exact-head state, wrapper/legacy, isolated host and inherited LOCAL_STAGING CI succeeded; evidence retained below. |
| Production deployment of PR183 as an account-cloud-history release | **NO-GO** | Normal app has no cloud transport/cutover. Demo-only emulator adapter cannot become production by changing a project ID. Current deployed Rules do not have a newly verified progress contract. |
| UI/picker/UID fixes as a separate release with cloud OFF | **CONDITIONAL** | Incorporate reviewed minute-ACK fix; targeted browser/profile acceptance on final SHA; current read-only Auth/Rules compatibility, release artifact allowlist, rollback and exact-head required checks. Owner must separately authorize merge/deploy. |
| Proposed fixes in this review branch | **GO for nonproduction review; not production-ready** | 11 new UNIT checks PASS, 28 learner and 15 cloud regression checks PASS. New browser/SDK acceptance remains UNVERIFIED. |
| New production progress Rules / learner-data cutover | **NO-GO now** | Obtain current Rules, compose additive proposal preserving all app paths, test against actual production SDK/API/schema, approve retention/quota and conflict/durability policy, then separately authorize exact rollout. |

## Exact diff audit (29 files)

Every changed path, Git blob and additions/deletions is listed in `PR183-DIFF-INVENTORY.json`.

| Classification | Files | Production consequence |
|---|---:|---|
| Production runtime | 3 | `index.html`, `assets/learner-progress.js`, `assets/practice-runtime-wrapper.js`: picker/history/audio guards, UID/private saves, local latest-session progress. These execute in the normal app if deployed. A comment saying nonproduction is not a feature flag. |
| Test regression | 7 | Learner/private/wrapper assertions and fixtures. No runtime import. |
| Demo host/protocol/acceptance | 11 | All under `nonproduction/learner-reliability/`; cloud bridge, emulator transport, loopback servers, browser/SDK tests. Not imported by normal index/assets. |
| Emulator Rules/config/test fixtures | 5 | Two standalone Rules, two emulator JSON files and Rules test. **Never deploy as production Rules.** Progress fixture denies all other app paths; host fixture additionally allows bounded private CRUD and owner profile GET, but does not allow profile-minute writes or feedback paths. |
| Demo dependencies | 2 | `package.json` and lockfile v3, 707 package entries. Exact Firebase 10.14.1, rules-unit-testing 3.0.3, firebase-tools 13.35.1, Playwright 1.63.0. Normal app retains Firebase compat 9.22.1. Lock is reproducibility evidence, not a vulnerability audit. No git/file dependencies found; three install-script flags, CI uses `npm ci --ignore-scripts`. |
| Isolated CI | 1 | Push-only exact nonproduction branch; read-only contents, no production credentials/deploy. Final workflow runs host acceptance only; past Rules/fault receipts are reuse evidence, not coverage rerun by every push. It is not an additional required branch check. |

No root production Firebase deploy config or production Rules change is introduced by PR183. Host guards enforce loopback/demo identity; browser tests use mock UID tokens, not Google production Auth. The static hosting packaging/config endpoint was unavailable to this integration; **artifact inclusion/exclusion remains UNVERIFIED**. Do not assume unimported files are excluded from a root-based Pages artifact. A future production package must explicitly exclude `nonproduction/`, tests, Rules fixtures, dependency tooling and private evidence; verify the actual built artifact before publication.

## Evidence and reuse

| Layer | Reviewed head / evidence | Limit |
|---|---|---|
| UNIT | Milestone E learner56, cloud15; wrapper270 traces /90 resume cases; private regressions retained | Bindings retained, no broad rerun for unchanged code. |
| BROWSER | Desktop/mobile popup14 and native WAV2: run38571799565; its index bytes match reviewed head. Final wrapper/default/legacy run38572961927 covers later wrapper cleanup. | Touch/emulated Chromium, not physical iOS/Safari or acoustic QA. |
| EMULATOR | Rules27 groups and SDK3: run38565029579; Rules, test, protocol and SDK-test source bytes compared again against reviewed head and match. | Demo ownership/schema/CAS, not deployed production Rules or Google Auth. |
| BACKEND DEMO faults | Fault5 run38567081273; private faults3 run38568721208. Test source matches reviewed head; original limits preserved. | Actual TCP outage plus explicitly injected lost ACK/storage faults. One old run also contained an unrelated failed host result; only its fault PASS is reused. |
| Integrated BROWSER/SDK | Final host38572950700, exact reviewed head, completed/success; artifact11897479752 digest reconfirmed | 18 scenario groups +2 measurement rows. Profile writes are denied in fixture, so this cannot establish profile-minute ACK. |
| Exact-head CI | state38572962185; wrapper38572961927; Batch03 staging38572963628; Batch04 staging38572962057 all success | Staging only; no production gate/batch activation. |
| Proposed fixes | New 11 UNIT checks: original head 2 PASS/9 FAIL; proposal 11 PASS. Related learner28 and cloud15 PASS; syntax/diff checks PASS. | Controlled VM/transport/ACK, **no BROWSER/EMULATOR/BACKEND claim for the proposal**. Existing E live-like receipts still describe the original candidate, not all modified functions. |

Artifact IDs, current non-expired digests, candidate blobs, proposal hashes and local receipts are preserved in the evidence JSON. Detailed main protection read returned403; branch metadata still says protected with required `state`. No settings changed.

## P0 findings and concrete disposition

| Finding | Evidence / impact | Disposition and remaining gate |
|---|---|---|
| Production Auth/Rules compatibility | Historical Mặn Tech Operations records Google A/B UI, Rules-image matching and basic isolated restore PASS in September. These are valid historical scoped PASS, not current production configuration or direct outsider-API proof. Current normal SDK9.22.1 differs from emulator SDK10.14.1. | **UNVERIFIED current**. Need read-only deployed Rules/version, provider/domain configuration, current backup/restore receipt and test identities authorized for any future writes. No repeated failed login/Console method. Historical emergency Rules must never be restored. |
| Account progress cutover missing | Normal index loads local Store, no cloud-host import. Local browser progress is labelled device-local. | **CODE EXISTS: local only; cloud demo only**. Default-OFF production adapter/cutover remains a proposal. No dual-write or silent fallback from account cloud to misleading local success. |
| Recovery conflict: dead remote button after reload | `recover()` can return conflict while client.active is null; original `showRecovery()` needs active identity. New repro fails original. | Proposal passes explicit identity, binds client/generation/lesson intent. No write/delete from choosing remote. UNIT PASS; actual browser conflict/reload acceptance pending. |
| Recovery callback can cross account boundary | Original remote button awaits `cloud.load()` then writes cache/clears active through mutable global cloud without UID-generation guard. Reproduced A-read resolving after switch to B. | Proposal captures client/generation/intent, suppresses stale publication and handles failed read with retry choice. UNIT PASS; browser A/B race pending. |
| Missing storage is silently treated as pending | Getter denial becomes null storage; `persist()` returns without STORAGE_ERROR. New unit repro fails original. | Proposal emits explicit memory-only storage error. It does not make memory durable. Native denied storage/crash/reopen remains UNVERIFIED. |
| Profile-minute false confirmed credit | Original increments userProfileData before transaction ACK; permission error/response-unknown still leaves optimistic total. Reproduced. | Proposal applies returned transaction total only after ACK, guarded by UID; no retry on unknown ACK, no transaction-body UI effects. UNIT PASS. **Durable pending minute receipt/idempotent recovery still absent**: reset seconds can lose unconfirmed minutes after failure/crash. Do not promise exact minute accounting. |
| Native private-draft storage denial | `loadFromCloud` reads sessionStorage before server GET; denied access can prevent loading. Queue warning is overwritten by saving status; retained from canonical main. In-memory draft is not crash-safe. | Inherited risk, no blind storage redesign in review. Native denial acceptance + explicit supported degraded UX needed before a reliability claim for that environment. Preserve legacy; never silently assign data to UID. |
| Conflict choice persistence | Remote choice retains old pending record; ignoredPending is memory-only. Reload may show the same conflict again. | Open UX/durability blocker for cloud cutover. Define explicit preserved-draft/selected-remote receipt and recovery policy; do not auto-delete pending or overwrite remote. |
| Quota and retention | Rules bound each record but permit owner-chosen identities/replays; seq/rev ceiling is not a useful per-user quota. Completion collection is append-only with no retention cap. | Owner must approve pilot bounds, retention/exit policy and cost ceiling. Client throttle/flag is not a security rate limit. No TTL, deletion, billing or new service applied. |
| Local/cross-device consistency | Local Store uses non-atomic read/compare/write, has no cross-device sync; CAS cloud protocol rejects stale revisions/sessions. | Local mode remains transitional. Two-device emulator evidence does not upgrade production cloud status. Unknown ACK keeps draft; no automatic overwrite/resend. |
| Legacy / version / deleted lesson | New private metadata only on explicit creation/edit; UID-bound keys; no unowned legacy adoption/deletion. Version/total mismatch starts fresh session; completions remain. Deleted/ambiguous identity is not guessed. | Retain existing PASS and legacy bytes. Migration is out of scope and not a rollout prerequisite: start cloud empty per UID/explicit stable identity, with clear user-facing mode. |

## Capacity and cost (proposal, not billing observation)

Measured E post-reload window: desktop/touch each48 read attempts /7 write attempts /6 transactions. Earlier81/7/6 had the same catalog coverage. Counters reset per page and exclude private CRUD, profile, Rules-dependent reads, other pages and retries; they are not billed totals.

Assume per user/month L=30 cold page/UID hydrations, D=loaded identities, S=30 fresh starts (conservative3R1W), H=30 resumes (2R), K=60 changed checkpoints including final (1R1W), C=30 completions (additional1R1W). Then R≈L×D+3S+2H+K+C; W≈S+K+C. Replay often2R1W. No-op/guest progress0R0W. Completion Rules `getAfter` and retries can add reads. Actual transactions fail offline and may rerun on contention; UI state must be outside retry callbacks.

| Catalog scenario | Users | Monthly progress read attempts | Monthly progress writes | Daily average reads /writes |
|---|---:|---:|---:|---:|
| D34 |100 |126,000 |12,000 |4,200 /400 |
| D34 |1,000 |1,260,000 |120,000 |42,000 /4,000 |
| D1000, current eager hydration |100 |3,024,000 |12,000 |100,800 /400 |
| D1000, current eager hydration |1,000 |30,240,000 |120,000 |1,008,000 /4,000 |

Money formula: if regional price per100k reads/writes is P_R/P_W, D34/1000 users costs approximately12.6×P_R+1.2×P_W for progress operations; D1000/1000 users≈302.4×P_R+1.2×P_W, **before** free quota, extra reads, storage/index/network, private CRUD/profile, taxes/FX. Current project plan/region prices/billed usage were not verified; no exact currency total or spend-cap claim. Alerts are not hard spend caps. Official references: https://firebase.google.com/docs/firestore/pricing and https://firebase.google.com/docs/firestore/manage-data/transactions .

Thirty completions/user/month means30,000 new completion documents/month at1000 users (360,000/year); no automatic purge is implemented. Private saves: changed content≈2R1W, no-op≈1R0W; profile timer≈1R1W per acknowledged stop, separate from lesson progress. Cold loading dominates scale. Recommend sparse/paginated account progress loading before a1000-lesson catalog rollout, checkpoint5 processed sentences /60s dirty /leave /completion, no per-key/audio write, no background polling. Proposed pilot cap: at most100 invited active learners initially; require observed daily peak/retry usage before any expansion to1000. Concrete decision proposal: pilot at most100 invited active learners for30 days, retain all completion/pending data through pilot, no automatic deletion, review retention at exit. At D34, investigation thresholds10,000 progress reads/day and2,000 writes/day including retries are proposed alerts, not hard caps. Cohort eligibility must be enforced by approved server Rules, not only a client flag; an eligible UID can still abuse usage without a rate limit. Owner must approve the actual currency ceiling and enforcement/stop plan. Nothing is applied here.

## Staged release package and per-step Owner authority

| Step | Preparation / verification | Owner grant required before execution |
|---|---|---|
|0 — Freeze | Retain main, reviewed head, final E receipt, this fix patch and hashes. Resolve concurrent head changes before use. Review-only work is complete. | None for this review. No merge/deploy implied. |
|1 — Compatibility inventory | Read current deployed Rules/version/hash, Auth providers/domains, latest backup receipt and release build/source configuration; compare September PASS without rerunning unchanged gates. No learner document reads needed merely to fetch configuration. | Read-only configuration access/session if unavailable. No Auth/Rules edit, no production test writes. |
|2 — Prepare final UI candidate | Select picker/UID/UI fixes and minute-ACK proposal; rebind final SHA, focused browser/profile ACK regression, existing required state. Verify actual built artifact contains runtime assets but no demo hosts/Rules/dependency fixtures. | Separate authorization to adopt patch and create final protected PR if needed. Merge/deploy still requires explicit exact-head approval. |
|3 — Production cloud integration, default OFF | New production transport uses existing authenticated SDK and UID; fail closed on emulator/mock config; imports only behind immutable deployment flag `cloudProgressEnabled=false`. No URL/localStorage toggle may enable it. Separate flags for reading/writing; OFF suppresses both RPC paths. Test OFF=0 cloud-progress RPC, guest=0, UID switch, CAS, version, no legacy migration. Preserve local mode label. No protocol rewrite/new service. | Separate nonproduction integration scope; approve conflict/minute durability and retention/quota policy. Proposed flag/transport are **not implemented by PR183 or this review patch**. |
|4 — Additive Rules candidate | Start from exact current secure production Rules; add only owner progress/completion paths with schema/CAS validation and approved pilot restriction. Preserve private/profile/feedback/legacy policies. Emulator tests must include existing allowed routes, outsider/guest deny, malformed/oversize/stale records, completions and mixed transactions, using production SDK version. | Separate approval for exact Rules diff and pilot policy. Never publish either standalone emulator Rules file. |
|5 — Limited rollout | After exact candidate/state/targeted acceptance, back up immutable code+secure Rules hashes and obtain current recovery evidence. Publish reviewed Rules while cloud flag OFF, read back deployed Rules hash; verify existing routes first. Deploy code OFF; verify built code SHA/flag and0 progress RPC. Then enable only approved pilot cohort and verify consented A/B tests with server read-back on authorized test data. | Explicit production merge + deploy + exact Rules publication + bounded test writes/cohort activation, each named. No authority granted here. No real-user data migration. |
|6 — Expand or stop | Compare observed reads/writes/retries, denied writes, pending/crash/conflict outcomes and account isolation. Expand only after P0 closed and budget fits approved bound. | Separate1000-user expansion/budget decision. Public launch remains outside scope. |

## Rollback and data preservation

1. Before rollout retain exact prior code artifact, secure deployed Rules version/hash and configuration. Main SHA alone is not proof of deployed artifact. No rollback to historical wildcard Rules.
2. On wrong-account display/write, false saved ACK, repeated conflict/draft loss, denial spike or unexpected request volume: set cloud reads/writes OFF in a reviewed deployment and stop cohort expansion. A rollback flag does not stop already in-flight requests; wait for them to settle and reconcile read-back. No hard client-side cost cap is claimed.
3. Roll back code to the captured secure compatible artifact. Retain UID progress, completion, pending/local draft and legacy records; no purge, replay, bulk import or reverse migration. Keep new cloud records quarantined from local mode, clearly labelled, for later authorized recovery.
4. Prefer leaving additive owner-isolated Rules in place with cloud OFF. If a Rules regression requires rollback, publish only the captured secure compatible Rules (or reviewed emergency deny for NEW progress paths), retaining all existing feedback/private/profile routes. Verify dependent old clients/in-flight transactions; never use fixture Rules as rollback.
5. Read back deployed code SHA/flag and Rules hash independently; verify guest/existing feedback/private/profile paths, UID isolation and absence of new progress RPC. Any test writes require prior bounded authorization. Data rollback is not code rollback and has no permission here.

## Stop and resume

No production change is recommended for immediate execution. Remaining blockers are current production compatibility/access, final patched browser/SDK acceptance, production adapter/default-OFF integration, durable conflict/minute/storage recovery policy, artifact exclusion, and quota/retention/cost enforcement. Physical iOS/Safari is UNVERIFIED; require it if included in the launch support promise.

RECOMMENDED_NEXT_STEP: review the separate minimal fix patch, authorize bounded nonproduction completion of conflict/minute durability and a default-OFF production transport/Rules-composition candidate, and provide read-only configuration capability. Do not authorize merge/deploy based only on this review.

RESUME_PROMPT: Resume #4 from PR183-READINESS-REVIEW and its immutable review-branch commit. Reconcile main and PR183 exact head24a15c0e39cc7fe7d0af1272aaa6a41ad57f99f1 plus final E handoff04375b2c8abe5485570ab8fbcdfaa7dae0efe6dc. Keep original E PASS scoped to original sources; proposal has11 UNIT,28 learner and15 cloud PASS only. Read evidence hashes and remaining blockers before any adopted patch; reuse unchanged gates. No merge/deploy, production Rules/Auth/billing/data, Forms, Batch05/R1.4 or migration without separate exact authorization.

STOP: REVIEW/PREPARE objective complete; production remains NO-GO. No schedules, surveillance, feedback polling or new infrastructure created. Harvest: Mặn-specific evidence strengthens existing U6/U7/T3/T8/T13; no OS policy update or new universal principle proposed.
