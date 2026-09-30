"""Offline evidence extraction only; never decides Practice PASS or changes audio.

Word windows come from existing unprompted Vosk, therefore linguistic attribution
and boundaries are probabilistic. PCM measurements are reproducible conditional
on these windows. Allphone decoding receives PCM only, no reference transcript.
"""
import argparse, hashlib, json, math, pathlib, subprocess, sys, wave
import numpy as np
from scipy.signal import find_peaks

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def measure(x, sr, start, end):
    y=x[max(0,round(start*sr)):min(len(x),round(end*sr))]
    rms=float(np.sqrt(np.mean(y*y))) if len(y) else 0
    # Short-window autocorrelation estimate, not a pitch accent classifier.
    f0=[]; confidence=[]
    n=round(.04*sr); hop=round(.01*sr)
    for i in range(0,len(y)-n+1,hop):
        z=y[i:i+n];z=z-z.mean()
        if np.sqrt(np.mean(z*z))<.005:continue
        ac=np.correlate(z,z,'full')[n-1:];ac/=max(ac[0],1e-12)
        lo=round(sr/350);hi=min(round(sr/70),len(ac)-1)
        peaks,_=find_peaks(ac[lo:hi+1]);peaks=peaks+lo
        if not len(peaks):continue
        lag=int(peaks[np.argmax(ac[peaks])]);v=float(ac[lag])
        if v>=.6:f0.append(sr/lag);confidence.append(v)
    return {'duration_seconds':round(end-start,6),'rms':rms,
            'rms_dbfs':round(20*math.log10(max(rms,1e-12)),3),
            'f0_median_hz':round(float(np.median(f0)),2) if f0 else None,
            'f0_range_hz':[round(float(np.min(f0)),2),round(float(np.max(f0)),2)] if f0 else None,
            'voiced_frames':len(f0),'f0_autocorrelation_threshold':.6}

def run(source, out):
    out.mkdir(parents=True,exist_ok=True)
    manifest=json.loads((source/'manifest.json').read_text())
    asr=json.loads((source/'internal-asr-evidence.json').read_text())
    selected={'MAN-0238':['S002','S004'],'MAN-0414':['S003','S004']}
    rows=[]
    from pocketsphinx import Decoder, get_model_path
    model=pathlib.Path(get_model_path())
    models=[{'path':str(p.relative_to(model)),'sha256':digest(p)} for p in sorted(model.rglob('*')) if p.is_file()]
    for lesson in manifest['lessons']:
        lid=lesson['lesson_id']
        if lid not in selected:continue
        for segment in lesson['segments']:
            sid=segment['segment_id']
            if sid not in selected[lid]:continue
            path=source/segment['file'];assert digest(path)==segment['sha256']
            with wave.open(str(path)) as w:
                sr=w.getframerate();x=np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(float)/32768
            wr=next(r for r in asr['segments'] if r['lesson_id']==lid and r['segment_id']==sid)
            assert wr['asset_sha256']==segment['sha256']
            words=[]
            for idx,word in enumerate(wr['words']):
                start,end=word['start'],word['end']
                words.append({**word,'index':idx,'metrics':measure(x,sr,start,end),
                    'boundary_sensitivity_20ms':[
                        {'start_shift':ds,'end_shift':de,'metrics':measure(x,sr,max(0,start+ds),end+de)}
                        for ds,de in [(-.02,-.02),(.02,.02),(-.02,.02),(.02,-.02)] if end+de>max(0,start+ds)]})
            pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','s16le','-ar','16000','-ac','1','-'])
            # Uniform phone transitions and phone LM are separate sensitivity runs.
            hypotheses=[]
            for lm in [None,str(model/'en-us/en-us-phone.lm.bin')]:
                decoder=Decoder(lm=None,loglevel='ERROR',beam=1e-20,pbeam=1e-20,lw=2.0)
                decoder.add_allphone_file('phones',lm);decoder.activate_search('phones')
                decoder.start_utt();decoder.process_raw(pcm,full_utt=True);decoder.end_utt()
                phones=[{'phone':p.word,'start':p.start_frame/100,'end':(p.end_frame+1)/100}
                        for p in decoder.seg()]
                hypotheses.append({'method':'ALLPHONE_UNIFORM' if lm is None else 'ALLPHONE_PHONE_LM',
                    'reference_text_supplied':False,'phones':phones})
            # Focused windows identified in the retained unprompted phone output.
            # Every selection is an explicit hypothesis, not forced ground truth.
            selections={
                ('MAN-0238','S002'):[('the before same',1.28,1.35),('same vowel',1.56,1.71),('the before date',4.73,4.82),('date vowel',4.99,5.16)],
                ('MAN-0238','S004'):[('the before problem counterexample',1.30,1.35),('problem vowel counterexample',1.49,1.64),('the before newsletter',2.42,2.52),('newsletter first vowel',2.66,2.78)],
                ('MAN-0414','S003'):[('article a before raised',3.92,3.96),('raised vowel',4.17,4.34)],
                ('MAN-0414','S004'):[('article a before restriction',2.07,2.15),('preceding walkway vowel region',1.85,2.04),('to before keep ambiguous',4.82,4.88),('way vowel',4.68,4.82)]}
            focus=[{'label':label,'start':start,'end':end,'metrics':measure(x,sr,start,end),
                'boundary_sensitivity_20ms':[
                    {'start_shift':ds,'end_shift':de,'metrics':measure(x,sr,max(0,start+ds),end+de)}
                    for ds,de in [(-.02,-.02),(.02,.02),(-.02,.02),(.02,-.02)] if end+de>start+ds],
                'selection_status':'OPERATIONS_PHONETIC_ATTRIBUTION_HYPOTHESIS_REQUIRES_PRACTICE_REVIEW'}
                for label,start,end in selections[(lid,sid)]]
            rows.append({'lesson_id':lid,'lesson_asset_version':'v0.1',
                'realization_id':lesson['candidate_realization_id'],'segment_id':sid,
                'asset_file':segment['file'],'asset_sha256':segment['sha256'],
                'canonical_text':segment['text'],'words':words,'phoneme_hypotheses':hypotheses,
                'focused_windows':focus})
    evidence={'schema_version':'1.0','method_version':'MAN-FIXED-PHENOMENA-EVIDENCE@v0.1',
        'source_manifest_sha256':digest(source/'manifest.json'),
        'source_asr_sha256':digest(source/'internal-asr-evidence.json'),
        'script_sha256':digest(pathlib.Path(__file__)),
        'dependencies':{'numpy':np.__version__,'pocketsphinx':'5.1.1'},'model_files':models,
        'deterministic':['Exact input asset hashes','PCM RMS conditional on stated intervals','Frame counts and resampling configuration'],
        'probabilistic':['Vosk word identity and word boundaries','Autocorrelation F0 with possible octave/voicing errors','Allphone phonetic hypotheses with substantial error risk','Interpretation of relative prominence or vowel reduction'],
        'not_established':['Human-level pronunciation/prosody/accent certification','Final Practice semantic PASS','Perceptual naturalness certification'],
        'segments':rows,'synthesis_requests':0,'incremental_metered_api_cost_usd':0}
    (out/'measurements.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'segments':len(rows),'output':str(out/'measurements.json'),'cost_usd':0}))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('source',type=pathlib.Path);parser.add_argument('out',type=pathlib.Path)
    args=parser.parse_args();run(args.source,args.out)
