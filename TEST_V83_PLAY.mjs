// A short real-time opening played through the rendered controls and canvas.
// Debug access is read-only: locate legal places and inspect the result.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const dir='artifacts-v83';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await ctx.newPage(),errors=[],report=[];
page.on('pageerror',e=>errors.push(e.message));
async function capture(label){
 const state=await page.evaluate(()=>{const d=window.gameDebug,c=d.state.cities.find(c=>c.team===0);return {time:d.state.time,view:d.view(),ownCity:c&&{name:c.name,pop:c.economy.realms[0].pop,stock:c.economy.realms[0].resources,buildings:c.economy.buildings.filter(b=>!b.virtual).map(b=>({type:b.type,ready:b.ready,status:b.status}))},research:d.state.research[0],perf:d.perfStats(),toast:document.getElementById('toast').textContent}});
 report.push({label,...state});console.log('V83 PLAY '+JSON.stringify(report.at(-1)));
 await page.screenshot({path:`${dir}/play-${label}.png`});
 console.log('V83 IMAGE '+label+' '+(await page.screenshot({type:'jpeg',quality:55})).toString('base64'));
}
async function screenSite(kind){
 return page.evaluate(kind=>{
  const d=window.gameDebug,g=d.game,a=d.state.settlers.find(a=>a.team===0),city=d.activeCity();
  const candidates=[];
  for(let y=160;y<innerHeight-180;y+=12)for(let x=25;x<innerWidth-20;x+=12){
   if(document.elementFromPoint(x,y)?.id!=='world')continue;
   const p=d.pick({clientX:x,clientY:y});if(!p)continue;
   const q={x:Math.round(p.x/2)*2,z:Math.round(p.z/2)*2};
   const blocked=kind==='settle'?g.siteRule(a,q):g.previewInArea(city,kind,q).error;
   if(blocked)continue;
   if(kind==='settle'&&!g.nav(a).route(a,q))continue;
   const home=kind==='settle'?a:city.economy.buildings[0];
   candidates.push({x,y,world:q,distance:Math.hypot(home.x-q.x,home.z-q.z)});
  }
  return candidates.sort((a,b)=>a.distance-b.distance)[0];
 },kind);
}
try{
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>!!window.gameDebug,null,{timeout:90000});
 await page.locator('#menulanguage').selectOption('et');
 await page.locator('#menu-world summary').click();await page.locator('#seed').fill('V83-playtest');await page.locator('#newgame').click();
 await page.waitForFunction(()=>window.gameDebug&&document.getElementById('startmenu').hidden,null,{timeout:90000});
 await capture('01-world');
 await page.locator('#hud-explore').click();await page.locator('#hud-explore-auto').click();await page.locator('#hud-explore-close').click();
 await page.locator('#hud-city').click();await page.waitForFunction(()=>window.gameDebug.view()==='local');
 await page.waitForTimeout(1200);
 const site=await screenSite('settle');assert.ok(site,'reachable dry founding place in exposed playfield');
 await page.locator('#commandmove').click();await page.touchscreen.tap(site.x,site.y);
 await page.waitForFunction(()=>!window.gameDebug.state.settlers.find(a=>a.team===0)?.localTarget,null,{timeout:60000});
 await page.locator('#foundcity').click();await page.waitForFunction(()=>window.gameDebug.state.cities.some(c=>c.team===0),null,{timeout:15000});
 await capture('02-founded');
 await page.locator('#techtoggle').click();await page.locator('.tech-card').filter({hasText:'Jahipidamine'}).click();await page.locator('#closeresearch').click();
 await page.locator('#hud-build').click();await page.locator('#tray > button').filter({hasText:'Metsamaja'}).click();
 const build=await screenSite('lumber');assert.ok(build,'legal lumber site in exposed playfield');await page.touchscreen.tap(build.x,build.y);
 await page.waitForFunction(()=>window.gameDebug.state.cities.find(c=>c.team===0).economy.buildings.some(b=>b.type==='lumber'),null,{timeout:15000});
 await capture('03-construction');
 await page.waitForFunction(()=>window.gameDebug.state.cities.find(c=>c.team===0).economy.buildings.some(b=>b.type==='lumber'&&b.ready),null,{timeout:150000});
 await capture('04-working');
 await page.locator('#maptoggle').click();await page.waitForFunction(()=>window.gameDebug.view()==='world');
 await page.locator('#hud-city').click();await page.waitForFunction(()=>window.gameDebug.view()==='local');
 await capture('05-return-city');
 assert.deepEqual(errors,[]);writeFileSync(`${dir}/play-results.json`,JSON.stringify(report,null,2));
 console.log('V83 PLAY PASS: real controls, auto-scout, walking settler, city founding, research, construction and map return');
}catch(e){console.log('V83 PLAY FAILURE '+e.message);await page.screenshot({path:`${dir}/play-failure.png`});console.log('V83 IMAGE failure '+(await page.screenshot({type:'jpeg',quality:55})).toString('base64'));throw e}
finally{await browser.close()}
