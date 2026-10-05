/* Two exact Practice-approved inference lessons; cached fixed WAV playback only. */
(function () {
  const KEY='man_final_two_practice_v1', HISTORY='man_comprehension_history_v1';
  const PAIRS={'MAN-0565':'MAN-0565-OPENAI-FIXED-v0.1','MAN-0905':'MAN-0905-OPENAI-FIXED-v0.1'};
  let lesson=null,state=null,panel=null,token=0;
  const oldStart=window.xStartCatalog,oldGo=window.xGo;
  function bindings(u){return u.items.map(i=>i.audio.sha256);}
  function valid(u){return !!u&&u.status==='published'&&u.version==='v0.1'&&u.audioRealizationRef===PAIRS[u.id]&&u.practice?.speechCondition==='TRANSFER_VARIATION_CONDITION'&&u.items.length===(u.id==='MAN-0565'?6:7)&&u.items.every((it,i)=>it.segmentId===`S${String(i+1).padStart(3,'0')}`&&it.audio.lessonId===u.id&&it.audio.lessonVersion==='v0.1'&&it.audio.realizationId===PAIRS[u.id]&&/^[a-f0-9]{64}$/.test(it.audio.sha256));}
  function save(){try{sessionStorage.setItem(KEY,JSON.stringify({...state,uid:auth.currentUser?.uid||null,at:Date.now()}));}catch(_) {}}
  function event(kind,detail={}){if(state){state.events.push({kind,...detail});save();}}
  function stop(){++token;ManFixedAudio.stop();}
  function text(tag,content,parent){const e=document.createElement(tag);e.textContent=content;parent.append(e);return e;}
  function button(label,id,action){const b=document.createElement('button');b.type='button';b.className='btn';b.id=id;b.textContent=label;b.addEventListener('click',action);return b;}
  function status(message){const e=panel?.querySelector('#man-inference-status');if(e)e.textContent=message;}
  function play(replayIndex=null){
    stop();if('speechSynthesis' in window)speechSynthesis.cancel();const myToken=token;
    const rate=Number(document.getElementById('rate-select')?.value||1);
    if(replayIndex===null){state.fullPlays++;if(state.fullPlays>1||rate!==1)state.assisted=true;event('FULL_DISCUSSION_PLAY',{rate,evidence:'FULL_CONTEXT'});}
    else{state.assisted=true;state.segmentReplays++;event('SEGMENT_REPLAY',{segmentId:lesson.items[replayIndex].segmentId,evidence:'ASSISTED'});}
    const sequence=replayIndex===null?lesson.items:[lesson.items[replayIndex]];
    function next(i){if(myToken!==token)return;
      if(i===sequence.length){if(replayIndex===null){state.fullEnded=true;event('FULL_DISCUSSION_ENDED');render();}else status('Đã nghe lại. Bạn có thể trả lời khi sẵn sàng.');return;}
      const item=sequence[i];status(`Đang nghe lượt ${i+1}/${sequence.length}…`);
      event('FIXED_SEGMENT_PLAY',{segmentId:item.segmentId,sha256:item.audio.sha256,rate});
      ManFixedAudio.play(item,rate,()=>{if(myToken===token){event('PLAYBACK_ENDED',{segmentId:item.segmentId});next(i+1);}},()=>{if(myToken===token){event('PLAYBACK_FAILED',{segmentId:item.segmentId});status('Audio chưa phát được. Bạn có thể thử lại hoặc báo lỗi.');}});
    }next(0);
  }
  function render(){
    if(!panel){panel=document.createElement('section');panel.id='man-inference-panel';panel.className='x-panel';document.getElementById('x-learn-slot').prepend(panel);}
    panel.hidden=false;panel.replaceChildren();panel.style.cssText='padding:24px;max-width:860px;margin:0 auto 20px;overflow-wrap:anywhere';
    const css=document.createElement('style');css.textContent='#man-inference-panel button,#man-inference-panel input{scroll-margin-top:110px;scroll-margin-bottom:130px}';panel.append(css);
    text('h2',lesson.unitName,panel);text('p','Nghe cuộc thảo luận trước, rồi chọn kết luận phù hợp nhất. Bạn có thể nghe lại từng lượt khi cần.',panel);
    text('p','Giọng đọc do AI tạo. Bạn có thể báo lỗi để Mặn sửa đúng phiên bản.',panel);
    const controls=document.createElement('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:10px';panel.append(controls);
    controls.append(button('▶ Nghe cả cuộc thảo luận','man-inference-play',()=>play()),button('⏹ Dừng','man-inference-stop',()=>{stop();status('Đã dừng. Bấm nghe lại khi sẵn sàng.');}));
    const message=text('p',state.fullEnded?'Đã nghe hết. Chọn kết luận của bạn bên dưới.':'Bấm nghe trước nhé; chưa cần nhìn bản chép.',panel);message.id='man-inference-status';message.setAttribute('role','status');
    if(!state.fullEnded)return;
    const replay=document.createElement('div');replay.style.cssText='display:flex;flex-wrap:wrap;gap:8px';panel.append(replay);
    lesson.items.forEach((it,i)=>replay.append(button(`↻ Lượt ${i+1}`,'man-inference-replay-'+it.segmentId,()=>play(i)),button(`Báo audio lượt ${i+1}`,'man-inference-report-'+it.segmentId,()=>xOpenAudioReport(it))));
    const form=document.createElement('form');form.id='man-inference-answer';form.style.marginTop='20px';panel.append(form);text('h3','Kết luận nào phù hợp nhất với lập luận?',form);
    lesson.practice.choices.forEach((label,i)=>{const row=document.createElement('label');row.style.cssText='display:flex;align-items:flex-start;gap:10px;padding:12px 0;cursor:pointer';const input=document.createElement('input');input.type='radio';input.name='inference-answer';input.value=String(i);input.required=true;input.checked=state.answer===i;input.disabled=state.phase==='complete';const span=document.createElement('span');span.textContent=label;row.append(input,span);form.append(row);});
    if(state.phase!=='complete'){
      const submit=document.createElement('button');submit.type='submit';submit.className='x-primary';submit.id='man-inference-submit';submit.textContent='Xem phản hồi';form.append(submit);
      form.addEventListener('submit',e=>{e.preventDefault();const answer=form.querySelector('input:checked');if(!answer)return;stop();state.answer=Number(answer.value);state.correct=state.answer===lesson.practice.correctChoice;state.phase='complete';state.responseAssisted=state.assisted;state.completedAt=Date.now();event('INFERENCE_RESPONSE',{correct:state.correct,evidence:state.assisted?'ASSISTED':'FULL_CONTEXT_FIRST_PASS'});
        try{const history=JSON.parse(localStorage.getItem(HISTORY)||'[]');history.push({at:state.completedAt,lessonId:lesson.id,lessonVersion:'v0.1',realizationId:lesson.audioRealizationRef,construct:lesson.practice.construct,correct:state.correct,assisted:state.assisted,segmentReplays:state.segmentReplays,calibrated:false});localStorage.setItem(HISTORY,JSON.stringify(history.slice(-60)));}catch(_){}render();});
    }else{
      const result=document.createElement('div');result.id='man-inference-result';result.setAttribute('role','status');panel.append(result);text('h3','Bạn vừa làm được gì?',result);
      text('p',state.correct?'Bạn đã chọn đúng kết luận của cuộc thảo luận.':'Kết luận còn chạy mất một chút. Cùng xem lại lập luận nhé.',result);text('p',lesson.practice.referenceAnswer,result);
      text('p',state.responseAssisted?'Bạn đã dùng nghe lại hoặc nghe chậm; lần luyện này được ghi nhận có hỗ trợ.':'Bạn đã trả lời sau một lượt nghe cả cuộc thảo luận.',result);
      text('p','Kết quả này ghi nhận lần luyện hiểu nội dung. Kết quả chính tả được ghi riêng.',result);
      result.append(button('✍️ Luyện chính tả các lượt nói','man-inference-dictation',()=>{stop();state.phase='dictation';save();panel.hidden=true;oldStart(lesson.id);}),button('📚 Chọn bài để học tiếp','man-inference-next',()=>{stop();panel.hidden=true;oldGo('catalog');}));
    }
  }
  function open(u,saved=null){stop();lesson=u;state=saved||{lessonId:u.id,lessonVersion:'v0.1',realizationId:u.audioRealizationRef,assetHashes:bindings(u),phase:'listening',fullPlays:0,fullEnded:false,assisted:false,segmentReplays:0,events:[],answer:null};xStopTranscriptPlayback();stopStudyTimerAndSave();try{sessionStorage.removeItem(MAN_STUDY_KEY);}catch(_){}
    document.getElementById('x-library-modal')?.classList.add('x-hidden');document.getElementById('dictation-app')?.classList.add('hidden');document.getElementById('summary-section')?.classList.add('hidden');document.getElementById('dictation-placeholder')?.classList.add('hidden');oldGo('learn');render();save();}
  window.xStartCatalog=function(id){const u=catalogUnitsCache.find(x=>x.id===id);if(valid(u))return open(u);stop();if(panel)panel.hidden=true;state=null;try{sessionStorage.removeItem(KEY);}catch(_){}return oldStart(id);};
  window.xGo=function(view,options={}){if(view!=='learn'){stop();if(panel)panel.hidden=true;}return oldGo(view,options);};
  const oldRestore=window.xRestoreStudy;let restoring=false;
  window.xRestoreStudy=function(){let saved;try{saved=JSON.parse(sessionStorage.getItem(MAN_STUDY_KEY)||'null');}catch(_){}
    const audio=saved?.items?.[0]?.audio;if(!Object.values(PAIRS).includes(audio?.realizationId))return oldRestore();
    if(!restoring){restoring=true;loadCatalogUnits().then(all=>{restoring=false;const u=all.find(x=>x.id===audio.lessonId);if(valid(u)&&JSON.stringify(saved.items.map(i=>i.audio.sha256))===JSON.stringify(bindings(u)))oldRestore();else{try{sessionStorage.removeItem(MAN_STUDY_KEY);}catch(_){}document.getElementById('dictation-placeholder')?.classList.remove('hidden');}});}return true;};
  window.ManFinalTwoPractice={evidence:()=>state?JSON.parse(JSON.stringify(state)):null};
  window.addEventListener('popstate',()=>stop());
  document.addEventListener('DOMContentLoaded',async()=>{let saved;try{saved=JSON.parse(sessionStorage.getItem(KEY)||'null');}catch(_){}
    if(!saved||saved.realizationId!==PAIRS[saved.lessonId]||saved.uid!==(auth.currentUser?.uid||null)||Date.now()-saved.at>12*60*60*1000||location.hash!=='#learn'||!['listening','complete'].includes(saved.phase)||!Array.isArray(saved.events))return;
    const all=await loadCatalogUnits(),u=all.find(x=>x.id===saved.lessonId);if(valid(u)&&JSON.stringify(saved.assetHashes)===JSON.stringify(bindings(u)))open(u,saved);else{try{sessionStorage.removeItem(KEY);}catch(_) {}}
  });
})();
