import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,runTransaction,serverTimestamp} from 'firebase/firestore';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/function xMergePrivateUnits\(local, remote\) \{[\s\S]*?\n        \}/);
assert.ok(match,'private merge function in shipped UI');
const merge=vm.runInNewContext(`(${match[0]})`);
const rules=fs.readFileSync(new URL('../firestore.rules.phase3.draft',import.meta.url),'utf8');
const env=await initializeTestEnvironment({projectId:'demo-man-phase3-sync',firestore:{rules}});
const first=env.authenticatedContext('learner').firestore();
const second=env.authenticatedContext('learner').firestore();
const outsider=env.authenticatedContext('outsider').firestore();
const refA=doc(first,'user_vocab','learner'),refB=doc(second,'user_vocab','learner');
const lessonA=[{en:'Hello',vi:'Chào'}],lessonB=[{en:'Goodbye',vi:'Tạm biệt'}];
try{
  await setDoc(refA,{units:JSON.stringify({Shared:lessonA}),updatedAt:serverTimestamp()});
  const stale=(await getDoc(refB)).data().units;
  await runTransaction(first,async tx=>{
    const live=await tx.get(refA);
    assert.equal(live.data().units,stale);
    tx.set(refA,{units:JSON.stringify({Shared:lessonA,Extra:lessonA})},{merge:true});
  });
  await assert.rejects(runTransaction(second,async tx=>{
    const live=await tx.get(refB);
    if(live.data().units!==stale)throw new Error('CLOUD_CHANGED');
    tx.set(refB,{units:JSON.stringify({Shared:lessonB})},{merge:true});
  }),/CLOUD_CHANGED/);
  const remote=JSON.parse((await getDoc(refB)).data().units);
  const outcome=merge({Shared:lessonB},remote);
  assert.equal(outcome.conflicts,1);
  assert.deepEqual(JSON.parse(JSON.stringify(outcome.merged)),{
    Shared:lessonB,'Shared (bản trên tài khoản)':lessonA,Extra:lessonA
  });
  const snapshot=(await getDoc(refB)).data().units;
  await runTransaction(second,async tx=>{
    const live=await tx.get(refB);
    if(live.data().units!==snapshot)throw new Error('CLOUD_CHANGED');
    tx.set(refB,{units:JSON.stringify(outcome.merged)},{merge:true});
  });
  assert.deepEqual(JSON.parse((await getDoc(refA)).data().units),JSON.parse(JSON.stringify(outcome.merged)));
  await assert.rejects(getDoc(doc(outsider,'user_vocab','learner')));
  console.log('Two-session private save and isolation passed');
}finally{await env.cleanup()}
