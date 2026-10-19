// V71 playthrough audit: a deterministic rule-following bot plays the real
// economy, research, movement, AI and tactical combat. No resources/units granted.
import {Civilization,createGame,TROOPS,BUILDINGS,FACTION_NAMES} from '../civilization-core.js';
import {TECHS,techBlock} from '../research.js';
import {selectAIBuild} from '../ai-strategy.js';
import {armyUnits,activeArmies} from '../v51-systems.js';
import {createBattle,mobilizeCity,settleDefenders,tickBattle,rememberBattle} from '../campaign.js';
import {fortifyBattle,persistSiegeDamage} from '../fortifications.js';
import {writeFileSync} from 'node:fs';

const seed=Number(process.env.CAMPAIGN_SEED||20261019);
const maxSim=Number(process.env.MAX_SIM_SECONDS||7200);
const maxWall=Number(process.env.MAX_WALL_SECONDS||580);
const started=Date.now(),s=createGame(seed),g=new Civilization(s),events=[],battles=[],failures={};
const track=(kind,detail={})=>{
 const row={sec:+s.time.toFixed(1),min:+(s.time/60).toFixed(1),kind,...detail};
 events.push(row);
 if(!['STATUS','BUILD_FAILURE'].includes(kind))console.log('EVENT',JSON.stringify(row));
};
const fail=(key,why)=>{const k=key+' :: '+why;failures[k]=(failures[k]||0)+1;};
const gameTick=6;
const techPlan=['stone_tools','learning','hunting','water','warfare','fortifications','archery','agriculture','settlement',
 'pottery','animal_husbandry','masonry','stone_crafts','woodworking','wheel','bronze','forestry','fishing',
 'shipbuilding','storage','cellaring','copper_tin','stone_fortifications','road_construction','writing','iron',
 'smelting','smithing','horsemanship','civics','crossbows','siege_engineering','knighthood','ocean_sailing',
 'renaissance','printing','gunpowder','industrialization','rifles','modernity'];
const costs=(r)=>Object.fromEntries(['wood','plank','stone','bread','water','gold'].map(k=>[k,+(r[k]||0).toFixed(1)]));
const snapshots=[];
function status(label='STATUS'){
 const own=s.cities.filter(c=>c.team===0),r=own[0]?.economy.realms[0],armies=activeArmies(s,0),enemyTeams=[1,2,3].map(t=>({team:t,cities:s.cities.filter(c=>c.team===t).length,settlers:s.settlers.filter(a=>a.team===t).length,units:s.units.filter(u=>u.team===t&&u.hp>0).length}));
 const row={sec:Math.round(s.time),label,cityCount:own.length,pop:own.reduce((n,c)=>n+c.economy.realms[0].pop,0),tech:s.research[0].known.length,active:s.research[0].active,age:s.ages[0],stocks:r?costs(r.resources):null,buildings:own.flatMap(c=>c.economy.buildings.filter(b=>b.hp>0&&b.ready).map(b=>b.type)).slice(0,25),pending:own.reduce((n,c)=>n+c.economy.buildings.filter(b=>!b.ready&&b.hp>0).length,0),armies:armies.map(a=>({id:a.id||0,c:a.c,r:a.r,n:armyUnits(s,a).length,path:a.path?.length||0})),enemy:enemyTeams,winner:s.winner};
 snapshots.push(row);console.log('STATUS',JSON.stringify(row));
}
function foundFirstCity(){
 const a=s.settlers.find(x=>x.team===0);if(!a)return;
 const e=g.land(a.id);if(e){track('BLOCKED_FIRST_CITY',{error:e});return;}
 // The starting settler is already on an accessible dry tile. Search its actual site rules.
 const origin={x:a.x,z:a.z};let placed=null;
 for(let radius=0;radius<=28&&!placed;radius+=4)
  for(let x=-radius;x<=radius&&!placed;x+=4)
   for(let z=-radius;z<=radius&&!placed;z+=4){
    if(Math.abs(x)>42||Math.abs(z)>32)continue;
    const err=g.siteRule(a,{x,z});if(err)continue;
    a.x=x;a.z=z;
    const res=g.found(a.id);if(res.city)placed=res.city;else {fail('found',res.error);a.x=origin.x;a.z=origin.z;}
   }
 if(placed){track('FOUNDED',{team:0,city:placed.name,at:[placed.c,placed.r],deposit:Object.entries(g.cell(placed).deposits).filter(([k,v])=>v).map(([k])=>k)});}
 else track('BLOCKED_FIRST_CITY',{error:'No valid site after actual landing'}); 
}
foundFirstCity();
status('START');
const battleKey=(cell)=>cell.c+':'+cell.r;
function encounter(){
 if(s.battle||s.winner!==null)return;
 for(const a of s.armies){
  if(a.embarked!=null||!armyUnits(s,a).length)continue;
  const foes=s.armies.filter(f=>f.embarked==null&&f.team!==a.team&&battleKey(f)===battleKey(a)&&armyUnits(s,f).length);
  const city=g.cityAt(a);
  if(!foes.length&&(!city||city.team===a.team))continue;
  a.path=[];for(const f of foes)f.path=[];
  const cell=g.cell(a),b=createBattle(cell,s.units),present=s.armies.filter(f=>f.embarked==null&&battleKey(f)===battleKey(a)&&armyUnits(s,f).length);
  const sources=new Set(s.units.map((u,i)=>({u,i})).filter(({u})=>!u.garrison&&present.some(f=>f.team===u.team&&(f.id||0)===(u.armyId||0))).map(({i})=>i));
  b.squads=b.squads.filter(q=>sources.has(q.source));
  const teams=[...new Set(present.map(f=>f.team))];
  b.attackerTeam=city?(teams.find(t=>t!==city.team)??a.team):a.team;
  if(city&&teams.some(t=>t!==city.team)){
   const hall=city.economy.buildings.find(e=>e.type==='hall');
   b.fortress={team:city.team,cityId:city.id,x:hall.x,z:hall.z,hp:city.hp,maxHp:600,cool:0};
  }
  if(b.fortress){mobilizeCity(b,city);fortifyBattle(g,city,b);}
  const nav=g.nav(cell);
  for(const u of b.squads){if(u.guardPost)continue;const near=nav.nearest(u,80);if(near){u.x=near.x;u.z=near.z;}}
  // Player sets every offensive unit to attack, as with the game's "Attack All".
  for(const u of b.squads)if(u.team===0)u.advance=true;
  s.battle=b;
  b.testBegin=Math.round(s.time);b.testInitial=b.squads.filter(x=>x.team===0&&!x.civilian).length;
  track('BATTLE_START',{tile:battleKey(cell),attacker:b.attackerTeam,fortress:city?{team:city.team,name:city.name,hp:Math.round(city.hp)}:null,units:[0,1,2,3].map(t=>b.squads.filter(u=>u.team===t&&!u.civilian).length)});
  break;
 }
}
function tactical(dt){
 const b=s.battle;if(!b)return;
 let elapsed=0;
 while(elapsed<dt&&!b.result){
  const time=Math.min(.3,dt-elapsed);
  tickBattle(b,time,TROOPS,s.ages.map(a=>a>=2?1:0),g.nav(b.cell));
  elapsed+=time;
  if(b.elapsed>=420){b.result='timeout';b.winnerTeam=null;}
 }
 if(!b.result)return;
 for(const q of b.squads)if(s.units[q.source]&&q.source>=0)s.units[q.source].hp=q.hp;
 let capture=false,oldTeam=null,cityName=null;
 if(b.fortress){
  const city=s.cities.find(c=>c.id===b.fortress.cityId);
  settleDefenders(b,city);persistSiegeDamage(city,b);city.hp=Math.max(0,Math.min(city.hp,b.fortress.hp));
  if(city.hp<=0){oldTeam=city.team;cityName=city.name;g.transferCity(city,b.winnerTeam??b.attackerTeam);city.hp=300;capture=true;
   const remaining=[...new Set([...s.cities.map(c=>c.team),...s.settlers.map(a=>a.team)])];
   if(!remaining.includes(0))s.winner=city.team;else if(remaining.length===1)s.winner=0;
  }
 }
 rememberBattle(s,b);b.applied=true;
 const battle={time:Math.round(s.time),tile:battleKey(b.cell),result:b.result,winnerTeam:b.winnerTeam,attacker:b.attackerTeam,captured:capture,formerTeam:oldTeam,city:cityName,seconds:+b.elapsed.toFixed(1),
  sides:[0,1,2,3].map(t=>({team:t,started:b.squads.filter(u=>u.team===t&&!u.civilian).length,alive:b.squads.filter(u=>u.team===t&&!u.civilian&&u.hp>0).length,deadMilitia:b.squads.filter(u=>u.team===t&&u.civilian&&u.hp<=0).length}))};
 battles.push(battle);track('BATTLE_RESULT',battle);
 if(capture)track('CAPTURE',{from:oldTeam,team:b.winnerTeam??b.attackerTeam,city:cityName});
 s.battle=null;
}
function buildAt(city,type){
 const hall=city.economy.buildings.find(b=>b.type==='hall');
 if(!hall)return {error:'No hall'};
 const locations=[];
 for(let radius=0;radius<=36;radius+=6)
  for(let x=-radius;x<=radius;x+=6)
   for(let z=-radius;z<=radius;z+=6)
    if(Math.abs(x)===radius||Math.abs(z)===radius||radius===0)locations.push({x:hall.x+x,z:hall.z+z});
 const nearby=(type==='lumber'?'tree':type==='quarry'?'stone':type==='hunter'?'game':type==='fisher'?'fish':null);
 if(nearby){let res=city.world.resources.filter(r=>r.kind===nearby&&!r.removed);
  if(res.length)locations.sort((a,b)=>Math.min(...res.map(r=>Math.hypot(r.x-a.x,r.z-a.z)))-Math.min(...res.map(r=>Math.hypot(r.x-b.x,r.z-b.z))));
 }
 for(const pt of locations){const ans=g.build(city,type,pt);if(ans.building)return {building:ans.building};}
 return {error:'no legal build location on central tile'};
}
function planResearch(){
 const r=s.research[0];if(r.active||!s.cities.some(c=>c.team===0))return;
 let id=techPlan.find(k=>!r.known.includes(k)&&!techBlock(r,k));
 if(!id){id=Object.keys(TECHS).find(k=>!r.known.includes(k)&&!techBlock(r,k));}
 if(!id)return;
 const x=g.research(0,id);if(x.ok)track('RESEARCH_STARTED',{technology:id});else fail('research '+id,x.error);
}
function playerBuild(){
 const city=s.cities.find(c=>c.team===0);
 if(!city)return;
 // One building choice at a time prevents simultaneous investment disasters.
 if(city.economy.buildings.filter(b=>b.hp>0&&!b.ready).length>=2)return;
 const res=selectAIBuild(g,0,city);
 if(!res)return;
 const ans=buildAt(city,res.type);
 if(ans.building)track('BUILD_QUEUED',{building:res.type,reason:res.reason,pop:city.economy.realms[0].pop,stock:costs(city.economy.realms[0].resources)});
 else fail('build '+res.type,ans.error);
}
function playerRecruit(){
 const city=s.cities.find(c=>c.team===0);if(!city)return;
 const r=city.economy.realms[0],rdy=['archer','spearman','slinger','axeman'].filter(k=>(!g.s.research[0].known.includes('warfare')?k==='scout':true)&&(!k.includes('archer')||g.s.research[0].known.includes('archery'))&&TROOPS[k].requires.every(b=>g.cityReady(city,b))&&Object.entries(TROOPS[k].cost).every(([k,v])=>(r.resources[k]||0)>=v));
 const alive=s.units.filter(u=>u.team===0&&u.hp>0).length;
 if(alive>=18||(city.training?.length||0)>=2||r.pop<9)return;
 const kind=rdy[0];if(!kind)return;
 const ans=g.recruit(city,kind);
 if(ans.queued)track('RECRUIT_QUEUED',{unit:kind,pop:r.pop});
 else fail('recruit '+kind,ans.error);
}
function playerArmy(){
 const scouts=activeArmies(s,0),combat= scouts.filter(a=>armyUnits(s,a).filter(u=>u.kind!=='scout').length>=4)
   .sort((a,b)=>armyUnits(s,b).length-armyUnits(s,a).length)[0];
 if(!combat){
  // Scout only while not serving as last city's defense.
  const scout=scouts.find(a=>armyUnits(s,a).some(u=>u.kind==='scout'));
  if(scout&&!scout.autoExplore){scout.autoExplore=true;track('SCOUT_AUTO',{at:[scout.c,scout.r]})}
  return;
 }
 if(combat.autoExplore)combat.autoExplore=false;
 if(combat.path?.length)return;
 const destinations=s.cities.filter(c=>c.team!==0&&g.seen(0,c))
 .map(c=>({city:c,path:g.landPath(combat,c,0)})).filter(x=>x.path&&x.path.length)
 .sort((a,b)=>a.path.length-b.path.length);
 if(destinations.length){
   const d=destinations[0];combat.path=d.path;track('ARMY_MARCH',{army:combat.id||0,troops:armyUnits(s,combat).length,target:d.city.name,targetTeam:d.city.team,tiles:d.path.length});
 }else{
   const known=s.cities.filter(c=>c.team!==0&&g.seen(0,c));
   if(known.length){const detail=known.map(c=>({name:c.name,team:c.team,at:[c.c,c.r],distance:Math.abs(c.c-combat.c)+Math.abs(c.r-combat.r)}));if((s.time%600)<12)track('NO_LAND_ROUTE',{known:detail})}
 }
}
const formerCities=new Set();
const formerTechs=new Set();
let lastEventTime=0;
for(let run=0;s.time<maxSim&&s.winner===null;run++){
 if(Date.now()-started>maxWall*1000){track('WALL_CLOCK_LIMIT',{runs:run});break;}
 planResearch();
 if(run%3===0){playerBuild();playerRecruit();}
 if(run%2===0)playerArmy();
 const oldTime=s.time;
 g.tick(gameTick);
 encounter();
 if(s.battle)tactical(3);
 for(const city of s.cities){const key=city.id+':'+city.team;if(!formerCities.has(key)){formerCities.add(key);if(city.team!==0)track('CITY_APPEARED',{team:city.team,name:city.name,at:[city.c,city.r]})}}
 for(const id of s.research[0].known)if(!formerTechs.has(id)){formerTechs.add(id);track('DISCOVERY',{technology:id,age:s.ages[0]})}
 if(Math.floor(s.time/180)!==Math.floor(oldTime/180))status();
 if(run%30===0&&s.cities.filter(c=>c.team===0).length===0){track('PLAYER_ELIMINATED');break;}
}
status('FINAL');
const final={
 seed,maxSim,elapsedSec:s.time,turn:Math.floor(s.time/60)+1,wallSeconds:((Date.now()-started)/1000).toFixed(1),winner:s.winner,
 victories:battles.filter(x=>x.winnerTeam===0).length,battles,battleCount:battles.length,
 opponentCities:[1,2,3].map(team=>({team,name:FACTION_NAMES[team],cities:s.cities.filter(c=>c.team===team).map(c=>({name:c.name,at:[c.c,c.r],hp:c.hp})),settlers:s.settlers.filter(a=>a.team===team).map(a=>({c:a.c,r:a.r})),units:s.units.filter(u=>u.team===team&&u.hp>0).length})),
 ownCities:s.cities.filter(c=>c.team===0).map(c=>({name:c.name,at:[c.c,c.r],population:c.economy.realms[0].pop,hp:c.hp,resources:costs(c.economy.realms[0].resources),buildings:c.economy.buildings.filter(b=>b.hp>0).map(b=>({kind:b.type,ready:b.ready})),training:c.training})),
 ages:s.ages,knownTech:s.research.map(r=>r.known.length),techWait:s.research.map(r=>r.ageWait),
 startingResources:{wood:68,stone:18,bread:26}, snapshots,failures,
 events:events.filter(e=>e.kind!=='STATUS').slice(-500)
};
writeFileSync('playthrough-v71-report.json',JSON.stringify(final,null,2));
console.log('RESULT',JSON.stringify({...final,snapshots:undefined,events:undefined,battles:final.battles.slice(-8)}));
console.log('PLAYTHROUGH_FINISHED',JSON.stringify({winner:s.winner,turn:final.turn,wallSeconds:final.wallSeconds,enemyCities:final.opponentCities.map(t=>t.cities.length),battleCount:battles.length}));
