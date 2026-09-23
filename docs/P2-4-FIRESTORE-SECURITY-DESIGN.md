# P2.4 — Firestore security design (draft, no deployment)

## Verified baseline (2026-09-23)

Project `my-dictation-project-4381e`, default Firestore database, region `asia-east1`. The deployed rule is a recursive wildcard `allow read, write: if request.time < timestamp.date(2026, 10, 20);`. It permits arbitrary client reads, writes and deletes until expiry, then denies all requests. This draft does not change it.

Observed root collections: `community_units`, `owner_feedback`, `user_vocab`, `users_profile`. Only minimum schema samples were examined. No bulk export or additional profile inspection was performed.

Source behavior:
- `user_vocab/{uid}`: account-owned `units` JSON string and `updatedAt`; owner saves and loads by UID.
- `community_units/{autoId}`: lesson items, authorUid, sharingStatus, rights fields, counters; public list currently queries `orderBy('createdAt','desc').limit(20)` without a publication filter. Guests and accounts can start a lesson; `xStartCommunity` attempts a client-side `sessionCount` increment.
- `users_profile/{uid}`: profile fields including `phone`, `phonePublic`, social links, avatar, nickname, titles, and study counters. Current leaderboard queries this whole collection. Account client writes its own minutes through a transaction.
- `owner_feedback/{autoId}`: kind, message, page, uid/email/nickname, userAgent, createdAt, status. Guest submissions have a null UID. Client currently sets `status:'new'`.

## Risk and decisions

1. Firestore rules authorize whole document reads, not individual fields. A public leaderboard cannot safely read `users_profile` while that document contains a private phone number. Create a separate `leaderboard_public/{uid}` with only approved public fields, and change every leaderboard query to it before restricting `users_profile`.
2. Public community queries must include `where('sharingStatus','==','public')` if rules restrict reads by publication status. Firestore rules are not query filters. Existing unreviewed/uncertain-rights lessons must be reviewed before they remain public. This is a product/copyright decision, not an automatic migration.
3. Client-controlled `sessionCount`, `learnedCount`, and study minutes can be forged. A rule that allows arbitrary client increments does not make a trustworthy metric. Defer public counters or use a verified backend event/aggregation. Guest learning must remain available even if the counter write is denied; remove or catch that write explicitly.
4. Feedback must allow narrowly validated create for guests, deny client read/list/update/delete, and prevent client-selected moderation status beyond an initial fixed value. Rate limiting and abuse control require a separate mechanism beyond Firestore rules.

## Proposed sequence

A. Back up current Rules and take a recoverable export of production data through an approved privileged process. Do not store private data in Git.
B. Add `leaderboard_public` and a one-time backfill of public fields only. Keep `users_profile` private. Define ownership and moderation of public fields; decide whether minutes are merely illustrative or verified.
C. Change app reads to public leaderboard documents, add the community publication filter, and remove guest counter writes. Keep guest study, replay and results working.
D. Write a default-deny Rules file with explicit collections. Owners alone read/write `user_vocab/{uid}` and private `users_profile/{uid}`; public readers access only curated `leaderboard_public` and published community lessons; authors may create/update only permitted lesson fields and never self-publish when rights are unverified; feedback clients only create a validated initial payload. No generic wildcard grants.
E. Run emulator tests for guest, owner, other account, malformed payloads, listing queries, update/delete, and privilege escalation. Test the live application against a separate Firebase project or emulator, then review the exact production diff and rollback steps.
F. After explicit Owner approval, deploy app and Rules in an order that prevents a broken client and minimizes the open-access interval. Verify signed-out/signed-in learning, private data denial, public queries and feedback; monitor errors and retain rollback.

## Required approval before production work

Owner must approve the public leaderboard fields and trust model, the policy for existing public lessons with unreviewed rights, the migration/backfill, and the exact Rules deployment. No production mutation is authorized by this draft.

## References

- https://firebase.google.com/docs/firestore/security/rules-query
- https://firebase.google.com/docs/firestore/security/rules-fields
- https://firebase.google.com/docs/firestore/security/test-rules-emulator
