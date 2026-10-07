import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const source = read('assets/practice-runtime-contract.js');
const { normalizePracticeLesson: normalize, matchesPracticeResume: matches, canonicalPracticeJSON: stable } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const clone = x => structuredClone(x);
const paths = ['official-lessons.json', 'official-lessons-batch01-exceptions.json', 'official-lessons-man0844.json', 'official-lessons-final-two.json', 'official-lessons-batch02.json'];
const lessons = paths.flatMap(p => JSON.parse(read('assets/' + p)).lessons).filter(u => u.status === 'published');
const practice = lessons.filter(u => u.practice), ordinary = lessons.filter(u => !u.practice);
assert.equal(practice.length, 15); assert.equal(ordinary.length, 9);
assert.ok(!read('index.html').includes('practice-runtime-contract.js'), 'no learner loading/cutover');
assert.ok(!/MAN-\d{4}|Batch01|Batch02|batch01|batch02/.test(source), 'no lesson/batch routing or hashes');
const reverseKeys = x => Array.isArray(x) ? x.map(reverseKeys) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).reverse().map(([k, v]) => [k, reverseKeys(v)])) : x;
for (const u of ordinary) assert.equal(normalize(u), null);
for (const u of practice) {
  const before = stable(u), d = normalize(u);
  assert.equal(stable(u), before, 'pure/no source mutation');
  assert.deepEqual(d, normalize(clone(u))); assert.deepEqual(d, normalize(reverseKeys(u)));
  assert.deepEqual(d.canonicalPractice, u.practice);
  assert.deepEqual(d.playback.segments.map(s => s.audio), u.items.map(i => i.audio));
  assert.deepEqual(d.playback.fullPanel, u.fullPanelAudio ?? null);
  assert.equal(d.comprehension.question, u.practice.question);
  assert.deepEqual(d.comprehension.choices, u.practice.choices);
  assert.equal(d.comprehension.correctChoice, u.practice.correctChoice);
  assert.equal(d.comprehension.referenceAnswer, u.practice.referenceAnswer);
  assert.equal(d.comprehension.operator, u.practice.operator);
  assert.equal(d.comprehension.construct, u.practice.construct);
  assert.equal(d.comprehension.dimension, u.practice.dimension ?? null);
  assert.deepEqual(d.speechTasks, u.practice.speechTasks ?? []);
  assert.equal(d.scoring.boundary, u.practice.scoringBoundary);
  assert.equal(d.scoring.calibrated, false); assert.equal(d.scoring.orthographyScoreClaimed, false);
  assert.equal(d.scoring.transferMasteryClaimed, false); assert.equal(d.scoring.dictationScoreSeparate, true);
  assert.equal(d.playback.fullStrategy, u.fullPanelAudio ? 'FULL_PANEL' : 'SEQUENTIAL_SEGMENTS');
  assert.equal(d.playback.segmentReplay, 'ASSISTED'); assert.equal(d.playback.answerRequiresFullEnd, true);
  assert.ok(matches(u, d.resumeIdentity)); assert.ok(!matches(u, { ...d.resumeIdentity, lessonVersion: 'stale' }));
  const fresh = clone(u); fresh.items[0].audio.sha256 = 'a'.repeat(64);
  assert.doesNotThrow(() => normalize(fresh), 'current catalog is truth, no frozen hash allowlist');
  assert.ok(!matches(fresh, d.resumeIdentity), 'current asset hash drift invalidates old resume');
  const response = clone(u); response.practice.referenceAnswer += ' changed';
  assert.ok(!matches(response, d.resumeIdentity), 'response semantics fingerprinted');
  const renamed = clone(u); renamed.id = 'EXTERNAL-NEW'; renamed.audioRealizationRef = 'NEW-REALIZATION';
  for (const a of [...renamed.items.map(i => i.audio), ...(renamed.fullPanelAudio ? [renamed.fullPanelAudio] : [])]) { a.lessonId = renamed.id; a.realizationId = renamed.audioRealizationRef; }
  assert.equal(normalize(renamed).identity.lessonId, renamed.id, 'shape works outside existing IDs');
  d.comprehension.choices[0] = 'mutation'; assert.equal(stable(u), before, 'no descriptor/source alias');
}
// The additional canonical question comes verbatim from unmodified runtime.
const inferenceQuestion = read('assets/final-two-practice-runtime.js').match(/text\('h3','([^']*)',form\)/)[1];
const oldInference = JSON.parse(read('tests/fixtures/inference-before-question-metadata.json'));
const currentInference = JSON.parse(read('assets/official-lessons-final-two.json'));
for (const u of currentInference.lessons) { assert.equal(u.practice.question, inferenceQuestion); delete u.practice.question; }
assert.deepEqual(currentInference, oldInference, 'only question metadata added');

let negatives = 0;
const invalid = (u, mutate) => { const bad = clone(u); mutate(bad); assert.throws(() => normalize(bad), /Invalid Practice contract/); negatives++; };
for (const u of practice) {
  for (const mutate of [
    x => { x.practice = null; }, x => { x.status = 'archived'; }, x => { x.version = ''; },
    x => { x.audioRealizationRef = 'inconsistent'; }, x => { x.items = []; },
    x => { x.items[0].audio.lessonId = 'wrong'; }, x => { x.items[0].audio.lessonVersion = 'wrong'; },
    x => { x.items[0].audio.segmentId = 'wrong'; }, x => { x.items[0].audio.sha256 = 'not-a-hash'; },
    x => { x.items[0].audio.realizationVersion = 'different'; }, x => { x.items[0].audio.url = ''; },
    x => { x.items.push(clone(x.items[0])); }, x => { x.practice.correctChoice = 999; },
    x => { x.practice.correctChoice = 0.5; }, x => { x.practice.choices = ['only one']; },
    x => { x.practice.choices[1] = x.practice.choices[0]; }, x => { delete x.practice.question; },
    x => { delete x.practice.operator; }, x => { delete x.practice.scoringBoundary; },
    x => { x.practice.anchorId = 'a'; x.practice.anchorIds = ['a']; }
  ]) invalid(u, mutate);
  if (u.fullPanelAudio) {
    invalid(u, x => { x.fullPanelAudio.segmentId = 'S001'; });
    invalid(u, x => { x.fullPanelAudio.sha256 = 'bad'; });
    invalid(u, x => { x.fullPanelAudio.lessonVersion = 'stale'; });
  }
  if (u.practice.anchorIds) {
    for (const mutate of [x => { x.practice.version = 'unknown'; }, x => { x.practice.dimension = ''; }, x => { x.practice.anchorIds = []; }, x => { x.practice.anchorIds.push(x.practice.anchorIds[0]); }, x => { delete x.practice.speechTasks; }, x => { x.practice.conditionAnchors = 'false'; }]) invalid(u, mutate);
    if (u.practice.speechTasks.length) {
      for (const mutate of [x => { x.practice.speechTasks[0].anchorId = 'unknown'; }, x => { x.practice.speechTasks[0].format = 'OTHER'; }, x => { x.practice.speechTasks[0].span.segment_id = 'missing'; }, x => { x.practice.speechTasks[0].span.end_char = 99999; }, x => { x.practice.speechTasks[0].support = 'NONE'; }, x => { x.practice.speechTasks.push(clone(x.practice.speechTasks[0])); }]) invalid(u, mutate);
    }
  } else invalid(u, x => { delete x.practice.speechCondition; });
}
assert.equal(matches(ordinary[0], {}), false);
assert.throws(() => normalize(null), /Invalid Practice contract/);
assert.throws(() => stable({ bad: undefined }), /non-JSON value/);
// Existing characterization is executed unchanged in meaning, including wrappers.
await import('./catalog-contract.test.mjs');
console.log(`Practice contract PASS: ${practice.length} Practice, ${ordinary.length} ordinary, ${negatives} malformed fixtures`);
