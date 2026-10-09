import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildReadPack,admitReadPack,sha256,nonproductionActions} from './bootstrap.mjs';
export function testBootstrap(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'man-clean-bootstrap-'));
 const write=(p,c)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,c);return f;};
 const now=Date.parse('2026-10-09T12:00:00Z'),stamp=new Date(now).toISOString();
 const state={batchId:'BATCH_04',queue:'CLOSED',next_action:{code:'NONE'}};
 const gov={modules:{OPERATIONS_4:'operations/skills/man-production-control/SKILL.md'},module_sha256:{'operations/skills/man-production-control/SKILL.md':sha256('operator skill')}};
 const pipeline={current_state_index_ref:'index.json',current_state_ref:'close.json',active_batch_checkpoint_ref:'batch04.json'};
 for(const p of ['operations/orchestration/README.md','operations/orchestration/resolve.mjs','operations/orchestration/bootstrap.mjs','docs/content-pipeline/registry/artifacts.json','docs/content-pipeline/registry/official-1000-production-authority.json','index.json','close.json','batch04.json','precedent.md'])write(p,'current source');
 write('operations/skills/man-production-control/SKILL.md','operator skill');
 write('docs/content-pipeline/registry/pipeline.json',JSON.stringify(pipeline));
 write('docs/content-pipeline/registry/single-orchestrator-governance.json',JSON.stringify(gov));
 const externals=[['creator_os','CREATOR-OS-CANONICAL-MEMORY-v0.3.8-CURRENT-USE.md','v0.3.8'],['semantic_ledger','CREATOR-OS-SEMANTIC-LEDGER-v0.3.8.md','v0.3.8'],['operations_playbook','OPERATIONS-LEAD-ORCHESTRATOR-PLAYBOOK-v0.1.md','v0.1']].map(([role,name,version])=>({role,name,version,content_version:'fixture-revision',source_ref:'fixture:'+role,path:write(name,'full '+role),sha256:sha256('full '+role),observed_at:stamp}));
 const forbidden=['PRODUCTION_AUTH','PRODUCTION_RULES','APP_CHECK_ENFORCEMENT','IAM','BILLING_CHANGE','LEARNER_DELETE','LEARNER_MIGRATE','PRODUCTION_RESTORE','PAID_SYNTHESIS','LAUNCH','BATCH05','R1.4'];
 const e={scope_id:'clean-scope',scope_kind:'BOUNDED_NONPRODUCTION',objective:'Prepare authorized review',source_main:'a'.repeat(40),observed_main:'a'.repeat(40),observed_at:stamp,completion_channel:'durable objective receipt',requested_actions:nonproductionActions,domain_lanes:['OPERATIONS_4'],external_sources:externals,authority:{path:write('authority.txt','Owner directive'),sha256:sha256('Owner directive'),source_ref:'Owner explicit directive',allowed_actions:nonproductionActions,forbidden_actions:forbidden},precedent:{ref:'precedent.md',decision:'REUSE',invariant_comparison:'Equivalent nonproduction authority, no secrets/publication delta.'}};
 const build=(input=e,st=state)=>buildReadPack(input,{root,state:st,now});
 try{
  const pack=build();
  const ack={scope_id:e.scope_id,pack_sha256:pack.pack_sha256,read_at:stamp,read_sources:pack.sources.map(({role,sha256})=>({role,sha256})),reasoning:Object.fromEntries(['authority_boundary','canonical_over_os_case_study','precedent_first','retry_escalation','independent_progression'].map(x=>[x,'Fixture explicit disposition']))};
  assert.equal(admitReadPack(pack,ack,now).status,'SCOPE_ADMITTED');
  assert.equal(admitReadPack(pack,ack,now).production_opened,false);
  const mutations=[x=>delete x.authority,x=>x.authority.allowed_actions=[],x=>x.authority.forbidden_actions=[],x=>x.authority.sha256='bad',x=>x.source_main='b'.repeat(40),x=>x.observed_at='2020-01-01',x=>x.external_sources.pop(),x=>x.external_sources[0].name='stale-attached.md',x=>x.external_sources[0].content_version='',x=>x.external_sources[1].sha256='bad',x=>x.external_sources[2].observed_at='2020-01-01',x=>x.scope_kind='PRODUCTION',x=>x.requested_actions=['BILLING_CHANGE'],x=>x.requested_actions=[],x=>x.domain_lanes=['UNKNOWN'],x=>x.completion_channel='',x=>x.precedent.decision='NEW_METHOD',x=>x.precedent.invariant_comparison='',x=>x.precedent.decision='DIAGNOSE_DELTA'];
  for(const m of mutations){const input=structuredClone(e);m(input);assert.throws(()=>build(input));}
  for(const m of [x=>x.scope_id='another-scope',x=>x.pack_sha256='stale-pack',x=>x.read_sources.pop(),x=>x.read_at='2020-01-01',x=>x.reasoning.precedent_first='',x=>x.read_sources[0].sha256='bad']){const a=structuredClone(ack);m(a);assert.throws(()=>admitReadPack(pack,a,now));}
  assert.throws(()=>build(e,{...state,queue:'OPEN'}));
  write('operations/skills/man-production-control/SKILL.md','changed skill');assert.throws(()=>build());
  write('operations/skills/man-production-control/SKILL.md','operator skill');
  fs.unlinkSync(externals[0].path);assert.throws(()=>build());
  console.log('PASS: isolated clean-process bootstrap contract, full-source read pack + scope acknowledgement; 28 negative boundaries. Fixture test, not an AI-successor comprehension claim.');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
}
if(process.argv[1]?.endsWith('/bootstrap.test.mjs'))testBootstrap();
