import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('ui-screenshots-v80',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle',
 '--use-angle=swiftshader','--enable-unsafe-swiftshader']});
async function check(label,demo,viewport,isMobile){
 const ctx=await browser.newContext({viewport,isMobile,hasTouch:isMobile,deviceScaleFactor:1});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8765/?v=80-test&demo='+demo,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.gameDebug?.view()==='local',{timeout:90000});
  await page.waitForFunction(()=>window.gameDebug?.localRoadStatus?.().spots>0,{timeout:60000});
  const stats=await page.evaluate(async()=>{
   const d=window.gameDebug,city=d.state.cities.find(c=>c.team===0),nav=d.game.nav(city);
   const {buildingClearance}=await import('./navigation.js');
   const buildings=city.economy.buildings.filter(b=>b.ready&&!b.virtual);
   const heat=Object.keys(city.world.heat||{}).map(Number).filter(k=>nav.roadLevel(k)>0);
   const blocked=heat.filter(k=>{const p=nav.point(k);return buildings.some(b=>{const f=buildingClearance(b);return f&&Math.abs(p.x-b.x)<=f.rx&&Math.abs(p.z-b.z)<=f.rz})});
   const modelAge=buildings.map(b=>d.game.buildingAge(b.team,b.type));
   return {age:d.state.ages[0],name:city.name,road:d.localRoadStatus(),heat:heat.length,
    blocked:blocked.length,models:d.stoneModelStatus?.().length||0,
    medievalModels:(()=>{let n=0;d.localScene.traverse(o=>{if(o.userData?.medievalAgeModel)n++});return n})(),
    buildings:buildings.length,navAge:modelAge.slice(0,3)};
  });
  assert.equal(stats.age,demo==='bronze'?1:3);
  assert.ok(stats.buildings>=25);
  assert.ok(stats.heat>=35,'test city needs several connected streets, not a couple of tracks');
  assert.equal(stats.blocked,0,'no road centre inside any building/porch/props');
  assert.ok(stats.road.spots>=15,'actual road circles are painted');
  assert.ok(stats.road.ribbonTriangles>=20,'actual linked road triangles are painted');
  if(demo==='medieval')assert.ok(stats.medievalModels>=20,'age-3 buildings use dedicated models');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'ui-screenshots-v80/'+label+'.png',fullPage:false});
  console.log('V80 BROWSER PASS '+label+' '+JSON.stringify(stats));
 }finally{await ctx.close()}
}
try{
 await check('bronze-phone-portrait','bronze',{width:390,height:844},true);
 await check('medieval-phone-portrait','medieval',{width:390,height:844},true);
 await check('bronze-desktop','bronze',{width:1440,height:900},false);
 console.log('V80 UI PASS: interlinked model-safe road networks in bronze and medieval cities, phone and desktop');
}finally{await browser.close()}
