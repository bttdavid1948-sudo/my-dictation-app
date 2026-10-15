const assert=require('node:assert/strict'),{resolveAsset}=require('./url-plan.cjs'),a={url:'assets/audio/MAN-TEST-S001-v0.1.wav',sha256:'a'.repeat(64)},before=JSON.stringify(a),manifest={[a.url]:{key:a.url,sha256:a.sha256,bytes:12000}},base={pageUrl:'https://example.invalid/app/',enabled:true,baseUrl:'https://audio.example.invalid/',allowedOrigins:['https://audio.example.invalid'],manifest};let n=0;
assert.equal(resolveAsset(a,{pageUrl:base.pageUrl}),'https://example.invalid/app/'+a.url);n++;
assert.equal(resolveAsset(a,base),'https://audio.example.invalid/'+a.url);n++;
for(const patch of [{baseUrl:'http://audio.example.invalid/'},{baseUrl:'https://other.invalid/'},{baseUrl:'https://user:pass@audio.example.invalid/'},{baseUrl:'https://audio.example.invalid/?token=x'},{manifest:{}},{manifest:{[a.url]:{...manifest[a.url],sha256:'b'.repeat(64)}}}]){assert.throws(()=>resolveAsset(a,{...base,...patch}));n++}
assert.throws(()=>resolveAsset({...a,url:'assets/audio/../private.wav'},base));n++;
assert.equal(JSON.stringify(a),before);n++;
console.log(JSON.stringify({status:'PASS',checks:n,scope:'UNIT URL/manifest plan, no production runtime integration or CDN deployment claim'}));
