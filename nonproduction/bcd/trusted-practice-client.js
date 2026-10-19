/* Actual product-core observer; isolated host only, no production activation. */
(()=>{'use strict';
if(location.hostname!=='127.0.0.1'||window.__MAN_TRUSTED_PRACTICE!==true)throw Error('ISOLATED_HOST_REQUIRED');
let auth=null,generation=0,contextGeneration=0,unsubscribe=null;const api=window.ManTrustedPractice={status:'INACTIVE',lastReceipt:null};
function status(text){api.status=text;let e=document.getElementById('man-trusted-status');if(!e){e=document.createElement('aside');e.id='man-trusted-status';e.setAttribute('role','status');document.body.prepend(e);}e.textContent=text==='SERVER_ACK_PENDING_ELIGIBILITY'?'Đã xác nhận dữ liệu luyện thử nghiệm; điều kiện Phong hàm chưa mở.':text==='UNCONFIRMED'?'Chưa xác nhận dữ liệu luyện thử nghiệm.':'Đang xác minh lần luyện thử nghiệm…';}
api.activate=source=>{if(source?.app?.options?.projectId!=='demo-man-progress-bcd')throw Error('DEMO_AUTH_REQUIRED');unsubscribe?.();auth=source;unsubscribe=auth.onAuthStateChanged(user=>{generation++;api.lastReceipt=null;status(user?'READY':'GUEST');window.__fixtureSwitch?.(user?.uid||null);});};
window.__ManTrustedWrap=(core,d)=>{
 const uid=auth?.currentUser?.uid,g=generation,context=++contextGeneration;api.lastReceipt=null;if(!uid)return core;let attemptId=null,revision=0,tasks=[],busy=false,blocked=false,permanent=false,lastPlan=null;
 const live=()=>g===generation&&context===contextGeneration&&auth?.currentUser?.uid===uid;
 async function pump(){if(busy)return api.pending;if(blocked||!live())return;busy=true;try{while(tasks.length){if(!live())throw Error('ACCOUNT_CHANGED');const task=tasks[0];const response=await fetch('/__man/trusted/command',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:await auth.currentUser.getIdToken(),lessonId:d.identity.lessonId,version:d.identity.lessonVersion,attemptId,operationId:task.operationId,expectedRevision:revision,action:task.action,body:task.body})});const r=await response.json();if(!response.ok||!r.ack||r.uid!==uid||r.lessonId!==d.identity.lessonId||!live())throw Error('UNCONFIRMED');attemptId=r.attemptId;revision=r.revision;tasks.shift();api.lastReceipt=r;status('SERVER_ACK_PENDING_ELIGIBILITY');}}catch{blocked=true;if(live())status('UNCONFIRMED');}finally{busy=false;}}
 function enqueue(action,body){if(!live()||permanent)return;tasks.push({action,body,operationId:crypto.randomUUID()});api.pending=pump();}
 api.retry=()=>{if(!live()||permanent)return;blocked=false;return api.pending=pump();};
 enqueue('start',{});
 return new Proxy(core,{get(target,key){const value=target[key];if(typeof value!=='function')return value;return (...args)=>{const result=value.apply(target,args);
 if(key==='restore'){permanent=blocked=true;if(live())status('UNCONFIRMED');}
 else if(key==='beginPlayback'){const options=args[0]||{};if(options.segmentIndex!=null||options.rate!=null&&options.rate!==1){permanent=blocked=true;if(live())status('UNCONFIRMED');}else{lastPlan=result;enqueue('play',{});}}
 else if(key==='assetEnded'&&result===true&&lastPlan?.token===args[0])enqueue('ended',{index:args[1]});
 else if(key==='noteSupport'&&target.snapshot().phase!=='complete')enqueue('reveal',{});
 else if(key==='submit')enqueue('submit',{choice:args[0].choice,speechResponses:args[0].speechResponses||[]});
 return result;};}});
};
})();
