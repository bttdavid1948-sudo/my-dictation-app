// Offline characterization of unmodified production scripts, not a replacement runtime.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const html=read('index.html');
const paths=['assets/mixed-panel-runtime.js','assets/final-two-practice-runtime.js','assets/batch02-practice-runtime.js'];
const actualOrder=[...html.matchAll(/<script src="(assets\/(?:mixed-panel-runtime|final-two-practice-runtime|batch02-practice-runtime)\.js)[^"]*"/g)].map(m=>m[1]);
assert.deepEqual(actualOrder,paths);
const catalogs=['official-lessons.json','official-lessons-batch01-exceptions.json','official-lessons-man0844.json','official-lessons-final-two.json','official-lessons-batch02.json'].map(p=>JSON.parse(read('assets/'+p)));
const lessons=catalogs.flatMap(c=>c.lessons).filter(u=>u.status==='published');
const frozenBindings=JSON.parse(read('tests/fixtures/published-man-bindings.json'));
assert.deepEqual(lessons.map(u=>({id:u.id,version:u.version,status:u.status,publisher:u.publisher,audioRealizationRef:u.audioRealizationRef,assetHashes:u.items.map(i=>i.audio.sha256).concat(u.fullPanelAudio?[u.fullPanelAudio.sha256]:[])})),frozenBindings);
const specs=[
 {ids:['MAN-0844'],api:'ManMixedPanel',prefix:'man-panel',key:'man_mixed_panel_v1',history:'man_comprehension_history_v1',panel:'man-mixed-panel',response:'COMPREHENSION_RESPONSE',counter:'contextReplays'},
 {ids:['MAN-0565','MAN-0905'],api:'ManFinalTwoPractice',prefix:'man-inference',key:'man_final_two_practice_v1',history:'man_comprehension_history_v1',panel:'man-inference-panel',response:'INFERENCE_RESPONSE',counter:'segmentReplays'},
 {ids:catalogs[4].lessons.map(u=>u.id),api:'ManBatch02Practice',prefix:'man-b02',key:'man_batch02_practice_v1',history:'man_batch02_evidence_v1',panel:'man-b02-panel',response:'PRACTICE_RESPONSE',counter:'segmentReplays'}
];
const specFor=id=>specs.find(s=>s.ids.includes(id));
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.style={};this.listeners={};this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c)};}
 append(...xs){this.children.push(...xs);} prepend(x){this.children.unshift(x);} replaceChildren(...xs){this.children=xs;}
 setAttribute(k,v){this[k]=v;} addEventListener(k,f){(this.listeners[k]??=[]).push(f);}
 all(){return [this,...this.children.flatMap(c=>c.all())];}
 querySelector(q){return this.all().find(e=>q.startsWith('#')?e.id===q.slice(1):e.tag==='input'&&e.checked&&(!q.includes('type=radio')||e.type==='radio'))||null;}
 fire(kind){const ev={preventDefault(){}};this['on'+kind]?.(ev);for(const f of this.listeners[kind]||[])f(ev);}
}
const NOW=1791349200000;
const storage=initial=>{const data=new Map(Object.entries(initial));return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};
function harness({units=lessons,order=paths,session={},local={},uid='test-user',hash='#learn'}={}){
 const root=new Element('root');
 for(const id of ['x-learn-slot','rate-select','x-library-modal','dictation-app','summary-section','dictation-placeholder','study-view-transcript','x-transcript-play','x-transcript-support','x-transcript-repeat']){const e=new Element('div');e.id=id;root.append(e);}
 root.querySelector('#rate-select').value='1';root.querySelector('#dictation-placeholder').classList.add('hidden');
 const documentListeners={},windowListeners={},calls={start:[],go:[],restore:0,speak:[],sync:0,report:[],dictation:0,stop:0,transcriptStop:0,timerStop:0},audio=[];
 const c={console,Date:class extends Date {static now(){return NOW;}},document:{createElement:t=>new Element(t),getElementById:id=>root.querySelector('#'+id),addEventListener:(k,f)=>(documentListeners[k]??=[]).push(f)},sessionStorage:storage(session),localStorage:storage(local),auth:{currentUser:uid?{uid}:null},location:{hash},catalogUnitsCache:clone(units),MAN_STUDY_KEY:'base-study',items:[],currentIndex:0,xTranscriptToken:0,xTranscriptPlaying:false,xTranscriptPaused:false,xTranscriptCursor:0};
 c.window=c;c.addEventListener=(k,f)=>(windowListeners[k]??=[]).push(f);
 c.ManFixedAudio={stop:()=>calls.stop++,play:(item,rate,end,fail)=>{audio.push({item:clone(item),rate,end,fail});return true;}};
 c.xStartCatalog=id=>{calls.start.push(id);return 'BASE_DICTATION';};c.xGo=(...a)=>calls.go.push(a);c.xRestoreStudy=()=>{calls.restore++;return 'BASE_RESTORE';};c.xSpeakTranscriptItem=i=>calls.speak.push(i);c.xSyncTranscriptView=()=>calls.sync++;c.xOpenAudioReport=item=>calls.report.push(item);c.playAudio=()=>calls.dictation++;
 c.xStopTranscriptPlayback=()=>{calls.transcriptStop++;c.xTranscriptToken++;};c.stopStudyTimerAndSave=()=>calls.timerStop++;
 c.loadCatalogUnits=async()=>c.catalogUnitsCache;
 vm.createContext(c);for(const p of order)vm.runInContext(read(p),c,{filename:p});
 return {c,calls,audio,root,find:id=>root.querySelector('#'+id),click(id){const e=this.find(id);assert.ok(e,`missing ${id}`);e.fire('click');},finish(){let i=0;while(i<audio.length){assert.ok(i<30,'bounded playback');audio[i++].end();}},async dom(){for(const f of documentListeners.DOMContentLoaded||[])await f();},pop(){for(const f of windowListeners.popstate||[])f();},async flush(){await Promise.resolve();await Promise.resolve();}};
}
function evidence(h,s){return clone(h.c[s.api].evidence());}
function answer(h,s,u,{correct=true}={}){
 const form=h.find(s.prefix+'-answer');assert.ok(form);
 const right=s===specs[0]?0:u.practice.correctChoice;
 const radio=form.all().find(e=>e.tag==='input'&&e.type==='radio'&&Number(e.value)===(correct?right:(right+1)%(s===specs[0]?3:u.practice.choices.length)));radio.checked=true;
 for(const [i,t] of (s===specs[2]?u.practice.speechTasks:[]).entries()){const el=h.find('man-b02-span-'+i);el.value=t.answer;el.fire('input');}
 form.fire('submit');
}
// Canonical response metadata must match the existing mixed-panel presentation/key.
// Read only: the runtime remains unchanged and still uses its original constants.
const mixedLesson=lessons.find(u=>u.id==='MAN-0844');
const mixedSource=read(paths[0]);
const mixedChoices=mixedSource.match(/const choices = (\[[\s\S]*?\]);/);
const mixedQuestion=mixedSource.match(/text\('h3','([^']*)',form\)/);
const mixedCorrect=mixedSource.match(/state\.correct=state\.answer===(\d+);/);
assert.ok(mixedChoices&&mixedQuestion&&mixedCorrect,'existing mixed response constants remain addressable');
assert.deepEqual(mixedLesson.practice.choices,Array.from(vm.runInNewContext(mixedChoices[1])));
assert.equal(mixedLesson.practice.question,mixedQuestion[1]);
assert.equal(mixedLesson.practice.correctChoice,Number(mixedCorrect[1]));
// Every published lesson traverses the actual wrapper stack to exactly one handler.
for(const u of lessons){
 const h=harness(),s=specFor(u.id);h.c.xStartCatalog(u.id);
 if(!s){assert.deepEqual(h.calls.start,[u.id]);continue;}
 assert.deepEqual(h.calls.start,[]);assert.deepEqual(clone(h.calls.go),s===specs[0]?[['learn']]:[['learn',{}]]);assert.equal(h.calls.timerStop,1);assert.equal(h.calls.transcriptStop,1);
 for(const other of specs)assert.equal(!!h.c[other.api].evidence(),other===s);
 const initial=evidence(h,s);assert.equal(initial.lessonId,u.id);assert.equal(initial.lessonVersion,u.version);assert.equal(initial.realizationId,u.audioRealizationRef);assert.equal(initial.phase,'listening');
 assert.equal(h.find(s.prefix+'-answer'),null,'answers gated until audio completes');
 h.click(s.prefix+'-play');h.finish();
 assert.equal(evidence(h,s).fullEnded,true);
 if(s===specs[0]){const form=h.find(s.prefix+'-answer');assert.equal(form.all().find(e=>e.tag==='h3').textContent,u.practice.question);assert.deepEqual(form.all().filter(e=>e.tag==='span').map(e=>e.textContent),u.practice.choices);}
 const expected=u.fullPanelAudio?[u.fullPanelAudio.sha256]:u.items.map(i=>i.audio.sha256);
 assert.deepEqual(h.audio.map(a=>a.item.audio.sha256),expected);assert.ok(h.audio.every(a=>a.rate===1));
 answer(h,s,u);const result=evidence(h,s);assert.equal(result.correct,true);assert.equal(result.phase,'complete');assert.equal(result.responseAssisted,false);assert.ok(result.events.some(e=>e.kind===s.response));
 const rows=JSON.parse(h.c.localStorage.getItem(s.history));
 if(s!==specs[2]){
  assert.deepEqual(rows,[{at:NOW,lessonId:u.id,lessonVersion:'v0.1',realizationId:u.audioRealizationRef,construct:s===specs[0]?'DISCOURSE_STRUCTURE_AND_DETAIL':u.practice.construct,correct:true,assisted:false,[s.counter]:0,calibrated:false}]);
  assert.equal(result.events.find(e=>e.kind===s.response).evidence,'FULL_CONTEXT_FIRST_PASS');
 }else{
  assert.equal(rows.length,1+u.practice.speechTasks.length);
  for(const [i,row] of rows.entries()){
   assert.equal(row.lesson_id,u.id);assert.equal(row.lesson_asset_version,u.version);assert.equal(row.audio_realization_ref,u.audioRealizationRef);assert.equal(row.realization_id,u.audioRealizationRef);assert.deepEqual(row.asset_hashes,u.items.map(i=>i.audio.sha256).concat(u.fullPanelAudio?[u.fullPanelAudio.sha256]:[]));
   assert.equal(row.correct,true);assert.equal(row.response_result,'CORRECT');assert.equal(row.calibrated,false);assert.equal(row.orthography_score_claimed,false);assert.equal(row.transfer_mastery_claimed,false);assert.equal(row.support_state,i?'HINT_ASSISTED':'CHOICE_ASSISTED');assert.equal(row.evidence_strength,i?'REPAIR_ONLY':'WEAK');assert.equal(row.attempt_index,1);assert.equal(row.exposure_class,'INITIAL');assert.equal(row.playback_mode,'NORMAL');assert.deepEqual(row.conditions,u.practice.conditions);assert.equal(row.response_format,i?'SHORT_TEXT':'SELECT_ONE');
   if(!i){assert.equal(row.target_anchor_id,u.practice.anchorIds[0]);assert.deepEqual(row.anchor_refs,u.practice.conditionAnchors?u.practice.anchorIds:[u.practice.anchorIds[0]]);assert.equal(row.construct_type,u.practice.construct);assert.equal(row.operator_id,u.practice.operator);assert.equal(row.evidence_dimension,u.practice.dimension);}
   if(i){const task=u.practice.speechTasks[i-1];assert.equal(row.target_anchor_id,task.anchorId);assert.equal(row.operator_id,task.operator);assert.equal(row.construct_type,task.construct);assert.equal(row.response_format,'SHORT_TEXT');}
  }
 }
 // Dictation delegates through captured wrappers to the existing base path.
 h.click(s.prefix+'-dictation');assert.deepEqual(h.calls.start,[u.id]);assert.equal(evidence(h,s).phase,'dictation');assert.equal(h.find(s.panel).hidden,true);
}
// Binding rejection and current (deliberately unequal) validation boundaries.
for(const s of specs){const u=lessons.find(x=>x.id===s.ids[0]);
 const mutations=[x=>x.status='draft',x=>x.version='v9',x=>x.audioRealizationRef='wrong'];
 if(s===specs[0])mutations.push(x=>x.fullPanelAudio.sha256='0'.repeat(64));
 if(s===specs[1])mutations.push(x=>x.practice.speechCondition='wrong',x=>x.items.pop());
 if(s!==specs[0])mutations.push(x=>x.items[0].segmentId='S999',x=>x.items[0].audio.lessonId='wrong',x=>x.items[0].audio.lessonVersion='v9',x=>x.items[0].audio.realizationId='wrong',x=>x.items[0].audio.sha256='bad');
 if(s===specs[2])mutations.push(x=>x.practice.version='wrong',x=>x.practice.anchorIds=[]);
 for(const mutate of mutations){const bad=clone(u);mutate(bad);const h=harness({units:[bad]});h.c.xStartCatalog(bad.id);assert.deepEqual(h.calls.start,[bad.id]);assert.equal(h.c[s.api].evidence(),null);}
}
// Incorrect/assisted outcomes, replay provenance, retries and short text normalization.
for(const s of specs){const u=lessons.find(x=>x.id===s.ids[0]);
 const h=harness();h.c.xStartCatalog(u.id);h.click(s.prefix+'-play');h.finish();
 h.click(s.prefix+'-replay-'+u.items[0].segmentId);h.audio.at(-1).end();
 const replayEvent=evidence(h,s).events.find(e=>e.kind===(s===specs[0]?'CONTEXT_PRESERVING_REPLAY':'SEGMENT_REPLAY'));assert.equal(replayEvent.segmentId,u.items[0].segmentId);if(s===specs[2])assert.equal(replayEvent.contextPreserved,!!u.fullPanelAudio);
 assert.equal(evidence(h,s)[s.counter],1);assert.equal(evidence(h,s).assisted,true);assert.equal(h.audio.at(-1).item.audio.sha256,u.items[0].audio.sha256);
 answer(h,s,u,{correct:false});assert.equal(evidence(h,s).correct,false);assert.equal(evidence(h,s).responseAssisted,true);
 const rows=JSON.parse(h.c.localStorage.getItem(s.history));
 if(s===specs[2]){assert.equal(rows[0].support_state,'REPLAY_ASSISTED');assert.deepEqual(rows[0].support_states,['CHOICE_ASSISTED','REPLAY_ASSISTED']);assert.equal(rows[0].evidence_strength,'MODERATE');assert.equal(rows[0].error_class,'MEANING_ERROR');}
 else assert.equal(evidence(h,s).events.find(e=>e.kind===s.response).evidence,'ASSISTED');
 // Slower first play and second full play both mark assisted; pending callbacks cancel.
 for(const mode of ['slow','repeat','stop','navigate','pop','fail']){
  const x=harness();x.c.xStartCatalog(u.id);if(mode==='slow')x.find('rate-select').value='0.7';x.click(s.prefix+'-play');
  if(mode==='stop')x.click(s.prefix+'-stop');if(mode==='navigate')x.c.xGo('catalog',{probe:true});if(mode==='pop')x.pop();
  if(mode==='fail')x.audio[0].fail();else x.finish();
  if(['stop','navigate','pop','fail'].includes(mode)){assert.equal(evidence(x,s).fullEnded,false);assert.equal(x.find(s.prefix+'-answer'),null);}
  if(mode==='fail')assert.ok(evidence(x,s).events.some(e=>e.kind==='PLAYBACK_FAILED'));
  if(mode==='slow'){assert.equal(evidence(x,s).assisted,true);answer(x,s,u);if(s===specs[2]){assert.equal(evidence(x,s).evidence[0].playback_mode,'SLOW');assert.equal(evidence(x,s).evidence[0].support_state,'CHOICE_ASSISTED','slow first pass is not counted as a replay');}}
  if(mode==='repeat'){x.click(s.prefix+'-play');x.finish();assert.equal(evidence(x,s).fullPlays,2);assert.equal(evidence(x,s).assisted,true);}
 }
 // JSON snapshot API is a copy, not a mutable reference to runtime state.
 const snapshot=h.c[s.api].evidence();snapshot.phase='tampered';assert.equal(evidence(h,s).phase,'complete');
 h.click(s.prefix+'-next');assert.equal(h.find(s.panel).hidden,true);assert.equal(h.calls.go.at(-1)[0],'catalog');
}
const b02=specs[2];
for(const id of b02.ids){const u=lessons.find(x=>x.id===id);const h=harness();h.c.xStartCatalog(id);h.click('man-b02-play');h.finish();answer(h,b02,u);
 h.c.xStartCatalog(id);assert.equal(evidence(h,b02).attemptIndex,2);h.click('man-b02-play');h.finish();answer(h,b02,u);
 for(const row of evidence(h,b02).evidence){assert.equal(row.exposure_class,'REPAIR');assert.equal(row.evidence_strength,'REPAIR_ONLY');assert.equal(row.attempt_index,2);}
}
// Wrong short text is separate from comprehension correctness; numeric/punctuation aliases.
for(const transform of [s=>s.toUpperCase()+'!',()=> 'not the answer',s=>s.replace(/six/g,'6').replace(/fifteen/g,'15').replace(/five/g,'5')]){
 const u=lessons.find(x=>x.id==='MAN-0066'),h=harness();h.c.xStartCatalog(u.id);h.click('man-b02-play');h.finish();
 const form=h.find('man-b02-answer');form.all().find(e=>e.type==='radio'&&Number(e.value)===u.practice.correctChoice).checked=true;
 for(const [i,t] of u.practice.speechTasks.entries()){const input=h.find('man-b02-span-'+i);input.value=transform(t.answer);input.fire('input');}form.fire('submit');
 const rows=evidence(h,b02).evidence;assert.equal(rows[0].correct,true);for(const r of rows.slice(1)){const correct=transform('test')!=='not the answer';assert.equal(r.correct,correct);assert.equal(r.error_class,correct?null:'OTHER');assert.equal(r.evidence_strength,'REPAIR_ONLY');}
}
const inference=lessons.find(u=>b02.ids.includes(u.id)&&u.practice.operator==='INFERENCE_STANCE');
assert.ok(inference);{const h=harness();h.c.xStartCatalog(inference.id);h.click('man-b02-play');h.finish();answer(h,b02,inference,{correct:false});assert.equal(evidence(h,b02).evidence[0].error_class,'INFERENCE_ERROR');}
// Resume accepts current saved bindings and rejects known stale/incompatible sessions.
for(const s of specs){const u=lessons.find(x=>x.id===s.ids[0]),initial=harness();initial.c.xStartCatalog(u.id);
 const saved=JSON.parse(initial.c.sessionStorage.getItem(s.key));
 for(const phase of ['listening','complete']){const h=harness({session:{[s.key]:JSON.stringify({...saved,phase})}});await h.dom();assert.equal(evidence(h,s).phase,phase);}
 for(const patch of [{uid:'other'},{at:NOW-12*60*60*1000-1},{phase:'dictation'},{realizationId:'wrong'}]){const h=harness({session:{[s.key]:JSON.stringify({...saved,...patch})}});await h.dom();assert.equal(h.c[s.api].evidence(),null);}
 for(const options of [{hash:'#catalog'},{session:{[s.key]:'{invalid'}},{units:[{...clone(u),status:'draft'}]}]){const h=harness({session:{[s.key]:JSON.stringify(saved)},...options});await h.dom();assert.equal(h.c[s.api].evidence(),null);}
 if(s!==specs[0]){const h=harness({session:{[s.key]:JSON.stringify({...saved,assetHashes:['wrong']})}});await h.dom();assert.equal(h.c[s.api].evidence(),null);assert.equal(h.c.sessionStorage.getItem(s.key),null);}
 // Base Dictation restore guards are also captured through wrappers.
 const study={items:clone(u.items)};
 for(const changed of [false,true]){const units=[clone(u)];if(changed)units[0].status='draft';const h=harness({units,session:{'base-study':JSON.stringify(study)}});assert.equal(h.c.xRestoreStudy(),true);await h.flush();assert.equal(h.calls.restore,changed?0:1);if(changed)assert.equal(h.c.sessionStorage.getItem('base-study'),null);}
 if(s!==specs[0]){const bad=clone(study);bad.items[0].audio.sha256='0'.repeat(64);const h=harness({session:{'base-study':JSON.stringify(bad)}});h.c.xRestoreStudy();await h.flush();assert.equal(h.calls.restore,0);}
}
// Characterize known gaps rather than claiming stronger validation than production has.
{
 const s=specs[0],u=clone(lessons.find(u=>u.id==='MAN-0844'));
 u.items[0].audio.lessonVersion='v9';const h=harness({units:[u]});h.c.xStartCatalog(u.id);assert.ok(evidence(h,s),'mixed validates panel binding, not each item binding');
 const saved=JSON.parse(h.c.sessionStorage.getItem(s.key));const resumed=harness({session:{[s.key]:JSON.stringify({...saved,lessonId:'wrong',lessonVersion:'v9'})}});await resumed.dom();assert.equal(evidence(resumed,s).lessonVersion,'v9','mixed resume currently does not revalidate saved lesson/version');
}
for(const s of [specs[1],specs[2]]){const u=clone(lessons.find(u=>u.id===s.ids[0]));u.items[0].audio.sha256='0'.repeat(64);const h=harness({units:[u]});h.c.xStartCatalog(u.id);assert.ok(evidence(h,s),'valid-shaped fresh asset hash is not compared to a frozen allowlist');
 const saved=JSON.parse(h.c.sessionStorage.getItem(s.key));const resumed=harness({units:[u],session:{[s.key]:JSON.stringify({...saved,lessonVersion:'v9'})}});await resumed.dom();assert.equal(evidence(resumed,s).lessonVersion,'v9','resume validates current lesson/hash, not saved version field');
}
{const u=clone(catalogs[4].lessons[0]);u.audioRealizationRef='RELATIONAL-ONLY';u.items.forEach(i=>i.audio.realizationId=u.audioRealizationRef);const h=harness({units:[u]});h.c.xStartCatalog(u.id);assert.ok(evidence(h,b02),'Batch02 realization equality is relational, not exact-pair allowlisted');}
// Transcript wrappers preserve panel/context behavior and ordinary fallback.
for(const id of ['MAN-0844','MAN-0921','MAN-0565','MAN-0065']){const u=lessons.find(x=>x.id===id),h=harness();h.c.items=clone(u.items);h.c.xSpeakTranscriptItem(0);
 if(u.fullPanelAudio){assert.equal(h.audio.length,1);assert.equal(h.audio[0].item.audio.sha256,u.fullPanelAudio.sha256);assert.equal(h.c.xTranscriptPlaying,true);h.audio[0].end();assert.equal(h.c.xTranscriptPlaying,false);}
 else assert.deepEqual(h.calls.speak,[0]);
}
{const u=lessons.find(x=>x.id==='MAN-0844'),h=harness();h.c.xStartCatalog(u.id);h.c.items=clone(u.items);h.c.xSpeakTranscriptItem(0);assert.equal(evidence(h,specs[0]).assisted,true);h.c.xOpenAudioReport();assert.equal(h.calls.report[0].audio.sha256,u.fullPanelAudio.sha256);h.c.playAudio();assert.equal(h.calls.dictation,1);assert.ok(evidence(h,specs[0]).events.some(e=>e.kind==='DICTATION_CONTEXT_REPLAY'));}
// Captured globals/load order are intentional current behavior; no global cleanup.
for(const order of [paths,...paths.map(p=>[p])]){const h=harness({order});assert.equal(h.c.xStartCatalog('ordinary-private'), 'BASE_DICTATION');assert.deepEqual(h.calls.start,['ordinary-private']);assert.equal(h.c.xRestoreStudy(),'BASE_RESTORE');
 const late=[];h.c.xStartCatalog=id=>late.push(id);h.c.xStartCatalog('late');assert.deepEqual(late,['late']);assert.deepEqual(h.calls.start,['ordinary-private'],'later assignment replaces wrapper; no automatic reattachment');
}
console.log('Practice characterization PASS: 24 routes, 15 Practice lessons, bindings, playback, evidence, resume, wrappers; offline/no paid APIs');
// Test-only access for differential core extraction tests; assertions above stay intact.
export { harness, specs, lessons, evidence, answer, NOW };
