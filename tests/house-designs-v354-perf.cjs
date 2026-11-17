// V354 draw calls and triangles per two frames in Stonetown (town view, high graphics)
// at four zoom levels. Usage: node tests/house-designs-v354-perf.cjs [extra query, e.g. "&houses=old" or "&instancing=0"]
// V354 real-game check: the house designer models replace the town buildings
// on the detail map, a saved hall design is used for that hall, and the old
// game model remains as the far level of detail. SwiftShader: not an FPS test.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.TREE_NODE_MODULES?process.env.TREE_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..');
const mime={'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.ktx2':'application/octet-stream','.bin':'application/octet-stream','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]);const f=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,d)=>{if(e)return res.writeHead(404).end();res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});res.end(d);});});
const out=process.env.V354_OUT||path.join(require('node:os').tmpdir(),'house-designs-v354');fs.mkdirSync(out,{recursive:true});
const query=process.argv[2]||'';
(async()=>{
 await new Promise(r=>server.listen(8773,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('pageerror',e=>console.log('pageerror',String(e)));
 await page.addInitScript(()=>{let x=8417;Math.random=()=>((x=(x*1103515245+12345)>>>0)/4294967296);});
 await page.addInitScript(()=>localStorage.setItem('kingdoms-graphics-v226',JSON.stringify({preset:'high',renderer:'webgl',resolution:50,shadows:'high',fpsLimit:'30',adaptiveResolution:false})));
 await page.goto('http://127.0.0.1:8773/index.html?autostart=1&gpu=0&demo=stonetown&v=354'+query,{waitUntil:'domcontentloaded',timeout:180000});
 await page.waitForFunction(()=>window.gameDebug,null,{timeout:240000});
 await page.evaluate(()=>{document.getElementById('continue')?.click();});
 await page.waitForTimeout(1500);
 await page.evaluate(()=>{const g=gameDebug.gameV249();g.seen=()=>true;const c=g.s.cities.find(c=>c.team===0);gameDebug.openTileV249(c.c,c.r);});
 const t0=Date.now();
 for(;;){const s=await page.evaluate(async()=>{const m=await import('./house-designs-v354.js?v=355a');const s=m.houseDesignStatusV354();return {ready:s.ready,failed:s.failed,pending:s.pending,enabled:s.enabled};});
  if(!s.enabled||(s.pending===0&&s.ready+s.failed>0))break; if(Date.now()-t0>1500000)break; await page.waitForTimeout(15000);}
 console.log('ready after',Math.round((Date.now()-t0)/1000),'s');
 for(const z of [30,60,110,200]){
  const r=await page.evaluate(async z=>{gameDebug.focusHallV354(z);for(let i=0;i<6;i++)await new Promise(r=>requestAnimationFrame(r));
   const R=gameDebug.rendererV328;let calls=0,tris=0,n=0;const orig=R.render.bind(R);
   const info=R.info;const sm=R.shadowMap;let shadowCalls=0,shadowTris=0;
   const realShadow=sm.render.bind(sm);
   sm.render=(...a)=>{const c0=info.render.calls,t0=info.render.triangles;realShadow(...a);shadowCalls+=info.render.calls-c0;shadowTris+=info.render.triangles-t0;};
   R.info.autoReset=false;R.info.reset();const f0=info.render.frame;let renders=0;const realRender=R.render;R.render=function(...a){renders++;return realRender.apply(this,a)};
   await new Promise(r=>requestAnimationFrame(r));await new Promise(r=>requestAnimationFrame(r));
   R.render=realRender;sm.render=realShadow;
   const out={renders,calls:info.render.calls,tris:info.render.triangles,shadowCalls,shadowTris};R.info.autoReset=true;
   // count visible house meshes
   let houseMeshes=0,houseTris=0,casters=0;const sc=gameDebug.localScene;sc.updateMatrixWorld();
   sc.traverse(o=>{if(o.isLOD&&o.name?.startsWith('V354')){const lvl=o.getCurrentLevel();const obj=o.levels[lvl]?.object;obj?.traverse(m=>{if(m.isMesh&&m.visible){houseMeshes++;houseTris+=(m.geometry.index?m.geometry.index.count:m.geometry.attributes.position.count)/3;if(m.castShadow)casters++;}});}});
   return {z,...out,houseMeshes,houseTris:Math.round(houseTris),casters};},z);
  console.log(JSON.stringify(r));
 }
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
