const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');
const puppeteer=require(process.env.PUPPETEER_MODULE||'puppeteer');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts-v242');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(e,b)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const address='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-webgl','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage();await page.setViewport({width:1400,height:900});
  await page.evaluateOnNewDocument(()=>localStorage.setItem('kingdoms-quality','medium'));
  const errors=[],shaderErrors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE',e.message);});
  page.on('console',m=>{if(m.type()==='error'&&/shader|WebGLProgram|VALIDATE_STATUS/.test(m.text()))shaderErrors.push(m.text());});
  await page.goto(address,{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.gameDebug&&document.querySelector('#menu-status')?.hidden,{timeout:120000});
  await page.click('#continue');await page.click('#pause');
  await page.evaluate(()=>{
   const d=gameDebug,t=d.game.cell(d.state.armies.find(a=>a.team===0));d.game.reveal(0,t,12);d.openTile(t);
   d.detailFocus.set(100,0,0);d.detailStreamV242.prefetch(100,0);
  });
  await page.waitForFunction(()=>gameDebug.detailStreamV242.status().tiles.filter(t=>t.visible).every(t=>t.ready),{timeout:120000});
  await page.screenshot({path:path.join(out,'before-east.png')});
  const crossing=await page.evaluate(()=>{
   const d=gameDebug,stream=d.detailStreamV242,old=d.activeTileV242(),oldOrigin={x:old.x*4.5,z:old.z*3.9};
   const visibleBefore=new Map(stream.status().tiles.filter(t=>t.visible).map(t=>[t.key,t.terrain]));
   const resourceIds=new Map([...stream.entries.values()].flatMap(e=>[...e.resources].map(([id,m])=>[e.key+':'+id,m.uuid])));
   d.detailFocus.set(112.75,0,0);const globalBefore={x:oldOrigin.x+d.detailFocus.x,z:oldOrigin.z+d.detailFocus.z},zoom=d.getZoom();
   const start=performance.now();d.followDetail();const ms=performance.now()-start,now=d.activeTileV242();
   const shared=stream.status().tiles.filter(t=>t.visible&&visibleBefore.has(t.key));
   const sameResources=[...stream.entries.values()].filter(e=>e.root.visible&&visibleBefore.has(e.key)).every(e=>[...e.resources].every(([id,m])=>!resourceIds.has(e.key+':'+id)||resourceIds.get(e.key+':'+id)===m.uuid));
   return {ms,from:[old.c,old.r],to:[now.c,now.r],sameTerrain:shared.every(t=>visibleBefore.get(t.key)===t.terrain),shared:shared.length,sameResources,
    cameraDelta:Math.hypot(now.x*4.5+d.detailFocus.x-globalBefore.x,now.z*3.9+d.detailFocus.z-globalBefore.z),zoomBefore:zoom,zoomAfter:d.getZoom(),status:stream.status()};
  });
  assert(crossing.to[0]===crossing.from[0]+1,JSON.stringify(crossing));assert(crossing.sameTerrain&&crossing.sameResources);assert.equal(crossing.shared,6);assert(crossing.cameraDelta<1e-6);assert.equal(crossing.zoomBefore,crossing.zoomAfter);
  await page.screenshot({path:path.join(out,'after-east.png')});
  // Verify all shared terrain edges use identical heights, normals and forest blend.
  const seams=await page.evaluate(()=>{
   const stream=gameDebug.detailStreamV242,east=[...stream.entries.values()].find(e=>e.key===stream.status().active),entry=stream.entries.get((east.tile.c-1)+':'+east.tile.r);
   if(!east?.terrain)return null;
   const collect=(mesh,side)=>{const geo=mesh.geometry,p=geo.attributes.position,n=geo.attributes.normal,f=geo.attributes.aForestV242,map=new Map();for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i)-side*112.5)<1e-4)map.set(Math.round(p.getZ(i)*10000),{y:p.getY(i),normal:[n.getX(i),n.getY(i),n.getZ(i)],forest:f.getX(i)});return map;};
   const left=collect(entry.terrain,1),right=collect(east.terrain,-1);let height=0,normal=0,forest=0,count=0;
   for(const [z,a] of left){const b=right.get(z);if(!b)continue;count++;height=Math.max(height,Math.abs(a.y-b.y));normal=Math.max(normal,...a.normal.map((v,i)=>Math.abs(v-b.normal[i])));forest=Math.max(forest,Math.abs(a.forest-b.forest));}
   return {height,normal,forest,count};
  });
  assert(seams&&seams.count>20&&seams.height<1e-4&&seams.normal<.002&&seams.forest<1e-5,JSON.stringify(seams));
  const travel=[];
  for(const [dx,dz] of [[-1,0],[0,1],[1,1],[1,0],[1,0],[1,0],[-1,0],[-1,0]]){
   await page.evaluate(([dx,dz])=>{const d=gameDebug,t=d.activeTileV242();d.detailStreamV242.prefetch(dx*100,dz*85);const target=d.game.cell({c:t.c+dx,r:t.r+dz});d.detailStreamV242.ensure(target);},[dx,dz]);
   await page.waitForFunction(([dx,dz])=>{const d=gameDebug,t=d.activeTileV242();return d.detailStreamV242.entries.get((t.c+dx)+':'+(t.r+dz))?.ready;},{timeout:120000},[dx,dz]);
   travel.push(await page.evaluate(([dx,dz])=>{const d=gameDebug,before=d.activeTileV242(),old={x:before.x*4.5,z:before.z*3.9};d.detailFocus.set(dx?dx*112.75:0,0,dz?dz*97.75:0);const world={x:old.x+d.detailFocus.x,z:old.z+d.detailFocus.z};const start=performance.now();d.followDetail();const after=d.activeTileV242();return {ms:performance.now()-start,cached:d.detailStreamV242.entries.size,cameraDelta:Math.hypot(after.x*4.5+d.detailFocus.x-world.x,after.z*3.9+d.detailFocus.z-world.z),changed:after!==before};},[dx,dz]));
  }
  assert(travel.every(t=>t.changed&&t.cached<=25&&t.cameraDelta<1e-6),JSON.stringify(travel));
  const forbidden=await page.evaluate(()=>{const d=gameDebug,t=d.activeTileV242(),target={c:t.c+1,r:t.r};delete d.state.explored[0][target.c+':'+target.r];d.detailFocus.set(113,0,0);d.followDetail();return {same:d.activeTileV242()===t,x:d.detailFocus.x};});
  assert(forbidden.same&&forbidden.x<112.5,'unexplored transition must not shift camera into unopened tile');
  await page.screenshot({path:path.join(out,'after-travel.png')});
  const status=await page.evaluate(()=>gameDebug.detailStreamV242.status());assert(status.evicted>0&&status.cached<=25);
  const mobile=await browser.newPage();await mobile.setViewport({width:390,height:844,isMobile:true,hasTouch:true});await mobile.evaluateOnNewDocument(()=>localStorage.setItem('kingdoms-quality','medium'));
  mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(address,{waitUntil:'load',timeout:120000});await mobile.waitForFunction(()=>window.gameDebug,{timeout:120000});
  await mobile.click('#continue');await mobile.click('#pause');
  await mobile.evaluate(()=>{const d=gameDebug,t=d.game.cell(d.state.armies.find(a=>a.team===0));d.openTile(t);});await mobile.screenshot({path:path.join(out,'mobile.png')});
  const cityPage=await browser.newPage();await cityPage.setViewport({width:1400,height:900});cityPage.on('pageerror',e=>errors.push(e.message));
  await cityPage.goto(address+'/?demo=stone',{waitUntil:'load',timeout:120000});await cityPage.waitForFunction(()=>window.gameDebug&&document.querySelector('#menu-status')?.hidden,{timeout:120000});
  await cityPage.evaluate(()=>{
   const d=gameDebug,tile=d.activeTileV242(),entry=d.detailStreamV242.entries.get(tile.c+':'+tile.r),house=d.activeCity().economy.buildings.find(b=>b.type==='house');
   if(!house)throw Error('Stone city has no house fixture');d.game.reveal(0,tile,4);
   window.cityStreamTest={key:entry.key,terrain:entry.terrain.uuid,house};d.openTile(d.game.cell({c:tile.c+1,r:tile.r}));house.houseUpgradeLevelV218=1;
  });
  await cityPage.waitForFunction(()=>{const e=gameDebug.detailStreamV242.entries.get(cityStreamTest.key);return e?.buildings.get(cityStreamTest.house)?.houseTier===1;},{timeout:60000});
  assert(await cityPage.evaluate(()=>gameDebug.detailStreamV242.entries.get(cityStreamTest.key).terrain.uuid===cityStreamTest.terrain),'neighbor building update must preserve terrain');
  await cityPage.screenshot({path:path.join(out,'city-update.png')});await cityPage.close();
  assert.deepEqual(errors,[]);assert.deepEqual(shaderErrors,[]);
  const result={crossing,seams,travel,status};fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({crossing:crossing.ms,shared:crossing.shared,seams,travel,status:{cached:status.cached,evicted:status.evicted,maxJobMs:status.maxJobMs}}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
