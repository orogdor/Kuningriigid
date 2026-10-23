import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const out='artifacts-v140';fs.mkdirSync(out,{recursive:true});
const manifest=JSON.parse(fs.readFileSync('scenarios/ai-modern-v140.manifest.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});
  await context.addInitScript(()=>{localStorage.setItem('kingdoms-quality','low');localStorage.setItem('kingdoms-civ4','original-saved-player-game');localStorage.setItem('kingdoms-civ4-backup','original-saved-player-backup');});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/?demo=ai-modern-v140&v=140',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden,{timeout:120000});
  const result=await page.evaluate(()=>{
   const s=gameDebug.state,city=s.cities.find(c=>c.team===0);
   return {demo:s.demo,age:s.ages[0],turn:Math.floor(s.time/60)+1,modern:s.aiModernTestV140?.firstModern,
      cityCount:s.cities.filter(c=>c.team===0).length,city:city?.name,view:gameDebug.view(),
      main:localStorage.getItem('kingdoms-civ4'),backup:localStorage.getItem('kingdoms-civ4-backup')};
  });
  assert.equal(result.demo,'ai-modern-v140');
  assert.equal(result.modern,manifest.success);
  assert.equal(result.age,manifest.age);
  assert.ok(result.cityCount>=1);
  assert.ok(result.turn>=manifest.turn);
  assert.equal(result.view,'local');
  assert.equal(result.main,'original-saved-player-game');assert.equal(result.backup,'original-saved-player-backup');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`${out}/modern-ai-${mobile?'mobile':'desktop'}.png`});
  results.push({...result,mobile,errors});await context.close();
 }
 fs.writeFileSync(out+'/test-results.json',JSON.stringify(results,null,2));console.log('V140 BROWSER PASS',JSON.stringify(results));
}finally{await browser.close()}
