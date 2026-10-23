import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const out='artifacts-v142';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});
  await context.addInitScript(()=>{localStorage.setItem('kingdoms-quality','low');localStorage.setItem('kingdoms-civ4','existing-player-save');localStorage.setItem('kingdoms-civ4-backup','existing-player-backup');});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/?demo=ai-iron-v142&v=142',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden,{timeout:120000});
  const result=await page.evaluate(()=>{
   const s=gameDebug.state,city=s.cities.find(c=>c.team===0);
   return {demo:s.demo,seed:s.seed,turn:Math.floor(s.time/60)+1,test:s.ironCityTestV142,age:s.ages[0],radius:gameDebug.game.radius(city),population:city?.economy.realms[0].pop,cityCount:s.cities.filter(c=>c.team===0).length,buildings:gameDebug.game.contexts(city).flatMap(d=>d.economy.buildings.filter(b=>!b.virtual&&b.hp>0)).length,view:gameDebug.view(),health:document.getElementById('cityhealth').textContent,main:localStorage.getItem('kingdoms-civ4'),backup:localStorage.getItem('kingdoms-civ4-backup')};
  });
  assert.equal(result.demo,'ai-iron-v142');assert.equal(result.age,2);assert.ok(result.test&&result.test.turn>0);assert.ok(result.radius>=Math.max(1,Math.floor(Math.sqrt(result.population/2))));assert.ok(result.cityCount>=1);assert.ok(result.buildings>=2);assert.equal(result.view,'local');assert.match(result.health,/(?:expansion|laienemine) 18/,'city information uses the new next growth threshold');assert.equal(result.main,'existing-player-save');assert.equal(result.backup,'existing-player-backup');assert.deepEqual(errors,[]);
  await page.screenshot({path:`${out}/ai-city-${mobile?'mobile':'desktop'}.png`});
  results.push({...result,mobile,errors});await context.close();
 }
 fs.writeFileSync(out+'/test-results.json',JSON.stringify(results,null,2));console.log('V142 BROWSER PASS',JSON.stringify(results));
}finally{await browser.close()}
