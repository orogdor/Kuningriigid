import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const out='artifacts-v147';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});
  await context.addInitScript(()=>{localStorage.setItem('kingdoms-quality','low');localStorage.setItem('kingdoms-civ4','untouched-save');localStorage.setItem('kingdoms-civ4-backup','untouched-backup')});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/?demo=ai-medieval-v147&v=147',{waitUntil:'domcontentloaded',timeout:150000});
  await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden,{timeout:150000});
  const result=await page.evaluate(()=>{
   const s=gameDebug.state,c=gameDebug.activeCity();
   return {demo:s.demo,age:s.ages[0],turn:s.medievalTestV147?.turn,cityId:c?.id,targetId:s.medievalTestV147?.targetCityId,
    name:c?.name,view:gameDebug.view(),population:c?.economy?.realms?.[0]?.pop,
    saved:localStorage.getItem('kingdoms-civ4'),backup:localStorage.getItem('kingdoms-civ4-backup')};
  });
  assert.equal(result.demo,'ai-medieval-v147');assert.equal(result.age,3);
  assert.equal(result.cityId,result.targetId,'opens biggest medieval AI city');
  assert.equal(result.view,'local');assert.ok(result.population>0);
  assert.equal(result.saved,'untouched-save');assert.equal(result.backup,'untouched-backup');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`${out}/largest-city-${mobile?'mobile':'desktop'}.png`});
  results.push({...result,mobile,errors});await context.close();
 }
 fs.writeFileSync(out+'/test-results.json',JSON.stringify(results,null,2));
 console.log('V147 BROWSER PASS',JSON.stringify(results));
}finally{await browser.close();}
