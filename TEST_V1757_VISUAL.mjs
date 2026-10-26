// V175.7: real Chromium visual evidence, not a geometry-only assertion.
// Artifacts can be downloaded and inspected by ChatGPT directly.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const output='artifacts-v1757-visual';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,
 executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
 '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base='http://127.0.0.1:8765/',report={gallery:[],game:[]};
try{
 for(const [angle,viewport] of [
  ['front',{width:1000,height:760}],['side',{width:1000,height:760}],
  ['rear',{width:1000,height:760}],['top',{width:1000,height:760}],
  ['front',{width:390,height:844}],['side',{width:390,height:844}]
 ]){
  const label=viewport.width<500?'mobile':'desktop';
  const ctx=await browser.newContext({viewport,deviceScaleFactor:label==='mobile'?2:1});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'TEST_V1757_TOWER_GALLERY.html?angle='+angle,
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.towerVisualReady,{timeout:90000});
  await page.waitForTimeout(160);
  const info=await page.evaluate(()=>window.towerVisualInfo);
  assert.ok(info.triangles>=800&&info.drawCalls>=1,'real 3D geometry: '+JSON.stringify(info));
  assert.deepEqual(errors,[],'tower visual rendering errors: '+JSON.stringify(errors));
  const file=output+'/tower-'+label+'-'+angle+'.png';
  await page.screenshot({path:file});
  assert.ok(fs.statSync(file).size>12000,'screenshot should contain actual WebGL picture');
  report.gallery.push({file,...info,size:fs.statSync(file).size});
  console.log('V175.7 TOWER VISUAL PASS '+label+' '+angle+' '+info.triangles+' triangles');
  await ctx.close();
 }
 for(const [label,viewport,mobile] of [
  ['desktop',{width:1280,height:800},false],
  ['mobile',{width:390,height:844},true]
 ]){
  const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,
    deviceScaleFactor:mobile?2:1});
  await ctx.addInitScript(()=>localStorage.setItem('kingdoms-quality','low'));
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'?demo=ai-stone-v174&v=1757-screens',
    {waitUntil:'domcontentloaded',timeout:120000});
   await page.waitForFunction(()=>window.gameDebug&&document.getElementById('startmenu')?.hidden,
    {timeout:120000});
   // AI takeover examples intentionally start paused. Resume with the real
   // game button so peace guards receive nonzero frameDelta and can patrol.
   await page.evaluate(()=>{
    const pause=document.getElementById('pause');
    if(pause?.textContent.includes('▶'))pause.click();
   });
   await page.waitForFunction(()=>window.gameDebug.towerPatrolStatus?.().some(p=>
     p.phase==='descending'||p.phase==='outbound'||p.phase==='return'),null,{timeout:30000});
   await page.waitForTimeout(600);
   const info=await page.evaluate(()=>{
    const dbg=window.gameDebug,city=dbg.activeCity();
    return {title:document.title,city:city?.name||null,
     towers:city?.economy?.buildings?.filter(b=>b.type==='watchtower'&&b.ready&&b.hp>0).length||0,
     patrols:dbg.towerPatrolStatus?.()||[],
     openMenu:!document.getElementById('startmenu')?.hidden};
   });
   assert.ok(info.towers>=1,'stone-age test city should contain a ready wooden watchtower: '+JSON.stringify(info));
   assert.ok(info.patrols.length>=5,'real peaceful guard squads should be present');
   assert.ok(info.patrols.some(p=>p.phase!=='roof'),
    'actual guards should have started patrol schedule after pressing Play: '+JSON.stringify(info));
   assert.deepEqual(errors,[],'game Javascript errors');
   const file=output+'/actual-city-'+label+'.png';
   await page.screenshot({path:file});
   report.game.push({file,...info,size:fs.statSync(file).size});
   console.log('V175.7 CITY VISUAL PASS '+label+' '+JSON.stringify({city:info.city,towers:info.towers,
    guards:info.patrols.length,phases:info.patrols.map(p=>p.phase)}));
  }finally{await ctx.close();}
 }
}finally{
 fs.writeFileSync(output+'/report.json',JSON.stringify(report,null,2));
 await browser.close();
}
console.log('V175.7 VISUAL EVIDENCE READY '+JSON.stringify({
 images:report.gallery.length+report.game.length,
 desktop:report.gallery.filter(x=>!x.mobile).length,
 mobile:report.gallery.filter(x=>x.mobile).length
}));
