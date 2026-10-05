import assert from 'node:assert/strict';import fs from 'node:fs';import {fileURLToPath} from 'node:url';
export function inspect(a,r){
 const errors=[];const require=(condition,code)=>{if(!condition)errors.push(code);};
 require(typeof a.lesson_id==='string'&&typeof a.lesson_asset_version==='string','MISSING_ASSET_IDENTITY');
 const segments=a.segments||[],ids=segments.map(x=>x.segment_id),anchors=a.target_anchors||[];
 require(segments.length>0&&new Set(ids).size===ids.length,'INVALID_SEGMENTS');
 require(a.canonical_transcript===segments.map(x=>x.text).join('\n'),'TRANSCRIPT_SEGMENT_MISMATCH');
 require(anchors.length>0&&new Set(anchors.map(x=>x.anchor_id)).size===anchors.length,'INVALID_ANCHORS');
 const slices=[];for(const x of anchors){require(['COMPREHENSION','SPEECH_PHENOMENON','LEXICAL'].includes(x.anchor_kind),'INVALID_ANCHOR_KIND');require(typeof x.construct_type==='string'&&x.construct_type.length>0,'MISSING_CONSTRUCT');
  require(Array.isArray(x.segment_ids)&&x.segment_ids.length>0&&x.segment_ids.every(id=>ids.includes(id)),'INVALID_ANCHOR_SEGMENT_REF');
  if(x.anchor_kind==='COMPREHENSION')require(x.evidence_segment_ids?.length>0&&x.evidence_segment_ids.every(id=>ids.includes(id))&&!!x.target_proposition_or_reference_answer,'MISSING_COMPREHENSION_EVIDENCE');
  for(const p of x.span_refs||[]){const s=segments.find(s=>s.segment_id===p.segment_id);const valid=!!s&&x.segment_ids.includes(p.segment_id)&&Number.isInteger(p.start_char)&&Number.isInteger(p.end_char)&&p.start_char>=0&&p.start_char<p.end_char&&p.end_char<=s.text.length;require(valid,'INVALID_UTF16_SPAN');if(valid)slices.push({anchor_id:x.anchor_id,segment_id:p.segment_id,text:s.text.slice(p.start_char,p.end_char)});}
 }
 if(!r)return {lesson_id:a.lesson_id,lesson_asset_version:a.lesson_asset_version,structural_errors:errors,span_slices:slices,ready_for_final_grounding:false,blocker:'ACTUAL_REALIZATION_MISSING',PRACTICE_READY:false,CONTRACT_VALID:false};
 require(r.lesson_id===a.lesson_id&&r.lesson_asset_version===a.lesson_asset_version,'REALIZATION_VERSION_MISMATCH');require(a.available_audio_realization_refs?.includes(r.realization_id),'REALIZATION_NOT_AVAILABLE');
 require(!!r.audio_profile_id&&!!r.audio_profile_version&&!!r.qa_version&&r.qa_status==='PASS','REALIZATION_QA_OR_PROFILE_MISSING');
 const map=r.segment_mapping||[];require(map.length===segments.length&&new Set(map.map(x=>x.segment_id)).size===map.length&&map.every(x=>ids.includes(x.segment_id)),'REALIZATION_MAPPING_INCOMPLETE');
 require(['PERSISTED_ASSET','RUNTIME_RENDERED'].includes(r.delivery_mode),'INVALID_DELIVERY_MODE');
 for(const m of map){require(m.alignment_mode==='SEGMENT_ADDRESSABLE'?!!m.segment_playback_ref:m.alignment_mode==='TIMECODED'&&Number.isInteger(m.start_ms)&&Number.isInteger(m.end_ms)&&m.start_ms>=0&&m.end_ms>m.start_ms,'INVALID_PLAYBACK_MAPPING');}
 return {lesson_id:a.lesson_id,lesson_asset_version:a.lesson_asset_version,realization_id:r.realization_id,structural_errors:errors,span_slices:slices,ready_for_final_grounding:errors.length===0,PRACTICE_READY:false,CONTRACT_VALID:false,note:'Integrity is not a semantic disposition. Apply frozen mapping/evidence rules and actual verified cue evidence before final PASS.'};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const a=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const r=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):null;console.log(JSON.stringify(inspect(a,r),null,2));}
