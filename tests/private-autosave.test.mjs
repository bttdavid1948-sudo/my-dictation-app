import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const name of ['addSingleSentence', 'parseAndAddParagraph', 'deleteSentence', 'loadSampleData']) {
  const start = html.indexOf(`function ${name}(`);
  const end = html.indexOf('\n        }', start);
  assert.ok(start !== -1 && end !== -1 && html.slice(start, end).includes('xQueuePrivateSave()'),
    `${name} must schedule a durable save`);
}
assert.match(html, /unitsData\[unitName\]\.push\(\.\.\.newItems\);[\s\S]{0,220}xQueuePrivateSave\(\)/,
  'CSV import must schedule a save');

const start = html.indexOf('let xCloudLoadedForUid = null;');
const end = html.indexOf('function xMergePrivateUnits(', start);
assert.ok(start !== -1 && end !== -1);
const stored = new Map();
let calls = 0;
const context = vm.createContext({
  Promise,
  JSON,
  currentUser: {uid: 'learner'},
  document: {getElementById: () => ({textContent: ''})},
  unitsData: {Private: [{en: 'This is a private test.', vi: 'Đây là bài kiểm tra riêng.'}]},
  sessionStorage: {
    setItem: (key, value) => stored.set(key, value),
    getItem: key => stored.get(key) ?? null,
    removeItem: key => stored.delete(key)
  },
  xRenderCarousel: () => {},
  xToast: () => {},
  saveToCloud: async () => { calls++; }
});
vm.runInContext(html.slice(start, end), context);
vm.runInContext('xQueuePrivateSave()', context);
await vm.runInContext('xPrivateSaveQueue', context);
assert.equal(calls, 1);
assert.equal(JSON.parse(stored.get('man_private_draft_v1_learner')).Private[0].en,
  'This is a private test.');
const saveStart = html.indexOf('async function saveToCloud()');
const saveEnd = html.indexOf('async function loadFromCloud()', saveStart);
let serverUnits = null;
const ref = {
  get: async () => ({exists: true, data: () => ({units: serverUnits})})
};
context.db = {
  collection: () => ({doc: () => ref}),
  runTransaction: async fn => fn({
    get: async () => ({exists: serverUnits !== null, data: () => ({units: serverUnits})}),
    set: (_ref, data) => {serverUnits = data.units;}
  })
};
context.firebase = {firestore: {FieldValue: {serverTimestamp: () => 'server-time'}}};
context.loadFromCloud = async () => {};
context.xRenderCarousel = () => {};
context.xToast = () => {};
context.console = {error: () => {}};
vm.runInContext(html.slice(saveStart, saveEnd), context);
vm.runInContext('xCloudLoadedForUid = "learner"; xCloudUnitsSnapshot = null', context);
await vm.runInContext('saveToCloud()', context);
assert.equal(JSON.parse(serverUnits).Private[0].en, 'This is a private test.');
assert.equal(stored.has('man_private_draft_v1_learner'), false,
  'draft clears only after readback');
stored.set('man_private_draft_v1_learner', serverUnits);
ref.get = async () => ({exists: true, data: () => ({units: 'stale'})});
vm.runInContext('xCloudUnitsSnapshot = '+JSON.stringify(serverUnits), context);
await vm.runInContext('saveToCloud()', context);
assert.equal(stored.has('man_private_draft_v1_learner'), true,
  'failed server readback retains the draft');
console.log('Private autosave and reload draft contract passed');
