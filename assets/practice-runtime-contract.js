/* Pure catalog boundary; deliberately not loaded by the learner.
 * Caller supplies the CURRENT canonical catalog lesson, never cached resume data.
 * No IO, globals, ID/hash allowlists, scoring execution or routing side effects.
 */
const fail = message => { throw new TypeError(`Invalid Practice contract: ${message}`); };
const check = (ok, message) => { if (!ok) fail(message); };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const text = x => typeof x === 'string' && x.trim().length > 0;
const strings = x => Array.isArray(x) && x.every(text);
const unique = x => new Set(x).size === x.length;
// Canonical JSON, not a lossy checksum: stable under object key reordering.
export function canonicalPracticeJSON(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalPracticeJSON).join(',') + ']';
  if (object(value)) return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalPracticeJSON(value[k])).join(',') + '}';
  check(value === null || ['string', 'boolean'].includes(typeof value) || (typeof value === 'number' && Number.isFinite(value)), 'non-JSON value');
  return JSON.stringify(value);
}
const copy = x => JSON.parse(canonicalPracticeJSON(x));

export function normalizePracticeLesson(lesson) {
  check(object(lesson), 'lesson object');
  if (!Object.hasOwn(lesson, 'practice')) return null;
  const p = lesson.practice;
  check(object(p), 'practice object');
  check(lesson.status === 'published' && text(lesson.id) && text(lesson.version) && text(lesson.audioRealizationRef), 'published lesson identity');
  check(Array.isArray(lesson.items) && lesson.items.length > 0, 'segments');
  const dimensioned = Object.hasOwn(p, 'anchorIds');
  const legacy = Object.hasOwn(p, 'anchorId');
  check(dimensioned !== legacy, 'unambiguous anchor shape');
  if (dimensioned) {
    check(p.version === 'MAN-B02-PRACTICE@v0.1', 'unsupported task schema version');
    check(strings(p.anchorIds) && p.anchorIds.length > 0 && unique(p.anchorIds), 'anchors');
    check(text(p.dimension) && typeof p.conditionAnchors === 'boolean' && strings(p.conditions) && Array.isArray(p.speechTasks), 'dimensioned task schema');
    check(!Object.hasOwn(p, 'speechCondition'), 'conflicting conditions');
  } else {
    check(text(p.anchorId) && text(p.speechCondition), 'legacy anchored schema');
    check(!Object.hasOwn(p, 'version') && !Object.hasOwn(p, 'speechTasks') && !Object.hasOwn(p, 'conditions') && !Object.hasOwn(p, 'dimension'), 'unsupported legacy extensions');
  }
  for (const key of ['operator', 'construct', 'question', 'referenceAnswer', 'scoringBoundary']) check(text(p[key]), key);
  check(strings(p.choices) && p.choices.length >= 2 && unique(p.choices), 'choices');
  check(Number.isInteger(p.correctChoice) && p.correctChoice >= 0 && p.correctChoice < p.choices.length, 'correct choice');
  const anchors = dimensioned ? p.anchorIds : [p.anchorId];
  const asset = (a, segmentId) => {
    check(object(a) && a.lessonId === lesson.id && a.lessonVersion === lesson.version && a.realizationId === lesson.audioRealizationRef && a.segmentId === segmentId, 'asset identity');
    check(text(a.realizationVersion) && text(a.profileRef) && text(a.url) && /^[a-f0-9]{64}$/.test(a.sha256), 'asset metadata/hash');
    check(Number.isFinite(a.durationSeconds) && a.durationSeconds > 0, 'asset duration');
    if (Object.hasOwn(a, 'replayEvidence')) check(text(a.replayEvidence), 'replay evidence');
    const frames = ['primaryStartFrame', 'primaryEndFrame', 'contextStartFrame', 'contextEndFrame'];
    if (frames.some(k => Object.hasOwn(a, k))) {
      check(frames.every(k => Number.isInteger(a[k]) && a[k] >= 0) && Number.isInteger(a.sampleRate) && a.sampleRate > 0, 'context frames');
      check(a.contextStartFrame <= a.primaryStartFrame && a.primaryStartFrame < a.primaryEndFrame && a.primaryEndFrame <= a.contextEndFrame, 'context frame order');
    }
    return copy(a);
  };
  const segments = lesson.items.map(it => {
    check(object(it) && text(it.segmentId) && it.segmentId !== 'FULL_PANEL' && text(it.en), 'segment identity/text');
    return { segmentId: it.segmentId, text: it.en, speakerRole: it.speakerRole ?? null, audio: asset(it.audio, it.segmentId) };
  });
  check(unique(segments.map(s => s.segmentId)), 'duplicate segments');
  const fullPanel = Object.hasOwn(lesson, 'fullPanelAudio') ? asset(lesson.fullPanelAudio, 'FULL_PANEL') : null;
  check(new Set([...segments.map(s => s.audio.realizationVersion), ...(fullPanel ? [fullPanel.realizationVersion] : [])]).size === 1, 'conflicting realization versions');
  const tasks = dimensioned ? p.speechTasks.map(t => {
    check(object(t) && text(t.id) && anchors.includes(t.anchorId), 'speech task identity/anchor');
    for (const k of ['operator', 'construct', 'dimension', 'prompt', 'answer', 'scoringBoundary']) check(text(t[k]), `speech ${k}`);
    check(t.format === 'SHORT_TEXT' && t.support === 'HINT_ASSISTED', 'speech response/support');
    if (Object.hasOwn(t, 'anchorIds')) check(strings(t.anchorIds) && t.anchorIds.length > 0 && unique(t.anchorIds) && t.anchorIds.every(a => anchors.includes(a)), 'speech anchors');
    const span = t.span, segment = segments.find(s => s.segmentId === span?.segment_id);
    check(segment && Number.isInteger(span.start_char) && Number.isInteger(span.end_char) && span.start_char >= 0 && span.end_char > span.start_char && span.end_char <= segment.text.length, 'speech span');
    return copy(t);
  }) : [];
  check(unique(tasks.map(t => t.id)), 'duplicate speech tasks');
  const descriptor = {
    contractVersion: 'GENERIC-PRACTICE@v0.1',
    schemaFamily: dimensioned ? 'dimensioned-tasks' : 'legacy-anchored-choice',
    sourceSchemaVersion: p.version ?? null,
    identity: { lessonId: lesson.id, lessonVersion: lesson.version, realizationId: lesson.audioRealizationRef, realizationVersion: segments[0].audio.realizationVersion },
    comprehension: { id: 'comprehension', format: 'SELECT_ONE', question: p.question, choices: copy(p.choices), correctChoice: p.correctChoice, referenceAnswer: p.referenceAnswer, operator: p.operator, construct: p.construct, dimension: p.dimension ?? null, targetAnchorId: anchors[0], anchorRefs: copy(dimensioned && p.conditionAnchors ? anchors : [anchors[0]]) },
    anchors: copy(anchors), conditions: copy(dimensioned ? p.conditions : [p.speechCondition]), conditionAnchors: p.conditionAnchors ?? false,
    speechTasks: tasks,
    playback: { segments, fullPanel, fullStrategy: fullPanel ? 'FULL_PANEL' : 'SEQUENTIAL_SEGMENTS', answerRequiresFullEnd: true, segmentReplay: 'ASSISTED', replayContext: segments.map(s => ({ segmentId: s.segmentId, evidence: s.audio.replayEvidence ?? null })), repeatedFullOrNonNormalRateAssisted: true, transcriptFullPanel: fullPanel !== null, transcriptReplayAssisted: !dimensioned && fullPanel !== null, transcriptRepeatSupported: !dimensioned && fullPanel !== null, dictationReplayAssisted: !dimensioned && fullPanel !== null },
    evidence: { model: dimensioned ? 'TASK_ROWS' : 'COMPREHENSION_HISTORY', initialChoiceSupport: dimensioned ? 'CHOICE_ASSISTED' : 'FULL_CONTEXT_FIRST_PASS', speechSupport: 'HINT_ASSISTED', replaySupport: 'REPLAY_ASSISTED', repairSupport: dimensioned ? 'REPAIR_ONLY' : null, comprehensionStrength: dimensioned ? { correct: 'WEAK', incorrect: 'MODERATE', repair: 'REPAIR_ONLY' } : null, speechStrength: dimensioned ? 'REPAIR_ONLY' : null, incorrectClass: dimensioned ? { shortText: 'OTHER', inferenceStance: 'INFERENCE_ERROR', otherChoice: 'MEANING_ERROR' } : null, replayCount: 'SEGMENT_REPLAYS_PLUS_FULL_PLAYS_AFTER_FIRST', slowedPlaybackMode: 'SLOW', shortTextNormalization: dimensioned ? { lowercase: true, curlyApostrophe: "'", punctuation: 'SPACE_EXCEPT_APOSTROPHE', whitespace: 'COLLAPSE', numberWords: { '6': 'six', '15': 'fifteen', '5': 'five' } } : null },
    scoring: { boundary: p.scoringBoundary, calibrated: false, orthographyScoreClaimed: false, transferMasteryClaimed: false, dictationScoreSeparate: true },
    // Retain all canonical Practice fields: unknown metadata is not discarded.
    canonicalPractice: copy(p)
  };
  const fingerprint = canonicalPracticeJSON(descriptor);
  return { ...descriptor, resumeIdentity: { ...descriptor.identity, fingerprint } };
}

// Identity-only boundary: auth, age, phase and storage policy belong to a future
// caller. Always recompute against CURRENT canonical data. No legacy resume use.
export function matchesPracticeResume(lesson, savedIdentity) {
  const descriptor = normalizePracticeLesson(lesson);
  return descriptor !== null && object(savedIdentity) && canonicalPracticeJSON(savedIdentity) === canonicalPracticeJSON(descriptor.resumeIdentity);
}
