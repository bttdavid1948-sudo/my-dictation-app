"""Read immutable final source and single repaired negative cue; no synthesis."""
import json,pathlib,hashlib,wave,difflib,re
import numpy as np
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
root=pathlib.Path('retained-final');ledger=json.loads((root/'producer-evidence/production-ledger.json').read_text());qa=json.loads((root/'batch04-qa/ordinary-qa.json').read_text());assert ledger['batch_id']=='BATCH_04' and ledger['completed_segments']==12
metadata=[]
for e in ledger['entries']:
 p=root/'producer-evidence'/e['lesson_id']/e['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==e['sha256'];metadata.append({k:e[k] for k in ['lesson_id','segment_id','sha256','input_sha256','instructions_sha256','duration_seconds','file','voice']})
print('RETAINED_FINAL_METADATA_JSON='+json.dumps(metadata,separators=(',',':')),flush=True);print('RETAINED_FINAL_QA_JSON='+json.dumps(qa,separators=(',',':')),flush=True)
p=root/'batch04-qa/secondary-qa.json'
if p.exists():print('RETAINED_FINAL_SECONDARY_JSON='+json.dumps(json.loads(p.read_text()),separators=(',',':')),flush=True)
r=pathlib.Path('retained-repair2');receipt=json.loads((r/'producer-evidence/targeted-repair.json').read_text());q=json.loads((r/'repair-qa/repair-qa.json').read_text());p=r/'producer-evidence'/receipt['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==receipt['sha256'];assert receipt['lesson_id']=='MAN-0951' and receipt['segment_id']=='S012'
print('REPAIR2_RECEIPT_JSON='+json.dumps(receipt,separators=(',',':')),flush=True);print('REPAIR2_QA_JSON='+json.dumps(q,separators=(',',':')),flush=True)
if q['rows'][0]['quality_decision']=='REVIEW_REQUIRED':
 with wave.open(str(p)) as w:a=np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(float)/32768
 model=WhisperModel('small.en',device='cpu',compute_type='int8',download_root='ordinary-audio-qa-model');segments,_=model.transcribe(resample_poly(a,2,3).astype(np.float32),language='en',beam_size=5,word_timestamps=True,condition_on_previous_text=False);segments=list(segments)
 text=' '.join(s.text.strip() for s in segments);words=[{'word':z.word.strip(),'start':z.start,'end':z.end,'probability':z.probability} for s in segments for z in(s.words or [])]
 print('REPAIR2_SECONDARY_JSON='+json.dumps({'lesson_id':'MAN-0951','segment_id':'S012','sha256':receipt['sha256'],'asr_model':'faster-whisper-small.en','reference_prompt_supplied':False,'asr_transcript':text,'words':words},separators=(',',':')),flush=True)
