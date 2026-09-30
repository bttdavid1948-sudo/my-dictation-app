# Internal audio release v0.1

Owner direction 2026-09-30 supersedes the external/outsourced acoustic-review operating assumption. Owner is not an acoustic reviewer. No per-lesson outsourced certification is required. Browser Voice remains fallback and the producer-neutral contract remains frozen.

Run `python3 internal-audio-release.py BUNDLE.json CANONICAL.json UNPROMPTED_ASR.json OUTPUT.json`. The bundle includes actual final files; the canonical hash must match. Offline Vosk ASR evidence is bound to each exact asset SHA and receives no reference transcript or constrained reference grammar. Model source: https://alphacephei.com/vosk/models . ASR is a fallible signal, not an acoustic oracle.

## Minimum internal gate

Deterministic verification: exact canonical lesson/version/segment coverage and text/input hash; expected provider/voice request mapping; immutable WAV/PCM SHA; complete WAV plus ffmpeg decode; measured format, duration, RMS, clipping and silence bounds. Policy: 24 kHz mono 16-bit PCM; duration >=0.4 s; effective whole-file pace 60–300 wpm; RMS >=0.003; clipping <=0.1%; leading/trailing silence <=1.5 s; longest internal silence <=2 s. These are screening heuristics, not proof that a word was never truncated. Drift or a technical anomaly yields ANOMALOUS. Detectable silence can be trimmed into a new immutable realization with source hash and retained duration, then rechecked/retranscribed.

Probabilistic support: unprompted ASR must match every segment after lowercase/punctuation and B/be homophone normalization. Other insertions/deletions/substitutions are UNCERTAIN, not automatic proof of defective TTS. A strict mismatch can create false negatives; improve or regenerate that independent candidate later without holding the eligible one. Gross output anomalies detectable by ASR, empty output or technical screens are parked. ASR confidence is not pronunciation certification.

Unverified: perceived voice identity/accent, fine pronunciation, natural prosody, contractions/reductions, stress and other acoustic target conditions. Voice assignment proves requested API mapping only. Target IDs/segment mapping are deterministic; numbers/letter names can receive probabilistic lexical support. Practice #2 must explicitly accept, restrict or reject realization-dependent target suitability. Operations cannot declare these acoustic targets PASS from text or waveforms.

`CONTROLLED_INTERNAL_RELEASE_ELIGIBLE` routes each realization immediately to final Practice. This is distinct from QA-PASS and from publication approval. Only after Practice/support/rights/contract checks and controlled runtime verification may a release be labeled `CONTROLLED_INTERNAL_RELEASE`. FAIL/UNCERTAIN/ANOMALOUS remain independent exceptions.

## Controlled release and recovery

Client fetches versioned static audio, never the TTS API. Show AI-generated disclosure in Dictation and Transcript. The report action collects a category with optional 180-character note, automatically snapshots exact lesson/version/segment/realization/profile/hash, runtime, rate and play/error state; it excludes transcript and learner answer. Reports use the existing `owner_feedback` envelope and Rules; do not introduce another collection or widen security rules. Reports are observability signals, never formal QA evidence.

Before import, preview the exact catalog/audio release. Retain current catalog and immutable audio versions in git for rollback. After official content is verified, archive/depublish the legacy learner-visible catalog entries; do not physically destroy their data. Restore the prior catalog release by reviewed revert if official playback or learning breaks. Corrected audio gets a new realization/file version and goes through this gate and final Practice again. No per-Play paid synthesis.

The current runtime/report implementation is ready for release integration; backend write/read and actual fixed-audio desktop/mobile smoke remain required after Practice approval. No released official Batch 01 lesson is claimed at this handoff.
