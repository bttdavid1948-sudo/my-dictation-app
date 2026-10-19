'use strict';
// Server-side nonproduction restore admission. No route, credentials or cloud deployment.
// Ports MUST be supplied by the privileged backend, never from a learner request.
const token=x=>typeof x==='string'&&/^[-A-Za-z0-9]{1,100}$/.test(x);
function createRestoreWorker({mode,projectId,receipts,target}) {
 if(mode!=='ISOLATED_NONPRODUCTION'||!/^demo-man-progress[-a-z0-9]*$/.test(projectId||''))throw Error('ISOLATED_BACKEND_REQUIRED');
 for(const [port,names] of [[receipts,['identity','head','page','read']],[target,['identity','fence','replay','verifyAbsent','confirmFence']]])for(const n of names)if(typeof port?.[n]!=='function')throw Error('BACKEND_PORT_REQUIRED');
 return async function restore({restoreId}) {
  if(!token(restoreId))throw Error('RESTORE_ID_REQUIRED');
  const [source,destination]=await Promise.all([receipts.identity(),target.identity()]);
  // A different filename/collection in the restored snapshot is not independent custody.
  if(!token(source?.custodyId)||!token(source?.restoreDomain)||!token(destination?.restoreDomain)||source.restoreDomain===destination.restoreDomain||source.projectId!==projectId||destination.projectId!==projectId)throw Error('INDEPENDENT_RECEIPT_CUSTODY_REQUIRED');
  const fence=await target.fence({restoreId});
  if(fence?.restoreId!==restoreId||fence.writersOff!==true||!token(fence.token))throw Error('WRITER_FENCE_UNCONFIRMED');
  const start=await receipts.head();
  if(!Number.isSafeInteger(start?.sequence)||start.sequence<0)throw Error('RECEIPT_HEAD_UNVERIFIABLE');
  let cursor=null,previous=0,processed=0;const seen=new Set();
  do {
   const page=await receipts.page({through:start.sequence,cursor,limit:100});
   if(!Array.isArray(page?.items)||page.items.length>100||!(page.next===null||token(page.next))||page.next!==null&&seen.has(page.next))throw Error('RECEIPT_PAGE_UNVERIFIABLE');
   for(const row of page.items){
    if(!token(row.id)||!token(row.uid)||!['history','account'].includes(row.kind)||!Number.isSafeInteger(row.sequence)||row.sequence!==previous+1||row.sequence>start.sequence||row.committed!==true)throw Error('RECEIPT_UNVERIFIABLE');
    const canonical=await receipts.read(row.id);
    if(!canonical||JSON.stringify(canonical)!==JSON.stringify(row))throw Error('RECEIPT_READBACK_UNCONFIRMED');
    const ack=await target.replay({restoreId,fenceToken:fence.token,receipt:row});
    if(ack?.receiptId!==row.id||ack.ack!==true)throw Error('REPLAY_UNCONFIRMED');
    const absent=await target.verifyAbsent({restoreId,fenceToken:fence.token,receipt:row});
    if(absent?.receiptId!==row.id||absent.absent!==true)throw Error('DELETION_ABSENCE_UNCONFIRMED');
    previous=row.sequence;processed++;
   }
   if(page.next!==null){seen.add(page.next);if(!page.items.length)throw Error('RECEIPT_PAGE_UNVERIFIABLE');}cursor=page.next;
  }while(cursor!==null);
  if(previous!==start.sequence)throw Error('RECEIPT_GAP');
  const end=await receipts.head();if(end?.sequence!==start.sequence)throw Error('RECEIPT_HEAD_CHANGED');
  // Deliberately never unfreezes writers. Cross-store head validation cannot
  // become an atomic unfreeze merely because a port reports an ACK.
  const finalFence=await target.confirmFence({restoreId,fenceToken:fence.token});
  if(finalFence?.restoreId!==restoreId||finalFence.writersOff!==true||finalFence.token!==fence.token)throw Error('WRITER_FENCE_UNCONFIRMED');
  return {ack:true,restoreId,processed,receiptSequence:start.sequence,writersOff:true,verification:'REPLAY_PREPARATION_ONLY_UNFREEZE_NOT_AUTHORIZED'};
 };
}
// Admission receipts are immutable deletion REQUESTS, not proof of completed
// erasure. Persist them outside the restore domain BEFORE any destructive step.
// resume() is a privileged worker API, never an unauthenticated learner route.
function createDeletionWorker({mode,projectId,identity,receipts,target}) {
 if(mode!=='ISOLATED_NONPRODUCTION'||projectId!=='demo-man-progress-bcd')throw Error('ISOLATED_BACKEND_REQUIRED');
 for(const [port,names] of [[identity,['verify']],[receipts,['identity','admit','read','complete','readCompletion']],[target,['identity','fence','erase','verifyAbsent','confirmFence']]])for(const n of names)if(typeof port?.[n]!=='function')throw Error('BACKEND_PORT_REQUIRED');
 async function custody(){const [s,d]=await Promise.all([receipts.identity(),target.identity()]);if(!token(s?.custodyId)||!token(s?.restoreDomain)||!token(d?.restoreDomain)||s.restoreDomain===d.restoreDomain||s.projectId!==projectId||d.projectId!==projectId)throw Error('INDEPENDENT_RECEIPT_CUSTODY_REQUIRED');}
 function valid(r){return r&&token(r.id)&&token(r.uid)&&token(r.operationId)&&['history','account'].includes(r.kind)&&Number.isSafeInteger(r.sequence)&&r.sequence>0&&r.committed===true;}
 async function resume({receiptId}){
  if(!token(receiptId))throw Error('RECEIPT_ID_REQUIRED');await custody();
  const r=await receipts.read(receiptId);if(!valid(r)||r.id!==receiptId)throw Error('RECEIPT_READBACK_UNCONFIRMED');
  // A prior completion receipt NEVER skips erasure/absence verification: an old
  // snapshot may have reintroduced data. No writer-unfreeze is performed here.
  const fence=await target.fence({receipt:r});if(fence?.receiptId!==r.id||fence.writersOff!==true)throw Error('WRITER_FENCE_UNCONFIRMED');
  const erased=await target.erase({receipt:r});if(erased?.receiptId!==r.id||erased.ack!==true)throw Error('ERASURE_UNCONFIRMED');
  const absent=await target.verifyAbsent({receipt:r});if(absent?.receiptId!==r.id||absent.absent!==true)throw Error('DELETION_ABSENCE_UNCONFIRMED');
  const stillFenced=await target.confirmFence({receipt:r});if(stillFenced?.receiptId!==r.id||stillFenced.writersOff!==true)throw Error('WRITER_FENCE_UNCONFIRMED');
  await receipts.complete({receiptId:r.id});const ack=await receipts.readCompletion(r.id);if(ack?.receiptId!==r.id||ack.ack!==true)throw Error('COMPLETION_READBACK_UNCONFIRMED');
  return {receiptId:r.id,ack:true,writersOff:true,verification:'NONPRODUCTION_TARGET_PORT_COVERAGE_ONLY'};
 }
 async function request({idToken,uid,operationId,kind}){
  if(!token(uid)||!token(operationId)||!['history','account'].includes(kind))throw Error('DELETION_REQUEST_INVALID');await custody();
  const actor=await identity.verify(idToken);if(actor?.uid!==uid)throw Error('DELETION_OWNERSHIP_REQUIRED');
  const r=await receipts.admit({uid,kind,operationId,committed:true});
  if(!valid(r)||r.uid!==uid||r.kind!==kind||r.operationId!==operationId)throw Error('RECEIPT_ADMISSION_UNCONFIRMED');
  const stored=await receipts.read(r.id);if(JSON.stringify(stored)!==JSON.stringify(r))throw Error('RECEIPT_READBACK_UNCONFIRMED');
  return resume({receiptId:r.id});
 }
 return {request,resume};
}
module.exports={createRestoreWorker,createDeletionWorker};
