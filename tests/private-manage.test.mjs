import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,deleteDoc,serverTimestamp} from 'firebase/firestore';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('function xApplyPrivateMutation(');
const end=html.indexOf('async function xPersistPrivateMutation(',start);
assert.ok(start>=0&&end>start);
const apply=vm.runInNewContext(`(${html.slice(start,end).trim()})`);
const original=[{en:'Old sentence.',vi:'Câu cũ.'}];
const unrelated=[{en:'Keep me.',vi:'Giữ lại.'}];
const base={Mine:original,Other:unrelated};
const revised=[{en:'New sentence.',vi:'Câu mới.'}];
const changed=apply(base,'Mine',original,'Renamed',revised,false);
assert.deepEqual(JSON.parse(JSON.stringify(changed)),{Other:unrelated,Renamed:revised});
assert.deepEqual(base,{Mine:original,Other:unrelated},'input untouched');
assert.deepEqual(JSON.parse(JSON.stringify(apply(changed,'Renamed',revised,null,null,true))),{Other:unrelated});
assert.throws(()=>apply(base,'Mine',revised,'Mine',original,false),/LESSON_CHANGED/);
assert.throws(()=>apply(base,'Mine',original,'Other',revised,false),/LESSON_EXISTS/);
assert.match(html,/id="x-private-confirm"[^>]+hidden/,'delete requires a separate confirmation');

const rules=fs.readFileSync(new URL('../firestore.rules.phase3.draft',import.meta.url),'utf8');
const env=await initializeTestEnvironment({projectId:'demo-man-private-manage',firestore:{rules}});
const owner=env.authenticatedContext('learner').firestore();
const outsider=env.authenticatedContext('outsider').firestore();
const own=doc(owner,'user_vocab','learner');
try {
  await assertSucceeds(setDoc(own,{units:JSON.stringify(base),updatedAt:serverTimestamp()}));
  await assertSucceeds(setDoc(own,{units:JSON.stringify(changed),updatedAt:serverTimestamp()},{merge:true}));
  assert.deepEqual(JSON.parse((await getDoc(own)).data().units),JSON.parse(JSON.stringify(changed)));
  await assertFails(setDoc(doc(outsider,'user_vocab','learner'),{units:JSON.stringify(base),updatedAt:serverTimestamp()}));
  await assertFails(getDoc(doc(outsider,'user_vocab','learner')));
  await assertSucceeds(setDoc(own,{units:JSON.stringify({Other:unrelated}),updatedAt:serverTimestamp()},{merge:true}));
  assert.deepEqual(JSON.parse((await getDoc(own)).data().units),{Other:unrelated});
  await assertFails(deleteDoc(own));
  console.log('Private edit/delete, sibling preservation and cross-account Rules passed');
} finally {await env.cleanup()}
