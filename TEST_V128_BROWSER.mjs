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
  const later=await page.evaluate(()=>({main:localStorage.getItem('kingdoms-civ4'),backup:localStorage.getItem('kingdoms-civ4-backup'),citizenSearches:[...window.gameDebug.game.navs.values()].reduce((n,nav)=>n+nav.citizenRoutes.stats.searches,0)}));
  assert.ok(later.citizenSearches>0,'real citizens use the new navigation in the browser');assert.equal(later.main,state.main);assert.equal(later.backup,state.backup);
  const performanceChecks=await page.evaluate(async()=>{
   const d=window.gameDebug,c=d.state.cities.find(c=>c.team===0);d.openTile(d.game.cell(c));d.setCityTab('build');d.renderUI();d.renderUI();
   const resource=document.querySelector('#resources span'),card=document.querySelector('#tray button[data-building]');d.renderUI();
   const resourcesStable=resource===document.querySelector('#resources span'),cardStable=card===document.querySelector('#tray button[data-building]');
   const choose=document.querySelector('#tray button.v121-build-card.is-ready:not(:disabled)');choose?.click();
   const clickWorks=!!choose&&document.getElementById('hud-build-guidance').textContent.includes('Place ');
   const {SnapshotEncoder,serializeSnapshot}=await import('./snapshot-v131.js');const encoder=new SnapshotEncoder(),usedWorker=!!encoder.worker;
   const serialized=await encoder.encode(d.state),saveMatches=serialized===serializeSnapshot(d.state);encoder.worker?.terminate();
   return {resourcesStable,cardStable,clickWorks,usedWorker,saveMatches};
  });
  assert.ok(Object.values(performanceChecks).every(Boolean),JSON.stringify(performanceChecks));
  assert.deepEqual(errors,[]);results.push({mobile,...state,performanceChecks,errors});await context.close();
 }
 const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/?v=128',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden,{timeout:120000});
 assert.equal(await page.locator('#startmenu').isVisible(),true);assert.equal(await page.locator('#newgame').isEnabled(),true);assert.deepEqual(errors,[]);
 await page.screenshot({path:out+'/full-game-menu.png'});
 const autosave=await page.evaluate(async()=>{const d=window.gameDebug,before=JSON.stringify(d.state);localStorage.setItem('kingdoms-civ4',before);d.state.time=120;await d.save();const after=JSON.parse(localStorage.getItem('kingdoms-civ4'));return {version:after.version,time:after.time,backupPreserved:localStorage.getItem('kingdoms-civ4-backup')===before};});
 assert.deepEqual(autosave,{version:4,time:120,backupPreserved:true});assert.deepEqual(errors,[]);
 results.push({normalGame:true,autosave,errors});await context.close();
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify(results,null,2));console.log('V128 BROWSER PASS',JSON.stringify(results));
}finally{await browser.close();}
