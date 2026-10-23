import fs from 'node:fs';
import {Civilization,createGame} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';
import {cityExtent} from '../city-area-v142.js';

// Reproducible full AI simulation. Never add resources, buildings or technology.
const seed=142023,game=new Civilization(createGame(seed)),started=Date.now(),history=[];
const midwayTurns=30,maxTurns=540;
let medievalAt=null,firstMedievalTeam=null,stopReason='',turn=0,lastLog=0;
function snapshot(turn){
 return {turn,ages:[...game.s.ages],cities:game.s.cities.length,
  population:game.s.cities.reduce((n,c)=>n+(c.economy.realms[c.team]?.pop||0),0),
  seconds:Math.round((Date.now()-started)/1000)};
}
for(turn=1;turn<=maxTurns;turn++){
 for(let step=0;step<5;step++)game.tick(12);
 if(medievalAt==null){
  const team=[1,2,3].find(t=>game.s.ages[t]>=3);
  if(team!=null){medievalAt=turn;firstMedievalTeam=team;}
 }
 if(turn%20===0||turn===medievalAt||medievalAt!=null&&turn===medievalAt+midwayTurns){
  const row=snapshot(turn);history.push(row);console.log('V145 PROGRESS',JSON.stringify(row));lastLog=turn;
 }
 if(medievalAt!=null&&turn>=medievalAt+midwayTurns){stopReason='30 turns after first AI entered Medieval Age';break;}
 // Complete the same 30-turn Medieval window even if another AI advances early.
 if(game.s.winner!=null){stopReason='Victory before target';break;}
 if(Date.now()-started>1350000){stopReason='22.5-minute simulation ceiling';break;}
}
if(lastLog!==turn){const row=snapshot(turn);history.push(row);console.log('V145 PROGRESS',JSON.stringify(row));}
const participants=game.s.cities.filter(c=>c.team>=1&&c.team<=3);
const medievalTeams=[1,2,3].filter(team=>game.s.ages[team]===3);
const eligible=participants.filter(c=>medievalTeams.includes(c.team));
const greatest=(eligible.length?eligible:participants).sort((a,b)=>(b.economy.realms[b.team]?.pop||0)-(a.economy.realms[a.team]?.pop||0)
 ||game.allBuildings(b).length-game.allBuildings(a).length||a.id-b.id)[0];
if(!greatest||medievalAt==null)throw Error('V145 incomplete: medieval age not reached; '+JSON.stringify({turn,medievalAt,stopReason,history}));
if(game.s.ages[greatest.team]!==3)throw Error('V145 incomplete: no medieval AI town at checkpoint');
const source=greatest.team,selectedId=greatest.id;
const allCities=game.s.cities.map(c=>{
 const team=c.team,r=c.economy.realms[team]||{},buildings=game.allBuildings(c).filter(b=>!b.virtual&&b.hp>0),
 types=Object.fromEntries([...new Set(buildings.map(b=>b.type))].sort().map(type=>[type,buildings.filter(b=>b.type===type).length]));
 const foodKeys=['fish','meat','grain','bread','vegetables','fruit','berries','milk'];
 return {id:c.id,name:c.name,team,age:game.s.ages[team],pop:r.pop||0,employed:r.employed||0,
 radius:game.radius(c),extent:cityExtent(game.radius(c)),ownedTiles:game.constructionArea(c).tiles.length,
 buildings:buildings.length,ready:buildings.filter(b=>b.ready).length,
 pending:buildings.filter(b=>!b.ready).length,markets:types.market||0,
 houses:types.house||0,farms:types.farm||0,fields:types.field||0,
 mines:(types.mine||0)+(types.quarry||0)+(types.coppermine||0)+(types.tinmine||0),
 education:(types.study||0)+(types.scriptorium||0)+(types.academy||0)+(types.university||0),
 buildingTypes:types,
 stocks:Object.fromEntries(Object.entries(r.resources||{}).filter(([k,v])=>Number(v)>0).sort((a,b)=>b[1]-a[1]).slice(0,24)),
 foodSupply:foodKeys.reduce((n,k)=>n+(r.resources?.[k]||0),0)
 };
}).sort((a,b)=>b.pop-a.pop||b.buildings-a.buildings||a.id-b.id);
const selected=allCities.find(c=>c.id===selectedId);
const state=takeOverAI(game.s,source);
state.demo='ai-medieval-v145';
state.medievalTestV145={seed,turn,medievalAt,firstMedievalTeam,midwayTurns,sourceTeam:source,
 targetCityId:selectedId,targetCityName:greatest.name,
 source:'Fresh game; original AI economy/research/construction without injected assets'};
state.cities.sort((a,b)=>(a.id===selectedId?-1:b.id===selectedId?1:0));
const byTeam=[0,1,2,3].map(team=>({team,age:game.s.ages[team],
  cities:allCities.filter(c=>c.team===team).length,
  population:allCities.filter(c=>c.team===team).reduce((n,c)=>n+c.pop,0),
  technologies:game.s.research[team]?.known?.length||0,
  researchActive:game.s.research[team]?.active||null,
  resourcesAvailable:game.s.cities.filter(c=>c.team===team).reduce((n,c)=>n+Object.values(c.economy.realms[team].resources||{}).reduce((a,v)=>a+(+v||0),0),0)}));

const totals=allCities.reduce((a,c)=>{for(const key of ['pop','buildings','ready','pending','houses','markets','education','fields','farms','mines'])a[key]=(a[key]||0)+(c[key]||0);return a;},{});
totals.withMarket=allCities.filter(c=>c.markets>0).length;
totals.withEducation=allCities.filter(c=>c.education>0).length;
totals.withHousing=allCities.filter(c=>c.houses>0).length;
totals.withDefenses=allCities.filter(c=>['palisade','stonewall','watchtower','stonetower','gatehouse','reinforced_wall'].some(k=>(c.buildingTypes[k]||0)>0)).length;
totals.fortifications=allCities.reduce((n,c)=>n+['palisade','stonewall','watchtower','stonetower','gatehouse','reinforced_wall'].reduce((a,k)=>a+(c.buildingTypes[k]||0),0),0);
let baseline=null;
if(fs.existsSync('scenarios/ai-medieval-v144.manifest.json')){
 const prev=JSON.parse(fs.readFileSync('scenarios/ai-medieval-v144.manifest.json'));
 const previous=prev.cities||[];
 const get=k=>previous.reduce((n,c)=>n+(c[k]||0),0);
 baseline={version:144,turn:prev.turn,totalCities:prev.totalCities,
  population:get('pop'),buildings:get('buildings'),houses:get('houses'),markets:get('markets'),
  education:get('education'),farms:get('farms'),mines:get('mines'),
  withMarket:previous.filter(c=>c.markets>0).length,
  withEducation:previous.filter(c=>c.education>0).length,
  withDefenses:previous.filter(c=>['palisade','stonewall','watchtower','stonetower','gatehouse','reinforced_wall'].some(k=>(c.buildingTypes[k]||0)>0)).length,
  fortifications:previous.reduce((n,c)=>n+['palisade','stonewall','watchtower','stonetower','gatehouse','reinforced_wall'].reduce((a,k)=>a+(c.buildingTypes[k]||0),0),0)};
}
const comparison=baseline?Object.fromEntries(Object.entries({
 population:totals.pop,buildings:totals.buildings,houses:totals.houses,
 markets:totals.markets,education:totals.education,farms:totals.farms,mines:totals.mines,
 withMarket:totals.withMarket,withEducation:totals.withEducation,
 withDefenses:totals.withDefenses,fortifications:totals.fortifications,
 }).map(([k,v])=>[k,{v144:baseline[k],v145:v,delta:v-baseline[k]}])):null;

const manifest={version:145,success:true,seed,turn,medievalAt,firstMedievalTeam,midwayTurns,stopReason,
  elapsedSeconds:Math.round((Date.now()-started)/1000),
  age:game.s.ages[source],sourceTeam:source,targetCityId:selectedId,
  largestMedievalCity:selected,largestGlobalCity:allCities[0],
  totalCities:allCities.length,history,byTeam,totals,baseline,comparison,
  trade:{ongoingShipments:game.s.shipments?.length||0},
  military:{armyCounts:[0,1,2,3].map(team=>game.s.armies.filter(a=>a.team===team).length),
   unitCounts:[0,1,2,3].map(team=>game.s.units.filter(u=>u.team===team).length),
   relations:game.s.relations||{}},
  cities:allCities};
const districts=new Set(state.cities.flatMap(c=>Object.values(c.districts||{}).map(d=>d.economy)));
fs.mkdirSync('scenarios',{recursive:true});
fs.writeFileSync('scenarios/ai-medieval-v145.json',JSON.stringify(state,function(k,v){
 return districts.has(this)&&['realms','resources'].includes(k)?undefined:v;
}));
fs.writeFileSync('scenarios/ai-medieval-v145.manifest.json',JSON.stringify(manifest,null,2));
console.log('V145 RESULT',JSON.stringify({turn,medievalAt,stopReason,source,selected,byTeam,cityCount:allCities.length,
 totals,comparison,scenarioBytes:fs.statSync('scenarios/ai-medieval-v145.json').size}));
