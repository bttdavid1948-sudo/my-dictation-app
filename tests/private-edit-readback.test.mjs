import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
function source(from, to) {
  const begin = html.indexOf(from), end = html.indexOf(to, begin);
  assert(begin >= 0 && end > begin, `missing ${from}`);
  return html.slice(begin, end);
}
const original = {Mine:[{en:'Original',vi:'Cũ'}],Other:[{en:'Keep',vi:'Giữ'}]};
let server = JSON.stringify(original);
let reads = 0;
let delayedRead;
const storage = new Map();
const ref = {
  async get(options) {
    assert.equal(options?.source,'server');
    reads++;
    if (delayedRead) return new Promise(resolve => { delayedRead = resolve; });
    return {exists:true,data:()=>({units:server})};
  }
};
const noop = () => {};
const ctx = vm.createContext({
  JSON, Object, console, currentUser:{uid:'owner'}, unitsData:{},
  db:{collection:()=>({doc:()=>ref}),runTransaction:async callback=>{
    await callback({get:async()=>({exists:true,data:()=>({units:server})}),set:(_ref,data)=>{server=data.units}});
  }},
  firebase:{firestore:{FieldValue:{serverTimestamp:()=>null}}},
  sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
  xPrivateSaveQueue:Promise.resolve(), xCloudLoadedForUid:'owner',xCloudUnitsSnapshot:server,
  xPrivateCloudRevision:0, xPrivateDraftKey:uid=>'draft_'+uid,
  updateUnitDropdown:noop, renderUnitSelector:noop,renderCurrentUnitPreview:noop,
  xRenderCarousel:noop,xPrivateSaveStatus:noop,xQueuePrivateSave:noop,xToast:noop,
  document:{},
});
vm.runInContext(source('function xMergePrivateUnits(', 'async function saveToCloud(') +
  source('async function loadFromCloud(', 'function loadSampleData(') +
  source('function xApplyPrivateMutation(', 'function xPrivateManagerRefresh('),ctx);

const revised = [{en:'Distinctive updated sentence',vi:'Đã sửa'}];
await vm.runInContext('xPersistPrivateMutation("Mine",'+JSON.stringify(original.Mine)+',"Mine",'+JSON.stringify(revised)+',false)',ctx);
assert.equal(JSON.parse(server).Mine[0].en,revised[0].en);
assert.deepEqual(JSON.parse(server).Other,original.Other);
assert.equal(Object.keys(JSON.parse(server)).length,2,'no accidental duplicate');

// Reload with an old in-memory copy: only the confirmed account data may win.
ctx.unitsData = structuredClone(original);
await vm.runInContext('loadFromCloud()',ctx);
assert.equal(ctx.unitsData.Mine[0].en,revised[0].en);
assert.deepEqual(ctx.unitsData.Other,original.Other);
assert.ok(reads >= 2);

// A cloud read started before the edit must not replace the result after it commits.
let resolveRead;
delayedRead = true;
ctx.unitsData = structuredClone(JSON.parse(server));
const pending = vm.runInContext('loadFromCloud()',ctx);
await new Promise(resolve=>setImmediate(resolve));
resolveRead = delayedRead;
delayedRead = null;
const secondRevision = [{en:'Second confirmed edit',vi:'Mới'}];
await vm.runInContext('xPersistPrivateMutation("Mine",'+JSON.stringify(revised)+',"Mine",'+JSON.stringify(secondRevision)+',false)',ctx);
resolveRead({exists:true,data:()=>({units:JSON.stringify(original)})});
await pending;
assert.equal(ctx.unitsData.Mine[0].en,secondRevision[0].en);
assert.equal(JSON.parse(server).Mine[0].en,secondRevision[0].en);
console.log('Private edit: server readback, reload, sibling preservation, no duplicate, stale read ignored');

assert.match(html, /onclick="xEndStudyFromSummary\(\)"[^>]*>Dừng lượt học/);
assert.match(source('function xEndStudyFromSummary()', 'function copyPrompt('), /sessionStorage\.removeItem\('man_study_v1'\)/);
assert.match(source('function xEndStudyFromSummary()', 'function copyPrompt('), /xGo\('learn'\)/);
