import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const out='artifacts-v133';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];let debugPage=null,debugLabel='boot';
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});
  await context.addInitScript(()=>{localStorage.setItem('kingdoms-quality','low');localStorage.setItem('kingdoms-civ4','traffic-player-save');localStorage.setItem('kingdoms-civ4-backup','traffic-player-backup');});
  const page=await context.newPage(),errors=[];debugPage=page;debugLabel=mobile?'mobile':'desktop';page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/?demo=army-traffic&v=134',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden,{timeout:120000});
  const before=await page.evaluate(()=>{const d=gameDebug,s=d.state,key=Object.keys(s.deployments)[0],source=s.trafficTest.sources[0],unit=s.deployments[key][source];d.localClick({x:unit.x,z:unit.z});return {demo:s.demo,key,source,count:s.trafficTest.sources.length,view:d.view(),selected:d.currentSelection()?.kind,time:s.time,origins:s.trafficTest.sources.map(i=>({x:s.deployments[key][i].x,z:s.deployments[key][i].z}))};});
  assert.equal(before.demo,'army-traffic');assert.equal(before.count,4);assert.equal(before.view,'local');assert.equal(before.selected,'unit');
  await page.locator('#commandmove').click();await page.evaluate(()=>gameDebug.localClick(gameDebug.state.trafficTest.goal));
  assert.equal(await page.evaluate(()=>gameDebug.commandMode()),'select');
  await page.screenshot({path:`${out}/city-gate-before-${mobile?'mobile':'desktop'}.png`});
  await page.locator('#pause').click();await page.waitForFunction(t=>gameDebug.state.time>t+.3,before.time);await page.locator('#pause').click();
  const start=Date.now();
  const result=await page.evaluate(async(origins)=>{
   const {tickDeployments}=await import('./campaign.js'),{TROOPS}=await import('./civilization-core.js'),d=gameDebug,s=d.state,key=Object.keys(s.deployments)[0],tile=s.deployments[key],nav=d.game.nav(d.activeCity());
   const sources=s.trafficTest.sources,crossed=new Set();let approachAt8Seconds=null,steps=0,minClearance=Infinity,terrainSafe=true;
   for(;steps<2400&&sources.some(i=>tile[i].target);steps++){
    const old=sources.map(i=>({x:tile[i].x,z:tile[i].z}));tickDeployments(s,s.units,TROOPS,.05,p=>d.game.nav(p));
    for(let i=0;i<sources.length;i++){const p=tile[sources[i]];if(old[i].x<0&&p.x>=0&&Math.abs(p.z)<2)crossed.add(sources[i]);terrainSafe&&=nav.open(p.x,p.z);for(let j=0;j<i;j++)minClearance=Math.min(minClearance,Math.hypot(p.x-tile[sources[j]].x,p.z-tile[sources[j]].z)-7);}
    if(steps===159)approachAt8Seconds=sources.map((source,i)=>({x:tile[source].x,z:tile[source].z,progress:Math.hypot(tile[source].x-origins[i].x,tile[source].z-origins[i].z)}));
   }
   d.renderUI();return {approachAt8Seconds,steps,simulationSeconds:steps*.05,minClearance,terrainSafe,crossed:[...crossed],positions:sources.map(i=>({x:tile[i].x,z:tile[i].z,pending:!!tile[i].target})),main:localStorage.getItem('kingdoms-civ4'),backup:localStorage.getItem('kingdoms-civ4-backup')};
  },before.origins);
  assert.ok(result.approachAt8Seconds.every(p=>p.progress>10&&p.x<0),'every formation advances before the first reaches the gate');
  assert.ok(result.positions.every(p=>!p.pending&&p.x>8),JSON.stringify(result));assert.equal(result.crossed.length,4,'each formation really crosses the gate, not the outside wall');assert.ok(result.terrainSafe);assert.ok(result.minClearance>=-.001);assert.equal(result.main,'traffic-player-save');assert.equal(result.backup,'traffic-player-backup');
  await page.waitForTimeout(250);await page.screenshot({path:`${out}/city-gate-after-${mobile?'mobile':'desktop'}.png`});assert.deepEqual(errors,[]);
  results.push({mobile,wallSeconds:(Date.now()-start)/1000,...result,errors});await context.close();
 }
 fs.writeFileSync(out+'/city-gate-results.json',JSON.stringify(results,null,2));console.log('V134 BROWSER PASS',JSON.stringify(results));
}catch(error){if(debugPage&&!debugPage.isClosed())await debugPage.screenshot({path:`${out}/failure-${debugLabel}.png`}).catch(()=>{});fs.writeFileSync(out+'/failure.json',JSON.stringify({message:error.message,stack:error.stack},null,2));throw error;}finally{await browser.close();}
