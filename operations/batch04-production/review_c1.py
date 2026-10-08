"""Bounded alternate recognizer and PCM cue adjudication on two flagged C1 repairs."""
import pathlib,json,hashlib,wave
import numpy as np
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
from pocketsphinx import Decoder,get_model_path
model=WhisperModel('medium.en',device='cpu',compute_type='int8',download_root='ordinary-audio-qa-model');checks=[]
for sid in ['S001','S007']:
 root=pathlib.Path('retained-c1/producer-evidence/c1')/sid;e=json.loads((root/'targeted-repair.json').read_text());p=root/e['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==e['sha256']
 with wave.open(str(p)) as w:a=np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(float)/32768
 x=resample_poly(a,2,3).astype(np.float32);segments,_=model.transcribe(x,language='en',beam_size=5,word_timestamps=True,condition_on_previous_text=False);segments=list(segments);phones=[];raw=(x.clip(-1,1)*32767).astype('<i2').tobytes();mp=pathlib.Path(get_model_path())
 for lm in [None,str(mp/'en-us/en-us-phone.lm.bin')]:
  dec=Decoder(lm=None,loglevel='ERROR',beam=1e-20,pbeam=1e-20,lw=2.0);dec.add_allphone_file('p',lm);dec.activate_search('p');dec.start_utt();dec.process_raw(raw,full_utt=True);dec.end_utt();phones.append({'method':'UNIFORM' if lm is None else 'PHONE_LM','reference_text_supplied':False,'phones':[{'phone':z.word,'start':z.start_frame/100,'end':(z.end_frame+1)/100} for z in dec.seg()]})
 checks.append({'lesson_id':'MAN-0831','segment_id':sid,'sha256':e['sha256'],'asr_model':'faster-whisper-medium.en','reference_prompt_supplied':False,'asr_transcript':' '.join(s.text.strip() for s in segments),'words':[{'word':z.word.strip(),'start':z.start,'end':z.end,'probability':z.probability} for s in segments for z in(s.words or[])],'phoneme_hypotheses':phones,'certification_claimed':False})
print('C1_ALTERNATE_REVIEW_JSON='+json.dumps(checks,separators=(',',':')),flush=True)
