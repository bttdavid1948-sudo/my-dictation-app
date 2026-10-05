"""No paid request: authenticate the infrastructure-held secret; sanitize all output."""
import os,json,urllib.request,urllib.error,pathlib,datetime
out=pathlib.Path("producer-evidence");out.mkdir(exist_ok=True)
r={"scope":"OFFICIAL_MAN_1000_ONLY","batch_id":"BATCH_02","source_sha":os.environ.get("GITHUB_SHA"),"checked_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),"paid_calls":0,"audio_output_verified":False}
key=os.environ.get("OPENAI_API_KEY","")
if not key:r.update(status="SECRET_UNAVAILABLE",authenticated=False)
else:
 try:
  request=urllib.request.Request("https://api.openai.com/v1/models",headers={"Authorization":"Bearer "+key,"OpenAI-Project":"proj_Mrlw738r4i5cwNktghjdnYFk"})
  with urllib.request.urlopen(request,timeout=30) as response:
   payload=json.loads(response.read(2_000_000))
  r.update(status="AUTHENTICATED_READ_PASS_AUDIO_BUDGET_RECONCILIATION_REQUIRED",authenticated=True,tts_model_listed=any(x.get("id")=="gpt-4o-mini-tts" for x in payload.get("data",[])))
 except urllib.error.HTTPError as error:r.update(status="PRODUCER_AUTH_HTTP_FAILURE",authenticated=False,http_status=error.code)
 except Exception as error:r.update(status="PRODUCER_TRANSPORT_FAILURE",authenticated=False,error_type=type(error).__name__)
# Never preserve provider error bodies, headers, request objects, environment, or credential.
(out/"preflight.json").write_text(json.dumps(r,indent=2)+"\n")
print(json.dumps(r))
raise SystemExit(0 if r.get("authenticated") else 1)
