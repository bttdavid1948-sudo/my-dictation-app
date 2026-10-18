// Recover immutable canonical receipts instead of relying on expired Actions ZIPs.
// Copies test evidence only. No network, production mutation or feedback write.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root=path.resolve(process.argv[2]||new URL('..',import.meta.url).pathname),id=process.env.MAN_LESSON_ID,mode=process.env.MAN_EXECUTION_MODE,target=process.env.MAN_VERIFY_TARGET;
assert(['MAN-0067','MAN-0167','MAN-0367'].includes(id),'EXACT_LESSON_REQUIRED');assert(['desktop','mobile'].includes(mode),'EXACT_MODE_REQUIRED');assert.equal(target,'staging','NONPRODUCTION_ONLY');
const sha=b=>createHash('sha256').update(b).digest('hex'),indexPath='docs/content-pipeline/registry/batch-03-closure-evidence-index.json',ib=fs.readFileSync(path.join(root,indexPath));
assert.equal(sha(ib),'e680d6d995f9f1ab8012cb941f3275d648a1cc139839be41777aeb9a76987a3f','CANONICAL_INDEX_CHANGED');
const index=JSON.parse(ib),name=`docs/content-pipeline/registry/batch-03-evidence/retained-core/${target}/${id}/${mode}/evidence.json`,entry=index.artifacts.find(x=>x.path===name);assert(entry,'RECEIPT_NOT_INDEXED');
const b=fs.readFileSync(path.join(root,name));assert.equal(sha(b),entry.sha256,'RECEIPT_HASH_MISMATCH');assert.equal(b.length,entry.size_bytes,'RECEIPT_SIZE_MISMATCH');
const s=JSON.parse(b);assert.equal(s.status,'PASS');assert.equal(s.lessonId,id);assert.equal(s.mode,mode);assert.equal(s.target,target==='live'?'LIVE':'LOCAL_STAGING');
const out=path.join(root,'batch03-verification/source',id,mode,'evidence.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,b);console.log(JSON.stringify({status:'RECOVERED_EXACT',id,mode,target,sha256:sha(b),source_run:target==='live'?index.core_live_run_id:index.core_staging_run_id}));
