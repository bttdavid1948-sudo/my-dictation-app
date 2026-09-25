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
console.log('Private autosave and reload draft contract passed');
