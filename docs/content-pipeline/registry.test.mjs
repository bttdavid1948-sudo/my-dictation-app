import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate,verifyLocalArtifacts} from './validate.mjs';

const base=path.dirname(fileURLToPath(import.meta.url));
const load=n=>JSON.parse(fs.readFileSync(path.join(base,'registry',n),'utf8'));
const registry=load('artifacts.json'), pipeline=load('pipeline.json'), lessons=load('lessons.json');
const clone=x=>structuredClone(x);

test('version resolution retains superseded v0.1 and frozen v0.2 status',()=>{
  const index=validate(registry,pipeline,lessons);
  assert.equal(index.get('content-pipeline-contract@v0.1').status,'SUPERSEDED');
  assert.equal(index.get('content-pipeline-contract@v0.2').status,'FROZEN');
  assert.equal(registry.current['content-pipeline-contract'],'v0.2');
  assert.equal(index.get('curriculum-practice-contract@v0.3').status,'FROZEN');
  assert.equal(pipeline.production_queue_enabled,false);
  assert.equal(pipeline.next_action.code,'PROVIDE_VERSIONED_GLOBAL_REGISTRY_SNAPSHOT_AND_BATCH_SELECTION');
  assert.equal(pipeline.next_action.responsible_lane,'CURRICULUM_3');
  assert.equal(index.get('global-readiness-compatibility-check@v0.1').status,'REVIEW_READY');
  assert.equal(index.get('global-readiness-compatibility-check@v0.1').classification,'NON_BREAKING_EXTENSION_NEEDED');
  const preparation=load('batch-01-readiness.json');
  assert.equal(preparation.preparation_status,'INPUT_PENDING');
  assert.equal(preparation.batch_open,false);
  assert.equal(preparation.production_queue_enabled,false);
  assert.deepEqual(preparation.lesson_ids,[]);
  assert.equal(preparation.next_action.responsible_lane,pipeline.next_action.responsible_lane);
  assert.equal(pipeline.freeze_manifest_ref,'docs/content-pipeline/registry/freeze-manifests/content-pipeline-contract-v0.2.json');
  assert.deepEqual(lessons.records,[]);
});
test('routes preserve ownership and keep Owner outside happy path',()=>{
  const target=Object.fromEntries(pipeline.routes.map(x=>[x.code,x.responsible_lane]));
  assert.equal(target.RETURN_TO_CURRICULUM,'CURRICULUM_3');
  assert.equal(target.DUPLICATE,'CURRICULUM_3');
  assert.equal(target.PRACTICE_CONFLICT,'PRACTICE_2');
  assert.equal(target.IMPLEMENTATION_ISSUE,'OPERATIONS_4');
  assert.equal(target.OWNER_DECISION_REQUIRED,'OWNER');
  assert.ok(!pipeline.happy_path.includes('OWNER'));
});
test('validator rejects counterfeit freeze and broken version links',()=>{
  const altered=clone(pipeline); altered.production_queue_enabled=true;
  assert.throws(()=>validate(registry,altered,lessons),/cannot open before Batch 01 readiness/);
  const broken=clone(registry);
  broken.artifacts.find(a=>a.id==='content-pipeline-contract'&&a.version==='v0.1').superseded_by=null;
  assert.throws(()=>validate(broken,pipeline,lessons),/Broken supersedes/);
});
test('workbook identity is hash-verified when local downloads exist',()=>{
  const folder=process.env.MAN_ARTIFACT_DIR;
  if(!folder)return;
  verifyLocalArtifacts(registry,folder);
  const corrupted=clone(registry);
  corrupted.artifacts[0].sha256='0'.repeat(64);
  assert.throws(()=>verifyLocalArtifacts(corrupted,folder),/checksum mismatch/);
});
