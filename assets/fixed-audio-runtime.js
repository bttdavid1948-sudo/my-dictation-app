/* Paid synthesis is operations-only. This client plays immutable released files. */
(function (global) {
  let player = null, generation = 0, lastContext = null;
  const categories = ['Không phát được', 'Thiếu hoặc ngắt câu', 'Đọc sai hoặc khó nghe', 'Giọng không nhất quán', 'Vấn đề khác'];
  function context(item, runtime = {}) {
    const a = item?.audio;
    if (!a || a.releaseClass !== 'CONTROLLED_INTERNAL_RELEASE' || !a.lessonId || !a.segmentId || !a.realizationId || !a.sha256) return null;
    return {lessonId:a.lessonId,lessonVersion:a.lessonVersion,segmentId:a.segmentId,
      realizationId:a.realizationId,realizationVersion:a.realizationVersion,
      profileRef:a.profileRef,assetSha256:a.sha256,deliveryMode:'PERSISTED_ASSET',
      userAgent:(global.navigator?.userAgent||'').slice(0,300),viewport:`${global.innerWidth||0}x${global.innerHeight||0}`,
      playbackRate:runtime.rate||1,playbackState:runtime.state||'not_played',currentTime:runtime.currentTime||0};
  }
  function stop() { ++generation; if (player) { player.pause(); player.removeAttribute('src'); player.load(); player.remove?.(); player = null; } }
  function play(item, rate, ended, failed) {
    const c = context(item,{rate,state:'loading'});
    if (!c) { if(item?.audio){failed?.();return true;}return false; }
    stop(); const token=generation;
    const url=new URL(item.audio.url,global.location.href);
    if(url.origin!==global.location.origin || !url.pathname.includes('/assets/audio/')) {lastContext={...c,playbackState:'invalid_asset_url'};failed?.();return true;}
    const audio=player=new global.Audio(url.href);audio.id='man-fixed-audio-player';audio.hidden=true;audio.dataset&&(audio.dataset.realizationId=c.realizationId,audio.dataset.segmentId=c.segmentId,audio.dataset.assetSha256=c.assetSha256);global.document?.body.append(audio);audio.playbackRate=Math.max(.2,Math.min(2,Number(rate)||1));
    lastContext=c;
    audio.onplaying=()=>{if(token===generation)lastContext={...c,playbackState:'playing'};};
    audio.onended=()=>{if(token===generation){lastContext={...c,playbackState:'ended',currentTime:audio.currentTime};ended?.();}};
    audio.onerror=()=>{if(token===generation){lastContext={...c,playbackState:'failed',mediaErrorCode:audio.error?.code||0};failed?.();}};
    audio.play().catch(()=>{if(token===generation){lastContext={...c,playbackState:'play_rejected'};failed?.();}});
    return true;
  }
  function reportContext(item, rate) {
    const c=context(item,{rate});
    if(!c)return null;
    if(lastContext?.assetSha256===c.assetSha256){return {...c,...lastContext,playbackState:player?.paused&&lastContext.playbackState==='playing'?'paused':lastContext.playbackState,currentTime:player?.currentTime||lastContext.currentTime||0};}
    return c;
  }
  function noteFallback(item,voice,rate) {const c=context(item,{rate,state:'browser_fallback_requested'});if(c)lastContext={...c,actualDeliveryMode:'RUNTIME_RENDERED',fallbackVoice:String(voice||'default').slice(0,100)};}
  function reportMessage(category,c,note='') {
    if(!categories.includes(category)||!c)return null;
    // Use existing feedback contract: no Rules or collection changes, no transcript/learner answer.
    const message=JSON.stringify({type:'audio_problem',schemaVersion:1,category,context:c,note:String(note).slice(0,180)});
    return message.length<=1500?message:null;
  }
  global.ManFixedAudio={play,stop,pause:()=>player?.pause(),resume:()=>player?.play().catch(()=>{}),noteFallback,context,reportContext,reportMessage,categories};
})(typeof window==='undefined'?globalThis:window);
