import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const project='my-dictation-project-4381e';
const prefix=`projects/${project}/databases/(default)/documents/owner_feedback/`;
export const digest=value=>createHash('sha256').update(value).digest('hex');
const required=['lessonId','lessonVersion','segmentId','realizationId','realizationVersion','profileRef','assetSha256','deliveryMode','userAgent','viewport','playbackRate','playbackState','currentTime'];
const stable=value=>JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))));
const timestamp=value=>typeof value==='string'&&/^\d{4}-\d\d-\d\dT/.test(value)&&Number.isFinite(Date.parse(value));

export function validateManifest(manifest) {
  if(manifest.project!==project||manifest.database!=='(default)'||manifest.collection!=='owner_feedback'||manifest.read_only!==true)
    throw Error('INVALID_FIXED_TARGET');
  if(!Array.isArray(manifest.records)||!manifest.records.length||manifest.records.length>20)throw Error('INVALID_RECORD_COUNT');
  const ids=new Set();
  for(const r of manifest.records){
    if(!/^[A-Za-z0-9]{20}$/.test(r.document_id)||ids.has(r.document_id))throw Error('INVALID_OR_DUPLICATE_RECORD_ID');
    ids.add(r.document_id);
    if(!['desktop','mobile'].includes(r.platform)||!r.expected_context||required.some(k=>!(k in r.expected_context)))throw Error('INCOMPLETE_EXPECTATION');
    const c=r.expected_context;
    if(!/^MAN-\d{4}$/.test(c.lessonId)||c.lessonVersion!=='v0.1'||c.realizationId!==`${c.lessonId}-OPENAI-FIXED-v0.2`||c.realizationVersion!=='v0.2'||c.deliveryMode!=='PERSISTED_ASSET'||!/^S\d{3}$/.test(c.segmentId)||!/^[a-f0-9]{64}$/.test(c.assetSha256))throw Error('INVALID_EXACT_PAIR');
  }
  return manifest;
}

export function assessDocument(document,expected){
  const failures=[];
  if(document.name!==prefix+expected.document_id)failures.push('DOCUMENT_NAME_MISMATCH');
  const fields=document.fields||{};
  if(fields.page?.stringValue!=='audio'||fields.kind?.stringValue!=='Báo bug')failures.push('WRONG_FEEDBACK_TYPE');
  if(!timestamp(fields.createdAt?.timestampValue)||!timestamp(document.createTime)||!timestamp(document.updateTime))failures.push('SERVER_TIMESTAMP_MISSING');
  let report;
  try{report=JSON.parse(fields.message?.stringValue);}catch{failures.push('MALFORMED_AUDIO_REPORT');}
  if(report){
    if(report.type!=='audio_problem'||report.schemaVersion!==1||report.category!=='Vấn đề khác'||!/^OPERATIONS_(DESKTOP|MOBILE)_SMOKE_TEST/.test(report.note||''))failures.push('WRONG_SMOKE_REPORT');
    if(!report.context||stable(report.context)!==stable(expected.expected_context))failures.push('EXACT_CONTEXT_MISMATCH');
  }
  return {failures,created_at:fields.createdAt?.timestampValue||null,create_time:document.createTime||null,update_time:document.updateTime||null,context_sha256:report?.context?digest(stable(report.context)):null};
}

export async function verify(manifest,token,transport=fetch){
  validateManifest(manifest);
  if(!token||/[\r\n]/.test(token))throw Error('AUTHORIZED_SHORT_LIVED_TOKEN_REQUIRED');
  const results=[];
  for(const r of manifest.records){
    const base={lesson_id:r.expected_context.lessonId,lesson_asset_version:r.expected_context.lessonVersion,realization_id:r.expected_context.realizationId,platform:r.platform,document_id_sha256:digest(r.document_id),expected_context_sha256:digest(stable(r.expected_context))};
    try{
      const response=await transport(`https://firestore.googleapis.com/v1/${prefix}${r.document_id}`,{method:'GET',redirect:'error',headers:{Authorization:`Bearer ${token}`,'X-Goog-Request-Reason':'man-exact-retained-smoke-feedback-verification'},signal:AbortSignal.timeout(15000)});
      if(response.status!==200){results.push({...base,status:'PENDING',http_status:response.status,reason:response.status===404?'RETAINED_RECORD_NOT_FOUND':'AUTHORIZED_READ_UNAVAILABLE'});continue;}
      const text=await response.text();
      if(text.length>32768)throw Error('RESPONSE_TOO_LARGE');
      const assessed=assessDocument(JSON.parse(text),r);
      results.push({...base,status:assessed.failures.length?'FAIL':'PASS',http_status:200,server_response_sha256:digest(text),...assessed});
    }catch{results.push({...base,status:'PENDING',reason:'READ_OR_DECODE_UNAVAILABLE'});}
  }
  const lessonIds=[...new Set(results.map(r=>r.lesson_id))];
  return {schema_version:'1.0',method:'FIRESTORE_IAM_AUTHENTICATED_EXACT_DOCUMENT_GET',project,database:'(default)',collection:'owner_feedback',verified_at:new Date().toISOString(),read_only:true,collection_list_requests:0,write_requests:0,results,pairs:lessonIds.map(id=>{const rows=results.filter(r=>r.lesson_id===id);return {lesson_id:id,status:rows.length===2&&rows.some(r=>r.platform==='desktop')&&rows.some(r=>r.platform==='mobile')&&rows.every(r=>r.status==='PASS')?'PASS':'PENDING',retained_records:rows.length};}),raw_feedback_persisted:false,credential_persisted:false};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const [manifestPath,outputPath]=process.argv.slice(2);
    if(!manifestPath||!outputPath)throw Error('MANIFEST_AND_RECEIPT_PATH_REQUIRED');
    const bytes=await readFile(manifestPath);
    if(!/^[a-f0-9]{64}$/.test(process.env.MAN_FEEDBACK_MANIFEST_SHA256||'')||digest(bytes)!==process.env.MAN_FEEDBACK_MANIFEST_SHA256)throw Error('MANIFEST_COMMITMENT_MISMATCH');
    const report=await verify(JSON.parse(bytes),process.env.MAN_FIRESTORE_READ_TOKEN);
    report.manifest_sha256=digest(bytes);report.execution='LIVE_REST_GET';
    await writeFile(outputPath,JSON.stringify(report,null,2)+'\n',{mode:0o600});
    console.log(JSON.stringify({records:report.results.length,pass:report.results.filter(r=>r.status==='PASS').length,pairs_pass:report.pairs.filter(r=>r.status==='PASS').length,receipt_sha256:digest(JSON.stringify(report,null,2)+'\n')}));
    if(report.results.some(r=>r.status!=='PASS'))process.exitCode=2;
  }catch{console.error('FEEDBACK_VERIFICATION_BLOCKED; no credentials or raw documents logged');process.exitCode=1;}
}
