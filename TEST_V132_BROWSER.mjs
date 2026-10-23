import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const out='artifacts-v128';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('kingdoms-quality','low'));
 await page.goto('http://127.0.0.1:8765/?demo=bronze-battle&v=132',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden,{timeout:120000});
 await page.evaluate(()=>{
  const b=gameDebug.state.battle,nav=gameDebug.game.battleNavigation(),own=b.squads.filter(u=>u.team===0&&u.kind==='bronze_spearman'),enemy=b.squads.find(u=>u.team===1&&u.kind==='bronze_spearman');b.squads=[own[0],own[1],enemy];
  const patch=(x,z)=>[-4,-2,0,2,4].every(dx=>[-4,-2,0,2,4].every(dz=>nav.open(x+dx,z+dz))),coords=[0,...Array.from({length:10},(_,i)=>[(i+1)*12,-(i+1)*12]).flat()];let site;
  for(const z of coords)for(const x of coords)if(!site&&patch(x-24,z)&&patch(x+24,z)&&nav.reachable({x:x-24,z},{x:x+24,z}))site={x,z};
  if(!site)throw Error('No passable paired deployment positions found');window.passingSite=site;gameDebug.detailFocus.set(site.x,0,site.z);
  for(const [i,u] of b.squads.entries()){
   const x=i===0?site.x-24:i===1?site.x+24:130,z=i===2?100:site.z;
   for(const [j,m] of u.men.entries()){m.x=x+(j%4-1.5)*1.05;m.z=z+(Math.floor(j/4)-2.5)*1.05;if(i<2&&!nav.open(m.x,m.z))throw Error('Soldier spawned on blocked terrain');}
   u.x=x;u.z=z;u.anchor={x,z};u.combatMode='manual';u.manualOrder=true;u.target={x:i===0?site.x+24:i===1?site.x-24:130,z};u.formation='line';u.formationManual=true;
  }
 });
 await page.waitForTimeout(200);await page.screenshot({path:out+'/passing-before.png'});
 const result=await page.evaluate(async()=>{
  const {tickBattle}=await import('./campaign.js?v=117a'),{TROOPS}=await import('./civilization-core.js'),b=gameDebug.state.battle,nav=gameDebug.game.battleNavigation();
  const before=b.squads.map(u=>u.hp);let nearest=Infinity;
  for(let i=0;i<2000;i++){
   tickBattle(b,.1,TROOPS,0,nav);
   const [a,c]=b.squads;for(const m of a.men)for(const n of c.men)nearest=Math.min(nearest,Math.hypot(m.x-n.x,m.z-n.z));
  }
  gameDebug.renderUI();return {site:window.passingSite,positions:b.squads.map(u=>({x:u.x,z:u.z})),before,after:b.squads.map(u=>u.hp),nearest};
 });
 assert.ok(result.positions[0].x>result.site.x+18&&result.positions[1].x<result.site.x-18,JSON.stringify(result));assert.deepEqual(result.after,result.before);assert.ok(result.nearest>.65,'individuals do not walk through each other');
 await page.waitForTimeout(300);await page.screenshot({path:out+'/passing-after.png'});assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/passing-results.json',JSON.stringify({...result,errors},null,2));console.log('V132 BROWSER PASS',JSON.stringify(result));
}finally{await browser.close();}
