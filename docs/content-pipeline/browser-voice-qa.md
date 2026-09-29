# Browser Voice runtime certification · v0.1

**2026-09-29 authority correction:** The five-fixture Owner observation is a runtime playback smoke check only. It is not a linguistic/acoustic certificate. Owner cannot supply reliable English pronunciation/prosody/accent PASS/FAIL. Use `lesson-audio-technical.mjs` for deterministic A checks and a qualified English-audio reviewer for B. The original `CAPABILITY_QA_PASS` wording is superseded by `RUNTIME_PLAYBACK_SMOKE_PASS`; see `lesson-audio-qa.md`. No approved lesson realization follows from the five generic fixtures.

Mặn V1 uses free Web Speech as the baseline. This tool records playback events for a **specific browser major version + OS/platform + voiceURI set + fixture version**. It does not certify English audio quality or any individual lesson.

## Execution choices

| Path | Effort and automation | Evidence quality | Incremental service cost |
| --- | --- | --- | --- |
| Same-origin Web Speech runtime page (chosen for smoke) | Build once; collect browser/voice/events automatically; reuse event capability until drift | Directly tests a supported device's playback events; Owner observation detects obvious failure only | $0 for the existing static site and Web Speech runtime |
| Headless CI with synthetic voices | Easy repeatable API/error tests, but setting up a voice engine and virtual audio adds work | Valid for control flow, **not** certification of a real learner's browser/OS/voice | No new paid service assumed; CI runner usage may vary |
| Manually listen to every Batch 01 segment | 62 listens now, then repeats for each batch | Per-asset observations but no reusable capability envelope | No API fee; high QA labor |

## How to certify

1. Open `docs/content-pipeline/browser-voice-certification.html` from the deployed Mặn origin on a browser/OS with English Web Speech voices. It is an internal QA utility; there is no upload or backend write.
2. Select distinct voice(s) for up to four speaker slots. Record a non-personal device-operator reference. Play the five versioned fixtures and note only obvious playback failure. The page records `onstart`/`onend`; export JSON locally. Do not treat an Owner grade as English acoustic QA.
3. Operations runs `node docs/content-pipeline/browser-voice-certification-cli.mjs evidence.json` and reviews the resulting hash, voice list and playback-only scope. Store the evidence in the access-controlled shared artifact store and register its hash. A synthetic test fixture must never be submitted as real device evidence.
4. Reuse the smoke profile only when `matchesCertifiedRuntime()` matches browser family/major, platform, reported OS version and exact ordered voices. On browser/OS/system-voice/fixture changes, rerun; identifiers cannot detect every silent voice update.
5. A versioned, producer-neutral **output AudioProfile** and qualified acoustic QA remain necessary for each lesson. `assessLessonEligibility()` only yields a structural candidate, refusing exceptions, missing profiles and insufficient speaker capacity. Bind exact `lesson_id + lesson_asset_version`, segment IDs and speaker/voice mapping before a qualified reviewer can support a stable QA-PASS `realization_id`. Practice #2 then performs its final realization-dependent check.

Browser Voice permits `RUNTIME_RENDERED` + `SEGMENT_ADDRESSABLE`; no file URL or fixed timeline is implied. Batch 01's five accent/transfer, prominence, overlap and subtle-prosody lessons go through an exception assessment if the runtime cannot realize their targets. A certified ordinary profile cannot silently inherit scored accent/prosody/overlap or calibrated benchmark eligibility. Persisted paid TTS/human recording are optional later paths for an individual exception, subject to their own approval and QA.

The current Work cloud browser does not expose `speechSynthesis`, while the Limited Pilot demonstrated Browser Voice on a user's device. This limits where playback events can run. Qualified linguistic review must be performed by a competent reviewer on a supported runtime or on a faithful recording, not by the Owner.
