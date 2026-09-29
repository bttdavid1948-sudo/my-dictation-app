# Batch 01 fixed audio milestone · 2026-09-29

Owner direction: quality is core. Chirp 3 HD is the primary voice candidate; ElevenLabs is a private quality reference if a no-commitment trial is available; Browser Voice remains fallback. Do not fund acoustic QA of the seven Browser Voice candidates. No previous candidate has a production QA-PASS realization. The frozen Curriculum/Practice contracts are unchanged.

## Selection and cost gate

Use the same three private Batch 01 source segments (`MAN-BATCH01-VOICE-SELECTION-v0.1`, 237 characters per voice) for a narrow product listening comparison. The source text lives in the access-controlled artifact store, not the public registry. Owner judges voice preference/UX only; this is not English acoustic correctness QA.

Google Cloud TTS Chirp 3 HD: published monthly free allowance up to 1,000,000 characters, then US$0.00003/character. Two voices for the sample consume 474 characters, or at most US$0.01422 of synthesis if none of the free allowance remains. The seven ordinary lessons contain 2,673 source characters: one production rendering is at most US$0.08019 under the same worst-case rate, excluding retries, storage and delivery. Enabling the API on the billing-linked project is a separate approval and access gate; budget alerts are not a hard spending cap. Cap initial synthesis at 10,000 input characters (gross usage ceiling US$0.30 beyond free allowance), count before requests and never run on browser playback. Confirm quota/billing state first.

ElevenLabs free account: 10,000 credits/month may support private comparison, but free-generated audio has no commercial license; do not ship it. Starter is US$6/month and includes commercial licensing; no subscription is authorized here. If no accessible free trial exists, use published voice demos only as a non-identical reference and do not claim a controlled same-text comparison.

Sources: https://cloud.google.com/text-to-speech/pricing ; https://cloud.google.com/text-to-speech/docs/get-started ; https://elevenlabs.io/pricing ; https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform

## After selection

Generate each approved segment once with exact `lesson_id + lesson_asset_version + segment_id + script_speaker_id`, selected producer/voice, encoding, input hash and output hash. Store immutable versioned audio in object storage/cache with a manifest; client playback must fetch a fixed asset and never regenerate on Play. Keep per-lesson QA and Practice validation independent. Qualified linguistic/acoustic review applies to final intended production audio only; deterministic file, hash, mapping, duration, decode and playback checks are automated. A failed or sensitive lesson enters its own versioned exception backlog. Only QA-PASS realizations go to #2 for final Practice validation, then controlled import and supported desktop/mobile checks. Publication and calibrated scoring remain closed until their respective gates pass.

This preparation does not activate a paid API, select a vendor, upload audio, or publish a lesson.
