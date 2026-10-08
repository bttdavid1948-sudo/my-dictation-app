"""Read retained receipts/PCM only; no ASR rerun, synthesis or semantic PASS."""
import pathlib,json,hashlib,wave,sys,subprocess
import numpy as np
from scipy.signal import resample_poly
from pocketsphinx import Decoder,get_model_path
root=pathlib.Path('retained');qa=json.loads((root/'batch04-qa/ordinary-qa.json').read_text());ledger=json.loads((root/'producer-evidence/production-ledger.json').read_text())
assert ledger['completed_segments']==18 and ledger['batch_id']=='BATCH_04'
assert set(ledger['selected_lesson_ids'])=={'MAN-0581','MAN-0831'}
public=[]
for row in ledger['entries']:
 p=root/'producer-evidence'/row['lesson_id']/row['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256']
 public.append({k:row[k] for k in ['lesson_id','segment_id','sha256','input_sha256','instructions_sha256','duration_seconds','file','voice']})
print('RETAINED_METADATA_JSON='+json.dumps(public,separators=(',',':')),flush=True)
print('RETAINED_QA_JSON='+json.dumps(qa,separators=(',',':')),flush=True)
p=root/'batch04-qa/secondary-qa.json'
if p.exists():print('RETAINED_SECONDARY_JSON='+p.read_text().strip(),flush=True)
prepared=json.loads(pathlib.Path('operations/batch04-production/prepared-lessons.json').read_text())['assets'];measurements=[]
for lid,sid in [('MAN-0581','S008'),('MAN-0831','S004')]:
 row=next(x for x in public if (x['lesson_id'],x['segment_id'])==(lid,sid));p=root/'producer-evidence'/lid/row['file']
 with wave.open(str(p)) as w:sr=w.getframerate();x=np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(float)/32768
 q=next(x for x in qa['rows'] if (x['lesson_id'],x['segment_id'])==(lid,sid));words=[]
 for wd in q['words']:
  start,end=wd['start'],wd['end'];v=x[round(start*sr):round(end*sr)];rms=float(np.sqrt(np.mean(v*v))) if len(v) else 0
  words.append({**wd,'duration_seconds':end-start,'rms':rms})
 pcm=(resample_poly(x,2,3).clip(-1,1)*32767).astype('<i2').tobytes();hyp=[];model=pathlib.Path(get_model_path())
 for lm in [None,str(model/'en-us/en-us-phone.lm.bin')]:
  dec=Decoder(lm=None,loglevel='ERROR',beam=1e-20,pbeam=1e-20,lw=2.0);dec.add_allphone_file('phones',lm);dec.activate_search('phones');dec.start_utt();dec.process_raw(pcm,full_utt=True);dec.end_utt()
  hyp.append({'reference_text_supplied':False,'method':'ALLPHONE_UNIFORM' if lm is None else 'ALLPHONE_PHONE_LM','phones':[{'phone':z.word,'start':z.start_frame/100,'end':(z.end_frame+1)/100} for z in dec.seg()]})
 measurements.append({'lesson_id':lid,'segment_id':sid,'sha256':row['sha256'],'words':words,'phoneme_hypotheses':hyp,'certification_claimed':False})
print('BOUNDED_CUES_JSON='+json.dumps(measurements,separators=(',',':')),flush=True)

repair=pathlib.Path('retained-repair');receipt=json.loads((repair/'producer-evidence/targeted-repair.json').read_text());p=repair/'producer-evidence'/receipt['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==receipt['sha256']
print('RETAINED_REPAIR_JSON='+json.dumps({k:v for k,v in receipt.items() if k not in ['request_id','budget_evidence_sha256','cost_status']},separators=(',',':')),flush=True)
print('RETAINED_REPAIR_QA_JSON='+json.dumps(json.loads((repair/'repair-qa/repair-qa.json').read_text()),separators=(',',':')),flush=True)
