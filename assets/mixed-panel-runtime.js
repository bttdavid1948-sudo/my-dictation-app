/* Exact Practice-approved mixed timeline. No synthesis and no overlap mastery. */
(function () {
  const KEY = 'man_mixed_panel_v1', HISTORY = 'man_comprehension_history_v1';
  const ID = 'MAN-0844', REALIZATION = 'MAN-0844-MIXED-v0.1';
  let lesson = null, state = null, panel = null, playbackToken = 0;
  const oldStart = window.xStartCatalog, oldGo = window.xGo;
  const choices = [
    'Ghi nhận mối liên hệ, cân nhắc hai rủi ro và thử một nghiên cứu theo dõi nhỏ.',
    'Đã chứng minh chỉ dấu gây ra sự hồi phục, nên đổi phác đồ cho tất cả bệnh nhân.',
    'Chưa biết cơ chế, nên bỏ qua hoàn toàn chỉ dấu và không nghiên cứu thêm.'
  ];
  const role = {moderator:'người điều phối', researcher:'nhà nghiên cứu', clinician:'bác sĩ'};
  function valid(u) { return u?.id === ID && u.status === 'published' && u.version === 'v0.1' && u.audioRealizationRef === REALIZATION && u.fullPanelAudio?.sha256 === '96d5e7130a1b69164ccad1b1ef19d3c3fb4d2e37a8fb698c94e85acdb273a5dc'; }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify({ ...state, uid: auth.currentUser?.uid || null, at: Date.now() })); } catch (_) {} }
  function event(kind, detail = {}) { if (!state) return; state.events.push({kind, ...detail}); save(); }
  function fullItem() { return {audio: lesson.fullPanelAudio}; }
  function button(text, id, action) { const b=document.createElement('button'); b.type='button'; b.className='btn'; b.textContent=text; b.id=id; b.addEventListener('click',action); return b; }
  function text(tag, content, parent) { const e=document.createElement(tag); e.textContent=content; parent.append(e); return e; }
  function stop() { ++playbackToken; ManFixedAudio.stop(); }
  function play(item, kind) {
    stop(); if ('speechSynthesis' in window) speechSynthesis.cancel();
    const token=playbackToken, rate=Number(document.getElementById('rate-select')?.value || 1);
    if (kind==='full') {
      state.fullPlays++;
      if (state.fullPlays>1 || rate!==1) state.assisted=true;
    } else { state.assisted=true; state.contextReplays++; }
    event(kind==='full'?'FULL_PANEL_PLAY':'CONTEXT_PRESERVING_REPLAY', {segmentId:item.audio.segmentId,sha256:item.audio.sha256,rate,evidence:kind==='full'?'FULL_CONTEXT':'ASSISTED'});
    const status=panel.querySelector('#man-panel-status');status.textContent=kind==='full'?'Đang nghe cả cuộc thảo luận…':'Đang nghe lại lượt nói cùng bối cảnh…';
    ManFixedAudio.play(item,rate,()=>{
      if(token!==playbackToken)return;
      event('PLAYBACK_ENDED',{segmentId:item.audio.segmentId});
      if(kind==='full'){state.fullEnded=true;save();render();}
      else status.textContent='Đã nghe lại. Bạn có thể trả lời khi sẵn sàng.';
    },()=>{if(token===playbackToken){event('PLAYBACK_FAILED',{segmentId:item.audio.segmentId});status.textContent='Audio chưa phát được. Bạn có thể thử lại hoặc báo lỗi.';}});
  }
  function render() {
    if(!panel){panel=document.createElement('section');panel.id='man-mixed-panel';panel.className='x-panel';document.getElementById('x-learn-slot').prepend(panel);}
    panel.hidden=false; panel.replaceChildren();panel.style.cssText='padding:24px;max-width:860px;margin:0 auto 20px;overflow-wrap:anywhere';
    text('h2',lesson.unitName,panel);
    text('p','Nghe cả cuộc thảo luận trước, rồi chọn cách hiểu ý chính. Khi nghe lại một lượt nói, bạn vẫn nghe được lời của người bên cạnh.',panel);
    text('p','Giọng đọc do AI tạo. Bạn có thể báo lỗi để Mặn sửa đúng phiên bản.',panel);
    const controls=document.createElement('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:10px';panel.append(controls);
    controls.append(button('▶ Nghe cả cuộc thảo luận','man-panel-play',()=>play(fullItem(),'full')),
      button('⏹ Dừng','man-panel-stop',()=>{stop();textStatus('Đã dừng. Bấm nghe lại khi bạn sẵn sàng.');}),
      button('🔊 Âm thanh có vấn đề?','man-panel-report',()=>xOpenAudioReport(fullItem())));
    const status=text('p',state.fullEnded?'Đã nghe hết cuộc thảo luận. Chọn cách hiểu của bạn bên dưới.':'Bấm nghe trước nhé; chưa cần nhìn bản chép.',panel);status.id='man-panel-status';status.setAttribute('role','status');
    if(!state.fullEnded)return;
    const replay=document.createElement('div');replay.style.cssText='display:flex;flex-wrap:wrap;gap:8px';panel.append(replay);
    lesson.items.forEach((it,i)=>replay.append(button(`↻ Lượt ${i+1}: ${role[it.speakerRole]}`,'man-panel-replay-'+it.segmentId,()=>play(it,'context'))));
    const form=document.createElement('form');form.id='man-panel-answer';form.style.marginTop='20px';panel.append(form);
    text('h3','Cách hiểu nào phù hợp nhất với lập luận của nhóm?',form);
    choices.forEach((label,i)=>{
      const row=document.createElement('label');row.style.cssText='display:flex;align-items:flex-start;gap:10px;padding:12px 0;cursor:pointer';
      const input=document.createElement('input');input.type='radio';input.name='panel-answer';input.value=String(i);input.required=true;input.checked=state.answer===i;input.disabled=state.phase==='complete';
      const span=document.createElement('span');span.textContent=label;row.append(input,span);form.append(row);
    });
    if(state.phase!=='complete'){
      const submit=document.createElement('button');submit.type='submit';submit.id='man-panel-submit';submit.className='x-primary';submit.textContent='Xem phản hồi';form.append(submit);
      form.addEventListener('submit',e=>{e.preventDefault();const selected=form.querySelector('input:checked');if(!selected)return;stop();state.answer=Number(selected.value);state.phase='complete';state.correct=state.answer===0;state.responseAssisted=state.assisted;state.completedAt=Date.now();event('COMPREHENSION_RESPONSE',{correct:state.correct,evidence:state.responseAssisted?'ASSISTED':'FULL_CONTEXT_FIRST_PASS'});
        try{const history=JSON.parse(localStorage.getItem(HISTORY)||'[]');history.push({at:state.completedAt,lessonId:ID,lessonVersion:'v0.1',realizationId:REALIZATION,construct:'DISCOURSE_STRUCTURE_AND_DETAIL',correct:state.correct,assisted:state.assisted,contextReplays:state.contextReplays,calibrated:false});localStorage.setItem(HISTORY,JSON.stringify(history.slice(-60)));}catch(_){}
        render();});
    }else{
      const result=document.createElement('div');result.id='man-panel-result';result.setAttribute('role','status');panel.append(result);
      text('h3','Bạn vừa làm được gì?',result);
      text('p',state.correct?'Bạn đã chọn đúng ý chính của cuộc thảo luận.':'Ý chính còn chạy mất một chút. Cùng xem lại lập luận nhé.',result);
      text('p',lesson.practice.referenceAnswer,result);
      text('p',state.responseAssisted?'Bạn đã dùng hỗ trợ nghe lại hoặc nghe chậm; lần này được ghi nhận là luyện có hỗ trợ.':'Bạn đã trả lời sau một lượt nghe cả cuộc thảo luận.',result);
      text('p','Đây là phản hồi cho lần luyện hiểu nội dung này. Kết quả chính tả khi luyện thêm được ghi riêng.',result);
      result.append(button('✍️ Luyện chính tả các lượt nói','man-panel-dictation',()=>{stop();state.phase='dictation';save();panel.hidden=true;oldStart(ID);}),
        button('📚 Chọn bài để học tiếp','man-panel-next',()=>{stop();panel.hidden=true;oldGo('catalog');}));
    }
  }
  function textStatus(s){const el=panel?.querySelector('#man-panel-status');if(el)el.textContent=s;}
  function open(u, saved=null) {
    stop();lesson=u;state=saved||{lessonId:ID,lessonVersion:'v0.1',realizationId:REALIZATION,phase:'listening',fullPlays:0,fullEnded:false,assisted:false,contextReplays:0,events:[],answer:null};
    xStopTranscriptPlayback();stopStudyTimerAndSave();
    try{sessionStorage.removeItem(MAN_STUDY_KEY);}catch(_){}
    document.getElementById('x-library-modal')?.classList.add('x-hidden');
    document.getElementById('dictation-app')?.classList.add('hidden');document.getElementById('summary-section')?.classList.add('hidden');document.getElementById('dictation-placeholder')?.classList.add('hidden');
    oldGo('learn');render();save();
  }
  window.xStartCatalog=function(id){const u=catalogUnitsCache.find(x=>x.id===id);if(valid(u))return open(u);stop();if(panel)panel.hidden=true;state=null;try{sessionStorage.removeItem(KEY);}catch(_){}return oldStart(id);};
  window.xGo=function(view,options={}){if(view!=='learn'){stop();if(panel)panel.hidden=true;}return oldGo(view,options);};
  // Full Transcript uses the one continuous panel, never concatenated context clips.
  const oldSpeak=window.xSpeakTranscriptItem;
  window.xSpeakTranscriptItem=function(index){
    const item=items?.[Number(index)];if(item?.audio?.realizationId!==REALIZATION)return oldSpeak(index);
    const u=catalogUnitsCache.find(x=>x.id===ID);if(!valid(u))return;
    xStopTranscriptPlayback();xTranscriptCursor=0;xTranscriptPlaying=true;xTranscriptPaused=false;xSyncTranscriptView();
    const token=++xTranscriptToken;if(state){state.assisted=true;event('TRANSCRIPT_FULL_PANEL_REPLAY',{evidence:'ASSISTED'});}
    ManFixedAudio.play({audio:u.fullPanelAudio},Number(document.getElementById('rate-select').value)||1,()=>{
      if(token!==xTranscriptToken)return;
      if(document.getElementById('x-transcript-repeat')?.checked)xSpeakTranscriptItem(0);
      else{xTranscriptPlaying=false;xTranscriptPaused=false;xSyncTranscriptView();}
    },()=>{if(token===xTranscriptToken){xTranscriptPlaying=false;xSyncTranscriptView();document.getElementById('x-transcript-support').textContent='Audio chưa phát được. Bạn có thể thử lại hoặc báo lỗi.';}});
  };
  const oldSync=window.xSyncTranscriptView;
  window.xSyncTranscriptView=function(){oldSync();if(items?.[0]?.audio?.realizationId===REALIZATION&&!xTranscriptPlaying&&!xTranscriptPaused)document.getElementById('x-transcript-play').textContent='▶ Phát cả cuộc thảo luận';};
  const oldReport=window.xOpenAudioReport;
  window.xOpenAudioReport=function(item){if(!item&&items?.[0]?.audio?.realizationId===REALIZATION&&!document.getElementById('study-view-transcript').classList.contains('hidden')){const u=catalogUnitsCache.find(x=>x.id===ID);if(valid(u))item={audio:u.fullPanelAudio};}return oldReport(item);};
  const oldPlay=window.playAudio;
  window.playAudio=function(){if(state&&items?.[currentIndex]?.audio?.realizationId===REALIZATION){state.assisted=true;event('DICTATION_CONTEXT_REPLAY',{segmentId:items[currentIndex].segmentId,evidence:'ASSISTED_DICTATION_NOT_COMPREHENSION_SCORE'});}return oldPlay();};
  // A depublished lesson cannot be revived from a cached study session.
  const oldRestore=window.xRestoreStudy;let restorePending=false;
  window.xRestoreStudy=function(){
    let saved;try{saved=JSON.parse(sessionStorage.getItem(MAN_STUDY_KEY)||'null');}catch(_){}
    if(saved?.items?.[0]?.audio?.realizationId!==REALIZATION)return oldRestore();
    if(!restorePending){restorePending=true;loadCatalogUnits().then(all=>{
      restorePending=false;
      if(valid(all.find(x=>x.id===ID)))oldRestore();
      else{try{sessionStorage.removeItem(MAN_STUDY_KEY);}catch(_){}document.getElementById('dictation-placeholder')?.classList.remove('hidden');}
    });}
    return true;
  };
  window.ManMixedPanel={evidence:()=>state?JSON.parse(JSON.stringify(state)):null};
  window.addEventListener('popstate',()=>{stop();});
  document.addEventListener('DOMContentLoaded',async()=>{
    let saved;try{saved=JSON.parse(sessionStorage.getItem(KEY)||'null');}catch(_){}
    if(!saved||saved.realizationId!==REALIZATION||saved.uid!==(auth.currentUser?.uid||null)||Date.now()-saved.at>12*60*60*1000||location.hash!=='#learn'||!['listening','complete'].includes(saved.phase)||!Array.isArray(saved.events))return;
    const all=await loadCatalogUnits(),u=all.find(x=>x.id===ID);if(valid(u))open(u,saved);
  });
})();
