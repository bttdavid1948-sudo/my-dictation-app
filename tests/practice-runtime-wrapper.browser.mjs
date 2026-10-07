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
const output=process.env.PRACTICE_BROWSER_OUTPUT||'/tmp/practice-wrapper-browser';fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()||file.endsWith('.wav')){res.writeHead(404);res.end();return;}
 let data=fs.readFileSync(file);
 if(file.endsWith('/index.html'))data=Buffer.from(data.toString().replace(/<script type="module" id="man-generic-practice-bootstrap"[^>]*>[\s\S]*?<\/script>/,'').replace('<script src="assets/mixed-panel-runtime.js','<script>window.__practiceBaseStart=window.xStartCatalog;</script>\n<script src="assets/mixed-panel-runtime.js'));
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
  await page.evaluate(async()=>{
   await loadCatalogUnits();
   Object.defineProperties(window,{catalogUnitsCache:{get:()=>catalogUnitsCache},auth:{get:()=>auth},items:{get:()=>items,set:v=>{items=v;}},currentIndex:{get:()=>currentIndex,set:v=>{currentIndex=v;}},MAN_STUDY_KEY:{get:()=>MAN_STUDY_KEY}});
   const actual=ManFixedAudio;window.__audio=[];window.ManFixedAudio={...actual,stop(){},play(item,rate,end,fail){window.__audio.push({item,rate,end,fail});return true;}};
   const {practiceHost}=await import('/tests/fixtures/practice-wrapper-host.js');
   const {installPracticeWrapper}=await import('/assets/practice-runtime-wrapper.js');
   window.__install=()=>{window.__wrapper=installPracticeWrapper(practiceHost(window,window.__practiceBaseStart));};window.__install();
  });
  const inventory=await page.evaluate(()=>catalogUnitsCache.map(u=>({id:u.id,practice:!!u.practice,prefix:u.practice?.anchorIds?'man-b02':u.fullPanelAudio?'man-panel':'man-inference',choice:u.practice?.correctChoice,speech:u.practice?.speechTasks||[]})));
  assert.equal(inventory.filter(u=>u.practice).length,15);assert.equal(inventory.filter(u=>!u.practice).length,9);
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
   const completed=await page.evaluate(()=>__wrapper.evidence());assert.equal(completed.correct,true);assert.equal(completed.assisted,true,'second full play assistance');
   await page.evaluate(()=>{__wrapper.dispose();__install();});
   assert.equal(await page.evaluate(id=>__wrapper.restore(id),u.id),true);assert.deepEqual(await page.evaluate(()=>__wrapper.evidence()),completed);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,'no horizontal overflow');
   if(u.prefix==='man-panel'||(u.prefix==='man-b02'&&u.speech.length))await page.screenshot({path:path.join(output,`${viewport.width}-${u.prefix}.png`)});
   await page.locator('#'+u.prefix+'-dictation').click();
   assert.equal(await page.locator('#dictation-app').isVisible(),true);assert.equal(await page.evaluate(()=>location.hash),'#learn');
   assert.equal(await page.evaluate(()=>__wrapper.evidence().phase),'dictation');
   await page.evaluate(()=>xGo('catalog'));assert.equal(await page.evaluate(()=>location.hash),'#catalog');
  }
  for(const u of inventory.filter(u=>!u.practice)){
   await page.evaluate(id=>xStartCatalog(id),u.id);assert.equal(await page.locator('#dictation-app').isVisible(),true);assert.equal(await page.evaluate(id=>items[0].audio.lessonId===id,u.id),true);
  }
  // Native history back triggers real app popstate and wrapper cancellation.
  const u=inventory.find(u=>u.practice);await page.evaluate(id=>{__audio.length=0;xGo('catalog');xStartCatalog(id);},u.id);
  await page.locator('#'+u.prefix+'-play').click();await page.goBack();
  await page.evaluate(()=>__audio[0].end());assert.equal(await page.evaluate(()=>__wrapper.evidence().fullEnded),false);
  assert.equal(await page.evaluate(()=>__firebaseWrites),0);assert.deepEqual(errors,[],'learner console page errors');
  results.push({viewport,practice:15,ordinary:9,dom:true,audioCallbacks:'controlled double',resume:true,navigation:true,firebaseWrites:0,errors});await context.close();
 }
 fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({status:'PASS',environment:'isolated actual index.html; no live/paid API/acoustic claim',results},null,2));console.log(JSON.stringify({status:'PASS',results}));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
