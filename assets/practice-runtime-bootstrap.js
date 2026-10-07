import { practiceHost } from './practice-runtime-host.js';
import { installPracticeWrapper, practiceSessionKeys } from './practice-runtime-wrapper.js';
// Fail closed before the unchanged legacy DOMContentLoaded listeners run.
// Only malformed marked generic envelopes are removed; legacy data is untouched.
for(const key of practiceSessionKeys){
 try{const saved=JSON.parse(sessionStorage.getItem(key)||'null');
  if(saved&&(Object.hasOwn(saved,'resumeIdentity')||Object.hasOwn(saved,'coreState'))&&saved.phase!=='GENERIC_PRACTICE_V1')sessionStorage.removeItem(key);
 }catch(_){}
}
const ports={};
for(const k of ["document","ManFixedAudio","sessionStorage","localStorage","Date","loadCatalogUnits","speechSynthesis","xStopTranscriptPlayback","stopStudyTimerAndSave","xSyncTranscriptView","location"])Object.defineProperty(ports,k,{get:()=>window[k]});
Object.defineProperties(ports,{
 catalogUnitsCache:{get:()=>catalogUnitsCache},auth:{get:()=>auth},items:{get:()=>items},currentIndex:{get:()=>currentIndex},MAN_STUDY_KEY:{get:()=>MAN_STUDY_KEY},
 xTranscriptToken:{get:()=>xTranscriptToken,set:v=>{xTranscriptToken=v}},xTranscriptCursor:{get:()=>xTranscriptCursor,set:v=>{xTranscriptCursor=v}},xTranscriptPlaying:{get:()=>xTranscriptPlaying,set:v=>{xTranscriptPlaying=v}},xTranscriptPaused:{get:()=>xTranscriptPaused,set:v=>{xTranscriptPaused=v}}
});
const host=practiceHost(ports,ManPracticeReference.xStartCatalog);
host.window=window;host.reference=ManPracticeReference;
window.ManGenericPractice=installPracticeWrapper(host);
const restorePractice=()=>{if(location.hash==='#learn')window.ManGenericPractice.restoreAvailable();};
if(document.readyState==='complete')restorePractice();else document.addEventListener('DOMContentLoaded',restorePractice,{once:true});
