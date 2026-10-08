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
assert.ok(/match \/leaderboard_public\/\{uid\}[\s\S]*?allow read, write: if false;/.test(rules));
assert.ok(!html.includes("db.collection('users_profile').where("));
assert.ok(!html.includes("db.collection('users_profile').orderBy("));
assert.equal(catalog.publisher,'man');
assert.ok(catalog.lessons.length>=1);
const extension=JSON.parse(fs.readFileSync(new URL('../assets/official-lessons-batch01-exceptions.json',import.meta.url),'utf8'));
const panelCatalog=JSON.parse(fs.readFileSync(new URL('../assets/official-lessons-man0844.json',import.meta.url),'utf8'));
const finalTwo=JSON.parse(fs.readFileSync(new URL('../assets/official-lessons-final-two.json',import.meta.url),'utf8'));
const batch02=JSON.parse(fs.readFileSync(new URL('../assets/official-lessons-batch02.json',import.meta.url),'utf8'));
const batch03=JSON.parse(fs.readFileSync(new URL('../assets/official-lessons-batch03.json',import.meta.url),'utf8'));
const fixtures=new Map([
  ['assets/official-lessons.json',catalog],
  ['assets/official-lessons-batch01-exceptions.json',extension],
  ['assets/official-lessons-man0844.json',panelCatalog],
  ['assets/official-lessons-final-two.json',finalTwo],
  ['assets/official-lessons-batch02.json',batch02],
  ['assets/official-lessons-batch03.json',batch03]
]);
const allLessons=[...fixtures.values()].flatMap(data=>data.lessons);
const published=allLessons.filter(unit=>unit.status==='published');
assert.deepEqual(published.map(unit=>unit.id),['MAN-0065','MAN-0165','MAN-0365','MAN-0044','MAN-0238','MAN-0414','MAN-0765','MAN-0604','MAN-0986','MAN-0844','MAN-0565','MAN-0905','MAN-0066','MAN-0166','MAN-0366','MAN-0566','MAN-0766','MAN-0906','MAN-0001','MAN-0201','MAN-0311','MAN-0521','MAN-0733','MAN-0921','MAN-0067','MAN-0167','MAN-0367']);
assert.equal(published.length,27);
assert.equal(batch02.lessons.length,12);
assert.equal(allLessons.filter(unit=>unit.status==='archived').length,4);
const ids=new Set();
for(const unit of allLessons){
  assert.equal(unit.publisher,'man');
  assert.ok(['published','archived'].includes(unit.status));
  if(batch02.lessons.some(x=>x.id===unit.id)){
    assert.equal(unit.source,'MAN_OFFICIAL');assert.equal(unit.kind,'OFFICIAL_LESSON');
  }else{assert.equal(unit.sourceType,'original');assert.ok(unit.rightsEvidenceId);}
  assert.ok(unit.items.length>=1);
  assert.ok(!ids.has(unit.id));ids.add(unit.id);
  unit.items.forEach(({en,vi})=>{assert.ok(en.trim());assert.ok(vi.trim())});
}
let scripts=0;
for(const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(script[1].includes('src='))continue;
  new vm.Script(script[2]);scripts++;
}
assert.ok(scripts>=8);

const start=html.indexOf('        let catalogPromise;');
const end=html.indexOf('        function renderCatalogList(',start);
assert.ok(start>0&&end>start);
const code=html.slice(start,end);
const views=[];
const topicOptions=[];
const requested=[];
const context={xLibMode:'mine',fetch:async(url)=>{
  requested.push(url);assert.ok(fixtures.has(url),`Unexpected catalog URL ${url}`);
  const data=structuredClone(fixtures.get(url));
  if(url==='assets/official-lessons.json')data.lessons.push(
    {...catalog.lessons[4],id:'forged',publisher:'user'},
    {...catalog.lessons[4],id:'draft',status:'draft'},
    {...catalog.lessons[4]});
  return {ok:true,json:async()=>data};
},renderCatalogList:list=>views.push(list),xRenderCarousel:()=>{},
  console,Option:function(label,value){this.label=label;this.value=value},
  document:{getElementById:id=>id==='filter-topic'?{replaceChildren:()=>{topicOptions.length=0},add:option=>topicOptions.push(option)}:null},
  catalogUnitsCache:[]};
vm.createContext(context);
vm.runInContext(code+';globalThis.loadCatalogUnits=loadCatalogUnits;',context);
const loaded=await context.loadCatalogUnits();
assert.deepEqual(requested,[...fixtures.keys()]);
assert.equal(loaded.length,27);
assert.equal(new Set(loaded.map(x=>x.id)).size,27);
assert.deepEqual(JSON.parse(JSON.stringify(loaded)),published);
await context.loadCatalogUnits();
assert.equal(requested.length,6,'cached load must not refetch catalogs');
assert.equal(views.length,1);
assert.deepEqual([...loaded.map(x=>x.id)],published.map(x=>x.id));
assert.ok(topicOptions.some(option=>option.value===published[0].topic));
await import('./practice-runtime-characterization.test.mjs');
console.log(`Catalog contract and ${scripts} inline scripts passed`);
