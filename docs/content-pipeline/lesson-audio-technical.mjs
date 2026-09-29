import fs from 'node:fs';
import {createHash} from 'node:crypto';

const sha = b => createHash('sha256').update(b).digest('hex');
const read = p => {const bytes=fs.readFileSync(p);return {bytes,data:JSON.parse(bytes)}};
const insist = (ok,why) => {if(!ok)throw Error(why)};

export function validateStaticAudioBindings(bundle,assets,candidates,runtime) {
  insist(bundle?.schema_version==='1.0'&&bundle.lessons?.length===7,'BUNDLE_SCOPE');
  insist(bundle.runtime_profile_ref==='MAN-BV-CHROME153-WIN10-22H2-VOICES4@v0.1','RUNTIME_REF');
  insist(bundle.safety?.approved_realization_count===0&&bundle.safety?.publication_allowed===false,'PREMATURE_APPROVAL');
  insist(runtime?.runtime?.speaker_capacity===4&&runtime.results?.length===5&&
    runtime.results.every(x=>x.event_status==='ENDED'&&x.ended_at_ms>x.started_at_ms),'RUNTIME_PLAYBACK_EVENTS');
  const byAsset=new Map(assets.assets.map(a=>[`${a.lesson_id}@${a.lesson_asset_version}`,a]));
  const byCandidate=new Map(candidates.candidates.map(c=>[c.candidate_id,c]));
  const voiceSet=new Set(runtime.runtime.voices.map(v=>v.voice_uri));
  const seen=new Set();let segments=0,targets=0;
  for(const l of bundle.lessons) {
    const key=`${l.lesson_id}@${l.lesson_asset_version}`,a=byAsset.get(key),c=byCandidate.get(l.binding?.candidate_id);
    insist(a&&c&&!c.exception_path&&c.lesson_id===l.lesson_id&&c.lesson_asset_version===l.lesson_asset_version&&
      !seen.has(key),`SOURCE_IDENTITY_${key}`);seen.add(key);
    insist(l.profile?.producer_neutral===true&&l.profile.status==='CANDIDATE_PENDING_LESSON_AUDIO_QA'&&
      l.binding.status==='BOUND_FOR_QA_NOT_APPROVED'&&l.binding.realization_id===null&&
      l.binding.available_audio_realization_ref===null&&l.binding.runtime_profile_ref===bundle.runtime_profile_ref,
      `BINDING_STATUS_${key}`);
    const anchor=a.target_anchors.find(x=>x.anchor_id===l.profile.source_anchor_id);
    insist(anchor&&anchor.anchor_kind==='SPEECH_PHENOMENON'&&
      anchor.phenomenon_type===l.profile.desired_output_conditions.phenomenon_type&&
      JSON.stringify(anchor.segment_ids)===JSON.stringify(l.profile.desired_output_conditions.target_segment_ids),
      `ANCHOR_${key}`);
    insist(JSON.stringify(l.segments)===JSON.stringify(a.segments.map(s=>({segment_id:s.segment_id,script_speaker_id:s.script_speaker_id,text:s.text})))&&
      JSON.stringify(c.segment_mapping.map(x=>x.segment_id))===JSON.stringify(a.segments.map(x=>x.segment_id))&&
      JSON.stringify(l.binding.segment_mapping.map(x=>x.segment_id))===JSON.stringify(a.segments.map(x=>x.segment_id)),
      `SEGMENT_MAPPING_${key}`);
    const slots=new Set(a.segments.map(x=>x.script_speaker_id));
    insist(l.binding.script_speaker_map.length===slots.size&&
      slots.size<=runtime.runtime.speaker_capacity&&
      l.binding.script_speaker_map.every(m=>slots.has(m.script_speaker_id)&&voiceSet.has(m.realized_speaker_ref))&&
      new Set(l.binding.script_speaker_map.map(x=>x.realized_speaker_ref)).size===slots.size,
      `SPEAKER_MAP_${key}`);
    for(const span of anchor.span_refs) {
      const s=a.segments.find(x=>x.segment_id===span.segment_id);
      insist(s&&s.text.slice(span.start_char,span.end_char)===span.target_text,`SPAN_${key}`);
    }
    segments+=a.segments.length;targets+=anchor.segment_ids.length;
  }
  insist(seen.size===7&&segments===32&&targets===13,'BATCH_COUNTS');
  return {status:'STATIC_CONTRACT_PASS',lessons:7,segments,anchor_target_segments:targets,
    actual_lesson_playback:'PENDING',linguistic_acoustic_qa:'PENDING_QUALIFIED_REVIEW',
    approved_realization_count:0};
}

if(process.argv[1]?.endsWith('lesson-audio-technical.mjs')) {
  const paths=process.argv.slice(2);
  if(paths.length!==4){console.error('Usage: node lesson-audio-technical.mjs BUNDLE.json ASSETS.json CANDIDATES.json RUNTIME_EVIDENCE.json');process.exitCode=2}
  else try {
    const [b,a,c,r]=paths.map(read);
    insist(sha(a.bytes)===b.data.canonical_assets_sha256,'ASSET_HASH');
    insist(sha(r.bytes)===b.data.runtime_evidence_sha256,'RUNTIME_HASH');
    console.log(JSON.stringify({...validateStaticAudioBindings(b.data,a.data,c.data,r.data),bundle_sha256:sha(b.bytes)},null,2));
  }catch(e){console.error(e.message);process.exitCode=1}
}
