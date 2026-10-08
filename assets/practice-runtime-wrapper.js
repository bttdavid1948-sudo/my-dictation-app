/* Generic learner integration boundary.
 * Presentation/IO/legacy storage policy stay here; decisions use the descriptor/core.
 * Legacy runtimes remain the resume owner and rollback/reference path.
 */
import { normalizePracticeLesson, canonicalPracticeJSON } from './practice-runtime-contract.js';
import { createPracticeCore } from './practice-runtime-core.js';
const copy = value => JSON.parse(canonicalPracticeJSON(value));

// Historical wire/presentation formats selected by represented capabilities,
// never catalog identity or batch. These names preserve existing consumers.
const presentationFormats = {
  tasks: {
    kind: 'tasks', prefix: 'man-b02', panel: 'man-b02-panel', key: 'man_batch02_practice_v1', history: 'man_batch02_evidence_v1', limit: 100, counter: 'segmentReplays', response: 'PRACTICE_RESPONSE',
    intro: 'Nghe cả bài trước, rồi chọn cách hiểu và luyện cụm ngắn nếu có. Nghe lại khi cần nhé.', play: '▶ Nghe cả bài',
    ready: 'Đã nghe hết. Bạn có thể trả lời bên dưới.', correct: 'Bạn đã chọn đúng cách hiểu của bài.', incorrect: 'Cùng xem lại ý chính nhé.', boundary: 'Kết quả ghi nhận lần luyện có lựa chọn hoặc gợi ý này; không phải chứng nhận thành thạo. Điểm chính tả được ghi riêng.'
  },
  context: {
    kind: 'context', prefix: 'man-panel', panel: 'man-mixed-panel', key: 'man_mixed_panel_v1', history: 'man_comprehension_history_v1', limit: 60, counter: 'contextReplays', response: 'COMPREHENSION_RESPONSE',
    intro: 'Nghe cả cuộc thảo luận trước, rồi chọn cách hiểu ý chính. Khi nghe lại một lượt nói, bạn vẫn nghe được lời của người bên cạnh.', play: '▶ Nghe cả cuộc thảo luận',
    ready: 'Đã nghe hết cuộc thảo luận. Chọn cách hiểu của bạn bên dưới.', correct: 'Bạn đã chọn đúng ý chính của cuộc thảo luận.', incorrect: 'Ý chính còn chạy mất một chút. Cùng xem lại lập luận nhé.', boundary: 'Đây là phản hồi cho lần luyện hiểu nội dung này. Kết quả chính tả khi luyện thêm được ghi riêng.'
  },
  sequence: {
    kind: 'sequence', prefix: 'man-inference', panel: 'man-inference-panel', key: 'man_final_two_practice_v1', history: 'man_comprehension_history_v1', limit: 60, counter: 'segmentReplays', response: 'INFERENCE_RESPONSE',
    intro: 'Nghe cuộc thảo luận trước, rồi chọn kết luận phù hợp nhất. Bạn có thể nghe lại từng lượt khi cần.', play: '▶ Nghe cả cuộc thảo luận',
    ready: 'Đã nghe hết. Chọn kết luận của bạn bên dưới.', correct: 'Bạn đã chọn đúng kết luận của cuộc thảo luận.', incorrect: 'Kết luận còn chạy mất một chút. Cùng xem lại lập luận nhé.', boundary: 'Kết quả này ghi nhận lần luyện hiểu nội dung. Kết quả chính tả được ghi riêng.'
  }
};
function presentation(d){return presentationFormats[d.evidence.model==='TASK_ROWS'?'tasks':d.playback.fullStrategy==='FULL_PANEL'?'context':'sequence'];}
export const practiceSessionKeys=Object.freeze(Object.values(presentationFormats).map(v=>v.key));

export function installPracticeWrapper(host) {
  const w = host.window, document = host.document, audio = host.audio;
  const now = host.now, uid = host.uid;
  const captured = Object.fromEntries(['xStartCatalog','xGo','xRestoreStudy','xSpeakTranscriptItem','xSyncTranscriptView','xOpenAudioReport','playAudio'].map(k => [k,w[k]]));
  const old = host.reference || captured;
  let restoring = false, opening = false;
  const ownedPanels=new Set();
  let d = null, view = null, core = null, wire = null, panel = null, generation = 0, disposed = false;
  const read = (storage,key,fallback) => { try { return JSON.parse(storage.getItem(key) || 'null') ?? fallback; } catch (_) { return fallback; } };
  const remove = key => { try { host.session.removeItem(key); } catch (_) {} };
  const write = (storage,key,value) => { try { storage.setItem(key,JSON.stringify(value)); } catch (_) {} };
  const hashes = descriptor => descriptor.playback.segments.map(s=>s.audio.sha256).concat(descriptor.playback.fullPanel ? [descriptor.playback.fullPanel.sha256] : []);
  const descriptor = u => normalizePracticeLesson(u); // sole canonical input boundary
  function sync() {
    const s=core.snapshot();
    for (const k of ['phase','fullPlays','fullEnded','assisted','answer','correct','responseAssisted']) if (Object.hasOwn(s,k)) wire[k]=s[k];
    wire[view.counter]=s.segmentReplays;
    if(view.kind==='tasks'){wire.spanAnswers=s.spanAnswers;wire.evidence=s.evidence;}
  }
  function save(){if(wire)write(host.session,view.key,{...wire,phase:'GENERIC_PRACTICE_V1',uid:uid(),at:now(),resumeIdentity:d.resumeIdentity,coreState:core.snapshot(),wire:copy(wire)});}
  function event(kind,detail={}){wire.events.push({kind,...detail});save();}
  function stop(){generation++;core?.stop();audio.stop();}
  function status(s){const e=panel?.querySelector('#'+view.prefix+'-status');if(e)e.textContent=s;}
  const text=(tag,s,parent)=>{const e=document.createElement(tag);e.textContent=s;parent.append(e);return e;};
  function button(s,id,action){const b=document.createElement('button');b.type='button';b.className='btn';b.id=id;b.textContent=s;b.addEventListener('click',action);return b;}
  function play(segmentIndex=null){
    stop();host.cancelSpeech();
    const t=generation,rate=host.rate(),plan=core.beginPlayback({segmentIndex,rate});sync();
    const full=segmentIndex===null,first=plan.assets[0];
    if(view.kind==='context')event(full?'FULL_PANEL_PLAY':'CONTEXT_PRESERVING_REPLAY',{segmentId:first.segmentId,sha256:first.sha256,rate,evidence:full?'FULL_CONTEXT':'ASSISTED'});
    else if(full)event(view.kind==='tasks'?'FULL_CONTEXT_PLAY':'FULL_DISCUSSION_PLAY',view.kind==='tasks'?{rate,mixed:!!d.playback.fullPanel}:{rate,evidence:'FULL_CONTEXT'});
    else event('SEGMENT_REPLAY',view.kind==='tasks'?{segmentId:first.segmentId,contextPreserved:!!d.playback.fullPanel,rate}:{segmentId:first.segmentId,evidence:'ASSISTED'});
    function next(i){
      if(t!==generation)return;
      if(view.kind==='context')status(full?'Đang nghe cả cuộc thảo luận…':'Đang nghe lại lượt nói cùng bối cảnh…');
      else {status(`Đang nghe ${view.kind==='sequence'?'lượt ':''}${i+1}/${plan.assets.length}…`);event(view.kind==='tasks'?'FIXED_ASSET_PLAY':'FIXED_SEGMENT_PLAY',{segmentId:plan.assets[i].segmentId,sha256:plan.assets[i].sha256,rate});}
      audio.play({audio:plan.assets[i]},rate,()=>{
        if(t!==generation||!core.assetEnded(plan.token,i))return;
        event('PLAYBACK_ENDED',{segmentId:plan.assets[i].segmentId});sync();
        if(i+1<plan.assets.length)next(i+1);
        else if(full){if(view.kind!=='context')event(view.kind==='tasks'?'FULL_CONTEXT_ENDED':'FULL_DISCUSSION_ENDED');save();render();}
        else status('Đã nghe lại. Bạn có thể trả lời khi sẵn sàng.');
      },()=>{if(t!==generation||!core.playbackFailed(plan.token))return;event('PLAYBACK_FAILED',{segmentId:plan.assets[i].segmentId});status('Audio chưa phát được. Bạn có thể thử lại hoặc báo lỗi.');});
    }next(0);
  }
  function submit(choice,responses){
    stop();const at=now(),result=core.submit({choice,speechResponses:responses,at});sync();
    if(view.kind==='tasks')event(view.response,{correct:wire.correct,evidence:wire.evidence});
    else {wire.completedAt=at;event(view.response,{correct:wire.correct,evidence:wire.responseAssisted?'ASSISTED':'FULL_CONTEXT_FIRST_PASS'});}
    const rows=view.kind==='tasks'?result:[{at,lessonId:d.identity.lessonId,lessonVersion:d.identity.lessonVersion,realizationId:d.identity.realizationId,construct:d.comprehension.construct,correct:wire.correct,assisted:wire.assisted,[view.counter]:result.segmentReplays,calibrated:d.scoring.calibrated}];
    const history=read(host.local,view.history,[]);if(Array.isArray(history))write(host.local,view.history,history.concat(rows).slice(-view.limit));render();
  }
  function render(){
    if(!panel){panel=document.createElement('section');panel.id=view.panel;panel.className='x-panel';document.getElementById('x-learn-slot').prepend(panel);ownedPanels.add(panel);}
    panel.hidden=false;panel.replaceChildren();panel.style.cssText='padding:24px;max-width:860px;margin:0 auto 20px;overflow-wrap:anywhere';
    const css=document.createElement('style');css.textContent=`#${view.panel} button,#${view.panel} input{scroll-margin-top:110px;scroll-margin-bottom:130px}`;panel.append(css);
    text('h2',host.title(d.identity.lessonId),panel);text('p',view.intro,panel);text('p','Giọng đọc do AI tạo. Bạn có thể báo lỗi để Mặn sửa đúng phiên bản.',panel);
    const controls=document.createElement('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:10px';panel.append(controls);
    controls.append(button(view.play,view.prefix+'-play',()=>play()),button('⏹ Dừng',view.prefix+'-stop',()=>{stop();status(view.kind==='context'?'Đã dừng. Bấm nghe lại khi bạn sẵn sàng.':'Đã dừng. Bấm nghe lại khi sẵn sàng.');}));
    if(view.kind==='context')controls.append(button('🔊 Âm thanh có vấn đề?',view.prefix+'-report',()=>w.xOpenAudioReport({audio:d.playback.fullPanel})));
    const msg=text('p',wire.fullEnded?view.ready:'Bấm nghe trước nhé; chưa cần nhìn bản chép.',panel);msg.id=view.prefix+'-status';msg.setAttribute('role','status');if(!wire.fullEnded)return;
    const replay=document.createElement('div');replay.style.cssText='display:flex;flex-wrap:wrap;gap:8px';panel.append(replay);
    const roles={moderator:'người điều phối',researcher:'nhà nghiên cứu',clinician:'bác sĩ'};
    d.playback.segments.forEach((s,i)=>{replay.append(button(`↻ Lượt ${i+1}`+(view.kind==='context'?`: ${roles[s.speakerRole]}`:''),view.prefix+'-replay-'+s.segmentId,()=>play(i)));if(view.kind!=='context')replay.append(button(`Báo audio lượt ${i+1}`,view.prefix+'-report-'+s.segmentId,()=>w.xOpenAudioReport({audio:s.audio})));});
    const form=document.createElement('form');form.id=view.prefix+'-answer';form.style.marginTop='20px';panel.append(form);text('h3',d.comprehension.question,form);
    d.comprehension.choices.forEach((s,i)=>{const label=document.createElement('label');label.style.cssText='display:flex;align-items:flex-start;gap:10px;padding:12px 0;cursor:pointer';const input=document.createElement('input');input.type='radio';input.name=view.prefix+'-answer';input.value=String(i);input.required=true;input.disabled=wire.phase==='complete';input.checked=wire.answer===i;const span=document.createElement('span');span.textContent=s;label.append(input,span);form.append(label);});
    d.speechTasks.forEach((t,i)=>{const label=document.createElement('label');label.style.cssText='display:block;padding:12px 0';text('span',t.prompt,label);const input=document.createElement('input');input.type='text';input.id=view.prefix+'-span-'+i;input.required=true;input.autocomplete='off';input.value=wire.spanAnswers[i]||'';input.disabled=wire.phase==='complete';input.style.cssText='display:block;max-width:100%;width:100%;padding:10px';input.addEventListener('input',()=>{core.setSpeechResponse(i,input.value);sync();save();});label.append(input);form.append(label);});
    if(wire.phase!=='complete'){const b=document.createElement('button');b.type='submit';b.className='x-primary';b.id=view.prefix+'-submit';b.textContent='Xem phản hồi';form.append(b);form.addEventListener('submit',e=>{e.preventDefault();const checked=form.querySelector('input[type=radio]:checked');if(checked)submit(Number(checked.value),d.speechTasks.map((_,i)=>document.getElementById(view.prefix+'-span-'+i).value));});return;}
    const result=document.createElement('div');result.id=view.prefix+'-result';result.setAttribute('role','status');panel.append(result);text('h3','Bạn vừa làm được gì?',result);text('p',wire.correct?view.correct:view.incorrect,result);text('p',d.comprehension.referenceAnswer,result);
    if(view.kind==='tasks')d.speechTasks.forEach((t,i)=>text('p',`Cụm ${i+1}: ${wire.evidence[i+1].correct?'Đã nhận ra đúng.':'Cần nghe lại.'} Cụm trong audio: ${t.answer}`,result));
    else text('p',wire.responseAssisted?(view.kind==='context'?'Bạn đã dùng hỗ trợ nghe lại hoặc nghe chậm; lần này được ghi nhận là luyện có hỗ trợ.':'Bạn đã dùng nghe lại hoặc nghe chậm; lần luyện này được ghi nhận có hỗ trợ.'):'Bạn đã trả lời sau một lượt nghe cả cuộc thảo luận.',result);
    text('p',view.boundary,result);
    result.append(button('✍️ Luyện chính tả các lượt nói',view.prefix+'-dictation',()=>{stop();core.enterDictation();sync();save();panel.hidden=true;host.baseStart(d.identity.lessonId);}),button('📚 Chọn bài để học tiếp',view.prefix+'-next',()=>{stop();panel.hidden=true;old.xGo('catalog');}));
  }
  function open(current,saved=null){
    opening=true;
    // An explicit fresh start supersedes earlier generic sessions. Never delete
    // an unmarked legacy envelope; its original owner retains restoration.
    if(!saved)for(const key of practiceSessionKeys){const prior=read(host.session,key,null);if(prior&&(Object.hasOwn(prior,'resumeIdentity')||Object.hasOwn(prior,'coreState')))remove(key);}
    for(const e of document.querySelectorAll?.('#man-mixed-panel,#man-inference-panel,#man-b02-panel')||[])e.hidden=true;
    stop();if(panel)panel.hidden=true;d=current;view=presentation(d);panel=document.getElementById(view.panel);
    const history=read(host.local,view.history,[]),attempt=Array.isArray(history)?Math.max(0,...history.filter(x=>x.lesson_id===d.identity.lessonId&&x.lesson_asset_version===d.identity.lessonVersion).map(x=>x.attempt_index||0))+1:1;
    const instanceId=d.identity.lessonId+':'+now();core=createPracticeCore(d,{instanceId:saved?.instanceId||instanceId,attemptIndex:saved?.attemptIndex||attempt});
    wire={lessonId:d.identity.lessonId,lessonVersion:d.identity.lessonVersion,realizationId:d.identity.realizationId,phase:'listening',fullPlays:0,fullEnded:false,assisted:false,[view.counter]:0,events:[],answer:null};
    if(view.kind!=='context')wire.assetHashes=hashes(d);
    if(view.kind==='tasks')Object.assign(wire,{instanceId,attemptIndex:attempt,spanAnswers:d.speechTasks.map(()=>''),evidence:[]});
    if(saved){core.restore(saved.resumeIdentity,saved.coreState);wire=copy(saved.wire);
      const before=canonicalPracticeJSON(wire);sync();if(before!==canonicalPracticeJSON(wire))throw new TypeError('resume wire/core mismatch');
    }
    host.stopTranscript();host.stopTimer();remove(host.studyKey);
    document.getElementById('x-library-modal')?.classList.add('x-hidden');for(const id of ['dictation-app','summary-section','dictation-placeholder'])document.getElementById(id)?.classList.add('hidden');old.xGo('learn');render();save();opening=false;
  }
  // Resume envelope retains wire fields for existing consumers. Core state is
  // separate from host policy; no synthesis, legacy state migration or new auth.
  const handlers={
    xStartCatalog(id){const u=host.catalog().find(u=>u.id===id);let current;try{current=u?descriptor(u):null;}catch(_){stop();if(panel)panel.hidden=true;wire=null;return false;}if(current){open(current);return true;}stop();if(panel)panel.hidden=true;if(view)remove(view.key);wire=null;core=null;return captured.xStartCatalog(id);},
    xGo(v,options={}){stop();if(v!=='learn'){if(panel)panel.hidden=true;}return captured.xGo(v,options);},
    xRestoreStudy(){
      if(opening || wire && ['listening','complete'].includes(wire.phase) && panel && !panel.hidden)return true;
      if(w.location.hash!=='#learn')return false;
      // Legacy envelopes are delegated unchanged, never migrated or deleted here.
      const keys=[...new Set(host.catalog().filter(u=>u.practice).map(u=>{try{return presentation(descriptor(u)).key;}catch(_){return null;}}).filter(Boolean))];
      const candidates=keys.map(key=>read(host.session,key,null)).filter(s=>s&&(Object.hasOwn(s,'resumeIdentity')||Object.hasOwn(s,'coreState')));
      if(!candidates.length)return captured.xRestoreStudy();
      if(!restoring){restoring=true;const lifecycle=generation;host.loadCatalog().then(async()=>{
        if(disposed||lifecycle!==generation||w.location.hash!=='#learn')return;
        for(const saved of candidates)if(await api.restore(saved.lessonId))break;
      }).catch(()=>{}).finally(()=>{restoring=false;});}
      return true;
    },
    xSpeakTranscriptItem(index){if(!wire)return captured.xSpeakTranscriptItem(index);const item=host.items()?.[Number(index)],u=host.catalog().find(u=>u.id===item?.audio?.lessonId);let current;try{current=u?descriptor(u):null;}catch(_){return false;}if(!current?.playback.fullPanel)return old.xSpeakTranscriptItem(index);
      host.stopTranscript();host.transcript.begin();if(wire&&d.identity.lessonId===current.identity.lessonId&&current.playback.transcriptReplayAssisted){core.noteSupport('transcript');sync();event('TRANSCRIPT_FULL_PANEL_REPLAY',{evidence:'ASSISTED'});}
      const t=host.transcript.token(),lifecycle=generation;audio.play({audio:current.playback.fullPanel},host.rate(),()=>{if(disposed||lifecycle!==generation||t!==host.transcript.token())return;if(current.playback.transcriptRepeatSupported&&host.transcript.repeat())handlers.xSpeakTranscriptItem(0);else host.transcript.end();},()=>{if(!disposed&&lifecycle===generation&&t===host.transcript.token())host.transcript.fail(current.playback.transcriptReplayAssisted);});},
    xSyncTranscriptView(){if(!wire)return captured.xSyncTranscriptView();old.xSyncTranscriptView();if(host.items()?.[0]?.audio?.lessonId===d?.identity.lessonId&&d?.playback.transcriptRepeatSupported)host.transcript.label();},
    xOpenAudioReport(item){if(!wire)return captured.xOpenAudioReport(item);if(!item&&d?.playback.transcriptReplayAssisted&&host.items()?.[0]?.audio?.lessonId===d.identity.lessonId&&host.transcript.visible())item={audio:d.playback.fullPanel};return old.xOpenAudioReport(item);},
    playAudio(){if(!wire)return captured.playAudio();if(wire&&host.items()?.[host.currentIndex()]?.audio?.lessonId===d.identity.lessonId&&d.playback.dictationReplayAssisted){core.noteSupport('dictation');sync();event('DICTATION_CONTEXT_REPLAY',{segmentId:host.items()[host.currentIndex()].segmentId,evidence:'ASSISTED_DICTATION_NOT_COMPREHENSION_SCORE'});}return old.playAudio();}
  };
  for(const [k,f] of Object.entries(handlers))w[k]=f;
  const pop=()=>{if(!host.reference)stop();};w.addEventListener('popstate',pop);
  const api = {
    async restoreAvailable(){
      if(disposed||w.location.hash!=='#learn')return false;
      const lifecycle=generation;try{await host.loadCatalog();}catch(_){return false;}
      if(disposed)return false;
      for(const key of practiceSessionKeys){const saved=read(host.session,key,null);if(saved?.phase==='GENERIC_PRACTICE_V1'&&saved.resumeIdentity&&!host.catalog().some(u=>u.id===saved.lessonId))remove(key);}
      if(lifecycle!==generation||w.location.hash!=='#learn')return false;
      const keys=[...new Set(host.catalog().filter(u=>u.practice).map(u=>{try{return presentation(descriptor(u)).key;}catch(_){return null;}}).filter(Boolean))];
      for(const key of keys){const saved=read(host.session,key,null);if(saved&&(Object.hasOwn(saved,'resumeIdentity')||Object.hasOwn(saved,'coreState'))&&await api.restore(saved.lessonId))return true;}
      return false;
    },
    evidence:()=>wire?copy(wire):null,
    async restore(id){
      if(disposed)return false;
      const lifecycle=generation,all=await host.loadCatalog();if(disposed||lifecycle!==generation||w.location.hash!=='#learn')return false;const u=all.find(u=>u.id===id);let current;try{current=u?descriptor(u):null;}catch(_){return false;}if(!current)return false;
      const v=presentation(current),saved=read(host.session,v.key,null);
      // Host retains the current uid/age/hash/phase policy. Legacy envelopes
      // without a core identity remain owned by the unchanged legacy wrappers.
      if(!saved?.resumeIdentity||saved.phase!=='GENERIC_PRACTICE_V1'||saved.lessonId!==id||saved.lessonVersion!==current.identity.lessonVersion||saved.realizationId!==current.identity.realizationId||!Number.isFinite(saved.at)||!host.acceptResume({...saved,phase:saved.wire?.phase},v.kind!=='tasks'))return false;
      try {if(v.kind!=='context'&&canonicalPracticeJSON(saved.wire?.assetHashes)!==canonicalPracticeJSON(hashes(current)))throw new TypeError('resume wire assets');const probe=createPracticeCore(current,{instanceId:saved.instanceId||'resume',attemptIndex:saved.attemptIndex||1});probe.restore(saved.resumeIdentity,saved.coreState);if(!Array.isArray(saved.wire?.events)||saved.wire.events.some(e=>typeof e?.kind!=='string'))throw new TypeError('resume events');if(canonicalPracticeJSON(saved.wire)!==canonicalPracticeJSON({...saved.wire,lessonId:current.identity.lessonId,lessonVersion:current.identity.lessonVersion,realizationId:current.identity.realizationId}))throw new TypeError('wire identity');
        const snapshot=probe.snapshot(),projection=copy(saved.wire);
        for(const k of ['phase','fullPlays','fullEnded','assisted','answer','correct','responseAssisted'])if(Object.hasOwn(snapshot,k))projection[k]=snapshot[k];
        projection[v.counter]=snapshot.segmentReplays;
        if(v.kind==='tasks'){projection.spanAnswers=snapshot.spanAnswers;projection.evidence=snapshot.evidence;}
        if(canonicalPracticeJSON(projection)!==canonicalPracticeJSON(saved.wire))throw new TypeError('wire/core mismatch');
        open(current,saved);return true;}catch(_){remove(v.key);return false;}
    },
    dispose(){if(disposed)return;disposed=true;stop();if(panel)panel.hidden=true;for(const e of ownedPanels)e.remove?.();w.removeEventListener?.('popstate',pop);for(const [k,f]of Object.entries(handlers))if(w[k]===f)w[k]=captured[k];}
  };
  return api;
}
