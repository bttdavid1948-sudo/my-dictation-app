import assert from 'node:assert/strict';
import fs from 'node:fs';
import { harness, specs, lessons, evidence, NOW } from './practice-runtime-characterization.test.mjs';
const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const moduleURL = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const contractURL = moduleURL(read('assets/practice-runtime-contract.js'));
const { normalizePracticeLesson, canonicalPracticeJSON } = await import(contractURL);
const coreSource = read('assets/practice-runtime-core.js');
const { createPracticeCore } = await import(moduleURL(coreSource.replace("'./practice-runtime-contract.js'", JSON.stringify(contractURL))));
const clone = x => structuredClone(x);
assert.ok(!/MAN-\d{4}|Batch01|Batch02|batch01|batch02|schemaFamily|\.canonicalPractice\b/.test(coreSource), 'descriptor capabilities only; no ID/batch/raw-catalog dispatch');
assert.ok(!read('index.html').includes('practice-runtime-core.js'), 'extraction only, no routing cutover');
for (const u of lessons.filter(u => !u.practice)) {
  assert.equal(normalizePracticeLesson(u), null);
  assert.throws(() => createPracticeCore(null), /normalized descriptor/);
}
const fields = ['phase', 'fullPlays', 'fullEnded', 'assisted', 'answer', 'correct', 'responseAssisted'];
let traces = 0;
for (const u of lessons.filter(u => u.practice)) {
  // IDs here select the existing oracle, never the new runtime's dispatch.
  const spec = specs.find(s => s.ids.includes(u.id));
  const d = normalizePracticeLesson(u), before = canonicalPracticeJSON(d);
  for (const mode of ['first', 'wrong', 'speech-wrong', 'aliases', 'slow', 'fast', 'repeat', 'replay', 'slow-replay', 'repair', 'repair-wrong', 'stop', 'fail', 'navigate', 'pop', 'supersede', 'transcript', 'dictation-support']) {
    const h = harness(); h.c.xStartCatalog(u.id);
    if (mode.startsWith('repair')) {
      const rows = d.evidence.model === 'TASK_ROWS' ? [{ lesson_id: u.id, lesson_asset_version: u.version, attempt_index: 1 }] : [];
      h.c.localStorage.setItem(spec.history, JSON.stringify(rows)); h.c.xStartCatalog(u.id);
    }
    const initial = evidence(h, spec);
    const core = createPracticeCore(d, { instanceId: initial.instanceId, attemptIndex: initial.attemptIndex || 1 });
    const compare = () => {
      const actual = evidence(h, spec), extracted = core.snapshot();
      for (const f of fields) assert.equal(extracted[f], actual[f], `${u.id}/${mode}/${f}`);
      assert.equal(extracted.segmentReplays, actual[spec.counter], `${u.id}/${mode}/replays`);
    };
    compare();
    assert.throws(() => core.submit({ choice: d.comprehension.correctChoice, at: NOW }), /full end/);
    const rate = mode === 'slow' ? 0.7 : mode === 'fast' ? 1.2 : 1;
    h.find('rate-select').value = String(rate); h.click(spec.prefix + '-play');
    let plan = core.beginPlayback({ rate });
    assert.equal(plan.assets[0].sha256, h.audio[0].item.audio.sha256);
    compare();
    if (['stop', 'fail', 'navigate', 'pop', 'supersede'].includes(mode)) {
      const old = plan;
      if (mode === 'stop') { h.click(spec.prefix + '-stop'); core.stop(); }
      if (mode === 'fail') { h.audio[0].fail(); assert.equal(core.playbackFailed(plan.token), true); }
      if (mode === 'navigate') { h.c.xGo('catalog'); core.stop(); }
      if (mode === 'pop') { h.pop(); core.stop(); }
      if (mode === 'supersede') { h.click(spec.prefix + '-play'); plan = core.beginPlayback(); }
      if (mode !== 'fail') h.audio[0].end();
      assert.equal(core.assetEnded(old.token, 0), false);
      compare();
      if (mode !== 'supersede') { assert.equal(core.snapshot().fullEnded, false); continue; }
    }
    h.finish(); plan.assets.forEach((_, i) => assert.equal(core.assetEnded(plan.token, i), true));
    assert.equal(core.assetEnded(plan.token, 0), false, 'duplicate completion ignored');
    assert.deepEqual(plan.assets.map(a => a.sha256), h.audio.slice(mode === 'supersede' ? 1 : 0).map(a => a.item.audio.sha256)); compare();
    if (mode === 'repeat') {
      h.click(spec.prefix + '-play'); h.finish(); plan = core.beginPlayback();
      plan.assets.forEach((_, i) => core.assetEnded(plan.token, i)); compare();
    }
    if (mode === 'replay' || mode === 'slow-replay') {
      if (mode === 'slow-replay') h.find('rate-select').value = '0.5';
      h.click(spec.prefix + '-replay-' + u.items[0].segmentId); h.audio.at(-1).end();
      plan = core.beginPlayback({ segmentIndex: 0, rate: mode === 'slow-replay' ? 0.5 : 1 });
      assert.deepEqual(plan.assets, [u.items[0].audio]); core.assetEnded(plan.token, 0); compare();
    }
    if (mode === 'transcript') { h.c.items = clone(u.items); h.c.xSpeakTranscriptItem(0); core.noteSupport('transcript'); compare(); }
    if (mode === 'dictation-support') { h.c.items = clone(u.items); h.c.playAudio(); core.noteSupport('dictation'); compare(); }
    const choice = ['wrong', 'repair-wrong'].includes(mode) ? (d.comprehension.correctChoice + 1) % d.comprehension.choices.length : d.comprehension.correctChoice;
    const responses = d.speechTasks.map(t => mode === 'speech-wrong' ? 'not the answer' : mode === 'aliases' ? t.answer.toUpperCase().replace(/SIX/g, '6').replace(/FIFTEEN/g, '15').replace(/FIVE/g, '5') + '!' : t.answer);
    const form = h.find(spec.prefix + '-answer');
    form.all().find(e => e.type === 'radio' && Number(e.value) === choice).checked = true;
    responses.forEach((value, i) => { const el = h.find('man-b02-span-' + i); el.value = value; el.fire('input'); });
    form.fire('submit');
    const result = core.submit({ choice, speechResponses: responses, at: NOW }); compare();
    const legacy = evidence(h, spec);
    if (d.evidence.model === 'TASK_ROWS') assert.deepEqual(result, legacy.evidence, `${u.id}/${mode}/all evidence fields`);
    else {
      const row = JSON.parse(h.c.localStorage.getItem(spec.history)).at(-1);
      assert.deepEqual({ at: result.at, lessonId: result.lessonId, lessonVersion: result.lessonVersion, realizationId: result.realizationId, construct: result.construct, correct: result.correct, assisted: result.assisted, [spec.counter]: result.segmentReplays, calibrated: result.calibrated }, row);
      assert.equal(legacy.events.find(e => e.kind === spec.response).evidence, core.snapshot().responseAssisted ? 'ASSISTED' : d.evidence.initialChoiceSupport);
    }
    assert.throws(() => core.submit({ choice, speechResponses: responses, at: NOW }), /response phase/);
    h.click(spec.prefix + '-dictation'); core.enterDictation(); compare();
    const detached = core.snapshot(); detached.phase = 'tampered'; assert.equal(core.snapshot().phase, 'dictation');
    traces++;
  }
  assert.equal(canonicalPracticeJSON(d), before, 'descriptor never mutated');
  const core = createPracticeCore(d, { instanceId: 'test' });
  assert.equal(core.matchesResumeIdentity(clone(d.resumeIdentity)), true);
  for (const field of ['lessonId', 'lessonVersion', 'realizationId', 'realizationVersion', 'fingerprint']) assert.equal(core.matchesResumeIdentity({ ...d.resumeIdentity, [field]: 'stale' }), false);
  const fresh = clone(u); fresh.items[0].audio.sha256 = 'a'.repeat(64);
  const updated = createPracticeCore(normalizePracticeLesson(fresh), { instanceId: 'test' });
  assert.equal(updated.matchesResumeIdentity(d.resumeIdentity), false, 'bind to current canonical assets');
  const tampered = clone(d); tampered.comprehension.correctChoice = -1;
  assert.throws(() => createPracticeCore(tampered), /fingerprint/);
  assert.throws(() => core.beginPlayback({ segmentIndex: -1 }), /segment index/);
  assert.throws(() => core.beginPlayback({ rate: NaN }), /playback rate/);
  const plan = core.beginPlayback(); plan.assets.forEach((_, i) => core.assetEnded(plan.token, i));
  for (const bad of [{ choice: -1 }, { choice: 0.5 }, { speechResponses: ['extra', ...d.speechTasks.map(() => '')] }, { at: NaN }]) {
    const prior = core.snapshot();
    assert.throws(() => core.submit({ choice: d.comprehension.correctChoice, speechResponses: d.speechTasks.map(t => t.answer), at: NOW, ...bad }), /Invalid Practice core/);
    assert.deepEqual(core.snapshot(), prior, 'invalid response leaves state intact');
  }
  const badIdentity = clone(d); badIdentity.resumeIdentity.lessonVersion = 'stale';
  assert.throws(() => createPracticeCore(badIdentity), /resume identity/);
  // Renamed compatible data is accepted without changing code or a hash allowlist.
  const renamed = clone(u); renamed.id = 'UNSEEN'; renamed.audioRealizationRef = 'UNSEEN-REALIZATION';
  for (const a of [...renamed.items.map(i => i.audio), ...(renamed.fullPanelAudio ? [renamed.fullPanelAudio] : [])]) { a.lessonId = renamed.id; a.realizationId = renamed.audioRealizationRef; }
  assert.doesNotThrow(() => createPracticeCore(normalizePracticeLesson(renamed), { instanceId: 'test' }));
}
console.log(`Practice core differential PASS: 270 scenario traces (${traces} completed, 60 canceled/failed); all 15 Practice, 9 ordinary excluded, cancellation/support/repair/evidence/resume; no learner cutover`);
