// V341 real-game check: while the camera travels across the detail map, the
// tiles the camera sees beyond the 3x3 neighbourhood receive full detail.
// SwiftShader software rendering: a loading/behaviour check, not an FPS test.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.TREE_NODE_MODULES?process.env.TREE_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..'),mime={'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]);const f=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)res.writeHead(404).end();else{res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(b)}})});
(async()=>{
 await new Promise(r=>server.listen(8771,'127.0.0.1',r));
 const launch={headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']};
 if(process.env.CHROMIUM_PATH)launch.executablePath=process.env.CHROMIUM_PATH;
 const browser=await chromium.launch(launch);
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>{errors.push(String(e));console.log('pageerror',String(e))});
 // Same world in every run: deterministic Math.random for the whole page.
 await page.addInitScript(()=>{let x=8417;Math.random=()=>((x=(x*1103515245+12345)>>>0)/4294967296);});
 await page.addInitScript(()=>localStorage.setItem('kingdoms-graphics-v226',JSON.stringify({preset:'low',renderer:'webgl',resolution:50,shadows:'off',vegetation:'low',water:'simple',clouds:false,fpsLimit:'30',adaptiveResolution:false})));
 const t0=Date.now();
 await page.goto('http://127.0.0.1:8771/index.html?autostart=1&gpu=0&v=341',{waitUntil:'domcontentloaded',timeout:180000});
 await page.waitForFunction(()=>window.gameDebug,null,{timeout:240000});
 const bootMs=Date.now()-t0;console.log('game booted',bootMs,'ms');
 await page.evaluate(()=>{document.getElementById('continue')?.click();});
 await page.waitForTimeout(1500);
 // Instrument per-stage background job cost for the report.
 const start=await page.evaluate(()=>{
  const g=gameDebug.gameV249(),st=gameDebug.detailStreamV242;
  window.stageCostV341={};const step=st.step.bind(st);
  st.step=(entry,bg)=>{const s0=performance.now(),stage=entry?.stage;step(entry,bg);const ms=performance.now()-s0,k=stage||'start';const c=window.stageCostV341[k]||(window.stageCostV341[k]={ms:0,steps:0,max:0});c.ms+=ms;c.steps++;c.max=Math.max(c.max,ms);if(ms>20)(window.longStepsV342||(window.longStepsV342=[])).push({stage:k,ms:+ms.toFixed(1)});};
  // A land tile with visible land around it, far from the map edge.
  const own=g.s.armies.find(a=>a.team===0)||g.s.cities.find(c=>c.team===0);
  let best=null,score=-1;
  for(const cell of g.cells){if(!cell.land||cell.c<5||cell.r<10)continue;
   let n=0,edge=false;for(let dr=-8;dr<=3;dr++)for(let dc=-3;dc<=3;dc++){const x=g.cell({c:cell.c+dc,r:cell.r+dr});if(!x)edge=true;else if(x.land)n++;}if(edge)continue;
   const d=own?Math.hypot(cell.c-own.c,cell.r-own.r):0;if(n-d*.01>score){score=n-d*.01;best=cell;}}
  return {c:best.c,r:best.r,radius:st.radius,reach:st.reach};
 });
 // Make tiles ahead visitable for the test (visual reveal only).
 await page.evaluate(()=>{const g=gameDebug.gameV249();g.seen=()=>true;});
 await page.evaluate(t=>gameDebug.openTileV249(t.c,t.r),start);
 // Initial 5x5 window, with the same simulated 60 fps tick budget.
 const initialMs=await page.evaluate(async()=>{const st=gameDebug.detailStreamV242,t=performance.now();
  while(performance.now()-t<240000){const s=st.status();if(s.tiles.filter(x=>x.visible).every(x=>x.ready||x.visualReady))break;for(let k=0;k<15;k++)st.tick();await new Promise(r=>setTimeout(r,250));}
  return performance.now()-t;});
 const initial=await page.evaluate(()=>{const s=gameDebug.detailStreamV242.status();return {visible:s.tiles.filter(t=>t.visible).length,ready:s.tiles.filter(t=>t.visible&&t.ready).length,outerTiles:s.tiles.filter(t=>t.visible).length-9,desired:s.desired?.length};});
 console.log('initial',initial);
 // Travel north (up the screen) across several tiles at a steady pace.
 // Camera keys move zoom*.65 = 130 units/s at zoom 200 (Shift doubles it).
 // Default 26 units per 6 loader ticks: Shift at 60 fps, or normal speed at
 // 30 fps. V340 fell back to ~3 complete outer tiles here (the 3x3 report).
 const SPEED=Number(process.env.V341_STEP||26),TICKS=Number(process.env.V341_TICKS||6),STEPS=Number(process.env.V341_STEPS||120);
 const samples=await page.evaluate(async({SPEED,TICKS,STEPS})=>{
  const st=gameDebug.detailStreamV242,out=[];let frames=0,last=performance.now(),worst=0;const times=[];
  const tick=()=>{const now=performance.now(),dt=now-last;last=now;frames++;times.push(dt);worst=Math.max(worst,dt);};
  const loop=()=>{tick();if(!done)requestAnimationFrame(loop);};let done=false;requestAnimationFrame(loop);
  const centre=()=>st.center.c+':'+st.center.r;
  // Stages that start only after a tile's sea and buildings exist (V340 built
  // them after the horizon; V341 before it).
  const after=document.title.includes('V340')?['navigation','roads']:['horizon','rivers','outcrops','navigation','roads'];
  for(let i=0;i<STEPS;i++){
   const key=centre();
   gameDebug.focusV250((window.__fx||0),(window.__fz=(window.__fz||0)-SPEED),0);
   // Software rendering gives ~1 frame/s; run the loader budget of the 60 fps
   // frames this movement takes, so SwiftShader does not limit loading.
   for(let k=0;k<TICKS;k++)st.tick();
   // Wait for two real game frames so followDetail/prefetch/setView have run.
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   if(centre()!==key){window.__fz+=195;} // the game rebased the camera by one tile
   const s=st.status(),c=st.center;
   const vis=s.tiles.filter(t=>t.visible),outer=vis.filter(t=>{const [x,y]=t.key.split(':').map(Number);return Math.max(Math.abs(x-c.c),Math.abs(y-c.r))>=2;});
   out.push({i,centre:centre(),visible:vis.length,outer:outer.length,outerLoaded:outer.filter(t=>t.terrain&&!['terrain','local world','resources','ground cover'].includes(t.stage)||t.ready).length,outerComplete:outer.filter(t=>t.ready||(after||[]).includes(t.stage)).length,ahead:vis.filter(t=>Number(t.key.split(':')[1])<c.r-1).length,target:st.targetKey,targetStage:st.targetKey&&st.entries.get(st.targetKey)?.stage,targetReady:!!(st.targetKey&&st.entries.get(st.targetKey)?.ready)});
  }
  done=true;times.sort((a,b)=>a-b);
  return {out,frames,worst,median:times[times.length>>1],p95:times[Math.floor(times.length*.95)],crossings:st.stats.crossings};
 },{SPEED,TICKS,STEPS});
 const stages=await page.evaluate(()=>window.stageCostV341);const longSteps=await page.evaluate(()=>window.longStepsV342||[]);
 const last=samples.out;
 const outerAvg=last.reduce((a,s)=>a+s.outer,0)/last.length,loadedAvg=last.reduce((a,s)=>a+s.outerLoaded,0)/last.length;
 const report={version:await page.title(),movement:{unitsPerStep:SPEED,ticksPerStep:TICKS,steps:STEPS},bootMs,start,initial,initialMs,crossings:samples.crossings,frames:samples.frames,frameMs:{median:samples.median,p95:samples.p95,worst:samples.worst},
  outerVisibleAvg:outerAvg,outerLoadedAvg:loadedAvg,outerCompleteAvg:last.reduce((a,s)=>a+s.outerComplete,0)/last.length,samples:samples.out,stageCostMs:stages,longSteps,errors,
  renderer:'SwiftShader software WebGL, 1280x720 at 50% resolution; loading behaviour check, not a hardware FPS test'};
 fs.mkdirSync(path.join(root,'reports'),{recursive:true});
 fs.writeFileSync(path.join(root,process.env.V341_REPORT||'reports/detail-stream-v341-browser.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({...report,samples:undefined},null,2));
 await browser.close();server.close();
 const completeAvg=last.reduce((a,s)=>a+s.outerComplete,0)/last.length;
 const ok=!errors.length&&initial.visible===25&&samples.crossings>=4&&completeAvg>=12;
 if(!ok){console.error('V341 browser check FAILED');process.exitCode=1;}else console.log('V341 real-game camera-driven detail streaming PASS');
})().catch(e=>{console.error(e);server.close();process.exit(1)});
