import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const section=(start,end)=>{
  const a=html.indexOf(start),b=html.indexOf(end,a);
  assert.ok(a>=0&&b>a,`Missing section ${start}`);
  return html.slice(a,b);
};

const unitsData={'Bài riêng của An':[{en:'Mine',vi:'Của tôi'}]};
let started=0;
const elements=new Map();
const doc={getElementById:id=>{
  if(!elements.has(id))elements.set(id,{classList:{add(){},remove(){}},textContent:''});
  return elements.get(id);
}};
const trial={unitsData,items:[],document:doc,xGo(){},xSetStudyContext(){},startStudyTimer(){started++},loadQuestion(){}};
vm.createContext(trial);
vm.runInContext(section('function xQuickTrial(){','function xEmailSignUp(){')+';xQuickTrial()',trial);
assert.deepEqual(Object.keys(unitsData),['Bài riêng của An']);
assert.equal(trial.items.length,5);
assert.equal(started,1);

const values=new Map([
  ['xnot_history',JSON.stringify([{total:1}])],
  ['xnot_history_uid_an',JSON.stringify([{total:2}])],
  ['xnot_history_uid_binh',JSON.stringify([{total:3}])]
]);
const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
const local={currentUser:null,localStorage:storage,XNOT:{favorites:[],review:[],history:[]}};
vm.createContext(local);
vm.runInContext(section('function xLocalKey(kind){','const XHERO='),local);
local.xLoadLocal();assert.equal(local.XNOT.history[0].total,1);
local.currentUser={uid:'an'};local.xLoadLocal();assert.equal(local.XNOT.history[0].total,2);
local.XNOT.history.push({total:4});local.xSaveLocal();
local.currentUser={uid:'binh'};local.xLoadLocal();assert.equal(local.XNOT.history[0].total,3);
assert.equal(local.XNOT.history.length,1);
assert.equal(JSON.parse(values.get('xnot_history'))[0].total,1);
assert.equal(JSON.parse(values.get('xnot_history_uid_an')).length,2);

assert.ok(html.includes('saved.uid!==(currentUser?.uid||null)'));
assert.ok(html.includes("if(location.hash==='#learn')xRestoreStudy()"));
console.log('Trial and account-local isolation passed');
