import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {buildReadPack,admitReadPack} from './bootstrap.mjs';
const pass=v=>v===true||v==='PASS';
export function operationKey(pair,stage,assetSha256='none'){return [pair.lessonId,pair.lessonVersion,pair.realizationId||'unbound',stage,assetSha256].join('@');}
export function reconcileReceipt(pair,stage,asset,receipt){
 if(!receipt)return {action:'MISSING',key:operationKey(pair,stage,asset.sha256)};
 const key=operationKey(pair,stage,asset.sha256);
 if(receipt.key!==key||receipt.inputSha256!==asset.inputSha256||receipt.outputSha256!==asset.sha256)return {action:'BLOCKED',code:'RECEIPT_BINDING_MISMATCH',key};
 return receipt.status==='PASS'?{action:'REUSE',key}:{action:'INCOMPLETE',key};
}
export function resolveLesson(s){
 const pair={lessonId:s.lessonId,lessonVersion:s.lessonVersion,realizationId:s.realizationId};
 const result=(code,lane,stop=false,detail='')=>({pair,code,responsibleLane:lane,stop,detail,operationKey:operationKey(pair,code,s.assetManifestSha256||'none')});
 if(s.frozenContractBreaking)return result('OWNER_DECISION_REQUIRED','OWNER',true,'Breaking frozen contract; do not execute.');
 if(s.uniquePurpose==='DUPLICATE')return result('DUPLICATE','CURRICULUM_3',true,'No Operations override of reserved purpose.');
 if(s.practiceConflict)return result('PRACTICE_CONFLICT','PRACTICE_2',true,'Final semantic disposition belongs to Practice.');
 if(s.bindingMismatch)return result('ASSET_BINDING_MISMATCH','OPERATIONS_4',true,'Preserve exact existing assets; reconcile before mutation.');
 if(s.capabilitiesExhausted)return result('BLOCKED','OPERATIONS_4',true,'Report exact blocker, attempts, safer paths, independent work and minimum needed action.');
 if(s.sameMethodFailures>=2&&!s.methodChanged)return result('RETRY_ESCALATION','OPERATIONS_4',false,'Choose another method/capability; no same-method loop.');
 if(!pass(s.uniquePurposePass)||!pass(s.curriculumReady))return result('RETURN_TO_CURRICULUM','CURRICULUM_3',true,'Versioned existing identity/purpose and explicit Curriculum disposition required.');
 if(!pass(s.practicePreprodReady)||!pass(s.contractPrecheck))return result('PRACTICE_PREPRODUCTION','PRACTICE_2',true,'Reuse existing gate outputs; do not infer semantics.');
 if(!s.assetsBound){if(!s.productionAuthorized)return result('OWNER_PERMISSION_REQUIRED','OWNER',true,'Only the missing production scope/budget permission is required.');return result('TARGETED_SYNTHESIS_AND_ORDINARY_QA','OPERATIONS_4',false,'Reuse exact hashes first; produce only missing assets, bound to canonical segments.');}
 if(s.concreteAudioDefect)return result('TARGETED_VERSIONED_REWORK','OPERATIONS_4',false,'Repair only concrete learner-outcome defects; preserve accepted siblings.');
 if(!pass(s.ordinaryAudioQa))return result('ORDINARY_AUDIO_QA','OPERATIONS_4',false,'Accent uncertainty alone is nonblocking.');
 if(!pass(s.finalPracticeReady)||!pass(s.contractValid))return result('FINAL_EXACT_REALIZATION_DISPOSITION','PRACTICE_2',true,'Exact version/hash handoff; do not reopen static passed gates.');
 if(!pass(s.supportReady)||!pass(s.rightsReady))return result('PREPARE_SUPPORT_AND_RIGHTS','OPERATIONS_4',false,'Use existing bundle/provenance review; block unclear rights before publication.');
 if(!s.releaseAuthorized)return result('OWNER_PERMISSION_REQUIRED','OWNER',true,'Missing publication scope; prepare concrete reviewable release first.');
 if(!s.releaseDeployed)return result('CONTROLLED_RELEASE','OPERATIONS_4',false,'Publish exact approved catalog/assets through reviewed PR and scoped rollback.');
 if(!pass(s.desktopLive)||!pass(s.mobileLive)||!pass(s.feedbackWriteAck)||!pass(s.rollbackVerified))return result('MINIMUM_LIVE_VERIFICATION','OPERATIONS_4',false,'Only missing release outcomes; shared feedback-read capability is reused.');
 return result('COMPLETE','NONE',false,'All exact outcomes preserved; no regeneration, reupload or completed-gate rerun.');
}
export function planIndependent(states){const results=states.map(resolveLesson);return {actionable:results.filter(x=>!x.stop&&x.code!=='COMPLETE'),completed:results.filter(x=>x.code==='COMPLETE'),handoffs:results.filter(x=>x.stop),globalStop:results.length>0&&results.every(x=>x.stop)};}
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(repo,p),'utf8'));
export function actualBatch01(){
 const close=read('docs/content-pipeline/registry/batch-01-completion-checkpoint.json'),lessons=read('docs/content-pipeline/registry/lessons.json');
 if(close.status!=='BATCH_01_COMPLETE_12_OF_12'||!close.batch_close_complete)throw Error('BatchClose not clean; orchestration readiness cannot infer completion');
 const states=close.pairs.map(p=>{const l=lessons.records.find(x=>x.lesson_id===p.lesson_id);const body=fs.readFileSync(path.join(repo,p.release_evidence_ref));if(createHash('sha256').update(body).digest('hex')!==p.release_evidence_sha256)throw Error('Release evidence hash drift: '+p.lesson_id);
  return {lessonId:p.lesson_id,lessonVersion:p.lesson_asset_version,realizationId:p.realization_id,uniquePurposePass:l.unique_purpose_pass,curriculumReady:l.curriculum_ready,practicePreprodReady:l.practice_preprod_ready,contractPrecheck:l.contract_precheck_status,assetsBound:l.available_audio_realization_refs.includes(p.realization_id),assetManifestSha256:p.release_evidence_sha256,ordinaryAudioQa:true,finalPracticeReady:p.practice_ready,contractValid:p.contract_valid,supportReady:true,rightsReady:true,releaseAuthorized:true,releaseDeployed:l.publication_state==='RELEASED_OFFICIAL_CONTROLLED_INTERNAL',desktopLive:l.live_runtime_verified,mobileLive:l.definition_of_done_complete,feedbackWriteAck:l.definition_of_done_complete,rollbackVerified:l.definition_of_done_complete,productionAuthorized:true,evidenceRef:p.release_evidence_ref,acceptanceBasis:'Preserved canonical exact-pair completion; no gate rerun'};});
 return {...planIndependent(states),batchId:'BATCH_01',executionMode:'READ_ONLY_ACTUAL_TRACE_REPLAY',externalCalls:0,newProductionStarted:false};
}
// Current operational truth is explicit and hash-bound; Batch01 replay remains historical.
export function resolveCanonicalState(pipeline,index,close,hashOf){
 const fail=message=>{throw Error('CANONICAL_STATE_MISMATCH: '+message);};
 const batch=close.batch_id,number=batch==='BATCH_02'?'02':batch==='BATCH_03'?'03':null;
 if(!number)fail('unsupported batch');
 const count=number==='02'?12:3,ref=`docs/content-pipeline/registry/batch-${number}-completion-checkpoint.json`;
 if(pipeline.current_state_index_ref!==`docs/content-pipeline/registry/batch-${number}-closure-evidence-index.json`||pipeline.current_state_ref!==ref||index.current_state_ref!==ref)fail('current pointers');
 for(const a of index.artifacts)if(hashOf(a.path)!==a.sha256)fail('evidence hash '+a.path);
 if(!index.artifacts.some(a=>a.path===ref))fail('unbound close');
 if(index.state_scope!=='CURRENT_AUTHORITATIVE'||index.terminal_state!=='OBJECTIVE_COMPLETE'||close.state_scope!=='CURRENT_AUTHORITATIVE'||index.batch_id!==batch||close.status!==`${batch}_COMPLETE_${count}_OF_${count}`||close.terminal_state!=='OBJECTIVE_COMPLETE'||!close.batch_close_complete)fail('closure status');
 if(close.complete_lesson_count!==count||close.selected_lesson_count!==count||index.complete_lesson_count!==count||close.pairs.length!==count||new Set(close.pairs.map(p=>p.lesson_id)).size!==count||JSON.stringify([...close.pairs.map(p=>p.lesson_id)].sort())!==JSON.stringify([...close.fully_complete_lesson_ids].sort())||close.pairs.some(p=>p.status!=='COMPLETE'))fail('completion count');
 if(close.queue_state!=='CLOSED'||pipeline.production_queue_enabled!==false||(number==='02'?close.batch03_opened!==false:close.batch04_opened!==false||close.r1_4_executed!==false))fail('queue boundary');
 if(number==='03'){
  if(index.staging_pass_count!==6||index.live_pass_count!==6)fail('live count');
  for(const pair of close.pairs){
   for(const gate of ['practice_ready','contract_valid','desktop_live','mobile_live','feedback_write_ack','rollback_verified'])if(pair[gate]!=='PASS')fail('pair gate '+pair.lesson_id+' '+gate);
   for(const prefix of ['practice_evidence','release_evidence','support'])if(hashOf(pair[prefix+'_ref'])!==pair[prefix+'_sha256'])fail('pair evidence '+pair.lesson_id+' '+prefix);
  }
 }
 for(const key of ['remaining_lesson_ids','active_exceptions','pending_final_practice_pairs'])if(!Array.isArray(close[key])||close[key].length)fail(key);
 for(const action of [pipeline.next_action,pipeline.independent_operations_next_action,index.next_action,close.next_action])if(action?.code!=='NONE'||action.responsible_lane!=='NONE')fail('next action');
 return {batchId:close.batch_id,status:close.status,terminalState:close.terminal_state,currentStateRef:ref,next_action:close.next_action,queue:'CLOSED',completeLessonCount:count,remainingLessonCount:0,activeExceptionCount:0,actionable:[],handoffs:[],completed:close.pairs,executionMode:'READ_ONLY_CANONICAL_STATE',externalCalls:0,newProductionStarted:false};
}
export function currentState(){
 const pipeline=read('docs/content-pipeline/registry/pipeline.json');
 const index=read(pipeline.current_state_index_ref);
 const hash=p=>createHash('sha256').update(fs.readFileSync(path.join(repo,p))).digest('hex');
 const previous=resolveCanonicalState(pipeline,index,read(index.current_state_ref),hash);
 if(!pipeline.active_batch_checkpoint_ref)return previous;
 return resolveBatch04(read(pipeline.active_batch_checkpoint_ref),hash,previous);
}
// Finite Owner-authorized Batch04 overlay; preserve prior closure and planner.
export function resolveBatch04(s,hashOf,previous){
 const fail=m=>{throw Error('BATCH04_STATE_MISMATCH: '+m);};
 const ids=['MAN-0031','MAN-0271','MAN-0451','MAN-0581','MAN-0831','MAN-0951'];
 if(s.batch_id!=='BATCH_04'||s.owner_execution_authorized!==true||s.scope!=='OFFICIAL_MAN_1000_ONLY'||s.r1_4_authorized!==false)fail('authority');
 if(s.states.length!==6||JSON.stringify(s.states.map(x=>x.lessonId).sort())!==JSON.stringify(ids))fail('finite identities');
 for(const a of s.artifacts)if(hashOf(a.path)!==a.sha256)fail('evidence hash '+a.path);
 if(!s.artifacts.some(x=>x.path==='operations/batch04-production/preproduction-receipt.json'))fail('missing readiness binding');
 const plan=planIndependent(s.states),count=plan.completed.length;
 if(s.queue_state!==(count===6?'CLOSED':'OPEN')||s.complete_lesson_count!==count)fail('completion/queue');
 if(count===6&&s.states.some(x=>!x.releaseEvidenceRef||hashOf(x.releaseEvidenceRef)!==x.releaseEvidenceSha256))fail('unbound live close');
 return {...plan,batchId:'BATCH_04',status:count===6?'BATCH_04_COMPLETE_6_OF_6':s.status,terminalState:count===6?'OBJECTIVE_COMPLETE':'IN_PROGRESS',currentStateRef:'docs/content-pipeline/registry/batch-04-operations-checkpoint.json',next_action:count===6?{code:'NONE',responsible_lane:'NONE'}:s.next_action,queue:s.queue_state,completeLessonCount:count,remainingLessonCount:6-count,activeExceptionCount:plan.handoffs.length,previousClosure:{batchId:previous.batchId,status:previous.status},executionMode:'READ_ONLY_CANONICAL_STATE',externalCalls:0,newProductionStarted:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{
 const file=process.argv[2];let result;
 if(file==='--preflight'||file==='--admit-scope'){
  const envelope=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
  const pack=buildReadPack(envelope,{root:repo,state:currentState()});
  result=file==='--preflight'?pack:admitReadPack(pack,JSON.parse(fs.readFileSync(process.argv[4],'utf8')));
 }else result=file?planIndependent(JSON.parse(fs.readFileSync(file,'utf8'))):currentState();
 console.log(JSON.stringify(result,null,2));
}catch(e){console.error(e.message);process.exitCode=1;}}
