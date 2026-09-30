"""Internal fixed-audio gate; no human/acoustic certification is emitted."""
import argparse, array, hashlib, json, math, pathlib, re, subprocess, wave
VERSION = 'MAN-INTERNAL-AUDIO-RELEASE@v0.1'
def digest(data): return hashlib.sha256(data).hexdigest()
def words(text):
    # Orthographic normalization only. Letter B and ASR 'be' are homophones;
    # this is probabilistic phonetic support, never an exact-text acoustic proof.
    text=text.lower().replace('’', "'")
    text=re.sub(r'\bb\b','be',text)
    return re.findall(r"[a-z0-9]+(?:'[a-z]+)?",text)
def check_segment(s, expected, root, asr, voices):
    deterministic=[]; anomalies=[]
    binding=all(s.get(k)==expected.get(k) for k in ['segment_id','script_speaker_id','text'])
    if not binding or digest(s['text'].encode())!=s['input_sha256']: anomalies.append('CANONICAL_BINDING_OR_INPUT_HASH')
    else: deterministic.append('CANONICAL_TEXT_SEGMENT_INPUT_HASH')
    if voices.get(s['script_speaker_id'])!=s['voice'] or s.get('model')!='gpt-4o-mini-tts': anomalies.append('PRODUCER_VOICE_ASSIGNMENT')
    else: deterministic.append('REQUESTED_PROVIDER_VOICE_ASSIGNMENT')
    file=(root/s['file']).resolve()
    if not file.is_relative_to(root.resolve()): raise ValueError('Asset path escapes bundle')
    data=file.read_bytes(); sha=digest(data)
    if sha!=s['sha256']: anomalies.append('ASSET_HASH_CHANGED')
    else: deterministic.append('IMMUTABLE_ASSET_SHA256')
    try:
        with wave.open(str(file),'rb') as w:
            rate=w.getframerate(); frames=w.getnframes(); channels=w.getnchannels(); width=w.getsampwidth(); pcm=w.readframes(frames)
        subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True,capture_output=True)
        if (rate,channels,width)!=(24000,1,2) or len(pcm)!=frames*channels*width or digest(pcm)!=s['pcm_sha256']: anomalies.append('PCM_FORMAT_INTEGRITY')
        else: deterministic.append('WAV_AND_FFMPEG_DECODE_COMPLETE')
        samples=array.array('h',pcm);duration=frames/rate
        rms=math.sqrt(sum((v/32768)**2 for v in samples)/max(1,len(samples)))
        clip=sum(abs(v)>=32760 for v in samples)/max(1,len(samples))
        chunks=[samples[i:i+rate//50] for i in range(0,len(samples),rate//50)]
        active=[i for i,c in enumerate(chunks) if c and math.sqrt(sum((v/32768)**2 for v in c)/len(c))>=.003]
        lead=active[0]/50 if active else duration;tail=duration-(active[-1]+1)/50 if active else duration
        longest=run=0
        for i in range(active[0],active[-1]+1) if active else []:
            run=0 if i in active else run+1;longest=max(longest,run)
        pace=len(words(s['text']))/duration*60 if duration else 0
        if not active or rms<.003 or clip>.001 or duration<.4 or not 60<=pace<=300 or lead>1.5 or tail>1.5 or longest/50>2 or abs(duration-s['duration_seconds'])>.001: anomalies.append('DURATION_SILENCE_CLIPPING_OR_TRUNCATION_HEURISTIC')
        else: deterministic.append('MEASURED_DURATION_LEVEL_SILENCE_CLIPPING_WITHIN_POLICY')
        metrics={'duration_seconds':duration,'words_per_minute':pace,'rms':rms,'clipping_ratio':clip,'leading_silence_seconds':lead,'trailing_silence_seconds':max(0,tail),'longest_internal_silence_seconds':longest/50}
    except (wave.Error,subprocess.CalledProcessError,ZeroDivisionError):
        anomalies.append('DECODE_FAILURE');metrics={}
    recognition=asr.get((s['lesson_id'],s['segment_id']))
    aligned=bool(recognition and recognition['asset_sha256']==sha and words(recognition['text'])==words(s['text']))
    if not recognition or recognition['asset_sha256']!=sha: anomalies.append('ASR_EVIDENCE_MISSING_OR_WRONG_ASSET')
    return {'segment_id':s['segment_id'],'sha256':sha,'deterministically_verified':deterministic,'metrics':metrics,'asr_text':recognition.get('text') if recognition else None,'fidelity_signal':'NORMALIZED_ASR_MATCH_PROBABILISTIC' if aligned else 'UNCERTAIN_ASR_MISMATCH','anomalies':anomalies,'status':'ANOMALOUS' if anomalies else ('INTERNAL_PASS' if aligned else 'UNCERTAIN')}
def evaluate(bundle, canonical, asr_evidence, root):
    canonical_map={a['lesson_id']:a for a in canonical['assets']}
    asr={(a['lesson_id'],a['segment_id']):a for a in asr_evidence['segments']}
    if len(asr)!=len(asr_evidence['segments']): raise ValueError('Duplicate ASR binding')
    if asr_evidence.get('reference_prompt_supplied') is not False or asr_evidence.get('model')!='vosk-model-small-en-us-0.15': raise ValueError('Untrusted or reference-prompted ASR')
    outcomes=[]
    if len({l['lesson_id'] for l in bundle['lessons']})!=len(bundle['lessons']): raise ValueError('Duplicate lesson')
    for lesson in bundle['lessons']:
        expected=canonical_map[lesson['lesson_id']]
        if lesson['lesson_asset_version']!=expected['lesson_asset_version']: raise ValueError('Canonical version mismatch')
        if lesson['target_anchors']!=expected['target_anchors']: raise ValueError('Target anchor drift')
        if any(s['lesson_id']!=lesson['lesson_id'] or s['lesson_asset_version']!=lesson['lesson_asset_version'] for s in lesson['segments']): raise ValueError('Segment lesson/version drift')
        expected_segments={s['segment_id']:s for s in expected['segments']}
        actual_ids=[s['segment_id'] for s in lesson['segments']]
        if len(set(actual_ids))!=len(actual_ids) or set(actual_ids)!=set(expected_segments): raise ValueError('Incomplete/duplicate segment coverage')
        voices={s['script_speaker_id']:s['voice'] for s in lesson['audio_profile']['speaker_mapping']}
        results=[check_segment(s,expected_segments[s['segment_id']],root,asr,voices) for s in lesson['segments']]
        status='CONTROLLED_INTERNAL_RELEASE_ELIGIBLE' if all(s['status']=='INTERNAL_PASS' for s in results) else ('ANOMALOUS' if any(s['status']=='ANOMALOUS' for s in results) else 'UNCERTAIN')
        targets=[{'anchor_id':a['anchor_id'],'phenomenon_type':a.get('phenomenon_type'),'segment_binding':'DETERMINISTIC_PASS' if set(a['segment_ids'])<=set(actual_ids) else 'FAIL','acoustic_condition':'ASR_LEXICAL_SUPPORT_PROBABILISTIC' if a.get('phenomenon_type')=='numbers/letter names' and status=='CONTROLLED_INTERNAL_RELEASE_ELIGIBLE' else 'UNVERIFIED_REQUIRES_PRACTICE_SCOPE_DECISION'} for a in lesson['target_anchors'] if a['anchor_kind']=='SPEECH_PHENOMENON']
        outcomes.append({'lesson_id':lesson['lesson_id'],'lesson_asset_version':lesson['lesson_asset_version'],'realization_id':lesson['candidate_realization_id'],'profile_ref':lesson['audio_profile']['audio_profile_id']+'@'+lesson['audio_profile']['audio_profile_version'],'status':status,'segments':results,'target_conditions':targets,'human_acoustic_certification':'NOT_PERFORMED_NOT_REQUIRED','unverified':['perceived speaker identity/accent','fine pronunciation','natural prosody/reductions/stress','semantic or scored target suitability beyond lexical ASR signal'],'next_lane':'PRACTICE_2' if status=='CONTROLLED_INTERNAL_RELEASE_ELIGIBLE' else 'OPERATIONS_4_EXCEPTION_BACKLOG','practice_ready':False,'publication_allowed':False})
    return {'gate_version':VERSION,'trusted_provider':'OpenAI','canonical_source_sha256':bundle['canonical_source_sha256'],'asr_model':asr_evidence['model'],'asr_reference_prompt_supplied':asr_evidence['reference_prompt_supplied'],'asr_evidence_sha256':digest(json.dumps(asr_evidence,sort_keys=True).encode()),'classification_note':'Internal eligibility permits controlled release after final Practice/support/rights/runtime gates. No QA-PASS or human certification is inferred. User reports are observability signals only.','lessons':outcomes}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('bundle');p.add_argument('canonical');p.add_argument('asr');p.add_argument('output');a=p.parse_args()
    path=pathlib.Path(a.bundle);b=json.loads(path.read_text());cbytes=pathlib.Path(a.canonical).read_bytes()
    if digest(cbytes)!=b['canonical_source_sha256']:raise ValueError('Canonical source hash mismatch')
    result=evaluate(b,json.loads(cbytes),json.loads(pathlib.Path(a.asr).read_text()),path.parent)
    pathlib.Path(a.output).write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps([{'lesson_id':l['lesson_id'],'status':l['status'],'next_lane':l['next_lane']} for l in result['lessons']]))
