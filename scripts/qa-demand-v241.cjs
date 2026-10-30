const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert'),{execFileSync}=require('child_process');
const puppeteer=require(process.env.PUPPETEER_MODULE||'puppeteer');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts-v241');fs.mkdirSync(out,{recursive:true});
const baseRef=process.env.V241_BASE_REF||'44c2c48371b2281795c97375cd2b2a145ab6c1d4';
const changed=new Set(['index.html','civilization.js','civilization-core.js','continuous-landscape-visual.js','landscape-v149.js','navigation.js','sea-v158.js','village-life-v76.js','visuals.js','soldier-models-v148.js','soldier-batch-v90.js','stone-age-models-v221.js','stone-web-buildings-v2233.js','town-models-v154.js','stone-near-lod.js']),baseline=new Map();
for(const name of changed)baseline.set(name,execFileSync('git',['show',baseRef+':'+name],{cwd:root,maxBuffer:4e6}));
let failMusketeer=false;
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),isBase=url.pathname.startsWith('/baseline/');
 const name=decodeURIComponent(url.pathname.replace(/^\/baseline/,'')).replace(/^\//,'')||'index.html';
 if(name==='empty.html'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><html><body></body></html>');}
 const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){res.writeHead(403);return res.end();}
 if(failMusketeer&&name.endsWith('/musketeer.bin')){res.writeHead(503);return res.end('test offline');}
 const send=(error,data)=>{if(error){res.writeHead(404);return res.end();}const ext=path.extname(name);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webp':'image/webp','.glb':'model/gltf-binary'})[ext]||'application/octet-stream');res.setHeader('Content-Length',data.length);res.end(data);};
 if(isBase&&baseline.has(name))return send(null,baseline.get(name));fs.readFile(file,send);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const address='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-webgl','--ignore-gpu-blocklist']});
 try{
  const measurements={};let candidate,context;
  for(const variant of ['baseline','candidate']){
   const ctx=await browser.createBrowserContext(),page=await ctx.newPage();await page.setViewport({width:1400,height:900});await page.setCacheEnabled(false);
   const errors=[],responses=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(address))responses.push({url:new URL(r.url()).pathname,bytes:Number(r.headers()['content-length']||0),status:r.status()});});
   const start=Date.now();await page.goto(address+(variant==='baseline'?'/baseline/':'/'),{waitUntil:'load',timeout:120000});
   await page.waitForFunction(()=>window.gameDebug&&document.querySelector('#menu-status')?.hidden,{timeout:120000});
   if(variant==='candidate')await page.evaluate(()=>gameDebug.assetDemandV241.settled());
   await page.waitForNetworkIdle({idleTime:500,timeout:60000});
   assert.deepEqual(errors,[],variant+' startup');
   measurements[variant]={milliseconds:Date.now()-start,bytes:responses.reduce((n,r)=>n+r.bytes,0),requests:responses.length,assets:responses.filter(r=>/\.bin|\.glb/.test(r.url))};
   if(variant==='candidate'){
    candidate=page;context=ctx;candidate.qaErrors=errors;candidate.qaResponses=responses;
    assert(!responses.some(r=>/soldiers-v148-/.test(r.url)),'no all-era pack');
    assert(!responses.some(r=>/models-v2233/.test(r.url)),'no superseded building pack');
    assert(!responses.some(r=>/rifleman|archer.bin|pottery_kiln.glb/.test(r.url)),'locked assets stay absent');
    await page.screenshot({path:path.join(out,'startup.png')});
   }else await ctx.close();
  }
  const page=candidate;
  await page.evaluate(async()=>{gameDebug.game.s.research[1].active='archery';gameDebug.assetDemandV241.update();await gameDebug.assetDemandV241.settled();});
  assert(page.qaResponses.some(r=>r.url.endsWith('/archer.bin')),'AI starts archery: archer preloads');
  assert(page.qaResponses.some(r=>r.url.endsWith('/archery.glb')),'AI starts archery: range preloads');
  assert(!page.qaResponses.some(r=>/rifleman|pottery_kiln.glb/.test(r.url)),'unrelated assets stay absent');
  const hydrated=await page.evaluate(async()=>{
   const T=await import('./vendor/three.module.js'),V=await import('./visuals.js'),S=await import('./soldier-models-v148.js');
   const holder=new T.Group(),a=V.createSoldier(holder,2,3,'#9a9a60','rifleman'),b=V.createSoldier(holder,5,3,'#9a9a60','rifleman');
   const marker=new T.Group();marker.name='caller marker';a.add(marker);a.userData.noBatchV239=true;a.scale.setScalar(1.2);
   const pending=a.userData.assetPendingV241;
   await S.loadSoldierV241('rifleman');await Promise.resolve();
   V.animateSoldier(a,1,true);V.animateSoldier(b,2,false);
   a.updateMatrixWorld(true);const size=new T.Box3().setFromObject(a).getSize(new T.Vector3());
   return {pending,v148:!!a.userData.rig.v148,marker:a.children.includes(marker),position:a.position.toArray(),scale:a.scale.x,metadata:a.userData.noBatchV239,size:size.toArray()};
  });
  assert(hydrated.pending&&hydrated.v148&&hydrated.marker&&hydrated.metadata,JSON.stringify(hydrated));assert.deepEqual(hydrated.position,[2,0,3]);assert.equal(hydrated.scale,1.2);assert(hydrated.size.every(Number.isFinite));
  assert.equal(page.qaResponses.filter(r=>r.url.endsWith('/rifleman.bin')).length,1,'concurrent soldiers share request');
  failMusketeer=true;
  const offline=await page.evaluate(async()=>{const T=await import('./vendor/three.module.js'),V=await import('./visuals.js'),S=await import('./soldier-models-v148.js');const a=V.createSoldier(new T.Group(),0,0,'#999999','musketeer');try{await S.loadSoldierV241('musketeer');}catch{}await Promise.resolve();V.animateSoldier(a,2,true);return {children:a.children.length,rig:!!a.userData.rig};});
  assert(offline.children>0&&offline.rig,'failed asset retains playable fallback');
  const humanContext=await browser.createBrowserContext(),humanPage=await humanContext.newPage();
  await humanPage.goto(address+'/empty.html');
  const civilian=await humanPage.evaluate(async()=>{
   const T=await import('./vendor/three.module.js'),V=await import('./visuals.js'),S=await import('./stone-age-models-v221.js?v=224');
   if(S.stoneAssetsReady())throw Error('Civilian rig downloaded on import');
   const human=V.createSoldier(new T.Group(),2,4,'#999999','stone_builder');
   const wasPending=human.userData.assetPendingV241;await S.loadStoneHumanV241();await Promise.resolve();
   V.animateSoldier(human,2,true);human.updateMatrixWorld(true);
   return {wasPending,ready:!!human.userData.rig.stoneHuman,position:human.position.toArray(),size:new T.Box3().setFromObject(human).getSize(new T.Vector3()).toArray()};
  });
  assert(civilian.wasPending&&civilian.ready,JSON.stringify(civilian));assert.deepEqual(civilian.position,[2,0,4]);assert(civilian.size.every(Number.isFinite));
  await humanContext.close();
  const buildings=await page.evaluate(async()=>{
   const T=await import('./vendor/three.module.js');
   const types=['hall','house','farm','quarry'];
   const models=types.map(type=>gameDebug.catalogV163.townBuildingModel(type,0,0,0,41));
   const placeholders=models.map(m=>!!m.low&&m.low.children.length>0);
   const detailed=await Promise.all(models.map(m=>m.build()));await Promise.resolve();
   return models.map((m,i)=>({type:types[i],placeholder:placeholders[i],lod:!!m.userData.stoneNearLOD,asset:detailed[i].userData.stoneDetailedAsset,
    size:new T.Box3().setFromObject(detailed[i]).getSize(new T.Vector3()).toArray()}));
  });
  assert(buildings.every(b=>b.placeholder&&b.lod&&b.size.every(v=>Number.isFinite(v)&&v>0)),JSON.stringify(buildings));
  // Start the actual game, enter the scout's tile and verify visible meshes.
  await page.click('#continue');
  await page.evaluate(()=>{const a=gameDebug.state.armies.find(a=>a.team===0);gameDebug.openTile(gameDebug.game.cell(a));});
  await page.waitForFunction(()=>{let n=0;gameDebug.localScene.traverseVisible(o=>{if(o.isMesh)n++;});return n>20;});
  await page.waitForNetworkIdle({idleTime:500,timeout:60000});await page.screenshot({path:path.join(out,'scout-detail.png')});
  assert.deepEqual(page.qaErrors,[],'no uncaught errors during streaming/play');
  measurements.hydrated=hydrated;measurements.offline=offline;measurements.civilian=civilian;measurements.buildings=buildings;measurements.savedBytes=measurements.baseline.bytes-measurements.candidate.bytes;
  assert(measurements.savedBytes>0,'initial download must shrink');
  const mobileContext=await browser.createBrowserContext(),mobile=await mobileContext.newPage();
  await mobile.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await mobile.evaluateOnNewDocument(()=>localStorage.setItem('kingdoms-quality','medium'));
  const mobileAssets=[];mobile.on('response',r=>{if(r.url().includes('models-v241'))mobileAssets.push(r.url());});
  const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(e.message));
  await mobile.goto(address,{waitUntil:'load',timeout:120000});
  await mobile.waitForFunction(()=>window.gameDebug&&document.querySelector('#menu-status')?.hidden,{timeout:120000});
  await mobile.evaluate(()=>gameDebug.assetDemandV241.settled());
  const mobileStatus=await mobile.evaluate(async()=>({width:innerWidth,lod:(await import('./soldier-models-v148.js')).V148_LOD,quality:localStorage.getItem('kingdoms-quality')}));
  assert(mobileAssets.some(n=>n.includes('/low/scout.bin')),'mobile uses low pack: '+JSON.stringify({mobileAssets,mobileStatus}));assert(!mobileAssets.some(n=>n.includes('/high/')));
  await mobile.screenshot({path:path.join(out,'mobile.png')});assert.deepEqual(mobileErrors,[]);await mobileContext.close();
  fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify(measurements,null,2));
  console.log(JSON.stringify({baselineBytes:measurements.baseline.bytes,candidateBytes:measurements.candidate.bytes,savedBytes:measurements.savedBytes,hydrated,offline}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
