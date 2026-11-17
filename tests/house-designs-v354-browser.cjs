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
const assert=(ok,msg)=>{if(!ok){console.error('FAIL',msg);process.exitCode=1;}else console.log('ok',msg);};
(async()=>{
 await new Promise(r=>server.listen(8772,'127.0.0.1',r));
 const launch={headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']};
 if(process.env.CHROMIUM_PATH)launch.executablePath=process.env.CHROMIUM_PATH;
 const browser=await chromium.launch(launch);
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];page.on('pageerror',e=>{errors.push(String(e));console.log('pageerror',String(e))});
 await page.addInitScript(()=>{let x=8417;Math.random=()=>((x=(x*1103515245+12345)>>>0)/4294967296);});
 await page.addInitScript(()=>localStorage.setItem('kingdoms-graphics-v226',JSON.stringify({preset:'low',renderer:'webgl',resolution:60,shadows:'off',vegetation:'low',water:'simple',clouds:false,fpsLimit:'30',adaptiveResolution:false})));
 await page.goto('http://127.0.0.1:8772/index.html?autostart=1&gpu=0&demo=stonetown&v=354',{waitUntil:'domcontentloaded',timeout:180000});
 await page.waitForFunction(()=>window.gameDebug,null,{timeout:240000});
 await page.evaluate(()=>{gameDebug.rendererV328.setPixelRatio(.5);document.getElementById('continue')?.click();});
 await page.waitForTimeout(1500);
 const city=await page.evaluate(()=>{const g=gameDebug.gameV249();g.seen=()=>true;const c=g.s.cities.find(c=>c.team===0);return {c:c.c,r:c.r,types:c.economy?.buildings?.map(b=>b.type)};});
 console.log('city',JSON.stringify(city));
 await page.evaluate(t=>gameDebug.openTileV249(t.c,t.r),city);
 const status=await page.evaluate(async()=>{const m=await import('./house-designs-v354.js?v=354b');const t=performance.now();
  while(performance.now()-t<1200000){const s=m.houseDesignStatusV354();if(s.ready+s.failed>0&&s.pending===0)break;await new Promise(r=>setTimeout(r,1000));}
  await new Promise(r=>setTimeout(r,4000));return m.houseDesignStatusV354();});
 console.log('designs',JSON.stringify(status));
 assert(status.ready>0&&status.failed===0,'designer models were built');
 const models=await page.evaluate(()=>gameDebug.houseDesignsV354());
 console.log('models',JSON.stringify(models));
 assert(models.some(m=>m.designer),'town buildings use designer models');
 const old=models.filter(m=>!m.designer&&m.type!=='bridge');
 assert(old.length===0,'no old game models left in the town: '+JSON.stringify(old.map(m=>m.type)));
 await page.waitForTimeout(1500);
 await page.screenshot({path:path.join(out,'town-v354.png'),timeout:240000});
 // Close-up of the hall.
 await page.evaluate(()=>gameDebug.focusHallV354?.(20));
 await page.waitForTimeout(2500);
 await page.screenshot({path:path.join(out,'hall-v354.png'),timeout:240000});
 // Walk collision follows the designer walls (doors open, yard free).
 const walls=await page.evaluate(()=>{const p=gameDebug.designWallPointV354('house');if(!p)return null;
  return {...p,wallBlocked:gameDebug.walkBlockedV354(p.wall.x,p.wall.z),centreBlocked:gameDebug.walkBlockedV354(p.centre.x,p.centre.z)};});
 console.log('walls',JSON.stringify(walls));
 assert(walls?.segments>0&&walls.wallBlocked===true,'walker collides with a designer wall');
 assert(walls.centreBlocked===false,'the inside of a designer house is walkable');
 // Visible Estonian texts on the main screens (the game is English).
 const estonian=async()=>page.evaluate(()=>{const out=new Set(),walk=doc=>{const w=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){const el=n.parentElement;if(!el||el.closest('script,style')||!el.getClientRects().length)continue;const t=n.textContent.trim();if(/[õäöüÕÄÖÜ]/.test(t))out.add(t.slice(0,80));}
  for(const el of doc.querySelectorAll('[title],[aria-label],button'))for(const t of [el.title,el.getAttribute('aria-label')])if(t&&/[õäöüÕÄÖÜ]/.test(t))out.add('@'+t.slice(0,80));};
  walk(document);for(const f of document.querySelectorAll('.house-designer-v354 iframe'))try{walk(f.contentDocument)}catch{}return [...out];});
 console.log('estonian-hud',JSON.stringify(await estonian()));
 // Build menu: the design icon on a building card, a type design, and a new building with it.
 const icons=await page.evaluate(async()=>{document.getElementById('citytab-build')?.click();await new Promise(r=>setTimeout(r,1500));
  return [...document.querySelectorAll('#tray .v354-design-icon')].map(i=>i.closest('[data-building]')?.dataset.building);});
 console.log('design icons',JSON.stringify(icons));
 assert(icons.includes('house'),'build menu card has a design icon');
 assert(await page.evaluate(()=>gameDebug.openTypeDesignerV354('house')),'type designer opens from the build menu');
 await page.waitForFunction(()=>{const f=document.querySelector('.house-designer-v354 iframe');let id=null;try{id=f?.contentWindow?.eval?.('state.id')}catch{}return id==='house'&&!document.querySelector('.house-designer-v354 button:disabled');},null,{timeout:120000});
 console.log('estonian-designer',JSON.stringify(await estonian()));
 await page.screenshot({path:path.join(out,'designer-type-v354.png'),timeout:240000});
 await page.evaluate(()=>{const w=document.querySelector('.house-designer-v354 iframe').contentWindow;w.eval("push({...state,roofMat:'sod'})");});
 await page.evaluate(()=>[...document.querySelectorAll('.house-designer-v354 button')].find(b=>b.textContent.startsWith('Save')).click());
 await page.waitForFunction(()=>!document.querySelector('.house-designer-v354'),null,{timeout:60000});
 const placed=await page.evaluate(()=>{for(let r=20;r<90;r+=6)for(let a=0;a<6.28;a+=.4){const p=gameDebug.placeV354('house',Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r));if(!p.error)return p;}return null;});
 console.log('placed',JSON.stringify(placed));
 assert(placed?.designed===true,'a house placed after designing gets the type design');
 // Save a changed hall design through the in-game designer overlay.
 assert(await page.evaluate(()=>gameDebug.openDesignerV354('hall')),'designer opens over the game');
 const designer=page.frameLocator('.house-designer-v354 iframe');
 await page.waitForFunction(()=>{const f=document.querySelector('.house-designer-v354 iframe');let id=null;try{id=f?.contentWindow?.eval?.('state.id')}catch{}return id==='hall'&&!document.querySelector('.house-designer-v354 button:disabled');},null,{timeout:120000});
 await page.screenshot({path:path.join(out,'designer-v354.png'),timeout:240000});
 await page.evaluate(()=>{const w=document.querySelector('.house-designer-v354 iframe').contentWindow;w.eval("push({...state,wallStyle:'stone',roofMat:'sod',roofHeight:95})");});
 await page.evaluate(()=>[...document.querySelectorAll('.house-designer-v354 button')].find(b=>b.textContent.startsWith('Save')).click());
 await page.waitForFunction(()=>!document.querySelector('.house-designer-v354'),null,{timeout:60000});
 const own=await page.evaluate(async()=>{const t=performance.now();while(performance.now()-t<240000){const h=gameDebug.houseDesignsV354().find(m=>m.type==='hall');if(h?.stamp?.startsWith('design:')&&h.stamp.endsWith(':ready')&&h.designer)return h;await new Promise(r=>setTimeout(r,1000));}return gameDebug.houseDesignsV354().find(m=>m.type==='hall');});
 console.log('own hall',JSON.stringify(own));
 assert(own?.own&&own.designer&&own.stamp.startsWith('design:hall:'),'saved hall design is drawn on the map');
 const kept=await page.evaluate(()=>{const h=gameDebug.hallV354();return h.houseDesignV354?.wallStyle+'/'+h.houseDesignV354?.roofMat;});
 assert(kept==='stone/sod','design is stored on the hall for saving');
 await page.evaluate(()=>gameDebug.focusHallV354?.(20));
 await page.waitForTimeout(2500);
 await page.screenshot({path:path.join(out,'hall-designed-v354.png'),timeout:240000});
 console.log('errors',errors.length);
 assert(errors.length===0,'no page errors');
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});
