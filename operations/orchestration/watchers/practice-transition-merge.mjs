import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const same=(a,b)=>assert.deepEqual(a,b);
const readJson=s=>JSON.parse(s);
const allowedBatchFile=p=>/^docs\/content-pipeline\/registry\/batch-\d{2}-practice-preproduction\.json$/.test(p);
const clone=x=>JSON.parse(JSON.stringify(x));
const allowedOps=new Set(['AURAL_RECOGNITION','ACOUSTIC_DISCRIMINATION','TARGETED_DICTATION','ORDER_SEQUENCE','MEANING_PARAPHRASE','CORE_COMPREHENSION','INFERENCE_STANCE','SAME_AS_TARGET_OPERATOR','SAME_AS_COMPREHENSION_OPERATOR','ACOUSTIC_DISCRIMINATION_OR_COMPREHENSION_CONDITION']);
export function validate(s){
 const {policy:p,mainPipeline,candidatePipeline,mainArtifacts,candidateArtifacts,transition,files,pr,run,main,candidateDocs}=s;
 same(p.repository,'bttdavid1948-sudo/my-dictation-app');same(p.repository_id,1377742729);same(p.scope,'OFFICIAL_MAN_1000_ONLY');same(p.lane,'PRACTICE_2');
 assert.ok(pr.head.ref.startsWith(p.branch_prefix));same(pr.base.ref,'main');same(pr.base.repo.full_name,p.repository);same(pr.base.repo.id,p.repository_id);
 same(pr.state,'open');same(pr.draft,false);same(pr.user.login,'bttdavid1948-sudo');same(pr.head.sha,run.head_sha);same(run.conclusion,'success');same(run.event,'pull_request');
 const names=files.map(x=>x.filename).sort();assert.equal(new Set(names).size,names.length);
 const batchFiles=names.filter(allowedBatchFile);assert.equal(batchFiles.length,1);
 for(const name of names)assert.ok(p.allowed_changed_files.includes(name)||allowedBatchFile(name),'UNALLOWED_FILE '+name);
 same(mainPipeline.next_action.responsible_lane,'PRACTICE_2');same(mainPipeline.production_queue_enabled,false);
 for(const f of p.immutable_pipeline_fields)same(candidatePipeline[f],mainPipeline[f]);
 same(candidatePipeline.production_queue_enabled,false);same(candidatePipeline.next_action,transition.next_action);
 assert.ok(p.allowed_destination_lanes.includes(candidatePipeline.next_action.responsible_lane));
 same(transition.scope,'OFFICIAL_MAN_1000_ONLY');same(transition.owner_lane,'PRACTICE_2');same(transition.production_queue_enabled,false);same(transition.audio_created,false);same(transition.operations_work_performed,false);
 assert.ok(Array.isArray(transition.lessons)&&transition.lessons.length>0&&transition.lessons.length<=50);
 const ids=transition.lessons.map(x=>x.lesson_id);same(new Set(ids).size,ids.length);
 if(transition.status==='PASS'){
   same(candidatePipeline.next_action.responsible_lane,'OPERATIONS_4');assert.ok(/^PRODUCTION_READY_BATCH_\d{2}$/.test(candidatePipeline.next_action.code));
   same(transition.gate_summary.unique_purpose_pass,transition.lessons.length);same(transition.gate_summary.curriculum_ready,transition.lessons.length);same(transition.gate_summary.practice_preprod_ready,transition.lessons.length);same(transition.gate_summary.contract_precheck_valid,transition.lessons.length);same(transition.gate_summary.production_ready,transition.lessons.length);
   for(const x of transition.lessons){same(x.unique_purpose_pass,true);same(x.curriculum_ready,true);same(x.practice_preprod_ready,true);same(x.contract_precheck_valid,true);same(x.production_ready,true);same(x.practice_conflict,'NONE');assert.ok(allowedOps.has(x.comprehension_operator));assert.ok(allowedOps.has(x.speech_operator));}
 } else if(transition.status==='BLOCKED_CURRICULUM'){
   same(candidatePipeline.next_action.responsible_lane,'CURRICULUM_3');
 } else if(transition.status==='BLOCKED_OWNER'){
   same(candidatePipeline.next_action.responsible_lane,'OWNER');same(candidatePipeline.next_action.code,'OWNER_DECISION_REQUIRED');
 } else {
   same(candidatePipeline.next_action.responsible_lane,'PRACTICE_2');
 }
 same(transition.final_practice_ready_claimed,false);same(transition.produced_contract_valid_claimed,false);
 assert.ok(transition.source_refs.includes('practice-production-spec@v0.1'));assert.ok(transition.source_refs.includes('curriculum-practice-contract@v0.3'));assert.ok(transition.source_refs.includes('content-pipeline-contract@v0.2'));
 assert.equal(candidateArtifacts.artifacts.length,mainArtifacts.artifacts.length+1);
 const reindexable=new Set(['batch-01-completion-checkpoint','batch-01-autonomous-orchestration-readiness','batch-02-watcher-pilot']);
 for(let i=0;i<mainArtifacts.artifacts.length;i++){const before=clone(mainArtifacts.artifacts[i]),after=clone(candidateArtifacts.artifacts[i]);same(after.id,before.id);same(after.version,before.version);if(reindexable.has(before.id)){for(const k of ['sha256','size_bytes','next_action']){delete before[k];delete after[k];}same(after,before);}else same(after,before);}
 const added=candidateArtifacts.artifacts.at(-1);same(added.owner_lane,'PRACTICE_2');same(added.validation_status,'PRACTICE_VALIDATED');assert.ok(added.id.startsWith('batch-02-practice-preproduction'));same(added.location.store,'GitHub registry evidence');
 for(const [path,doc] of Object.entries(candidateDocs)){const base=clone(doc.__base),cand=clone(doc);delete base.next_action;delete cand.__base;delete cand.next_action;same(cand,base);same(doc.next_action,candidatePipeline.next_action);}
 return {decision:'PRACTICE_TRANSITION_ALLOWED',lesson_count:transition.lessons.length,next_action:candidatePipeline.next_action};
}
async function execute(){
 const repo='bttdavid1948-sudo/my-dictation-app',prefix=`https://api.github.com/repos/${repo}`;
 assert.equal(process.env.GITHUB_REPOSITORY,repo);assert.equal(process.env.GITHUB_EVENT_NAME,'workflow_run');
 const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),token=process.env.GH_TOKEN;assert.ok(token);
 const api=async(path,method='GET',body)=>{const response=await fetch(prefix+path,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},body:body===undefined?undefined:JSON.stringify(body)});if(!response.ok)throw Error(`GitHub ${method} ${path}: ${response.status}`);return response.json();};
 const file=async(path,ref)=>{const x=await api(`/contents/${path}?ref=${ref}`);assert.equal(x.type,'file');return Buffer.from(x.content,'base64').toString('utf8');};
 const p=JSON.parse(fs.readFileSync(new URL('./practice-transition-allowlist.v0.1.json',import.meta.url),'utf8'));
 const run=await api(`/actions/runs/${event.workflow_run.id}`);if(!run.head_branch.startsWith(p.branch_prefix)){console.log('NO_ACTION_OUTSIDE_PRACTICE_BRANCH');return;}
 assert.equal(run.pull_requests.length,1);const pr=await api(`/pulls/${run.pull_requests[0].number}`);if(pr.merged){console.log('ALREADY_APPLIED');return;}
 const main=(await api('/git/ref/heads/main')).object.sha;assert.equal(process.env.TRUSTED_MAIN,main);
 const files=await api(`/pulls/${pr.number}/files?per_page=100`);const batchPath=files.map(x=>x.filename).find(allowedBatchFile);assert.ok(batchPath);
 const [mainPipelineText,candidatePipelineText,mainArtifactsText,candidateArtifactsText,transitionText]=await Promise.all([
   file('docs/content-pipeline/registry/pipeline.json',main),file('docs/content-pipeline/registry/pipeline.json',pr.head.sha),file('docs/content-pipeline/registry/artifacts.json',main),file('docs/content-pipeline/registry/artifacts.json',pr.head.sha),file(batchPath,pr.head.sha)
 ]);
 const mirrors=['docs/content-pipeline/registry/batch-01-completion-checkpoint.json','docs/content-pipeline/registry/batch-01-readiness.json','docs/content-pipeline/registry/batch-01-autonomous-orchestration-readiness.json','docs/content-pipeline/registry/batch-02-watcher-pilot.json'];
 const candidateDocs={};for(const path of mirrors){const base=readJson(await file(path,main)),cand=readJson(await file(path,pr.head.sha));candidateDocs[path]={...cand,__base:base};}
 const audit=validate({policy:p,mainPipeline:readJson(mainPipelineText),candidatePipeline:readJson(candidatePipelineText),mainArtifacts:readJson(mainArtifactsText),candidateArtifacts:readJson(candidateArtifactsText),transition:readJson(transitionText),files,pr,run,main,candidateDocs});
 console.log(JSON.stringify(audit));assert.equal((await api('/git/ref/heads/main')).object.sha,main,'STALE_MAIN');same((await api(`/pulls/${pr.number}`)).head.sha,pr.head.sha);
 const result=await api(`/pulls/${pr.number}/merge`,'PUT',{sha:pr.head.sha,merge_method:'merge',commit_title:'Scoped official Mặn Practice transition',commit_message:JSON.stringify(audit)});
 assert.equal(result.merged,true);console.log(JSON.stringify({...audit,decision:'PASS_CANONICAL_PRACTICE_TRANSITION',merge_sha:result.sha}));
}
if(process.argv[1]===fileURLToPath(import.meta.url))execute().catch(e=>{console.error('FAIL_CLOSED: '+e.message);process.exitCode=1;});
