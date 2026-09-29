import test from 'node:test';
import assert from 'node:assert/strict';
import {FIXTURE_SET,validateRuntimeEvidence,assessLessonEligibility,matchesCertifiedRuntime} from './browser-voice-certification.mjs';

const evidence=()=>({
  schema_version:'1.0',fixture_set_id:FIXTURE_SET.id,fixture_set_version:FIXTURE_SET.version,
  producer_type:'browser_voice',delivery_mode:'RUNTIME_RENDERED',alignment_mode:'SEGMENT_ADDRESSABLE',
  reviewer_ref:'QA-01',claimed_scopes:['LOW_STAKES_PRACTICE'],
  runtime:{browser_user_agent:'Example Browser/1.0',platform:'Example OS',os_version_label:'Example OS 1',tested_at:'2026-09-28T00:00:00Z',speaker_capacity:2,
    voices:[{voice_uri:'voice-1',name:'English 1',lang:'en-US'}, {voice_uri:'voice-2',name:'English 2',lang:'en-GB'}]},
  results:FIXTURE_SET.fixtures.map((f,i)=>({fixture_id:f.id,event_status:'ENDED',started_at_ms:i*1000+1,ended_at_ms:i*1000+900,listening_result:'PASS',tested_speaker_count:f.id==='speaker_turns'?2:1}))
});
const candidate=()=>({lesson_id:'MAN-0065',lesson_asset_version:'v0.1',delivery_mode:'RUNTIME_RENDERED',alignment_mode:'SEGMENT_ADDRESSABLE',script_speaker_ids:['SPK01','SPK02'],segment_mapping:[{segment_id:'S001'}],exception_path:false});
const profile={audio_profile_id:'PROFILE-TEST',audio_profile_version:'v0.1',status:'APPROVED_FOR_CALIBRATION'};

test('representative capability is separate from final realization approval',()=>{
  const e=evidence();assert.equal(validateRuntimeEvidence(e).status,'RUNTIME_PLAYBACK_SMOKE_PASS');
  assert.equal(assessLessonEligibility(e,candidate(),profile).status,'PROFILE_COMPATIBILITY_CANDIDATE');
  assert.equal(assessLessonEligibility(e,candidate(),profile).available_audio_realization_ref,undefined);
});
test('stale voice and incomplete playback fail closed; listener grade does not certify quality',()=>{
  const e=evidence();e.runtime.voices[1].voice_uri='voice-1';assert.equal(validateRuntimeEvidence(e).reason,'SPEAKER_SEPARATION');
  const f=evidence();f.results[1].event_status='ERROR';assert.match(validateRuntimeEvidence(f).reason,/FIXTURE_contractions/);
  const g=evidence();g.results.pop();assert.equal(validateRuntimeEvidence(g).reason,'REVIEW_COMPLETENESS');
  const h=evidence();h.results[0].listening_result='FAIL';assert.equal(validateRuntimeEvidence(h).status,'RUNTIME_PLAYBACK_SMOKE_PASS');
});
test('high stakes and realization sensitive lessons do not inherit a generic runtime pass',()=>{
  const e=evidence();e.claimed_scopes=['CALIBRATED_SCORING'];assert.equal(validateRuntimeEvidence(e).reason,'UNSUPPORTED_SCOPE');
  const c=candidate();c.exception_path=true;assert.equal(assessLessonEligibility(evidence(),c,profile).reason,'REALIZATION_SENSITIVE_EXCEPTION');
  const p=structuredClone(profile);delete p.audio_profile_version;
  assert.equal(assessLessonEligibility(evidence(),candidate(),p).reason,'OUTPUT_PROFILE_PENDING');
  const one=evidence();one.runtime.speaker_capacity=1;one.runtime.voices.pop();one.results.at(-1).tested_speaker_count=1;
  assert.equal(assessLessonEligibility(one,candidate(),profile).reason,'SPEAKER_CAPACITY');
});
test('a certificate is reusable only on its certified browser/OS/voice combination',()=>{
  const e=evidence(),observed=structuredClone(e.runtime);
  assert.equal(matchesCertifiedRuntime(e,observed),true);
  observed.voices[0].voice_uri='replacement';
  assert.equal(matchesCertifiedRuntime(e,observed),false);
  assert.equal(assessLessonEligibility(e,candidate(),profile,observed).reason,'RUNTIME_DRIFT');
  observed.voices[0].voice_uri='voice-1';observed.browser_user_agent='Another Browser/3.0';
  assert.equal(matchesCertifiedRuntime(e,observed),false);
  observed.browser_user_agent=e.runtime.browser_user_agent;observed.os_version_label='Example OS 2';
  assert.equal(matchesCertifiedRuntime(e,observed),false);
});
