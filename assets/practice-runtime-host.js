/* Learner IO ports. Policy copied from current
 * Practice wrappers; no auth ready/age/phase/storage policy invented here. */
export function practiceHost(c, baseStart = c.xStartCatalog) {
  return {
    window:c, document:c.document, audio:c.ManFixedAudio,
    session:c.sessionStorage, local:c.localStorage,
    now:()=>c.Date.now(), uid:()=>c.auth.currentUser?.uid||null,
    catalog:()=>c.catalogUnitsCache, loadCatalog:()=>c.loadCatalogUnits(),
    items:()=>c.items, currentIndex:()=>c.currentIndex,
    title:id=>c.catalogUnitsCache.find(u=>u.id===id)?.unitName,
    rate:()=>Number(c.document.getElementById('rate-select')?.value||1),
    cancelSpeech:()=>c.speechSynthesis?.cancel(),
    stopTranscript:()=>c.xStopTranscriptPlayback(), stopTimer:()=>c.stopStudyTimerAndSave(),
    studyKey:c.MAN_STUDY_KEY, baseStart,
    acceptResume:(s,requiresEvents)=>!!s&&s.uid===(c.auth.currentUser?.uid||null)&&!(c.Date.now()-s.at>12*60*60*1000)&&c.location.hash==='#learn'&&['listening','complete'].includes(s.phase)&&(!requiresEvents||Array.isArray(s.events)),
    transcript:{
      token:()=>c.xTranscriptToken,
      repeat:()=>c.document.getElementById('x-transcript-repeat')?.checked,
      begin(){c.xTranscriptCursor=0;c.xTranscriptPlaying=true;c.xTranscriptPaused=false;c.xSyncTranscriptView();++c.xTranscriptToken;},
      end(){c.xTranscriptPlaying=false;c.xTranscriptPaused=false;c.xSyncTranscriptView();},
      fail(showMessage){c.xTranscriptPlaying=false;c.xSyncTranscriptView();if(showMessage)c.document.getElementById('x-transcript-support').textContent='Audio chưa phát được. Bạn có thể thử lại hoặc báo lỗi.';},
      visible:()=>!c.document.getElementById('study-view-transcript').classList.contains('hidden'),
      label(){if(!c.xTranscriptPlaying&&!c.xTranscriptPaused)c.document.getElementById('x-transcript-play').textContent='▶ Phát cả cuộc thảo luận';}
    }
  };
}
