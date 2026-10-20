/* UID history cutover. OFF unless explicitly enabled by a nonproduction host.
 * No cloud calls, legacy deletion, unowned-data adoption or guest persistence.
 * IndexedDB serializes read/write transactions across tabs; ACK is oncomplete.
 */
(function(root){
 'use strict';
 const channels={dictation:60,man_comprehension_history_v1:60,man_batch02_evidence_v1:100};
 const clone=v=>JSON.parse(JSON.stringify(v));
 function create({indexedDB,legacy,enabled=false,dbName='man_uid_history_v1',notify=()=>{}}={}){
  let selected=null,generation=0,cache={},opening=null;
  const api={enabled,ready:false,status:'OFF',uid:null};
  function open(){if(!opening)opening=new Promise((resolve,reject)=>{
   if(!indexedDB)return reject(Error('HISTORY_STORAGE_UNAVAILABLE'));
   const r=indexedDB.open(dbName,1);
   r.onupgradeneeded=()=>r.result.createObjectStore('accounts',{keyPath:'uid'});
   r.onerror=()=>reject(r.error||Error('HISTORY_OPEN_FAILED'));
   r.onblocked=()=>reject(Error('HISTORY_OPEN_BLOCKED'));
   r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result)};
  }).catch(e=>{opening=null;throw e});return opening}
  const validUid=u=>typeof u==='string'&&u.length>0&&u.length<=128;
  function source(uid){
   if(!legacy)throw Error('LEGACY_STORAGE_UNAVAILABLE');
   // A failed read or malformed owned source must not seal an empty migration.
   const read=k=>{const s=legacy?.getItem(k);if(!s)return [];const a=JSON.parse(s);if(!Array.isArray(a))throw Error('LEGACY_HISTORY_INVALID');return a};
   const out={dictation:read('xnot_history_uid_'+uid)};
   for(const k of Object.keys(channels).filter(k=>k!=='dictation'))out[k]=read(k).filter(r=>r&&r.uid===uid);
   for(const k of Object.keys(channels))out[k]=out[k].filter(r=>r&&typeof r==='object'&&(!Object.hasOwn(r,'uid')||r.uid===uid)).slice(-channels[k]);
   return out;
  }
  const fenceKey=uid=>'man_account_deleted_cache_v1_uid_'+uid;
  function checkFence(uid){
   let raw;try{raw=legacy.getItem(fenceKey(uid))}catch{throw Error('HISTORY_STORAGE_UNAVAILABLE')}
   if(raw!==null)throw Error('HISTORY_ACCOUNT_DELETED');
  }
  async function transact(uid,change){
   if(!validUid(uid))throw Error('HISTORY_UID_REQUIRED');checkFence(uid);const db=await open();checkFence(uid);
   return new Promise((resolve,reject)=>{
    const t=db.transaction('accounts','readwrite'),s=t.objectStore('accounts');let result,failure;
    t.oncomplete=()=>resolve(clone(result));t.onabort=()=>reject(failure||t.error||Error('HISTORY_ABORTED'));t.onerror=()=>{};
    const r=s.get(uid);r.onsuccess=()=>{try{
     checkFence(uid);const prior=r.result;
     if(prior?.schema===2&&prior.deleted===true)throw Error('HISTORY_ACCOUNT_DELETED');
     if(prior&&(prior.schema!==1||prior.uid!==uid||prior.migrated!==true))throw Error('HISTORY_SCHEMA_INVALID');
     const record=prior||{schema:1,uid,migrated:true,channels:source(uid),ids:[],revision:0};
     change(record);record.revision++;const bytes=JSON.stringify(record);
     if(bytes.length>500000)throw Error('HISTORY_SIZE_LIMIT');
     s.put(record);result=record;
    }catch(e){failure=e;t.abort()}};
   });
  }
  function publish(uid,record,token){if(selected!==uid||token!==generation)return;cache=record.channels;api.ready=true;api.status='ACKNOWLEDGED';notify(uid,api.status)}
  api.select=async uid=>{
   selected=validUid(uid)?uid:null;api.uid=selected;cache={};api.ready=false;const token=++generation;
   if(!enabled||!selected){api.status=enabled?'GUEST_MEMORY_ONLY':'OFF';return null}
   api.status='LOADING';try{
    let r=await transact(selected,()=>{});const actor=r.uid,prefix='man_history_pending_v1:'+encodeURIComponent(actor)+':';
    const pending=[];if(legacy.length>5000)throw Error('HISTORY_RECOVERY_SCAN_LIMIT');
    for(let i=0;i<legacy.length;i++){const k=legacy.key(i);if(k?.startsWith(prefix))pending.push(JSON.parse(legacy.getItem(k)))}
    for(const p of pending){if(p.uid!==actor)throw Error('HISTORY_OWNER_MISMATCH');r=await api.append(actor,p.key,p.rows,p.id)}
    publish(actor,r,token);return r;
   }catch(e){if(token===generation){api.status='UNCONFIRMED';notify(selected,api.status)}throw e}
  };
  api.read=key=>{if(!enabled||!api.ready||!selected)return [];try{checkFence(selected)}catch{cache={};api.ready=false;api.status='ACCOUNT_DELETED';return []}return clone(cache[key]||[])};
  api.append=async(uid,key,rows,id)=>{
   if(!enabled)return null;if(!uid)return null;checkFence(uid);
   if(!Object.hasOwn(channels,key)||!Array.isArray(rows)||!rows.length||typeof id!=='string'||!id||id.length>200)throw Error('HISTORY_EVENT_INVALID');
   if(rows.some(r=>!r||typeof r!=='object'||Array.isArray(r)||(Object.hasOwn(r,'uid')&&r.uid!==uid)))throw Error('HISTORY_OWNER_MISMATCH');
   const input=clone(rows),token=generation,pendingKey='man_history_pending_v1:'+encodeURIComponent(uid)+':'+encodeURIComponent(id);
   if(selected===uid){api.status='SAVING';notify(uid,api.status)}
   try{
    const digest=Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([key,input]))))).map(b=>b.toString(16).padStart(2,'0')).join('');
    checkFence(uid);const pending=JSON.stringify({uid,key,rows:input,id}),priorPending=legacy.getItem(pendingKey);
    if(priorPending&&priorPending!==pending)throw Error('HISTORY_EVENT_CONFLICT');
    legacy.setItem(pendingKey,pending);
    const record=await transact(uid,r=>{
    const seen=r.ids.find(x=>x.id===id);
    if(seen){if(seen.hash!==digest&&seen.payload!==JSON.stringify([key,input]))throw Error('HISTORY_EVENT_CONFLICT');return}
    // Bound local history and dedup ledger; very old event IDs must not be retried.
    if(r.ids.length>=1000)throw Error('HISTORY_EVENT_LIMIT');
    r.channels[key]=(r.channels[key]||[]).concat(input).slice(-channels[key]);r.ids.push({id,hash:digest});
   });
    try{legacy.removeItem(pendingKey)}catch(_){} // Leftovers are safe to replay with the same ID/payload.
    publish(uid,record,token);return record;
   }catch(e){if(selected===uid&&token===generation){api.status='UNCONFIRMED';notify(uid,api.status)}throw e}
  };
  // Called only after an isolated host has a verified server deletion ACK.
  // Permanent schema2 marker contains no learner content; old schema1 writers
  // reject it rather than lazily migrating the still-present legacy source.
  api.eraseOwned=async(uid,{epoch,operationId}={})=>{
   if(!enabled)throw Error('HISTORY_DISABLED');
   if(!validUid(uid)||!Number.isSafeInteger(epoch)||epoch<1||typeof operationId!=='string'||!/^[-A-Za-z0-9_]{1,200}$/.test(operationId))throw Error('HISTORY_DELETE_INVALID');
   const marker={schema:1,uid,epoch,operationId},raw=JSON.stringify(marker);
   let old;try{old=legacy.getItem(fenceKey(uid));if(old!==null&&old!==raw)throw Error('HISTORY_DELETE_CONFLICT');legacy.setItem(fenceKey(uid),raw);if(legacy.getItem(fenceKey(uid))!==raw)throw Error('HISTORY_DELETE_UNCONFIRMED')}catch(e){throw e}
   if(selected===uid){generation++;cache={};api.ready=false;api.status='DELETION_PENDING'}
   const db=await open();
   await new Promise((resolve,reject)=>{
    const t=db.transaction('accounts','readwrite'),store=t.objectStore('accounts');let failure;
    t.oncomplete=resolve;t.onabort=()=>reject(failure||t.error||Error('HISTORY_DELETE_ABORTED'));t.onerror=()=>{};
    const q=store.get(uid);q.onsuccess=()=>{try{
     const prior=q.result;
     if(prior&&(prior.uid!==uid||![1,2].includes(prior.schema)))throw Error('HISTORY_DELETE_UNVERIFIABLE');
     if(prior?.schema===2&&(!prior.deleted||prior.epoch!==epoch||prior.operationId!==operationId))throw Error('HISTORY_DELETE_CONFLICT');
     store.put({schema:2,uid,deleted:true,epoch,operationId});
    }catch(e){failure=e;t.abort()}};
   });
   const actual=await new Promise((resolve,reject)=>{
    const t=db.transaction('accounts','readonly'),q=t.objectStore('accounts').get(uid);let row;
    q.onsuccess=()=>row=q.result;t.oncomplete=()=>resolve(row);t.onabort=()=>reject(t.error||Error('HISTORY_DELETE_READBACK_FAILED'));t.onerror=()=>{};
   });
   if(!actual||actual.schema!==2||actual.uid!==uid||actual.deleted!==true||actual.epoch!==epoch||actual.operationId!==operationId||Object.keys(actual).sort().join(',')!=='deleted,epoch,operationId,schema,uid')throw Error('HISTORY_DELETE_UNCONFIRMED');
   if(selected===uid){cache={};api.ready=false;api.status='ACCOUNT_DELETED';notify(uid,api.status)}
   return {ack:true,uid,epoch,operationId,scope:'CURRENT_ORIGIN_INDEXEDDB_ACCOUNT_RECORD_ONLY'};
  };
  // Adapter used by all Practice writers. Capture actor at lesson-open time.
  api.practice=(actor,key,rows,id)=>api.append(actor,key,rows,id).catch(()=>null);
  api.close=async()=>{if(opening)(await opening).close();opening=null};
  return api;
 }
 root.ManLearnerHistory={create};
 if(root.document){let storage=null,idb=null;try{storage=root.localStorage;idb=root.indexedDB}catch(_){}
  root.ManHistory=create({indexedDB:idb,legacy:storage,enabled:root.MAN_UID_HISTORY_ENABLED===true,notify:(uid,status)=>root.dispatchEvent(new CustomEvent('man-history-status',{detail:{uid,status}}))});
 }
 if(typeof module!=='undefined')module.exports={create};
})(typeof window==='undefined'?globalThis:window);
