import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
mkdirSync('ui-screenshots-v78',{recursive:true});
const errors=[];
async function run(label,width,height,isMobile){
 const context=await browser.newContext({viewport:{width,height},isMobile,hasTouch:isMobile,deviceScaleFactor:1});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(label+': '+e.message));
 try{
  await page.goto('http://127.0.0.1:8765/?v=78-test&demo=stone',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.gameDebug?.view()==='local',{timeout:90000});
  await page.waitForFunction(()=>window.gameDebug?.stoneModelStatus().length>=15,{timeout:30000});
  const measurements=await page.evaluate(async()=>{
   const dbg=window.gameDebug,g=dbg.game,city=g.s.cities.find(c=>c.team===0);
   const market=city.economy.buildings.find(b=>b.type==='market');market.assigned=1;
   const {tickMarketHouseholds}=await import('./builders.js');
   const oldCount=dbg.marketWalkStatus().length;
   let jumps=0,maxStep=0,movingFrames=0,carry=false,samples=0,previous=new Map();
   for(let tick=0;tick<450;tick++){
    g.s.time+=.1;tickMarketHouseholds(g,city,.1);
    for(const w of dbg.marketWalkStatus()){
     const prev=previous.get(w.id);
     if(prev){const diff=Math.hypot(w.x-prev.x,w.z-prev.z);maxStep=Math.max(maxStep,diff);
      if(diff>.65)jumps++;if(diff>.01)movingFrames++;}
     previous.set(w.id,{x:w.x,z:w.z});
     if(w.phase==='home')carry=true;
     samples++;
    }
   }
   dbg.refreshLocalRoads();
   const road=dbg.localRoadStatus(),shoppers=dbg.marketWalkStatus();
   return {oldCount,newCount:shoppers.length,movingFrames,jumps,maxStep,carry,samples,road,
    positions:shoppers.map(({id,x,z,phase})=>({id,x,z,phase})),stoneModels:dbg.stoneModelStatus().length};
  });
  assert.ok(measurements.newCount>=3,'each example household gets market visitor');
  assert.ok(measurements.movingFrames>100,'shoppers move every simulation step, not only each 1-second batch');
  assert.equal(measurements.jumps,0,'no jerky teleporting shoppers in 0.1-second steps');
  assert.ok(measurements.maxStep<=.65,'limited 3D movement distance');
  assert.ok(measurements.road.trailCells>10,'foot traffic creates local wear points');
  assert.ok(measurements.stoneModels>=15,'stone-age building assets still visible');
  await page.screenshot({path:'ui-screenshots-v78/'+label+'-market-paths.png'});
  console.log('V78 BROWSER '+label+' '+JSON.stringify(measurements));
 }finally{await context.close()}
}
try{
 await run('phone-portrait',390,844,true);
 await run('phone-landscape',844,390,true);
 await run('desktop',1440,900,false);
 assert.deepEqual(errors,[],'no browser exceptions');
 console.log('V78 BROWSER PASS: animated shoppers and accumulating town foot traffic, mobile and desktop, V77 models unchanged');
}finally{await browser.close()}
