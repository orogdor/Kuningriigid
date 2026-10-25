// V163 Stone Age city planning report from a real, unfunded AI playthrough.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Civilization,createGame} from '../civilization-core.js';
const seed=142023,game=new Civilization(createGame(seed)),snapshots=[];
function inspect(turn){
 const towns=game.s.cities.filter(c=>c.team>0).map(city=>{
  const town=game.allBuildings(city).filter(b=>b.hp>0&&!b.virtual);
  const core=city.economy.buildings.filter(b=>b.hp>0&&!b.virtual);
  const hall=core.find(b=>b.type==='hall')||{x:0,z:0};
  const homes=core.filter(b=>b.type==='house');
  const distance=b=>Math.hypot(b.x-hall.x,b.z-hall.z);
  const avgHome=homes.length?Math.round(homes.reduce((n,b)=>n+distance(b),0)/homes.length):null;
  const farm=core.filter(b=>b.type==='farm');
  const avgFarm=farm.length?Math.round(farm.reduce((n,b)=>n+distance(b),0)/farm.length):null;
  return {team:city.team,name:city.name,age:game.s.ages[city.team],
    population:Math.round(city.economy.realms[city.team].pop||0),
    houses:town.filter(b=>b.type==='house').length,coreHouses:homes.length,
    averageCoreHouseRadius:avgHome,coreFarms:farm.length,averageCoreFarmRadius:avgFarm,
    farms:town.filter(b=>b.type==='farm').length,fields:town.filter(b=>b.type==='field').length,
    readyBuildings:town.filter(b=>b.ready).length};
 }).sort((a,b)=>b.population-a.population);
 return {turn,towns,stoneAgeTowns:towns.filter(t=>t.age===0).length};
}
for(let turn=1;turn<=48;turn++){
 for(let step=0;step<5;step++)game.tick(12);
 if([20,30,40,48].includes(turn)){const snap=inspect(turn);snapshots.push(snap);console.log('V163 STONE TOWN',JSON.stringify(snap));}
}
const final=snapshots.at(-1);
assert.ok(final.towns.length>=1,'real AI civilizations establish cities');
assert.ok(final.towns.some(c=>c.houses>0),'real economy pays for housing');
const result={seed,description:'Real AI; no free buildings, resources or population',snapshots};
fs.mkdirSync('artifacts-v163',{recursive:true});
fs.writeFileSync('artifacts-v163/stone-town-report.json',JSON.stringify(result,null,2));
fs.writeFileSync('artifacts-v163/stone-town-report.md',[
 '# V163 – kiviaja AI linnade planeering',
 '',
 'Päris 48 käigu simulatsioon; AI-le ei antud lisamaterjale ega tasuta ehitisi.',
 '',
 '| Käik | Linn | Ajastu | Elanikud | Majad | Südamiku majad | Keskmine elamu kaugus (m) | Põllutalud | Põllud |',
 '|---:|---|---:|---:|---:|---:|---:|---:|---:|',
 ...snapshots.flatMap(s=>s.towns.map(t=>`| ${s.turn} | ${t.name} | ${t.age} | ${t.population} | ${t.houses} | ${t.coreHouses} | ${t.averageCoreHouseRadius??'-'} | ${t.farms} | ${t.fields} |`))
].join('\n')+'\n');
console.log('V163 STONE CITY SIMULATION PASS',JSON.stringify({seed,final}));
