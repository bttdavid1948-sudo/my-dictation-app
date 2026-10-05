import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const same=(a,b)=>assert.deepEqual(a,b);
const readJson=s=>JSON.parse(s);
const allowedBatchFile=p=>/^docs\/content-pipeline\/registry\/batch-\d{2}-curriculum-preproduction\.json$/.test(p);
const clone=x=>JSON.parse(JSON.stringify(x));
export function validate(s){
 const {policy:p,mainPipeline,candidatePipeline,mainArtifacts,candidateArtifacts,transition,files,pr,run,main,candidateDocs}=s;
 same(p.repository,'bttdavid1948-sudo/my-dictation-app');same(p.repository_id,1377742729);same(p.scope,'OFFICIAL_MAN_1000_ONLY');same(p.lane,'CURRICULUM_3');
 assert.ok(pr.head.ref.startsWith(p.branch_prefix));same(pr.base.ref,'main');same(pr.base.repo.full_name,p.repository);same(pr.base.repo.id,p.repository_id);
 same(pr.state,'open');same(pr.draft,false);same(pr.user.login,'bttdavid1948-sudo');same(pr.head.sha,run.head_sha);same(run.conclusion,'success');same(run.event,'pull_request');
 const names=files.map(x=>x.filename).sort();assert.equal(new Set(names).size,names.length);
 const batchFiles=names.filter(allowedBatchFile);assert.equal(batchFiles.length,1);
 for(const name of names)assert.ok(p.allowed_changed_files.includes(name)||allowedBatchFile(name),'UNALLOWED_FILE '+name);
 same(mainPipeline.next_action.responsible_lane,'CURRICULUM_3');same(mainPipeline.production_queue_enabled,false);
 for(const f of p.immutable_pipeline_fields)same(candidatePipeline[f],mainPipeline[f]);
 same(candidatePipeline.production_queue_enabled,false);
 same(candidatePipeline.next_action,transition.next_action);
 assert.ok(p.allowed_destination_lanes.includes(candidatePipeline.next_action.responsible_lane));
 if(transition.status==='PASS'){
   same(candidatePipeline.next_action.responsible_lane,'PRACTICE_2');
   assert.ok(/^PRACTICE_PREPRODUCTION_BATCH_\d{2}$/.test(candidatePipeline.next_action.code));
 } else if(transition.status==='BLOCKED_OWNER'){
   same(candidatePipeline.next_action.responsible_lane,'OWNER');same(candidatePipeline.next_action.code,'OWNER_DECISION_REQUIRED');
 } else {
   same(candidatePipeline.next_action.responsible_lane,'CURRICULUM_3');
 }
 same(transition.scope,'OFFICIAL_MAN_1000_ONLY');same(transition.owner_lane,'CURRICULUM_3');same(transition.production_queue_enabled,false);same(transition.audio_created,false);
 assert.ok(Array.isArray(transition.lessons)&&transition.lessons.length>0&&transition.lessons.length<=50);
 const ids=transition.lessons.map(x=>x.lesson_id);same(new Set(ids).size,ids.length);
 for(const x of transition.lessons){
   assert.ok(/^MAN-\d{4}$/.test(x.lesson_id));assert.ok(/^ULP-MAN-\d{4}$/.test(x.unique_purpose_id));
   assert.ok(['NEW','OVERLAP_JUSTIFIED'].includes(x.identity_class));same(x.unique_purpose_pass,true);same(x.curriculum_ready,true);same(x.conflict_status,'NONE');
   if(x.identity_class==='OVERLAP_JUSTIFIED'){same(x.overlap_reason_code,'SPIRAL_PROGRESSION');assert.ok(/^MAN-\d{4}$/.test(x.overlap_with_lesson_id));}
 }
 assert.ok(transition.source_refs.includes('global-lesson-registry-snapshot@v0.1'));
 assert.ok(transition.source_refs.includes('curriculum-production-spec@v0.1'));
 // Existing artifact history is immutable except exact reindex fields for authoritative registry evidence changed by this transition; candidate appends exactly one Curriculum artifact.
 assert.equal(candidateArtifacts.artifacts.length,mainArtifacts.artifacts.length+1);
 const reindexable=new Set(['batch-01-completion-checkpoint','batch-01-autonomous-orchestration-readiness','batch-02-watcher-pilot']);
 for(let i=0;i<mainArtifacts.artifacts.length;i++){
   const before=clone(mainArtifacts.artifacts[i]),after=clone(candidateArtifacts.artifacts[i]);same(after.id,before.id);same(after.version,before.version);
   if(reindexable.has(before.id)){for(const k of ['sha256','size_bytes','next_action']){delete before[k];delete after[k];}same(after,before);}
   else same(after,before);
 }
 const added=candidateArtifacts.artifacts.at(-1);same(added.owner_lane,'CURRICULUM_3');same(added.validation_status,'HASH_VERIFIED');assert.ok(added.id.startsWith('batch-02-curriculum-preproduction'));same(added.location.store,'ChatGPT Library (access controlled)');
 // Current-route mirrors may only change next_action plus explicitly documented passive-activation status fields.
 for(const [path,doc] of Object.entries(candidateDocs)){
   if(path.endsWith('batch-02-watcher-pilot.json')){same(doc.batch02_production_opened,false);same(doc.paid_audio_calls,0);same(doc.scope,'OFFICIAL_MAN_1000_ONLY');same(doc.next_action,candidatePipeline.next_action);}
   else {const base=clone(doc.__base);delete base.next_action;const cand=clone(doc);delete cand.__base;delete cand.next_action;same(cand,base);same(doc.next_action,candidatePipeline.next_action);}
 }
 return {decision:'CURRICULUM_TRANSITION_ALLOWED',lesson_count:transition.lessons.length,next_action:candidatePipeline.next_action};
}
async function execute(){
 const repo='bttdavid1948-sudo/my-dictation-app',prefix=`https://api.github.com/repos/${repo}`;
 assert.equal(process.env.GITHUB_REPOSITORY,repo);assert.equal(process.env.GITHUB_EVENT_NAME,'workflow_run');
 const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),token=process.env.GH_TOKEN;assert.ok(token);
 const api=async(path,method='GET',body)=>{const response=await fetch(prefix+path,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},body:body===undefined?undefined:JSON.stringify(body)});if(!response.ok)throw Error(`GitHub ${method} ${path}: ${response.status}`);return response.json();};
 const file=async(path,ref)=>{const x=await api(`/contents/${path}?ref=${ref}`);assert.equal(x.type,'file');return Buffer.from(x.content,'base64').toString('utf8');};
 const p=JSON.parse(fs.readFileSync(new URL('./curriculum-transition-allowlist.v0.1.json',import.meta.url),'utf8'));
 const run=await api(`/actions/runs/${event.workflow_run.id}`);if(!run.head_branch.startsWith(p.branch_prefix)){console.log('NO_ACTION_OUTSIDE_CURRICULUM_BRANCH');return;}
 assert.equal(run.pull_requests.length,1);const pr=await api(`/pulls/${run.pull_requests[0].number}`);if(pr.merged){console.log('ALREADY_APPLIED');return;}
 const main=(await api('/git/ref/heads/main')).object.sha;assert.equal(process.env.TRUSTED_MAIN,main);
 const files=await api(`/pulls/${pr.number}/files?per_page=100`);const batchPath=files.map(x=>x.filename).find(allowedBatchFile);assert.ok(batchPath);
 const [mainPipelineText,candidatePipelineText,mainArtifactsText,candidateArtifactsText,transitionText]=await Promise.all([
   file('docs/content-pipeline/registry/pipeline.json',main),file('docs/content-pipeline/registry/pipeline.json',pr.head.sha),
   file('docs/content-pipeline/registry/artifacts.json',main),file('docs/content-pipeline/registry/artifacts.json',pr.head.sha),file(batchPath,pr.head.sha)
 ]);
 const mirrors=['docs/content-pipeline/registry/batch-01-completion-checkpoint.json','docs/content-pipeline/registry/batch-01-readiness.json','docs/content-pipeline/registry/batch-01-autonomous-orchestration-readiness.json','docs/content-pipeline/registry/batch-02-watcher-pilot.json'];
 const candidateDocs={};for(const path of mirrors){const base=readJson(await file(path,main)),cand=readJson(await file(path,pr.head.sha));candidateDocs[path]={...cand,__base:base};}
 const audit=validate({policy:p,mainPipeline:readJson(mainPipelineText),candidatePipeline:readJson(candidatePipelineText),mainArtifacts:readJson(mainArtifactsText),candidateArtifacts:readJson(candidateArtifactsText),transition:readJson(transitionText),files,pr,run,main,candidateDocs});
 console.log(JSON.stringify(audit));assert.equal((await api('/git/ref/heads/main')).object.sha,main,'STALE_MAIN');same((await api(`/pulls/${pr.number}`)).head.sha,pr.head.sha);
 const result=await api(`/pulls/${pr.number}/merge`,'PUT',{sha:pr.head.sha,merge_method:'merge',commit_title:'Scoped official Mặn Curriculum transition',commit_message:JSON.stringify(audit)});
 assert.equal(result.merged,true);console.log(JSON.stringify({...audit,decision:'PASS_CANONICAL_CURRICULUM_TRANSITION',merge_sha:result.sha}));
}
if(process.argv[1]===fileURLToPath(import.meta.url))execute().catch(e=>{console.error('FAIL_CLOSED: '+e.message);process.exitCode=1;});
