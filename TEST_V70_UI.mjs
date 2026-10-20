import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const errors=[],badNetwork=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))badNetwork.push(r.status()+' '+r.url())});
page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('WebGL'))errors.push(m.text())});
mkdirSync('ui-screenshots-v70',{recursive:true});
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForFunction(()=>!!window.gameDebug,{timeout:90000});
 await page.locator('#continue').click();
 await page.waitForFunction(()=>document.body.classList.contains('atlas')&&document.getElementById('startmenu').hidden,{timeout:30000});
 // Fresh games default to the initial selected settler, so the scout overlay must be ON.
 assert.equal(await page.locator('#hud-resource-toggle').getAttribute('aria-pressed'),'true','settler must force resource layer');
 assert.equal(await page.locator('#hud-resource-toggle').getAttribute('aria-disabled'),'false','scout resource details can be expanded');
 assert.equal(await page.evaluate(()=>window.gameDebug.resourceLayerStatus().enabled),true);
 assert.equal(await page.locator('#hud-tile-resources').isVisible(),false,'tile resource detail panel starts compact');
 await page.locator('#hud-resource-toggle').click();
 assert.equal(await page.locator('#hud-tile-resources').isVisible(),true,'selected tile natural resources accessible');
 assert.equal(await page.evaluate(()=>window.gameDebug.resourceLayerStatus().enabled),true,'forced resource mode persists while settler selected');
 // Selecting another unit restores the prior user preference.
 await page.evaluate(()=>{const dbg=window.gameDebug;const army=dbg.state.armies.find(a=>a.team===0);dbg.worldClick(dbg.game.cell(army),{type:'army',entity:army})});
 assert.equal(await page.evaluate(()=>window.gameDebug.resourceLayerStatus().enabled),false,'resource layer follows selection');
 await page.locator('#hud-resource-toggle').click();
 assert.equal(await page.evaluate(()=>window.gameDebug.resourceLayerStatus().enabled),true,'explicit resource toggle turns it on without settler');
 await page.locator('#hud-resource-toggle').click();
 assert.equal(await page.evaluate(()=>window.gameDebug.resourceLayerStatus().enabled),false,'explicit toggle turns it off');
 await page.evaluate(()=>document.getElementById('selectsettler').click());
 assert.equal(await page.evaluate(()=>window.gameDebug.resourceLayerStatus().enabled),true,'reselecting settler reactivates scouting');
 console.log('V70 SCOUT PASS: sticky settler resource layer, manual setting restored, tile deposits displayed');
 // Build a legal test city using the normal rules rather than a mock DOM.
 const cityInfo=await page.evaluate(()=>{
  const dbg=window.gameDebug,game=dbg.game,a=dbg.state.settlers.find(a=>a.team===0);
  if(!a)throw Error('missing starting settler');
  let err=game.land(a.id);if(err)throw Error('failed to land starting settler: '+err);
  let created;
  for(let z=-20;z<=20&&!created;z+=4)for(let x=-24;x<=24&&!created;x+=4){
   if(!game.siteRule(a,{x,z})){a.x=x;a.z=z;const result=game.found(a.id);if(!result.error)created=result.city}
  }
  if(!created)throw Error('no valid city site on starting tile');
  for(const k of Object.keys(created.economy.realms[0].resources))created.economy.realms[0].resources[k]=300;
  dbg.openTile(game.cell(created));dbg.renderUI();
  return {id:created.id,name:created.name}
 });
 for(const layout of [{label:'portrait-390',width:390,height:844},{label:'landscape-667',width:667,height:375},{label:'landscape-844',width:844,height:390},{label:'desktop-1440',width:1440,height:900},{label:'desktop-1024',width:1024,height:768}]){
  await page.setViewportSize({width:layout.width,height:layout.height});await page.waitForTimeout(300);
  await page.locator('#hud-build').click();await page.waitForTimeout(200);
  const m=await page.evaluate(()=>{
   const el=n=>document.getElementById(n);
   const rect=n=>{const r=el(n).getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
   const p=rect('citypanel'),nav=rect('tools'),tray=rect('tray'),w=innerWidth,h=innerHeight;
   return {p,nav,tray,w,h,v74:!!document.querySelector('link[href*="hud-v74.css"]'),visible:getComputedStyle(el('citypanel')).display!=='none',scroll:el('tray').scrollWidth>el('tray').clientWidth,active:el('citytab-build').getAttribute('aria-selected'),showBuild:getComputedStyle(el('citypane-build')).display!=='none'};
  });
  console.log('V70 LAYOUT',layout.label,JSON.stringify(m));
  assert.equal(m.visible,true,'city drawer visible '+layout.label);
  assert.equal(m.showBuild,true,'build tab visible '+layout.label);
  assert.ok(m.p.left>=0&&m.p.right<=m.w+3&&m.p.top>=0&&m.p.bottom<=m.h+3,'drawer clipped '+layout.label);
  if(layout.width<901){
   // V74 intentionally permits a taller readable bottom sheet while preserving the map and bottom navigation.
   const maxDrawerHeight=m.v74?(m.h<520?Math.min(m.h*.5,205):Math.min(m.h*.56,430)):Math.min(m.h*.5,265);
   assert.ok(m.p.height<=maxDrawerHeight+2,'drawer must not occupy whole screen '+layout.label+':'+JSON.stringify(m.p));
   assert.ok(m.p.bottom<=m.nav.top+3,'drawer must not overlap navigation '+layout.label);
   assert.ok(m.p.top>=40,'top HUD stays unobstructed');
  }else assert.ok(m.p.width<=370,'desktop city panel remains compact');
  await page.screenshot({path:'ui-screenshots-v70/'+layout.label+'.png'});
  console.log('V70 DRAWER',layout.label,JSON.stringify({h:m.p.height,top:m.p.top,bottom:m.p.bottom,navTop:m.nav.top,cards:m.tray.width,scroller:m.scroll}));
  await page.locator('#hud-city-collapse').evaluate(button=>button.click());
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('#hud-build').click();
 const usable=page.locator('#tray button:not([disabled])').first();
 assert.ok(await usable.count(),'build menu needs affordable buildings');
 await usable.click();
 assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('hud-city-open')),false,'choosing building closes mobile drawer');
 assert.equal(await page.locator('#hud-build-status').isVisible(),true,'placement hint visible on map');
 assert.equal(await page.locator('#hud-tile-missing').isVisible(),false,'tile resource panel follows actual visibility');
 await page.locator('#hud-resource-toggle').click();
 assert.equal(await page.locator('#hud-tile-resources').isVisible(),true,'resource panel works on detail map');
 assert.ok((await page.locator('#hud-tile-missing').textContent()).includes('Ehitamiseks'),'shows building-material shortfalls or sufficiency');
 await page.locator('#hud-build').click();
 await page.locator('#hud-queue-toggle').click();
 assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('hud-queue-open')),true,'work queue toggle works');
 assert.deepEqual(badNetwork,[],'all game resources must load');
 assert.deepEqual(errors,[],'no runtime errors');
 console.log('V70 UI PASS: 5 layouts, compact build cards, queue, selected tile materials, automatic settler scout overlay');
}finally{await browser.close()}
