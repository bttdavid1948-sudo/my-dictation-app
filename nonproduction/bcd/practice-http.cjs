'use strict';
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module'),{pathToFileURL}=require('node:url');
function makeHandler(producer){return async(req,res)=>{
 const host=req.headers.host||'',origin='http://'+host,remote=req.socket.remoteAddress||'';
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 const finish=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body));};
 if(!/^127\.0\.0\.1:\d+$/.test(host)||!['127.0.0.1','::ffff:127.0.0.1','::1'].includes(remote))return finish(403,{error:'ISOLATED_HOST_REQUIRED'});
 if(req.method!=='POST'||!['/__man/trusted/command','/__man/trusted/history'].includes(req.url)||req.headers.origin!==origin||!/^application\/json(?:;|$)/.test(req.headers['content-type']||''))return finish(403,{error:'REQUEST_NOT_ALLOWED'});
 try{let chunks=[],size=0;for await(const b of req){size+=b.length;if(size>16384)return finish(413,{error:'REQUEST_LIMIT'});chunks.push(b);}const input=JSON.parse(Buffer.concat(chunks).toString('utf8')),result=await(req.url.endsWith('/history')?producer.history(input):producer.command(input));return finish(200,result);}
 catch(e){const known=['INVALID_COMMAND','INVALID_BODY','UNSUPPORTED_COMMAND','AUTH_REQUIRED','AUTH_UNCONFIRMED','AUTH_USER_ABSENT','CANONICAL_LESSON_REQUIRED','REVISION_CONFLICT','OPERATION_CONFLICT','ACCOUNT_FENCED','SESSION_FENCED','READBACK_UNCONFIRMED','SESSION_COMPLETE'];return finish(409,{error:known.includes(e.message)?e.message:'UNCONFIRMED'});}
};}
// Existing server receipts, not a competing history store. The SDK port reads
// at most 20 matching rows/page and checks the account epoch before AND after.
function makeHistoryReader({verify,readPage}){return async input=>{
 if(!input||Object.keys(input).sort().join(',')!=='cursor,idToken'||!(input.cursor===null||typeof input.cursor==='string'&&/^[-A-Za-z0-9]{1,200}$/.test(input.cursor)))throw Error('INVALID_COMMAND');
 const actor=await verify(input.idToken);if(!actor||!/^[-A-Za-z0-9]{1,128}$/.test(actor.uid||''))throw Error('AUTH_REQUIRED');
 const page=await readPage(actor.uid,input.cursor);if(!page||!Array.isArray(page.rows)||page.rows.length>20||!Number.isSafeInteger(page.epoch)||page.epoch<0||!(page.next===null||typeof page.next==='string'&&/^[-A-Za-z0-9]{1,200}$/.test(page.next)))throw Error('READBACK_UNCONFIRMED');
 const receipts=page.rows.map(row=>{if(row.uid!==actor.uid||row.epoch!==page.epoch||row.validatedCompletion!==true||row.trust!=='SERVER_COMMAND_REPLAY_NONPRODUCTION'||row.eligible!==false||!/^[-A-Za-z0-9]{1,128}$/.test(row.attemptId||'')||!/^[-A-Za-z0-9]{1,128}$/.test(row.lessonId||'')||!/^[-A-Za-z0-9._]{1,100}$/.test(row.version||'')||!Number.isSafeInteger(row.serverAt)||row.serverAt<0||typeof row.correct!=='boolean'||!/^[-A-Za-z0-9]{1,128}$/.test(row.receiptId||''))throw Error('READBACK_UNCONFIRMED');return Object.fromEntries(['receiptId','attemptId','lessonId','version','serverAt','correct','validatedCompletion','activityEligibility','timeEligibility'].map(k=>[k,row[k]]));});
 return {ack:true,uid:actor.uid,epoch:page.epoch,receipts,next:page.next,scope:'BOUNDED_SERVER_RECEIPT_RECOVERY_NOT_FULL_ACCOUNT_HISTORY'};
};}
async function readHistoryPage(db,uid,cursor){const control=db.doc(`users/${uid}/bcd_product/state`),before=await control.get(),epoch=before.data()?.epoch??0;if(before.data()?.accountDeleted)throw Error('ACCOUNT_FENCED');let query=db.collection(`users/${uid}/trusted_practice`).where('validatedCompletion','==',true).limit(20);if(cursor){const point=await db.doc(`users/${uid}/trusted_practice/${cursor}`).get();if(!point.exists)throw Error('READBACK_UNCONFIRMED');query=query.startAfter(point);}const result=await query.get(),after=await control.get();if(after.data()?.accountDeleted||(after.data()?.epoch??0)!==epoch)throw Error('ACCOUNT_FENCED');return {epoch,rows:result.docs.filter(x=>x.id.startsWith('completion-')).map(x=>x.data()).filter(x=>x.epoch===epoch),next:result.docs.length===20?result.docs.at(-1).id:null};}
async function createRouter(root){
 const projectId='demo-man-progress-bcd';if(process.env.MAN_TRUSTED_HTTP!=='1'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8080')throw Error('ISOLATED_EMULATORS_REQUIRED');
 const deps=createRequire(path.join(root,'nonproduction/learner-reliability/package.json')),rules=deps('@firebase/rules-unit-testing'),env=await rules.initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8080}});
 const privileged=async fn=>{let value;await env.withSecurityRulesDisabled(async c=>{value=await fn(c)});return value;};
 const store={read:p=>privileged(async c=>{const x=await c.firestore().doc(p).get();return x.exists?x.data():null;}),transaction:fn=>privileged(c=>{const db=c.firestore();return db.runTransaction(tx=>fn({get:async p=>{const x=await tx.get(db.doc(p));return x.exists?x.data():null;},set:(p,d)=>tx.set(db.doc(p),d)}));})};
 const assets=path.join(root,'assets'),{normalizePracticeLesson,canonicalPracticeJSON}=await import(pathToFileURL(path.join(assets,'practice-runtime-contract.js'))),{createPracticeCore}=await import(pathToFileURL(path.join(assets,'practice-runtime-core.js')));
 const catalog=new Map();for(const name of ['official-lessons.json','official-lessons-man0844.json','official-lessons-final-two.json','official-lessons-batch01-exceptions.json','official-lessons-batch02.json','official-lessons-batch03.json','official-lessons-batch04.json']){for(const lesson of JSON.parse(fs.readFileSync(path.join(assets,name),'utf8')).lessons||[]){const key=lesson.id+'@'+lesson.version;if(catalog.has(key)&&canonicalPracticeJSON(catalog.get(key))!==canonicalPracticeJSON(lesson))throw Error('CATALOG_CONFLICT');catalog.set(key,lesson);}}
 const {createAuthPort}=require('./auth-emulator-port.cjs'),{createProducer}=require('./trusted-practice-server.cjs'),auth=createAuthPort({mode:'ISOLATED_NONPRODUCTION',projectId});
 const producer=createProducer({mode:'ISOLATED_NONPRODUCTION',projectId,auth,store,catalog:async(id,v)=>catalog.get(id+'@'+v),normalize:normalizePracticeLesson,createCore:createPracticeCore});
 producer.history=makeHistoryReader({verify:auth.verify,readPage:(uid,cursor)=>privileged(c=>readHistoryPage(c.firestore(),uid,cursor))});
 return {handle:makeHandler(producer),close:()=>env.cleanup()};
}
module.exports={makeHandler,createRouter,makeHistoryReader,readHistoryPage};
