import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {installPracticeWrapper} from '../assets/practice-runtime-wrapper.js';import {practiceHost} from '../assets/practice-runtime-host.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
// Reuse existing fixture definitions without rerunning its unrelated route/gate loops.
const fixture=read('tests/practice-runtime-characterization.test.mjs');const definitions=fixture.slice(fixture.indexOf('const clone='),fixture.indexOf('for(const u of lessons){'));
const ctx=vm.createContext({assert,vm,read,Date,console});vm.runInContext(definitions,ctx);const lessons=vm.runInContext('lessons',ctx),NOW=vm.runInContext('NOW',ctx);const u=lessons.find(x=>x.practice),checks=[];
const make=()=>{const h=ctx.harness({order:[]});h.wrapper=installPracticeWrapper(practiceHost(h.c));return h;};
{
 const h=make();h.c.xStartCatalog(u.id);const saved=JSON.parse(h.c.sessionStorage.getItem('man_mixed_panel_v1'));const before=h.wrapper.evidence();h.wrapper.startDictation(u.id);assert.deepEqual(Array.from(h.calls.start),[u.id]);assert.equal(h.wrapper.evidence(),null);assert.equal(h.audio.length,0);if(saved)assert.equal(saved.wire.phase,before.phase);checks.push('Resume host Dictation without inventing a completed Practice response or starting audio');
}
{
 const h=make();h.c.xStartCatalog(u.id);const before=h.wrapper.evidence();assert.equal(h.wrapper.startDictation('MISSING'),false);assert.deepEqual(h.wrapper.evidence(),before);checks.push('Missing lesson leaves current Practice session intact');
}
{
 const h=make();h.c.xStartCatalog(u.id);h.c.sessionStorage.setItem('base-study',JSON.stringify({uid:'test-user',at:NOW+1,phase:'active',items:u.items}));h.c.xGo('catalog');h.c.location.hash='#learn';assert.equal(await h.wrapper.restoreAvailable(),'BASE_RESTORE');assert.equal(h.calls.restore,1);checks.push('Newer UID-bound Dictation checkpoint takes priority over older Generic Practice resume');
}
{
 const h=make();h.c.xStartCatalog(u.id);h.c.sessionStorage.setItem('base-study',JSON.stringify({uid:'other',at:NOW+1,phase:'active',items:u.items}));await h.wrapper.restoreAvailable();assert.equal(h.calls.restore,0);checks.push('Wrong-UID newer checkpoint cannot supersede existing Practice owner');
}
{
 const h=make();h.c.xStartCatalog(u.id);h.c.sessionStorage.setItem('base-study',JSON.stringify({uid:'test-user',at:NOW,phase:'active',items:u.items}));h.c.xGo('catalog');h.c.location.hash='#learn';await h.wrapper.restoreAvailable();assert.equal(h.calls.restore,0);assert.equal(h.wrapper.evidence().lessonId,u.id);checks.push('Timestamp tie cannot let old Dictation replace the current valid Practice session');
}
console.log(JSON.stringify({status:'PASS',suite:'learner-practice-resume',checks}));
