# Batch 01 ordinary Browser Voice lesson QA

The certified Chrome 153 / Windows 10 22H2 runtime profile proves reusable capability for low-stakes playback. It does not prove that a specific lesson realizes its Curriculum-owned speech anchor. Seven ordinary lessons have candidate producer-neutral output AudioProfiles and exact segment/speaker bindings in the private bundle below. `registry/batch-01-ordinary-audio-bindings.json` is an index of identities, versions and QA state only; no profile or realization is approved yet.

The full English text and QA page remain in the access-controlled shared artifact store:

- `batch-01-ordinary-browser-voice-qa-bundle@v0.1` (`MAN-Batch-01-Ordinary-Browser-Voice-QA-Bundle-v0.1.json`)
- `batch-01-ordinary-audio-qa-page@v0.1` (`MAN-Batch-01-Ordinary-Audio-QA-v0.1.html`)

On the same certified browser/OS/voices, the page plays all 32 segments in seven separate lessons. A listener reviews each entire lesson and its highlighted speech target, assigning one PASS/FAIL per lesson. The page exports local JSON; it makes no backend writes. Work's cloud browser cannot synthesize this runtime. Do not reuse the five generic fixtures as lesson-level acoustic QA.

Operations validates the returned JSON against the exact private bundle with `node docs/content-pipeline/lesson-audio-qa-validator.mjs BUNDLE.json EVIDENCE.json`. For each PASS, review provenance, approve that exact lesson's AudioProfile and issue a stable realization ID only with mapped segments, speaker/voice refs, QA status/version and runtime condition. Then route that lesson alone to #2 for realization-dependent final Practice validation. Park each FAIL in the versioned audio-exception backlog; it does not block another lesson. The five previously identified sensitive lessons remain separate exceptions.

No asset is published, no calibrated scoring is approved and the production queue stays closed until its separate gates pass. Recertify after browser/OS/voice drift.
