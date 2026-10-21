import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
fs.mkdirSync('artifacts-v88',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>window.gameDebug,null,{timeout:90000});
 await page.locator('#menu-world summary').click();await page.locator('#seed').fill('8417');await page.locator('#newgame').click();
 await page.waitForFunction(()=>document.getElementById('startmenu').hidden);await page.locator('#pause').click();
 const reports=[];
 for(const [name,width,height]of [['desktop',1280,800],['mobile',390,844]]){
  await page.setViewportSize({width,height});
  const report=await page.evaluate(()=>{
   const d=gameDebug,g=d.game,s=d.state,a=s.armies[0],initial=d.fogStatus(),start={c:a.c,r:a.r},times=[],changes=[];
   a.autoExplore=true;
   for(let i=0;i<40;i++){
    g.autoExplore(1.5);g.advanceWorldMovers(3);s.time+=3;
    const t=performance.now();d.worldSync();times.push(performance.now()-t);changes.push(d.fogStatus().changedCells);
   }
   const final=d.fogStatus();times.sort((a,b)=>a-b);
   return {start,end:{c:a.c,r:a.r},initial,final,maxSyncMs:times.at(-1),p95SyncMs:times[Math.floor(times.length*.95)],maxChangedCells:Math.max(...changes)};
  });
  assert.notDeepEqual(report.start,report.end,'real explorer traversed world cells');
  assert.equal(report.initial.coverGeometry,report.final.coverGeometry,'no fog geometry replacement while moving');
  assert.deepEqual(report.initial.sketchGeometries,report.final.sketchGeometries,'no sketch geometry replacement');
  assert.ok(report.maxChangedCells<=21,'only newly revealed cells enter the terrain update');
  assert.ok(report.maxSyncMs<1500,'a world visibility update must not lock the main thread for seconds');
  await page.waitForTimeout(500);await page.screenshot({path:`artifacts-v88/exploration-${name}.png`});
  reports.push({name,...report});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('artifacts-v88/exploration.json',JSON.stringify(reports,null,2));
 console.log('V88 EXPLORATION UI PASS '+JSON.stringify(reports));
}finally{await browser.close();}
