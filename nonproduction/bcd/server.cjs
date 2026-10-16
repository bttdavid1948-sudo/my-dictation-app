'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(process.argv[2]||'.'),bundle=JSON.parse(fs.readFileSync(path.join(__dirname,'candidate.bundle.json'),'utf8'));
const file=path.join(root,'index.html'),read=fs.readFileSync.bind(fs),base=read(file,'utf8');
const blob=createHash('sha1').update('blob '+Buffer.byteLength(base)+'\0').update(base).digest('hex');if(blob!==bundle.baseBlob)throw Error('BASE_PROVENANCE_MISMATCH');
for(const [name,content]of Object.entries(bundle.assets)){if(!/^[a-z0-9.-]+\.(js|cjs)$/.test(name))throw Error('ASSET_PATH');if(fs.existsSync(path.join(root,'assets',name)))throw Error('EXISTING_ASSET_COLLISION');fs.writeFileSync(path.join(root,'assets',name),content);}
let candidate=base.replace("for(const kind of ['favorites','review','history']){if(kind==='history'&&window.ManHistory?.enabled)continue;localStorage.setItem","for(const kind of ['review','history']){if(kind==='history'&&window.ManHistory?.enabled)continue;localStorage.setItem");
const scripts=['wishlist.js','achievements.js','wishlist-host.js','bc-integration.js','bc-host.js','achievement-host.js','learning-events.js'].map(n=>`<script src="assets/${n}"></script>`).join('\n')+'\n<script type="module" src="assets/practice-achievement-bridge.js"></script>\n';candidate=candidate.replace('</body>',scripts+'</body>');
if(bundle.profileFix){candidate=candidate.replace('</head>','<style id="man-profile-viewport-prepared">'+bundle.profileFix+'</style></head>').replace('<div style="display: flex; gap: 10px; justify-content: flex-end;">','<div class="man-profile-actions">');}
fs.readFileSync=(name,...args)=>path.resolve(String(name))===file?(args[0]==='utf8'?candidate:Buffer.from(candidate)):read(name,...args);
process.argv[2]=root;require(path.join(root,'nonproduction/learner-reliability/preview-server.cjs'));
