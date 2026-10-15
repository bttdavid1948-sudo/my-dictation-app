# MẶN — Learner Reliability / Milestone E
Status: NONPRODUCTION_VERIFIED / DRAFT_REVIEW / NOT_PRODUCTION_READY.
Date: 2026-10-14T13:47:59.066Z.
Candidate: `24a15c0e39cc7fe7d0af1272aaa6a41ad57f99f1`; base main: `0d7e2405885b837f251de08cc23632dca6f3cfc8`.
PR: https://github.com/bttdavid1948-sudo/my-dictation-app/pull/183 (draft; not merged).
This checkpoint is completion evidence on a nonproduction branch, not publication to canonical main.

## Kết quả
- Đã vượt blocker môi trường bằng GitHub-hosted runner hiện hữu, Chromium + Java/Firestore emulator và dependency lock. Không public tunnel, không credentials production.
- Đã tích hợp protocol cloud D vào host cách ly dùng actual compat SDK/emulator. Index bình thường KHÔNG import cloud; chưa cutover production.
- Latest-session theo UID/identity/version; cursor tách processed/correctness; replay giữ completion history; sparse checkpoints theo mốc học, không theo phím/Play. Guest không tạo account history; không import/xóa legacy.
- Actual CI phát hiện và sửa: restore chạy trước hydrate; timestamp tie Dictation/Practice; queued/hidden Dictation phát phía sau Practice; resume shortcut bỏ qua withdrawal cleanup. Không thay scoring/validators hoặc hạ assertion.
- Cache đúng UID/version và serialize hydrate đồng thời. Chọn bài/resume vẫn đọc server để CAS; không background polling hay service mới.

## Evidence matrix
| Lớp | Kết quả | Giới hạn |
|---|---|---|
| UNIT | Learner56 =22 progress reused +28 reliability +6 bridge; cloud15 reused; wrapper270 traces/90 resume rerun | Private IO bodies unchanged, regressions reused |
| BROWSER | Desktop/mobile popup X/Escape/Back, card/resume/replay, actual private CRUD/version, A/B/guest, overflow | Mobile emulation có touch, không physical iOS/Safari |
| NATIVE AUDIO | Existing immutable WAV thực sự play, exactly1 sau popup đóng/learn visible | Không acoustic QA hoặc synthesis mới |
| EMULATOR |27 Rules allow/deny groups | Demo project, schema/UID/CAS/completion; không Rules production |
| BACKEND DEMO |3 SDK cases +5 TCP/ACK/concurrency/storage/UID cases | ACK loss và storage denial là fault injection được ghi rõ |
| PRIVATE FAULTS |3 actual browser/SDK cases: conflict không overwrite, offline giữ draft/reconnect ACK, B không thấy A | IO unchanged; không production auth |
| PR CI trên exact head |state38572962185, wrapper/default/legacy38572961927, Batch03 staging38572963628, Batch04 staging38572962057 đều PASS | Staging không gửi feedback/deploy; không mở production queue |
| Final host |38572950700 PASS trên exact head |18 scenario groups +2 measurement snapshots, actual SDK/emulator |

Raw artifact IDs/digests, input heads, scopes và limits: `EVIDENCE-MILESTONE-E.json`. Existing released WAV/core/scoring giữ nguyên. Forms Milestone E v3 và Batch04 CLOSED/NONE giữ nguyên; không Batch05/R1.4 hoặc live gates.

## Chi phí và safety limits
Đã đo trong cửa sổ trang sau reload: desktop và touch đều48 read attempts/7 write attempts/6 transactions; trước serialize hydrate là81/7/6 với cùng coverage. Đây KHÔNG là tổng mọi trang hoặc billed usage; không gồm private CRUD/profile, Rules-dependent reads hay retry ngoài cửa sổ.
- Cold hydrate hiện probe theo catalog/private identities; cache giới hạn mỗi UID/version/page. Trước catalog lớn cần sparse query/pagination.
- Start mới/version đổi khoảng3R1W; replay2R1W; resume2R0W; changed checkpoint1R1W; completion thêm1R1W và Rules reads có thể phát sinh; no-op/guest0R0W progress.
- Host checkpoint ở5 câu/60s dirty meaningful activity, leave/completion; local pending trước request. Pagehide best-effort, không hứa crash durability.
- Ví dụ giả định L30 cold loads,D34 identities,S30 starts/replays,H30 resumes,K60 changed checkpoints gồm final,C30 completion: R≈1260, W≈120/người/tháng, chưa extras. Không chốt tiền/billing.

## P0 còn lại / Owner decisions
1. Production SDK/Auth/Rules, latest backup/restore, physical iOS/Safari và native storage-denial/crash chưa verified. Memory không bền qua crash nếu storage bị chặn.
2. Retention/quota/conflict-choice UX sau reload và sparse load ở catalog lớn cần review trước rollout. Profile-minute optimistic ACK, private legacy identity và legacy random/review restore còn từ C.
3. Main flag protected=true đọc được; chi tiết required-check settings trả403, không thay protection.
4. Owner đã cấp đủ quyền nonproduction. Merge/deploy production hoặc tích hợp Rules production cần quyền riêng cho exact reviewed diff; không cần Owner lặp CLI.

## Code / diff / rollback
- Diff: https://github.com/bttdavid1948-sudo/my-dictation-app/pull/183/files ; patch: https://github.com/bttdavid1948-sudo/my-dictation-app/pull/183.patch
- Lock: `nonproduction/learner-reliability/package-lock.json`.
- `index.html`, `assets/learner-progress.js`: picker/UID/local core; `assets/practice-runtime-wrapper.js`: resume guards.
- `nonproduction/learner-reliability/cloud-progress.cjs`: D protocol unchanged; `cloud-host.js`, `emulator-host-server.cjs`: demo-only host/UX; `firestore.*.rules`: isolated fixtures; `*browser.mjs`, `*sdk*.test.cjs`: actual acceptance.
- Reject/revert exact candidate code; retain scoped pending/progress/completion and legacy. Never deploy standalone fixture Rules as production rollback. Before separately authorized rollout, retain exact prior code/Rules hashes.

## Persistence / STOP
Local command/file surface stopped responding near task completion; final Library ZIP/report/checkpoint refresh could not be completed. Earlier Library E1 checkpoint is retained. This sanitized repo checkpoint + normalized evidence is the final durable handoff; read back its exact commit before claiming completion. No optional QA ref was created from the response-unknown local preparation.
No merge/deploy, production Rules/Auth/IAM/billing, real learner writes/deletion/migration or feedback shutdown. PR remains draft. STOP at Owner production boundary.
RECOMMENDED_NEXT_STEP: Owner review PR183/P0/retention/cost; reconcile this immutable handoff into the prior Library checkpoint when file access returns; no production action without separate authorization.
RESUME_PROMPT: Resume #4 from this Milestone E checkpoint and PR183 head 24a15c0e39cc7fe7d0af1272aaa6a41ad57f99f1; reconcile main/current sources, reuse hash-bound56/15 and actual CI receipts, review remaining P0. Cloud remains demo-host-only. No merge/deploy/production Rules/data/legacy migration/Forms changes, Batch05/R1.4 or live gates without separate Owner scope.
