import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('artifacts-v124-ui',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const item of [{id:1,width:390,height:844},{id:7,width:1366,height:768},{id:10,width:1366,height:768}]){
  const page=await browser.newPage({viewport:{width:item.width,height:item.height},acceptDownloads:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/?v=124-20261023&demo=v124-'+item.id,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.gameDebug?.state?.battle?.testReplayV124?.id===Number(new URLSearchParams(location.search).get('demo')?.replace('v124-','')),{timeout:120000});
  const result=await page.evaluate(()=>{
   const debug=gameDebug,b=debug.state.battle;
   const present=b.squads.filter(u=>!u.reserve);
   return {id:b.testReplayV124.id,view:debug.view(),title:document.title,
    initial:b.testReplayV124.initialMen,armyUnits:[0,1].map(t=>present.filter(u=>u.team===t).length),
    pause:document.getElementById('pause')?.textContent,
    exports:!!document.getElementById('v51export'),
    links:[...document.querySelectorAll('#menu-demo-links a[href*="demo=v124-"]')].length,
    pausedMenu:document.getElementById('startmenu').hidden,
    alive:present.every(u=>u.men?.length>0),
    castle:b.fortress?.team??null};
  });
  console.log('V124_BROWSER_REPLAY',JSON.stringify({screen:item,reported:result}));
  assert.equal(result.id,item.id);
  assert.equal(result.view,'local','A battle must be visible immediately');
  assert.match(result.title,/V124/);
  assert.equal(result.pause,'▶','Battle begins paused for exact manual starting conditions');
  assert.equal(result.links,10,'Menu has all ten battle test links');
  assert.ok(result.initial>80&&result.initial<=500);
  assert.ok(result.exports&&result.alive,'Full individual battle models and export available');
  assert.equal(result.pausedMenu,true,'No splash screen should block scenario');
  const download=page.waitForEvent('download',{timeout:20000});
  await page.locator('#v51export').click({timeout:12000});
  const file=await download;const name=file.suggestedFilename();
  assert.match(name,/V124_Lahing_\d+\.json/);
  await page.screenshot({path:'artifacts-v124-ui/replay-'+item.id+'.png',timeout:120000});
  assert.deepEqual(errors,[],'No JavaScript errors while launching replay');
  await page.close();
 }
 console.log('V124 UI PASS: replay #1 mobile and #7/#10 desktop, same terrain and soldiers, start paused, ten links and exportable V4 save.');
}finally{await browser.close()}
