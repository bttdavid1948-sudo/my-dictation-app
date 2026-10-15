import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {recover} from './prepare-retained-source.mjs';
const root=path.resolve(process.env.MAN_FIXTURE_ROOT||fileURLToPath(new URL('..',import.meta.url)));
const prefix='docs/content-pipeline/registry/';
const index=JSON.parse(fs.readFileSync(path.join(root,prefix+'batch-03-closure-evidence-index.json')));
const base={id:'MAN-0067',mode:'desktop',target:'live'};
function fixture(fn){const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'man-receipt-'));try{fs.cpSync(path.join(root,'docs'),path.join(tmp,'docs'),{recursive:true});fs.cpSync(path.join(root,'assets/official-lessons-batch03.json'),path.join(tmp,'assets/official-lessons-batch03.json'),{recursive:true});return fn(tmp);}finally{fs.rmSync(tmp,{recursive:true,force:true});}}
for(const target of ['staging','live'])for(const id of ['MAN-0067','MAN-0167','MAN-0367'])for(const mode of ['desktop','mobile'])test(`exact retained ${target}/${id}/${mode}`,()=>fixture(tmp=>{
 const original=fs.readFileSync(path.join(tmp,`${prefix}batch-03-evidence/retained-core/${target}/${id}/${mode}/evidence.json`));
 const r=recover(tmp,{id,mode,target});
 assert.deepEqual(fs.readFileSync(path.join(tmp,`batch03-verification/source/${id}/${mode}/evidence.json`)),original);
 assert.equal(r.source_run,target==='live'?index.core_live_run_id:index.core_staging_run_id);
 assert.equal(r.source_status,JSON.parse(original).status);
 if(target==='live')assert.match(r.composite_sha256,/^[a-f0-9]{64}$/);
}));
for(const [name,opts] of [['unknown target',{target:'production'}],['unknown lesson',{id:'../MAN-0067'}],['unknown mode',{mode:'phone'}]])test(`reject ${name}`,()=>fixture(tmp=>assert.throws(()=>recover(tmp,{...base,...opts}))));
for(const [name,file] of [['closure index',prefix+'batch-03-closure-evidence-index.json'],['core',prefix+'batch-03-evidence/retained-core/live/MAN-0067/desktop/evidence.json'],['composite',prefix+'batch-03-evidence/live/MAN-0067/desktop/evidence.json'],['catalog','assets/official-lessons-batch03.json']])test(`reject tampered ${name} before output`,()=>fixture(tmp=>{
 fs.appendFileSync(path.join(tmp,file),' ');assert.throws(()=>recover(tmp,base));
 assert.equal(fs.existsSync(path.join(tmp,'batch03-verification/source/MAN-0067/desktop/evidence.json')),false);
}));
test('reject staging bytes substituted for live core',()=>fixture(tmp=>{
 fs.copyFileSync(path.join(tmp,prefix+'batch-03-evidence/retained-core/staging/MAN-0067/desktop/evidence.json'),path.join(tmp,prefix+'batch-03-evidence/retained-core/live/MAN-0067/desktop/evidence.json'));assert.throws(()=>recover(tmp,base));
}));
test('reject missing composite proof',()=>fixture(tmp=>{
 fs.rmSync(path.join(tmp,prefix+'batch-03-evidence/live/MAN-0067/desktop/evidence.json'));assert.throws(()=>recover(tmp,base));
}));
test('workflow removes expired download while preserving source identity and live gate',()=>{
 const y=fs.readFileSync(new URL('../.github/workflows/batch03-release-verify.yml',import.meta.url),'utf8');
 assert(!y.includes('actions/download-artifact'));assert(y.includes('prepare-retained-source.mjs'));assert(y.includes("github.event_name == 'push' && 'live' || 'staging'"));assert(y.includes("github.event_name == 'push' && '37733903764' || '37733419191'"));assert(y.includes('rollback-revalidate.mjs'));
});
