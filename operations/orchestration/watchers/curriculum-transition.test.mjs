import assert from 'node:assert/strict';import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync(new URL('./curriculum-transition-allowlist.v0.1.json',import.meta.url),'utf8'));
assert.equal(p.scope,'OFFICIAL_MAN_1000_ONLY');assert.equal(p.lane,'CURRICULUM_3');assert.equal(p.fail_closed,true);assert.equal(p.production_enabled,false);assert.equal(p.audio_enabled,false);assert.equal(p.arbitrary_code_mutation_allowed,false);
assert.ok(p.allowed_destination_lanes.includes('PRACTICE_2'));assert.ok(p.allowed_destination_lanes.includes('OWNER'));assert.ok(p.forbidden.includes('Practice semantic decisions'));assert.ok(p.forbidden.includes('Production queue enable/open'));
assert.ok(p.allowed_changed_files.includes('docs/content-pipeline/registry/pipeline.json'));assert.ok(p.allowed_changed_files.includes('docs/content-pipeline/registry/batch-XX-curriculum-preproduction.json'));
console.log(JSON.stringify({status:'PASS',policy:p.policy_id,scope:p.scope,lane:p.lane,fail_closed:p.fail_closed}));
