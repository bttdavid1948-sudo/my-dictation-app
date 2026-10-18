// Restore original canonical receipt bytes; never relabel a partial core FAIL.
// No network, credential, learner-data access or live verification execution.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const hash=b=>createHash('sha256').update(b).digest('hex');
const indexPath='docs/content-pipeline/registry/batch-03-closure-evidence-index.json';
const indexHash='e680d6d995f9f1ab8012cb941f3275d648a1cc139839be41777aeb9a76987a3f';
export function recover(root,{id,mode,target}) {
  assert(['MAN-0067','MAN-0167','MAN-0367'].includes(id),'EXACT_LESSON_REQUIRED');
  assert(['desktop','mobile'].includes(mode),'EXACT_MODE_REQUIRED');
  assert(['staging','live'].includes(target),'EXACT_TARGET_REQUIRED');
  const ib=fs.readFileSync(path.join(root,indexPath));
  assert.equal(hash(ib),indexHash,'CANONICAL_INDEX_CHANGED');
  const index=JSON.parse(ib);
  function retained(name) {
    const entry=index.artifacts.find(x=>x.path===name);assert(entry,'RECEIPT_NOT_INDEXED');
    const b=fs.readFileSync(path.join(root,name));
    assert.equal(hash(b),entry.sha256,'RECEIPT_HASH_MISMATCH');
    assert.equal(b.length,entry.size_bytes,'RECEIPT_SIZE_MISMATCH');
    return {bytes:b,json:JSON.parse(b),sha256:hash(b)};
  }
  const core=retained(`docs/content-pipeline/registry/batch-03-evidence/retained-core/${target}/${id}/${mode}/evidence.json`),s=core.json;
  assert.equal(s.lessonId,id);assert.equal(s.mode,mode);
  assert.equal(s.target,target==='live'?'LIVE':'LOCAL_STAGING');
  const catalog=retained('assets/official-lessons-batch03.json').json;
  const lesson=catalog.lessons.find(x=>x.id===id);assert(lesson,'LESSON_NOT_IN_BOUND_CATALOG');
  assert.equal(s.realizationId,lesson.audioRealizationRef);
  assert.deepEqual(s.assets.map(x=>x.sha256),lesson.items.map(x=>x.audio.sha256));
  let compositeSha;
  if(target==='live') {
    const c=retained(`docs/content-pipeline/registry/batch-03-evidence/live/${id}/${mode}/evidence.json`),v=c.json;
    assert.equal(v.status,'PASS');assert.equal(v.target,'LIVE');
    assert.equal(v.source_evidence_sha256,core.sha256);
    assert.equal(v.source_run_id,index.core_live_run_id);
    assert.equal(v.source_status,s.status);
    for(const key of ['lessonId','lessonVersion','realizationId','mode','assets','naturalFullPlayback','resume','dictationCompletion','negativeInference','feedbackContext','feedbackWrite','practiceRows'])assert.deepEqual(v[key],s[key],`CORE_OUTCOME_DRIFT:${key}`);
    assert.equal(s.feedbackWrite,'ACKNOWLEDGED_BY_BACKEND');
    assert.equal(v.rollback_revalidation?.status,'PASS');
    assert.equal(v.rollback_revalidation.feedback_writes,0);
    assert.equal(v.rollback_revalidation.synthesis_calls,0);
    compositeSha=c.sha256;
  } else assert.equal(s.status,'PASS');
  const out=path.join(root,'batch03-verification/source',id,mode,'evidence.json');
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,core.bytes);
  return {status:'RECOVERED_EXACT',id,mode,target,sha256:core.sha256,source_status:s.status,source_run:target==='live'?index.core_live_run_id:index.core_staging_run_id,composite_sha256:compositeSha};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(recover(path.resolve(process.argv[2]||fileURLToPath(new URL('..',import.meta.url))),{id:process.env.MAN_LESSON_ID,mode:process.env.MAN_EXECUTION_MODE,target:process.env.MAN_VERIFY_TARGET})));
