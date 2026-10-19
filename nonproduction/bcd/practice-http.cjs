'use strict';
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module'),{pathToFileURL}=require('node:url');
function makeHandler(producer){return async(req,res)=>{
 const host=req.headers.host||'',origin='http://'+host,remote=req.socket.remoteAddress||'';
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 const finish=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body));};
 if(!/^127\.0\.0\.1:\d+$/.test(host)||!['127.0.0.1','::ffff:127.0.0.1','::1'].includes(remote))return finish(403,{error:'ISOLATED_HOST_REQUIRED'});
 if(req.method!=='POST'||req.url!=='/__man/trusted/command'||req.headers.origin!==origin||!/^application\/json(?:;|$)/.test(req.headers['content-type']||''))return finish(403,{error:'REQUEST_NOT_ALLOWED'});
 try{let chunks=[],size=0;for await(const b of req){size+=b.length;if(size>16384)return finish(413,{error:'REQUEST_LIMIT'});chunks.push(b);}const result=await producer.command(JSON.parse(Buffer.concat(chunks).toString('utf8')));return finish(200,result);}
 catch(e){const known=['INVALID_COMMAND','INVALID_BODY','UNSUPPORTED_COMMAND','AUTH_REQUIRED','AUTH_UNCONFIRMED','AUTH_USER_ABSENT','CANONICAL_LESSON_REQUIRED','REVISION_CONFLICT','OPERATION_CONFLICT','ACCOUNT_FENCED','SESSION_FENCED','READBACK_UNCONFIRMED','SESSION_COMPLETE'];return finish(409,{error:known.includes(e.message)?e.message:'UNCONFIRMED'});}
};}
async function createRouter(root){
 const projectId='demo-man-progress-bcd';if(process.env.MAN_TRUSTED_HTTP!=='1'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099'||process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8080')throw Error('ISOLATED_EMULATORS_REQUIRED');
 const deps=createRequire(path.join(root,'nonproduction/learner-reliability/package.json')),rules=deps('@firebase/rules-unit-testing'),env=await rules.initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8080}});
 const privileged=async fn=>{let value;await env.withSecurityRulesDisabled(async c=>{value=await fn(c)});return value;};
 const store={read:p=>privileged(async c=>{const x=await c.firestore().doc(p).get();return x.exists?x.data():null;}),transaction:fn=>privileged(c=>{const db=c.firestore();return db.runTransaction(tx=>fn({get:async p=>{const x=await tx.get(db.doc(p));return x.exists?x.data():null;},set:(p,d)=>tx.set(db.doc(p),d)}));})};
 const assets=path.join(root,'assets'),{normalizePracticeLesson,canonicalPracticeJSON}=await import(pathToFileURL(path.join(assets,'practice-runtime-contract.js'))),{createPracticeCore}=await import(pathToFileURL(path.join(assets,'practice-runtime-core.js')));
 const catalog=new Map();for(const name of ['official-lessons.json','official-lessons-man0844.json','official-lessons-final-two.json','official-lessons-batch01-exceptions.json','official-lessons-batch02.json','official-lessons-batch03.json','official-lessons-batch04.json']){for(const lesson of JSON.parse(fs.readFileSync(path.join(assets,name),'utf8')).lessons||[]){const key=lesson.id+'@'+lesson.version;if(catalog.has(key)&&canonicalPracticeJSON(catalog.get(key))!==canonicalPracticeJSON(lesson))throw Error('CATALOG_CONFLICT');catalog.set(key,lesson);}}
 const {createAuthPort}=require('./auth-emulator-port.cjs'),{createProducer}=require('./trusted-practice-server.cjs');
 return {handle:makeHandler(createProducer({mode:'ISOLATED_NONPRODUCTION',projectId,auth:createAuthPort({mode:'ISOLATED_NONPRODUCTION',projectId}),store,catalog:async(id,v)=>catalog.get(id+'@'+v),normalize:normalizePracticeLesson,createCore:createPracticeCore})),close:()=>env.cleanup()};
}
module.exports={makeHandler,createRouter};
