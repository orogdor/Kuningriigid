import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('artifacts-v111',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{for(const [name,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:412,height:915}]]){
const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8765/?demo=iron-siege&v=111');await page.waitForFunction(()=>window.gameDebug,null,{timeout:120000});
assert.match(await page.title(),/V117/);
const before=await page.evaluate(()=>{const d=gameDebug,b=d.state.battle,models=[];d.localScene.traverse(o=>{if(o.userData.bronzeFortification)models.push(o)});return {sections:b.siegeSections.length,models:models.length,guards:b.squads.filter(u=>u.guardPost).reduce((n,u)=>n+u.men.length,0),maxY:Math.max(...models.map(o=>o.position.y)),perf:d.perfStats()};});
assert.equal(before.sections,46);assert.equal(before.guards,162);assert.equal(before.models,46);
await page.screenshot({path:`artifacts-v111/${name}-city.png`,timeout:120000});
const simulation=await page.evaluate(async()=>{const d=gameDebug,b=d.state.battle,{tickIndividualBattle}=await import('./individual-battle-v91.js?v=117a'),{TROOPS}=await import('./civilization-core.js?v=117a'),u=b.squads.find(u=>u.guardPost),start={x:u.x,z:u.z};for(let i=0;i<100;i++)tickIndividualBattle(b,.1,TROOPS,0,d.game.battleNavigation(b));return {walked:Math.hypot(u.x-start.x,u.z-start.z),finite:b.squads.every(u=>(u.men||[]).every(m=>[m.x,m.z,m.hp].every(Number.isFinite)))};});
assert.ok(simulation.walked>0);assert.ok(simulation.finite);
await page.screenshot({path:`artifacts-v111/${name}-wall-walk.png`,timeout:120000});
assert.deepEqual(errors,[]);console.log(JSON.stringify({name,before,simulation,errors}));await page.close();}
}finally{await browser.close();}
