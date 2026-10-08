"""Finite immutable Batch04 release import; no paid call or main push."""
import hashlib,json,pathlib,shutil,wave
m=json.load(open('operations/batch04-production/release-source-manifest.json'));assert m['batch_id']=='BATCH_04' and len(m['source_segments'])==10
ids={'MAN-0831'}
assert {s['lesson_id'] for s in m['source_segments']}.issubset(ids) and len({s['lesson_id'] for s in m['source_segments']}) ==1
assert len({s['destination'] for s in m['source_segments']})==len(m['source_segments'])
for s in m['source_segments']:
 src=pathlib.Path(s['source']);assert src.parts[0] in {'release-second','release-c1','release-new'}
 assert hashlib.sha256(src.read_bytes()).hexdigest()==s['sha256']
 dest=pathlib.Path(s['destination']);assert dest.parent==pathlib.Path('assets/audio') and dest.suffix=='.wav' and dest.name.startswith(s['lesson_id']+'-')
 dest.parent.mkdir(parents=True,exist_ok=True)
 if dest.exists():assert hashlib.sha256(dest.read_bytes()).hexdigest()==s['sha256']
 else:shutil.copyfile(src,dest)
 with wave.open(str(dest)) as w:assert(w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000)
pathlib.Path('producer-evidence').mkdir(exist_ok=True)
pathlib.Path('producer-evidence/batch04-import-paths.txt').write_text(''.join(s['destination']+'\n' for s in m['source_segments']))
print(str(len(m['source_segments']))+' exact learner WAVs imported; failed raw sources excluded; zero synthesis; isolated review only.')
