import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {validateRuntimeEvidence} from './browser-voice-certification.mjs';

const path=process.argv[2];
if (!path) {
  console.error('Usage: node browser-voice-certification-cli.mjs evidence.json');
  process.exitCode=2;
} else {
  try {
    const bytes=fs.readFileSync(path), evidence=JSON.parse(bytes);
    const outcome=validateRuntimeEvidence(evidence);
    const report={schema_version:'1.0',fixture_set_ref:`${evidence.fixture_set_id}@${evidence.fixture_set_version}`,
      evidence_sha256:createHash('sha256').update(bytes).digest('hex'),
      result:outcome.status, reason:outcome.reason||null,
      certified_runtime:outcome.status==='CAPABILITY_QA_PASS'?evidence.runtime:null,
      scope:outcome.status==='CAPABILITY_QA_PASS'?'LOW_STAKES_PRACTICE':null,
      lesson_audio_realizations_created:0, practice_ready:false,
      note:'Reviewer evidence requires governance review. This CLI does not issue a realization_id or certify exception lessons.'};
    console.log(JSON.stringify(report,null,2));
    if (outcome.status!=='CAPABILITY_QA_PASS') process.exitCode=1;
  } catch (error) {console.error(error.message);process.exitCode=2}
}
