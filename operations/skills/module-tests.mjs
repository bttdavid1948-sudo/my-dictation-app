import assert from 'node:assert/strict';import fs from 'node:fs';
import {admit} from './man-production-control/scripts/admit.mjs';import {inspect} from './man-practice-production/scripts/grounding-integrity.mjs';
import {testBootstrap} from '../orchestration/bootstrap.test.mjs';
testBootstrap();
import {testFeedbackBudget} from '../prelaunch/feedback-budget.test.mjs';
testFeedbackBudget();
import {testAuthErrors} from '../prelaunch/auth-errors.test.mjs';
await testAuthErrors();
const base={scope:'OFFICIAL_MAN_1000_ONLY',domain:'PRACTICE_2',frozenRulesSufficient:true,precedentSufficient:true,evidence_refs:['frozen-rule','canonical-precedent']};
assert.equal(admit(base).classification,'ROUTINE_EXECUTION');
for(const k of ['newCurriculumConstruct','unresolvedDuplicateProgression','curriculumRulesInsufficient'])assert.equal(admit({...base,[k]:true}).classification,'CURRICULUM_RESEARCH_REQUIRED');
for(const k of ['newPracticeSemantics','unresolvedEvidenceMapping','practiceRulesInsufficient'])assert.equal(admit({...base,[k]:true}).classification,'PRACTICE_RESEARCH_REQUIRED');
for(const k of ['productTruthConflict','breakingFrozenContract','crossDomainConflict','securityOrRightsConflict'])assert.equal(admit({...base,[k]:true,newPracticeSemantics:true}).classification,'PRODUCT_INTEGRATION_CONFLICT');
assert.throws(()=>admit({...base,scope:'PRIVATE'}));assert.throws(()=>admit({...base,evidence_refs:[]}));assert.throws(()=>admit({...base,precedentSufficient:false}));
const a={lesson_id:'MAN-FIXTURE',lesson_asset_version:'v1',canonical_transcript:'A 😀 cue.',segments:[{segment_id:'S1',text:'A 😀 cue.',script_speaker_id:'SPK1'}],target_anchors:[{anchor_id:'A1',anchor_kind:'SPEECH_PHENOMENON',construct_type:'SEGMENTATION_CONNECTED_SPEECH',segment_ids:['S1'],span_refs:[{segment_id:'S1',start_char:2,end_char:4}]}],available_audio_realization_refs:['R1']};
const r={lesson_id:a.lesson_id,lesson_asset_version:'v1',realization_id:'R1',audio_profile_id:'P1',audio_profile_version:'v1',qa_status:'PASS',qa_version:'v1',delivery_mode:'PERSISTED_ASSET',segment_mapping:[{segment_id:'S1',alignment_mode:'SEGMENT_ADDRESSABLE',segment_playback_ref:'fixture.wav'}]};
const result=inspect(a,r);assert.deepEqual(result.structural_errors,[]);assert.equal(result.span_slices[0].text,'😀');assert.equal(result.ready_for_final_grounding,true);assert.equal(result.PRACTICE_READY,false);assert.equal(result.CONTRACT_VALID,false);
assert.equal(inspect(a,null).blocker,'ACTUAL_REALIZATION_MISSING');
for(const m of [x=>x.lesson_asset_version='v2',x=>x.segment_mapping=[],x=>x.qa_status='PENDING',x=>x.segment_mapping[0].segment_playback_ref=null]){const bad=structuredClone(r);m(bad);assert.equal(inspect(a,bad).ready_for_final_grounding,false);}
const governance=JSON.parse(fs.readFileSync('docs/content-pipeline/registry/single-orchestrator-governance.json'));
for(const [lane,path] of Object.entries(governance.modules)){const txt=fs.readFileSync(path,'utf8');assert.ok(txt.startsWith('---\nname: man-'));assert.ok(txt.includes(lane));assert.ok(!txt.includes('TODO'));}
const packet=JSON.parse(fs.readFileSync(governance.direct_packet_contract));for(const key of ['SPECIALIST_ROUTE','TARGET_ROOM','BATCH_ID','LESSON_ID(S)','CURRENT_CANONICAL_STATE','EXACT_UNRESOLVED_QUESTION','RELEVANT_EVIDENCE','APPLICABLE_EXISTING_RULE','WHY_EXISTING_RULE_IS_INSUFFICIENT','DECISION_REQUIRED_FROM_SPECIALIST','EXPECTED_RETURN_FORMAT','UNAFFECTED_WORK_CONTINUING','RETURN_TARGET'])assert.ok(key in packet);
console.log('PASS: admission routes, fail-closed unknown admission, UTF16/exact-realization integrity and no automatic semantic PASS; three modular SOPs and direct packet. No product gate/provider calls.');
