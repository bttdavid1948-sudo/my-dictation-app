import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),'registry');
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
test('composite gate joins exact 12 Curriculum and Practice IDs and versioned sources, while completed drafts await Curriculum review',()=>{
 const batch=read('batch-01-readiness.json'), c=read('batch-01-curriculum-inputs.json'), p=read('batch-01-practice-inputs.json'), e=read('batch-01-operations-precheck.json'), pipe=read('pipeline.json'), registry=read('artifacts.json'), lessons=read('lessons.json');
 const artifacts=new Map(registry.artifacts.map(a=>[a.id+'@'+a.version,a]));
 assert.equal(batch.preparation_status,'PAUSED_AWAITING_CURRICULUM_REVIEW');
 assert.deepEqual(batch.lesson_ids,p.lesson_ids);
 assert.deepEqual(batch.lesson_ids,c.selected_lessons.map(x=>x.lesson_id));
 assert.deepEqual(batch.lesson_ids,e.selected_lessons.map(x=>x.lesson_id));
 assert.equal(new Set(batch.lesson_ids).size,12);
 for(const row of e.source_refs){assert.equal(row.sha256,artifacts.get(row.ref)?.sha256);assert.equal(artifacts.get(row.ref)?.validation_status,'HASH_VERIFIED')}
 for(let i=0;i<12;i++){
  const x=c.selected_lessons[i],y=p.selected_lessons[i],z=e.selected_lessons[i];
  assert.equal(x.lesson_id,y.lesson_id);assert.equal(y.lesson_id,z.lesson_id);
  assert.equal(x.unique_purpose_pass,true);assert.equal(x.curriculum_ready,true);assert.equal(x.conflict_status,'NONE');
  assert.equal(y.practice_preprod_ready,true);assert.equal(y.practice_conflict,'NONE');
  assert.equal(z.contract_precheck_valid,true);assert.equal(z.production_ready,true);assert.equal(z.final_practice_ready,false);
 }
 assert.ok(batch.inputs.every(x=>x.status==='PASS'&&x.evidence_ref));
 assert.equal(pipe.production_queue_enabled,false);assert.equal(batch.batch_open,false);assert.equal(e.queue_safety.production_queue_enabled,false);
 assert.deepEqual(lessons.records,[]);assert.equal(pipe.next_action.code,'CURRICULUM_REVIEW_BATCH_01_DRAFTS');
});
