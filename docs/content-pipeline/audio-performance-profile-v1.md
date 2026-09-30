# Mặn Audio Performance Profile v1

Scope: the five existing ordinary Batch 01 candidates only. This is requested performance, not verified acoustic certification. Canonical lesson text, anchors and contracts remain unchanged.

| Field | Current value / purpose |
|---|---|
| language_locale | en-US; requested locale, perceived accent unverified |
| text_fidelity | VERBATIM_NO_ADDITIONS_OR_OMISSIONS; small words and verb endings must remain |
| pace | MEASURED_CONVERSATIONAL_APPROX_150_WPM; request only, gate measures broad anomaly bounds |
| phrase_boundaries | WRITTEN_PUNCTUATION, or SENTENCES_AND_CLAUSES for MAN-0365 multi-clause directions |
| connected_speech | simple_reductions (0165), natural (0365), basic_contractions (0044), unstressed_function_words (0238), common_reductions (0414); existing anchor requirements, no new Curriculum semantics |

Profile identity/version accompanies these fields. Speaker mapping, producer, immutable segment assets and delivery/alignment remain in the existing audio profile; no new cast/accent framework is introduced. The OpenAI adapter translates only these fields into gpt-4o-mini-tts instructions. Ash/Cedar mapping is preserved. Existing assets keep their original instructions; reuse does not imply that new requested performance was retroactively verified.

Evidence-led changes: trim only the 1.82s trailing silence in MAN-0165 S003; regenerate 0365 S002/S004/S005, 0044 S004, 0238 S004, 0414 S002/S003/S004 once. Thirteen other segments are byte-identical reuse. Orthographic/homophone normalization resolves road work/roadwork, short cut/shortcut, four/for, due/do, bare/bear; no article, inflection or edit-distance tolerance.

Internal gate v0.2 preserves all deterministic checks. A pinned, unprompted offline tiny.en ASR supplies exact normalized lexical support on five residual Vosk mismatches. Raw disagreement is retained. One unprompted recognizer matching the complete text is probabilistic evidence; it is not model consensus, proof that Vosk was wrong, or fine pronunciation/prosody/accent certification. No target-specific acoustic PASS is fabricated. Final realization-dependent Practice validation remains required independently per lesson.

No candidate is published by this action. Rollback: retain original v0.1 assets and old gate evidence; v0.2 manifests are separate immutable bindings. MAN-0065 live release and six sensitive/cast candidates are untouched.
