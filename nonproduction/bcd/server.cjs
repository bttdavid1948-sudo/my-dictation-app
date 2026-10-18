'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(process.argv[2]||'.'),bundle=JSON.parse(fs.readFileSync(path.join(__dirname,'candidate.bundle.json'),'utf8'));
const file=path.join(root,'index.html'),read=fs.readFileSync.bind(fs),base=read(file,'utf8');
const blob=createHash('sha1').update('blob '+Buffer.byteLength(base)+'\0').update(base).digest('hex');if(blob!==bundle.baseBlob)throw Error('BASE_PROVENANCE_MISMATCH');
const generated={...bundle.assets};
for(const [name,binding]of Object.entries(bundle.sourceBindings||{})){
 if(!/^[a-z0-9.-]+\.js$/.test(name)||Object.hasOwn(generated,name)||!/^nonproduction\/(bcd|learner-reliability)\/[a-z0-9.-]+\.(js|cjs)$/.test(binding.path)||!/^[a-f0-9]{64}$/.test(binding.sha256))throw Error('SOURCE_BINDING_INVALID');
 let content=read(path.join(root,binding.path),'utf8');if(createHash('sha256').update(content).digest('hex')!==binding.sha256)throw Error('SOURCE_BINDING_MISMATCH');
 if(binding.exportGlobal){if(binding.exportGlobal!=='ManCloudProgress'||!content.includes('module.exports='))throw Error('SOURCE_EXPORT_INVALID');content=content.replace('module.exports=','window.ManCloudProgress=');}generated[name]=content;
}
for(const [name,content]of Object.entries(generated)){if(!/^[a-z0-9.-]+\.(js|cjs)$/.test(name))throw Error('ASSET_PATH');if(fs.existsSync(path.join(root,'assets',name)))throw Error('EXISTING_ASSET_COLLISION');fs.writeFileSync(path.join(root,'assets',name),content);}
let candidate=base.replace("for(const kind of ['favorites','review','history']){if(kind==='history'&&window.ManHistory?.enabled)continue;localStorage.setItem","for(const kind of ['review','history']){if(kind==='history'&&window.ManHistory?.enabled)continue;localStorage.setItem");
const scripts=['wishlist.js','achievements.js','wishlist-host.js','bc-integration.js','bc-host.js','achievement-host.js','learning-events.js','leaderboard-host.js','profile-ack-host.js','product-cloud.js','product-cloud-host.js','feedback-core.js','feedback-ui.js','feedback-forms-config.js','product-feedback-host.js','product-progress.js','product-progress-host.js'].map(n=>`<script src="assets/${n}"></script>`).join('\n')+'\n<script type="module" src="assets/practice-achievement-bridge.js"></script>\n';candidate=candidate.replace('</body>',scripts+'<script>ManMountProductFeedback();</script></body>');
if(bundle.profileFix){candidate=candidate.replace('</head>','<style id="man-profile-viewport-prepared">'+bundle.profileFix+'</style></head>').replace('<div style="display: flex; gap: 10px; justify-content: flex-end;">','<div class="man-profile-actions">');}
fs.readFileSync=(name,...args)=>path.resolve(String(name))===file?(args[0]==='utf8'?candidate:Buffer.from(candidate)):read(name,...args);
process.argv[2]=root;const preview=path.join(root,'nonproduction/learner-reliability/preview-server.cjs');if(bundle.phase==='p3f'){const Module=require('node:module'),m=new Module(preview,module);m.filename=preview;m.paths=Module._nodeModulePaths(path.dirname(preview));m._compile(read(preview,'utf8').replace("connect-src 'self'","connect-src 'self' http://127.0.0.1:8080").replace("frame-src 'self'","frame-src 'self' https://docs.google.com"),preview);}else require(preview);
