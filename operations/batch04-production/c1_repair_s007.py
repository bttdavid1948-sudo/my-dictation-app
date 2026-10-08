"""One prepared segment, infrastructure secret only, no retry or release claim."""
import datetime,hashlib,io,json,os,pathlib,struct,urllib.request,urllib.error,wave
ROOT=pathlib.Path('producer-evidence/c1/S007');ROOT.mkdir(parents=True,exist_ok=True)
TEXT="In that case, let's separate three things: the recorded increase in passengers, the benefits people report, and the unanswered question of who remains excluded. The first is an administrative count; the second is survey evidence; the third needs further reporting, not a confident guess."
HASH='1bc55ab2b77ab075c96ad6134370da06db6179abe34c23af1fb8f645abe1b14c'
def main():
 receipt={'batch_id':'BATCH_04','lesson_id':'MAN-0831','segment_id':'S007','lesson_asset_version':'v0.1','input_sha256':HASH,'model':'gpt-4o-mini-tts','voice':'cedar','source_sha':os.getenv('GITHUB_SHA'),'paid_requests_submitted':0,'qa_status':'PENDING','publication_allowed':False}
 def finish(status,code):
  receipt['status']=status
  (ROOT/'targeted-repair.json').write_text(json.dumps(receipt,indent=2)+'\n')
  print(json.dumps({'status':status,'paid_requests_submitted':receipt['paid_requests_submitted']}))
  return code
 if os.getenv('GITHUB_REPOSITORY')!='bttdavid1948-sudo/my-dictation-app' or os.getenv('GITHUB_REF')!='refs/heads/main' or os.getenv('GITHUB_RUN_ATTEMPT')!='1':return finish('EXECUTION_SCOPE_BLOCKED',2)
 authority=json.loads(pathlib.Path('docs/content-pipeline/registry/official-1000-production-authority.json').read_text())
 if authority['audio_spend']['standing_authorized'] is not True or authority['audio_spend']['per_lesson_batch_segment_reapproval'] is not False:return finish('STANDING_AUTHORITY_BLOCKED',2)
 try:
  activation=json.loads(pathlib.Path('operations/batch04-production/c1-repair-activation.json').read_text())
  verified=datetime.datetime.fromisoformat((os.getenv('BUDGET_VERIFIED_AT') or activation['budget_verified_at']).replace('Z','+00:00'))
  age=(datetime.datetime.now(datetime.timezone.utc)-verified).total_seconds()
  evidence=os.getenv('BUDGET_EVIDENCE_SHA256') or activation['budget_evidence_sha256']
  receipt['operation_key']=activation['operation_key']
  if not 0<=age<=900 or len(evidence)!=64 or any(c not in '0123456789abcdef' for c in evidence):raise ValueError()
 except Exception:return finish('FRESH_RECONCILIATION_REQUIRED',2)
 receipt['budget_evidence_sha256']=evidence
 if hashlib.sha256(TEXT.encode()).hexdigest()!=HASH:return finish('INPUT_BINDING_MISMATCH',2)
 key=os.getenv('OPENAI_API_KEY')
 if not key:return finish('SECRET_UNAVAILABLE',2)
 instructions='Read every supplied sentence exactly and naturally without additions, omissions or substitutions. Preserve the word needs exactly in the supplied sentence. The third needs further reporting. Needs starts with n, not means or meets. Read the entire final sentence. Natural English, no exaggeration.'
 payload={'model':'gpt-4o-mini-tts','voice':'cedar','input':TEXT,'instructions':instructions,'response_format':'wav'}
 receipt['instructions_sha256']=hashlib.sha256(instructions.encode()).hexdigest()
 request=urllib.request.Request('https://api.openai.com/v1/audio/speech',json.dumps(payload).encode(),{'Authorization':'Bearer '+key,'OpenAI-Project':'proj_Mrlw738r4i5cwNktghjdnYFk','Content-Type':'application/json'},method='POST')
 receipt['paid_requests_submitted']=1
 receipt['cost_status']='ESTIMATED_RESERVATION_PENDING_METERED_RECONCILIATION'
 try:
  with urllib.request.urlopen(request,timeout=60) as response:
   data=response.read(5_000_001)
   receipt['request_id']=response.headers.get('x-request-id')
 except urllib.error.HTTPError as error:
  receipt['http_status']=error.code
  return finish('PRODUCER_HTTP_FAILURE_RECONCILE_BEFORE_RETRY',3)
 except Exception as error:
  receipt['error_type']=type(error).__name__
  return finish('PRODUCER_TRANSPORT_UNKNOWN_RECONCILE_BEFORE_RETRY',3)
 # Preserve received bytes before validation, including failed/partial outputs.
 raw=ROOT/'MAN-0831-S007.provider.wav';raw.write_bytes(data)
 if len(data)>5_000_000 or data[:4]!=b'RIFF' or data[8:12]!=b'WAVE':return finish('AUDIO_CONTAINER_FAILED',4)
 try:
  with wave.open(io.BytesIO(data),'rb') as w:
   params=w.getparams();pcm=w.readframes(w.getnframes())
  if params.nchannels!=1 or params.sampwidth!=2 or params.framerate!=24000 or not pcm:return finish('AUDIO_DECODE_FAILED',4)
  final=ROOT/'MAN-0831-S007.wav'
  with wave.open(str(final),'wb') as w:
   w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(pcm)
  duration=len(pcm)/48000
  if not 1<=duration<=40:return finish('AUDIO_DURATION_FAILED',4)
  receipt.update(audio_output_verified=True,duration_seconds=duration,sha256=hashlib.sha256(final.read_bytes()).hexdigest(),pcm_sha256=hashlib.sha256(pcm).hexdigest(),provider_sha256=hashlib.sha256(data).hexdigest(),file=final.name)
 except Exception as error:
  receipt['error_type']=type(error).__name__;return finish('AUDIO_DECODE_FAILED',4)
 return finish('AUTHENTICATED_AUDIO_OUTPUT_PASS_QA_PENDING',0)
if __name__=='__main__':raise SystemExit(main())
