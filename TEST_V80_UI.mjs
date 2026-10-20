import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
mkdirSync('artifacts-v80/screenshots',{recursive:true});
const failures=[];
async function run(name,width,height,mobile,era){
 const ctx=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1,acceptDownloads:true});
 const page=await ctx.newPage();
 page.on('pageerror',e=>failures.push(name+' '+e.message));
 page.on('response',r=>{if(r.status()>=400)failures.push(name+' HTTP '+r.status()+' '+r.url())});
 try{
  await page.goto('http://127.0.0.1:8765/?v=80-ui&demo='+era,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.gameDebug?.view()==='local',{timeout:120000});
  const modern=era==='medieval';
  await page.waitForFunction(modern?()=>window.gameDebug?.medievalModelStatus?.().length>=30:()=>window.gameDebug?.bronzeModelStatus?.().length>=30,{timeout:90000});
  await page.evaluate(()=>window.gameDebug.refreshLocalRoads());
  await page.waitForFunction(()=>window.gameDebug.localRoadStatus().spots>=80,{timeout:90000});
  const result=await page.evaluate(()=>{
   const d=window.gameDebug,city=d.state.cities[0],nav=d.game.nav(city),status=d.localRoadStatus();
   const visible=Object.keys(city.world.heat||{}).map(Number).filter(k=>nav.roadLevel(k)>0&&nav.open(nav.point(k).x,nav.point(k).z));
   return {name:city.name,age:d.game.upgrade(0),buildings:city.economy.buildings.length,
    models:d.medievalDemo?d.medievalModelStatus().length:d.bronzeModelStatus().length,
    road:status,visibleCells:visible.length,worldSaveVersion:d.state.version,
    demo:d.medievalDemo?'medieval':d.bronzeDemo?'bronze':'other',
    backingSave:localStorage.getItem('kingdoms-v73')};
  });
  assert.equal(result.age,modern?3:1);
  assert.equal(result.worldSaveVersion,4);
  assert.ok(result.models>=30,'new 3D models really render');
  assert.ok(result.road.spots>=80,'fully connected city paths are visible, not only two market roads');
  assert.ok(result.road.ribbonTriangles>100,'actual 3D street ribbon geometry is present');
  assert.ok(result.visibleCells>=80);
  assert.equal(result.backingSave,null,'demo must not overwrite local autosave');
  await page.screenshot({path:'artifacts-v80/screenshots/'+name+'-'+era+'-road-network.png',timeout:120000});
  if(modern){
   await page.evaluate(()=>{document.getElementById('startmenu').hidden=false});
   const [download]=await Promise.all([page.waitForEvent('download',{timeout:20000}),page.locator('#v51export').click()]);
   assert.equal(download.suggestedFilename(),'Kuningriigid_V80_Keskaeg.json');
  }
  console.log('V80 BROWSER '+name+' '+JSON.stringify({...result,backingSave:null}));
 }finally{await ctx.close()}
}
try{
 await run('phone-portrait',390,844,true,'medieval');
 await run('phone-landscape',844,390,true,'medieval');
 await run('desktop',1440,900,false,'medieval');
 await run('bronze-phone-portrait',390,844,true,'bronze');
 assert.deepEqual(failures,[],'no uncaught errors or missing assets');
 console.log('V80 BROWSER PASS: medieval 3D cities with dense safe 3D road networks on phone and desktop; Bronze road fixes work');
}finally{await browser.close()}
