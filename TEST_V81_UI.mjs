import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('ui-screenshots-v81',{recursive:true});
const browser=await chromium.launch({
 headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
});
const err=[];
async function check(label,viewport,isMobile){
 const ctx=await browser.newContext({viewport,isMobile,hasTouch:isMobile,
  acceptDownloads:true,deviceScaleFactor:1});
 const page=await ctx.newPage();
 page.on('pageerror',e=>err.push(label+' '+e.message));
 try{
  await page.goto('http://127.0.0.1:8765/?v=81-ci&demo=renaissance',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.gameDebug?.renaissanceDemo===true,{timeout:90000});
  await page.waitForFunction(()=>window.gameDebug?.view()==='local',{timeout:90000});
  await page.waitForFunction(()=>window.gameDebug?.renaissanceModelStatus()?.length>=28,{timeout:100000});
  const stats=await page.evaluate(()=>{
   const d=window.gameDebug,c=d.state.cities.find(c=>c.team===0);
   const models=d.renaissanceModelStatus(),road=d.localRoadStatus();
   return {age:d.state.ages[0],version:d.state.version,
    city:c.name,models,types:[...new Set(models.map(m=>m.type))],
    roads:road,menudemo:document.getElementById('startmenu').hidden,
    storage:Object.fromEntries(Object.keys(localStorage).filter(k=>k.includes('save')||k.includes('autosave')).map(k=>[k,localStorage.getItem(k)])),
    graphics:d.perfStats()};
  });
  assert.equal(stats.age,4);
  assert.equal(stats.version,4);
  assert.equal(stats.city,'Päikeselinna renessansilinn');
  assert.equal(stats.menudemo,true);
  assert.ok(stats.models.length>=28,'Renaissance demo renders enough 3D buildings');
  assert.ok(stats.types.length>=24,'different landmark model classes actually visible');
  assert.ok(stats.roads.spots>=55,'connected streets shown in 3D');
  for(const type of ['hall','house','market','university','observatory','printer','chapel','windmill','watermill']){
   assert.ok(stats.types.includes(type),'landmark model missing from detail scene: '+type);
  }
  assert.ok(stats.models.every(m=>m.age===4&&m.drawCalls>0&&m.triangles>130),
   'real indexed/batched Renaissance geometry');
  await page.screenshot({path:'ui-screenshots-v81/'+label+'-renaissance.png'});
  if(label==='phone-portrait'){
   // Menu export exercises an actual ordinary V4 save (not an illustrative
   // scene), without modifying the player's original save.
   await page.locator('#menubtn').click();
  await page.locator('#menu-saves summary').click();
   const download=await Promise.all([
    page.waitForEvent('download',{timeout:30000}),
    page.locator('#v51export').click()
   ]).then(x=>x[0]);
   assert.equal(download.suggestedFilename(),'Kuningriigid_V81_Renessanss_Paikeselinn.json');
   const json=JSON.parse(readFileSync(await download.path(),'utf8'));
   assert.equal(json.version,4);assert.equal(json.ages[0],4);
   assert.equal(json.cities.find(c=>c.team===0)?.name,'Päikeselinna renessansilinn');
   const keys=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage)
    .filter(k=>k.includes('save')||k.includes('autosave')).map(k=>[k,localStorage.getItem(k)])));
   assert.deepEqual(keys,stats.storage,'demo cannot change existing saved games');
  }
  console.log('V81 BROWSER PASS '+label+' '+JSON.stringify({
   models:stats.models.length,types:stats.types.length,roadSpots:stats.roads.spots,
   ribbons:stats.roads.ribbonTriangles,
   drawCalls:stats.models.reduce((sum,m)=>sum+m.drawCalls,0),
   triangles:stats.models.reduce((sum,m)=>sum+m.triangles,0)
  }));
 }finally{await ctx.close();}
}
try{
 await check('phone-portrait',{width:390,height:844},true);
 await check('phone-landscape',{width:844,height:390},true);
 await check('desktop',{width:1440,height:900},false);
 assert.deepEqual(err,[],'No JavaScript exceptions on mobile or desktop');
 console.log('V81 UI PASS Renaissance city, phone+desktop, streets, model cache and downloadable V4 demo save');
}finally{await browser.close()}
