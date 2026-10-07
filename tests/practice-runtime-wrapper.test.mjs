import assert from 'node:assert/strict';
import fs from 'node:fs';
import { harness, specs, lessons, evidence, NOW } from './practice-runtime-characterization.test.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const contractURL=url(read('assets/practice-runtime-contract.js'));
const coreURL=url(read('assets/practice-runtime-core.js').replace("'./practice-runtime-contract.js'",JSON.stringify(contractURL)));
const source=read('assets/practice-runtime-wrapper.js');
const {installPracticeWrapper}=await import(url(source.replace("'./practice-runtime-contract.js'",JSON.stringify(contractURL)).replace("'./practice-runtime-core.js'",JSON.stringify(coreURL))));
const {practiceHost}=await import(url(read('tests/fixtures/practice-wrapper-host.js')));
const {normalizePracticeLesson}=await import(contractURL);
const clone=x=>structuredClone(x);
assert.ok(!/MAN-\d{4}|Batch01|Batch02|batch01|IDS\s*=|PAIRS\s*=|\.schemaFamily\b|\.canonicalPractice\b/.test(source),'capability routing only');
assert.ok(!read('index.html').includes('practice-runtime-wrapper.js'),'no default learner cutover');
const integrated=options=>{const h=harness({order:[],...options});h.wrapper=installPracticeWrapper(practiceHost(h.c));return h;};
const state=h=>h.wrapper.evidence();
function respond(h,s,u,{wrong=false,speechWrong=false,aliases=false}={}){
 const form=h.find(s.prefix+'-answer'),choice=wrong?(u.practice.correctChoice+1)%u.practice.choices.length:u.practice.correctChoice;
 form.all().find(e=>e.type==='radio'&&Number(e.value)===choice).checked=true;
 for(const [i,t]of (u.practice.speechTasks||[]).entries()){const el=h.find(s.prefix+'-span-'+i);el.value=speechWrong?'not the answer':aliases?t.answer.toUpperCase().replace(/SIX/g,'6').replace(/FIFTEEN/g,'15').replace(/FIVE/g,'5')+'!':t.answer;el.fire('input');}
 form.fire('submit');
}
function compare(oracle,h,s,label){
 assert.deepEqual(state(h),evidence(oracle,s),label+' wire state/events');
 assert.deepEqual(JSON.parse(h.c.localStorage.getItem(s.history)),JSON.parse(oracle.c.localStorage.getItem(s.history)),label+' exact history');
 assert.deepEqual(h.audio.map(a=>({audio:a.item.audio,rate:a.rate})),oracle.audio.map(a=>({audio:a.item.audio,rate:a.rate})),label+' asset/rate IO');
 const texts=x=>x.find(s.panel)?.all().filter(e=>e.tag==='h2'||e.tag==='h3'||e.tag==='p'||e.tag==='span'||e.tag==='button').map(e=>e.textContent);
 assert.deepEqual(texts(h),texts(oracle),label+' presentation');
}
let traces=0,resumes=0;
for(const u of lessons){
 const s=specs.find(s=>s.ids.includes(u.id));
 if(!u.practice){const h=integrated();assert.equal(h.c.xStartCatalog(u.id),'BASE_DICTATION');assert.deepEqual(h.calls.start,[u.id]);assert.equal(state(h),null);assert.equal(h.c.xRestoreStudy(),'BASE_RESTORE');h.wrapper.dispose();assert.equal(h.c.xStartCatalog('after'),'BASE_DICTATION');continue;}
 for(const mode of ['first','wrong','speech-wrong','aliases','slow','fast','repeat','replay','slow-replay','repair','repair-wrong','stop','fail','navigate','pop','supersede','transcript','dictation-support']){
  const history=mode.startsWith('repair')&&u.practice.speechTasks?[{lesson_id:u.id,lesson_asset_version:u.version,attempt_index:1}]:[];
  const options={local:{[s.history]:JSON.stringify(history)}};
  const oracle=harness(options),h=integrated(options);oracle.c.xStartCatalog(u.id);h.c.xStartCatalog(u.id);compare(oracle,h,s,u.id+'/'+mode+'/initial');
  for(const x of [oracle,h]){x.find('rate-select').value=mode==='slow'?'0.7':mode==='fast'?'1.2':'1';x.click(s.prefix+'-play');}
  compare(oracle,h,s,u.id+'/'+mode+'/playing');
  if(['stop','fail','navigate','pop','supersede'].includes(mode)){
   for(const x of [oracle,h]){if(mode==='stop')x.click(s.prefix+'-stop');if(mode==='fail')x.audio[0].fail();if(mode==='navigate')x.c.xGo('catalog');if(mode==='pop')x.pop();if(mode==='supersede')x.click(s.prefix+'-play');if(mode!=='fail')x.audio[0].end();}
   compare(oracle,h,s,u.id+'/'+mode+'/cancel');
   if(mode!=='supersede'){assert.equal(state(h).fullEnded,false);traces++;continue;}
  }
  for(const x of [oracle,h])x.finish();compare(oracle,h,s,u.id+'/'+mode+'/ended');
  if(mode==='repeat')for(const x of [oracle,h]){x.click(s.prefix+'-play');x.finish();}
  if(mode==='replay'||mode==='slow-replay')for(const x of [oracle,h]){if(mode==='slow-replay')x.find('rate-select').value='0.5';x.click(s.prefix+'-replay-'+u.items[0].segmentId);x.audio.at(-1).end();}
  if(mode==='transcript')for(const x of [oracle,h]){x.c.items=clone(u.items);x.c.xSpeakTranscriptItem(0);}
  if(mode==='dictation-support')for(const x of [oracle,h]){x.c.items=clone(u.items);x.c.playAudio();}
  for(const x of [oracle,h])respond(x,s,u,{wrong:['wrong','repair-wrong'].includes(mode),speechWrong:mode==='speech-wrong',aliases:mode==='aliases'});
  compare(oracle,h,s,u.id+'/'+mode+'/response');
  for(const x of [oracle,h])x.click(s.prefix+'-dictation');compare(oracle,h,s,u.id+'/'+mode+'/dictation');assert.deepEqual(h.calls.start,[u.id]);traces++;
 }
 // Round-trip initial, partial listening/draft, complete, nonnormal evidence,
 // canceled in-flight audio and completed replay support, without history append.
 for(const phase of ['initial','partial','draft','complete','slow','replayed']){
  const h=integrated();h.c.xStartCatalog(u.id);
  if(phase!=='initial'){if(phase==='slow')h.find('rate-select').value='0.7';h.click(s.prefix+'-play');if(phase!=='partial')h.finish();}
  if(phase==='draft')for(const [i,t]of (u.practice.speechTasks||[]).entries()){const input=h.find(s.prefix+'-span-'+i);input.value=t.answer;input.fire('input');}
  if(['complete','slow','replayed'].includes(phase))respond(h,s,u);
  if(phase==='replayed'){h.click(s.prefix+'-replay-'+u.items[0].segmentId);h.audio.at(-1).end();}
  const session=h.c.sessionStorage.getItem(s.key),local=h.c.localStorage.getItem(s.history);
  const resumed=integrated({session:{[s.key]:session},local:local?{[s.history]:local}:{}});
  assert.equal(await resumed.wrapper.restore(u.id),true);assert.deepEqual(state(resumed),state(h));assert.equal(resumed.audio.length,0,'restore never starts audio');assert.equal(resumed.c.localStorage.getItem(s.history),local,'restore no duplicate history');
  if(phase==='partial'){h.wrapper.dispose();h.audio[0].end();assert.equal(state(h).fullEnded,false,'disposed callback ignored');}
  if(phase==='draft'){resumed.click(s.prefix+'-play');resumed.finish();respond(resumed,s,u);assert.equal(state(resumed).correct,true);}
  for(const patch of [{uid:'other'},{at:NOW-12*60*60*1000-1},{phase:'dictation'},{resumeIdentity:{lessonId:'stale'}},{coreState:{phase:'complete'}},{wire:{}}]){
   const bad=integrated({session:{[s.key]:JSON.stringify({...JSON.parse(session),...patch})}});assert.equal(await bad.wrapper.restore(u.id),false);assert.equal(state(bad),null);
  }
  const changed=clone(u);changed.items[0].audio.sha256='a'.repeat(64);const stale=integrated({units:[changed],session:{[s.key]:session}});assert.equal(await stale.wrapper.restore(u.id),false);
  const otherRoute=integrated({session:{[s.key]:session},hash:'#catalog'});assert.equal(await otherRoute.wrapper.restore(u.id),false);resumes++;
 }
 const d=normalizePracticeLesson(u),saved=integrated();saved.c.xStartCatalog(u.id);saved.click(s.prefix+'-play');saved.finish();respond(saved,s,u);const envelope=JSON.parse(saved.c.sessionStorage.getItem(s.key));
 // Legacy envelopes stay owned by legacy; no invented migration policy.
 const legacy=clone(envelope);delete legacy.resumeIdentity;const lh=integrated({session:{[s.key]:JSON.stringify(legacy)}});assert.equal(await lh.wrapper.restore(u.id),false);assert.ok(lh.c.sessionStorage.getItem(s.key));
 const malformed=clone(u);malformed.items[0].audio.lessonVersion='stale';const bad=integrated({units:[malformed]});assert.equal(bad.c.xStartCatalog(u.id),false);assert.deepEqual(bad.calls.start,[],'malformed Practice cannot fall through to Dictation');
 const renamed=clone(u);renamed.id='UNSEEN';renamed.audioRealizationRef='UNSEEN-REALIZATION';for(const a of [...renamed.items.map(i=>i.audio),...(renamed.fullPanelAudio?[renamed.fullPanelAudio]:[])]){a.lessonId=renamed.id;a.realizationId=renamed.audioRealizationRef;}
 const unknown=integrated({units:[renamed]});assert.equal(unknown.c.xStartCatalog(renamed.id),true);unknown.click(s.prefix+'-play');unknown.finish();respond(unknown,s,renamed);assert.equal(state(unknown).correct,true,'shape-driven unseen identity');
 // Navigation and rollback preserve original function identities.
 saved.wrapper.dispose();assert.equal(saved.c.xStartCatalog('ordinary'),'BASE_DICTATION');assert.equal(saved.c.xRestoreStudy(),'BASE_RESTORE');saved.wrapper.dispose();
}
// In-flight catalog resolution cannot reopen after navigation/dispose.
for(const action of ['navigate','dispose']){
 const u=lessons.find(u=>u.practice),s=specs.find(s=>s.ids.includes(u.id)),initial=integrated();initial.c.xStartCatalog(u.id);
 const session=initial.c.sessionStorage.getItem(s.key),h=integrated({session:{[s.key]:session}});let resolve;
 h.c.loadCatalogUnits=()=>new Promise(r=>{resolve=r;});
 const restoring=h.wrapper.restore(u.id);
 if(action==='navigate')h.c.xGo('catalog');else h.wrapper.dispose();
 resolve(h.c.catalogUnitsCache);assert.equal(await restoring,false);assert.equal(state(h),null);
}
console.log(`Practice wrapper integration PASS: ${traces} differential traces; ${resumes} resume round trips + rejection cases; 15 Practice/9 ordinary; exact presentation/events/history/audio; offline, default legacy unchanged`);
export {installPracticeWrapper,practiceHost};
