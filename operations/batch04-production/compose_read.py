"""Reuse finite source receipts and compose the inherited mixed C2 timeline; no synthesis."""
import pathlib,json,hashlib,wave,array,importlib.util
import numpy as np
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
from pocketsphinx import Decoder,get_model_path
root=pathlib.Path('retained-final');ledger=json.loads((root/'producer-evidence/production-ledger.json').read_text());qa=json.loads((root/'batch04-qa/ordinary-qa.json').read_text());assert ledger['batch_id']=='BATCH_04' and ledger['completed_segments']==12 and ledger['selected_lesson_ids']==['MAN-0951']
prepared=json.loads(pathlib.Path('operations/batch04-production/prepared-segments.json').read_text())['segments'];rows=[];metadata=[]
for e in ledger['entries']:
 p=root/'producer-evidence'/e['lesson_id']/e['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==e['sha256'];s=next(s for s in prepared if(s['lesson_id'],s['segment_id'])==(e['lesson_id'],e['segment_id']))
 rows.append({'segment_id':e['segment_id'],'file':e['lesson_id']+'/'+e['file'],'sha256':e['sha256'],'text':s['text']});metadata.append({k:e[k] for k in ['lesson_id','segment_id','sha256','input_sha256','instructions_sha256','duration_seconds','file','voice']})
print('RETAINED_FINAL_METADATA_JSON='+json.dumps(metadata,separators=(',',':')),flush=True);print('RETAINED_FINAL_QA_JSON='+json.dumps(qa,separators=(',',':')),flush=True)
p=root/'batch04-qa/secondary-qa.json'
if p.exists():print('RETAINED_FINAL_SECONDARY_JSON='+json.dumps(json.loads(p.read_text()),separators=(',',':')),flush=True)
spec=importlib.util.spec_from_file_location('composer','operations/batch02-producer/compose_release.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
out=pathlib.Path('batch04-mixed');m=mod.compose({'lessons':[{'lesson_id':'MAN-0951','lesson_asset_version':'v0.1','segments':rows}]},root/'producer-evidence',out,lesson_id='MAN-0951',realization_id='MAN-0951-MIXED-v0.1',segment_ids=tuple(x['segment_id'] for x in rows),overlap_before=('S006',))
with wave.open(str(out/m['file'])) as w:rate=w.getframerate();pcm=w.readframes(w.getnframes());x=np.frombuffer(pcm,'<i2').astype(float)/32768
contexts=[]
for s in m['segments']:
 p=out/('MAN-0951-'+s['segment_id']+'-mixed-context-v0.1.wav');lo,hi=s['context_start'],s['context_end']
 with wave.open(str(p),'wb') as w:w.setparams((1,2,rate,0,'NONE','not compressed'));w.writeframes(pcm[lo*2:hi*2])
 contexts.append({'segment_id':s['segment_id'],'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'duration_seconds':(hi-lo)/rate,'start_ms':round(s['start']*1000/rate),'end_ms':round(s['end']*1000/rate),'context_start_ms':round(lo*1000/rate),'context_end_ms':round(hi*1000/rate),'source_sha256':s['source_sha256']})
model=WhisperModel('small.en',device='cpu',compute_type='int8',download_root='ordinary-audio-qa-model',num_workers=1);segments,_=model.transcribe(resample_poly(x,2,3).astype(np.float32),language='en',beam_size=5,word_timestamps=True,condition_on_previous_text=False);segments=list(segments);m['mixed_unprompted_asr']=' '.join(s.text.strip() for s in segments);m['mixed_asr_model']='faster-whisper-small.en';m['reference_prompt_supplied']=False;m['contexts']=contexts
(out/'mixed-evidence.json').write_text(json.dumps(m,indent=2)+'\n');print('MIXED_EVIDENCE_JSON='+json.dumps(m,separators=(',',':')),flush=True)
# Newly required bounded adjudication only; retained full QA remains reused.
r=pathlib.Path('retained-second');secondary=json.loads((r/'batch04-qa/secondary-qa.json').read_text());original=json.loads((r/'batch04-qa/ordinary-qa.json').read_text());source=json.loads((r/'producer-evidence/production-ledger.json').read_text());checks=[]
for sid in ['S001','S007']:
 e=next(z for z in source['entries'] if(z['lesson_id'],z['segment_id'])==('MAN-0831',sid));p=r/'producer-evidence'/'MAN-0831'/e['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==e['sha256']
 with wave.open(str(p)) as w:sr=w.getframerate();v=np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(float)/32768
 raw=(resample_poly(v,2,3).clip(-1,1)*32767).astype('<i2').tobytes();phones=[];mp=pathlib.Path(get_model_path())
 for lm in [None,str(mp/'en-us/en-us-phone.lm.bin')]:
  dec=Decoder(lm=None,loglevel='ERROR',beam=1e-20,pbeam=1e-20,lw=2.0);dec.add_allphone_file('p',lm);dec.activate_search('p');dec.start_utt();dec.process_raw(raw,full_utt=True);dec.end_utt();phones.append({'method':'UNIFORM' if lm is None else 'PHONE_LM','reference_text_supplied':False,'phones':[{'phone':z.word,'start':z.start_frame/100,'end':(z.end_frame+1)/100} for z in dec.seg()]})
 checks.append({'lesson_id':'MAN-0831','segment_id':sid,'sha256':e['sha256'],'primary':next(z for z in original['rows'] if(z['lesson_id'],z['segment_id'])==('MAN-0831',sid)),'secondary':next(z for z in secondary['rows'] if(z['lesson_id'],z['segment_id'])==('MAN-0831',sid)),'phoneme_hypotheses':phones,'certification_claimed':False})
print('UNRESOLVED_CUES_JSON='+json.dumps(checks,separators=(',',':')),flush=True)
