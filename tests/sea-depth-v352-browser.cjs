// V352: world sea as flat plane + depth texture. Screenshots of the same coasts with a frozen water
// clock (compare against main), sea load time, and the sea's triangle count.
// Run: TREE_NODE_MODULES=... CHROMIUM_PATH=... node tests/sea-depth-v352-browser.cjs out-prefix [query]
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.TREE_NODE_MODULES?process.env.TREE_NODE_MODULES+'/playwright':'playwright');
const root=process.env.ROOT?path.resolve(process.env.ROOT):path.resolve(__dirname,'..'),prefix=process.argv[2],query=process.argv[3]||'';
const PORT=+(process.env.PORT||8796);
const mime={'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const p=decodeURIComponent(req.url.split('?')[0]);const f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)res.writeHead(404).end();else{res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(b)}})});
(async()=>{
 await new Promise(r=>server.listen(PORT,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e).slice(0,300)));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text().slice(0,300))});
 await page.addInitScript(()=>{let x=8417;Math.random=()=>((x=(x*1103515245+12345)>>>0)/4294967296);});
 await page.addInitScript(()=>localStorage.setItem('kingdoms-graphics-v226',JSON.stringify({preset:'high',resolution:50,adaptiveResolution:false,fpsLimit:'unlimited'})));
 const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:500});await cdp.send('Profiler.start');
 await page.goto('http://127.0.0.1:'+PORT+'/index.html?autostart=1'+query,{waitUntil:'domcontentloaded',timeout:180000});
 await page.waitForFunction(()=>window.gameDebug,null,{timeout:300000});
 const {profile}=await cdp.send('Profiler.stop');
 // inclusive load time of the sea builders
 const nodes=new Map(profile.nodes.map(n=>[n.id,n])),parent=new Map();for(const n of profile.nodes)for(const c of n.children||[])parent.set(c,n.id);
 const load={};for(let i=0;i<profile.samples.length;i++){let id=profile.samples[i];const seen=new Set();while(id!=null){const f=nodes.get(id).callFrame.functionName;if(/^(atlasSeaGeometryV326|atlasSeaDepthTextureV352|createAtlasDecor)$/.test(f)&&!seen.has(f)){seen.add(f);load[f]=(load[f]||0)+profile.timeDeltas[i]/1000;}id=parent.get(id);}}
 for(const k in load)load[k]=Math.round(load[k]);
 await page.evaluate(()=>document.getElementById('continue')?.click());await page.waitForTimeout(5000);
 await page.evaluate(async()=>{const pause=document.getElementById('pause');if(pause&&pause.textContent!=='▶')pause.click();
  const {CLOUD_TIME}=await import('./atmosphere-v158.js?v=161a');const r=gameDebug.rendererV328,real=r.render.bind(r);r.render=(a,b)=>{CLOUD_TIME.value=123.4;return real(a,b)};});
 const info=await page.evaluate(()=>{const {worldScene}=gameDebug.scenesV250();let sea=null;worldScene.traverse(o=>{if(o.userData?.water&&o.isMesh)sea=o});const g=sea.geometry;
  return {name:sea.name,triangles:(g.index?g.index.count:g.attributes.position.count)/3,vertices:g.attributes.position.count,depthMap:sea.userData.seaDepthV352?{w:sea.userData.seaDepthV352.width,h:sea.userData.seaDepthV352.height}:null};});
 // coasts: a river mouth, open coast, an island/strait if present
 const spots=await page.evaluate(()=>{const g=gameDebug.gameV249(),cells=g.cells,pick=[];
  const mouth=cells.find(c=>c.coast&&c.river&&c.c>20&&c.r>20);if(mouth)pick.push(['river-mouth',mouth.c,mouth.r]);
  const coasts=cells.filter(c=>c.land&&c.coast);for(const f of [.2,.5,.8]){const c=coasts[Math.floor(coasts.length*f)];pick.push(['coast-'+f,c.c,c.r]);}
  return pick;});
 const shots=[];
 for(const [name,c,r] of spots)for(const zoom of [260,900,3000]){
  await page.evaluate(([c,r,z])=>gameDebug.lookAtV249(c,r,z),[c,r,zoom]);await page.waitForTimeout(3500);
  const file=prefix+'-'+name+'-z'+zoom+'.png';await page.screenshot({path:file});shots.push(file);
 }
 const report={info,loadMs:load,spots,shots,errors};fs.writeFileSync(prefix+'.json',JSON.stringify(report,null,1));console.log(JSON.stringify(report,null,1));
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1)});
