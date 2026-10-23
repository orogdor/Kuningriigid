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
  const b=gameDebug.state.battle,own=b.squads.filter(u=>u.team===0&&u.kind==='bronze_spearman'),enemy=b.squads.find(u=>u.team===1&&u.kind==='bronze_spearman');b.squads=[own[0],own[1],enemy];
  for(const [i,u] of b.squads.entries()){
   const x=i===0?-24:i===1?24:130,z=i===2?100:0;
   for(const m of u.men){m.x+=x-u.x;m.z+=z-u.z;}
   u.x=x;u.z=z;u.anchor={x,z};u.combatMode='manual';u.manualOrder=true;u.target={x:i===0?24:i===1?-24:130,z};u.formation='line';u.formationManual=true;
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
  gameDebug.renderUI();return {positions:b.squads.map(u=>({x:u.x,z:u.z})),before,after:b.squads.map(u=>u.hp),nearest};
 });
 assert.ok(result.positions[0].x>18&&result.positions[1].x< -18,JSON.stringify(result));assert.deepEqual(result.after,result.before);assert.ok(result.nearest>.65,'individuals do not walk through each other');
 await page.waitForTimeout(300);await page.screenshot({path:out+'/passing-after.png'});assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/passing-results.json',JSON.stringify({...result,errors},null,2));console.log('V132 BROWSER PASS',JSON.stringify(result));
}finally{await browser.close();}
