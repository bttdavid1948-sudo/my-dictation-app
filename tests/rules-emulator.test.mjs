import fs from 'node:fs';
import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,collection,getDoc,getDocs,setDoc,updateDoc,query,where,serverTimestamp,runTransaction} from 'firebase/firestore';

const env=await initializeTestEnvironment({projectId:'demo-man-phase3',firestore:{rules:fs.readFileSync(new URL('../firestore.rules.phase3.draft',import.meta.url),'utf8')}});
const owner=env.authenticatedContext('owner').firestore();
const other=env.authenticatedContext('other').firestore();
const guest=env.unauthenticatedContext().firestore();
let count=0;
async function ok(p){await assertSucceeds(p);count++}
async function no(p){await assertFails(p);count++}
try{
  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.firestore();
    await setDoc(doc(db,'community_units','legacy'),{authorUid:'owner',sharingStatus:'approved',unitName:'User lesson'});
    await setDoc(doc(db,'user_vocab','owner'),{units:'{"My lesson":[]}'});
    await setDoc(doc(db,'users_profile','owner'),{nickname:'Private name',phone:'secret'});
  });
  await no(getDoc(doc(guest,'community_units','legacy')));
  await no(getDoc(doc(other,'community_units','legacy')));
  await ok(getDoc(doc(owner,'community_units','legacy')));
  await ok(getDocs(query(collection(owner,'community_units'),where('authorUid','==','owner'))));
  await no(getDocs(collection(guest,'community_units')));
  await no(setDoc(doc(owner,'community_units','new'),{authorUid:'owner',sharingStatus:'pending'}));
  await no(updateDoc(doc(owner,'community_units','legacy'),{sharingStatus:'approved'}));
  await no(setDoc(doc(owner,'official_lessons','forged'),{publisher:'man',status:'published'}));
  await no(getDoc(doc(guest,'official_lessons','forged')));
  await ok(getDoc(doc(owner,'user_vocab','owner')));
  await no(getDoc(doc(other,'user_vocab','owner')));
  await no(getDoc(doc(guest,'user_vocab','owner')));
  await ok(getDoc(doc(owner,'users_profile','owner')));
  await no(getDoc(doc(other,'users_profile','owner')));
  await no(getDocs(collection(guest,'users_profile')));
  await no(getDocs(collection(owner,'leaderboard_public')));
  await no(setDoc(doc(owner,'leaderboard_public','owner'),{nickname:'Forged',totalMinutes:9999}));
  const ref=doc(owner,'user_vocab','owner');
  await ok(runTransaction(owner,async tx=>{await tx.get(ref);tx.set(ref,{units:'{"My lesson":[{"en":"Hi","vi":"Chào"}]}'},{merge:true})}));
  await no(setDoc(doc(other,'user_vocab','owner'),{units:'{}'},{merge:true}));
  await ok(setDoc(doc(guest,'owner_feedback','one'),{kind:'Góp ý',message:'A helpful report',page:'x-catalog',uid:null,email:null,nickname:'Người lạ',userAgent:'test',createdAt:serverTimestamp(),status:'new'}));
  console.log(`${count} Phase 3 rules assertions passed`);
}finally{await env.cleanup()}
