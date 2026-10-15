# First-user readiness continuation and audio hosting decision package

Watermark: 2026-10-15 UTC. REVIEW + PREPARE / nonproduction only. No merge, deployment, production migration, account/bucket/domain/CDN creation or billing change.

## Exact sources and CI closure

Canonical main `0d7e2405885b837f251de08cc23632dca6f3cfc8`; PR183 `24a15c0e39cc7fe7d0af1272aaa6a41ad57f99f1`; PR184 repaired head `569d3a41b861888da53f9e62ee660d72c0e8a649` (parent `1c91cad110b5efa145de6473c29f775cb51487c5`). Prior Milestone8/version9 evidence remains historical; its CI-blocked conclusion is superseded below. Learner runtime remains the reviewed `cc4439092662f36ded4c12ea23596bb5da8f611e` implementation. Batch04 CLOSED/NONE; Forms E v3 unchanged; no Batch05/R1.4 or pilot.

| Native workflow | Run ID | Exact-head result |
|---|---:|---|
| Batch02 | 38702345698 | PASS, 24 jobs |
| Batch03 retained staging source | 38702345571 | PASS, 6 jobs |
| final-two | 38702345621 | PASS, 4 jobs |
| MAN0844 | 38702345349 | PASS, 2 jobs |
| Batch04 | 38702345423 | PASS, 2 jobs |

All 38 jobs succeeded on repaired head. `native-ci-index.json` retains job/artifact metadata and digests; not every raw artifact ZIP was downloaded. Repairs touch three stale verification API/radio selectors, one strict retained-source loader and the PR-only Batch03 source step. Outcome assertions were preserved. Loader verifies canonical closure-index SHA `e680d6d995f9f1ab8012cb941f3275d648a1cc139839be41777aeb9a76987a3f`, lesson/mode/status/LOCAL_STAGING/size/SHA, and rejects live source. Six matching source receipts and four rejection/corruption cases passed. No unrelated source substituted; prior partial live FAIL records remain FAIL. Production push source-download route was not changed and still depends on an expired historical artifact: production pipeline continuity remains a separate blocker before any deployment.

PR184 remains draft and stacked onto PR183, not a protected-main promotion. Status: CI GREEN FOR STACKED REVIEW; CONDITIONAL for eventual merge; production NO-GO. Rollback CI-only changes by reverting repaired commit to parent 1c91; no learner data or WAV changes.

## First-user risk closure

| Risk | Status and evidence | Closure condition / rollback |
|---|---|---|
| UID-scoped browser history and provable-owner lazy migration | TESTED nonproduction; default-OFF flag, atomic IndexedDB ACK, UID-owned journal, deduplication, account switching/denial/partial recovery tested in prior run 38693800063 | Production owner decision and staged acceptance; OFF flag restores old path without deleting records |
| Cross-device account history | UNVERIFIED / NOT IMPLEMENTED by device-local history; cloud-progress preparation is demo/emulator only | Auth/Rules compatible account backend and actual independent-device acceptance before claim |
| Legacy ownership | TESTED: unscoped legacy not assigned to login UID; no blind deletion/migration | Real data remain untouched; retain unknown-owned records; no dual-write after successful flagged cutover |
| Crash, storage denial, profile ACK | TESTED bounded browser fixtures; 32 IndexedDB checks, 26 host checks; profile display waits for transaction ACK | Durable profile-minute idempotency/unknown-response ledger remains open; no backend-billing claim |
| Retention / cap / conflict UX | CONFIRMED bounded history: 1,000 dedup events / 500,000 JSON code units yields unconfirmed save, no deletion | Owner retention/export/deletion policy; test cap/recovery/conflict copy; no unlimited durability claim |
| Feedback abuse / cost | PREPARED containment/broker decision, not production-enforced | Choose closed pilot channel or scoped containment with budget/monitor owner; rollback preserves existing feedback |
| Privacy, deletion, support | OWNER_DECISION_REQUIRED: retention/deletion authority, support contact, response owner | Approved workflow and deletion/read-back acceptance, no real deletion authorized here |
| Production Rules/Auth compatibility | UNVERIFIED live exact candidate; historical configuration evidence only | Authenticated read-only config access, exact Rules review, then separately approved changes if needed |
| Latest READY backup, paid billing continuity, recipients/thresholds/delivery | BLOCKED: no retained authenticated cloud-console tab; no available authenticated read-only API. This does not establish logout or IAM denial | Owner provides authenticated supported read-only console/API capability; Operations verifies metadata without learner content; no Owner CLI/log gathering |
| Browser learner journey | TESTED existing Chromium desktop/mobile contexts and current native matrix; physical devices, Safari and actual cross-device backend remain UNVERIFIED | Bounded preview acceptance on real target devices and isolated test accounts |

Reused because runtime sources did not change: 52 learner/progress cases, 15 cloud unit cases, 270 wrapper traces, 90 resume cases, private regressions and prior actual browser/SDK/emulator evidence within their original scope. Milestone8 additionally retains readiness/recovery/browser results and provenance; none reclassified as production. Forms 7+29 PASS untouched. No cloud sync READY claim. Private cloud account metadata and learner content are not published in this package.

## Audio inventory and bounded actual proof

`all-wav-inventory.json`: 217 WAV, 104,474,576 bytes, every file SHA-256; 208 referenced by 33 published lessons (100,734,980 bytes), nine retained unreferenced files. Unreferenced does not mean deletable or QA-invalid. Referenced manifest hashes matched all 208 files. PCM 24 kHz mono 16 bit, 48,000 bytes/s; summed referenced duration 2,098.454s; largest 8,881,666 bytes. Production WAVs unchanged.

Read-only proof run 38703151147, head `e409c99037bda77ec5843744b2a996f9a69bb527`, artifact11956494866, ZIP SHA256 `6a8bc97003bb1a42e0688cd561dbf2b3c0ad60d106b36526ccf984b478012f00`. Complete inventory run38703485107, head `104482b60de0a8f7d495bbf837a58858ae219e82`, artifact11957815204, ZIP SHA256 `f28b1322f0073d77da35e7b6f0b26b869a11a150553d2625ab3b25ebbab0302d`. Essential JSON receipts are retained in this directory, not dependent solely on seven-day workflow artifacts.

Three shortest first-sentence samples in MAN0065 were tested, not an unbiased traffic sample. Live Pages HEAD/full GET: audio/wav, CORS *, Accept-Ranges bytes, Cache-Control max-age=600; full GET SHA matched repository. Range bytes0-43 returned206/44 bytes and correct Content-Range. Desktop and touch-emulated mobile each cold-loaded S001 (~178KB including HTTP overhead), replayed with 0 new encoded network bytes, then reloaded page and replayed with 0 bytes and disk-cache response. Two new sentences required ~231KB and two Range responses. Browser cache is observed only in these conditions; not proof all lesson audio is preloaded, cached past TTL/eviction, or CDN HIT globally. Total bounded probe accounting 2,045,301 bytes includes controlled fixture traffic. Controlled immutable-cache fixture is not an R2/Bunny measurement. Runner edge was Chicago; Vietnam latency, physical mobile, Safari, delayed replay and candidate-provider delivery remain UNVERIFIED.

## Cost and scale model (USD/month, assumptions)

30 days, 10MiB downloaded per DAU/day (~3.64min cold PCM audio), 20 GET/HEAD/Range requests per DAU/day, hypothetical .202GB stored including rollback copy. DAU is not registered users or concurrency; illustrative 20% active ratio gives 500/5,000/50,000 registered and 5% concurrency gives5/50/500 simultaneous at100/1,000/10,000DAU. Neither ratio is observed nor load-tested. Existing client-attempt read/write counts are not Firestore bills. No production load test performed.

| DAU | Delivery GB | Requests | Pages | R2 Standard* | Bunny Asia Standard | GCS + Cloud CDN APAC** |
|---:|---:|---:|---|---:|---:|---:|
|100|31.46|60,000|$0 assumed; within soft bandwidth limit|$0|$1.00|>= $20.93|
|1,000|314.57|600,000|Above soft bandwidth limit|$0|$9.44|>= $45.07|
|10,000|3,145.73|6,000,000|Above soft bandwidth limit|$0|$94.37|>= $286.42|

*R2 $0 only if the entire account-shared free allowance remains available:10GB-month,1M ClassA,10M ClassB; Standard .015/GB-month,4.50/M A,.36/M B,egress free. Without free allowance: approximately $.025/$.219/$2.163 for modelled storage/reads. At10,000DAU and200requests/day,60M monthly reads cost$18 after free10M; abuse is not free. Domain, Workers, paid security, taxes and other account workloads excluded. No hard spend cap or account eligibility verified.

Bunny Standard Asia .03/GB, one-region storage .01/GB, account minimum$1. CDN request charges absent; storage-to-BunnyCDN transfer free, public CDN delivery charged. Prepaid balance/monthly bandwidth limit can bound spend but exhaustion interrupts delivery; nonpayment retention is a risk, so repo masters remain mandatory. Volume pricing .005/GB has different PoP footprint and needs Vietnam acceptance before considering it equivalent.

**GCS estimate includes assumed one forwarding rule730h*.025=$18.25, APAC delivery .09/GiB and lookup .0075/10,000. It excludes cache-fill, storage, origin operations, IP/ancillary LB/logging/tax and is a lower bound, not a quote. Exact Asian storage SKU not verified. GCS free storage allowance applies to specified US regions, not an assumed Asian deployment.

Pages has a1GB published-site limit and100GB/month soft bandwidth limit, not a paid scalable capacity tier. Review Pages commercial/SaaS terms before changing business use. No monthly site usage was available. Proposed decision trigger: forecast70GB/month, published assets700MB, or terms change, whichever first; around223DAU at this assumed usage. A linear1,000-lesson projection is~3.05GB audio and exceeds Pages site capacity; do not extrapolate user traffic from the tiny playback sample.

## Conditional recommendation and implementation gates

Preferred: R2 Standard + custom-domain Cloudflare cache when measured forecast/terms warrant moving. Alternative: Bunny Standard for simple prepaid controls if Vietnam delivery acceptance is better. GCS/CDN only if Google operational/IAM integration justifies fixed/ancillary costs. Provider PoPs in Vietnam establish presence, not measured latency. Do not use r2.dev for production, or bare free Cloudflare proxy as an unapproved bulk-audio workaround. Current largest object is below Cloudflare512MB cacheable-object limit. Configure explicit audio-prefix cache eligibility; do not assume extension alone guarantees cache hits.

Current fixed-audio runtime enforces same-origin. Pure nonproduction `url-plan.cjs` demonstrates a default-OFF allowlisted resolver with manifest/path/hash checks (10 unit cases PASS); it is not wired into production. Future approved work: inventory upload using unchanged bytes, immutable keys preserving lesson/version/realization identity; full GET SHA/size verification of every object; manifest reviewed binding original path/hash/bytes to approved HTTPS origin; single runtime resolver seam, explicit CSP/CORS GET/HEAD/Range/exposed headers, cache settings; preview desktop/mobile/scoring/replay/rate/context/failure acceptance; then Owner-approved flag cutover. Audio elements do not provide SHA256 streaming SRI: manifest and prepublication full-GET verification are not per-play cryptographic verification. Fetch+digest+blob would require separate memory/Range/latency design and is not implemented.

Gates: exact inventory integrity; correct MIME/206/Range/CORS; cold/replay/reload/TTL/eviction; MISS/HIT headers and measured origin requests; target Vietnam Wi-Fi/mobile and physical devices; unchanged scoring/lesson identity/replay; network denial/broken asset; no TTS fallback; budget/exhaustion alert and support owner; rollback/read-back. No account, bucket, domain, paid service or production migration was created.

Rollback: keep old URLs/manifests/WAVs intact; flag OFF and revert resolver/manifest to reviewed version, verify sampled old/new hashes and learner replay. At high DAU, Pages cannot safely absorb unlimited rollback traffic: reduce admission or show maintenance message under approved operations plan. No reencode/regenerate/delete and no automatic account-history migration.

## Minimum Owner decisions / next step

1. Review CI-green stacked PR184 and PR183 together; authorize separate production promotion only after exact Auth/Rules, pipeline continuity and reliability gates close. No merge authority requested for current nonproduction completion.
2. Supply supported authenticated read-only cloud capability for residual READY backup/billing/alert-delivery metadata; do not grant learner-content access. Operations performs verification.
3. Decide pilot containment, feedback budget/monitor responsibility, privacy retention/deletion/support contact and whether cross-device history is a launch requirement. No pilot opened.
4. Approve audio trigger and conditional R2 preference only now; separately approve account/domain/billing/resource creation and bounded provider/Vietnam acceptance if trigger is reached. Current model is not a request to spend or migrate early.

RECOMMENDED_NEXT_STEP: review repaired exact head and this decision package; resolve minimal read-only cloud access and product policy decisions, then run only newly enabled targeted acceptance. RESUME_PROMPT: Resume canonical main, PR183/184 and this immutable audio-readiness handoff plus checkpoint Milestone9/version10; reuse38 native jobs and existing learner/browser/emulator PASS where hashes match; close authenticated D3 residual and approved physical/cross-device gates; no merge/deploy/resources/production migration without separate Owner authority.

## Official pricing/limits references (checked 2026-10-15)

- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/r2/buckets/public-buckets/
- https://developers.cloudflare.com/r2/buckets/cors/
- https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/
- https://developers.cloudflare.com/r2/platform/limits/
- https://www.cloudflare.com/network/
- https://www.cloudflare.com/en-ca/service-specific-terms-application-services/
- https://blog.cloudflare.com/updated-tos/
- https://bunny.net/pricing/
- https://bunny.net/pricing/storage/
- https://bunny.net/faq/
- https://bunny.net/network/
- https://cloud.google.com/cdn/pricing
- https://cloud.google.com/load-balancing/pricing
- https://cloud.google.com/storage/pricing
- https://docs.cloud.google.com/free/docs/free-cloud-features
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
