"""Run with a private targeted bundle path; no private lesson text committed."""
import importlib.util,json,pathlib,copy,sys
code=pathlib.Path(__file__).resolve().parents[1]/'docs/content-pipeline'
spec=importlib.util.spec_from_file_location('gate',code/'internal-audio-release.py');g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
root=pathlib.Path(sys.argv[1]);b=json.loads((root/'manifest.json').read_text());c=json.loads((root/'canonical.json').read_text());a=json.loads((root/'internal-asr-evidence.json').read_text());e=json.loads((root/'secondary-asr-evidence.json').read_text())
def run(b=b,a=a,e=e):return g.evaluate(b,c,a,root,e)
r=run();assert len(r['lessons'])==5 and all(l['status']=='CONTROLLED_INTERNAL_RELEASE_ELIGIBLE' and not l['practice_ready'] and not l['publication_allowed'] for l in r['lessons'])
assert sum(s['fidelity_signal'].startswith('SECONDARY_') for l in r['lessons'] for s in l['segments'])==5
assert all(l['target_conditions'][0]['acoustic_condition']=='UNVERIFIED_REQUIRES_PRACTICE_SCOPE_DECISION' for l in r['lessons'])
for source,target in [('road work','roadwork'),('short cut','shortcut'),('four','for'),('due','do'),('bare','bear')]:assert g.words(source)==g.words(target)
for source,target in [('moved','move'),("It's one", "It's a one"),('librarian','library and')]:assert g.words(source)!=g.words(target)
t=copy.deepcopy(b);t['lessons'][0]['segments'][0]['sha256']='0'*64;assert run(b=t)['lessons'][0]['status']=='ANOMALOUS'
t=copy.deepcopy(b);t['lessons'][0]['segments'][0]['voice']='cedar';assert run(b=t)['lessons'][0]['status']=='ANOMALOUS'
for key,value in [('reference_prompt_supplied',True),('initial_prompt','expected text'),('hotwords','expected words'),('model_revision','wrong')]:
 t=copy.deepcopy(e);t[key]=value
 try:run(e=t);raise AssertionError(key)
 except ValueError:pass
t=copy.deepcopy(e);t['model_files_sha256']['model.bin']='0'*64
try:run(e=t);raise AssertionError('wrong weights')
except ValueError:pass
t=copy.deepcopy(e);t['segments'].append(t['segments'][0])
try:run(e=t);raise AssertionError('duplicate secondary')
except ValueError:pass
t=copy.deepcopy(e);t['segments'][0]['asset_sha256']='0'*64;assert run(e=t)['lessons'][1]['status']=='ANOMALOUS'
t=copy.deepcopy(e);t['segments'][0]['text']='missing words';assert run(e=t)['lessons'][1]['status']=='UNCERTAIN';assert run(e=t)['lessons'][0]['status']=='CONTROLLED_INTERNAL_RELEASE_ELIGIBLE'
t=copy.deepcopy(b);t['lessons'][0]['segments'].pop()
try:run(b=t);raise AssertionError('missing segment')
except ValueError:pass
print('PASS: 5 exact pairs; hash/voice/prompt/model/coverage rejection; no acoustic/Practice fabrication; independent parking')
