import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const page=await context.newPage(),errors=[],network=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url())});
mkdirSync('ui-screenshots-v74',{recursive:true});
const visible=id=>page.locator('#'+id).isVisible();
async function navGeometry(label){
 const layout=await page.evaluate(()=>{
  const names=['maptoggle','hud-city','hud-explore','techtoggle','hud-army','hud-build','menubtn'];
  const tools=document.getElementById('tools'),r=tools.getBoundingClientRect();
  const rects=names.map(id=>{const b=document.getElementById(id),x=b.getBoundingClientRect(),css=getComputedStyle(b);return {id,w:x.width,h:x.height,x:x.x,y:x.y,right:x.right,bottom:x.bottom,display:css.display}});
  const middle=document.elementFromPoint(innerWidth/2,Math.min(innerHeight*.42,310));
  return {w:innerWidth,h:innerHeight,nav:{w:r.width,x:r.x,y:r.y,right:r.right,bottom:r.bottom,overflow:tools.scrollWidth>tools.clientWidth+2},visibleActions:[...tools.querySelectorAll('button')].filter(el=>getComputedStyle(el).display!=='none').map(el=>el.id||el.dataset.tab),rects,middle:middle?.id||middle?.tagName,mini:getComputedStyle(document.getElementById('atlasoverview')).display,objective:getComputedStyle(document.getElementById('v51insights')).display};
 });
 assert.deepEqual(layout.visibleActions,['maptoggle','hud-city','hud-explore','techtoggle','hud-army','hud-build','menubtn'],label+' exactly seven mobile actions');
 assert.equal(layout.nav.overflow,false,label+' nav must not clip horizontally');
 assert.ok(layout.nav.x>=-2&&layout.nav.right<=layout.w+2,label+' nav fits');
 assert.ok(layout.nav.bottom<=layout.h+2,label+' nav fits vertically');
 for(const button of layout.rects){
  assert.ok(button.w>=44&&button.h>=44,label+' touch target '+button.id+' '+JSON.stringify(button));
  assert.ok(button.x>=layout.nav.x-2&&button.right<=layout.nav.right+2&&button.y>=layout.nav.y-2&&button.bottom<=layout.nav.bottom+2,label+' nav target completely inside bar '+button.id+' '+JSON.stringify(button));
 }
 assert.equal(layout.mini,'none',label+' overview defaults closed');
 assert.equal(layout.objective,'none',label+' no always-on objective card');
 console.log('V74 NAV PASS '+label+' '+JSON.stringify(layout));
}
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>!!window.gameDebug,{timeout:90000});
 assert.equal(await visible('tools'),false,'nav does not obscure the opening menu');
 await page.locator('#continue').click();
 await page.waitForFunction(()=>document.getElementById('startmenu').hidden&&document.body.classList.contains('atlas'));
 await navGeometry('390x844');
 assert.equal(await visible('hud-minimap-toggle'),true,'minimap opener exists');
 await page.locator('#hud-minimap-toggle').click();
 assert.equal(await visible('atlasoverview'),true,'minimap can expand');
 assert.equal(await visible('hud-resource-toggle'),false,'resource icon does not collide with expanded minimap');
 await page.locator('#hud-minimap-toggle').click();
 assert.equal(await visible('atlasoverview'),false,'minimap collapses again');
 const zoom=await page.evaluate(()=>window.gameDebug.getZoom());
 await page.locator('#hud-zoom-in').click();
 assert.ok(await page.evaluate(()=>window.gameDebug.getZoom())<zoom,'zoom-in still works');
 await page.locator('#hud-zoom-out').click();
 assert.ok(Math.abs(await page.evaluate(()=>window.gameDebug.getZoom())-zoom)<2,'zoom-out restores the scale');
 await page.locator('#hud-resource-toggle').click();
 assert.equal(await visible('hud-tile-resources'),true,'resource detail opens from compact button');
 assert.equal(await visible('hud-zoom-controls'),false,'expanded resource pane hides zoom');
 await page.locator('#hud-resource-toggle').click();
 assert.equal(await visible('hud-tile-resources'),false,'resource detail closes');
 await page.locator('#hud-explore').click();
 assert.equal(await visible('hud-explore-panel'),true,'exploration uses a single sheet');
 assert.equal(await visible('hud-zoom-controls'),false,'exploration sheet hides zoom keys');
 await page.locator('#hud-explore-close').click();
 assert.equal(await visible('hud-explore-panel'),false,'exploration sheet closes');
 await page.screenshot({path:'ui-screenshots-v74/phone-portrait-map.png'});
 // Exercise an actual settlement and its original construction commands.
 const founded=await page.evaluate(()=>{
  const dbg=window.gameDebug,g=dbg.game,a=dbg.state.settlers.find(x=>x.team===0);
  const result=g.land(a.id);if(result)throw Error('Cannot land settler: '+result);
  for(let x=-30;x<=30;x+=5)for(let z=-30;z<=30;z+=5){
   if(g.siteRule(a,{x,z}))continue;
   a.x=x;a.z=z;const attempt=g.found(a.id);
   if(attempt.city){dbg.openTile(g.cell(attempt.city));return {id:attempt.city.id,c:attempt.city.c,r:attempt.city.r}}
  }
  throw Error('No valid starting settlement');
 });
 await page.locator('#hud-build').click();
 assert.equal(await visible('citypanel'),true,'construction bottom sheet opens');
 assert.equal(await visible('commandhud'),false,'no duplicate unit controls when building');
 const tray=await page.evaluate(()=>{
  const el=document.getElementById('tray'),buttons=[...el.querySelectorAll(':scope > button')];
  return {count:buttons.length,columns:getComputedStyle(el).gridTemplateColumns,heights:buttons.slice(0,2).map(b=>b.getBoundingClientRect().height),
    panel:document.getElementById('citypanel').getBoundingClientRect().toJSON(),nav:document.getElementById('tools').getBoundingClientRect().toJSON()};
 });
 assert.ok(tray.count>=2,'real building options are available');
 assert.equal(tray.columns.split(' ').length,2,'two columns of large build buttons');
 assert.ok(tray.heights.every(x=>x>=70),'larger construction touch targets');
 assert.ok(tray.panel.bottom<=tray.nav.y+2,'construction sheet stays above bottom nav');
 console.log('V74 CONSTRUCTION PASS '+JSON.stringify({founded,tray}));
 await page.screenshot({path:'ui-screenshots-v74/phone-portrait-build.png'});
 await page.locator('#hud-build').click();
 assert.equal(await visible('citypanel'),false,'second tap closes building sheet');
 await page.locator('#hud-army').click();
 assert.equal(await visible('citypanel'),true,'army drawer opens');
 await page.locator('#hud-city-collapse').click();
 assert.equal(await visible('citypanel'),false,'close button dismisses army drawer');
 await page.locator('#maptoggle').click();
 for(const [width,height,label] of [[844,390,'phone-landscape'],[667,375,'small-landscape']]){
  await page.setViewportSize({width,height});await page.waitForTimeout(400);
  await navGeometry(label);
  await page.screenshot({path:'ui-screenshots-v74/'+label+'.png'});
 }
 await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(400);
 assert.equal(await visible('hud-minimap-toggle'),false,'desktop keeps established minimap, not mobile toggle');
 assert.equal(await visible('atlasoverview'),true,'desktop overview remains visible');
 assert.equal(await visible('tools'),true,'desktop navigation remains visible');
 assert.ok((await page.locator('#maptoggle').boundingBox()).height>=30,'desktop button retained');
 assert.deepEqual(errors,[],'no JS runtime errors');
 assert.deepEqual(network,[],'no missing assets');
 console.log('V74 UI PASS: compact map, resources, scout drawer, touch toolbar, city construction, responsive phone/desktop');
}finally{await browser.close()}
