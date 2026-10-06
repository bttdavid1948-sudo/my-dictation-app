"""Import already-paid immutable audio; no provider API or accounting mutation."""
import hashlib,json,pathlib,shutil,sys,wave,importlib.util
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
m=json.load(open('operations/batch02-producer/release-source-manifest.json'))
assert len(m['source_segments'])==77
for s in m['source_segments']:
 name=s['lesson_id']+'-'+s['segment_id']+'.wav'
 p=pathlib.Path('release-repair')/name if s['origin']=='repair' else pathlib.Path('release-production')/s['lesson_id']/name
 assert sha(p)==s['sha256'];dest=pathlib.Path(s['destination']);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
 with wave.open(str(dest)) as w:assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000)
spec=importlib.util.spec_from_file_location('compose','operations/batch02-producer/compose_release.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
a={'segments':[s for s in json.load(open('operations/batch02-producer/prepared-segments.json'))['segments'] if s['lesson_id']=='MAN-0921']};rows=[]
for s in a['segments']:
 source=next(r for r in m['source_segments'] if (r['lesson_id'],r['segment_id'])==('MAN-0921',s['segment_id']));rows.append({**s,'file':source['destination'],'sha256':source['sha256']})
r=module.compose({'lessons':[{'lesson_id':'MAN-0921','lesson_asset_version':'v0.1','segments':rows}]},pathlib.Path('.'),pathlib.Path('release-mixed'),lesson_id='MAN-0921',realization_id='MAN-0921-MIXED-v0.1',segment_ids=tuple(s['segment_id'] for s in rows),overlap_before=('S005',))
p=pathlib.Path('release-mixed')/r['file'];assert sha(p)==m['mixed_sha256'];shutil.copy2(p,pathlib.Path('assets/audio')/p.name)
with wave.open(str(p)) as w:pcm=w.readframes(w.getnframes())
for placement,binding in zip(r['segments'],m['mixed_contexts']):
 dest=pathlib.Path(binding['destination'])
 with wave.open(str(dest),'wb') as w:w.setparams((1,2,24000,0,'NONE','not compressed'));w.writeframes(pcm[placement['context_start']*2:placement['context_end']*2])
 assert sha(dest)==binding['sha256']
print('Exact 77 source WAVs plus derived mixed/context WAVs imported; zero synthesis.')
