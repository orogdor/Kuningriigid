// V341 read-only performance survey for reports/perf-survey-v341.json.
// It measures the real game; it does not change anything. SwiftShader is a CPU
// renderer, so GPU numbers are not hardware FPS. JavaScript self time is useful.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.TREE_NODE_MODULES?process.env.TREE_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..'),mime={'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg'};
let served=0,bytes=0;
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]);const f=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)res.writeHead(404).end();else{served++;bytes+=b.length;res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(b)}})});
function summarise(profile,limit=25){
 const nodes=new Map(profile.nodes.map(n=>[n.id,n])),self=new Map();
 const dt=profile.timeDeltas;let total=0;
 for(let i=0;i<profile.samples.length;i++){const n=nodes.get(profile.samples[i]),ms=(dt[i]||0)/1000;total+=ms;
  const f=n.callFrame,key=(f.functionName||'(anonymous)')+' '+(f.url.split('/').pop().split('?')[0])+':'+(f.lineNumber+1);
  self.set(key,(self.get(key)||0)+ms);}
 const files=new Map();for(const [k,v] of self){const file=k.split(' ').pop().split(':')[0]||'(native)';files.set(file,(files.get(file)||0)+v);}
 const top=[...self].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([k,v])=>({fn:k,ms:+v.toFixed(1),pct:+(100*v/total).toFixed(1)}));
 const byFile=[...files].sort((a,b)=>b[1]-a[1]).slice(0,15).map(([k,v])=>({file:k,ms:+v.toFixed(1),pct:+(100*v/total).toFixed(1)}));
 return {totalMs:+total.toFixed(0),top,byFile};
}
(async()=>{
 await new Promise(r=>server.listen(8774,'127.0.0.1',r));
 const launch={headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']};
 if(process.env.CHROMIUM_PATH)launch.executablePath=process.env.CHROMIUM_PATH;
 const browser=await chromium.launch(launch);
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{let x=8417;Math.random=()=>((x=(x*1103515245+12345)>>>0)/4294967296);});
 await page.addInitScript(()=>localStorage.setItem('kingdoms-graphics-v226',JSON.stringify({preset:'low',renderer:'webgl',resolution:50,shadows:'off',vegetation:'low',water:'simple',clouds:false,fpsLimit:'unlimited',adaptiveResolution:false})));
 const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:500});
 const t0=Date.now();await cdp.send('Profiler.start');
 await page.goto('http://127.0.0.1:8774/index.html?autostart=1&gpu=0&v=341',{waitUntil:'domcontentloaded',timeout:180000});
 const domMs=Date.now()-t0;
 await page.waitForFunction(()=>window.gameDebug,null,{timeout:240000});
 const bootMs=Date.now()-t0;const boot=summarise((await cdp.send('Profiler.stop')).profile);
 const bootFiles={served,bytes};
 const timing=await page.evaluate(()=>{const r=performance.getEntriesByType('resource');return {resources:r.length,scripts:r.filter(e=>e.initiatorType==='script'||/\.m?js$/.test(e.name.split('?')[0])).length,
  slowest:r.sort((a,b)=>b.duration-a.duration).slice(0,8).map(e=>({name:e.name.split('/').pop(),ms:Math.round(e.duration),kb:Math.round((e.transferSize||e.encodedBodySize||0)/1024)}))};});
 await page.evaluate(()=>document.getElementById('continue')?.click());await page.waitForTimeout(3000);
 const info=()=>page.evaluate(()=>{const r=gameDebug.rendererV328,i=r.info;let meshes=0,instanced=0,instances=0,lights=0,shadow=0;const sc=gameDebug.activeTileV242()?gameDebug.localScene:gameDebug.worldScene;
  sc.traverseVisible(o=>{if(o.isMesh){meshes++;if(o.castShadow)shadow++;}if(o.isInstancedMesh){instanced++;instances+=o.count;}if(o.isLight)lights++;});
  return {calls:i.render.calls,triangles:i.render.triangles,geometries:i.memory.geometries,textures:i.memory.textures,programs:i.programs?.length,visibleMeshes:meshes,instancedMeshes:instanced,instances,lights,shadowCasters:shadow};});
 async function measure(label,ms,during){
  await cdp.send('Profiler.start');
  const frames=await page.evaluate(async({ms,move})=>{const times=[];let last=performance.now(),go=true;const loop=t=>{times.push(t-last);last=t;if(go)requestAnimationFrame(loop);};requestAnimationFrame(loop);
   const end=performance.now()+ms;let z=0;while(performance.now()<end){if(move){z-=13;gameDebug.focusV250(0,z,0);}await new Promise(r=>setTimeout(r,200));}
   go=false;times.sort((a,b)=>a-b);return {count:times.length,median:+times[times.length>>1].toFixed(1),p95:+times[Math.floor(times.length*.95)].toFixed(1)};},{ms,move:during==='move'});
  const prof=summarise((await cdp.send('Profiler.stop')).profile);
  return {label,frames,renderer:await info(),profile:prof};
 }
 const world=await measure('world map idle',15000);
 const start=await page.evaluate(()=>{const g=gameDebug.gameV249();g.seen=()=>true;const own=g.s.cities.find(c=>c.team===0)||g.s.armies.find(a=>a.team===0);gameDebug.openTileV249(own.c,own.r);return {c:own.c,r:own.r};});
 await page.evaluate(async()=>{const st=gameDebug.detailStreamV242,t=performance.now();while(performance.now()-t<180000){if(st.status().tiles.filter(x=>x.visible).every(x=>x.ready))break;await new Promise(r=>setTimeout(r,500));}});
 const detailIdle=await measure('detail map idle (own city, 5x5 loaded)',15000);
 const detailMove=await measure('detail map moving north',20000,'move');
 const extra=await page.evaluate(()=>{const g=gameDebug.gameV249(),s=g.s;let res=0;for(const e of gameDebug.detailStreamV242.entries.values())res+=e.world?.resources?.length||0;
  return {cities:s.cities.length,armies:s.armies.length,units:s.units?.length,settlers:s.settlers?.length,cells:g.cells.length,streamTiles:gameDebug.detailStreamV242.entries.size,resourcesInStreamTiles:res,stream:gameDebug.detailStreamV242.status().maxBackgroundJobMs,slowestStage:gameDebug.detailStreamV242.status().slowestStage};});
 const report={version:await page.title(),note:'SwiftShader software rendering at 1280x720, 50% resolution, low preset. Frame times include CPU-rendered GPU work and are not hardware FPS. JS self-time shares are the useful signal.',
  boot:{domMs,bootMs,files:bootFiles,timing,profile:boot},start,world,detailIdle,detailMove,extra,errors};
 fs.writeFileSync(path.join(root,'reports/perf-survey-v341.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({boot:{bootMs,files:bootFiles},world:world.frames,detailIdle:detailIdle.frames,detailMove:detailMove.frames,extra,errors},null,1));
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1)});
