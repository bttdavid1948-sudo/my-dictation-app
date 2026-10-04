"""Deterministic mixed panel realization; source receipts remain private."""
import array, hashlib, json, pathlib, sys, wave

def read(path):
 with wave.open(str(path)) as w:
  assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000)
  a=array.array('h',w.readframes(w.getnframes()))
  if sys.byteorder!='little':a.byteswap()
 return a

def compose(manifest,root,out,*,lesson_id='MAN-0844',asset_version='v0.1',realization_id='MAN-0844-MIXED-v0.1',segment_ids=('S001','S002','S003','S004','S005','S006'),overlap_before=('S003','S004','S005')):
 lesson=manifest['lessons'][0]; rows=lesson['segments']; sr=24000; placements=[]; end=0
 assert len(set(segment_ids))==len(segment_ids)
 assert set(overlap_before).issubset(set(segment_ids[1:]))
 assert [s['segment_id'] for s in rows]==list(segment_ids)
 if 'lesson_id' in lesson:assert lesson['lesson_id']==lesson_id
 if 'lesson_asset_version' in lesson:assert lesson['lesson_asset_version']==asset_version
 for i,s in enumerate(rows):
  p=root/s['file']; assert hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256']; a=read(p)
  active=[j for j,x in enumerate(a) if abs(x)>600]; assert active
  # Start the next speaker 650 ms before the preceding active speech ends.
  start=0 if not i else end+int(.25*sr)
  if s['segment_id'] in overlap_before:
   prev=placements[-1]; start=prev['start']+prev['active_end']-int(.65*sr)-active[0]
  placements.append(dict(segment_id=s['segment_id'],start=start,end=start+len(a),active_start=active[0],active_end=active[-1]+1,pcm=a,source_sha256=s['sha256'],text_sha256=hashlib.sha256(s['text'].encode()).hexdigest()))
  assert start>=0
  end=start+len(a)
 total=max(p['end'] for p in placements); mixed=[0]*total
 for p in placements:
  for i,x in enumerate(p['pcm']): mixed[p['start']+i]+=round(x*.45)
 assert max(abs(x) for x in mixed)<32767
 out.mkdir(parents=True,exist_ok=True); dest=out/(realization_id+'.wav')
 with wave.open(str(dest),'wb') as w:
  w.setparams((1,2,sr,0,'NONE','not compressed'))
  encoded=array.array('h',mixed)
  if sys.byteorder!='little':encoded.byteswap()
  w.writeframes(encoded.tobytes())
 events=[]
 for a,b in zip(placements,placements[1:]):
  lo=max(a['start']+a['active_start'],b['start']+b['active_start']);hi=min(a['start']+a['active_end'],b['start']+b['active_end'])
  if hi<=lo:continue
  both=sum(abs(a['pcm'][t-a['start']])>600 and abs(b['pcm'][t-b['start']])>600 for t in range(lo,hi))
  events.append({'segments':[a['segment_id'],b['segment_id']],'start_seconds':lo/sr,'end_seconds':hi/sr,'simultaneous_above_threshold_seconds':both/sr,'threshold_pcm':600,'source_gain':.45,'simultaneous_after_gain_threshold_seconds':sum(abs(round(a['pcm'][t-a['start']]*.45))>270 and abs(round(b['pcm'][t-b['start']]*.45))>270 for t in range(lo,hi))/sr})
 assert len(events)==len(overlap_before) and all(e['simultaneous_above_threshold_seconds']>.05 for e in events)
 mappings=[{k:v for k,v in p.items() if k not in ('pcm','active_start','active_end')}|{'context_start':max(0,p['start']-sr),'context_end':min(total,p['end']+sr)} for p in placements]
 result={'lesson_id':lesson_id,'lesson_asset_version':asset_version,'realization_id':realization_id,'representation':'CONTINUOUS_MIXED_TIMELINE_WITH_STABLE_SEGMENT_ANCHORS','sample_rate':sr,'file':dest.name,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'duration_seconds':total/sr,'mapping_units':'PCM_FRAMES','segments':mappings,'overlap_events':events,'first_pass':'FULL_PANEL','replay':'CONTEXT_PRESERVING_ASSISTED','practice_ready':False,'contract_valid':False,'perceptual_overlap_review':'PRACTICE_2_PENDING','decode_integrity':'PCM_S16LE_MONO_24000_PASS','peak_pcm':max(abs(x) for x in mixed),'composer_sha256':hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),'evidence_boundary':'Source-level simultaneous speech energy is deterministic; lexical identity and perceptual intelligibility require separate evidence and final Practice review.'}
 (out/'realization.json').write_text(json.dumps(result,indent=2)+'\n');return result

if __name__=='__main__':
 import sys
 root=pathlib.Path(sys.argv[1]);print(json.dumps(compose(json.loads((root/'manifest.json').read_text()),root,pathlib.Path(sys.argv[2])),indent=2))
