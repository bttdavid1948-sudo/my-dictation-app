import test from 'node:test';
import assert from 'node:assert/strict';
import {verify,assessDocument,validateManifest} from './verify.mjs';
const context={lessonId:'MAN-0165',lessonVersion:'v0.1',segmentId:'S001',realizationId:'MAN-0165-OPENAI-FIXED-v0.2',realizationVersion:'v0.2',profileRef:'P@v0.2',assetSha256:'a'.repeat(64),deliveryMode:'PERSISTED_ASSET',userAgent:'synthetic-test',viewport:'393x727',playbackRate:'1',playbackState:'ended',currentTime:1};
const record=(id,platform='desktop')=>({document_id:id,platform,expected_context:{...context}});
const manifest={project:'my-dictation-project-4381e',database:'(default)',collection:'owner_feedback',read_only:true,records:[record('a'.repeat(20)),record('b'.repeat(20),'mobile')]};
const doc=r=>({name:`projects/${manifest.project}/databases/(default)/documents/owner_feedback/${r.document_id}`,createTime:'2026-09-30T00:00:00Z',updateTime:'2026-09-30T00:00:00Z',fields:{createdAt:{timestampValue:'2026-09-30T00:00:00Z'},page:{stringValue:'audio'},kind:{stringValue:'Báo bug'},message:{stringValue:JSON.stringify({type:'audio_problem',schemaVersion:1,category:'Vấn đề khác',note:'OPERATIONS_DESKTOP_SMOKE_TEST fixture',context:r.expected_context})}}});
test('exact GETs only; partial progression; token and private context excluded from receipt',async()=>{
 let calls=0;const token='synthetic-token';
 const result=await verify(manifest,token,async(url,options)=>{assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer '+token);const r=manifest.records[calls++];assert.ok(url.endsWith('/'+r.document_id));return {status:r.platform==='desktop'?200:403,text:async()=>JSON.stringify(doc(r))};});
 assert.equal(calls,2);assert.equal(result.results[0].status,'PASS');assert.equal(result.results[1].status,'PENDING');assert.equal(result.pairs[0].status,'PENDING');assert.ok(!JSON.stringify(result).includes(token));assert.ok(!JSON.stringify(result).includes('synthetic-test'));assert.ok(!JSON.stringify(result).includes('a'.repeat(20)+'"'));
});
test('wrong document, realization, runtime context and missing server timestamp fail',()=>{
 const r=manifest.records[0];const d=doc(r);d.name+='x';delete d.fields.createdAt;const m=JSON.parse(d.fields.message.stringValue);m.context.realizationVersion='v0.1';m.context.viewport='999x999';d.fields.message.stringValue=JSON.stringify(m);
 assert.deepEqual(assessDocument(d,r).failures,['DOCUMENT_NAME_MISMATCH','SERVER_TIMESTAMP_MISSING','EXACT_CONTEXT_MISMATCH']);
});
test('malformed report and unsafe/different targets rejected',()=>{
 const d=doc(manifest.records[0]);d.fields.message.stringValue='not json';assert.ok(assessDocument(d,manifest.records[0]).failures.includes('MALFORMED_AUDIO_REPORT'));
 assert.throws(()=>validateManifest({...manifest,collection:'users_profile'}));assert.throws(()=>validateManifest({...manifest,records:[record('../bad')]}));assert.throws(()=>validateManifest({...manifest,records:[manifest.records[0],manifest.records[0]]}));
});
test('two exact retained reads close one pair; missing other lesson does not block it',async()=>{
 const other=record('c'.repeat(20));other.expected_context={...context,lessonId:'MAN-0365',realizationId:'MAN-0365-OPENAI-FIXED-v0.2'};
 const m={...manifest,records:[...manifest.records,other]};let i=0;
 const r=await verify(m,'fixture',async()=>{const x=m.records[i++];return {status:x===other?404:200,text:async()=>JSON.stringify(doc(x))};});
 assert.equal(r.pairs[0].status,'PASS');assert.equal(r.pairs[1].status,'PENDING');
});
