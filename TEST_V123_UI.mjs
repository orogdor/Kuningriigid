import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
fs.mkdirSync('artifacts-v123',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const size of [{width:390,height:844},{width:1366,height:768}]){
  const page=await browser.newPage({viewport:size}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/?demo=stone&v=123',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.gameDebug&&gameDebug.view()==='local',{timeout:120000});
  const initial=await page.evaluate(()=>{
   const g=gameDebug;let t=null;g.localScene.traverse(e=>{if(e.userData?.terrain&&!t)t=e});
   const nav=g.game.nav(g.game.cell(g.state.cities[0]));
   return {view:g.view(),terrainWidth:t?.geometry?.parameters?.width,terrainDepth:t?.geometry?.parameters?.height,navWidth:nav.w,navDepth:nav.h};
  });
  assert.equal(initial.terrainWidth,675,'Physical local terrain must be 50% wider');
  assert.equal(initial.terrainDepth,585,'Physical local terrain must be 50% deeper');
  assert.ok(initial.navWidth>=219&&initial.navDepth>=189,'Walkable paths expanded');
  await page.evaluate(()=>{document.getElementById('startmenu').hidden=true;gameDebug.openResearch()});
  await page.waitForSelector('#researchtree [data-preview="true"]',{timeout:20000});
  const previews=await page.evaluate(()=>{
   const cards=[...document.querySelectorAll('#researchtree [data-preview="true"]')],map=document.querySelector('.tech-map-viewport');
   const first=cards[0],intro=document.querySelector('.tech-inspector');
   return {count:cards.length,first:first?.innerText,locked:cards.every(c=>c.classList.contains('locked')),words:cards.map(c=>c.querySelector('.v123-preview-unlocks')?.textContent),within:map.getBoundingClientRect().width<=innerWidth,inspectorIntro:intro?.innerText};
  });
  assert.ok(previews.count>0,'Immediate next research preview visible');
  assert.ok(previews.locked,'Preview nodes are grey and locked');
  assert.ok(previews.words.every(Boolean),'Each grey card previews what it unlocks');
  assert.ok(previews.within,'Research tree viewport fits device width');
  await page.locator('#researchtree [data-preview="true"]').first().click();
  const inspector=await page.locator('.tech-inspector').innerText();
  assert.match(inspector,/Preview — not available yet/);
  assert.match(inspector,/Unlocks:/);
  assert.match(inspector,/Research one of these next to unlock it:/);
  assert.equal(await page.locator('.tech-study').isDisabled(),true);
  assert.equal(await page.locator('.tech-plan-queue').isDisabled(),true);
  await page.screenshot({path:'artifacts-v123/tech-preview-'+size.width+'.png',timeout:120000});
  assert.deepEqual(errors,[],'No runtime JavaScript error');
  console.log('V123 UI',JSON.stringify({size,initial,previews,inspector:inspector.slice(0,320)}));
  await page.close();
 }
 console.log('V123 UI PASS: grey one-step tech previews on phone/desktop, full unlock inspector, no research before unlock, 675x585 local map.');
}finally{await browser.close()}
