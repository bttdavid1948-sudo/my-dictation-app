import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {parseLearningCSV}=require('../assets/text-import.js');
const ref=fs.readFileSync(new URL('./fixtures/learning-csv-before-u1.js',import.meta.url),'utf8');
const before=vm.runInNewContext(ref+';parseLearningCSV');
const plain=x=>JSON.parse(JSON.stringify(x));
const success=[
 ['simple','Hello,Chào',[{en:'Hello',vi:'Chào'}]],
 ['English header','English,Vietnamese\nOne,Một',[{en:'One',vi:'Một'}]],
 ['Vietnamese header','Câu tiếng Anh,Bản dịch tiếng Việt\r\nOne,Một',[{en:'One',vi:'Một'}]],
 ['BOM and whitespace','\uFEFF English , Vietnamese\n A , B ',[{en:'A',vi:'B'}]],
 ['quoted comma','"Hi, friend",Chào',[{en:'Hi, friend',vi:'Chào'}]],
 ['escaped quote','"He said ""hi""",Chào',[{en:'He said "hi"',vi:'Chào'}]],
 ['quoted multiline','"One\nTwo","Một\r\nHai"',[{en:'One\nTwo',vi:'Một\r\nHai'}]],
 ['CR LF CRLF','A,B\rC,D\nE,F\r\n',[{en:'A',vi:'B'},{en:'C',vi:'D'},{en:'E',vi:'F'}]],
 ['blank rows','\n,\nA,B\n  ,  \n',[{en:'A',vi:'B'}]],
 ['empty','',[]],['header only','english,vietnamese\n',[]],
 ['Unicode','Tiếng Việt,🐱',[{en:'Tiếng Việt',vi:'🐱'}]],
 ['permissive embedded quote','A"B",C',[{en:'AB',vi:'C'}]]
];
for(const [name,input,expected] of success)test(name,()=>{assert.deepEqual(plain(parseLearningCSV(input)),expected);assert.deepEqual(plain(before(input)),expected)});
for(const [name,input,message] of [
 ['unclosed quote','"A,B','CSV có ô chưa đóng dấu ngoặc kép.'],
 ['extra column','A,B,C','CSV cần đúng hai cột English và Vietnamese.'],
 ['missing column','A','CSV cần đúng hai cột English và Vietnamese.'],
 ['missing English',',B','Mỗi dòng cần đủ câu tiếng Anh và bản dịch tiếng Việt.'],
 ['missing Vietnamese','A,','Mỗi dòng cần đủ câu tiếng Anh và bản dịch tiếng Việt.']
])test(name,()=>{for(const f of [before,parseLearningCSV])assert.throws(()=>f(input),{name:'Error',message})});
test('bounded differential malformed/quoted corpus',()=>{
 const outcomes=f=>input=>{try{return {value:plain(f(input))}}catch(e){return {error:e.name,message:e.message}}};
 const a=outcomes(before),b=outcomes(parseLearningCSV),chars=['a',',','"','\r','\n'];
 let checked=0;function walk(s,n){assert.deepEqual(b(s),a(s));checked++;if(n)for(const c of chars)walk(s+c,n-1)}walk('',5);assert.equal(checked,3906);
});
test('classic browser API and host delegator preserve synchronous contract',()=>{
 const s=fs.readFileSync(new URL('../assets/text-import.js',import.meta.url),'utf8');
 const context=vm.createContext({window:{}});vm.runInContext(s,context);
 assert.equal(typeof context.window.ManTextImport.parseLearningCSV,'function');
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert(html.indexOf('src="assets/text-import.js"')<html.indexOf('function parseLearningCSV('));
 const bridge=html.match(/function parseLearningCSV\(text\) \{ return ManTextImport\.parseLearningCSV\(text\); \}/)?.[0];assert(bridge);
 vm.runInContext('const ManTextImport=window.ManTextImport;'+bridge,context);
 assert.deepEqual(plain(context.parseLearningCSV('A,B')),[{en:'A',vi:'B'}]);
 for(const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!script[1].includes('src='))new vm.Script(script[2]);
});
test('unchanged CSV importer appends to chosen private lesson and queues one save',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const a=html.indexOf('function handleCSVUpload('),z=html.indexOf('function onUnitSelectChange(',a);assert(a>=0&&z>a);
 const expected={Other:[{en:'Keep',vi:'Giữ'}],Mine:[{en:'Old',vi:'Cũ'}]};let calls=0,stamps=0;const messages=[];
 const c=vm.createContext({unitsData:plain(expected),parseLearningCSV,getActiveUnitName:()=> 'Mine',xStampPrivateLesson(name){assert.equal(name,'Mine');stamps++},updateUnitDropdown(){},renderUnitSelector(){},renderCurrentUnitPreview(){},xQueuePrivateSave(){calls++},xToast:m=>messages.push(m),FileReader:class{readAsText(file,encoding){assert.equal(encoding,'UTF-8');this.onload({target:{result:file.text}})}}});
 vm.runInContext(html.slice(a,z),c);const target={files:[{text:'English,Vietnamese\nNew,Mới'}],value:'selected.csv'};c.handleCSVUpload({target});
 assert.deepEqual(plain(c.unitsData),{Other:expected.Other,Mine:[...expected.Mine,{en:'New',vi:'Mới'}]});assert.equal(calls,1);assert.equal(stamps,1);assert.equal(target.value,'');
 target.files=[{text:'bad'}];c.handleCSVUpload({target});assert.equal(calls,1);assert.equal(c.unitsData.Mine.length,2);assert(messages.at(-1).startsWith('Chưa nạp được file: '));
});
