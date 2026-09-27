import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'registry', name), 'utf8'));
const allowed = new Set(['DRAFT','CANDIDATE','REVIEW_READY','FREEZE_READY','FROZEN','SUPERSEDED']);

export function validate(registry, pipeline, lessons) {
  const records = new Map();
  for (const a of registry.artifacts) {
    const key = `${a.id}@${a.version}`;
    if (records.has(key)) throw Error(`Duplicate artifact: ${key}`);
    if (!allowed.has(a.status)) throw Error(`Invalid status: ${key}`);
    if (!a.owner_lane || !a.name || !a.created_at || !a.updated_at ||
        !a.source?.length || !a.location?.path || !a.location?.store ||
        !/^[a-f0-9]{64}$/.test(a.sha256) || !Number.isSafeInteger(a.size_bytes))
      throw Error(`Incomplete registry entry: ${key}`);
    if (a.validation_status !== 'HASH_VERIFIED') throw Error(`Unverified artifact: ${key}`);
    records.set(key, a);
  }
  for (const a of registry.artifacts) {
    const key = `${a.id}@${a.version}`;
    for (const dep of a.dependencies) if (!records.has(dep)) throw Error(`Unknown dependency: ${key} → ${dep}`);
    if (a.supersedes && records.get(a.supersedes)?.superseded_by !== key)
      throw Error(`Broken supersedes relationship: ${key}`);
    if (a.superseded_by && records.get(a.superseded_by)?.supersedes !== key)
      throw Error(`Broken superseded_by relationship: ${key}`);
  }
  for (const [id, version] of Object.entries(registry.current)) {
    const a = records.get(`${id}@${version}`);
    if (!a || a.status === 'SUPERSEDED') throw Error(`Invalid current version: ${id}@${version}`);
  }
  const contract = records.get(pipeline.contract_ref);
  if (!contract || contract.status !== pipeline.contract_status) throw Error('Pipeline contract status mismatch');
  if (!records.get(pipeline.frozen_interface_ref) || records.get(pipeline.frozen_interface_ref).status !== 'FROZEN')
    throw Error('Frozen v0.3 interface missing');
  if (pipeline.contract_status !== 'FROZEN' && pipeline.production_queue_enabled)
    throw Error('Production queue cannot open before freeze');
  if (lessons.contract_ref !== pipeline.contract_ref || !Array.isArray(lessons.records))
    throw Error('Global lesson registry contract mismatch');
  if (pipeline.contract_status !== 'FROZEN' && lessons.records.length)
    throw Error('Do not populate lessons before pipeline freeze');
  const routes = new Set();
  for (const route of pipeline.routes) {
    if (routes.has(route.code) || !route.responsible_lane) throw Error(`Invalid route: ${route.code}`);
    routes.add(route.code);
  }
  for (const code of ['RETURN_TO_CURRICULUM','PRACTICE_CONFLICT','IMPLEMENTATION_ISSUE','OWNER_DECISION_REQUIRED','DUPLICATE'])
    if (!routes.has(code)) throw Error(`Missing route: ${code}`);
  return records;
}

export function verifyLocalArtifacts(registry, directory) {
  for (const a of registry.artifacts) {
    const file = path.join(directory, a.name);
    const bytes = fs.readFileSync(file);
    if (bytes.length !== a.size_bytes || createHash('sha256').update(bytes).digest('hex') !== a.sha256)
      throw Error(`Artifact checksum mismatch: ${a.id}@${a.version}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const registry = read('artifacts.json'), pipeline = read('pipeline.json'), lessons = read('lessons.json');
    const records = validate(registry,pipeline,lessons);
    const args = process.argv.slice(2), i = args.indexOf('--local-artifacts');
    if (i >= 0) {
      if (!args[i+1]) throw Error('Expected directory after --local-artifacts');
      verifyLocalArtifacts(registry,args[i+1]);
      args.splice(i,2);
    }
    if (args[0] === 'current') {
      const id = args[1], record = records.get(`${id}@${registry.current[id]}`);
      if (!record) throw Error(`Unknown current artifact: ${id}`);
      console.log(JSON.stringify(record,null,2));
    } else if (args[0] === 'route') {
      const route = pipeline.routes.find(x=>x.code===args[1]);
      if (!route) throw Error(`Unknown route: ${args[1]}`);
      console.log(JSON.stringify(route,null,2));
    } else if (args[0] === 'next' || !args.length) {
      console.log(JSON.stringify({contract_ref:pipeline.contract_ref,status:pipeline.contract_status,next_action:pipeline.next_action,lesson_count:lessons.records.length,artifacts:registry.artifacts.length,local_hashes_verified:i>=0},null,2));
    } else throw Error('Usage: validate.mjs [next|current ID|route CODE] [--local-artifacts DIR]');
  } catch (error) { console.error(error.message); process.exitCode=1; }
}
