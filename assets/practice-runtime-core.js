/* Pure extraction of Practice state/decision logic. Not loaded by the learner.
 * Input is exclusively the CURRENT R1.2 normalized descriptor. IO, DOM, routing,
 * legacy resume migration, auth/age/storage policy and presentation stay outside.
 */
import { canonicalPracticeJSON } from './practice-runtime-contract.js';
const copy = value => JSON.parse(canonicalPracticeJSON(value));
const require = (ok, message) => { if (!ok) throw new TypeError(`Invalid Practice core: ${message}`); };

export function createPracticeCore(descriptor, { instanceId, attemptIndex = 1 } = {}) {
  require(descriptor?.contractVersion === 'GENERIC-PRACTICE@v0.1', 'normalized descriptor required');
  // Verify the existing contract fingerprint, not a second catalog normalizer.
  const { resumeIdentity, ...body } = descriptor;
  require(resumeIdentity?.fingerprint === canonicalPracticeJSON(body), 'descriptor fingerprint');
  require(canonicalPracticeJSON(resumeIdentity) === canonicalPracticeJSON({ ...body.identity, fingerprint: resumeIdentity.fingerprint }), 'resume identity');
  require(Number.isInteger(attemptIndex) && attemptIndex > 0, 'attempt index');
  if (body.evidence.model === 'TASK_ROWS') require(typeof instanceId === 'string' && instanceId.length > 0, 'instance id');
  const d = copy(descriptor);
  const assetHashes = d.playback.segments.map(s => s.audio.sha256).concat(d.playback.fullPanel ? [d.playback.fullPanel.sha256] : []);
  let state = { phase: 'listening', fullPlays: 0, fullEnded: false, assisted: false, segmentReplays: 0, answer: null, spanAnswers: d.speechTasks.map(() => ''), evidence: [] };
  let token = 0, pending = null, nonNormalPlayback = false;
  const snapshot = () => copy(state);
  const stop = () => { pending = null; return ++token; };
  const normalizeText = value => {
    const policy = d.evidence.shortTextNormalization;
    require(policy && typeof value === 'string', 'short text');
    return value.toLowerCase().replace(/[’]/g, policy.curlyApostrophe).replace(/[^a-z0-9' ]/g, ' ').trim().split(/\s+/).map(w => policy.numberWords[w] || w).join(' ');
  };
  function evidenceRow(task, correct, response, at) {
    const replay = state.segmentReplays + Math.max(0, state.fullPlays - 1), hint = task.format === 'SHORT_TEXT', repair = attemptIndex > 1;
    return {
      practice_instance_id: instanceId + ':' + task.id,
      lesson_id: d.identity.lessonId, lesson_asset_version: d.identity.lessonVersion,
      target_anchor_id: task.anchorId, anchor_refs: task.anchorIds || [task.anchorId],
      operator_id: task.operator, construct_type: task.construct, response_format: task.format,
      attempt_index: attemptIndex,
      support_state: hint ? d.evidence.speechSupport : replay > 0 ? d.evidence.replaySupport : d.evidence.initialChoiceSupport,
      support_states: [hint ? d.evidence.speechSupport : d.evidence.initialChoiceSupport, ...(replay > 0 ? [d.evidence.replaySupport] : [])],
      exposure_class: repair ? 'REPAIR' : 'INITIAL', replay_count: replay,
      playback_mode: nonNormalPlayback ? d.evidence.slowedPlaybackMode : 'NORMAL',
      audio_realization_ref: d.identity.realizationId, realization_id: d.identity.realizationId,
      realization_version: d.identity.realizationVersion, asset_hashes: copy(assetHashes),
      response, correct, response_result: correct ? 'CORRECT' : 'INCORRECT',
      error_class: correct ? null : hint ? d.evidence.incorrectClass.shortText : task.operator === 'INFERENCE_STANCE' ? d.evidence.incorrectClass.inferenceStance : d.evidence.incorrectClass.otherChoice,
      evidence_strength: hint ? d.evidence.speechStrength : repair ? d.evidence.comprehensionStrength.repair : correct ? d.evidence.comprehensionStrength.correct : d.evidence.comprehensionStrength.incorrect,
      evidence_dimension: task.dimension, calibrated: d.scoring.calibrated,
      orthography_score_claimed: d.scoring.orthographyScoreClaimed, transfer_mastery_claimed: d.scoring.transferMasteryClaimed,
      conditions: copy(d.conditions), at
    };
  }
  return {
    snapshot, stop,
    // Identity check only. No new age/auth/phase policy and no legacy restoration.
    matchesResumeIdentity: saved => saved != null && canonicalPracticeJSON(saved) === canonicalPracticeJSON(d.resumeIdentity),
    beginPlayback({ segmentIndex = null, rate = 1 } = {}) {
      require(Number.isFinite(rate) && rate > 0, 'playback rate');
      require(segmentIndex === null || Number.isInteger(segmentIndex) && segmentIndex >= 0 && segmentIndex < d.playback.segments.length, 'segment index');
      const t = stop();
      if (segmentIndex === null) {
        state.fullPlays++;
        if (d.playback.repeatedFullOrNonNormalRateAssisted && (state.fullPlays > 1 || rate !== 1)) state.assisted = true;
      } else { state.assisted = true; state.segmentReplays++; }
      const sequence = segmentIndex !== null ? [d.playback.segments[segmentIndex].audio] : d.playback.fullStrategy === 'FULL_PANEL' ? [d.playback.fullPanel] : d.playback.segments.map(s => s.audio);
      nonNormalPlayback ||= rate !== 1;
      pending = { token: t, full: segmentIndex === null, next: 0, length: sequence.length };
      return { token: t, rate, assets: copy(sequence) };
    },
    assetEnded(t, index) {
      if (!pending || t !== token || index !== pending.next) return false;
      pending.next++;
      if (pending.next === pending.length) { if (pending.full) state.fullEnded = true; pending = null; }
      return true;
    },
    // Failure/cancellation never unlocks a first response.
    playbackFailed(t) { if (t !== token || !pending) return false; stop(); return true; },
    noteSupport(source) {
      require(['transcript', 'dictation'].includes(source), 'support source');
      if (source === 'transcript' ? d.playback.transcriptReplayAssisted : d.playback.dictationReplayAssisted) state.assisted = true;
    },
    submit({ choice, speechResponses = [], at }) {
      require(state.phase === 'listening' && (!d.playback.answerRequiresFullEnd || state.fullEnded), 'response phase/full end');
      require(Number.isInteger(choice) && choice >= 0 && choice < d.comprehension.choices.length, 'choice');
      require(Array.isArray(speechResponses) && speechResponses.length === d.speechTasks.length && speechResponses.every(s => typeof s === 'string'), 'speech responses');
      require(Number.isFinite(at), 'response time');
      stop(); state.answer = choice; state.correct = choice === d.comprehension.correctChoice;
      state.responseAssisted = state.assisted; state.phase = 'complete'; state.spanAnswers = copy(speechResponses);
      if (d.evidence.model === 'TASK_ROWS') {
        const c = d.comprehension;
        state.evidence = [evidenceRow({ id: c.id, anchorId: c.targetAnchorId, anchorIds: c.anchorRefs, operator: c.operator, construct: c.construct, format: c.format, dimension: c.dimension }, state.correct, choice, at)];
        d.speechTasks.forEach((t, i) => state.evidence.push(evidenceRow(t, normalizeText(speechResponses[i]) === normalizeText(t.answer), speechResponses[i], at)));
        return copy(state.evidence);
      }
      return { at, ...d.identity, construct: d.comprehension.construct, correct: state.correct, assisted: state.assisted, segmentReplays: state.segmentReplays, calibrated: d.scoring.calibrated };
    },
    enterDictation() { require(state.phase === 'complete', 'complete response required'); stop(); state.phase = 'dictation'; }
  };
}
