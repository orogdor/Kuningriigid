// Reproducible Bronze Age fortified-city assault; isolated from normal saves.
// ?demo=bronze-siege creates one attacker supply city and one defended town.
import {createStoneDemoState} from './stone-demo-v77.js?v=80c';
import {Civilization,TROOPS,BUILDINGS} from './civilization-core.js';
import {createBattle} from './campaign.js?v=112a';
import {fortifyBattle} from './fortifications.js';
import {soldierCount} from './soldier-collision-v90.js';
import {battlefieldTiles} from './battlefield-v88.js';
import {initArmyExperience} from './army-experience-v88.js';
import {setRelation} from './diplomacy-v87.js';
export const BRONZE_SIEGE_NAME='Hattuša eeskujul pronksiaja kindluslinn';
const copy=o=>JSON.parse(JSON.stringify(o));
export function createBronzeSiegeState(seed=20261020){
 const g=new Civilization(createStoneDemoState(seed)),s=g.s,city=s.cities[0];
 if(!city)throw Error('Bronze siege city is missing');
 const existingHall=city.economy.buildings.find(b=>b.type==='hall');if(!existingHall)throw Error('Siege city hall is missing');
 const supply=copy(city);supply.id=city.id+1;supply.team=0;supply.name='Ründajate varustuslinn';supply.districts={};
 const options=g.cells.filter(p=>p.land&&!p.mountain&&Math.abs(p.c-city.c)+Math.abs(p.r-city.r)>=5&&Math.abs(p.c-city.c)+Math.abs(p.r-city.r)<=13);
 options.sort((a,b)=>Math.hypot(a.c-city.c,a.r-city.r)-Math.hypot(b.c-city.c,b.r-city.r));const supplySite=options[0];if(!supplySite)throw Error('No site for siege supply base');
 supply.c=supplySite.c;supply.r=supplySite.r;supply.economy.buildings=[{...existingHall,team:0,x:0,z:0,virtual:false}];
 supply.economy.realms[0].resources.wood=350;supply.economy.realms[0].pop=8;s.cities=[city,supply];
 city.team=1;city.name=BRONZE_SIEGE_NAME;city.hp=330;
 city.economy.realms[1]=copy(city.economy.realms[0]);city.economy.realms[1].pop=8;
 const hall={...existingHall,x:21,z:-8,team:1,ready:true,hp:900,virtual:false};
 const make=(type,x,z,axis=0)=>({type,x,z,wallAxis:axis,team:1,ready:true,disabled:false,hp:type==='gatehouse'?500:650,progress:BUILDINGS[type]?.time||40,assigned:type==='stonetower'?1:0,bronzeWall:true,previewAge:1});
 // Continuous 7m sections; two wooden gates close the only ground passages.
 const walls=[];
 for(let x=-28;x<=42;x+=7)for(const z of [-28,28])walls.push(make(z===28&&x===14?'gatehouse':'stonewall',x,z));
 for(let z=-21;z<=21;z+=7)for(const x of [-28,42])walls.push(make(x===-28&&z===0?'gatehouse':'stonewall',x,z,1));
 const towers=[[-28,-28],[-28,28],[42,-28],[42,28],[-28,-7],[-28,7],[7,28],[21,28],[7,-28],[42,0]].map(([x,z])=>make('stonetower',x,z));
 const town=[['warehouse',31,-17],['cellar',31,17],['market',7,13],['well',9,-7],['barracks',-15,-17],['study',20,16],['bronze_foundry',-15,17],['pottery_kiln',-5,18],...[-8,2,12,22].map(x=>['house',x,-18]),...[-10,1,12,23].map(x=>['house',x,0])].map(([type,x,z])=>make(type,x,z));
 city.economy.buildings=[hall,...walls,...towers,...town];
 city.world.resources=city.world.resources.filter(r=>r.x< -68||r.x>50||Math.abs(r.z)>36);city.world.revision=(city.world.revision||0)+1;
 // Worn streets connect the gate, central square and workshops.
 city.world.heat??={};for(let x=-26;x<=36;x++)for(let d=-1;d<=1;d++)city.world.heat[x+':'+(7+d)]=30;
 s.ages[0]=1;s.ages[1]=1;s.time=0;s.winner=null;s.demo='bronze-siege';s.settlers=[];s.ships=[];s.shipments=[];s.units=[];
 for(const team of [0,1]){s.armies[team].c=city.c;s.armies[team].r=city.r;s.armies[team].path=[];s.armies[team].autoExplore=false;s.armies[team].xp=400;
  s.research[team].known=[...new Set([...s.research[team].known,'warfare','archery','bronze','fortifications','wheel'])];
 }
 // Kadesh-inspired personnel balance: Egypt-like 192 foot + 24 two-man
 // chariots = 80% foot / 20% crew. Weapon splits are a game approximation.
 const roster0=[...Array(4).fill('bronze_spearman'),...Array(2).fill('bronze_axeman'),...Array(2).fill('bronze_archer'),'chariot','chariot'];
 const roster1=['bronze_spearman','bronze_spearman','bronze_spearman','bronze_axeman','chariot'];
 for(const team of [0,1])for(const kind of (team?roster1:roster0))s.units.push({team,armyId:0,kind,grade:'standard',hp:TROOPS[kind].hp,menCount:soldierCount({kind}),morale:100,combatMode:'auto'});
 for(const wall of walls.filter(w=>w.type==='stonewall'&&w.x===-28&&Math.abs(w.z)<=21).concat(walls.filter(w=>w.type==='stonewall'&&w.z===-28&&[-21,-14].includes(w.x)))){
  const kind='bronze_archer';s.units.push({team:1,armyId:0,kind,grade:'standard',hp:TROOPS[kind].hp/3,menCount:8,morale:100,garrison:{c:city.c,r:city.r,x:wall.x,z:wall.z,wallType:'stonewall',wallAxis:wall.wallAxis,slot:0}});
 }
 s.visionRevision=(s.visionRevision||0)+1;
 setRelation(s,0,1,'war');
 initArmyExperience(s,TROOPS);
 // Keep only the cell coordinates in battle state: copying an entire city there
 // multiplies world data and has caused fragile starts on memory-limited phones.
 const mapTile=g.cell(city);if(!mapTile||!Number.isFinite(mapTile.x)||!Number.isFinite(mapTile.z))throw Error('Linnapiiramise detailkaardi asukoht puudub.');
 const field={c:mapTile.c,r:mapTile.r,x:mapTile.x,z:mapTile.z},b=createBattle(field,s.units,s),defender=city;
 b.squads=b.squads.filter(u=>!s.units[u.source]?.garrison);
 b.attackerTeam=0;b.fortress={team:1,cityId:city.id,x:hall.x,z:hall.z,hp:city.hp,maxHp:city.hp,cool:0};
 b.wallWalkEnabled=true;b.wallStairs=[{x:-28,z:-14,groundX:-21,groundZ:-14},{x:-14,z:-28,groundX:-14,groundZ:-21},{x:42,z:14,groundX:35,groundZ:14},{x:28,z:28,groundX:28,groundZ:21}];
 fortifyBattle(g,defender,b);
 let attack=0,defend=0;for(const u of b.squads){if(u.guardPost)continue;if(u.team===0){const i=attack++;u.x=u.kind==='chariot'?-66:-51-Math.floor(i/4)*10;u.z=u.kind==='chariot'?(i%2?43:-43):(i%4-1.5)*10;}else{const i=defend++;u.x=u.kind==='chariot'?65:0+(i%2)*16;u.z=u.kind==='chariot'?38:-9+Math.floor(i/2)*22;}u.deployment={x:u.x,z:u.z};u.anchor={x:u.x,z:u.z};}
 b.historicalRoster={basis:'Kadeš u 1274 eKr; relvaliikide jaotus on mänguline lähendus',attack:{spearmen:96,axemen:48,archers:48,chariots:24,crew:48},defense:{spearmen:72,axemen:24,archers:64,chariots:12,crew:36}};
 for(const u of b.squads)if(u.team===0)u.advance=true;
 s.battle=b;
 for(const tile of battlefieldTiles(field))if(tile.c>=0&&tile.r>=0&&tile.c<220&&tile.r<165)g.reveal(0,g.cell(tile),0);
 // The main game initializes men and navigation once after loading this save.
 // Constructing two 3×3 navigation maps during demo creation can exhaust mobile memory.
 return copy(s);
}
