// V220: verify the new natural growth system on three independent worlds.
// No older save is loaded; every house/road/wall is created by the normal AI.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Civilization,createGame} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';
import {oldPerimeterStatusV218} from '../old-fortification-policy-v218.js';
import {suburbDemandV204} from '../outer-ring-v184.js';
import {urbanGrowthPhaseV220} from '../urban-growth-v220.js';
const seeds={a:7531027,b:8419063,c:9622017};
const id=process.argv[2]||process.env.V220_CITY_ID;
assert.ok(Object.hasOwn(seeds,id),'Expected one of a, b, c');
const seed=seeds[id],game=new Civilization(createGame(seed,'continents'));
const initial={seed,at:game.s.time,ages:[...game.s.ages],cities:game.s.cities.length,
 settlers:game.s.settlers.map(x=>({team:x.team,c:x.c,r:x.r}))};
assert.equal(initial.at,0);assert.deepEqual(initial.ages,[0,0,0,0]);assert.equal(initial.cities,0);
const bronzeAt={},captures=[];
const maxTurn=Number(process.env.V220_MAX_TURNS||260);
let turn=0;
for(turn=1;turn<=maxTurn;turn++){
 const previousAges=game.s.ages.slice();
 const before=previousAges.some((age,t)=>t>0&&age===1)?JSON.stringify(game.s):null;
 for(let i=0;i<5;i++)game.tick(12);
 for(const team of [1,2,3]){
  if(game.s.ages[team]>=1&&bronzeAt[team]==null)bronzeAt[team]=turn;
  if(!before||previousAges[team]!==1||game.s.ages[team]<2)continue;
  const snap=JSON.parse(before),city=snap.cities.filter(c=>c.team===team)
   .sort((a,b)=>b.economy.realms[team].pop-a.economy.realms[team].pop)[0];
  if(city)captures.push({team,state:snap,turn:turn-1,bronzeAt:bronzeAt[team],
   duration:turn-(bronzeAt[team]||turn),cityId:city.id,
   pop:city.economy.realms[team].pop,reachedIron:true});
 }
 if(turn%20===0)console.log('V220 ZERO-START',JSON.stringify({id,turn,ages:game.s.ages.slice(1),
   cities:game.s.cities.length,bronzeAt,captures:captures.length}));
 if(captures.some(x=>x.duration>=30))break;
}
if(!captures.length)for(const team of [1,2,3]){
 if(game.s.ages[team]!==1||turn-(bronzeAt[team]||turn)<40)continue;
 const state=JSON.parse(JSON.stringify(game.s));
 const city=state.cities.filter(c=>c.team===team)
  .sort((a,b)=>b.economy.realms[team].pop-a.economy.realms[team].pop)[0];
 if(city)captures.push({team,state,turn,bronzeAt:bronzeAt[team],
  duration:turn-bronzeAt[team],cityId:city.id,
  pop:city.economy.realms[team].pop,reachedIron:false});
}
assert.ok(captures.length,'Fresh-world AI failed to reach late Bronze Age');
captures.sort((a,b)=>Number(b.reachedIron)-Number(a.reachedIron)||b.duration-a.duration||b.pop-a.pop);
const win=captures[0],s=takeOverAI(win.state,win.team);
s.demo='v220-city-'+id;s.winner=null;
const city=s.cities.find(c=>c.id===win.cityId);
assert.ok(city?.team===0,'AI city must become the player city');
s.cities.sort((a,b)=>a.id===win.cityId?-1:b.id===win.cityId?1:0);
assert.equal(s.ages[0],1);
const probe=new Civilization(s),all=probe.allBuildings(city).filter(b=>b.hp>0&&!b.virtual);
const defense=oldPerimeterStatusV218(probe,city),growth=urbanGrowthPhaseV220(city,s.ages[0]);
const suburbs=suburbDemandV204(probe,city);
const forts=new Set(['palisade','woodgate','stonewall','gatehouse','watchtower','stonetower','reinforced_wall']);
const result={version:220,id,seed,initial,newMap:true,organicAI:true,fromZero:true,
 priorSaveLoaded:false,freeMaterialsAdded:0,age:s.ages[0],
 originalTeam:win.team,bronzeBegan:win.bronzeAt,bronzeTurns:win.duration,
 bronzeCompleted:win.reachedIron,turn:win.turn,cityId:city.id,cityName:city.name,
 population:city.economy.realms[0].pop,buildings:all.length,
 completedBuildings:all.filter(b=>b.ready).length,
 fortifications:all.filter(b=>forts.has(b.type)).length,
 oldWallMissing:defense.missing.length,oldWallWooden:defense.wooden.length,
 oldWallUpgrading:defense.constructing.length,
 outerWallSegments:all.filter(b=>b.outerRingV184&&b.ready).length,
 upgradedHouses:all.filter(b=>b.type==='house'&&b.houseUpgradeLevelV218).length,
 housingCapacity:probe.housing(city),urbanPhase:growth.phase,
 suburbBuildings:suburbs.count,connectedSuburb:suburbs.cluster.length,
 eligibleForSecondWall:suburbs.ready,
 roadEdges:Object.keys(s.worldRoads||{}).length,
 rules:'V220 unified old core, paid housing renovations, connected suburbs and old-wall-first exterior planning'};
s.v220City=result;
const original=probe.s.time;probe.tick(12);assert.ok(probe.s.time>original);
fs.mkdirSync('scenarios',{recursive:true});
fs.writeFileSync('scenarios/v220-city-'+id+'.json',JSON.stringify(s));
fs.writeFileSync('scenarios/v220-city-'+id+'.manifest.json',JSON.stringify(result,null,2)+'\n');
console.log('V220 REAL THREE-WORLD REPORT',JSON.stringify(result));
