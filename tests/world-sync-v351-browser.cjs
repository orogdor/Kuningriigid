// V351 measurement: what does discovering new map tiles cost on the world map?
// The real game is started in Chrome, the realm is made large (test-only population boost so the
// territory is roughly late-game sized), then the player's vision is extended step by step with
// game.reveal(). A CPU profile attributes main-thread time to the worldSync() parts.
// Run: TREE_NODE_MODULES=/path/to/node_modules CHROMIUM_PATH=/usr/bin/google-chrome \
//      node tests/world-sync-v351-browser.cjs [out.json] [screenshot-prefix]
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.TREE_NODE_MODULES?process.env.TREE_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..'),out=process.argv[2]||path.join(root,'reports/world-sync-v351.json'),shots=process.argv[3]||'';
const PORT=+(process.env.PORT||8793),STEPS=+(process.env.STEPS||40),POP=+(process.env.POP||0),FF=+(process.env.FF||2400);
const mime={'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]);const f=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)res.writeHead(404).end();else{res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(b)}})});
const WATCH=['territory','roads','route','refreshResourceArea','refreshCultivation','refreshFogCover','refreshFogSketches','worldSync','update','createUnifiedRoadNetwork','regionFill','regionContour','cellRegion','refreshTerritory','allocateTerritory','setCultivation'];
function totals(profile){
 // total (inclusive) time per watched function name, counted once per stack
 const nodes=new Map(profile.nodes.map(n=>[n.id,n])),parent=new Map();
 for(const n of profile.nodes)for(const c of n.children||[])parent.set(c,n.id);
 const dt=profile.timeDeltas,res={};
 for(let i=0;i<profile.samples.length;i++){
  const seen=new Set();let id=profile.samples[i];
  while(id!=null){const n=nodes.get(id),name=n.callFrame.functionName,file=n.callFrame.url.split('/').pop().split('?')[0];
   if(WATCH.includes(name)){const k=name+' ('+file+')';if(!seen.has(k)){seen.add(k);res[k]=(res[k]||0)+dt[i]/1000;}}
   id=parent.get(id);}
 }
 for(const k in res)res[k]=+res[k].toFixed(1);
 return Object.fromEntries(Object.entries(res).sort((a,b)=>b[1]-a[1]));
}
(async()=>{
 await new Promise(r=>server.listen(PORT,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e).slice(0,300)));
 await page.addInitScript(()=>{let x=8417;Math.random=()=>((x=(x*1103515245+12345)>>>0)/4294967296);});
 // REVEAL=0: real fog of war. Default (as in the game today, V248): the whole map is shown.
 if(process.env.REVEAL==='0')await page.addInitScript(()=>localStorage.setItem('kingdoms-reveal-v248','0'));
 await page.addInitScript(()=>localStorage.setItem('kingdoms-graphics-v226',JSON.stringify({preset:'low',renderer:'webgl',resolution:25,shadows:'off',vegetation:'low',water:'simple',clouds:false,fpsLimit:'unlimited',adaptiveResolution:false})));
 await page.goto('http://127.0.0.1:'+PORT+'/index.html?autostart=1&gpu=0'+(process.env.DEMO?'&demo='+process.env.DEMO:''),{waitUntil:'domcontentloaded',timeout:180000});
 await page.waitForFunction(()=>window.gameDebug,null,{timeout:300000});
 await page.evaluate(()=>document.getElementById('continue')?.click());await page.waitForTimeout(6000);
 // Large realm: every city gets a late-game population (bigger radius => bigger territory).
 const setup=await page.evaluate(async({POP,FF})=>{const g=gameDebug.gameV249(),s=g.s;
  const pause=document.getElementById('pause');if(pause&&pause.textContent!=='▶')pause.click();
  // fast-forward the real simulation so the AI realms found and grow their towns
  const t0=performance.now();let ticks=0;
  for(let t=0;t<FF;t+=.5){g.tick(.5);ticks++;if(ticks%200===0)await new Promise(r=>setTimeout(r,0));
   if(ticks%20===0)for(const a of s.settlers.filter(a=>a.team===0))g.found(a.id);}
  if(POP){for(const c of s.cities)c.economy.realms[c.team].pop=Math.max(POP,c.economy.realms[c.team].pop);if(g._perf){g._perf.areaRevision++;g._perf.lookup=null;}}
  g.refreshTerritory();
  // the western 45 % of the map is already known
  const COLS=220,ROWS=165;for(let c=2;c<Math.floor(COLS*.45);c+=3)for(let r=2;r<ROWS;r+=3)g.reveal(0,{c,r},2);
  return {ffMs:Math.round(performance.now()-t0),time:Math.round(s.time),cities:s.cities.map(c=>c.team+':'+c.economy.realms[c.team].pop).join(' '),territory:g.territory.size,roads:Object.keys(s.roadEdges||s.worldRoads||{}).length,explored:Object.keys(s.explored[0]).length,vision:s.visionRevision};
 },{POP,FF});
 await page.waitForTimeout(4000);
 if(shots)await page.screenshot({path:shots+'-start.png'});
 // logic cost only: the 3D draw is switched off while measuring (SwiftShader would hide everything else)
 await page.evaluate(()=>{const r=gameDebug.rendererV328;window.__realRender=r.render;r.render=function(){};});await page.waitForTimeout(1500);
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:200});await cdp.send('Profiler.start');
 const run=await page.evaluate(async(STEPS)=>{const g=gameDebug.gameV249(),COLS=220,ROWS=165;
  let go=true,last=performance.now();const ft=[];const loop=t=>{ft.push(t-last);last=t;if(go)requestAnimationFrame(loop)};requestAnimationFrame(loop);
  const c0=Math.floor(COLS*.45),stepFrames=[];
  for(let i=0;i<STEPS;i++){
   // one explorer step: a 5x5 patch at the edge of the known area
   const c=c0+Math.floor(i/8)*3,r=10+(i%8)*18;const before=ft.length;
   g.reveal(0,{c,r},2);
   await new Promise(r=>setTimeout(r,250));
   stepFrames.push(Math.max(0,...ft.slice(before)));
  }
  go=false;ft.shift();const srt=[...ft].sort((a,b)=>a-b);
  return {frames:ft.length,avg:+(ft.reduce((a,b)=>a+b,0)/ft.length).toFixed(1),p95:+srt[Math.floor(srt.length*.95)].toFixed(1),p99:+srt[Math.floor(srt.length*.99)].toFixed(1),max:+srt.at(-1).toFixed(1),over100:ft.filter(x=>x>100).length,over300:ft.filter(x=>x>300).length,
   worstFramePerStep:stepFrames.map(x=>Math.round(x)).join(' '),explored:Object.keys(g.s.explored[0]).length,territory:g.territory.size};
 },STEPS);
 const {profile}=await cdp.send('Profiler.stop');
 await page.evaluate(()=>{gameDebug.rendererV328.render=window.__realRender});await page.waitForTimeout(shots?9000:0);
 if(shots)await page.screenshot({path:shots+'-end.png'});
 const report={revealAll:process.env.REVEAL!=='0',setup,run,inclusiveMs:totals(profile),errors};
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,1));
 console.log(JSON.stringify(report,null,1));
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1)});
