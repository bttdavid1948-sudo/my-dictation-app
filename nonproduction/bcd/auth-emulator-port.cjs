'use strict';
// Nonproduction server port only. Never use unsigned emulator tokens in production.
function createAuthPort({mode,projectId,host='127.0.0.1:9099',request=fetch}={}){
 if(mode!=='ISOLATED_NONPRODUCTION'||projectId!=='demo-man-progress-bcd'||!/^127\.0\.0\.1:\d+$/.test(host)||+host.split(':')[1]<1024||+host.split(':')[1]>65535||typeof request!=='function')throw Error('AUTH_EMULATOR_REQUIRED');
 const base=`http://${host}/identitytoolkit.googleapis.com/v1/accounts:`;
 const claims=token=>{try{if(typeof token!=='string'||token.length>16384)throw Error();const parts=token.split('.');if(parts.length!==3)throw Error();const d=JSON.parse(Buffer.from(parts[1],'base64url'));if(d.aud!==projectId||d.iss!==`https://securetoken.google.com/${projectId}`||typeof d.sub!=='string'||!/^[-A-Za-z0-9]{1,128}$/.test(d.sub)||!Number.isSafeInteger(d.exp)||d.exp<=Date.now()/1000)throw Error();return d;}catch{throw Error('AUTH_REQUIRED');}};
 async function post(method,token){const res=await request(base+method+'?key=demo-key',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token}),redirect:'error',signal:AbortSignal.timeout(5000)});const body=await res.json();if(body?.error?.message==='USER_NOT_FOUND')throw Error('AUTH_USER_ABSENT');if(!res.ok||body.error)throw Error('AUTH_UNCONFIRMED');return body;}
 async function verify(token){const c=claims(token),data=await post('lookup',token);if(!Array.isArray(data.users)||data.users.length!==1||data.users[0].localId!==c.sub||data.users[0].disabled===true)throw Error('AUTH_UNCONFIRMED');return {uid:c.sub,projectId,trust:'AUTH_EMULATOR_ONLY'};}
 return {verify,async removeSelf({idToken,uid}){const actor=await verify(idToken);if(actor.uid!==uid)throw Error('UID_MISMATCH');await post('delete',idToken);let absent=false;try{await verify(idToken);}catch(e){if(e.message==='AUTH_USER_ABSENT')absent=true;else throw e;}if(!absent)throw Error('AUTH_DELETE_UNCONFIRMED');return {uid,ack:true,scope:'EMULATOR_SELF_AUTH_DELETE_ONLY_NOT_FIRESTORE_ERASURE'};}};
}
module.exports={createAuthPort};
