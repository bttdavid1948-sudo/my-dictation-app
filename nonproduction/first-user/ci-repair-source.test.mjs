import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
const root=path.resolve(process.argv[2]),script=path.join(root,'batch03-verification/prepare-retained-source.mjs'),checks=[];
function run(id,mode,target,dir=root){return spawnSync(process.execPath,[script,dir],{env:{...process.env,MAN_LESSON_ID:id,MAN_EXECUTION_MODE:mode,MAN_VERIFY_TARGET:target},encoding:'utf8'})}
for(const target of ['staging'])for(const id of ['MAN-0067','MAN-0167','MAN-0367'])for(const mode of ['desktop','mobile']){const r=run(id,mode,target);assert.equal(r.status,0,r.stderr);checks.push({id,mode,target,status:'EXACT_RECOVERY_PASS'})}
assert.notEqual(run('MAN-0067','desktop','live').status,0);checks.push({negative:'live route rejected'});
assert.notEqual(run('OTHER','desktop','staging').status,0);checks.push({negative:'wrong lesson rejected'});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'man-ci-receipt-'));try{
 const index='docs/content-pipeline/registry/batch-03-closure-evidence-index.json';fs.mkdirSync(path.dirname(path.join(temp,index)),{recursive:true});fs.copyFileSync(path.join(root,index),path.join(temp,index));
 const source='docs/content-pipeline/registry/batch-03-evidence/retained-core/staging/MAN-0067/desktop/evidence.json';fs.mkdirSync(path.dirname(path.join(temp,source)),{recursive:true});fs.writeFileSync(path.join(temp,source),'{}');assert.notEqual(run('MAN-0067','desktop','staging',temp).status,0);checks.push({negative:'corrupt receipt rejected'});
 fs.writeFileSync(path.join(temp,index),'{}');assert.notEqual(run('MAN-0067','desktop','staging',temp).status,0);checks.push({negative:'changed canonical index rejected'});
}finally{fs.rmSync(temp,{recursive:true,force:true})}
console.log(JSON.stringify({status:'PASS',checks}));
