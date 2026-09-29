# Browser Voice lesson audio QA · authority and scale

## Evidence boundaries

`browser-voice-runtime-evidence@v0.1` is a **playback smoke check** on Chrome 153 / Windows 10 22H2 and four observed voice identifiers. The Owner heard five generic fixtures and noted no obvious runtime failure. The Owner is not a qualified English acoustic reviewer. Neither those grades nor `onend` events prove pronunciation, reductions, prosody, accent, or a particular lesson's acoustic target. Seven ordinary bindings are candidates; approved realizations remain zero. Five sensitive lessons remain parked independently.

| Layer | Automatable evidence | Human authority | Current Batch 01 result |
| --- | --- | --- | --- |
| A1: static contract | Source hashes, exact lesson/version IDs, all 32 segment IDs, 13 target segment IDs/spans, stable speaker mapping to observed voice URIs, candidate AudioProfile lineage, no premature publish/ref | None | `STATIC_CONTRACT_PASS` via `lesson-audio-technical.mjs` |
| A2: runtime delivery | On supported browser/OS/voices: `onstart/onend/error`, exact segment/voice sequence, timeout and interruption; event logs per lesson | Device operator can start run, but does not grade English | Pending actual seven-lesson playback events; generic five-fixture smoke is not a substitute |
| B: linguistic/acoustic quality | Text/anchor highlighting and anomaly triage; ASR may flag gross intelligibility errors if an actual recording can be captured | Qualified English listening/phonetics reviewer judges pronunciation, target reduction, phrase boundary, stress/prosody, speaker distinction, accent claims | Pending; Owner PASS/FAIL is inadmissible |

## Reusable QA path

1. Check A1 automatically for every candidate and A2 on each supported runtime profile, versioned by browser major/OS/voice. A2 events never issue an acoustic QA PASS.
2. Onboard a qualified English-audio reviewer: document relevant training or a calibration task, English variety, supported runtime/voice access, reviewer ID, conflict policy and signed/dated review record. The existing private seven-lesson page can be used **only by this reviewer**, with a rubric linked to each Curriculum-owned speech anchor. Store exact lesson/version, voice URI, played segment IDs, target phenomenon, PASS/FAIL, reason and provenance. A second qualified reviewer adjudicates uncertainty and samples accepted items for drift.
3. #4 validates identity/technical events and the independent expert record. Only a lesson satisfying both may receive a versioned `audio_profile_id/version`, `qa_status/version` and `realization_id` for that exact lesson/version/runtime. #2 then owns realization-dependent final Practice validation. A failing or uncertain lesson enters the versioned audio-exception backlog without blocking another lesson. `publication_allowed=false` and calibrated scoring stay closed.
4. For 1,000 lessons, automate A1/A2 on every lesson. Use the first batch to calibrate feature categories and reviewer consistency; later stratify linguistic review by anchor/voice/version and risk. Do **not** turn sampling into a blanket acoustic PASS for unchecked lessons. Review target-bearing/high-risk lessons individually unless a narrower inherited profile claim has been empirically validated and authorized. Recheck on runtime/voice drift.

## Capability and cost choices (planning estimates, not purchase approval)

| Choice | What it checks | Reliability and limitation | Service cost / review effort |
| --- | --- | --- | --- |
| A1 script + A2 event runner | Identity/mapping and delivery events | Deterministic; cannot hear actual quality | $0 new service; device runtime still needed for A2 |
| Qualified volunteer English reviewer | B on actual Browser Voice; independent adjudication | Strongest direct acoustic evidence if competence and runtime match are verified | $0 vendor fee; approximately 1–2 hours for seven lessons, excluding onboarding |
| Paid qualified English reviewer | Same B, with documented rubric and spot second review | Direct judgment; rate/availability and matching runtime need procurement | Assumption $20–$40/hour: Batch 01 1–2 hours ≈ **$20–$80**; 1,000 at 5–10 minutes each ≈ 83–167 hours or **$1,660–$6,680**, before second review, platform fees and taxes. This is a planning range, not a quotation. Upwork lists tutor rates $20–$40/hour: https://www.upwork.com/resources/upwork-hourly-rates/ |
| Optional Speech-to-Text V2 | Transcript mismatch triage **if actual Browser Voice output can first be recorded** | Does not establish target prosody, stress or natural reductions; capture path is unverified | Standard $0.016/min; dynamic batch $0.003/min. At 1–3 min × 1,000 lessons ≈ **$16–$48** standard or **$3–$9** batch, plus capture/storage; no API enabled here. https://cloud.google.com/speech-to-text/pricing |

The Web Speech specification exposes synthesis control and events; it does not give this Work runtime the actual device's acoustic output. That is why A2 and B cannot be fabricated from `onend` or the Owner's prior generic observations. https://webaudio.github.io/web-speech-api/

No vendor is selected, no paid API is enabled, and no external reviewer has been engaged. A qualified volunteer with a matching supported device is the cheapest route if one is genuinely available. Otherwise a narrow reviewer budget/vendor approval is the next Owner decision; Owner supplies the decision, not the listening verdict.
