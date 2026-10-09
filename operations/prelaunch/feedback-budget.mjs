// Proposal-only pure decision, no provider imports, deployment hook or credentials.
// A trusted broker must call this within ONE shared atomic transaction and derive
// identity/time/idempotency server-side. This is not invocation/read-cost control.
export function decideFeedback({nowMs,windowMs,maxAccepted,cooldownMs,counter,lastAcceptedMs,duplicateReceipt}){
 if(!Number.isFinite(nowMs)||!Number.isInteger(windowMs)||windowMs<=0||!Number.isInteger(maxAccepted)||maxAccepted<=0||!Number.isInteger(cooldownMs)||cooldownMs<0)throw Error('INVALID_SERVER_POLICY');
 if(duplicateReceipt)return {action:'REUSE',receipt:duplicateReceipt,writeFeedback:false};
 const window=Math.floor(nowMs/windowMs);
 if(counter && (!Number.isInteger(counter.window)||!Number.isInteger(counter.accepted)||counter.accepted<0||counter.window>window))throw Error('INVALID_COUNTER');
 const accepted=counter?.window===window?counter.accepted:0;
 if(accepted>=maxAccepted)return {action:'DENY_BUDGET',writeFeedback:false};
 if(lastAcceptedMs!=null&&(!Number.isFinite(lastAcceptedMs)||lastAcceptedMs>nowMs))throw Error('INVALID_SERVER_TIME');
 if(lastAcceptedMs!=null&&nowMs-lastAcceptedMs<cooldownMs)return {action:'DENY_COOLDOWN',writeFeedback:false};
 return {action:'ACCEPT',writeFeedback:true,nextCounter:{window,accepted:accepted+1},nextLastAcceptedMs:nowMs};
}
