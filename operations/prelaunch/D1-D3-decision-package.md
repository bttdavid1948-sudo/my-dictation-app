# D1–D3 nonproduction package — proposal only

Owner authorized REVIEW/PREPARE/nonproduction, 2026-10-09. No production activation or policy adoption. Base: PR181/main `dd62a62664200aa72fd9ea974c3b03543199209e`. This extends the existing prelaunch README; does not replace the orchestrator or reopen Batch04. Private current cloud receipt remains at the shared objective completion channel.

## D1 — minimum sufficient containment

| Option | Learner effect | Cost/security boundary | Decision |
|---|---|---|---|
| Controlled pause of both feedback paths | Learning remains available; contact/audio report cannot be sent. Current form text stays until close/reload; no durable draft promise. Requires a real support fallback. | No new service; reviewed Rules deny new feedback documents. UI alone cannot stop scripted writes. No claim of zero denied-request/network cost. | Recommended temporary control, only after explicit interruption approval, real contact and exit condition. |
| Trusted broker for both paths | Preserves in-app feedback with clear throttling; guest access needs an adopted anti-abuse/privacy design. | New endpoint, IAM, attestation and operations cost. Existing local decision model limits accepted writes only; invocation/read/network abuse can still cost money. | Defer until feedback is needed continuously or pause exit requires it. No infrastructure created here. |

Prepared executable diffs: `feedback-pause-ui.patch` and existing `feedback-containment.rules.patch`. Both are inert files, NOT applied to live `index.html` or Rules. UI guard is deliberately unconditional in the candidate (no remotely/user-toggleable bypass). Both handlers return before identity/payload/backend work; audio clears any old receipt id. Original send code retained behind return only for a short reversible pause. Remove the temporary guard through a reviewed release at exit, not indefinite dead-code retention.

Local verification: `node operations/prelaunch/feedback-pause.test.mjs`. Synthetic guest/auth repeated submission has zero backend calls, no false success/close, text retained in current DOM, old audio receipt removed; inline scripts parse; Rules change is exactly one create clause; reverse patches restore baseline bytes. This is NOT a Firestore emulator/visual browser/production security test. Existing budget-model PASS reused; no distributed concurrency claim.

Activation package (separate Owner authorization):
1. Approve pause BOTH paths; select a real fallback contact and privacy notice; approve review after 7 days (proposal, no scheduler) and exit only after reviewed broker acceptance or explicit risk decision. No automatic reopening on a timer.
2. Capture exact current production Rules bytes/hash and deployment rollback SHA privately; compare against reviewed baseline. Stop on drift; never deploy the whole historical draft blindly or restore wildcard rules.
3. Prepare protected UI PR with candidate applied and approved contact. Targeted desktop/mobile form tests plus synthetic Rules emulator checks: deny guest/auth feedback creates, preserve owner-only private data semantics. Existing content outcomes remain valid at their old watermark.
4. After authority and gates: deploy truthful UI before restrictive Rules; verify the two paths do not submit, then publish exact reviewed Rules and verify direct synthetic guest/auth REST writes denied. Cached older clients must get honest failure, not success. No feedback load test.
5. Acceptance records before/after bytes, approved identity/target and outcome. Once UI/Rules change, historical feedback ACK receipts remain historical only; new containment acceptance supersedes that capability for current operations.

Rollback: default safe fallback is keep pause and fix copy/control. Reverse UI patch does NOT reopen backend safely. Reopening writes requires explicit authority accepting the prior public-write exposure: exact captured Rules restore, verify, then protected UI revert and one synthetic ACK. Do not weaken UID protection or change Auth/App Check/IAM as rollback. If only candidate artifacts are reverted, production is unaffected.

Broker preparation contract, if later selected: one endpoint and region approved in advance; max body 4 KiB/message 1500 characters proposed; server-derived UID/email, server timestamps, schema checks before persistence; one atomic transaction covers global/day counter, UID cooldown and idempotency receipt plus feedback write. Example review numbers: 100 accepted/day globally, 3/hour/UID, 30-second cooldown; NOT adopted limits or dollar caps. Guest key/challenge mechanism, retention and privacy must be chosen before implementation. Valid App Check is complementary, not a rate/cost guarantee. Bounded instances/concurrency/log retention and invocations/read-cost estimate required. Failed/unknown write must reconcile idempotency before retry; circuit-open UI truthful; direct Firestore creates denied. Acceptance includes real transaction races, duplicate retry, forged/missing identity/attestation, legitimate throttled users and delivered alerts in a named nonproduction project. Local model alone does not satisfy these criteria.

## D2 — Google-only pilot policy draft and inventory

This is an operational policy proposal, NOT issued user policy, legal-compliance certification or authorization to delete. Public copy requires Owner adoption and actual support contact.

Suggested user copy: “Bạn có thể học với tư cách khách. Bài riêng đã lưu bằng Google được lưu trong tài khoản; lịch sử luyện tập và các bản nháp còn phụ thuộc vào trình duyệt/thiết bị. Đăng xuất không xóa toàn bộ dữ liệu. Để yêu cầu xử lý dữ liệu, dùng kênh hỗ trợ đã được Mặn công bố. Không gửi mật khẩu hoặc mã xác thực. Bản sao lưu có thể còn dữ liệu trong thời hạn lưu giữ; Mặn phải kiểm tra phạm vi trước khi xác nhận hoàn tất.” Do not publish until support exists; no promise of cross-device history sync or universal 7-day erasure.

| Store / exact source key | Contents and ownership | Deletion/retention boundary |
|---|---|---|
| Firebase Auth | Google identity/provider UID | Separate from Firestore backup; trusted identity verification, Auth delete last, separate authority |
| Firestore `user_vocab/{uid}` | Serialized private lessons | Client lesson edit/delete updates content; account/document deletion is a separate trusted operation |
| Firestore `users_profile/{uid}` | Nickname, avatar, motto, phone/public flag, links, time totals | UID scope; no public leaderboard implied by phonePublic flag; minimum needed fields only |
| Firestore `owner_feedback/{id}` | Free text, UID/email if signed in, nickname, user agent, timestamp/page | Includes sensitive user input; guest identity cannot safely be inferred from email alone |
| Firestore `community_units/{id}` | Retained legacy author records | Inventory by verified authorUid; not official content; no bulk migration/deletion |
| localStorage `xnot_favorites_uid_{uid}`, `xnot_review_uid_{uid}`, `xnot_history_uid_{uid}` | UID-scoped browser history, review, favorites | Remove only exact verified UID keys on each device after authorization; unsigned keys belong to guest |
| localStorage `man_batch02_evidence_v1`, `man_comprehension_history_v1` | Generic/legacy Practice histories, responses/scores; keys and currently emitted rows lack UID | **Attribution gap:** cannot promise selective per-account deletion or isolation on shared browser from these rows. Do not erase whole arrays for one account or invent ownership. Explicit device-wide user consent or separately scoped ownership fix needed; no R1.4 opened |
| localStorage `xnot_read_notifs` | Device-wide notification read ids | Not UID-scoped; preserve on account-only deletion unless device-wide scope approved |
| sessionStorage `man_private_draft_v1_{uid}` | Unsaved private lesson draft | Exact UID-scoped; do not clear another account's draft |
| sessionStorage `man_study_v1`, `man_batch02_practice_v1`, `man_mixed_panel_v1`, `man_final_two_practice_v1` | Study/Practice resume with stored UID; generic and legacy formats | Parse and verify saved UID; malformed/unattributable entries require user choice, not assumed ownership |
| Firebase SDK browser persistence | Sign-in state/tokens managed by SDK | Use supported sign-out/revocation handling; never dump tokens or delete arbitrary browser DBs |
| Scheduled backups, exports, isolated restore copies | Historical data copies; different lifecycles | Daily/7 days is historical verified schedule only; exports and restore databases require separate inventory; no automatic erasure promise |

Source: `index.html` local helpers/save functions, `assets/practice-runtime-wrapper.js` presentationFormats/save/submit, legacy runtime files and `firestore.rules.phase3.draft`; code inventory, not a new production-data scan. Histories have count limits (generic tasks 100/context-sequence 60), not time-based retention. UID-checking resume does not make unscoped history UID-owned. This gap does not invalidate prior playback/Practice scoring PASS; privacy acceptance remains incomplete.

Proposed retention (Owner may change): active lessons/profile until user action or verified account request, no inactivity purge; feedback 90 days after triage with unresolved cases reviewed at 90 days rather than indefinite silent retention; sanitized incident logs 30 days; minimal deletion receipt 30 days AFTER all relevant copies/backup obligations close. A deletion-exclusion record may need to outlive 30 days while any restorable copy persists; only pseudonymous/minimum fields under approved policy, not copied lesson content. No TTL/job installed.

Proposed support targets: acknowledge in 2 working days; active-store target 7 days after verified identity and approved scope; explicitly separate backup-pending from active-store completion. Lost Google account: Owner-reviewed evidence, never password/OTP collection, email-only ownership, silent UID transfer or new provider. Existing Google-only pilot preserved; expanding/public Google-only envelope needs a separate Owner decision.

Deletion workflow: REQUESTED → IDENTITY_VERIFIED → INVENTORIED → APPROVED → WRITERS_CONTROLLED → ACTIVE_STORES_VERIFIED → BACKUP_OBLIGATIONS_PENDING → CLOSED. Every destructive action needs current authority/action-time confirmation. Record case id, verified UID privately, requested stores/devices, exact document/key plan, concurrency/recreation risk and counts. Guard active writers before delete, delete Auth last only with authorization, revoke sessions through supported route, verify absence and no recreation. Never archive deleted content as evidence. Browser-local completion is device-specific and user-attested where remote verification is unavailable. Unknown ownership blocks only that item; retain honest partial status.

Restore procedure must apply deletion exclusions in an isolated target before any authorized promotion. No production overwrite. Account restoration is not part of Firestore restore. Backup expiry and export/restore-copy accounting must close before claiming full erasure; policy rollback cannot undo deletions.

Acceptance before expansion: adopted contact/retention/support envelope; synthetic two-account+guest ownership plan excludes others; malformed/unscoped data flagged rather than removed; Firestore/Auth/browser/backup outcomes tracked separately; no raw credentials in evidence; physical target-browser Google sign-in/cancel/offline/account-change and direct cross-account denial with approved test accounts. Existing error-copy and prior isolation evidence retained; no tests on real learner data in this scope.

## D3 — remaining read-only acceptance and incident decisions

Current attempt reached Google signed-out chooser before Firebase. Authentication is the immediate blocker; prior Cloud detail “Site Unavailable” is historical, not newly retried or reclassified as IAM denial/outage. No current backup/billing details read. Do not repeat already-PASS schedule/providers/alert subscription inventory unless newly contradicted.

After secure sign-in, inspect only missing evidence: latest READY backup id/state/create/expire/age on exact default database; export/restore-copy lifecycle and existing restore evidence; linked billing account active/paid-versus-trial and continuity; exact budget amount/currency/project/service scope, actual-versus-forecast thresholds, recipient routing; existing delivered notification and ACK. Configuration and delivery are distinct. If Cloud detail still fails after permitted recovery, retain the exact surface blocker, no credential/CLI switch to evade it. No learner document inspection or restore drill without separate target/budget authority.

Owner decisions: designate actual primary/fallback support and alert recipients (not inferred from signed-in identity); adopt response targets, delivery-test permission and continuity choice before trial expiry. No message, test alert or reminder sent here. Propose backup age >36h escalation, P0 immediate triage/15m notification and P1 30m ACK only if staffing can support them. These are not active monitoring guarantees. Prior trial expiry 2026-12-23 yields proposed decision date 2026-11-23 (no automation installed); verify current status before billing action.

Budget nuance: alerts-only budgets are not spend caps. Current official documentation also describes service-limited spend-cap budgets; no assumption that Mặn's services/project are eligible or that its budget uses that type. Do not change budget type or billing here. Trial credit/linkage is not paid continuity proof.

Primary mechanism references, consulted 2026-10-09 (not project-state evidence): https://docs.cloud.google.com/billing/docs/how-to/budgets ; https://firebase.google.com/docs/firestore/backups ; https://firebase.google.com/docs/app-check .

## Outcome / resume boundary

D1 nonproduction implementation and rollback preparation DONE; production control PENDING separate approval. D2 inventory/policy/workflow preparation DONE; adoption and unscoped-history disposition PENDING. D3 BLOCKED at secure authentication; latest backup/budget/delivery/continuity remain unverified. CONDITIONAL for existing pilot; NOT_READY broad launch. No production mutations, synthesis or learner-gate rerun.

Resume from shared D1–D3 checkpoint and fresh canonical; reuse candidate tests if hashes unchanged. Complete secure cloud read branch, then obtain only concrete missing decisions. Do not interpret this package/PR as issued privacy policy or feedback interruption authorization.
