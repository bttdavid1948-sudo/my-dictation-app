// Browser Voice capability evidence. This is not a lesson audio realization.
export const FIXTURE_SET = Object.freeze({
  id: 'MAN-BV-BASELINE', version: 'v0.1',
  fixtures: [
    {id:'numbers', text:'The meeting is in room B twelve at nine fifteen on Friday.'},
    {id:'contractions', text:"We've moved the workshop, but it doesn't start until four."},
    {id:'boundaries', text:'If the morning room is full, choose Friday, and tell the tutor before you submit.'},
    {id:'discourse', text:'On the face of it, the plan looks simple. However, the details still matter.'},
    {id:'speaker_turns', turns:[
      'Is the English test in room B twelve?',
      'Yes, it starts at nine.',
      'Can we move the workshop?',
      'Friday works for me.'
    ]}
  ]
});

const fail = reason => ({status:'REJECTED',reason});
export function validateRuntimeEvidence(e) {
  if (!e || e.schema_version!=='1.0' || e.fixture_set_id!==FIXTURE_SET.id ||
      e.fixture_set_version!==FIXTURE_SET.version) return fail('FIXTURE_VERSION');
  if (e.delivery_mode!=='RUNTIME_RENDERED' || e.alignment_mode!=='SEGMENT_ADDRESSABLE' ||
      e.producer_type!=='browser_voice') return fail('MODE');
  const r=e.runtime;
  if (!r?.browser_user_agent || !r?.platform || !r?.tested_at ||
      !Number.isInteger(r.speaker_capacity) || r.speaker_capacity<1 || r.speaker_capacity>4 ||
      !Array.isArray(r.voices) || r.voices.length!==r.speaker_capacity ||
      !r.voices.every(v=>v.voice_uri&&v.lang?.toLowerCase().startsWith('en')&&typeof v.name==='string'))
    return fail('RUNTIME_PROVENANCE');
  if (new Set(r.voices.map(v=>v.voice_uri)).size!==r.voices.length) return fail('SPEAKER_SEPARATION');
  if (!e.reviewer_ref || !Array.isArray(e.results) || e.results.length!==FIXTURE_SET.fixtures.length)
    return fail('REVIEW_COMPLETENESS');
  for (let i=0;i<FIXTURE_SET.fixtures.length;i++) {
    const result=e.results[i],fixture=FIXTURE_SET.fixtures[i];
    if (result?.fixture_id!==fixture.id || result?.event_status!=='ENDED' ||
        !Number.isFinite(result.started_at_ms) || !Number.isFinite(result.ended_at_ms) ||
        result.ended_at_ms<=result.started_at_ms || result.listening_result!=='PASS')
      return fail(`FIXTURE_${fixture.id}`);
    if (fixture.id==='speaker_turns' && result.tested_speaker_count!==r.speaker_capacity)
      return fail('SPEAKER_CAPACITY');
  }
  if (e.claimed_scopes?.some(x=>x!=='LOW_STAKES_PRACTICE')) return fail('UNSUPPORTED_SCOPE');
  return {status:'CAPABILITY_QA_PASS',
    scope:'LOW_STAKES_PRACTICE',
    speaker_capacity:r.speaker_capacity,
    note:'Capability evidence only; per-lesson output profile, voice mapping, acoustic targets and Practice readiness remain separate.'};
}

function browserFamilyMajor(userAgent) {
  const ua=String(userAgent);
  for (const family of ['Edg','Firefox','Chrome','Version']) {
    const match=ua.match(new RegExp(`${family}/(\\d+)`));
    if (match) return `${family}/${match[1]}`;
  }
  return ua;
}

export function matchesCertifiedRuntime(evidence, observed) {
  if (validateRuntimeEvidence(evidence).status!=='CAPABILITY_QA_PASS') return false;
  const certified=evidence.runtime;
  if (!observed || certified.platform!==observed.platform ||
      browserFamilyMajor(certified.browser_user_agent)!==browserFamilyMajor(observed.browser_user_agent) ||
      !Array.isArray(observed.voices) || observed.voices.length!==certified.voices.length) return false;
  return certified.voices.every((voice,i)=>voice.voice_uri===observed.voices[i]?.voice_uri &&
    voice.lang===observed.voices[i]?.lang && voice.local_service===observed.voices[i]?.local_service);
}

export function assessLessonEligibility(certification, candidate, outputProfile, observedRuntime) {
  const check=validateRuntimeEvidence(certification);
  if (check.status!=='CAPABILITY_QA_PASS') return fail('UNCERTIFIED_RUNTIME');
  if (observedRuntime && !matchesCertifiedRuntime(certification,observedRuntime)) return fail('RUNTIME_DRIFT');
  if (!candidate || candidate.delivery_mode!=='RUNTIME_RENDERED' ||
      candidate.alignment_mode!=='SEGMENT_ADDRESSABLE' || !candidate.lesson_id ||
      !candidate.lesson_asset_version || !candidate.segment_mapping?.length)
    return fail('CANDIDATE_MAPPING');
  if (candidate.exception_path) return fail('REALIZATION_SENSITIVE_EXCEPTION');
  if (candidate.script_speaker_ids?.length>check.speaker_capacity) return fail('SPEAKER_CAPACITY');
  if (!outputProfile?.audio_profile_id || !outputProfile?.audio_profile_version ||
      outputProfile.status!=='APPROVED_FOR_CALIBRATION') return fail('OUTPUT_PROFILE_PENDING');
  return {status:'PROFILE_COMPATIBILITY_CANDIDATE',
    lesson_id:candidate.lesson_id, lesson_asset_version:candidate.lesson_asset_version,
    note:'Still requires exact lesson realization provenance, speaker map, and final audio/Practice QA. No available ref issued.'};
}
