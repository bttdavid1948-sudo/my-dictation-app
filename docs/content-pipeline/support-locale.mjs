import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'registry',name),'utf8'));
export function validateSupportRegistry(registry,lessons){
  if(registry.schema_version!=='1.0'||!Array.isArray(registry.records))throw Error('Invalid support registry');
  const ids=new Set(), lessonIds=new Set(lessons.records.map(x=>x.lesson_id));
  for(const row of registry.records){
    const key=`${row.bundle_id}@${row.bundle_version}`;
    if(ids.has(key))throw Error(`Duplicate support bundle: ${key}`);
    ids.add(key);
    if(!lessonIds.has(row.lesson_id))throw Error(`Unknown support lesson: ${row.lesson_id}`);
    if(!row.canonical_lesson_asset_version||!row.support_locale||!row.content_ref||!['FULL','PARTIAL'].includes(row.coverage)||!['PENDING','PASS','FAIL'].includes(row.qa_status))throw Error(`Invalid support bundle: ${key}`);
  }
  for(const lesson of lessons.records)for(const ref of lesson.support_bundle_refs||[]){
    if(!ids.has(ref))throw Error(`Missing support bundle ref: ${ref}`);
    const bundle=registry.records.find(x=>`${x.bundle_id}@${x.bundle_version}`===ref);
    if(bundle.lesson_id!==lesson.lesson_id)throw Error(`Support bundle lesson mismatch: ${ref}`);
  }
}
export function canPublishOfficialV1(lesson,registry,policy){
  const rule=policy.official_v1.publication_requires;
  return policy.official_v1.required_support_locales.every(locale=>registry.records.some(b=>
    b.lesson_id===lesson.lesson_id && b.support_locale===locale &&
    (!rule.canonical_lesson_asset_version_match||b.canonical_lesson_asset_version===lesson.lesson_asset_version) &&
    b.coverage===rule.coverage && b.qa_status===rule.qa_status &&
    (lesson.support_bundle_refs||[]).includes(`${b.bundle_id}@${b.bundle_version}`)));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const lessons=read('lessons.json'), bundles=read('support-bundles.json'), policy=read('support-locale-policy.json');
  validateSupportRegistry(bundles,lessons);
  if(policy.official_v1.default_support_locale!=='vi-VN'||!policy.official_v1.required_support_locales.includes('vi-VN'))throw Error('V1 Vietnamese support policy missing');
  console.log(JSON.stringify({support_bundle_count:bundles.records.length,lesson_count:lessons.records.length,default_locale:policy.official_v1.default_support_locale,valid:true}));
}
