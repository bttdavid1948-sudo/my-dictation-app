"""Read two exact voice-corrected C1 repairs; never resynthesize."""
import json,pathlib,hashlib,wave
import numpy as np
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
rows=[]
for sid,voice in [('S001','ash')]:
 root=pathlib.Path('.');r=root/'producer-evidence/c1'/sid;receipt=json.loads((r/'targeted-repair.json').read_text());qa=json.loads((root/('repair-qa-'+sid)/'repair-qa.json').read_text());p=r/receipt['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==receipt['sha256'];assert receipt['voice']==voice and receipt['lesson_id']=='MAN-0831' and receipt['segment_id']==sid
 row={'receipt':receipt,'qa':qa}
 if qa['rows'][0]['quality_decision']=='REVIEW_REQUIRED':
  with wave.open(str(p)) as w:a=np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(float)/32768
  model=WhisperModel('small.en',device='cpu',compute_type='int8',download_root='ordinary-audio-qa-model');seg,_=model.transcribe(resample_poly(a,2,3).astype(np.float32),language='en',beam_size=5,word_timestamps=True,condition_on_previous_text=False);seg=list(seg);row['secondary']={'asr_model':'faster-whisper-small.en','reference_prompt_supplied':False,'asr_transcript':' '.join(s.text.strip() for s in seg),'words':[{'word':z.word.strip(),'start':z.start,'end':z.end,'probability':z.probability} for s in seg for z in(s.words or [])]}
 rows.append(row)
print('RETAINED_C1_REPAIRS_JSON='+json.dumps(rows,separators=(',',':')),flush=True)
