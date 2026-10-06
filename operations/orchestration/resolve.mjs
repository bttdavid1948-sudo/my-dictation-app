import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
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
 const ref='docs/content-pipeline/registry/batch-02-completion-checkpoint.json';
 if(pipeline.current_state_index_ref!=='docs/content-pipeline/registry/batch-02-closure-evidence-index.json'||pipeline.current_state_ref!==ref||index.current_state_ref!==ref)fail('current pointers');
 for(const a of index.artifacts)if(hashOf(a.path)!==a.sha256)fail('evidence hash '+a.path);
 if(!index.artifacts.some(a=>a.path===ref))fail('unbound close');
 if(index.state_scope!=='CURRENT_AUTHORITATIVE'||index.terminal_state!=='OBJECTIVE_COMPLETE'||close.state_scope!=='CURRENT_AUTHORITATIVE'||close.batch_id!=='BATCH_02'||close.status!=='BATCH_02_COMPLETE_12_OF_12'||close.terminal_state!=='OBJECTIVE_COMPLETE'||!close.batch_close_complete)fail('closure status');
 if(close.complete_lesson_count!==12||close.selected_lesson_count!==12||index.complete_lesson_count!==12||close.pairs.length!==12||new Set(close.pairs.map(p=>p.lesson_id)).size!==12||JSON.stringify([...close.pairs.map(p=>p.lesson_id)].sort())!==JSON.stringify([...close.fully_complete_lesson_ids].sort())||close.pairs.some(p=>p.status!=='COMPLETE'))fail('completion count');
 if(close.queue_state!=='CLOSED'||pipeline.production_queue_enabled!==false||close.batch03_opened!==false)fail('queue boundary');
 for(const key of ['remaining_lesson_ids','active_exceptions','pending_final_practice_pairs'])if(!Array.isArray(close[key])||close[key].length)fail(key);
 for(const action of [pipeline.next_action,pipeline.independent_operations_next_action,index.next_action,close.next_action])if(action?.code!=='NONE'||action.responsible_lane!=='NONE')fail('next action');
 return {batchId:close.batch_id,status:close.status,terminalState:close.terminal_state,currentStateRef:ref,next_action:close.next_action,queue:'CLOSED',completeLessonCount:12,remainingLessonCount:0,activeExceptionCount:0,actionable:[],handoffs:[],completed:close.pairs,executionMode:'READ_ONLY_CANONICAL_STATE',externalCalls:0,newProductionStarted:false};
}
export function currentState(){
 const pipeline=read('docs/content-pipeline/registry/pipeline.json');
 const index=read('docs/content-pipeline/registry/batch-02-closure-evidence-index.json');
 return resolveCanonicalState(pipeline,index,read(index.current_state_ref),p=>createHash('sha256').update(fs.readFileSync(path.join(repo,p))).digest('hex'));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{const file=process.argv[2];const result=file?planIndependent(JSON.parse(fs.readFileSync(file,'utf8'))):currentState();console.log(JSON.stringify(result,null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
