import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const rules=fs.readFileSync(new URL('../firestore.rules.phase3.draft',import.meta.url),'utf8');
const catalog=JSON.parse(fs.readFileSync(new URL('../assets/official-lessons.json',import.meta.url),'utf8'));

assert.ok(!html.includes("db.collection('community_units')"));
assert.ok(!html.includes('share-community-check'));
assert.ok(!html.includes('x-contribute'));
assert.ok(html.includes("db.collection('user_vocab').doc(uid)"));
assert.ok(html.includes("fetch('assets/official-lessons.json'"));
assert.ok(/match \/community_units\/\{id\}[\s\S]*?allow create, update, delete: if false;/.test(rules));
assert.ok(/match \/user_vocab\/\{uid\}[\s\S]*?allow get: if isOwner\(uid\);/.test(rules));
assert.equal(catalog.publisher,'man');
assert.ok(catalog.lessons.length>=3);
const ids=new Set();
for(const unit of catalog.lessons){
  assert.equal(unit.publisher,'man');
  assert.equal(unit.status,'published');
  assert.equal(unit.sourceType,'original');
  assert.ok(unit.rightsEvidenceId);
  assert.ok(unit.items.length>=5);
  assert.ok(!ids.has(unit.id));ids.add(unit.id);
  unit.items.forEach(({en,vi})=>{assert.ok(en.trim());assert.ok(vi.trim())});
}
let scripts=0;
for(const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(script[1].includes('src='))continue;
  new vm.Script(script[2]);scripts++;
}
assert.equal(scripts,8);

const start=html.indexOf('        let catalogPromise;');
const end=html.indexOf('        function renderCatalogList(',start);
assert.ok(start>0&&end>start);
const code=html.slice(start,end);
const views=[];
const topicOptions=[];
const context={fetch:async()=>({ok:true,json:async()=>({lessons:[
  ...catalog.lessons,
  {...catalog.lessons[0],id:'forged',publisher:'user'},
  {...catalog.lessons[0],id:'draft',status:'draft'},
  {...catalog.lessons[0],id:catalog.lessons[0].id}
]})}),renderCatalogList:list=>views.push(list),xRenderCarousel:()=>{},
  console,Option:function(label,value){this.label=label;this.value=value},
  document:{getElementById:id=>id==='filter-topic'?{replaceChildren:()=>{topicOptions.length=0},add:option=>topicOptions.push(option)}:null},
  catalogUnitsCache:[]};
vm.createContext(context);
vm.runInContext(code+';globalThis.loadCatalogUnits=loadCatalogUnits;',context);
const loaded=await context.loadCatalogUnits();
assert.equal(loaded.length,catalog.lessons.length);
assert.equal(views.length,1);
assert.deepEqual([...loaded.map(x=>x.id)],catalog.lessons.map(x=>x.id));
assert.ok(topicOptions.some(option=>option.value==='Đời sống'));
console.log('Catalog contract and 8 inline scripts passed');
