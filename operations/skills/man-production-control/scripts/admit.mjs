import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
export function admit(s) {
 assert.equal(s.scope,'OFFICIAL_MAN_1000_ONLY');
 assert.ok(['CURRICULUM_3','PRACTICE_2','OPERATIONS_4'].includes(s.domain));
 const result=(classification,target,reason)=>({classification,semantic_owner:s.domain,execution_context:'#4 MẶN PRODUCTION ORCHESTRATOR',target_room:target,reason,independent_work_continues:true});
 if(s.productTruthConflict||s.breakingFrozenContract||s.crossDomainConflict||s.securityOrRightsConflict)return result('PRODUCT_INTEGRATION_CONFLICT','OWNER','Isolate the exact conflict; do not change frozen truth.');
 if(s.newCurriculumConstruct||s.unresolvedDuplicateProgression||s.curriculumRulesInsufficient)return result('CURRICULUM_RESEARCH_REQUIRED','#3','Create direct self-contained Curriculum exception packet; no open-ended Work research.');
 if(s.newPracticeSemantics||s.unresolvedEvidenceMapping||s.practiceRulesInsufficient)return result('PRACTICE_RESEARCH_REQUIRED','#2','Create direct self-contained Practice exception packet; no open-ended Work research.');
 assert.equal(s.frozenRulesSufficient,true,'Admission facts incomplete: obtain canonical evidence before reasoning.');
 assert.equal(s.precedentSufficient,true,'Missing applicable rule/precedent, not an automatic research license.');
 assert.ok(Array.isArray(s.evidence_refs)&&s.evidence_refs.length>0,'Require traceable rule/precedent references.');
 return result('ROUTINE_EXECUTION',null,'Use the governed module; lowest sufficient reasoning; preserve PASS outcomes.');
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(admit(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))),null,2));
