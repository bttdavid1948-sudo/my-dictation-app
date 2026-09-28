import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'registry',n),'utf8'));
const same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
const fail=s=>{throw Error(s)};
export function validateQueueFoundation(queue,ledger,batch,precheck,pipeline,lessons){
 if(queue.batch_id!=='BATCH_01'||ledger.batch_id!==queue.batch_id||queue.role!=='CALIBRATION')fail('Invalid batch identity');
 if(!same(queue.allowed_lesson_ids,batch.lesson_ids)||!same(queue.allowed_lesson_ids,precheck.selected_lessons.map(x=>x.lesson_id)))fail('Queue ID allowlist mismatch');
 if(new Set(queue.allowed_lesson_ids).size!==12||batch.proposed_lesson_count!==12)fail('Invalid calibration selection');
 if(batch.inputs.some(x=>x.status!=='PASS')||precheck.selected_lessons.some(x=>!x.production_ready||!x.contract_precheck_valid))fail('Preproduction gates incomplete');
 if(queue.snapshot_ref!==batch.registry_snapshot_ref||queue.precheck_ref!=='docs/content-pipeline/registry/batch-01-operations-precheck.json')fail('Versioned source mismatch');
 if(!Array.isArray(ledger.events)||!Array.isArray(queue.items))fail('Invalid queue or ledger');
 if(queue.enabled!==pipeline.production_queue_enabled||queue.enabled!==batch.production_queue_enabled||queue.enabled!==batch.batch_open)fail('Queue activation mismatch');
 if(queue.state==='CLOSED'){
  if(queue.enabled||queue.items.length||ledger.events.length||queue.opening_evidence!==null)fail('Closed queue cannot have work or events');
 }else if(queue.state==='OPEN'||queue.state==='PAUSED'){
  if(queue.enabled!==(queue.state==='OPEN')||!queue.opening_evidence?.snapshot_validation_ref||!queue.opening_evidence?.authorization_ref||!queue.opening_evidence?.rights_check_ref||queue.opening_evidence?.mode!=='INTERNAL_ORIGINAL_DRAFTS_ONLY')fail('Opening evidence missing or pause not disabled');
  if(!same(queue.items.map(x=>x.lesson_id),queue.allowed_lesson_ids))fail('Active/history queue must contain exactly selected work');
 }else fail('Invalid queue state');
 const allowed=new Set(queue.allowed_lesson_ids),seen=new Set(),started=new Set(),submitted=new Set();
 for(const e of ledger.events){
  if(seen.has(e.event_id)||!allowed.has(e.lesson_id)||!e.source_ref||!e.lesson_asset_version||!['PRODUCTION_STARTED','PRODUCTION_SUBMITTED','QA_PASSED','QA_FAILED'].includes(e.type))fail('Invalid or duplicate production event');
  seen.add(e.event_id);
  if(e.type==='PRODUCTION_STARTED'){
   if(started.has(e.lesson_id)&&!e.rework_ref)fail('Reproduction requires versioned rework');
   started.add(e.lesson_id);
  }
  if(e.type==='PRODUCTION_SUBMITTED'){
   if(!started.has(e.lesson_id))fail('Submitted asset without production start');
   submitted.add(e.lesson_id);
  }
  if(e.type.startsWith('QA_')&&!submitted.has(e.lesson_id))fail('QA event without submitted asset');
 }
 if(ledger.events.length&&queue.state==='CLOSED')fail('Events require prior opening');
 if(queue.state!=='CLOSED')for(const [i,refs] of deriveStatusRefs(queue,ledger).entries()){
  if(queue.items[i].production_status_ref!==refs.production_status_ref||queue.items[i].qa_status_ref!==refs.qa_status_ref||queue.items[i].status!==refs.status)fail('Queue status does not match durable event ledger');
 }
 if(lessons.records.some(x=>x.batch_id==='BATCH_01'&&!allowed.has(x.lesson_id)))fail('Unselected lesson in Batch 01');
 return {batch_id:queue.batch_id,state:queue.state,allowed:allowed.size,events:ledger.events.length};
}
export function proposeOpen(queue,ledger,batch,precheck,pipeline,lessons,evidence){
 validateQueueFoundation(queue,ledger,batch,precheck,pipeline,lessons);
 if(queue.state!=='CLOSED')fail('Batch already open');
 if(!evidence?.snapshot_validation_ref||!evidence?.checked_at||!evidence?.authorization_ref||!evidence?.rights_check_ref||evidence.mode!=='INTERNAL_ORIGINAL_DRAFTS_ONLY'||evidence.selected_unproduced_count!==12||evidence.open_conflicts!==0)fail('Fresh snapshot, rights and authority evidence required');
 return {...queue,state:'OPEN',enabled:true,opening_evidence:evidence,items:queue.allowed_lesson_ids.map(lesson_id=>({lesson_id,status:'QUEUED',production_status_ref:null,qa_status_ref:null}))};
}
export function deriveStatusRefs(queue,ledger){
 const reference=e=>e?'docs/content-pipeline/registry/batch-01-production-events.json#'+e.event_id:null;
 return queue.allowed_lesson_ids.map(lesson_id=>{
  const events=ledger.events.filter(x=>x.lesson_id===lesson_id);
  const prod=events.filter(x=>x.type.startsWith('PRODUCTION_')).at(-1);
  const qa=events.filter(x=>x.type.startsWith('QA_')).at(-1);
  const status=qa?.type==='QA_PASSED'?'QA_PASS':qa?.type==='QA_FAILED'?'QA_FAIL':prod?.type==='PRODUCTION_SUBMITTED'?'PRODUCTION_SUBMITTED':prod?.type==='PRODUCTION_STARTED'?'IN_PROGRESS':'QUEUED';
  return {lesson_id,status,production_status_ref:reference(prod),qa_status_ref:reference(qa)};
 });
}
export function proposeEvent(queue,ledger,event){
 if(queue.state!=='OPEN'||!queue.enabled)fail('Cannot record production on closed queue');
 if(!queue.allowed_lesson_ids.includes(event.lesson_id)||!event.source_ref?.startsWith('original://')||!['PRODUCTION_STARTED','PRODUCTION_SUBMITTED','QA_PASSED','QA_FAILED'].includes(event.type)||!event.event_id||!event.source_ref||!event.lesson_asset_version)fail('Invalid production event');
 if(ledger.events.some(x=>x.event_id===event.event_id))fail('Duplicate production event ID');
 const previous=ledger.events.filter(x=>x.lesson_id===event.lesson_id);
 if(event.type==='PRODUCTION_STARTED'&&previous.some(x=>x.type==='PRODUCTION_STARTED')&&!event.rework_ref)fail('Reproduction requires versioned rework');
 if(event.type==='PRODUCTION_SUBMITTED'&&!previous.some(x=>x.type==='PRODUCTION_STARTED'))fail('Submission requires production start');
 if(event.type.startsWith('QA_')&&!previous.some(x=>x.type==='PRODUCTION_SUBMITTED'))fail('QA requires submitted asset');
 return {...ledger,events:[...ledger.events,event]};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const result=validateQueueFoundation(read('batch-01-queue.json'),read('batch-01-production-events.json'),read('batch-01-readiness.json'),read('batch-01-operations-precheck.json'),read('pipeline.json'),read('lessons.json'));
  console.log(JSON.stringify({...result,next_action:read('pipeline.json').next_action},null,2));
 }catch(e){console.error(e.message);process.exitCode=1}
}
