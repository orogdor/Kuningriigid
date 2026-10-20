import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
mkdirSync('artifacts-v79/screenshots',{recursive:true});
const faults=[];
async function test(name,width,height,mobile){
 const ctx=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1,acceptDownloads:true});
 const page=await ctx.newPage();
 page.on('pageerror',e=>faults.push(name+' '+e.message));
 page.on('response',r=>{if(r.status()>=400)faults.push(name+' HTTP '+r.status()+' '+r.url())});
 try{
  await page.goto('http://127.0.0.1:8765/?v=79-test&demo=bronze',
    {waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.gameDebug?.bronzeDemo===true,{timeout:90000});
  await page.waitForFunction(()=>window.gameDebug.view()==='local',{timeout:45000});
  await page.waitForFunction(()=>window.gameDebug.bronzeModelStatus().length>=30,{timeout:50000});
  const obj=await page.evaluate(()=>{
   const d=window.gameDebug,city=d.state.cities.find(c=>c.team===0);
   return {age:d.state.ages[0],known:d.state.research[0].known.includes('bronze_crafts'),
    view:d.view(),name:city.name,buildingCount:city.economy.buildings.length,
    modelCount:d.bronzeModelStatus().length,modelTypes:[...new Set(d.bronzeModelStatus().map(x=>x.type))],
    navCells:Object.keys(city.world.heat||{}).length,road:d.localRoadStatus(),
    pixelRatio:d.perfStats().pixelRatio,version:d.state.version,
    docs:document.title};
  });
  assert.equal(obj.age,1);
  assert.equal(obj.version,4);
  assert.equal(obj.known,true);
  assert.equal(obj.view,'local');
  assert.equal(obj.name,'Vaskoru pronksilinn');
  assert.equal(obj.modelTypes.length,30,'all Bronze building types in 3D');
  assert.equal(obj.modelCount,32,'one hall and 31 demonstration buildings');
  assert.ok(obj.navCells>=8,'road formation is stored in the real saved local terrain');
  await page.evaluate(()=>window.gameDebug.refreshLocalRoads());
  await page.waitForFunction(()=>window.gameDebug.localRoadStatus().spots>=8,{timeout:60000});
  await page.screenshot({path:'artifacts-v79/screenshots/'+name+'-bronze-road.png',timeout:60000});
  await page.locator('#menubtn').click();
  await page.locator('#menu-saves summary').click();
  const download=await Promise.all([page.waitForEvent('download',{timeout:20000}),page.locator('#v51export').click()]).then(x=>x[0]);
  assert.equal(download.suggestedFilename(),'Kuningriigid_V79_Pronksilinn.json');
  console.log('V79 UI '+name+' '+JSON.stringify({...obj,roadAfter:await page.evaluate(()=>window.gameDebug.localRoadStatus()),file:download.suggestedFilename()}));
 }finally{await ctx.close()}
}
try{
 await test('phone-portrait',390,844,true);
 await test('phone-landscape',844,390,true);
 await test('desktop',1440,900,false);
 assert.deepEqual(faults,[],'no browser module/3D runtime errors');
 console.log('V79 UI PASS: Bronze 3D models, real worn market roads, independent JSON demo on phone and desktop');
}finally{await browser.close()}
