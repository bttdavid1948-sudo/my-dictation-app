import fs from 'node:fs';
import crypto from 'node:crypto';

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fail = reason => ({status:'REJECTED',reason});

export function validateLessonAudioQa(bundle, evidence, bundleHash) {
  if (!bundle || bundle.schema_version!=='1.0' || bundle.lessons?.length!==7 ||
      bundle.safety?.approved_realization_count!==0 || bundle.safety?.publication_allowed!==false ||
      !evidence || evidence.schema_version!=='1.0' || evidence.bundle_sha256!==bundleHash ||
      evidence.runtime_profile_ref!==bundle.runtime_profile_ref || !evidence.reviewer_ref)
    return fail('BUNDLE_OR_EVIDENCE');
  const expected=bundle.certified_runtime,observed=evidence.observed_runtime;
  const major=String(observed?.browser_user_agent).match(/Chrome\/(\d+)/);
  if (!major || `Chrome/${major[1]}`!==expected.browser_family_major ||
      observed.platform!==expected.platform || observed.os_version_label!==expected.os_version_label ||
      !Array.isArray(observed.voices) || observed.voices.length!==expected.voices.length ||
      !expected.voices.every((v,i)=>v.voice_uri===observed.voices[i]?.voice_uri &&
          v.lang===observed.voices[i]?.lang && v.local_service===observed.voices[i]?.local_service))
    return fail('RUNTIME_DRIFT');
  if (!Array.isArray(evidence.lesson_results) || evidence.lesson_results.length!==bundle.lessons.length)
    return fail('LESSON_COVERAGE');
  const outcomes=[];
  for(let i=0;i<bundle.lessons.length;i++) {
    const l=bundle.lessons[i],r=evidence.lesson_results[i];
    if(r?.lesson_id!==l.lesson_id || r.lesson_asset_version!==l.lesson_asset_version ||
       r.audio_profile_id!==l.profile.audio_profile_id || r.audio_profile_version!==l.profile.audio_profile_version ||
       !['PASS','FAIL'].includes(r.listener_result) || !Array.isArray(r.segment_events))
      return fail(`LESSON_IDENTITY_${l.lesson_id}`);
    const map=new Map(l.binding.script_speaker_map.map(s=>[s.script_speaker_id,s.realized_speaker_ref]));
    if (r.listener_result==='PASS' && (r.segment_events.length!==l.segments.length ||
        !l.segments.every((s,j)=>{
          const e=r.segment_events[j];return e?.segment_id===s.segment_id&&
            e.voice_uri===map.get(s.script_speaker_id)&&e.event_status==='ENDED'&&
            Number.isFinite(e.started_at_ms)&&Number.isFinite(e.ended_at_ms)&&e.ended_at_ms>e.started_at_ms;
        }))) return fail(`PLAYBACK_PROVENANCE_${l.lesson_id}`);
    outcomes.push({lesson_id:l.lesson_id,lesson_asset_version:l.lesson_asset_version,
      audio_profile_ref:`${l.profile.audio_profile_id}@${l.profile.audio_profile_version}`,
      status:r.listener_result==='PASS'?'TECHNICAL_PLAYBACK_EVENTS_PASS_EXPERT_REVIEW_PENDING':'LISTENER_FLAGGED_FOR_REVIEW'});
  }
  return {status:'TECHNICAL_EVIDENCE_VALIDATED',bundle_sha256:bundleHash,
    technical_playback:outcomes.filter(x=>x.status==='TECHNICAL_PLAYBACK_EVENTS_PASS_EXPERT_REVIEW_PENDING'),
    flagged:outcomes.filter(x=>x.status==='LISTENER_FLAGGED_FOR_REVIEW'),
    linguistic_acoustic_qa:'PENDING_QUALIFIED_REVIEW',approved_realization_count:0,
    note:'Listener PASS/FAIL in this file is unqualified unless a separate authorized expert QA record proves competence and acoustic judgments. This validator never issues QA-PASS realization IDs.'};
}

if(process.argv[1]?.endsWith('lesson-audio-qa-validator.mjs')) {
  const [bundlePath,evidencePath]=process.argv.slice(2);
  if(!bundlePath||!evidencePath){console.error('Usage: node lesson-audio-qa-validator.mjs BUNDLE.json EVIDENCE.json');process.exitCode=2}
  else {
    try {
      const bytes=fs.readFileSync(bundlePath),result=validateLessonAudioQa(JSON.parse(bytes),JSON.parse(fs.readFileSync(evidencePath)),sha256(bytes));
      console.log(JSON.stringify(result,null,2));if(result.status==='REJECTED')process.exitCode=1;
    } catch(error){console.error(error.message);process.exitCode=1}
  }
}
