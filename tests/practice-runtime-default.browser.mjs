// Bounded browser verification against the actual index.html learner DOM/globals.
// Firebase and audio callbacks are isolated doubles; never contacts production.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const require=createRequire(import.meta.url);
let chromium;
try {({chromium}=require(path.join(root,'mobile-release-runner/node_modules/playwright')));}catch(_){({chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright')));}
const NOW=1791349200000;
const output=process.env.PRACTICE_BROWSER_OUTPUT||'/tmp/practice-default-browser';fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()||file.endsWith('.wav')){res.writeHead(404);res.end();return;}
 let data=fs.readFileSync(file);
 if(file.endsWith('/fixed-audio-runtime.js'))data=Buffer.from(data.toString()+`;window.__audio=[];window.ManFixedAudio={...window.ManFixedAudio,stop(){},play(item,rate,end,fail){window.__audio.push({item,rate,end,fail});return true;}};`);
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(data);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
const results=[];
try{
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{const u=route.request().url();if(u.startsWith(base))return route.continue();if(u.includes('firebasejs'))return route.fulfill({contentType:'text/javascript',body:''});return route.abort();});
  await page.addInitScript(({NOW})=>{
   Date.now=()=>NOW;window.__firebaseWrites=0;
   const snapshot={exists:false,data:()=>({}),docs:[],forEach(){}};
   const ref={doc(){return this;},collection(){return this;},orderBy(){return this;},limit(){return this;},where(){return this;},get:async()=>snapshot,onSnapshot(fn){fn(snapshot);return()=>{};},set(){window.__firebaseWrites++;throw Error('unexpected isolated write');},add(){window.__firebaseWrites++;throw Error('unexpected isolated write');}};
   const auth={currentUser:null,onAuthStateChanged(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>fn(null),{once:true});else setTimeout(()=>fn(null),0);return()=>{};}};
   const authFn=()=>auth;authFn.GoogleAuthProvider=class{};
   const firestore=()=>({collection:()=>ref,runTransaction(){window.__firebaseWrites++;throw Error('unexpected transaction');}});firestore.FieldValue={serverTimestamp:()=>null};
   window.firebase={initializeApp(){},auth:authFn,firestore};
  },{NOW});
  await page.goto(base+'/#home',{waitUntil:'load'});
  const ready=async()=>{await page.waitForFunction(()=>!!window.ManGenericPractice);await page.evaluate(async()=>{await loadCatalogUnits();});};
  await ready();
  const inventory=await page.evaluate(()=>catalogUnitsCache.map(u=>({id:u.id,practice:!!u.practice,prefix:u.practice?.anchorIds?'man-b02':u.fullPanelAudio?'man-panel':'man-inference',choice:u.practice?.correctChoice,speech:u.practice?.speechTasks||[]})));
  assert.equal(inventory.filter(u=>u.practice).length,18);assert.equal(inventory.filter(u=>!u.practice).length,9);
  const fresh=inventory.filter(u=>u.practice);
  // Consecutive fresh starts across capabilities must resume the current lesson.
  for(const u of fresh)await page.evaluate(id=>xStartCatalog(id),u.id);
  await page.reload({waitUntil:'load'});await ready();
  await page.waitForFunction(id=>ManGenericPractice.evidence()?.lessonId===id,fresh.at(-1).id);
  for(const u of inventory.filter(u=>u.practice)){
   await page.evaluate(id=>{__audio.length=0;xStartCatalog(id);},u.id);
   assert.equal(await page.locator('#'+u.prefix+'-answer').count(),0);
   await page.locator('#'+u.prefix+'-play').click();
   const canceled=await page.evaluate(()=>{const prior=__audio[0];return !!prior;});assert.ok(canceled);
   await page.locator('#'+u.prefix+'-stop').click();
   await page.evaluate(()=>__audio[0].end());assert.equal(await page.locator('#'+u.prefix+'-answer').count(),0,'late callback ignored after stop');
   await page.locator('#'+u.prefix+'-play').click();
   await page.evaluate(()=>{let i=1;while(i<__audio.length){if(i>30)throw Error('unbounded audio');__audio[i++].end();}});
   await page.locator('#'+u.prefix+'-answer input[type=radio]').nth(u.choice).check();
   for(const [i,t]of u.speech.entries())await page.locator('#'+u.prefix+'-span-'+i).fill(t.answer);
   await page.locator('#'+u.prefix+'-submit').click();assert.equal(await page.locator('#'+u.prefix+'-result').isVisible(),true);
   const completed=await page.evaluate(()=>ManGenericPractice.evidence());assert.equal(completed.correct,true);assert.equal(completed.assisted,true,'second full play assistance');
   await page.reload({waitUntil:'load'});await ready();
   await page.waitForFunction(id=>ManGenericPractice.evidence()?.lessonId===id,u.id);
    assert.deepEqual(await page.evaluate(()=>ManGenericPractice.evidence()),completed,'default reload canonical restoration');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,'no horizontal overflow');
   if(u.prefix==='man-panel'||(u.prefix==='man-b02'&&u.speech.length))await page.screenshot({path:path.join(output,`${viewport.width}-${u.prefix}.png`)});
   await page.locator('#'+u.prefix+'-dictation').click();
   assert.equal(await page.locator('#dictation-app').isVisible(),true);assert.equal(await page.evaluate(()=>location.hash),'#learn');
   assert.equal(await page.evaluate(()=>ManGenericPractice.evidence().phase),'dictation');
   await page.evaluate(()=>xGo('catalog'));assert.equal(await page.evaluate(()=>location.hash),'#catalog');
  }
  let legacyRestores=0,rejections=0;
  const sessionKeys={'man-panel':'man_mixed_panel_v1','man-inference':'man_final_two_practice_v1','man-b02':'man_batch02_practice_v1'};
  const legacyAPI={'man-panel':'ManMixedPanel','man-inference':'ManFinalTwoPractice','man-b02':'ManBatch02Practice'};
  for(const u of inventory.filter(u=>u.practice)){
   const key=sessionKeys[u.prefix],api=legacyAPI[u.prefix];
   // Produce genuine pre-cutover envelopes with retained legacy functions.
   await page.evaluate(id=>{ManGenericPractice.dispose();sessionStorage.clear();__audio.length=0;xStartCatalog(id);},u.id);
   await page.reload({waitUntil:'load'});await ready();
   await page.waitForFunction(({api,id})=>window[api].evidence()?.lessonId===id,{api,id:u.id});
   assert.equal(await page.evaluate(()=>ManGenericPractice.evidence()),null,'legacy listening owner retained');legacyRestores++;
   await page.locator('#'+u.prefix+'-play').click();
   await page.evaluate(()=>{let i=0;while(i<__audio.length){if(i>30)throw Error('audio');__audio[i++].end();}});
   await page.locator('#'+u.prefix+'-answer input[type=radio]').nth(u.choice).check();
   for(const [i,t]of u.speech.entries())await page.locator('#'+u.prefix+'-span-'+i).fill(t.answer);
   await page.locator('#'+u.prefix+'-submit').click();
   const legacy=await page.evaluate(api=>window[api].evidence(),api);
   await page.reload({waitUntil:'load'});await ready();
   await page.waitForFunction(({api,id})=>window[api].evidence()?.lessonId===id,{api,id:u.id});
   assert.equal(await page.evaluate(()=>ManGenericPractice.evidence()),null,'legacy owner retained');
   assert.deepEqual(await page.evaluate(api=>window[api].evidence(),api),legacy);
   assert.equal(await page.locator('#'+u.prefix+'-result').isVisible(),true);legacyRestores++;
   const beforeReplay=await page.evaluate(api=>window[api].evidence(),api);
   await page.locator('#'+u.prefix+'-replay-'+(await page.evaluate(id=>catalogUnitsCache.find(u=>u.id===id).items[0].segmentId,u.id))).click();
   assert.equal(await page.evaluate(api=>window[api].evidence().assisted,api),true,'legacy support owner');
   const counter=u.prefix==='man-panel'?'contextReplays':'segmentReplays';
   assert.equal((await page.evaluate(api=>window[api].evidence(),api))[counter],beforeReplay[counter]+1);
   await page.locator('#'+u.prefix+'-dictation').click();
   await page.evaluate(()=>xSpeakTranscriptItem(0));
   assert.equal(await page.evaluate(()=>ManGenericPractice.evidence()),null,'legacy dictation/transcript stays legacy');
   if(u.prefix==='man-panel')assert.ok((await page.evaluate(api=>window[api].evidence(),api)).events.some(e=>e.kind==='TRANSCRIPT_FULL_PANEL_REPLAY'),'legacy transcript evidence retained');
   // A new explicit lesson start always enters generic stack, not migration.
   await page.evaluate(id=>{xGo('catalog');xStartCatalog(id);},u.id);
   assert.equal(await page.evaluate(()=>ManGenericPractice.evidence().phase),'listening');
   const generic=await page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),key);
   assert.equal(generic.phase,'GENERIC_PRACTICE_V1');
   for(const patch of [{phase:'listening',resumeIdentity:{}},{uid:'other'},{at:NOW-12*60*60*1000-1},{wire:{...generic.wire,phase:'dictation'}},{resumeIdentity:{}},{coreState:{}},{lessonId:'unknown'}]){
    await page.evaluate(({key,generic,patch})=>{sessionStorage.clear();sessionStorage.setItem(key,JSON.stringify({...generic,...patch}));},{key,generic,patch});
    await page.reload({waitUntil:'load'});await ready();await page.evaluate(()=>ManGenericPractice.restoreAvailable());
    assert.equal(await page.evaluate(()=>ManGenericPractice.evidence()),null,'invalid generic fail closed');
    assert.equal(await page.evaluate(api=>window[api].evidence(),api),null,'invalid generic never downgraded to legacy');rejections++;
   }
   await page.evaluate(({key,generic})=>{sessionStorage.clear();sessionStorage.setItem(key,JSON.stringify(generic));},{key,generic});
   await page.goto(base+'/#catalog',{waitUntil:'load'});await page.reload({waitUntil:'load'});await ready();
   assert.equal(await page.evaluate(()=>ManGenericPractice.evidence()),null,'wrong-route resume remains inactive');
   await page.evaluate(()=>sessionStorage.clear());
  }
  for(const u of inventory.filter(u=>!u.practice)){
   await page.evaluate(id=>xStartCatalog(id),u.id);assert.equal(await page.locator('#dictation-app').isVisible(),true);assert.equal(await page.evaluate(id=>items[0].audio.lessonId===id,u.id),true);
  }
  // Native history back triggers real app popstate and wrapper cancellation.
  const u=inventory.find(u=>u.practice);await page.evaluate(id=>{__audio.length=0;xGo('catalog');xStartCatalog(id);},u.id);
  await page.locator('#'+u.prefix+'-play').click();await page.goBack();
  await page.evaluate(()=>__audio[0].end());assert.equal(await page.evaluate(()=>ManGenericPractice.evidence().fullEnded),false);
  assert.equal(await page.evaluate(()=>__firebaseWrites),0);assert.deepEqual(errors,[],'learner console page errors');
  results.push({viewport,practice:18,ordinary:9,defaultBootstrap:true,legacyRestores,rejections,rollback:true,dom:true,audioCallbacks:'controlled double',resume:true,navigation:true,firebaseWrites:0,errors});await context.close();
 }
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({status:'PASS',environment:'isolated default index.html; no live/paid API/acoustic claim',results},null,2));console.log(JSON.stringify({status:'PASS',results}));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
