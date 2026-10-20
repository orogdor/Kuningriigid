import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
mkdirSync('ui-screenshots-v75',{recursive:true});
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>!!window.gameDebug,{timeout:90000});
 await page.locator('#continue').click();
 await page.waitForFunction(()=>document.getElementById('startmenu').hidden,{timeout:15000});
 const locations=await page.evaluate(async()=>{
  const debug=window.gameDebug;
  const mod=await import('./world-object-catalog.js');
  const catalog=mod.createWorldObjectCatalog(debug.game,'medium');
  return [
   ...['village','ruins'].map(kind=>{const l=debug.state.landmarks.find(s=>s.kind===kind);return {kind,c:l.c,r:l.r,id:'landmark:'+l.id}}),
   ...['rock','forest','bridge'].map(kind=>{const c=catalog.candidates[kind][0];return {kind,c:c.c,r:c.r,id:kind+':'+c.c+':'+c.r}})
  ];
 });
 for(const loc of locations){
  const current=await page.evaluate(({c,r})=>{
   const dbg=window.gameDebug,g=dbg.game,cell=g.cell({c,r});
   g.reveal(0,cell,1);dbg.openTile(cell);
   return {view:dbg.view(),ids:dbg.detailObjectStatus().filter(v=>v.c===c&&v.r===r).flatMap(v=>v.ids)};
  },loc);
  assert.equal(current.view,'local','opens same detailed tile '+loc.kind);
  assert.ok(current.ids.includes(loc.id),'3D '+loc.kind+' appears in active detail tile: '+JSON.stringify(current));
  assert.equal(current.ids.filter(x=>x===loc.id).length,1,'no duplicate '+loc.kind);
  if(loc.kind==='village'||loc.kind==='ruins')
   await page.screenshot({path:'ui-screenshots-v75/'+loc.kind+'-mobile.png'});
  console.log('V75 DETAIL PASS',loc.kind,loc.id);
 }
 const claimed=await page.evaluate(loc=>{
  const dbg=window.gameDebug,g=dbg.game,l=dbg.state.landmarks.find(a=>a.c===loc.c&&a.r===loc.r);
  // Simulate the standard explored-POI reward (without changing site coordinates).
  const origin=dbg.state.settlers[0];origin.c=l.c;origin.r=l.r;
  // collectLandmark is called in movement logic; advance the same state through it.
  l.claimedBy=0;l.claimedAt=dbg.state.time;
  dbg.openTile(g.cell(l));
  return dbg.detailObjectStatus().filter(v=>v.c===l.c&&v.r===l.r).flatMap(v=>v.objects).find(o=>o.id==='landmark:'+l.id);
 },locations[0]);
 assert.equal(claimed.claimedBy,0,'visited village is still visible after reward');
 await page.setViewportSize({width:1440,height:900});
 const detail=await page.evaluate(()=>window.gameDebug.detailObjectStatus());
 assert.ok(detail.some(v=>v.ids.some(id=>id.startsWith('landmark:village-'))),'same objects remain when switching to desktop viewport');
 await page.screenshot({path:'ui-screenshots-v75/village-desktop.png'});
 assert.deepEqual(errors,[],'no browser exceptions when changing world-detail objects');
 console.log('V75 BROWSER PASS: active tile villages, ruins, forests, rocks, crossings, claimed state, phone/desktop');
}finally{await browser.close()}
