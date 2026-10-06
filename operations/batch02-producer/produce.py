"""Exact prepared production requests. No automatic paid retry, no QA/release claim."""
import datetime,hashlib,io,json,os,pathlib,shutil,struct,urllib.request,urllib.error,wave,zipfile
ROOT=pathlib.Path('producer-evidence');ROOT.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
def fetch_preflight():
 prior=pathlib.Path('prior-preflight')
 receipt=json.loads((prior/'audio-preflight.json').read_text());wav=(prior/'MAN-0066-S001.wav').read_bytes()
 if sha(wav)!=receipt['sha256'] or receipt['input_sha256']!='f666e7da12cfa01d4f7c7dc477923efd51ea8ce3cb4328d3d38a5c238bf9834d':raise ValueError('preflight audio binding')
 dest=ROOT/'MAN-0066';dest.mkdir(exist_ok=True);(dest/'MAN-0066-S001.wav').write_bytes(wav)
 receipt.update(script_speaker_id='SPK01',status='REUSED_AUTHENTICATED_AUDIO_OUTPUT_QA_PENDING')
 (dest/'MAN-0066-S001.metadata.json').write_text(json.dumps(receipt,indent=2)+'\n')
 return receipt

def main():
 ledger={'batch_id':'BATCH_02','source_sha':os.getenv('GITHUB_SHA'),'paid_requests_submitted':0,'reused_segments':0,'completed_segments':0,'entries':[],'qa_status':'PENDING','publication_allowed':False}
 def save():
  (ROOT/'production-ledger.json').write_text(json.dumps(ledger,indent=2)+'\n')
 def finish(status,code):
  ledger['status']=status;save();print(json.dumps({k:ledger[k] for k in ['status','paid_requests_submitted','reused_segments','completed_segments']}));return code
 if os.getenv('GITHUB_REPOSITORY')!='bttdavid1948-sudo/my-dictation-app' or os.getenv('GITHUB_REF')!='refs/heads/main' or os.getenv('GITHUB_RUN_ATTEMPT')!='1':return finish('SCOPE_OR_RERUN_BLOCKED',2)
 try:
  a=json.loads(pathlib.Path('operations/batch02-producer/production-activation.json').read_text())
  age=(datetime.datetime.now(datetime.timezone.utc)-datetime.datetime.fromisoformat(a['budget_verified_at'])).total_seconds()
  source=pathlib.Path('operations/batch02-producer/prepared-segments.json').read_bytes()
  if not 0<=age<=900 or sha(source)!=a['prepared_source_sha256']:raise ValueError()
  d=json.loads(source);segments=d['segments'];assert len(segments)==77
  assert len({(s['lesson_id'],s['segment_id']) for s in segments})==77
  for s in segments:assert sha(s['text'].encode())==s['text_sha256']
  authority=json.loads(pathlib.Path('docs/content-pipeline/registry/official-1000-production-authority.json').read_text());assert authority['audio_spend']['standing_authorized'] is True
  ledger['budget_evidence_sha256']=a['budget_evidence_sha256'];ledger['prepared_source_sha256']=sha(source)
  old=fetch_preflight();ledger['reused_segments']=1;ledger['completed_segments']=1;ledger['entries'].append(old);save()
 except Exception as e:
  ledger['error_type']=type(e).__name__;return finish('PREFLIGHT_SOURCE_OR_REUSE_BLOCKED',2)
 key=os.getenv('OPENAI_API_KEY')
 if not key:return finish('SECRET_UNAVAILABLE',2)
 for s in segments:
  if (s['lesson_id'],s['segment_id'])==('MAN-0066','S001'):continue
  dest=ROOT/s['lesson_id'];dest.mkdir(exist_ok=True);name=s['lesson_id']+'-'+s['segment_id'];out=dest/(name+'.wav')
  row={k:s[k] for k in ['lesson_id','lesson_asset_version','segment_id','script_speaker_id','voice']};row.update(model='gpt-4o-mini-tts',input_sha256=s['text_sha256'],instructions_sha256=sha(s['instructions'].encode()),qa_status='PENDING',publication_allowed=False)
  row['status']='SUBMISSION_PENDING_RECONCILIATION';ledger['entries'].append(row);ledger['paid_requests_submitted']+=1;save()
  payload={'model':'gpt-4o-mini-tts','voice':s['voice'],'input':s['text'],'instructions':s['instructions'],'response_format':'wav'}
  req=urllib.request.Request('https://api.openai.com/v1/audio/speech',json.dumps(payload).encode(),{'Authorization':'Bearer '+key,'OpenAI-Project':'proj_Mrlw738r4i5cwNktghjdnYFk','Content-Type':'application/json'},method='POST')
  try:
   with urllib.request.urlopen(req,timeout=60) as response:data=response.read(10_000_001);row['request_id']=response.headers.get('x-request-id')
  except urllib.error.HTTPError as e:
   row.update(status='HTTP_FAILURE_RECONCILE_BEFORE_RETRY',http_status=e.code);save()
   if e.code in [401,403,429] or e.code>=500:return finish('SHARED_PRODUCER_BLOCKER',3)
   continue
  except Exception as e:
   row.update(status='TRANSPORT_UNKNOWN_RECONCILE_BEFORE_RETRY',error_type=type(e).__name__);return finish('TRANSPORT_BLOCKED',3)
  (dest/(name+'.provider.wav')).write_bytes(data)
  try:
   assert len(data)<=10_000_000 and data[:4]==b'RIFF' and data[8:12]==b'WAVE'
   with wave.open(io.BytesIO(data),'rb') as w:
    assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000);pcm=w.readframes(w.getnframes())
   assert pcm and len(pcm)%2==0
   with wave.open(str(out),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(pcm)
   duration=len(pcm)/48000;assert .4<=duration<=120
   row.update(status='SYNTHESIZED_QA_PENDING',duration_seconds=duration,file=out.name,sha256=sha(out.read_bytes()),pcm_sha256=sha(pcm),provider_sha256=sha(data),cost_status='ESTIMATED_RESERVATION_PENDING_METERED_RECONCILIATION')
   ledger['completed_segments']+=1
  except Exception as e:row.update(status='AUDIO_DECODE_OR_DURATION_FAILED',error_type=type(e).__name__)
  (dest/(name+'.metadata.json')).write_text(json.dumps(row,indent=2)+'\n');save()
  print(json.dumps({'lesson_id':s['lesson_id'],'segment_id':s['segment_id'],'status':row['status']}),flush=True)
 return finish('ALL_77_AUDIO_OUTPUTS_READY_FOR_QA' if ledger['completed_segments']==77 else 'PARTIAL_OUTPUT_INDEPENDENT_PROGRESS',0 if ledger['completed_segments']==77 else 4)
if __name__=='__main__':raise SystemExit(main())
