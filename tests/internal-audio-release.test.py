import importlib.util,json,pathlib,copy,tempfile
spec=importlib.util.spec_from_file_location('gate','internal-audio-release/docs/content-pipeline/internal-audio-release.py');g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
# Run from the operations evidence workspace with a private bundle; no lesson text is committed.
root=pathlib.Path('batch01-final-audio-qa');b=json.loads((root/'internal-release-manifest.json').read_text());c=json.load(open('MAN-Batch-01-Canonical-Lesson-Assets-v0.1.json'));a=json.loads((root/'internal-asr-evidence.json').read_text())
r=g.evaluate(b,c,a,root);assert r['lessons'][0]['status']=='CONTROLLED_INTERNAL_RELEASE_ELIGIBLE';assert all(not l['publication_allowed'] and not l['practice_ready'] for l in r['lessons']);assert r['lessons'][1]['status']=='ANOMALOUS';assert r['lessons'][2]['status']=='UNCERTAIN'
t=copy.deepcopy(b);t['lessons'][0]['segments'][0]['sha256']='0'*64;assert g.evaluate(t,c,a,root)['lessons'][0]['status']=='ANOMALOUS'
t=copy.deepcopy(b);t['lessons'][0]['segments'][0]['voice']='cedar';assert g.evaluate(t,c,a,root)['lessons'][0]['status']=='ANOMALOUS'
t=copy.deepcopy(a);t['reference_prompt_supplied']=True
try:g.evaluate(b,c,t,root);raise AssertionError('prompted ASR accepted')
except ValueError:pass
t=copy.deepcopy(b);t['lessons'][0]['segments'].pop()
try:g.evaluate(t,c,a,root);raise AssertionError('missing segment accepted')
except ValueError:pass
print('Internal gate: actual partial progression, no fabricated Practice, hash/voice/prompt/coverage rejection PASS')
