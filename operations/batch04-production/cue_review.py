import pathlib,json,hashlib,wave
import numpy as np
from scipy.signal import resample_poly
from pocketsphinx import Decoder,get_model_path
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
