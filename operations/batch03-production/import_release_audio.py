"""Inherited Batch02 finite immutable audio import; no synthesis, no main push."""
import hashlib,json,pathlib,shutil,wave
m=json.load(open('operations/batch03-production/release-source-manifest.json'))
assert m['batch_id']=='BATCH_03' and len(m['source_segments'])==20
assert len({(s['lesson_id'],s['segment_id']) for s in m['source_segments']})==20
assert sum(s['origin']=='repair' for s in m['source_segments'])==1
for s in m['source_segments']:
 name=s['lesson_id']+'-'+s['segment_id']+'.wav'
 p=pathlib.Path('release-repair/producer-evidence')/name if s['origin']=='repair' else pathlib.Path('release-production')/s['lesson_id']/name
 assert hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256']
 dest=pathlib.Path(s['destination']);assert str(dest)==f"assets/audio/{s['lesson_id']}-{s['segment_id']}-batch03-v0.1.wav"
 dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
 with wave.open(str(dest)) as w:assert(w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000)
print('Exact 20 WAVs imported; 19 preserved source, 1 repaired; zero synthesis; isolated review only.')
