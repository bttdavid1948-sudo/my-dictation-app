import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const digest=s=>createHash('sha256').update(s).digest('hex');
const exact=(actual,expected)=>assert.deepEqual(actual,expected);
// Only data is read from a PR. No head checkout, imports, artifact downloads or shell evaluation.
export function validate(s){
 const {policy:p,pr,run,receipt:r,main,commit,files,inputs}=s;
 exact(p.repository,'bttdavid1948-sudo/my-dictation-app');exact(p.repository_id,1377742729);
 exact(p.scope,'OFFICIAL_MAN_1000_ONLY');exact(p.lane,'OPERATIONS_4');
 exact(p.branch,'ops/watcher-activation-probe-v0.2');exact(p.probe_id,'activation-probe-v0.2');
 exact(p.receipt_path,'operations/orchestration/watchers/receipts/activation-probe-v0.2.json');
 exact(p.allowed_transition,'ABSENT_TO_VALIDATED_HARMLESS_RECEIPT_ONLY');
 for(const k of ['production_enabled','semantic_transitions_enabled','spending_authority_changed','arbitrary_watcher_named_prs_allowed'])exact(p[k],false);
 exact(pr.state,'open');exact(pr.draft,false);exact(pr.user.login,p.author);
 exact(pr.base.ref,'main');exact(pr.base.repo.full_name,p.repository);exact(pr.base.repo.id,p.repository_id);
 exact(pr.head.repo.full_name,p.repository);exact(pr.head.repo.id,p.repository_id);exact(pr.head.ref,p.branch);
 exact(pr.head.sha,run.head_sha);exact(run.head_branch,p.branch);exact(run.event,'pull_request');
 exact(run.status,'completed');exact(run.conclusion,'success');exact(run.path,p.ci_workflow);
 exact(run.repository.full_name,p.repository);exact(run.head_repository.id,p.repository_id);
 assert.ok(run.pull_requests.some(x=>x.number===pr.number));
 exact(pr.changed_files,1);exact(files.length,1);exact(files[0].filename,p.receipt_path);exact(files[0].status,'added');
 exact(files[0].deletions,0);exact(commit.parents.map(x=>x.sha),[main]);
 exact(s.receiptType,'file');assert.ok(s.receiptBytes>0&&s.receiptBytes<=4096);
 const pipeline=JSON.parse(inputs[p.inputs[0]]),authority=JSON.parse(inputs[p.inputs[1]]),pilot=JSON.parse(inputs[p.inputs[2]]),close=JSON.parse(inputs[p.inputs[3]]);
 exact(pipeline.next_action.responsible_lane,p.lane);exact(pipeline.next_action.code,'BLOCKED_AUTOMATION_MERGE_AUTHORITY_PROPAGATION');
 exact(pipeline.production_queue_enabled,false);exact(pipeline.contract_status,'FROZEN');
 exact(pipeline.contract_ref,'content-pipeline-contract@v0.2');exact(pipeline.frozen_interface_ref,'curriculum-practice-contract@v0.3');
 exact(authority.scope,{product:'MAN',content:'OFFICIAL_ONLY',reserved_lesson_count:1000,excluded:['Private/user lessons','Product B production','General orchestration framework','Non-audio spend','New provider/billing architecture']});
 exact(authority.passive_activation.authorized,true);exact(authority.passive_activation.cross_lane_semantic_override,false);exact(authority.passive_activation.l5_owner_decisions_automated,false);
 exact(authority.audio_spend.auto_top_up,false);exact(authority.audio_spend.new_billing_commitment,false);exact(authority.audio_spend.change_provider_or_billing_architecture,false);
 exact(pilot.scope,p.scope);exact(pilot.batch02_production_opened,false);exact(pilot.status,'BLOCKED_AUTOMATION_MERGE_AUTHORITY_PROPAGATION');
 exact(close.status,'BATCH_01_COMPLETE_12_OF_12');exact(close.complete_lesson_count,12);exact(close.batch_close_complete,true);
 const hashes=Object.fromEntries(p.inputs.map(path=>[path,digest(inputs[path])]));
 const expected={schema_version:'1.0',probe_id:p.probe_id,status:'VALIDATED_HARMLESS_RECEIPT',scope:p.scope,responsible_lane:p.lane,repository:p.repository,source_main:main,canonical_next_action:{code:pipeline.next_action.code,responsible_lane:p.lane},input_sha256:hashes,batch01_complete_count:12,batch02_production_opened:false,paid_calls:0,semantic_dispositions_performed:false,passed_gates_rerun:false,policy_id:p.policy_id,wake_pr:r.wake_pr,checked_at:r.checked_at};
 assert.ok(Number.isSafeInteger(r.wake_pr)&&r.wake_pr>110);assert.ok(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(r.checked_at));
 assert.ok(Number.isFinite(Date.parse(r.checked_at)));exact(r,expected);
 exact(s.wake.merged,true);exact(s.wake.merge_commit_sha,main);exact(s.wake.base.ref,'main');exact(s.wake.base.repo.id,p.repository_id);
 return {decision:'SCOPED_RECEIPT_MERGE_ALLOWED',repository:p.repository,pr:pr.number,head:pr.head.sha,source_main:main,receipt_path:p.receipt_path,receipt_sha256:digest(s.receiptText),ci_run:run.id,policy_id:p.policy_id};
}
async function execute(){
 const repo='bttdavid1948-sudo/my-dictation-app',prefix=`https://api.github.com/repos/${repo}`;
 assert.equal(process.env.GITHUB_REPOSITORY,repo);assert.equal(process.env.GITHUB_EVENT_NAME,'workflow_run');
 const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),token=process.env.GH_TOKEN;
 assert.ok(token);const api=async(path,method='GET',body)=>{const response=await fetch(prefix+path,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},body:body===undefined?undefined:JSON.stringify(body)});if(response.status===404)return null;if(!response.ok)throw Error(`GitHub ${method} ${path}: ${response.status}`);return response.json();};
 const file=async(path,ref)=>{const x=await api(`/contents/${path}?ref=${ref}`);if(!x)return null;assert.equal(x.type,'file');assert.equal(x.encoding,'base64');return {...x,text:Buffer.from(x.content,'base64').toString('utf8')};};
 const p=JSON.parse(fs.readFileSync(new URL('./scoped-merge-policy.v0.1.json',import.meta.url),'utf8'));
 const run=await api(`/actions/runs/${event.workflow_run.id}`);
 if(run.head_branch!==p.branch){console.log('NO_ACTION_OUTSIDE_APPROVED_BRANCH');return;}
 assert.equal(run.pull_requests.length,1);const pr=await api(`/pulls/${run.pull_requests[0].number}`);
 const main=(await api('/git/ref/heads/main')).object.sha;
 const existing=await file(p.receipt_path,main);
 if(pr.merged){assert.ok(existing);assert.equal(existing.sha,(await file(p.receipt_path,pr.head.sha)).sha);console.log('ALREADY_APPLIED');return;}
 assert.equal(existing,null,'Receipt already exists: no overwrite or repeat merge');
 const files=await api(`/pulls/${pr.number}/files?per_page=100`),candidate=await file(p.receipt_path,pr.head.sha);assert.ok(candidate);
 const inputs={};for(const path of p.inputs){const x=await file(path,main);assert.ok(x);inputs[path]=x.text;}
 // Trusted checkout must still be exactly current main; policy/script cannot be supplied by candidate.
 assert.equal(process.env.TRUSTED_MAIN,main);exact(JSON.parse(inputs[p.inputs[5]]),p);
 const receipt=JSON.parse(candidate.text),wake=await api(`/pulls/${receipt.wake_pr}`);
 const snapshot={policy:p,pr,run,receipt,main,files,inputs,wake,commit:await api(`/commits/${pr.head.sha}`),receiptType:candidate.type,receiptBytes:candidate.size,receiptText:candidate.text};
 const audit=validate(snapshot);console.log(JSON.stringify(audit));
 // Reconcile source, candidate and successful CI again immediately before exact-head merge.
 assert.equal((await api('/git/ref/heads/main')).object.sha,main,'STALE_MAIN');
 exact((await api(`/pulls/${pr.number}`)).head.sha,pr.head.sha);exact((await api(`/actions/runs/${run.id}`)).conclusion,'success');
 const result=await api(`/pulls/${pr.number}/merge`,'PUT',{sha:pr.head.sha,merge_method:'merge',commit_title:`Scoped official Mặn receipt ${p.probe_id}`,commit_message:JSON.stringify(audit)});
 assert.equal(result.merged,true);const saved=await file(p.receipt_path,result.sha);exact(saved.sha,candidate.sha);
 console.log(JSON.stringify({...audit,decision:'PASS_CANONICAL_RECEIPT_OBSERVED',merge_sha:result.sha}));
}
if(process.argv[1]===fileURLToPath(import.meta.url))execute().catch(e=>{console.error('FAIL_CLOSED: '+e.message);process.exitCode=1;});
