
import assert from 'node:assert/strict';
import {Civilization,createGame,TROOPS} from './civilization-core.js';
import {SHIPS,harborExit,seaPath,seaAllowed,embark,disembark,cargoArmy,sink,aiNavy,seaExplorePath} from './naval.js';
import {factionAlive,reconcileVictory,captureEnemySettlers} from './victory-v72.js';
import {usefulDistrictTypes} from './ai-strategy.js';
import {createBattle,mobilizeCity,tickBattle,settleDefenders} from './campaign.js';

const g=new Civilization(createGame(20261019)),s=g.s;
const found=team=>{
 const a=s.settlers.find(x=>x.team===team);
 assert.ok(a,'expected starting settler '+team);
 const e=g.land(a.id);assert.equal(e,'','land settler '+team);
 for(let x=-30;x<=30;x+=5)for(let z=-30;z<=30;z+=5){
  if(g.siteRule(a,{x,z}))continue;
  a.x=x;a.z=z;const r=g.found(a.id);
  if(r.city)return r.city;
 }
 throw Error('unable to found city for '+team);
};
const home=found(0),enemy=found(1);
assert.equal(s.winner,null);
s.ages[0]=5;s.research[0].known.push('shipbuilding','navigation','ocean_sailing');
s.ages[1]=1;s.research[1].known.push('shipbuilding');
assert.ok(usefulDistrictTypes(g,1).has('harbor'),'AI prioritizes harbor when ocean exploration is unlocked');
const start=g.cell(home),water=harborExit(g,{...start,team:0});
assert.ok(water&&!water.land,'actual passable water beside starting coastline');
s.ships??=[];s.ships.push({id:100,kind:'transport',team:0,...water,hp:180,path:[],clock:0,cargo:null});
const ship=s.ships.at(-1),main=s.armies.find(a=>a.team===0&&(a.id||0)===0);
const troop={id:101,team:0,c:home.c,r:home.r,path:[],embarked:null};
const spare={id:102,team:0,c:home.c,r:home.r,path:[],embarked:null};
s.armies.push(troop,spare);
for(let i=0;i<3;i++)s.units.push({kind:'spearman',team:0,hp:125,armyId:101});
for(let i=0;i<9;i++)s.units.push({kind:'archer',team:0,hp:100,armyId:102});
assert.equal(embark(g,ship,'army',101),'','boarding detachment with 3 even though faction has 13 soldiers');
assert.equal(ship.cargo.armyId,101);
assert.equal(troop.embarked,100);
assert.equal(main.embarked,undefined);
assert.equal(spare.embarked,null);
assert.equal(s.units.filter(u=>u.team===0&&u.hp>0).length,13);
const restored=new Civilization(JSON.parse(JSON.stringify(s)));
const stored=restored.s.ships.find(a=>a.id===100);
assert.equal(cargoArmy(restored,stored)?.id,101,'save/load preserves actual army on ship');
assert.equal(embark(g,ship,'army',102).includes('tühja transpordilaeva'),true,'cannot double-load transport');
const route=seaExplorePath(g,ship);
assert.ok(route===null||route.every(p=>seaAllowed(g,0,p)),'scouting route only uses navigable sea');
const seaDest=g.cells.find(c=>!c.land&&Math.abs(c.c-water.c)+Math.abs(c.r-water.r)>5&&seaAllowed(g,0,c));
assert.ok(seaDest,'water destination for ocean test');
const crossing=seaPath(g,ship,seaDest);
if(crossing)assert.ok(crossing.every(p=>!g.cell(p).land),'ocean route stays in water');
let landing=null;
for(let dr=-1;dr<=1&&!landing;dr++)for(let dc=-1;dc<=1&&!landing;dc++){
 const p={c:ship.c+dc,r:ship.r+dr};
 if(g.canTraverse(0,p))landing=p;
}
assert.ok(landing,'reachable disembark tile');
assert.equal(disembark(g,ship,landing),'');
assert.deepEqual([troop.c,troop.r],[landing.c,landing.r]);
assert.equal(troop.embarked,null);
assert.equal(spare.embarked,null);
console.log('V72 TRANSPORT PASS',JSON.stringify({loadedArmy:101,loadedUnits:3,otherUnits:9,water,landing}));
troop.c=home.c;troop.r=home.r;
assert.equal(embark(g,ship,'army',101),'');
sink(g,ship);
assert.ok(s.units.filter(u=>u.team===0&&u.armyId===101).every(u=>u.hp===0),'sinking kills ONLY loaded army');
assert.ok(s.units.filter(u=>u.team===0&&u.armyId===102).every(u=>u.hp>0),'independent army survives sinking');
assert.equal(spare.embarked,null);
const heavy=s.ships.push({id:105,kind:'transport',team:0,...water,hp:180,path:[],clock:0,cargo:null});
spare.c=home.c;spare.r=home.r;
assert.match(embark(g,s.ships.at(-1),'army',102),/kuni 6/,'a 9-unit detachment cannot embark');
console.log('V72 SINK CAPACITY PASS');

// A fully trained existing AI port must generate a *real* production order
// rather than being handed a free navy.
const er=enemy.economy.realms[1];for(const k of Object.keys(er.resources))er.resources[k]=1000;
enemy.economy.buildings.push({type:'harbor',team:1,ready:true,hp:350,x:15,z:18});
assert.ok(harborExit(g,{...enemy,team:1}),'opponent city has viable harbor access');
aiNavy(g,1);
assert.ok(enemy.training?.some(x=>x.kind==='transport'),'AI queues an actual transport ship');
const job=enemy.training.find(x=>x.ship);job.progress=job.total;
g.tickTraining(enemy,0);
assert.ok(s.ships.some(x=>x.team===1&&x.kind==='transport'&&x.hp>0),'AI completes a transport at its port');
console.log('V72 AI HARBOR PASS');

// The first captured city does not end the game if two opponents still have
// surviving settlers. Resolve battle damage using the actual combat code.
const fightArmy=s.armies.find(a=>a.team===0&&a.id===102);
fightArmy.c=enemy.c;fightArmy.r=enemy.r;fightArmy.path=[]; 
for(const u of s.units.filter(u=>u.team===0&&u.armyId===102))u.kind='rifleman';
const b=createBattle(g.cell(enemy),s.units);
b.squads=b.squads.filter(q=>q.team===0&&s.units[q.source]?.armyId===102);
b.attackerTeam=0;
const hall=enemy.economy.buildings.find(x=>x.type==='hall');
b.fortress={team:1,cityId:enemy.id,x:hall.x,z:hall.z,hp:enemy.hp,maxHp:600,cool:0};
mobilizeCity(b,enemy);
for(const q of b.squads)if(q.team===0)q.advance=true;
for(let j=0;j<1100&&!b.result;j++)tickBattle(b,.4,TROOPS,[1,0,0,0]);
assert.equal(b.result,'victory','attacking units genuinely destroy defending fortress');
assert.equal(b.fortress.hp,0);
settleDefenders(b,enemy);enemy.hp=b.fortress.hp;
g.transferCity(enemy,0);enemy.hp=300;
assert.equal(s.winner,null,'capture does not win while opponents 2 and 3 remain');
assert.equal(factionAlive(s,1),false,'former owner eliminated after last city is taken');
console.log('V72 BATTLE CONQUEST PASS',JSON.stringify({elapsed:Math.round(b.elapsed),attackerSurvivors:b.squads.filter(q=>q.team===0&&q.hp>0).length,city:enemy.id,opponentsLeft:[2,3]}));

// An enemy unarmed settler is intercepted via normal tile occupation.
for(const team of [2,3]){
 const target=s.settlers.find(a=>a.team===team);
 assert.ok(target);
 fightArmy.c=target.c;fightArmy.r=target.r;
 assert.equal(captureEnemySettlers(g),1,'army captures hostile settler');
}
assert.equal(s.winner,0,'last remaining faction actually wins');
assert.equal(reconcileVictory(s).winner,0);
assert.ok(s.units.filter(u=>u.team!==0).every(u=>u.hp===0),'defeated faction troops no longer survive');
assert.ok(s.ships.filter(sh=>sh.team!==0).every(sh=>sh.hp===0),'defeated faction boats are removed');
console.log('V72 VICTORY PASS',JSON.stringify({winner:s.winner,owned:s.cities.filter(c=>c.team===0).length,remainingEnemySettlers:s.settlers.filter(a=>a.team!==0).length,battleDuration:Math.round(b.elapsed)}));
