'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.TREE_NODE_MODULES+'/playwright');
const root=process.cwd(),mime={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,bytes)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(bytes);});
});
(async()=>{
 await new Promise(r=>server.listen(8774,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext({viewport:{width:640,height:360}});
  await context.addInitScript(()=>localStorage.setItem('kingdoms-graphics-v226',JSON.stringify({preset:'low',renderer:'webgl',resolution:50,shadows:'off',vegetation:'low',water:'simple',clouds:false,fpsLimit:'30'})));
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',err=>errors.push(String(err)));
  page.on('request',r=>requests.push(new URL(r.url()).pathname));
  const coldStart=Date.now();
  await page.goto('http://127.0.0.1:8774/',{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.KUNINGRIIGID_MENU_READY_V336&&!window.gameDebug,null,{timeout:20000});
  if(requests.includes('/civilization.js')||requests.includes('/civilization-core.js'))throw Error('Game engine imported before clicking Start');
  if(await page.locator('#newgame').isDisabled())throw Error('New game button is disabled before engine startup');
  await page.locator('#menu-world summary').click();
  await page.locator('#seed').fill('startup-v336-test');
  await page.locator('#newgame').click();
  await page.waitForFunction(()=>window.gameDebug?.generatedWorldV331&&document.getElementById('menu-status').hidden,null,{timeout:180000});
  const firstGameMs=Date.now()-coldStart;
  await page.waitForFunction(()=>gameDebug.generatedWorldV331().persisted,null,{timeout:180000});
  const key=await page.evaluate(()=>gameDebug.terrainCacheV336().key);
  if(!key)throw Error('New world did not get a persistent cache key');
  await page.waitForFunction(key=>new Promise(resolve=>{
    const request=indexedDB.open('kuningriigid-atlas-cache-v336',1);
    request.onerror=()=>resolve(false);
    request.onsuccess=()=>{
      const tx=request.result.transaction('meshes','readonly'),r=tx.objectStore('meshes').get(key);
      r.onsuccess=()=>resolve(!!r.result?.geometry);
      r.onerror=()=>resolve(false);
    };
  }),key,{timeout:180000});
  await page.reload({waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.KUNINGRIIGID_MENU_READY_V336&&!window.gameDebug,null,{timeout:20000});
  const secondStart=Date.now();
  await page.locator('#continue').click();
  await page.waitForFunction(()=>window.gameDebug?.terrainCacheV336&&document.getElementById('menu-status').hidden,null,{timeout:180000});
  const hit=await page.evaluate(()=>gameDebug.terrainCacheV336());
  if(!hit.hit)throw Error('Saved world did not reuse its cached overview geometry');
  if(errors.length)throw Error('JavaScript errors: '+errors.join('\n'));
  console.log(JSON.stringify({pass:true,firstGameMs,repeatGameMs:Date.now()-secondStart,cacheHit:hit.hit,requestCount:requests.length}));
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
