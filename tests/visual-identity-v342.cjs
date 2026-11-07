// V342: the detail map must look exactly the same. Hashes the geometry the
// stream built (terrain, sea, horizon, rivers, roads, borders, resource and
// building transforms) for the same world and camera, so two versions can be
// compared. Usage: node tests/visual-identity-v342.cjs <out.json> [port]
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.TREE_NODE_MODULES?process.env.TREE_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..'),out=process.argv[2]||'reports/visual-identity-v342.json',port=Number(process.argv[3]||8790);
const mime={'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const p=decodeURIComponent(req.url.split('?')[0]);const f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)res.writeHead(404).end();else{res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(b)}})});
(async()=>{await new Promise(r=>server.listen(port,'127.0.0.1',r));
 const launch={headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']};if(process.env.CHROMIUM_PATH)launch.executablePath=process.env.CHROMIUM_PATH;
 const browser=await chromium.launch(launch);const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{let x=8417;Math.random=()=>((x=(x*1103515245+12345)>>>0)/4294967296);});
 await page.addInitScript(()=>localStorage.setItem('kingdoms-graphics-v226',JSON.stringify({preset:'low',renderer:'webgl',resolution:50,shadows:'off',vegetation:'low',water:'simple',clouds:false,fpsLimit:'30',adaptiveResolution:false})));
 await page.goto(`http://127.0.0.1:${port}/index.html?autostart=1&gpu=0`,{timeout:180000});await page.waitForFunction(()=>window.gameDebug,null,{timeout:240000});
 await page.evaluate(()=>document.getElementById('continue')?.click());await page.waitForTimeout(1500);
 await page.evaluate(()=>{document.getElementById('pause')?.click();}); // freeze the simulation
 const hashes=await page.evaluate(async()=>{
  const g=gameDebug.gameV249(),st=gameDebug.detailStreamV242;g.seen=()=>true;
  const own=g.s.cities.find(c=>c.team===0)||g.s.armies.find(a=>a.team===0);
  const fnv=(h,v)=>{h^=v;return Math.imul(h,16777619)>>>0;};
  const hashArray=(h,a)=>{const f=new Float32Array(a.length);f.set(a);const u=new Uint32Array(f.buffer);for(let i=0;i<u.length;i++)h=fnv(h,u[i]);return fnv(h,a.length);};
  const hashObject=(o,indexless=false)=>{if(!o)return null;let h=2166136261;o.updateMatrixWorld(true);o.traverse(m=>{if(m.geometry){for(const k of Object.keys(m.geometry.attributes).sort())h=hashArray(h,m.geometry.attributes[k].array);if(m.geometry.index&&!indexless)h=hashArray(h,m.geometry.index.array.slice(0,m.geometry.drawRange.count===Infinity?undefined:m.geometry.drawRange.count));}if(m.isInstancedMesh){h=fnv(h,m.count);h=hashArray(h,m.instanceMatrix.array.slice(0,m.count*16));}h=hashArray(h,m.matrixWorld.elements);});return h;};
  const done=()=>{const s=st.status();return s.tiles.filter(t=>t.visible).every(t=>t.ready||t.visualReady)&&[...st.entries.values()].filter(e=>Math.max(Math.abs(e.tile.c-st.center.c),Math.abs(e.tile.r-st.center.r))<=1).every(e=>e.ready);};
  const settle=async()=>{const t=performance.now();while(!done()&&performance.now()-t<200000){for(let k=0;k<10;k++)st.tick();await new Promise(r=>setTimeout(r,30));}};
  const snap=()=>{const out={};for(const e of st.entries.values()){if(!e.root.visible)continue;const k=(e.tile.c-st.center.c)+':'+(e.tile.r-st.center.r),centre=e.tile===st.center;
    const shown={buildingModels:[...e.buildings.keys()].map(b=>b.type+':'+b.x.toFixed(2)+':'+b.z.toFixed(2)+':'+(b.ready?1:0)+':'+(+(b.progress||0)).toFixed(3)).sort().join('|'),time:gameDebug.gameV249().s.time,terrain:hashObject(e.terrain),sea:hashObject(e.sea),cover:hashObject(e.cover),scenery:hashObject(e.scenery)};
    if(centre||e.ready)Object.assign(shown,{distant:hashObject(e.distant),distantVertices:hashObject(e.distant,true),holeMask:e.distant?.userData.streamHorizonV242?.mask??null,rivers:hashObject(e.rivers),outcrops:hashObject(e.outcrops),roads:hashObject(e.roads),borders:hashObject(e.borders),nav:e.navigation?Array.from(e.navigation.mask||[]).reduce((h,v)=>fnv(h,v),2166136261):null});
    out[k]={tile:e.key,ready:e.ready,...shown};}return out;};
  gameDebug.openTileV249(own.c,own.r);gameDebug.focusV250(0,0,200);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await settle();
  const first=snap();
  // Cross two tiles north: the second one was an outer (paused in V342) tile.
  for(let n=0;n<2;n++){const r=st.center.r;let z=0;while(st.center.r===r){z-=20;gameDebug.focusV250(0,z,200);for(let k=0;k<10;k++)st.tick();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}gameDebug.focusV250(0,0,200);}
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await settle();
  return {start:own.c+':'+own.r,first,second:snap(),centre:st.center.c+':'+st.center.r};
 });
 fs.writeFileSync(path.resolve(out),JSON.stringify({version:await page.title(),...hashes,errors},null,1));
 console.log('wrote',out,'errors',errors.length);await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1)});
