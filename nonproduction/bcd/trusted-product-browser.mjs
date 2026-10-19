// Actual isolated product UI -> Auth SDK -> loopback ingress -> Firestore SDK.
// Synthetic audio end callback; viewport only. Never a physical-device/Google Auth claim.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const root=process.cwd(),here=path.dirname(new URL(import.meta.url).pathname),deps=createRequire(path.join(root,'nonproduction/learner-reliability/package.json')),{chromium}=deps('playwright'),rules=deps('@firebase/rules-unit-testing');
if(process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8080')throw Error('ISOLATED_EMULATORS_REQUIRED');
const checks=[],errors=[],projectId='demo-man-progress-bcd';let browser,server,env,base;
const pass=(device,name)=>{checks.push({device,name,status:'PASS'});console.log('TRUSTED_PRODUCT_PASS '+device+' '+name);};
// Prior existing browser run generated these assets. Remove only exact untracked
// generated files; never unlink a checked-in runtime, content, or audio asset.
const bundle=JSON.parse(fs.readFileSync(path.join(here,'candidate.bundle.json'),'utf8'));
for(const name of [...Object.keys(bundle.assets),...Object.keys(bundle.sourceBindings||{}),'trusted-practice-client.js']){
 if(!/^[a-z0-9.-]+\.(js|cjs)$/.test(name))throw Error('GENERATED_PATH');const relative='assets/'+name,file=path.join(root,relative);if(!fs.existsSync(file))continue;
 let tracked=true;try{execFileSync('git',['ls-files','--error-unmatch','--',relative],{cwd:root,stdio:'ignore'});}catch{tracked=false;}if(tracked)throw Error('TRACKED_ASSET_COLLISION');fs.unlinkSync(file);
}
async function boot(page){
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>[base+'/', 'http://127.0.0.1:8080/','http://127.0.0.1:9099/'].some(p=>r.request().url().startsWith(p))?r.continue():r.abort());
 await page.goto(base+'/?trusted=1#me');await page.waitForFunction(()=>window.ManTrustedPractice&&window.ManLearningSession&&catalogUnitsCache.length);
 await page.evaluate(()=>{window.__savedFirebase=firebase;delete window.firebase;__fixtureSwitch(null);});
 for(const n of ['firebase-app-compat.js','firebase-auth-compat.js'])await page.addScriptTag({content:fs.readFileSync(path.join(root,'nonproduction/learner-reliability/node_modules/firebase',n),'utf8')});
 await page.evaluate(projectId=>{const sdk=firebase;window.firebase=__savedFirebase;const app=sdk.initializeApp({apiKey:'demo-key',projectId},'trusted-ui');window.__trustedAuth=app.auth();__trustedAuth.useEmulator('http://127.0.0.1:9099',{disableWarnings:true});ManTrustedPractice.activate(__trustedAuth);},projectId);
 await page.waitForFunction(()=>ManTrustedPractice.status==='GUEST');
}
async function signIn(page,email,password,create=false){return page.evaluate(async({email,password,create})=>{const a=__trustedAuth;const result=create?await a.createUserWithEmailAndPassword(email,password):await a.signInWithEmailAndPassword(email,password);await new Promise(resolve=>{if(currentUser?.uid===result.user.uid)return resolve();const t=setInterval(()=>{if(currentUser?.uid===result.user.uid){clearInterval(t);resolve();}},10);});return result.user.uid;},{email,password,create});}
async function complete(page){
 await page.evaluate(()=>{sessionStorage.removeItem('man_mixed_panel_v1');ManFixedAudio.play=(item,rate,end)=>{if(typeof end==='function')queueMicrotask(end);return true;};xStartLessonChoice(false,'MAN-0844',false);});
 await page.locator('#man-mixed-panel').getByRole('button',{name:'▶ Nghe cả cuộc thảo luận',exact:true}).click();await page.locator('#man-panel-answer input[type=radio]').first().check();for(const input of await page.locator('#man-panel-answer input[type=text]').all())await input.fill('Synthetic learner response.');await page.getByRole('button',{name:'Xem phản hồi',exact:true}).click();
 await page.waitForFunction(()=>ManTrustedPractice.lastReceipt?.validatedCompletion===true);return page.evaluate(()=>ManTrustedPractice.lastReceipt);
}
try{
 env=await rules.initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync(path.join(here,'bcd-private.emulator.rules'),'utf8')}});await env.clearFirestore();
 server=spawn(process.execPath,[path.join(here,'server.cjs'),root],{env:{...process.env,MAN_TRUSTED_HTTP:'1'},stdio:['ignore','pipe','inherit']});base=await new Promise((resolve,reject)=>{server.once('error',reject);server.once('exit',code=>reject(Error('SERVER_EXIT_'+code)));setTimeout(()=>reject(Error('SERVER_TIMEOUT')),15000).unref();server.stdout.on('data',b=>{const m=String(b).match(/Isolated preview (\d+)/);if(m)resolve('http://127.0.0.1:'+m[1]);});});browser=await chromium.launch({headless:true});
 for(const device of ['desktop','mobile-viewport']){
  const options={viewport:device==='desktop'?{width:1440,height:1000}:{width:390,height:844},isMobile:device!=='desktop',hasTouch:device!=='desktop'},c=await browser.newContext(options),p=await c.newPage();await boot(p);assert.equal(await p.evaluate(()=>ManTrustedPractice.lastReceipt),null);pass(device,'guest has no trusted account receipt');
  const email='trusted-'+device+'-'+Date.now()+'@example.invalid',password='synthetic-emulator-only',uid=await signIn(p,email,password,true);const receipt=await complete(p);assert.equal(receipt.uid,uid);assert.equal(receipt.eligible,false);assert.equal(receipt.timeEligibility,'PENDING_TIME_POLICY');pass(device,'actual rendered Practice -> real Auth token -> server canonical replay -> privileged SDK readback ACK; awards stay pending');
  // Separate browser storage and real second Auth session recover the same UID.
  const c2=await browser.newContext(options),q=await c2.newPage();await boot(q);assert.equal(await signIn(q,email,password),uid);const second=await complete(q);assert.equal(second.uid,uid);assert.notEqual(second.attemptId,receipt.attemptId);pass(device,'two independent authenticated browser contexts produce separate acknowledged attempts for same UID');
  await p.evaluate(()=>__trustedAuth.signOut());await p.waitForFunction(()=>ManTrustedPractice.status==='GUEST');assert.equal(await p.evaluate(()=>ManTrustedPractice.lastReceipt),null);const other=await signIn(p,'other-'+email,password,true);assert.notEqual(other,uid);assert.equal(await p.evaluate(()=>ManTrustedPractice.lastReceipt),null);pass(device,'actual Auth account switch clears old receipt and never grants prior UID evidence');
  const rect=await q.locator('#man-trusted-status').boundingBox();assert(rect&&rect.width<=options.viewport.width);assert.equal(await q.locator('#man-trusted-status').getAttribute('role'),'status');pass(device,'rendered ACK status accessible in desktop/mobile viewport');await c.close();await c2.close();
 }
 assert.deepEqual(errors,[]);
}finally{await browser?.close();server?.kill();await env?.cleanup();const receipt={status:checks.length===10&&!errors.length?'PASS':'FAIL',checks,errors,scope:'actual isolated product UI/Auth/Firestore emulators and server transport; synthetic audio, viewport only; no Google sign-in, physical device, trusted time credit, B/C eligibility or production claim'};fs.writeFileSync(path.join(here,'trusted-product-receipt.json'),JSON.stringify(receipt,null,2));console.log('TRUSTED_PRODUCT_RECEIPT '+JSON.stringify(receipt));}
