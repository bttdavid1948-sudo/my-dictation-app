'use strict';
// Server-owned ingress; never bundle into browser or deploy demo ports to production.
const {createHash,randomUUID}=require('node:crypto');
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const token=x=>typeof x==='string'&&/^[-A-Za-z0-9]{1,128}$/.test(x),hash=x=>createHash('sha256').update(canonical(x)).digest('hex');
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(x,k));
function createProducer({mode,projectId,auth,store,catalog,normalize,createCore,clock=Date.now,newId=randomUUID}){
 if(mode!=='ISOLATED_NONPRODUCTION'||projectId!=='demo-man-progress-bcd')throw Error('ISOLATED_SERVER_REQUIRED');
 for(const f of [auth?.verify,store?.transaction,store?.read,catalog,normalize,createCore,clock,newId])if(typeof f!=='function')throw Error('SERVER_DEPENDENCY_REQUIRED');
 const path=(uid,id)=>`users/${uid}/trusted_practice/${id}`;
 async function command(input){
  if(!exact(input,['idToken','lessonId','version','attemptId','operationId','expectedRevision','action','body'])||!token(input.lessonId)||!(typeof input.version==='string'&&/^[-A-Za-z0-9._]{1,100}$/.test(input.version))||!token(input.operationId)||!(input.attemptId===null||token(input.attemptId))||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0)throw Error('INVALID_COMMAND');
  const actor=await auth.verify(input.idToken);if(!token(actor?.uid))throw Error('AUTH_REQUIRED');const uid=actor.uid;
  // Catalog/runtime are server dependencies, never supplied in the learner payload.
  const lesson=await catalog(input.lessonId,input.version);if(!lesson||lesson.id!==input.lessonId||lesson.version!==input.version||lesson.publisher!=='man'||lesson.status!=='published')throw Error('CANONICAL_LESSON_REQUIRED');
  const d=normalize(lesson),attemptId=input.attemptId||newId();if(!token(attemptId))throw Error('ATTEMPT_ID_REQUIRED');
  const p=path(uid,attemptId),opPath=path(uid,'op-'+input.operationId),control=`users/${uid}/bcd_product/state`,digest=hash([input.lessonId,input.version,input.attemptId,input.expectedRevision,input.action,input.body]);
  const now=clock();if(!Number.isSafeInteger(now)||now<0)throw Error('SERVER_CLOCK_REQUIRED');
  let result;
  try{result=await store.transaction(async tx=>{
   const [barrier,prior,row]=await Promise.all([tx.get(control),tx.get(opPath),tx.get(p)]);
   const epoch=barrier?.epoch??0;if(!Number.isSafeInteger(epoch)||epoch<0||barrier?.accountDeleted)throw Error('ACCOUNT_FENCED');
   if(prior){if(prior.uid!==uid||prior.digest!==digest||prior.epoch!==epoch)throw Error('OPERATION_CONFLICT');return prior;}
   if(row&&(row.uid!==uid||row.epoch!==epoch||row.lessonId!==lesson.id||row.version!==lesson.version))throw Error('SESSION_FENCED');
   if((row?.revision||0)!==input.expectedRevision)throw Error('REVISION_CONFLICT');
   if(!row&&(input.action!=='start'||input.attemptId!==null))throw Error('START_REQUIRED');
   if(row&&(input.action==='start'||input.attemptId===null||row.commands.length>=64))throw Error('SESSION_COMMAND_LIMIT');
   const core=createCore(d,{instanceId:attemptId});let plan=null,assisted=false;
   const apply=c=>{switch(c.action){
    case 'start':if(!exact(c.body,[]))throw Error('INVALID_BODY');break;
    case 'play':if(!exact(c.body,[]))throw Error('INVALID_BODY');plan=core.beginPlayback();break;
    case 'ended':if(!exact(c.body,['index'])||!Number.isInteger(c.body.index)||!plan||!core.assetEnded(plan.token,c.body.index))throw Error('PLAYBACK_SEQUENCE_REQUIRED');break;
    case 'reveal':if(!exact(c.body,[]))throw Error('INVALID_BODY');assisted=true;core.noteSupport('transcript');break;
    case 'submit':if(!exact(c.body,['choice','speechResponses'])||!Array.isArray(c.body.speechResponses)||c.body.speechResponses.some(x=>typeof x!=='string'||x.length>2000))throw Error('INVALID_BODY');core.submit({...c.body,at:c.at});break;
    default:throw Error('UNSUPPORTED_COMMAND');
   }};
   for(const c of row?.commands||[])apply(c);
   if(row&&now<row.serverAt)throw Error('SERVER_CLOCK_REGRESSION');
   if(core.snapshot().phase==='complete')throw Error('SESSION_COMPLETE');
   const next={action:input.action,body:structuredClone(input.body),at:now};apply(next);const snapshot=core.snapshot();
   const complete=snapshot.phase==='complete'&&snapshot.fullEnded&&Number.isInteger(snapshot.answer)&&!assisted&&snapshot.responseAssisted!==true&&snapshot.spanAnswers.every(x=>x.trim());
   const revision=(row?.revision||0)+1,receiptId=hash([uid,attemptId,revision,input.operationId]);
   const receipt={schema:1,uid,epoch,attemptId,lessonId:lesson.id,version:lesson.version,operationId:input.operationId,digest,revision,serverAt:now,receiptId,phase:snapshot.phase,correct:snapshot.phase==='complete'?snapshot.correct:null,eligible:false,validatedCompletion:complete,activityEligibility:'PENDING_TRUSTED_PRODUCT_BINDING',trust:'SERVER_COMMAND_REPLAY_NONPRODUCTION',timeEligibility:'PENDING_TIME_POLICY',minuteOperationId:hash([uid,attemptId,'minute',revision])};
   tx.set(p,{schema:1,uid,epoch,lessonId:lesson.id,version:lesson.version,revision,serverAt:now,commands:[...(row?.commands||[]),next]});tx.set(opPath,receipt);
   // Completion evidence is written atomically with server state and receipt.
   if(complete)tx.set(path(uid,'completion-'+attemptId),receipt);
   return receipt;
  });}catch(e){
   // Only exact committed receipt readback can resolve response-unknown. Do not
   // swallow ownership/revision/barrier errors or fabricate a successful ACK.
   if(!['RESPONSE_UNKNOWN'].includes(e.message))throw e;
   const prior=await store.read(opPath),barrier=await store.read(control);if(!prior||prior.uid!==uid||prior.digest!==digest||prior.epoch!==(barrier?.epoch??0)||barrier?.accountDeleted)throw Error('READBACK_UNCONFIRMED');result=prior;
  }
  const [ack,barrier]=await Promise.all([store.read(opPath),store.read(control)]);
  if(!ack||canonical(ack)!==canonical(result)||barrier?.accountDeleted||ack.epoch!==(barrier?.epoch??0))throw Error('READBACK_UNCONFIRMED');
  return {ack:true,...ack,scope:'SERVER_OWNED_COMMANDS_NOT_HUMAN_ATTESTATION'};
 }
 return {command};
}
module.exports={createProducer};
