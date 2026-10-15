// Actual candidate DOM/native FileReader; existing isolated Firebase fixture only.
import {chromium,devices} from '../mobile-release-runner/node_modules/playwright/index.mjs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const server=spawn(process.execPath,['nonproduction/learner-reliability/preview-server.cjs','.'],{stdio:['ignore','pipe','inherit']});
const port=await new Promise((resolve,reject)=>{server.once('exit',()=>reject(Error('FIXTURE_EXIT')));server.stdout.on('data',b=>{const m=String(b).match(/Isolated preview (\d+)/);if(m)resolve(m[1])})});
const browser=await chromium.launch({headless:true}),rows=[];
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext(mobile?devices['Pixel 5']:{viewport:{width:1440,height:1000}}),page=await context.newPage();
  let external=0;await context.route('**/*',r=>{if(new URL(r.request().url()).hostname!=='127.0.0.1'){external++;return r.abort()}return r.continue()});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html#mine`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.ManTextImport&&xCloudLoadedForUid==='DEMO-A');
  await page.locator('#unit-select').selectOption('');
  await page.locator('#new-unit-name').fill('CSV U1 synthetic');
  const input=page.locator('input[type=file][onchange*="handleCSVUpload"]');
  await input.setInputFiles({name:'u1.csv',mimeType:'text/csv',buffer:Buffer.from('English,Vietnamese\r\n"Hello, friend","Chào, bạn"\r\n"He said ""hi""",Chào')});
  await page.waitForFunction(()=>unitsData['CSV U1 synthetic']?.length===2);
  await page.waitForFunction(()=>JSON.parse(__fixtureDb['user_vocab/DEMO-A'].units)['CSV U1 synthetic']?.length===2);
  const saved=await page.evaluate(()=>JSON.parse(__fixtureDb['user_vocab/DEMO-A'].units));
  assert.equal(saved['CSV U1 synthetic'][0].en,'Hello, friend');assert.equal(saved['CSV U1 synthetic'][1].en,'He said "hi"');assert(saved['CSV U1 synthetic'][0].__manLesson);assert(saved['Bài riêng thử nghiệm']);
  await input.setInputFiles({name:'bad.csv',mimeType:'text/csv',buffer:Buffer.from('onecolumn')});
  await page.waitForFunction(()=>[...document.querySelectorAll('.x-toast')].some(x=>x.textContent.includes('CSV cần đúng hai cột')));
  assert.equal(await page.evaluate(()=>unitsData['CSV U1 synthetic'].length),2);
  assert.equal(external,0);assert.deepEqual(errors,[]);rows.push({mobile,status:'PASS',native_FileReader:true,module_loaded_before_import:true,quoted_import_and_identity:true,fixture_save_readback:true,siblings_preserved:true,invalid_input_no_mutation:true,external_requests:external,production_backend:false,physical_device:false});
  await context.close();
 }
 fs.mkdirSync('nonproduction/u1',{recursive:true});fs.writeFileSync('nonproduction/u1/browser-receipt.json',JSON.stringify({status:'BROWSER PASS',scope:'Actual DOM/FileReader; mock UID/Firestore fixture, no production backend/physical device',rows},null,2));console.log(JSON.stringify(rows));
}finally{await browser.close();server.kill();}
