import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {validateLessonAudioQa} from './lesson-audio-qa-validator.mjs';

const bindings=JSON.parse(fs.readFileSync(new URL('./registry/batch-01-ordinary-audio-bindings.json',import.meta.url)));
const profile=JSON.parse(fs.readFileSync(new URL('./registry/browser-voice-profiles.json',import.meta.url))).profiles[0];
const bundle={schema_version:'1.0',safety:{approved_realization_count:0,publication_allowed:false},
  runtime_profile_ref:bindings.runtime_profile_ref,
  certified_runtime:{browser_family_major:profile.runtime.browser_family_major,platform:profile.runtime.platform,
    os_version_label:profile.runtime.os_version_label,voices:profile.runtime.voices},
  lessons:bindings.records.map(r=>({lesson_id:r.lesson_id,lesson_asset_version:r.lesson_asset_version,
    profile:{audio_profile_id:r.audio_profile_ref.split('@')[0],audio_profile_version:r.audio_profile_ref.split('@')[1]},
    binding:{script_speaker_map:[{script_speaker_id:'SPK01',realized_speaker_ref:profile.runtime.voices[0].voice_uri}]},
    segments:['S001','S002'].map(segment_id=>({segment_id,script_speaker_id:'SPK01'}))}))};
const hash=createHash('sha256').update(JSON.stringify(bundle)).digest('hex');
function fixture(){
  return {schema_version:'1.0',bundle_sha256:hash,runtime_profile_ref:bundle.runtime_profile_ref,reviewer_ref:'SYNTHETIC_TEST_ONLY',
    observed_runtime:{browser_user_agent:'Mozilla/5.0 Chrome/153.0.0.0',platform:bundle.certified_runtime.platform,os_version_label:bundle.certified_runtime.os_version_label,
      voices:bundle.certified_runtime.voices.map(v=>({voice_uri:v.voice_uri,lang:v.lang,local_service:v.local_service}))},
    lesson_results:bundle.lessons.map(l=>({lesson_id:l.lesson_id,lesson_asset_version:l.lesson_asset_version,
      audio_profile_id:l.profile.audio_profile_id,audio_profile_version:l.profile.audio_profile_version,listener_result:'PASS',
      segment_events:l.segments.map((s,i)=>({segment_id:s.segment_id,voice_uri:l.binding.script_speaker_map.find(x=>x.script_speaker_id===s.script_speaker_id).realized_speaker_ref,event_status:'ENDED',started_at_ms:1000+i*50,ended_at_ms:1020+i*50}))}))};
}
test('exact runtime and all mapped segments yield seven independent QA evidence outcomes',()=>{
  const r=validateLessonAudioQa(bundle,fixture(),hash);assert.equal(r.pass.length,7);assert.equal(r.park.length,0);
});
test('one listener failure parks only that lesson',()=>{
  const e=fixture();e.lesson_results[2].listener_result='FAIL';const r=validateLessonAudioQa(bundle,e,hash);
  assert.equal(r.pass.length,6);assert.equal(r.park.length,1);assert.equal(r.park[0].lesson_id,bundle.lessons[2].lesson_id);
});
test('wrong voice on a target segment rejects provenance',()=>{
  const e=fixture();e.lesson_results[0].segment_events[0].voice_uri='different';
  assert.equal(validateLessonAudioQa(bundle,e,hash).reason,'PLAYBACK_PROVENANCE_MAN-0065');
});
test('browser major change or omitted segment fails closed',()=>{
  const e=fixture();e.observed_runtime.browser_user_agent='Chrome/154.0.0.0';
  assert.equal(validateLessonAudioQa(bundle,e,hash).reason,'RUNTIME_DRIFT');
  const f=fixture();f.lesson_results[3].segment_events.pop();
  assert.equal(validateLessonAudioQa(bundle,f,hash).reason,'PLAYBACK_PROVENANCE_MAN-0765');
});
