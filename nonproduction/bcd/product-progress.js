/* Isolated product integration; state admission is NOT learning/server attestation. */
(function(g){'use strict';
function transport(raw,{uid,getActor,mode}={}){
 if(mode!=='ISOLATED_NONPRODUCTION'||!/^[-A-Za-z0-9]{1,100}$/.test(uid||'')||typeof getActor!=='function')throw Error('ISOLATED_PRODUCT_REQUIRED');
 const actor=getActor(),validator=new g.ManProductCloud.Client(raw),control=`users/${uid}/bcd_product/state`,prefix=`users/${uid}/lesson_progress/`;validator.selectUid(uid);let epoch;const fences=new Map();
 const owns=()=>{const a=getActor();if(actor.uid!==uid||a?.uid!==uid||a.generation!==actor.generation)throw Error('ACCOUNT_CHANGED');};
 const path=p=>{if(typeof p!=='string'||!p.startsWith(prefix)||!/^[-A-Za-z0-9_]+(?:\/completions\/[-A-Za-z0-9]+)?$/.test(p.slice(prefix.length)))throw Error('PROGRESS_PATH_DENIED');};
 async function admit(tx){owns();const d=await tx.get(control);owns();try{if(d&&!validator.valid(d))throw Error();}catch{throw Error('UNVERIFIABLE_ACCOUNT');}if(d?.accountDeleted)throw Error('ACCOUNT_DELETED');const n=d?.epoch||0;if(!Number.isSafeInteger(n)||n>999999999)throw Error('UNVERIFIABLE_ACCOUNT');if(epoch===undefined)epoch=n;if(n!==epoch)throw Error('STALE_ACCOUNT_EPOCH');return {epoch:n,lessonFences:d?.schema===4?d.lessonFences:{}};}
 // A post-deletion generation has a fresh namespace. Older records remain
 // inaccessible to this adapter; this is a barrier, NOT verified erasure.
 const physical=(p,n,f=0)=>{const suffix=p.slice(prefix.length),parts=suffix.split('/'),base=(n===0?prefix:`users/${uid}/lesson_progress_epochs/${n}/lessons/`)+parts[0];return base+(f?'/generations/'+f:'')+(parts.length>1?'/'+parts.slice(1).join('/'):'');};
 const fence=(p,state)=>{const k=p.slice(prefix.length).split('/')[0],id=k.replace(/^(official|private)_/,'');const f=state.lessonFences[id]||0;if(fences.has(k)&&fences.get(k)!==f)throw Error('STALE_LESSON_FENCE');fences.set(k,f);return f;};
 const record=(d,n)=>{if(d&&(d.uid!==uid||(d.accountEpoch??0)!==n))throw Error('PROGRESS_EPOCH_MISMATCH');return d;};
 return {timestamp:raw.timestamp,
  pendingStorage(storage){if(!storage)return null;const slot=k=>{owns();if(!Number.isSafeInteger(epoch))throw Error('ACCOUNT_NOT_ADMITTED');if(typeof k!=='string'||!k.startsWith('man_cloud_pending_v1_'+uid+'_'))throw Error('PENDING_PATH_DENIED');const identity=k.slice(('man_cloud_pending_v1_'+uid+'_').length);if(!fences.has(identity))throw Error('ACCOUNT_NOT_ADMITTED');const f=fences.get(identity);return k+(epoch>0?'_epoch_'+epoch:'')+(f?'_lesson_'+f:'');};return {getItem:k=>storage.getItem(slot(k)),setItem:(k,v)=>storage.setItem(slot(k),v),removeItem:k=>storage.removeItem(slot(k))};},
  read:p=>{path(p);return raw.transaction(async tx=>{const state=await admit(tx),n=state.epoch,f=fence(p,state),d=await tx.get(physical(p,n,f));owns();record(d,n);return d&&(d.lessonFence||0)!==f?null:d;});},
  transaction:fn=>raw.transaction(async tx=>{const state=await admit(tx),n=state.epoch;return fn({get:async p=>{path(p);const f=fence(p,state),d=await tx.get(physical(p,n,f));owns();record(d,n);return d&&(d.lessonFence||0)!==f?null:d;},set:(p,d)=>{path(p);owns();if(d?.uid!==uid||Object.hasOwn(d,'accountEpoch')&&d.accountEpoch!==n)throw Error('PROGRESS_OWNER_MISMATCH');const f=fence(p,state);return tx.set(physical(p,n,f),{...d,accountEpoch:n,...(f?{lessonFence:f}: {})});}});})
 };
}
const api={transport};g.ManProductProgress=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis==='undefined'?window:globalThis);
