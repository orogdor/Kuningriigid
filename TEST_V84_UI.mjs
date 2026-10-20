import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createGame} from './civilization-core.js';
const dir='artifacts-v84';mkdirSync(dir,{recursive:true});
const fixture=JSON.stringify(createGame(8417));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],results=[];
try{
for(const device of [{label:'desktop',width:1280,height:800},{label:'phone',width:390,height:844}]){
 const context=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:device.label==='phone',hasTouch:device.label==='phone'});
 await context.addInitScript(raw=>{localStorage.setItem('kingdoms-civ4',raw);localStorage.setItem('kingdoms-language','et');localStorage.setItem('kingdoms-quality','medium')},fixture);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(45000);
 try{
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>!!window.gameDebug,null,{timeout:90000});
 await page.locator('#continue').click();await page.locator('#pause').click();await page.keyboard.press('Escape');
 const sites=await page.evaluate(()=>{
  const d=window.gameDebug,g=d.game,mountains=g.cells.filter(c=>c.mountain&&c.h>30),fords=g.cells.filter(c=>c.ford&&c.river&&c.land);
  const site=fords.find(c=>mountains.some(m=>Math.abs(m.c-c.c)+Math.abs(m.r-c.r)<5))||fords[0];
  const mountain=[...mountains].sort((a,b)=>Math.hypot(a.c-site.c,a.r-site.r)-Math.hypot(b.c-site.c,b.r-site.r))[0];
  // A visual fixture upgrades one existing legal crossing. It is not a campaign.
  site.bridge=true;d.state.crossingRevision=(d.state.crossingRevision||0)+1;
  g.reveal(0,site,7);g.reveal(0,mountain,3);d.openWorld();d.detailFocus.set(site.x,0,site.z);d.worldSync();
  return {crossing:{c:site.c,r:site.r},mountain:{c:mountain.c,r:mountain.r}};
 });
 async function capture(label){
  await page.waitForTimeout(600);await page.screenshot({path:`${dir}/${device.label}-${label}.png`});
  const r=await page.evaluate(()=>({view:window.gameDebug.view(),perf:window.gameDebug.perfStats(),rivers:window.gameDebug.localScene.getObjectByName('V67 continuous watershed network')?.userData,
   rocks:window.gameDebug.localScene.getObjectByName('V84 stratified mountain crests')?.userData}));results.push({device:device.label,label,...r});
  console.log('V84 SCREEN '+JSON.stringify(results.at(-1)));
  console.log('V84 IMAGE '+device.label+'-'+label+' '+(await page.screenshot({type:'jpeg',quality:48})).toString('base64'));
 }
 await page.mouse.move(device.width*.5,device.height*.4);await page.mouse.wheel(0,-900);
 await capture('world-river-mountains');
 await page.evaluate(p=>{const d=window.gameDebug;d.openTile(d.game.cell(p))},sites.crossing);
 await capture('detail-bridge');
 const crossing=await page.evaluate(()=>{const d=window.gameDebug;let mesh=0;d.localScene.traverse(o=>{if(o.isMesh&&(o.parent?.userData.crossingStyle==='bridge'||o.name==='timber bridge with abutments'))mesh++});return mesh});
 assert.ok(crossing>0,'actual 3D bridge geometry is rendered');
 await page.evaluate(p=>{const d=window.gameDebug;d.openTile(d.game.cell(p))},sites.mountain);
 await capture('detail-mountain');
 assert.ok(results.at(-1).rocks?.outcropCount>0,'mountain detail includes actual ridge geometry');
 await page.locator('#maptoggle').click();await page.waitForFunction(()=>window.gameDebug.view()==='world');
 console.log('V84 BROWSER PASS '+device.label+' '+JSON.stringify(sites));
 }catch(e){console.log('V84 FAILURE '+e.message);await page.screenshot({path:`${dir}/${device.label}-failure.png`});throw e}
 await context.close();
}
assert.deepEqual(errors,[]);writeFileSync(`${dir}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close()}
