import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1});
const page=await context.newPage(),jsErrors=[],badNetwork=[];
page.on('pageerror',e=>jsErrors.push(e.message));
page.on('response',r=>{if(r.status()>=400)badNetwork.push(r.status()+' '+r.url())});
mkdirSync('ui-screenshots-v71',{recursive:true});
const sleep=n=>page.waitForTimeout(n);
const check=async label=>{
 const data=await page.evaluate(()=>{
  const ids=['tools','commandhud','v51insights','atlasoverview','hud-resource-toggle','hud-tile-resources','hud-zoom-controls','hud-explore-panel','citypanel','hud-build-status'];
  const out={};for(const id of ids){const el=document.getElementById(id),r=el.getBoundingClientRect(),sty=getComputedStyle(el);out[id]={x:r.x,y:r.y,w:r.width,h:r.height,visible:sty.display!=='none'&&sty.visibility!=='hidden'&&!el.hidden&&r.width>0&&r.height>0}};
  const overlap=(a,b)=>{const x=out[a],y=out[b];return x.visible&&y.visible&&Math.min(x.x+x.w,y.x+y.w)-Math.max(x.x,y.x)>3&&Math.min(x.y+x.h,y.y+y.h)-Math.max(x.y,y.y)>3};
  const pairs=[['tools','commandhud'],['tools','citypanel'],['tools','hud-resource-toggle'],['tools','hud-tile-resources'],['tools','hud-explore-panel'],['tools','hud-zoom-controls'],['v51insights','atlasoverview'],['v51insights','hud-zoom-controls'],['atlasoverview','hud-resource-toggle'],['atlasoverview','hud-tile-resources'],['hud-resource-toggle','hud-tile-resources'],['hud-zoom-controls','hud-resource-toggle'],['hud-zoom-controls','hud-explore-panel'],['hud-explore-panel','v51insights'],['hud-explore-panel','hud-tile-resources'],['citypanel','commandhud'],['citypanel','hud-zoom-controls'],['citypanel','hud-resource-toggle'],['commandhud','hud-resource-toggle']];
  const clashes=pairs.filter(([a,b])=>overlap(a,b));
  const offscreen=ids.filter(id=>{const a=out[id];return a.visible&&(a.x < -3||a.y < -3||a.x+a.w>innerWidth+3||a.y+a.h>innerHeight+3)});
  const nav=document.getElementById('tools');
  return {size:[innerWidth,innerHeight],out,clashes,offscreen,navOverflow:nav.scrollWidth>nav.clientWidth+2,view:window.gameDebug.view()};
 });
 console.log('V71 HUD '+label,JSON.stringify({screen:data.size,view:data.view,clashes:data.clashes,offscreen:data.offscreen,navOverflow:data.navOverflow,items:Object.fromEntries(Object.entries(data.out).filter(([,a])=>a.visible).map(([name,a])=>[name,{x:Math.round(a.x),y:Math.round(a.y),w:Math.round(a.w),h:Math.round(a.h)}]))}));
 assert.deepEqual(data.clashes,[],'HUD elements overlap '+label);
 assert.deepEqual(data.offscreen,[],'HUD elements outside screen '+label);
 assert.equal(data.navOverflow,false,'bottom menu clipped '+label);
 await page.screenshot({path:'ui-screenshots-v71/'+label+'.png'});
};
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForFunction(()=>!!window.gameDebug,{timeout:90000});
 await page.locator('#continue').click();
 await page.waitForFunction(()=>document.body.classList.contains('atlas')&&document.getElementById('startmenu').hidden,{timeout:30000});
 assert.equal(await page.evaluate(()=>window.gameDebug.resourceLayerStatus().enabled),true,'settler enables resources');
 assert.equal(await page.locator('#hud-tile-resources').isVisible(),false,'resource details start collapsed');
 await check('phone-landscape-idle-844');
 await page.locator('#hud-resource-toggle').click();
 assert.equal(await page.locator('#hud-tile-resources').isVisible(),true,'resource details expand');
 await check('phone-landscape-resource-detail');
 await page.locator('#hud-resource-toggle').click();
 const initialZoom=await page.evaluate(()=>window.gameDebug.getZoom());
 await page.locator('#hud-zoom-in').click();
 assert.ok(await page.evaluate(()=>window.gameDebug.getZoom())<initialZoom,'zoom-in button works');
 await page.locator('#hud-zoom-out').click();
 assert.ok(Math.abs((await page.evaluate(()=>window.gameDebug.getZoom()))-initialZoom)<2,'zoom-out button works');
 const client=await context.newCDPSession(page);
 const beforePinch=await page.evaluate(()=>window.gameDebug.getZoom());
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:367,y:195,id:1},{x:447,y:195,id:2}]});
 await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:350,y:195,id:1},{x:464,y:195,id:2}]});
 await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:320,y:195,id:1},{x:494,y:195,id:2}]});
 await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await sleep(120);
 const afterPinch=await page.evaluate(()=>window.gameDebug.getZoom());
 assert.ok(afterPinch<beforePinch-5,'two-finger outward pinch zooms in');
 console.log('V71 PINCH PASS',beforePinch,afterPinch);
 await page.locator('#hud-explore').click();
 assert.equal(await page.locator('#hud-explore-panel').isVisible(),true);
 await check('phone-landscape-exploration');
 assert.equal(await page.locator('#hud-explore-select').isEnabled(),true,'existing scout selectable');
 await page.locator('#hud-explore-select').click();
 assert.equal(await page.locator('#hud-explore-panel').isVisible(),false);
 assert.equal(await page.evaluate(()=>window.gameDebug.currentSelection()?.kind),'army');
 await page.locator('#hud-explore').click();
 await page.locator('#hud-explore-auto').click();
 assert.equal(await page.evaluate(()=>window.gameDebug.state.armies.some(a=>a.team===0&&a.autoExplore)),true,'auto explorer toggle works');
 await page.locator('#hud-explore-auto').click();
 assert.equal(await page.evaluate(()=>window.gameDebug.state.armies.some(a=>a.team===0&&a.autoExplore)),false,'auto explorer can be stopped');
 await page.locator('#hud-explore-close').click();
 // A world tile with no own unit opens detail view directly instead of merely selecting.
 const tile=await page.evaluate(()=>{
  const dbg=window.gameDebug,cell=dbg.game.cells.find(c=>c.land&&dbg.game.seen(0,c)&&!dbg.state.settlers.some(a=>a.c===c.c&&a.r===c.r)&&!dbg.state.armies.some(a=>a.c===c.c&&a.r===c.r));
  if(!cell)throw Error('no available discovered unoccupied land cell');
  dbg.worldClick(cell);
  return {id:cell.c+':'+cell.r,view:dbg.view()};
 });
 assert.equal(tile.view,'local','tap world tile opens detailed map immediately');
 console.log('V71 MAP PASS',JSON.stringify(tile));
 await page.locator('#maptoggle').click();
 assert.equal(await page.evaluate(()=>window.gameDebug.view()),'world','return to world map');
 for(const l of [{name:'phone-landscape-667',w:667,h:375},{name:'phone-portrait-390',w:390,h:844},{name:'tablet-800',w:800,h:600},{name:'desktop-1024',w:1024,h:768},{name:'desktop-1440',w:1440,h:900}]){
  await page.setViewportSize({width:l.w,height:l.h});
  await sleep(320);
  await check(l.name);
 }
 assert.deepEqual(badNetwork,[],'no missing web assets');
 assert.deepEqual(jsErrors,[],'no game errors');
 console.log('V71 UI PASS: direct tile access, scout menu, touch pinch, zoom buttons, six sizes and overlay constraints');
}finally{await browser.close();}
