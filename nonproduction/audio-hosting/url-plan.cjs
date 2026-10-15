'use strict';
// Preparation only: not imported by index/runtime; no network, secrets or URL toggles.
function resolveAsset(asset,{pageUrl,enabled=false,baseUrl,allowedOrigins=[],manifest}={}){
 if(!asset||!/^assets\/audio\/[-A-Za-z0-9._]+\.wav$/.test(asset.url||'')||!/^[a-f0-9]{64}$/.test(asset.sha256||''))throw Error('UNBOUND_ASSET');
 const current=new URL(asset.url,pageUrl);
 if(!enabled)return current.href;
 const base=new URL(baseUrl);if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||!base.pathname.endsWith('/')||!allowedOrigins.includes(base.origin))throw Error('UNAPPROVED_AUDIO_ORIGIN');
 const entry=manifest?.[asset.url];if(!entry||entry.sha256!==asset.sha256||entry.key!==asset.url||!Number.isSafeInteger(entry.bytes)||entry.bytes<44)throw Error('MANIFEST_INTEGRITY_MISMATCH');
 return new URL(entry.key,base).href;
}
module.exports={resolveAsset};
