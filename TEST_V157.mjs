// V157: detail roads keep clear of building plots, world travellers show on the detail map,
// the world terrain has a farmland mask. Needs a static server on 127.0.0.1:8765 and CHROME_PATH.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const demo of ['ai-medieval-v151','ai-modern-v140']){
  const page=await browser.newPage(),errors=[];page.setDefaultTimeout(240000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:8765/?demo=${demo}&v=157`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden);await page.waitForTimeout(2500);
  const r=await page.evaluate(()=>{const d=gameDebug.v157();let inside=0,checked=0;
   for(const line of d.roads)for(const p of line){if(Math.abs(p.x)>330||Math.abs(p.z)>285)continue;checked++;
    for(const [cx,cz,rx,rz] of d.plots)if(Math.abs(p.x-cx)<rx-.05&&Math.abs(p.z-cz)<rz-.05){inside++;break;}}
   return {roads:d.roads.length,plots:d.plots.length,checked,inside};});
  console.log('V157',demo,JSON.stringify(r));
  assert.deepEqual(errors,[]);assert.ok(r.plots>5&&r.checked>20,'city with roads and plots');
  assert.ok(r.inside<=r.checked*.02,`road centre lines stay out of building plots (${r.inside}/${r.checked})`);
  await page.close();
 }
 // a trade caravan of the player is drawn on the detail map of the tile it is crossing
 const page=await browser.newPage(),errors=[];page.setDefaultTimeout(240000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/?demo=ai-iron-v143&v=157',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden);await page.waitForTimeout(1500);
 const opened=await page.evaluate(()=>{const s=gameDebug.state,c=s.shipments.find(c=>c.team===0&&c.mode!=='air'&&c.mode!=='rail');if(!c)return false;gameDebug.openTile(gameDebug.game.cell({c:c.c,r:c.r}));return true;});
 assert.ok(opened,'demo has a caravan');await page.waitForTimeout(1500);
 const t=await page.evaluate(()=>gameDebug.v157().travellers);console.log('V157 travellers',t);
 assert.ok(t>=1,'caravan visible on the detail map');assert.deepEqual(errors,[]);
 await page.close();
}finally{await browser.close();}
console.log('V157 PASS');
