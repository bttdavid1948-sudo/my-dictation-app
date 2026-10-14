'use strict';
// Real Firestore Rules emulator tests. Missing runtime is UNVERIFIED, never PASS.
const fs=require('node:fs'),path=require('node:path');const receipt=path.join(__dirname,'emulator-receipt.json');
const projectId='demo-man-progress-acceptance';
(async()=>{
 const host=process.env.FIRESTORE_EMULATOR_HOST;
 if(!host||!/^127\.0\.0\.1:\d+$/.test(host)){fs.writeFileSync(receipt,JSON.stringify({status:'UNVERIFIED',reason:'Loopback FIRESTORE_EMULATOR_HOST required; production refused'}));process.exitCode=2;return}
 let rules,sdk;try{rules=require('@firebase/rules-unit-testing');sdk=require('firebase/firestore')}catch{fs.writeFileSync(receipt,JSON.stringify({status:'UNVERIFIED',reason:'Firebase SDK/rules testing dependency absent'}));process.exitCode=2;return}
 const {initializeTestEnvironment,assertFails,assertSucceeds}=rules;const {doc,getDoc,setDoc,deleteDoc,serverTimestamp,runTransaction}=sdk;
 const [hostname,port]=host.split(':');const env=await initializeTestEnvironment({projectId,firestore:{host:hostname,port:+port,rules:fs.readFileSync(path.join(__dirname,'firestore.progress.rules'),'utf8')}});const checks=[];
 const A=env.authenticatedContext('A').firestore(),B=env.authenticatedContext('B').firestore(),guest=env.unauthenticatedContext().firestore();const p='users/A/lesson_progress/official_MAN-TEST';
 const fresh=()=>({schema:1,uid:'A',lessonId:'MAN-TEST',kind:'official',version:'v0.1',total:2,sessionId:'session-one',seq:1,revision:1,cursor:0,marks:'..',updatedAt:serverTimestamp()});
 async function seed(){await env.clearFirestore();await assertSucceeds(setDoc(doc(A,p),fresh()))}
 async function test(name,fn){await seed();await fn();checks.push(name)}
 try{
 await test('Owner can read; guest cannot read/write',async()=>{await assertSucceeds(getDoc(doc(A,p)));await assertFails(getDoc(doc(guest,p)));await assertFails(setDoc(doc(guest,p),fresh()))});
 await test('B cannot read/write/delete A; A cannot delete history',async()=>{await assertFails(getDoc(doc(B,p)));await assertFails(setDoc(doc(B,p),{...fresh(),revision:2}));await assertFails(deleteDoc(doc(B,p)));await assertFails(deleteDoc(doc(A,p)))});
 for(const [name,delta] of Object.entries({wrongUid:{uid:'B'},extraEmail:{email:'unneeded'},wrongSchema:{schema:2},wrongKey:{lessonId:'MAN-OTHER'},badKind:{kind:'public'},invalidId:{lessonId:'../x'},badVersion:{version:''},oversize:{total:501,marks:'.'.repeat(501)},zeroTotal:{total:0},cursorHigh:{cursor:2},cursorFraction:{cursor:.5},badMarks:{marks:'xx'},marksLength:{marks:'.'},staleRevision:{revision:1},revisionJump:{revision:4},seqJump:{seq:3},sessionSwap:{sessionId:'unowned'},versionChangeSameSession:{version:'v0.2'},clientClock:{updatedAt:new Date(0)},wrongType:{total:'2'}}))await test('Deny '+name,()=>assertFails(setDoc(doc(A,p),{...fresh(),revision:2,...delta})));
 await test('Checkpoint accepted; stale same revision rejected',async()=>{await assertSucceeds(setDoc(doc(A,p),{...fresh(),revision:2,marks:'c.',cursor:1}));await assertFails(setDoc(doc(A,p),{...fresh(),revision:2,marks:'.s'}))});
 await test('Replay requires seq+1, new session and empty progress',async()=>{await assertSucceeds(setDoc(doc(A,p),{...fresh(),revision:2,seq:2,sessionId:'session-two'}));await assertFails(setDoc(doc(A,p),{...fresh(),revision:3,seq:3,sessionId:'session-three',marks:'c.'}))});
 const completion=()=>({schema:1,uid:'A',lessonId:'MAN-TEST',kind:'official',sessionId:'session-one',version:'v0.1',total:2,seq:1,completedAt:serverTimestamp()});const cp=p+'/completions/session-one';
 await test('Partial/fabricated completion denied',async()=>{await assertFails(setDoc(doc(A,cp),completion()));await assertFails(setDoc(doc(B,cp),completion()))});
 await test('Atomic complete accepted; immutable completion survives replay',async()=>{await assertSucceeds(runTransaction(A,async tx=>{await tx.get(doc(A,p));tx.set(doc(A,p),{...fresh(),revision:2,cursor:1,marks:'gs'});tx.set(doc(A,cp),completion())}));await assertFails(setDoc(doc(A,cp),completion()));await assertFails(deleteDoc(doc(A,cp)));await assertSucceeds(setDoc(doc(A,p),{...fresh(),revision:3,seq:2,sessionId:'session-two'}));await assertSucceeds(getDoc(doc(A,cp)))});
 await test('No permissive wildcard for existing app/production paths',()=>assertFails(setDoc(doc(A,'user_vocab/A'),{items:'[]'})));
 fs.writeFileSync(receipt,JSON.stringify({status:'BACKEND VERIFIED',scope:'Local Firestore Rules emulator only; NOT production, Auth or frontend cloud sync',checks,adapterIntegration:'UNVERIFIED'},null,2));console.log('Rules emulator PASS',checks.length);
 }catch(e){fs.writeFileSync(receipt,JSON.stringify({status:'FAIL',checks,error:e.message},null,2));throw e}finally{await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1});
