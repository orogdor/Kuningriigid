// V71 playthrough audit: a deterministic rule-following bot plays the real
// economy, research, movement, AI and tactical combat. No resources/units granted.
import {Civilization,createGame,TROOPS,BUILDINGS,FACTION_NAMES} from '../civilization-core.js';
import {TECHS,techBlock} from '../research.js';
import {selectAIBuild} from '../ai-strategy.js';
import {armyUnits,activeArmies} from '../v51-systems.js';
import {createBattle,mobilizeCity,settleDefenders,tickBattle,rememberBattle} from '../campaign.js';
import {fortifyBattle} from '../fortifications.js';
import {aiNavy} from '../naval.js';
import {persistSiegeDamage} from '../medieval-v62.js';
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
 for(const city of s.cities.filter(c=>c.team===0)){
  if(city.economy.buildings.filter(b=>b.hp>0&&!b.ready).length>=1)continue;
  const r=city.economy.realms[0],stock=r.resources;
  const owned=g.allBuildings(city).filter(b=>b.hp>0);
  const qty=type=>owned.filter(b=>b.type===type).length;
  const pop=r.pop,food=(stock.bread||0)+.7*(stock.grain||0);
  const houseCap=4+qty('house')*3;
  const candidates=[];
  const add=(types)=>{for(const type of types)candidates.push(type)};
  // Workers, shelter and food take priority over prestige and weapon production.
  if(food<Math.max(35,pop*6))add(['hunter','fisher','farm','mill','bakery']);
  if((stock.water||0)<Math.max(40,pop*6))add(['well']);
  if(pop>=houseCap-2)add(['house']);
  if((stock.wood||0)<55)add(['lumber','forester']);
  if((stock.stone||0)<55)add(['quarry']);
  if((stock.plank||0)<35)add(['saw']);
  add(['lumber','hunter','fisher','well','quarry','study','house','saw','farm','forester','mill','bakery','warehouse','cellar','harbor',
    'barracks','archery','mine','coal','smelter','smith','scriptorium','academy','university',
    'coppermine','tinmine','bronze_foundry','pasture','mason','printer','powdermill','nitrate','steelworks','engineworks','polytechnic','oilwell','refinery']);
  const caps={lumber:2,quarry:2,well:3,hunter:3,fisher:3,farm:3,house:15,forester:2,saw:2,study:2,barracks:1,archery:1,harbor:1,warehouse:1,cellar:1};
  let built=false;
  for(const type of [...new Set(candidates)]){
   if(!BUILDINGS[type]||qty(type)>=(caps[type]??1))continue;
   if(!g.canBuildNow(city,type))continue;
   const ans=buildAt(city,type);
   if(ans.building){track('BUILD_QUEUED',{building:type,city:city.name,pop,stock:costs(stock),reason:'economic expansion'});built=true;break}
   fail('build '+type,ans.error);
  }
  if(!built&&s.time%600<6)track('CONSTRUCTION_BLOCKED',{city:city.name,pop,stocks:costs(stock)});
 }
}
function playerRecruit(){
 const city=s.cities.find(c=>c.team===0);if(!city)return;
 const r=city.economy.realms[0];
 const troops=s.units.filter(u=>u.team===0&&u.hp>0);
 // The transport rules count EVERY troop, not just the boarding regiment: keep 6 maximum.
 if(troops.length+(city.training?.filter(x=>!x.ship).length||0)>=6||(city.training?.length||0)>=1||r.pop<15)return;
 if(s.cities.filter(c=>c.team===0).length<2&&s.time<2400)return;
 if((r.resources.bread||0)<45||(r.resources.water||0)<55)return;
 const unitNames=['archer','spearman','axeman','slinger'];
 const kind=unitNames.find(k=>{
  const def=TROOPS[k];if(def.age>s.ages[0])return false;
  const tech=({archer:'archery',spearman:'warfare',axeman:'warfare',slinger:'warfare'})[k];
  return (!tech||s.research[0].known.includes(tech))&&def.requires.every(t=>g.cityReady(city,t))&&
   Object.entries(def.cost).every(([key,n])=>(r.resources[key]||0)>=n);
 });
 if(!kind)return;
 const ans=g.recruit(city,kind);if(ans.queued)track('RECRUIT_QUEUED',{unit:kind,pop:r.pop});else fail('recruit '+kind,ans.error);
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
const expandPlan=new Map();
function playerExpansion(){
 const count=s.cities.filter(c=>c.team===0).length;
 const settlers=s.settlers.filter(a=>a.team===0);
 for(const settler of settlers){
  if(settler.path?.length||settler.localTarget)continue;
  const target=expandPlan.get(settler.id);
  if(target&&settler.c===target.c&&settler.r===target.r){
   const err=g.land(settler.id);
   if(err){fail('settler land',err);expandPlan.delete(settler.id);continue;}
   let done=false;
   for(let xx=-20;xx<=20&&!done;xx+=4)for(let zz=-20;zz<=20&&!done;zz+=4){
    if(g.siteRule(settler,{x:xx,z:zz}))continue;
    settler.x=xx;settler.z=zz;
    const res=g.found(settler.id);
    if(res.city){done=true;track('FOUNDED',{team:0,city:res.city.name,at:[res.city.c,res.city.r],deposit:Object.entries(g.cell(res.city).deposits).filter(([,v])=>v).map(([k])=>k)})}
   }
   expandPlan.delete(settler.id);
   if(!done)fail('settler found','no valid site');
   continue;
  }
  const current=s.cities.filter(c=>c.team===0);
  const choices=[];
  for(let dr=-13;dr<=13;dr++)for(let dc=-13;dc<=13;dc++){
   const x={c:settler.c+dc,r:settler.r+dr},tile=(x.c>=0&&x.r>=0&&x.c<220&&x.r<165)?g.cell(x):null;
   if(!tile?.land||tile.mountain||g.territoryOwner(tile)||current.some(city=>Math.abs(city.c-x.c)+Math.abs(city.r-x.r)<5))continue;
   const distance=Math.abs(dc)+Math.abs(dr);
   if(distance<5||distance>18)continue;
   const dep=tile.deposits||{};
   const score=(dep.grain?80:0)+(dep.water?28:0)+(dep.game?19:0)+(dep.stone?18:0)+(dep.wood?16:0)+(dep.ore?8:0)-distance*1.2;
   choices.push({tile,score});
  }
  choices.sort((a,b)=>b.score-a.score);
  const found=choices.slice(0,60).map(x=>({tile:x.tile,path:g.landPath(settler,x.tile,0)})).find(x=>x.path?.length);
  if(found){const err=g.moveSettler(settler.id,found.tile);if(!err){expandPlan.set(settler.id,found.tile);track('SETTLER_MARCH',{target:[found.tile.c,found.tile.r],tiles:found.path.length,deposits:Object.entries(found.tile.deposits).filter(([,v])=>v).map(([k])=>k)})}else fail('settler move',err)}
 }
 if(settlers.length||count>=3||s.time<1200||!s.research[0].known.includes('settlement'))return;
 const city=s.cities.filter(c=>c.team===0).sort((a,b)=>b.economy.realms[0].pop-a.economy.realms[0].pop)[0];
 if(!city)return;
 const stock=city.economy.realms[0].resources;
 if(city.economy.realms[0].pop<9||stock.wood<65||stock.stone<30||stock.bread<24)return;
 const ans=g.recruitSettler(city);
 if(ans.settler)track('SETTLER_RECRUITED',{city:city.name,at:[city.c,city.r]});
 else fail('new settler',ans.error);
}
function playerNavy(){
 const city=s.cities.find(c=>c.team===0&&g.cityReady(c,'harbor'));
 if(!city||!s.research[0].known.includes('shipbuilding'))return;
 // Native AI ship controller is used for the player too, with no granted vessels.
 g.s.aiPeaceUntil??=300;
 aiNavy(g,0);
}

const formerCities=new Set();
const formerTechs=new Set();
let lastEventTime=0;
for(let run=0;s.time<maxSim&&s.winner===null;run++){
 if(Date.now()-started>maxWall*1000){track('WALL_CLOCK_LIMIT',{runs:run});break;}
 planResearch();
 if(run%3===0){playerBuild();playerExpansion();playerRecruit();}
 if(run%2===0)playerArmy();
 if(run%4===0)playerNavy();
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
writeFileSync('playthrough-v71-strategy-report.json',JSON.stringify(final,null,2));
console.log('RESULT',JSON.stringify({...final,snapshots:undefined,events:undefined,battles:final.battles.slice(-8)}));
console.log('PLAYTHROUGH_FINISHED',JSON.stringify({winner:s.winner,turn:final.turn,wallSeconds:final.wallSeconds,enemyCities:final.opponentCities.map(t=>t.cities.length),battleCount:battles.length}));
