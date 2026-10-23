import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const out='artifacts-v128';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});
  await context.addInitScript(()=>{localStorage.setItem('kingdoms-civ4','original-save-sentinel');localStorage.setItem('kingdoms-civ4-backup','backup-save-sentinel');localStorage.setItem('kingdoms-quality','low');});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/?demo=iron-ai&v=128',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden,{timeout:120000});
  const state=await page.evaluate(()=>{const d=window.gameDebug;return {age:d.state.ages[0],takeover:d.state.takeoverV128,ownCities:d.state.cities.filter(c=>c.team===0).length,ownCombat:d.state.units.filter(u=>u.team===0&&u.hp>0&&u.kind!=='scout').length,view:d.view(),menuHidden:document.getElementById('startmenu').hidden,main:localStorage.getItem('kingdoms-civ4'),backup:localStorage.getItem('kingdoms-civ4-backup'),time:d.state.time};});
  assert.equal(state.age,2);assert.equal(state.takeover.sourceTeam,1);assert.ok(state.ownCities>0&&state.ownCombat>=2);assert.equal(state.view,'local');assert.equal(state.menuHidden,true);
  assert.equal(state.main,'original-save-sentinel');assert.equal(state.backup,'backup-save-sentinel');
  await page.screenshot({path:`${out}/takeover-${mobile?'mobile':'desktop'}.png`});
  await page.locator('#maptoggle').click();
  await page.waitForFunction(()=>window.gameDebug.view()==='world');
  await page.screenshot({path:`${out}/counties-${mobile?'mobile':'desktop'}.png`});
  await page.locator('#pause').click();
  await page.waitForFunction(time=>window.gameDebug.state.time>time+.1,state.time,{timeout:15000});
  await page.locator('#pause').click();
  const later=await page.evaluate(()=>({main:localStorage.getItem('kingdoms-civ4'),backup:localStorage.getItem('kingdoms-civ4-backup')}));
  assert.equal(later.main,state.main);assert.equal(later.backup,state.backup);
  assert.deepEqual(errors,[]);results.push({mobile,...state,errors});await context.close();
 }
 const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/?v=128',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden,{timeout:120000});
 assert.equal(await page.locator('#startmenu').isVisible(),true);assert.equal(await page.locator('#newgame').isEnabled(),true);assert.deepEqual(errors,[]);
 await page.screenshot({path:out+'/full-game-menu.png'});results.push({normalGame:true,errors});await context.close();
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify(results,null,2));console.log('V128 BROWSER PASS',JSON.stringify(results));
}finally{await browser.close();}
