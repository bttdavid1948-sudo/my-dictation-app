import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const requiredExternal = {
  creator_os: ['CREATOR-OS-CANONICAL-MEMORY-v0.3.8-CURRENT-USE.md', 'v0.3.8'],
  semantic_ledger: ['CREATOR-OS-SEMANTIC-LEDGER-v0.3.8.md', 'v0.3.8'],
  operations_playbook: ['OPERATIONS-LEAD-ORCHESTRATOR-PLAYBOOK-v0.1.md', 'v0.1']
};
export const nonproductionActions = ['READ_CANONICAL','PREPARE_REVIEW_DIFF','LOCAL_TEST','PROTECTED_PR','PROTECTED_EXACT_HEAD_MERGE'];
const prohibited = ['PRODUCTION_AUTH','PRODUCTION_RULES','APP_CHECK_ENFORCEMENT','IAM','BILLING_CHANGE','LEARNER_DELETE','LEARNER_MIGRATE','PRODUCTION_RESTORE','PAID_SYNTHESIS','LAUNCH','BATCH05','R1.4'];
const ensure = (test, message) => assert.ok(test, 'BOOTSTRAP_FAIL_CLOSED: '+message);
const nonempty = x => typeof x === 'string' && x.trim().length > 0;
function recent(value, now) {
  const delta = now - Date.parse(value);
  return Number.isFinite(delta) && delta >= 0 && delta <= 60*60*1000;
}

// Read from freshly resolved authoritative sources; never bundle a second OS copy.
// The envelope is operator evidence, NOT a credential or a new authority grant.
export function buildReadPack(envelope, {root, state, now = Date.now()}) {
  const e = envelope;
  ensure(nonempty(e.objective) && nonempty(e.scope_id), 'objective/scope missing');
  ensure(/^[a-f0-9]{40}$/.test(e.source_main) && e.source_main === e.observed_main, 'canonical main changed');
  ensure(recent(e.observed_at, now), 'canonical observation stale; re-resolve');
  ensure(e.scope_kind === 'BOUNDED_NONPRODUCTION', 'this bounded admission does not open production');
  ensure(state.batchId === 'BATCH_04' && state.queue === 'CLOSED' && state.next_action.code === 'NONE', 'production closure changed');
  ensure(nonempty(e.completion_channel), 'durable completion channel missing');
  ensure(Array.isArray(e.requested_actions) && e.requested_actions.length > 0, 'requested action missing');
  ensure(e.requested_actions.every(x => nonproductionActions.includes(x)), 'action requires separate production authority');
  ensure(e.authority && nonempty(e.authority.source_ref), 'authority source missing');
  ensure(e.authority.allowed_actions?.length && e.requested_actions.every(x=>e.authority.allowed_actions.includes(x)), 'authority does not cover exact action');
  ensure(prohibited.every(x=>e.authority.forbidden_actions?.includes(x)), 'bounded restrictions missing');
  const sources=[];
  const load = (role, filename, meta={}) => {
    const content = fs.readFileSync(filename, 'utf8');
    ensure(content.trim().length > 0, 'empty mandatory source: '+role);
    sources.push({role, ...meta, sha256:sha256(Buffer.from(content)), content});
  };
  ensure(Array.isArray(e.external_sources) && e.external_sources.length===3, 'three mandatory OS sources required');
  for (const [role,[name,version]] of Object.entries(requiredExternal)) {
    const found=e.external_sources.filter(x=>x.role===role);
    ensure(found.length===1, 'missing/ambiguous source: '+role);
    const s=found[0];
    ensure(s.name===name && s.version===version && nonempty(s.source_ref) && nonempty(s.content_version), 'wrong current source/version: '+role);
    ensure(recent(s.observed_at,now), 'external source not freshly resolved: '+role);
    load(role,s.path,{name:s.name,version:s.version,content_version:s.content_version,source_ref:s.source_ref,observed_at:s.observed_at});
    ensure(sources.at(-1).sha256===s.sha256, 'external source bytes changed: '+role);
  }
  const repoRead = p => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  const pipeline=repoRead('docs/content-pipeline/registry/pipeline.json');
  const governance=repoRead('docs/content-pipeline/registry/single-orchestrator-governance.json');
  ensure(Array.isArray(e.domain_lanes) && e.domain_lanes.includes('OPERATIONS_4') && e.domain_lanes.every(x=>x in governance.modules), 'unknown/missing owning Skill');
  const refs=['operations/orchestration/README.md','operations/orchestration/resolve.mjs','operations/orchestration/bootstrap.mjs','docs/content-pipeline/registry/pipeline.json','docs/content-pipeline/registry/artifacts.json','docs/content-pipeline/registry/official-1000-production-authority.json','docs/content-pipeline/registry/single-orchestrator-governance.json',pipeline.current_state_index_ref,pipeline.current_state_ref,pipeline.active_batch_checkpoint_ref];
  for (const lane of e.domain_lanes) refs.push(governance.modules[lane]);
  for (const ref of [...new Set(refs)]) {
    ensure(nonempty(ref) && !path.isAbsolute(ref) && !ref.split('/').includes('..'), 'unsafe canonical pointer');
    load(ref,path.join(root,ref),{source_ref:'worktree-on-base:'+e.source_main+':'+ref,version:'CONTENT_HASH_BOUND'});
    if(ref in governance.module_sha256) ensure(sources.at(-1).sha256===governance.module_sha256[ref], 'Skill hash mismatch');
  }
  load('objective_authority',e.authority.path,{source_ref:e.authority.source_ref,version:e.scope_id});
  ensure(sources.at(-1).sha256===e.authority.sha256, 'authority bytes changed');
  ensure(e.precedent && nonempty(e.precedent.ref) && ['REUSE','DIAGNOSE_DELTA','NO_APPLICABLE_PRECEDENT'].includes(e.precedent.decision), 'precedent disposition missing');
  ensure(nonempty(e.precedent.invariant_comparison), 'material invariant comparison missing');
  if(e.precedent.decision!=='REUSE') ensure(nonempty(e.precedent.delta_evidence), 'departure from proven path needs evidence');
  load('precedent',path.join(root,e.precedent.ref),{source_ref:'worktree-on-base:'+e.source_main+':'+e.precedent.ref,version:'CONTENT_HASH_BOUND'});
  const manifest=sources.map(({content,...meta})=>meta);
  const binding={scope_id:e.scope_id,objective:e.objective,source_main:e.source_main,completion_channel:e.completion_channel,requested_actions:e.requested_actions,authority:e.authority.sha256,precedent:e.precedent,manifest};
  return {status:'READ_REQUIRED',...binding,pack_sha256:sha256(JSON.stringify(binding)),sources,canonical:{batchId:state.batchId,queue:state.queue,next_action:state.next_action},nonclaim:'Read-pack creation is not operator comprehension, production authority, CI PASS or execution completion.'};
}

export function admitReadPack(pack, ack, now=Date.now()) {
  ensure(ack?.scope_id===pack.scope_id && ack.pack_sha256===pack.pack_sha256, 'read acknowledgement belongs to another scope/source');
  ensure(recent(ack.read_at,now), 'read acknowledgement stale');
  ensure(Array.isArray(ack.read_sources) && ack.read_sources.length===pack.sources.length, 'mandatory source was not read');
  for (const s of pack.sources) ensure(ack.read_sources.filter(x=>x.role===s.role && x.sha256===s.sha256).length===1, 'unread/changed source: '+s.role);
  for (const key of ['authority_boundary','canonical_over_os_case_study','precedent_first','retry_escalation','independent_progression']) ensure(nonempty(ack.reasoning?.[key]), 'operator disposition missing: '+key);
  return {status:'SCOPE_ADMITTED',scope_id:pack.scope_id,source_main:pack.source_main,pack_sha256:pack.pack_sha256,read_at:ack.read_at,source_manifest:pack.manifest,requested_actions:pack.requested_actions,completion_channel:pack.completion_channel,production_opened:false,nonclaim:'Operator acknowledgement is accountable evidence, not proof of human/AI comprehension or authorization inferred from tool permissions. Rebuild before a new scope, source change, PR or merge.'};
}
