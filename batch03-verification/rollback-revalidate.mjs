// Reuse all verified core outcomes; rerun only the invalidated withdrawal gate.
import {chromium,devices} from '../mobile-release-runner/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';import {createServer} from 'node:http';import {resolve,extname} from 'node:path';
const id=process.env.MAN_LESSON_ID,mode=process.env.MAN_EXECUTION_MODE,live=process.env.MAN_VERIFY_TARGET==='live';
const out=new URL(`./evidence/${id}/${mode}/`,import.meta.url);await mkdir(out,{recursive:true});
const sourceBytes=await readFile(new URL(`./source/${id}/${mode}/evidence.json`,import.meta.url));
const source=JSON.parse(sourceBytes),hash=b=>createHash('sha256').update(b).digest('hex');
for(const key of ['naturalFullPlayback','resume','dictationCompletion','negativeInference','feedbackContext','practiceRows'])assert.ok(source[key],`Missing preserved outcome ${key}`);
assert.equal(source.naturalFullPlayback,'ALL_SEGMENTS_ENDED_EXACT_HASH_BOUND');assert.equal(source.negativeInference,'INCORRECT_FIRST_PASS_NOT_SUCCESS');
if(live)assert.equal(source.feedbackWrite,'ACKNOWLEDGED_BY_BACKEND');else assert.equal(source.status,'PASS');
const catalog=JSON.parse(await readFile(new URL('../assets/official-lessons-batch03.json',import.meta.url),'utf8')),expected=catalog.lessons.find(x=>x.id===id);
assert.equal(source.realizationId,expected.audioRealizationRef);assert.deepEqual(source.assets.map(x=>x.sha256),expected.items.map(x=>x.audio.sha256));
const result={...source,status:'PENDING',source_status:source.status,source_evidence_sha256:hash(sourceBytes),source_run_id:Number(process.env.MAN_SOURCE_RUN),target:live?'LIVE':'LOCAL_STAGING',status_basis:'PRESERVED_CORE_OUTCOMES_PLUS_TARGETED_WITHDRAWAL_REVALIDATION'};
delete result.failure;let server,browser,page;
const root=resolve(new URL('../',import.meta.url).pathname);
if(!live){server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),p=resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!p.startsWith(root+'/'))throw Error('path');res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.html':'text/html','.wav':'audio/wav'})[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch(_){res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));}
const base=live?'https://bttdavid1948-sudo.github.io/my-dictation-app/':`http://127.0.0.1:${server.address().port}/`;
try{
 browser=await chromium.launch({headless:true});const context=await browser.newContext(mode==='mobile'?devices['Pixel 5']:{viewport:{width:1440,height:1000}});page=await context.newPage();
 if(live){const expectedRuntime=hash(await readFile(new URL('../assets/practice-runtime-wrapper.js',import.meta.url)));let deployed=false;for(let i=0;i<24;i++){const r=await context.request.get(base+'assets/practice-runtime-wrapper.js?rollback='+Date.now());if(r.ok()&&hash(await r.body())===expectedRuntime){deployed=true;break;}await new Promise(r=>setTimeout(r,5000));}assert.ok(deployed,'Exact correction not deployed');result.rollback_runtime_sha256=expectedRuntime;}
 await page.goto(base,{waitUntil:'domcontentloaded'});
 async function click(l){await l.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));if(mode==='mobile')await l.tap();else await l.click();}
 async function start(){await click(page.getByRole('button',{name:'Kho bài học',exact:true}).filter({visible:true}));await click(page.getByRole('button',{name:'Xem tất cả bài học →',exact:true}).filter({visible:true}));await page.locator('#x-lib-q').fill(expected.unitName);await click(page.locator('#x-lib-grid article').filter({has:page.getByRole('heading',{name:expected.unitName,exact:true})}).getByRole('button',{name:'🔥 Chiến bài này',exact:true}));await page.locator('#man-b02-play').waitFor();}
 await start();const saved=await page.evaluate(()=>sessionStorage.getItem('man_batch02_practice_v1'));assert.ok(JSON.parse(saved).resumeIdentity);result.rollback_seed_sha256=hash(saved);
 await context.route('**/assets/official-lessons-batch03.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...catalog,lessons:catalog.lessons.filter(x=>x.id!==id)})}));
 // Reproduce immediate navigation while the catalog request is still pending.
 await page.reload({waitUntil:'domcontentloaded'});await click(page.getByRole('button',{name:'Kho bài học',exact:true}).filter({visible:true}));
 await page.waitForFunction(()=>sessionStorage.getItem('man_batch02_practice_v1')===null,null,{timeout:30000});
 await page.locator('article').filter({hasText:'MAN-0065'}).first().waitFor();assert.equal(await page.locator('article').filter({hasText:expected.unitName}).count(),0);assert.equal(await page.locator('#man-b02-panel').count(),0);
 result.rollback='SCOPED_WITHDRAWAL_NO_CACHED_REVIVAL_PRIOR_LESSONS_RETAINED';await page.screenshot({path:new URL('withdrawal.png',out).pathname,fullPage:true});
 await context.unroute('**/assets/official-lessons-batch03.json');await page.reload({waitUntil:'domcontentloaded'});await start();result.rollbackRestore='EXACT_PAIR_AVAILABLE_AFTER_CATALOG_RESTORE';
 result.rollback_revalidation={status:'PASS',gate_only:true,full_playback_rerun:false,feedback_writes:0,synthesis_calls:0,immediate_navigation_race:true,checked_at:new Date().toISOString()};result.status='PASS';
}catch(e){result.status='FAIL';result.failure=String(e.stack||e);process.exitCode=1;await page?.screenshot({path:new URL('failure.png',out).pathname,fullPage:true}).catch(()=>{});}
finally{await writeFile(new URL('evidence.json',out),JSON.stringify(result,null,2));console.log(JSON.stringify({id,mode,status:result.status,target:result.target,gate:'WITHDRAWAL_ONLY',failure:result.failure}));await browser?.close();server?.close();}
