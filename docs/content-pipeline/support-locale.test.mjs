import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateSupportRegistry,canPublishOfficialV1} from './support-locale.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'registry',n),'utf8'));
const policy=read('support-locale-policy.json');
test('empty foundation stays separate from frozen lesson identity and closed queue',()=>{
 const lessons=read('lessons.json'), bundles=read('support-bundles.json'), pipeline=read('pipeline.json');
 assert.doesNotThrow(()=>validateSupportRegistry(bundles,lessons));
 assert.equal(pipeline.production_queue_enabled,false);
 assert.equal(lessons.records.length,0);
 assert.equal(policy.official_v1.default_support_locale,'vi-VN');
 assert.equal(read('batch-01-readiness.json').preparation_status,'INPUT_PENDING');
});
test('official V1 publication requires full approved vi-VN support for matching canonical asset version',()=>{
 const lesson={lesson_id:'EXAMPLE-1',lesson_asset_version:'v1',support_bundle_refs:['support-example@v2']};
 const bundle={bundle_id:'support-example',bundle_version:'v2',lesson_id:'EXAMPLE-1',canonical_lesson_asset_version:'v1',support_locale:'vi-VN',coverage:'FULL',qa_status:'PASS',content_ref:'private://example'};
 const registry={schema_version:'1.0',records:[bundle]};
 assert.doesNotThrow(()=>validateSupportRegistry(registry,{records:[lesson]}));
 assert.equal(canPublishOfficialV1(lesson,registry,policy),true);
 for(const variant of [{...bundle,qa_status:'PENDING'},{...bundle,coverage:'PARTIAL'},{...bundle,support_locale:'en-US'},{...bundle,canonical_lesson_asset_version:'v0'}])assert.equal(canPublishOfficialV1(lesson,{...registry,records:[variant]},policy),false);
 assert.equal(canPublishOfficialV1({...lesson,support_bundle_refs:[]},registry,policy),false);
 assert.throws(()=>validateSupportRegistry({schema_version:'1.0',records:[bundle,bundle]},{records:[lesson]}),/Duplicate/);
});
