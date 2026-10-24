import fs from 'node:fs';
import {Civilization,createGame} from '../civilization-core.js';
import {MIN_BRONZE_TURNS_V160} from '../bronze-city-balance-v160.js';
// Actual AI playthrough with no injected resources, units, discoveries or buildings.
const game=new Civilization(createGame(142023)),bronzeAt={},ironAt={},snapshots=[],maxTurns=260,started=Date.now();
const metrics=(turn)=>{
 const cities=game.s.cities.filter(c=>c.team>0).map(city=>{
  const team=city.team,stock=city.economy.realms[team].resources,pop=city.economy.realms[team].pop;
  const buildings=game.allBuildings(city).filter(b=>b.hp>0&&!b.virtual);
  const kind=k=>buildings.filter(b=>b.type===k&&b.ready).length;
  const plan=city.defensePlanV139;
  return {name:city.name,team,pop,age:game.s.ages[team],houses:kind('house'),markets:kind('market'),
   stonewall:kind('stonewall'),gatehouse:kind('gatehouse'),stonetower:kind('stonetower'),
   defenses:buildings.filter(b=>['stonewall','gatehouse','stonetower','palisade','watchtower'].includes(b.type)).length,
   planSlots:plan?.slots?.length||0,ready:buildings.filter(b=>b.ready).length,
   water:Math.round(stock.water||0),stone:Math.round(stock.stone||0),wood:Math.round(stock.wood||0),
   plank:Math.round(stock.plank||0),cutstone:Math.round(stock.cutstone||0),
   food:Math.round((stock.grain||0)+(stock.meat||0)+(stock.fish||0)+(stock.bread||0)+(stock.berries||0)),
   growthMultiplier:Math.round((city.economy.realms[team].growthNeed||0)*10)/10,
   masonReady:buildings.some(b=>b.type==='mason'&&b.ready),builders:city.builderCount||0,
   waiting:buildings.filter(b=>!b.ready).length,
   wallReason:city.aiDefenseDiagnosticV146?.reason||'not-assessed'};
 }).sort((a,b)=>b.pop-a.pop);
 return {turn,ages:game.s.ages.slice(1),cities:cities.length,population:cities.reduce((s,c)=>s+c.pop,0),
  largest:cities[0]||null,markets:cities.filter(c=>c.markets>0).length,
  fortified:cities.filter(c=>c.stonewall>0).length,
  completedRings:cities.filter(c=>c.pop>=25&&c.planSlots>0&&c.stonewall+c.gatehouse+c.stonetower>=c.planSlots).length,
  citiesDetail:cities};
};
for(let turn=1;turn<=maxTurns;turn++){
 for(let step=0;step<5;step++)game.tick(12);
 for(const team of [1,2,3]){
  if(bronzeAt[team]==null&&game.s.ages[team]>=1)bronzeAt[team]=turn;
  if(ironAt[team]==null&&game.s.ages[team]>=2){
   ironAt[team]=turn;
   if(bronzeAt[team]!=null&&turn-bronzeAt[team]<MIN_BRONZE_TURNS_V160-1)throw Error('Bronze age was skipped '+JSON.stringify({team,bronzeAt,ironAt}));
  }
 }
 if(turn%20===0||Object.values(bronzeAt).includes(turn)||Object.values(ironAt).includes(turn)){
  const s=metrics(turn);snapshots.push(s);
  console.log('V160 BRONZE',JSON.stringify({turn,ages:s.ages,population:s.population,cities:s.cities,largest:s.largest&&{name:s.largest.name,pop:s.largest.pop,walls:s.largest.stonewall,gates:s.largest.gatehouse,cutstone:s.largest.cutstone,plank:s.largest.plank,food:s.largest.food,reason:s.largest.wallReason,waiting:s.largest.waiting},marketCities:s.markets}));
 }
 if(Object.keys(ironAt).length>=1&&turn>=Math.min(...Object.values(ironAt))+5)break;
}
const final=snapshots.at(-1),largestBronze=snapshots.filter(s=>s.ages.includes(1)).reduce((best,s)=>!best||s.largest?.pop>best.largest?.pop?s:best,null);
const result={seed:142023,bronzeAt,ironAt,elapsedSeconds:Math.round((Date.now()-started)/1000),
 maxTurns,final,largestBronze:largestBronze?.largest||null,snapshots};
fs.mkdirSync('artifacts-v160',{recursive:true});
fs.writeFileSync('artifacts-v160/bronze-report.json',JSON.stringify(result,null,2));
const lines=[
 '# V160: Bronze Age town and fortification AI trial',
 'Real AI simulation, original economy, no injected materials.',
 '',
 'Bronze entry by team: '+JSON.stringify(bronzeAt),
 'Iron entry by team: '+JSON.stringify(ironAt),
 'Elapsed: '+result.elapsedSeconds+' seconds',
 'Largest Bronze city: '+JSON.stringify(result.largestBronze),
 '',
 '| Turn | Ages 1/2/3 | Towns | Population | Largest | Markets | Fortified towns |',
 '|---|---|---:|---:|---|---:|---:|',
 ...snapshots.map(s=>'| '+s.turn+' | '+s.ages.join('/')+' | '+s.cities+' | '+s.population+' | '+(s.largest?.name||'-')+': '+(s.largest?.pop||0)+' | '+s.markets+' | '+s.fortified+' |')
];
fs.writeFileSync('artifacts-v160/bronze-report.md',lines.join('\n')+'\n');
if(!Object.keys(bronzeAt).length)throw Error('Bronze Age not reached in '+maxTurns+' turns');
console.log('V160 RESULT',JSON.stringify({bronzeAt,ironAt,final:final&&{turn:final.turn,population:final.population,cities:final.cities,largest:final.largest},largestBronze:result.largestBronze,elapsedSeconds:result.elapsedSeconds}));
