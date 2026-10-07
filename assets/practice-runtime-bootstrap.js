import { practiceHost } from './practice-runtime-host.js';
import { installPracticeWrapper } from './practice-runtime-wrapper.js';
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
