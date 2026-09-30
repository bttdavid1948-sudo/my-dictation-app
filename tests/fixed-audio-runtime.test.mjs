import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../assets/fixed-audio-runtime.js',import.meta.url),'utf8');
let audios=[];class FakeAudio{constructor(url){this.url=url;this.currentTime=2;audios.push(this)}play(){return Promise.resolve()}pause(){this.paused=true}removeAttribute(){}load(){}}
const c={Audio:FakeAudio,URL,navigator:{userAgent:'test'},location:{href:'https://example.org/man/',origin:'https://example.org'},innerWidth:390,innerHeight:844};vm.createContext(c);vm.runInContext(source,c);const m=c.ManFixedAudio;
const item={audio:{url:'assets/audio/file-v2.wav',releaseClass:'CONTROLLED_INTERNAL_RELEASE',lessonId:'MAN-0065',lessonVersion:'v0.1',segmentId:'S001',realizationId:'MAN-0065-OPENAI-FIXED-v0.2',realizationVersion:'v0.2',profileRef:'P@v0.2',sha256:'a'.repeat(64)}};
assert.equal(m.play({en:'private'},1),false);
let ended=0;assert.equal(m.play(item,.7,()=>ended++),true);assert.equal(audios[0].playbackRate,.7);audios[0].onplaying();
const context=m.reportContext(item,.7);const report=JSON.parse(m.reportMessage(m.categories[0],context,''));assert.equal(report.context.realizationVersion,'v0.2');assert.equal(report.context.assetSha256,'a'.repeat(64));assert.equal(report.context.playbackState,'playing');assert.equal(report.context.viewport,'390x844');assert.ok(!('transcript' in report));assert.equal(report.note,'');
m.stop();audios[0].onended();assert.equal(ended,0);assert.equal(m.reportMessage('fake',context),null);
let errors=0;m.play({...item,audio:{...item.audio,url:'https://elsewhere.example/file.wav'}},1,null,()=>errors++);assert.equal(errors,1);assert.equal(audios.length,1);
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');for(const s of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(!s[1].includes('src='))new vm.Script(s[2])}
assert.ok(html.includes("kind:'Báo bug',message,page:'audio'"));assert.ok(html.includes('🔊 Âm thanh có vấn đề?'));console.log('Fixed audio cancellation, versioned reporting, private fallback and syntax PASS');
