# Browser Voice runtime certification · v0.1

Mặn V1 uses free Web Speech as the baseline. This tool certifies a **specific browser major version + OS/platform + voiceURI set + fixture version** for low-stakes practice. It does not certify all voices on a platform, an individual lesson, scoreable acoustic difficulty, or the frozen Curriculum/Practice contract.

## Execution choices

| Path | Effort and automation | Evidence quality | Incremental service cost |
| --- | --- | --- | --- |
| Same-origin Web Speech QA page (chosen) | Build once; collect browser/voice/events automatically; one short representative listening review per voice combination, then reuse until runtime drift | Directly tests the environment learners use; human listening verifies sound, validator checks coverage and exact runtime reuse | $0 for the existing static site and Web Speech runtime |
| Headless CI with synthetic voices | Easy repeatable API/error tests, but setting up a voice engine and virtual audio adds work | Valid for control flow, **not** certification of a real learner's browser/OS/voice | No new paid service assumed; CI runner usage may vary |
| Manually listen to every Batch 01 segment | 62 listens now, then repeats for each batch | Per-asset observations but no reusable capability envelope | No API fee; high QA labor |

## How to certify

1. Open `docs/content-pipeline/browser-voice-certification.html` from the deployed Mặn origin on a browser/OS with English Web Speech voices. It is an internal QA utility; there is no upload or backend write.
2. Select distinct voice(s) for up to four speaker slots. Record a non-personal QA reviewer reference. Play and listen to the five versioned fixtures: numbers, contractions, phrase boundaries, discourse markers and distinguishable speaker turns. The page records `onstart`/`onend`; the reviewer grades each fixture. Export the JSON locally.
3. The QA lane runs `node docs/content-pipeline/browser-voice-certification-cli.mjs evidence.json` and reviews the resulting hash, voice list and scope. Store the evidence and report in the access-controlled shared artifact store and register their hashes. A synthetic test fixture must never be submitted as real QA evidence.
4. Reuse this capability only when `matchesCertifiedRuntime()` matches browser family/major, platform, QA-reported OS version and the exact ordered voices. On browser/OS/system-voice/fixture changes, recertify. A voice becoming unavailable fails closed; runtime identifiers alone cannot detect every silent voice update, so periodic listening checks remain appropriate.
5. A versioned, producer-neutral **output AudioProfile** must still be approved for each lesson. `assessLessonEligibility()` refuses exception lessons, missing profiles and insufficient speaker capacity. Even a compatible result is only a candidate: the audio layer must bind exact `lesson_id + lesson_asset_version`, segment IDs, speaker/voice mapping and realization QA before issuing a stable `realization_id` and adding it to `available_audio_realization_refs[]`. Practice #2 then performs its final realization-dependent check.

Browser Voice permits `RUNTIME_RENDERED` + `SEGMENT_ADDRESSABLE`; no file URL or fixed timeline is implied. Batch 01's five accent/transfer, prominence, overlap and subtle-prosody lessons go through an exception assessment if the runtime cannot realize their targets. A certified ordinary profile cannot silently inherit scored accent/prosody/overlap or calibrated benchmark eligibility. Persisted paid TTS/human recording are optional later paths for an individual exception, subject to their own approval and QA.

The current Work cloud browser does not expose `speechSynthesis`, while the Limited Pilot has already demonstrated Browser Voice on a user's device. This limits **where** acoustic QA can run; it does not impose paid TTS on content production. The page and validator provide a reusable handoff to a supported QA browser instead of requiring the Owner to audition 62 segments.
