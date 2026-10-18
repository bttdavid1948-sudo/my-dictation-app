/* Composes the existing core host with the existing B/C host. No production transport. */
(function(){'use strict';let boot;
window.ManEnableProductProgress=function(){if(boot)return boot;boot=(async()=>{
 if(location.hostname!=='127.0.0.1'||!window.__fixtureAuth||!window.ManProductSync||!window.ManCloudFirebase||!window.ManProductProgress)throw Error('ISOLATED_PRODUCT_REQUIRED');
 window.__demoEmulator=true;window.__demoProject='demo-man-progress-bcd';window.__demoTimestamp=ManCloudFirebase.firestore.FieldValue.serverTimestamp;
 window.__newDemoDb=uid=>ManCloudFirebase.initializeApp({projectId:__demoProject,apiKey:'demo-only'},'progress-'+crypto.randomUUID()).firestore();
 let actor={uid:currentUser?.uid||null,generation:0};__fixtureAuth.unshift(user=>{actor={uid:user?.uid||null,generation:actor.generation+1};});
 window.__progressTransportAdmission=(raw,uid)=>ManProductProgress.transport(raw,{uid,mode:'ISOLATED_NONPRODUCTION',getActor:()=>actor});
 for(const src of ['/assets/product-progress-core.js','/assets/product-progress-core-host.js'])await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error('PROGRESS_SOURCE_UNAVAILABLE'));document.head.append(s);});
 const invalidate=()=>window.__cloudHost?.invalidate(),reload=()=>{if(ManProductSync.status==='READY')__cloudHost.reload();};
 for(const name of ['refresh','discard']){const old=ManProductSync[name].bind(ManProductSync);ManProductSync[name]=async(...args)=>{invalidate();const result=await old(...args);reload();return result;};}
 const remove=ManLearningSession.simulateDeletion.bind(ManLearningSession);ManLearningSession.simulateDeletion=async(...args)=>{const result=await remove(...args);if(result?.ack){invalidate();reload();}return result;};
 return window.__cloudHost;
})();boot.catch(()=>{boot=null;});return boot;};
})();
