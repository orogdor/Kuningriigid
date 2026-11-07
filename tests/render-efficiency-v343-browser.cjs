const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.TREE_NODE_MODULES+'/playwright');
const root=path.resolve(__dirname,'..'),mime={'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(b)})});
(async()=>{await new Promise(r=>server.listen(8783,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const report={note:'Actual game, Chromium/SwiftShader, software renderer. Behaviour/visual smoke checks, not hardware FPS.',scenarios:[]};
 try{for(const demo of (process.env.RENDER_DEMOS||'stonetown,bronze-battle').split(',')){
  const page=await browser.newPage({viewport:{width:960,height:640}}),errors=[];page.on('pageerror',e=>{errors.push(String(e));console.log('PAGE ERROR',demo,String(e))});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE ERROR',demo,m.text())});
  await page.addInitScript(()=>{let x=8417;Math.random=()=>((x=(x*1103515245+12345)>>>0)/4294967296);localStorage.setItem('kingdoms-graphics-v226',JSON.stringify({preset:'low',renderer:'webgl',resolution:50,shadows:'off',vegetation:'low',water:'simple',clouds:false,fpsLimit:'30',adaptiveResolution:false}));});
  await page.goto('http://127.0.0.1:8783/index.html?autostart=1&gpu=0&demo='+demo,{waitUntil:'domcontentloaded',timeout:180000});await page.waitForFunction(()=>window.gameDebug||document.querySelector('#menu-status.menu-error'),null,{timeout:90000}).catch(async e=>{console.log('BOOT DIAGNOSTIC',demo,await page.locator('body').innerText());throw e;});if(!await page.evaluate(()=>!!window.gameDebug))throw Error(await page.locator('#menu-status').innerText());console.log('booted',demo);
  await page.evaluate(()=>{gameDebug.rendererV328.setPixelRatio(.35);document.getElementById('continue')?.click();});
  if(demo==='stonetown')await page.evaluate(()=>{const g=gameDebug.gameV249(),own=g.s.cities.find(c=>c.team===0);g.seen=()=>true;gameDebug.openTileV249(own.c,own.r);gameDebug.focusV250(0,0,180);});
  await page.waitForTimeout(3000);
  const before=await page.evaluate(()=>({time:gameDebug.gameV249().s.time,battle:gameDebug.gameV249().s.battle?.elapsed}));
  if(demo==='bronze-battle')await page.evaluate(()=>{const b=document.getElementById('pause');if(b?.textContent.includes('▶'))b.click();});
  await page.waitForTimeout(3000);
  if(demo==='stonetown'){
   await page.evaluate(async()=>{const st=gameDebug.detailStreamV242,start=performance.now();while(performance.now()-start<90000){if(st.status().tiles.filter(t=>t.visible).every(t=>t.ready||t.visualReady))break;for(let i=0;i<8;i++)st.tick();await new Promise(r=>setTimeout(r,30));}});
  }
  const state=await page.evaluate(()=>{const g=gameDebug.gameV249(),r=gameDebug.rendererV328,st=gameDebug.detailStreamV242;let meshes=0,skin=0,instances=0,invalid=0;gameDebug.localScene.traverseVisible(o=>{if(o.isMesh){meshes++;if(o.isSkinnedMesh)skin++;if(!o.matrixWorld.elements.every(Number.isFinite))invalid++;}if(o.isInstancedMesh)instances+=o.count;});return {time:g.s.time,battleElapsed:g.s.battle?.elapsed,men:g.s.battle?.squads.reduce((n,s)=>n+(s.men?.length||0),0),buildings:gameDebug.buildingBoundsV252().length,meshes,skin,instances,invalid,trees:gameDebug.saplingTreesV328().detail,visibleTiles:st.status().tiles.filter(t=>t.visible).length,readyTiles:st.status().tiles.filter(t=>t.visible&&(t.ready||t.visualReady)).length,calls:r.info.render.calls,triangles:r.info.render.triangles};});
  assert.equal(state.invalid,0);assert.ok(state.calls>0);assert.ok(state.meshes>0);assert.deepEqual(errors,[]);
  if(demo==='stonetown'){assert.ok(state.buildings>0);assert.equal(state.visibleTiles,25);assert.equal(state.readyTiles,25);assert.ok(state.trees.liveReady>0);assert.deepEqual(state.trees.errors,[]);}
  else {assert.ok(state.men>=400);assert.ok(state.battleElapsed>before.battle,'battle advances');}
  fs.mkdirSync(path.join(root,'previews/render-v343'),{recursive:true});await page.screenshot({path:path.join(root,'previews/render-v343/'+demo+'.png'),timeout:60000});
  if(demo==='stonetown'){
   const crossed=await page.evaluate(async()=>{const st=gameDebug.detailStreamV242,old=st.center.r;gameDebug.focusV250(0,-210,180);const t=performance.now();while(st.center.r===old&&performance.now()-t<60000){for(let i=0;i<8;i++)st.tick();await new Promise(r=>setTimeout(r,50));}return st.center.r!==old;});assert.ok(crossed,'tile crossing works');
   await page.evaluate(()=>document.getElementById('world').click());await page.waitForTimeout(500);
  }
  report.scenarios.push({demo,version:await page.title(),before,state,errors});fs.writeFileSync(path.join(root,'reports/render-efficiency-v343-browser.json'),JSON.stringify(report,null,2));console.log(demo,JSON.stringify(state));await page.close();
 }}finally{await browser.close();server.close();}
 fs.writeFileSync(path.join(root,'reports/render-efficiency-v343-browser.json'),JSON.stringify(report,null,2));console.log('V343 real-game smoke PASS');
})().catch(e=>{console.error(e);server.close();process.exit(1)});
