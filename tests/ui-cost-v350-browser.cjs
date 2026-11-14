// V350 read-only measurement of what the HTML HUD costs while the game runs.
// The 3D draw call is replaced by a no-op after start, so frame times and trace events show the
// main-thread cost of the UI (DOM mutations, style, layout, paint, observers), not the GPU.
// Run: CHROMIUM_PATH=/usr/bin/google-chrome node tests/ui-cost-v350-browser.cjs [out.json]
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.TREE_NODE_MODULES?process.env.TREE_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..'),out=process.argv[2]||path.join(root,'reports/ui-cost-v350.json');
const mime={'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]);const f=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)res.writeHead(404).end();else{res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(b)}})});
const NAMES=['UpdateLayoutTree','Layout','PrePaint','Paint','Layerize','Commit','ParseAuthorStyleSheet','ParseHTML','EvaluateScript','v8.compile','v8.compileModule','Decode Image','ImageDecodeTask','RasterTask','TimerFire','FireAnimationFrame','FunctionCall','EventDispatch','HitTest','UpdateLayer','CompositeLayers','ScheduleStyleRecalculation','InvalidateLayout'];
async function trace(browser,page,fn){
 const cdp=await browser.newBrowserCDPSession();const events=[];
 cdp.on('Tracing.dataCollected',d=>events.push(...d.value));
 await cdp.send('Tracing.start',{transferMode:'ReportEvents',traceConfig:{includedCategories:['devtools.timeline','disabled-by-default-devtools.timeline','blink','cc','v8']}});
 const extra=await fn();
 const done=new Promise(r=>cdp.once('Tracing.tracingComplete',r));await cdp.send('Tracing.end');await done;await cdp.detach();
 const agg={};const timers={};const timers2={};const sheets=[];
 for(const e of events){if(e.ph!=='X')continue;if(!NAMES.includes(e.name))continue;const a=agg[e.name]=agg[e.name]||{n:0,ms:0,max:0};a.n++;a.ms+=e.dur/1000;a.max=Math.max(a.max,e.dur/1000);
  if(e.name==='UpdateLayoutTree'&&e.args?.elementCount!=null){a.elements=(a.elements||0)+e.args.elementCount;}
  if(e.name==='ParseAuthorStyleSheet')sheets.push([String(e.args?.data?.styleSheetUrl||'').split('/').pop().split('?')[0],+(e.dur/1000).toFixed(1)]);
  if(e.name==='Decode Image'||e.name==='ImageDecodeTask'){const k='IMG '+JSON.stringify(e.args).slice(0,160);timers[k]=(timers[k]||0)+e.dur/1000;}
  if(e.name==='FunctionCall'){const k='FN '+String(e.args?.data?.url||'').split('/').pop().split('?')[0]+':'+e.args?.data?.lineNumber+' '+(e.args?.data?.functionName||'');const t=timers2[k]=timers2[k]||{n:0,ms:0,max:0};t.n++;t.ms+=e.dur/1000;t.max=Math.max(t.max,e.dur/1000);}
  if(e.name==='EvaluateScript'||e.name==='FunctionCall'||e.name==='v8.compile'){const u=String(e.args?.data?.url||e.args?.fileName||'').split('/').pop().split('?')[0];if(u){const k=e.name+' '+u;timers[k]=(timers[k]||0)+e.dur/1000;}}
 }
 for(const k in agg){agg[k].ms=+agg[k].ms.toFixed(1);agg[k].max=+agg[k].max.toFixed(1);}
 const byUrl=Object.entries(timers).sort((a,b)=>b[1]-a[1]).slice(0,45).map(([k,v])=>[k,+v.toFixed(1)]);
 const fns=Object.entries(timers2).sort((a,b)=>b[1].ms-a[1].ms).slice(0,30).map(([k,v])=>[k,v.n,+v.ms.toFixed(1),+v.max.toFixed(1)]);return {agg,byUrl,fns,sheets:sheets.sort((a,b)=>b[1]-a[1]),extra};
}
(async()=>{
 await new Promise(r=>server.listen(8792,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await page.addInitScript(()=>{let x=8417;Math.random=()=>((x=(x*1103515245+12345)>>>0)/4294967296);});
 await page.addInitScript(()=>localStorage.setItem('kingdoms-graphics-v226',JSON.stringify({preset:'low',renderer:'webgl',resolution:25,shadows:'off',vegetation:'low',water:'simple',clouds:false,fpsLimit:'unlimited',adaptiveResolution:false})));
 const boot=await trace(browser,page,async()=>{const t0=Date.now();await page.goto('http://127.0.0.1:8792/index.html?autostart=1&gpu=0',{waitUntil:'domcontentloaded',timeout:180000});const domMs=Date.now()-t0;await page.waitForFunction(()=>window.gameDebug,null,{timeout:300000});return {domMs,bootMs:Date.now()-t0};});
 await page.evaluate(()=>document.getElementById('continue')?.click());await page.waitForTimeout(8000);
 const sample=(ms)=>page.evaluate(async(ms)=>{let frames=0,go=true,lastT=performance.now();const ft=[];const loop=(t)=>{frames++;ft.push(t-lastT);lastT=t;if(go)requestAnimationFrame(loop)};requestAnimationFrame(loop);
   const hist=new Map();let muts=0;const key=n=>{let e=n.nodeType===1?n:n.parentElement;let depth=0;while(e&&!e.id&&depth<6){e=e.parentElement;depth++;}return e?('#'+e.id):'(none)'};
   const mo=new MutationObserver(l=>{for(const m of l){muts++;const k=m.type+' '+key(m.target)+(m.attributeName?'['+m.attributeName+']':'');hist.set(k,(hist.get(k)||0)+1);}});
   mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true});
   await new Promise(r=>setTimeout(r,ms));go=false;mo.disconnect();
   ft.shift();const srt=[...ft].sort((a,b)=>a-b);const stats={avg:+(ft.reduce((a,b)=>a+b,0)/ft.length).toFixed(2),median:+srt[srt.length>>1].toFixed(1),p95:+srt[Math.floor(srt.length*.95)].toFixed(1),p99:+srt[Math.floor(srt.length*.99)].toFixed(1),max:+srt[srt.length-1].toFixed(1),over25:ft.filter(x=>x>25).length,over33:ft.filter(x=>x>33).length,over50:ft.filter(x=>x>50).length};return {frames,stats,muts,top:[...hist].sort((a,b)=>b[1]-a[1]).slice(0,26),nodes:document.querySelectorAll('*').length,body:document.body.className};},ms);
 const MS=15000;
 await page.evaluate(()=>{const r=gameDebug.rendererV328;window.__realRender=r.render;r.render=function(){};});
 await page.waitForTimeout(3000);
 const world=await trace(browser,page,()=>sample(MS));
 const start=await page.evaluate(()=>{const g=gameDebug.gameV249();const own=g.s.cities.find(c=>c.team===0)||g.s.armies.find(a=>a.team===0);gameDebug.openTileV249(own.c,own.r);return {c:own.c,r:own.r,city:!!g.s.cities.find(c=>c.team===0)};});
 await page.evaluate(()=>{gameDebug.rendererV328.render=window.__realRender});await page.waitForTimeout(60000);await page.evaluate(()=>{gameDebug.rendererV328.render=function(){}});await page.waitForTimeout(3000);
 const detail=await trace(browser,page,()=>sample(MS));
 const report={boot,world,detail,start,errors};
 fs.writeFileSync(out,JSON.stringify(report,null,1));
 const show=(l,t)=>{console.log('==',l,JSON.stringify(t.extra).slice(0,1500));for(const k of Object.keys(t.agg))console.log('  ',k,JSON.stringify(t.agg[k]));};
 show('boot',boot);console.log('sheets',JSON.stringify(boot.sheets.slice(0,12)));show('world 15s',world);console.log(JSON.stringify(world.fns,null,0).replace(/\],\[/g,'],\n['));console.log(JSON.stringify(world.byUrl.filter(x=>x[0].startsWith('IMG'))));show('detail 15s',detail);console.log(JSON.stringify(detail.fns,null,0).replace(/\],\[/g,'],\n['));console.log('errors',errors.slice(0,3));
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1)});
