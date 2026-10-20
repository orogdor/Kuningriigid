import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
mkdirSync('artifacts-v77/screenshots',{recursive:true});
const ALL=['hall','house','warehouse','cellar','market','study','lumber',
 'quarry','hunter','fisher','farm','well','barracks'];
const errors=[];
async function scenario(label,width,height,isMobile){
 const ctx=await browser.newContext({viewport:{width,height},isMobile,hasTouch:isMobile,deviceScaleFactor:1,acceptDownloads:true});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(label+': '+e.message));
 try{
  await page.goto('http://127.0.0.1:8765/?v=77-test&demo=stone',
   {waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.gameDebug?.stoneDemo===true,{timeout:90000});
  await page.waitForFunction(()=>window.gameDebug?.view()==='local',{timeout:30000});
  await page.waitForFunction(()=>window.gameDebug.stoneModelStatus().length>=15,{timeout:30000});
  const test=await page.evaluate(()=>{
   const d=window.gameDebug,city=d.state.cities.find(c=>c.team===0);
   const status=d.stoneModelStatus();
   const q=d.quality();
   return {version:d.state.version,age:d.state.ages[0],city:city.name,
    typeCount:[...new Set(status.map(s=>s.type))].length,status,
    buildings:city.economy.buildings.map(b=>b.type),quality:q,view:d.view(),
    savedKeys:Object.keys(localStorage).filter(k=>/kingdoms-v4|kingdoms-save/.test(k))};
  });
  assert.equal(test.version,4);
  assert.equal(test.age,0);
  assert.equal(test.city,'Kivimetsa küla');
  assert.equal(test.view,'local');
  for(const type of ALL)assert.ok(test.status.some(s=>s.type===type&&s.triangles>=180),
   'real stone age '+type+' mesh on detail map');
  assert.ok(test.status.every(s=>s.age===0));
  await page.screenshot({path:'artifacts-v77/screenshots/'+label+'-city.png'});
  const noAutosave=await page.evaluate(()=>{
   const localKeys=['kingdoms-v4','kingdoms-v73','kingdoms-v72','kingdoms-v4-backup'];
   return localKeys.map(k=>[k,localStorage.getItem(k)]);
  });
  await page.evaluate(()=>window.gameDebug.save());
  assert.deepEqual(await page.evaluate(keys=>keys.map(k=>[k,localStorage.getItem(k)]),
   noAutosave.map(x=>x[0])),noAutosave,'demo never overwrites existing saves');
  // Export is the real existing V73/V76 JSON export control, with a special name.
  await page.evaluate(()=>{document.getElementById('startmenu').hidden=false;});
  const download=await Promise.all([
   page.waitForEvent('download',{timeout:20000}),
   page.locator('#v51export').click()
  ]).then(items=>items[0]);
  assert.equal(download.suggestedFilename(),'Kuningriigid_V77_Kivimetsa_testlinn.json');
  console.log('V77 BROWSER '+label+' '+JSON.stringify({types:test.typeCount,drawCalls:test.status.map(s=>s.drawCalls),
    triangles:test.status.map(s=>s.triangles),download:download.suggestedFilename()}));
  return test;
 }finally{await ctx.close()}
}
try{
 await scenario('phone-portrait',390,844,true);
 await scenario('phone-landscape',844,390,true);
 await scenario('desktop',1440,900,false);
 assert.deepEqual(errors,[],'no uncaught browser JS exceptions');
 console.log('V77 BROWSER PASS: 13 distinct stone buildings, existing V4 save untouched, export JSON, real 3D phone/desktop renders');
}finally{await browser.close()}
