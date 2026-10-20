import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true,deviceScaleFactor:1});
const page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',dialog=>dialog.accept());
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>!!window.gameDebug,{timeout:90000});
 const baseline=await page.evaluate(()=>{
  const s=window.gameDebug.state;s.time=90;
  window.gameDebug.save();
  return {seed:s.seed,raw:localStorage.getItem('kingdoms-civ4')};
 });
 assert.equal(JSON.parse(baseline.raw).time,90,'mobile initial V72-compatible save');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#v51export').click()]);
 assert.match(download.suggestedFilename(),/V73_kaik_2\.json$/,'versioned export visible on mobile');
 await page.locator('#continue').click();
 await page.waitForFunction(()=>document.body.classList.contains('atlas'));
 const initial=await page.evaluate(()=>window.gameDebug.getZoom());
 await page.locator('#hud-zoom-in').click();
 assert.ok(await page.evaluate(()=>window.gameDebug.getZoom())<initial,'mobile zoom');
 await page.locator('#menubtn').click();
 await page.evaluate(()=>{window.gameDebug.state.time=240;window.gameDebug.save()});
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('kingdoms-civ4')).time);
 assert.equal(before,240);
 const reloaded=page.waitForEvent('load',{timeout:90000});
 await page.locator('#v51importfile').setInputFiles({name:'V72_legacy_save.json',mimeType:'application/json',buffer:Buffer.from(baseline.raw)});
 await reloaded;
 await page.waitForFunction(()=>!!window.gameDebug,{timeout:90000});
 const restored=await page.evaluate(()=>({
  current:window.gameDebug.state.time,
  backup:JSON.parse(localStorage.getItem('kingdoms-civ4-backup')).time,
  seed:window.gameDebug.state.seed
 }));
 assert.equal(restored.current,90,'imported V72 progress replaces current');
 assert.equal(restored.backup,240,'V73 preserved previous V72 progress as backup');
 assert.equal(restored.seed,baseline.seed,'seed and map continue without a new world');
 for(const [width,height,label] of [[390,844,'phone portrait'],[844,390,'phone landscape'],[1440,900,'desktop']]){
  await page.setViewportSize({width,height});
  await page.waitForTimeout(200);
  const info=await page.evaluate(()=>{
   const el=document.getElementById('startmenu'),box=el.querySelector('.menu-card');
   return {menuVisible:!el.hidden,canScroll:el.scrollHeight>=el.clientHeight,buttonExists:!!document.getElementById('v51import'),gameVersion:window.gameDebug.state.version,bodyWidth:document.body.scrollWidth,viewport:innerWidth,boxWidth:box.getBoundingClientRect().width};
  });
  assert.ok(info.menuVisible,'save and load controls available at '+label);
  assert.ok(info.buttonExists,'import control available at '+label);
  assert.equal(info.gameVersion,4,'unchanged save schema '+label);
  assert.ok(info.boxWidth<=info.viewport+2,'menu fits viewport '+label);
  console.log('V73 UI PASS',label,JSON.stringify(info));
 }
 assert.deepEqual(errors,[],'no JS errors during phone-to-desktop save workflow');
 console.log('V73 TRANSFER PASS: touch zoom, export, V72 import, previous-save recovery, phone and desktop');
}finally{await browser.close()}
