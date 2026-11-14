// V352 analysis: what holds the frame rate back now? Main-thread CPU profile per scenario,
// frame times, and per-frame draw load (draw calls, triangles, render passes, scene objects).
// The game runs with the default "high" graphics preset (resolution 50 % so the software GPU keeps up),
// the simulation keeps running at normal speed while measuring.
// Run: TREE_NODE_MODULES=/path/to/node_modules CHROMIUM_PATH=/usr/bin/google-chrome \
//      node tests/fps-analysis-v352-browser.cjs [out.json]
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.TREE_NODE_MODULES?process.env.TREE_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..'),out=process.argv[2]||path.join(root,'reports/fps-analysis-v352.json');
const PORT=+(process.env.PORT||8795),FF=+(process.env.FF||1200),MS=+(process.env.MS||15000),SHOTS=process.env.SHOTS||'';
const mime={'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.ktx2':'application/octet-stream'};
const server=http.createServer((req,res)=>{const p=decodeURIComponent(req.url.split('?')[0]);const f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)res.writeHead(404).end();else{res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(b)}})});

function analyse(profile){
 const nodes=new Map(profile.nodes.map(n=>[n.id,n])),parent=new Map();
 for(const n of profile.nodes)for(const c of n.children||[])parent.set(c,n.id);
 const label=n=>{const f=n.callFrame,file=f.url.split('/').pop().split('?')[0];return (f.functionName||'(anon)')+' '+(file||'')+(file?':'+(f.lineNumber+1):'');};
 const self={},incl={},byFile={},dt=profile.timeDeltas;let total=0;
 for(let i=0;i<profile.samples.length;i++){
  const ms=dt[i]/1000;total+=ms;let id=profile.samples[i];const leaf=nodes.get(id),lf=leaf.callFrame;
  const fileKey=lf.url?lf.url.split('/').pop().split('?')[0]:'('+(lf.functionName||'native')+')';
  byFile[fileKey]=(byFile[fileKey]||0)+ms;self[label(leaf)]=(self[label(leaf)]||0)+ms;
  const seen=new Set();
  while(id!=null){const k=label(nodes.get(id));if(!seen.has(k)){seen.add(k);incl[k]=(incl[k]||0)+ms;}id=parent.get(id);}
 }
 const top=(o,n)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>[k,+v.toFixed(1)]);
 return {totalMs:+total.toFixed(0),idleMs:+((self['(idle) ']||0)+(self['(program) ']||0)).toFixed(0),gcMs:+(self['(garbage collector) ']||0).toFixed(0),self:top(self,40),inclusive:top(incl,60),byFile:top(byFile,30)};
}
(async()=>{
 await new Promise(r=>server.listen(PORT,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e).slice(0,300)));
 await page.addInitScript(()=>{let x=8417;Math.random=()=>((x=(x*1103515245+12345)>>>0)/4294967296);});
 await page.addInitScript(()=>localStorage.setItem('kingdoms-graphics-v226',JSON.stringify({preset:'high',resolution:50,adaptiveResolution:false,fpsLimit:'unlimited'})));
 await page.goto('http://127.0.0.1:'+PORT+'/index.html?autostart=1',{waitUntil:'domcontentloaded',timeout:180000});
 await page.waitForFunction(()=>window.gameDebug,null,{timeout:300000});
 await page.evaluate(()=>document.getElementById('continue')?.click());await page.waitForTimeout(6000);
 // grow the world with the real simulation (player founds every settler)
 const setup=await page.evaluate(async FF=>{const g=gameDebug.gameV249(),s=g.s;const t0=performance.now();let n=0;
  for(let t=0;t<FF;t+=.5){g.tick(.5);n++;if(n%200===0)await new Promise(r=>setTimeout(r,0));if(n%20===0)for(const a of s.settlers.filter(a=>a.team===0))g.found(a.id);}
  return {ffMs:Math.round(performance.now()-t0),gameTime:Math.round(s.time),cities:s.cities.length,ownCities:s.cities.filter(c=>c.team===0).length,armies:s.armies?.length,territory:g.territory?.size,
   pop:s.cities.map(c=>c.team+':'+Math.round(c.economy.realms[c.team].pop)).join(' ')};},FF);
 // per-frame draw load: renderer.info summed over all render() calls of one animation frame
 await page.evaluate(()=>{const r=gameDebug.rendererV328;r.info.autoReset=false;window.__frameInfo=[];
  const tick=()=>{const i=r.info;window.__frameInfo.push({calls:i.render.calls,tris:i.render.triangles,lines:i.render.lines,points:i.render.points,renders:i.render.frame});i.reset();requestAnimationFrame(tick);};requestAnimationFrame(tick);
  const real=r.render.bind(r);let passes=0;window.__stub=false;
  r.render=function(scene,camera){passes++;if(window.__wantBreakdown){window.__wantBreakdown=false;window.__breakdown=breakdown(scene,camera);}if(window.__stub)return;return real(scene,camera)};
  window.__passes=()=>{const p=passes;passes=0;return p};
  // triangles per object group that pass three.js frustum culling (main pass, as WebGLRenderer.projectObject does)
  function breakdown(scene,camera){
   const T=camera.constructor.__proto__,frustum=new (Object.getPrototypeOf(camera.projectionMatrix).constructor===Object?null:Object)();
   camera.updateMatrixWorld();const m=camera.projectionMatrix.clone().multiply(camera.matrixWorldInverse);
   const planes=[];const e=m.elements;const pl=(a,b,c,d)=>{const l=Math.hypot(a,b,c);planes.push([a/l,b/l,c/l,d/l]);};
   pl(e[3]-e[0],e[7]-e[4],e[11]-e[8],e[15]-e[12]);pl(e[3]+e[0],e[7]+e[4],e[11]+e[8],e[15]+e[12]);pl(e[3]+e[1],e[7]+e[5],e[11]+e[9],e[15]+e[13]);
   pl(e[3]-e[1],e[7]-e[5],e[11]-e[9],e[15]-e[13]);pl(e[3]-e[2],e[7]-e[6],e[11]-e[10],e[15]-e[14]);pl(e[3]+e[2],e[7]+e[6],e[11]+e[10],e[15]+e[14]);
   const inFrustum=o=>{if(!o.frustumCulled)return true;const g=o.geometry;if(!g)return true;if(o.isInstancedMesh){if(!o.boundingSphere&&o.computeBoundingSphere)o.computeBoundingSphere();var bs=o.boundingSphere;}else{if(!g.boundingSphere)g.computeBoundingSphere();var bs=g.boundingSphere;}if(!bs)return true;
    const c=bs.center.clone().applyMatrix4(o.matrixWorld),r=bs.radius*o.matrixWorld.getMaxScaleOnAxis();for(const [a,b,cc,d] of planes)if(a*c.x+b*c.y+cc*c.z+d<-r)return false;return true;};
   const groups={};let total=0,calls=0;
   const nameOf=o=>{const parts=[];let x=o,depth=0;while(x&&x!==scene&&parts.length<2&&depth<8){if(x.name)parts.unshift(x.name);x=x.parent;depth++;}return (parts.join(' / ')||'(unnamed '+o.type+')');};
   scene.traverseVisible(o=>{if(!(o.isMesh||o.isLine||o.isPoints||o.isSprite))return;if(!inFrustum(o))return;const g=o.geometry;if(!g)return;
    const n=g.index?g.index.count:(g.attributes.position?.count||0),dr=g.drawRange,cnt=Math.min(n,dr.count===Infinity?n:dr.count);
    const inst=o.isInstancedMesh?o.count:(g.isInstancedBufferGeometry?(g.instanceCount===Infinity?1:g.instanceCount):1);const tris=o.isMesh?Math.round(cnt/3)*inst:0;
    const k=nameOf(o)+(o.isInstancedMesh?' [inst]':o.isSkinnedMesh?' [skin]':'');const G=groups[k]||(groups[k]={tris:0,calls:0,instances:0,objects:0});
    G.tris+=tris;G.calls+=Array.isArray(o.material)?o.material.length:1;G.instances+=inst;G.objects++;total+=tris;calls+=Array.isArray(o.material)?o.material.length:1;});
   return {total,calls,top:Object.entries(groups).sort((a,b)=>b[1].tris-a[1].tris).slice(0,25).map(([k,v])=>({name:k,...v})),byCalls:Object.entries(groups).sort((a,b)=>b[1].calls-a[1].calls).slice(0,12).map(([k,v])=>({name:k,...v}))};
  }});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:250});
 const sceneStats=()=>page.evaluate(()=>{const {worldScene,localScene}=gameDebug.scenesV250();const r=gameDebug.rendererV328;
  const stat=scene=>{const o={visibleMeshes:0,instancedMeshes:0,instances:0,skinned:0,lines:0,points:0,sprites:0,lights:0,shadowLights:0,castShadow:0,objects:0,visibleObjects:0,materials:new Set(),transparent:0};
   scene.traverse(x=>{o.objects++;});
   scene.traverseVisible(x=>{o.visibleObjects++;if(x.isInstancedMesh){o.instancedMeshes++;o.instances+=x.count;}else if(x.isSkinnedMesh)o.skinned++;else if(x.isMesh)o.visibleMeshes++;if(x.isLineSegments||x.isLine)o.lines++;if(x.isPoints)o.points++;if(x.isSprite)o.sprites++;if(x.isLight){o.lights++;if(x.castShadow)o.shadowLights++;}
    if((x.isMesh||x.isInstancedMesh)&&x.castShadow)o.castShadow++;const m=x.material;if(m){for(const mm of Array.isArray(m)?m:[m]){o.materials.add(mm.uuid);if(mm.transparent)o.transparent++;}}});
   o.materials=o.materials.size;return o;};
  return {world:stat(worldScene),local:stat(localScene),memory:{...r.info.memory},programs:r.info.programs?.length,pixelRatio:r.getPixelRatio(),size:[r.domElement.width,r.domElement.height],shadowMap:r.shadowMap.enabled};});
 async function measure(name,before){
  if(before)await before();
  await page.evaluate(()=>{window.__stub=false;window.__frameInfo.length=0;window.__passes();window.__wantBreakdown=true;});
  await page.waitForTimeout(8000);
  const info=await page.evaluate(()=>{const f=window.__frameInfo.slice(1);const avg=k=>Math.round(f.reduce((a,b)=>a+b[k],0)/Math.max(1,f.length));const max=k=>Math.max(0,...f.map(x=>x[k]));return {frames:f.length,callsAvg:avg('calls'),callsMax:max('calls'),trisAvg:avg('tris'),trisMax:max('tris'),lines:avg('lines'),renderPasses:+(window.__passes()/Math.max(1,f.length)).toFixed(1),breakdown:window.__breakdown};});
  if(SHOTS)await page.screenshot({path:SHOTS+'-'+name.replace(/[^a-z]+/gi,'-')+'.png'});
  // CPU only: the 3D draw is skipped while profiling (the software GPU would hide everything else)
  await page.evaluate(()=>{window.__stub=true});await page.waitForTimeout(1500);
  await cdp.send('Profiler.start');
  const frames=await page.evaluate(async MS=>{const ft=[];let go=true,last=performance.now();const loop=t=>{ft.push(t-last);last=t;if(go)requestAnimationFrame(loop)};requestAnimationFrame(loop);
   const lt=[];const po=new PerformanceObserver(l=>{for(const e of l.getEntries())lt.push(e.duration)});try{po.observe({type:'longtask',buffered:false})}catch{}
   await new Promise(r=>setTimeout(r,MS));go=false;po.disconnect();ft.shift();const s=[...ft].sort((a,b)=>a-b),q=p=>+s[Math.min(s.length-1,Math.floor(s.length*p))].toFixed(1);
   const worst=s.slice(Math.floor(s.length*.99)),low1=worst.reduce((a,b)=>a+b,0)/Math.max(1,worst.length);
   return {frames:ft.length,cpuFps:+(1000/(ft.reduce((a,b)=>a+b,0)/ft.length)).toFixed(1),low1fps:+(1000/low1).toFixed(1),median:q(.5),p95:q(.95),p99:q(.99),max:q(1),over50:ft.filter(x=>x>50).length,over100:ft.filter(x=>x>100).length,longTasks:lt.length,longTaskMs:Math.round(lt.reduce((a,b)=>a+b,0))};},MS);
  const {profile}=await cdp.send('Profiler.stop');
  await page.evaluate(()=>{window.__stub=false});
  const scene=await sceneStats();
  const cpu=analyse(profile);
  console.log('\n=== '+name,JSON.stringify(frames));const {breakdown,...drawInfo}=info;console.log(' draw',JSON.stringify(drawInfo));if(breakdown){console.log(' visible tris',breakdown.total,'calls',breakdown.calls);for(const g of breakdown.top.slice(0,18))console.log('   ',g.tris,g.calls,g.instances,g.name);console.log('  by calls',breakdown.byCalls.slice(0,8).map(g=>g.calls+' '+g.name).join(' | '));}console.log(' scene',JSON.stringify(scene));
  console.log(' cpu total',cpu.totalMs,'idle',cpu.idleMs,'gc',cpu.gcMs);console.log(' byFile',JSON.stringify(cpu.byFile.slice(0,15)));
  console.log(' inclusive\n  '+cpu.inclusive.slice(0,40).map(x=>x.join(' = ')).join('\n  '));console.log(' self\n  '+cpu.self.slice(0,25).map(x=>x.join(' = ')).join('\n  '));
  return {frames,draw:info,scene,cpu};
 }
 const report={setup,scenarios:{}};
 console.log('setup',JSON.stringify(setup));
 await page.waitForTimeout(4000);
 report.scenarios.worldIdle=await measure('world map, camera still');
 report.scenarios.worldPan=await measure('world map, camera moves between towns',async()=>{await page.evaluate(MS=>{const g=gameDebug.gameV249(),cs=g.s.cities;let i=0;const id=setInterval(()=>{const c=cs[i++%cs.length];gameDebug.lookAtV249(c.c,c.r)},1500);setTimeout(()=>clearInterval(id),MS+500)},MS);});
 const target=await page.evaluate(()=>{const g=gameDebug.gameV249();const own=g.s.cities.filter(c=>c.team===0).sort((a,b)=>b.economy.realms[0].pop-a.economy.realms[0].pop)[0]||g.s.cities[0];gameDebug.openTileV249(own.c,own.r);return {c:own.c,r:own.r,pop:own.economy.realms[own.team].pop,team:own.team};});
 report.target=target;await page.waitForTimeout(45000); // detail streaming finishes
 report.scenarios.detailCity=await measure('detail map, largest own town');
 const forest=await page.evaluate(t=>{const g=gameDebug.gameV249();let best=null;for(let r=t.r-6;r<=t.r+6;r++)for(let c=t.c-6;c<=t.c+6;c++){const cell=g.cell({c,r});if(cell&&['forest','taiga','jungle'].includes(cell.biome)&&!g.territory.get(c+':'+r)){best={c,r,biome:cell.biome};break;}}if(best)gameDebug.openTileV249(best.c,best.r);return best;},target);
 if(forest){report.forest=forest;await page.waitForTimeout(45000);report.scenarios.detailForest=await measure('detail map, forest next to town');}
 report.errors=errors;
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,1));
 console.log('\nerrors',errors.slice(0,5));
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1)});
