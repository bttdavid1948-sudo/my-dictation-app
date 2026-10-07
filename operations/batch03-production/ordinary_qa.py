"""Batch03 input binding for the inherited unprompted faster-whisper QA.

Extract actual PCM and transcript evidence only; no semantic PASS or release.
"""
import hashlib,json,pathlib,re,difflib,wave
import numpy as np
from scipy.signal import resample_poly
from faster_whisper import WhisperModel

root=pathlib.Path('batch03-source');out=pathlib.Path('batch03-qa');out.mkdir(exist_ok=True)
prepared=json.loads(pathlib.Path('operations/batch03-production/prepared-segments.json').read_text())['segments']
ledger=json.loads((root/'production-ledger.json').read_text())
assert ledger['batch_id']=='BATCH_03' and ledger['completed_segments']==20
model=WhisperModel('base.en',device='cpu',compute_type='int8',download_root='ordinary-audio-qa-model',num_workers=1)
norm=lambda s: re.findall(r"[a-z0-9]+(?:'[a-z]+)?",s.lower().replace('’',"'"))
results=[]
for row in ledger['entries']:
    lid,sid=row['lesson_id'],row['segment_id'];p=root/lid/row['file']
    request=next(s for s in prepared if(s['lesson_id'],s['segment_id'])==(lid,sid))
    assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256']
    assert row['input_sha256']==request['text_sha256']
    with wave.open(str(p)) as w:
        frames=w.getnframes();rate=w.getframerate();channels=w.getnchannels();width=w.getsampwidth()
        a=np.frombuffer(w.readframes(frames),dtype='<i2').astype(float)/32768
    segments,info=model.transcribe(resample_poly(a,2,3).astype(np.float32),language='en',beam_size=5,word_timestamps=True,condition_on_previous_text=False)
    segments=list(segments);text=' '.join(s.text.strip() for s in segments)
    words=[{'word':x.word.strip(),'start':x.start,'end':x.end,'probability':x.probability} for s in segments for x in (s.words or [])]
    exp,got=norm(request['text']),norm(text)
    diff=[{'operation':tag,'expected':exp[i:j],'recognized':got[k:l]} for tag,i,j,k,l in difflib.SequenceMatcher(None,exp,got).get_opcodes() if tag!='equal']
    rms=float(np.sqrt(np.mean(a*a)));peak=float(np.max(np.abs(a)));clipped=float(np.mean(np.abs(a)>=.999))
    container=bool(frames>0 and rate==24000 and channels==1 and width==2 and np.isfinite(a).all())
    result={'lesson_id':lid,'segment_id':sid,'sha256':row['sha256'],'input_sha256':row['input_sha256'],'instructions_sha256':row['instructions_sha256'],'duration_seconds':frames/rate,'sample_rate':rate,'channels':channels,'sample_width':width,'peak':peak,'rms':rms,'clipped_sample_fraction':clipped,'words_per_minute':len(exp)*60/(frames/rate),'asr_model':'faster-whisper-base.en','reference_prompt_supplied':False,'asr_transcript':text,'lexical_differences':diff,'words':words,'automated_container_pass':container,'asr_exact_normalized_match':exp==got,'quality_decision':'ORDINARY_AUTOMATED_QA_PASS' if container and rms>0 and exp==got else 'REVIEW_REQUIRED','normalization':'CASE_PUNCTUATION_UNICODE_APOSTROPHE_ONLY','canonical_answer_unchanged':True,'phonetic_certification_claimed':False,'accent_certification_claimed':False,'semantic_pass_claimed':False}
    (out/(lid+'-'+sid+'.json')).write_text(json.dumps(result,indent=2)+'\n');results.append(result)
    print(json.dumps({k:result[k] for k in ['lesson_id','segment_id','quality_decision','lexical_differences']}),flush=True)
(out/'ordinary-qa.json').write_text(json.dumps({'production_run':37655070920,'scope':'BATCH_03_ONLY','procedure_precedent':'Batch02 unprompted faster-whisper-base.en ordinary QA; targeted-audio/ordinary_qa.py extraction method','rows':results,'semantic_pass_claimed':False,'publication_allowed':False},indent=2)+'\n')
