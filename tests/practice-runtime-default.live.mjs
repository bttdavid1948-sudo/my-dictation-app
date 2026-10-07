// Cutover smoke only: real deployed bootstrap and native fixed-audio callbacks.
// No feedback submissions, Firebase mutations, paid calls or acoustic QA claim.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from '../mobile-release-runner/node_modules/playwright/index.mjs';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const base='https://bttdavid1948-sudo.github.io/my-dictation-app/';
const out=process.env.PRACTICE_BROWSER_OUTPUT||'/tmp/practice-default-live';fs.mkdirSync(out,{recursive:true});
const local=file=>fs.readFileSync(path.join(root,file),'utf8');
const digest=s=>createHash('sha256').update(s).digest('hex');
const receipt={status:'PENDING',target:base,productionWrites:0,paidCalls:0,acousticClaim:false,results:[]};
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport});const page=await context.newPage(),errors=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>{const req=route.request(),url=req.url();
   // Guest Firebase may POST read/listen RPCs. Abort any actual mutation.
   if(/firestore.googleapis.com/.test(url)&&/\/Write\/|:commit|:batchWrite/.test(url)){writes.push(url);return route.abort();}
   if(/api.openai.com|texttospeech.googleapis.com/.test(url)){writes.push(url);return route.abort();}
   return route.continue();
  });
  // Wait for the exact committed runtime tree, rather than accepting stale Pages.
  let deployed=false;
  for(let i=0;i<24;i++){
   const response=await context.request.get(base+'index.html?cutover='+Date.now());
   if(response.ok()&&digest(await response.text())===digest(local('index.html'))){deployed=true;break;}
   await new Promise(r=>setTimeout(r,5000));
  }
  assert.ok(deployed,'tested index tree not deployed');
  for(const file of ['assets/practice-runtime-bootstrap.js','assets/practice-runtime-host.js','assets/practice-runtime-wrapper.js','assets/practice-runtime-contract.js','assets/practice-runtime-core.js']){
   const response=await context.request.get(base+file+'?cutover='+Date.now());assert.ok(response.ok());assert.equal(digest(await response.text()),digest(local(file)),file+' deployed bytes');
  }
  await page.goto(base+'#home',{waitUntil:'load'});await page.waitForFunction(()=>!!window.ManGenericPractice);
  await page.evaluate(()=>loadCatalogUnits());
  const inventory=await page.evaluate(async()=>{const {normalizePracticeLesson}=await import('./assets/practice-runtime-contract.js');return catalogUnitsCache.map(u=>{const d=normalizePracticeLesson(u);return {id:u.id,practice:!!d,capability:d?d.evidence.model+':'+d.playback.fullStrategy:null,prefix:d?(d.evidence.model==='TASK_ROWS'?'man-b02':d.playback.fullStrategy==='FULL_PANEL'?'man-panel':'man-inference'):null,choice:u.practice?.correctChoice,speech:u.practice?.speechTasks||[]};});});
  const practice=inventory.filter(u=>u.practice),ordinary=inventory.filter(u=>!u.practice);assert.equal(practice.length,15);assert.equal(ordinary.length,9);
  for(const u of practice){await page.evaluate(id=>xStartCatalog(id),u.id);assert.equal(await page.evaluate(()=>ManGenericPractice.evidence()?.lessonId),u.id);}
  for(const u of ordinary){await page.evaluate(id=>xStartCatalog(id),u.id);assert.equal(await page.locator('#dictation-app').isVisible(),true);assert.equal(await page.evaluate(()=>ManGenericPractice.evidence()),null);}
  const representatives=[...new Map(practice.map(u=>[u.capability,u])).values()];
  const playback=[];
  for(const u of representatives){
   await page.evaluate(id=>xStartCatalog(id),u.id);await page.selectOption('#rate-select','2');
   await page.locator('#'+u.prefix+'-play').click();await page.locator('#'+u.prefix+'-answer').waitFor({timeout:200000});
   const state=await page.evaluate(()=>ManGenericPractice.evidence());assert.equal(state.fullEnded,true);
   const actual=await page.locator('#man-fixed-audio-player').evaluate(a=>({ended:a.ended,error:a.error?.code||null,hash:a.dataset.assetSha256}));assert.equal(actual.error,null);assert.equal(actual.ended,true);
   await page.locator('#'+u.prefix+'-answer input[type=radio]').nth(u.choice).check();
   for(const [i,t]of u.speech.entries())await page.locator('#'+u.prefix+'-span-'+i).fill(t.answer);
   await page.locator('#'+u.prefix+'-submit').click();assert.equal(await page.evaluate(()=>ManGenericPractice.evidence().correct),true);
   const completed=await page.evaluate(()=>ManGenericPractice.evidence());
   await page.reload({waitUntil:'load'});await page.waitForFunction(id=>window.ManGenericPractice?.evidence()?.lessonId===id,u.id);assert.deepEqual(await page.evaluate(()=>ManGenericPractice.evidence()),completed);
   await page.screenshot({path:path.join(out,`${viewport.width}-${u.capability.replace(/:/g,'-')}.png`)});
   await page.locator('#'+u.prefix+'-dictation').click();assert.equal(await page.locator('#dictation-app').isVisible(),true);
   await page.evaluate(()=>xGo('catalog'));assert.equal(await page.evaluate(()=>location.hash),'#catalog');
   playback.push({capability:u.capability,lessonId:u.id,nativeEnded:true,hash:actual.hash,reload:true,result:true,dictation:true});
  }
  assert.deepEqual(writes,[],'no production mutations or paid requests');assert.deepEqual(errors,[],'live page errors');
  receipt.results.push({viewport,practice:practice.length,ordinary:ordinary.length,playback,errors,unexpectedWrites:writes.length});await context.close();
 }
 receipt.status='PASS';
}catch(e){receipt.status='FAIL';receipt.failure=String(e);throw e;}
finally{fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));await browser.close();}
