import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
export async function testAuthErrors(){
 const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');
 const start=html.indexOf('function xGoogleAuthFailureMessage(error){'),end=html.indexOf('\n',html.indexOf('window.loginWithGoogle=async function()',start));
 assert.ok(start>=0&&end>start);
 const toasts=[];let closes=0,refreshes=0;
 const privateDraft={text:'keep private draft'};
 const context={window:{},firebase:{auth:{GoogleAuthProvider:class{setCustomParameters(x){assert.equal(x.prompt,'select_account')}}}},auth:{signInWithPopup:async()=>{}},xCloseAuthModal:()=>closes++,xToast:x=>toasts.push(x),xRefreshIdentity:()=>refreshes++,privateDraft};
 vm.createContext(context);vm.runInContext(html.slice(start,end),context);
 await context.window.loginWithGoogle();assert.equal(closes,1);assert.equal(refreshes,1);
 for(const code of ['auth/popup-closed-by-user','auth/cancelled-popup-request','auth/popup-blocked','auth/network-request-failed','auth/too-many-requests','auth/account-exists-with-different-credential','auth/unknown','']){
  context.auth.signInWithPopup=async()=>{throw {code,message:'Firebase: private-email@example.invalid provider internals and auth/token'}};
  await context.window.loginWithGoogle();const text=toasts.at(-1);
  assert.ok(text.length>10);assert.ok(!/Firebase|example.invalid|internals|auth\//.test(text));
  assert.equal(closes,1);assert.equal(refreshes,1);assert.equal(context.privateDraft.text,'keep private draft');
 }
 console.log('PASS: Google popup success + 8 cancellation/network/provider error boundaries; safe copy, no modal close/profile refresh or draft loss on failure. Local stubs, not live provider acceptance.');
}
if(process.argv[1]?.endsWith('/auth-errors.test.mjs'))await testAuthErrors();
