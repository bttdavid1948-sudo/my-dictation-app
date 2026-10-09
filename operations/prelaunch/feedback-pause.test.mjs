// Candidate-only verification. Applies patches to a temporary directory;
// never changes the working runtime or contacts Firebase.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'man-pause-'));
try {
 const names=['index.html','firestore.rules.phase3.draft'];
 for(const n of names)fs.copyFileSync(n,path.join(temp,n));
 const patches=['feedback-pause-ui.patch','feedback-containment.rules.patch'];
 for(const p of patches)execFileSync('git',['apply',path.resolve('operations/prelaunch',p)],{cwd:temp});
 const html=fs.readFileSync(path.join(temp,'index.html'),'utf8');
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
 for(const s of scripts)new vm.Script(s);
 const contact=html.match(/async function xSendOwnerFeedback\(\)\{[^\n]+/)[0];
 const audio=html.match(/async function xSendAudioReport\(\)\{[\s\S]*?\n\}/)[0];
 for(const currentUser of [null,{uid:'synthetic-A'}]) {
  const elements={'x-owner-message':{value:'synthetic contact draft'},'x-audio-report-note':{value:'synthetic audio draft'},'x-audio-report-status':{dataset:{reportId:'old-receipt'},textContent:'old success'}};
  let writes=0,closed=0;const toasts=[];
  const context=vm.createContext({document:{getElementById:id=>elements[id]},auth:{currentUser},window:{currentUser},db:{collection(){writes++;throw Error('Unexpected backend access');}},xToast:s=>toasts.push(s),xCloseOwnerChat(){closed++;}});
  vm.runInContext(contact+'\n'+audio,context);
  for(let i=0;i<3;i++){await context.xSendOwnerFeedback();await context.xSendAudioReport();}
  assert.equal(writes,0);assert.equal(closed,0);
  assert.equal(elements['x-owner-message'].value,'synthetic contact draft');
  assert.equal(elements['x-audio-report-note'].value,'synthetic audio draft');
  assert.equal(elements['x-audio-report-status'].dataset.reportId,undefined);
  assert.match(elements['x-audio-report-status'].textContent,/chưa được gửi/);
  assert.equal(toasts.length,3);assert.match(toasts[0],/chưa được gửi/);
 }
 const originalRules=fs.readFileSync(names[1],'utf8');
 const candidateRules=fs.readFileSync(path.join(temp,names[1]),'utf8');
 assert.equal(candidateRules,originalRules.replace('allow create: if request.resource.data.keys().hasOnly([','allow create: if false && request.resource.data.keys().hasOnly(['));
 for(const p of patches.toReversed())execFileSync('git',['apply','--reverse',path.resolve('operations/prelaunch',p)],{cwd:temp});
 for(const n of names)assert.deepEqual(fs.readFileSync(path.join(temp,n)),fs.readFileSync(n));
 console.log('PASS: candidate-only contact/audio guest+auth repeated submit: zero backend access, drafts retained in current DOM, truthful status, stale receipt removed; full inline syntax; Rules one-clause diff; reverse patches restore exact baseline. Not emulator, browser visual, production Rules or distributed broker PASS.');
} finally {fs.rmSync(temp,{recursive:true,force:true});}
