// Reproducible Bronze Age fortified-city assault; isolated from normal saves.
// ?demo=bronze-siege creates one attacker supply city and one defended town.
import {createStoneDemoState} from './stone-demo-v77.js?v=80c';
import {Civilization,TROOPS,BUILDINGS} from './civilization-core.js';
import {createBattle,mobilizeCity} from './campaign.js?v=109a';
import {fortifyBattle} from './fortifications.js';
import {initializeMen} from './individual-battle-v91.js?v=109a';
import {soldierCount} from './soldier-collision-v90.js';
import {battlefieldTiles} from './battlefield-v88.js';
import {initArmyExperience} from './army-experience-v88.js';
import {setRelation} from './diplomacy-v87.js';
export const BRONZE_SIEGE_NAME='Pronksiaja linnavallutus · redel ja piiramistorn';
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
 const hall={...existingHall,team:1,ready:true,hp:900,virtual:false};
 const walls=[-14,-7,0,7,14].map((offset,i)=>({
  type:'palisade',x:hall.x-16,z:hall.z+offset,wallAxis:1,team:1,ready:true,disabled:false,
  hp:340,progress:BUILDINGS.palisade?.time||40,assigned:0
 }));
 const tower={type:'watchtower',x:hall.x-7,z:hall.z+12,team:1,ready:true,hp:340,assigned:1};
 city.economy.buildings=[hall,...walls,tower];
 s.ages[0]=1;s.ages[1]=1;s.time=0;s.winner=null;s.demo='bronze-siege';s.settlers=[];s.ships=[];s.shipments=[];s.units=[];
 for(const team of [0,1]){s.armies[team].c=city.c;s.armies[team].r=city.r;s.armies[team].path=[];s.armies[team].autoExplore=false;s.armies[team].xp=400;
  s.research[team].known=[...new Set([...s.research[team].known,'warfare','archery','bronze','fortifications','wheel'])];
 }
 const roster0=['bronze_spearman','bronze_spearman','bronze_spearman','bronze_axeman','bronze_axeman','bronze_archer','bronze_catapult'];
 const roster1=['bronze_spearman','bronze_spearman','bronze_archer'];
 for(const team of [0,1])for(const kind of (team?roster1:roster0))s.units.push({team,armyId:0,kind,grade:'standard',hp:TROOPS[kind].hp,menCount:soldierCount({kind}),morale:100,combatMode:'auto'});
 for(const idx of [1,3]){const wall=walls[idx],kind='bronze_archer';s.units.push({team:1,armyId:0,kind,grade:'standard',hp:TROOPS[kind].hp,menCount:soldierCount({kind}),morale:100,
  garrison:{c:city.c,r:city.r,x:wall.x,z:wall.z,wallType:'palisade',wallAxis:1,slot:0}});}
 s.visionRevision=(s.visionRevision||0)+1;
 setRelation(s,0,1,'war');
 initArmyExperience(s,TROOPS);
 // Keep only the cell coordinates in battle state: copying an entire city there
 // multiplies world data and has caused fragile starts on memory-limited phones.
 const field={c:city.c,r:city.r},b=createBattle(field,s.units,s),defender=city;
 b.squads=b.squads.filter(u=>!s.units[u.source]?.garrison);
 b.attackerTeam=0;b.fortress={team:1,cityId:city.id,x:hall.x,z:hall.z,hp:city.hp,maxHp:city.hp,cool:0};
 mobilizeCity(b,defender);fortifyBattle(g,defender,b);
 for(const u of b.squads)if(u.team===0)u.advance=true;
 s.battle=b;
 for(const tile of battlefieldTiles(field))if(tile.c>=0&&tile.r>=0&&tile.c<220&&tile.r<165)g.reveal(0,g.cell(tile),0);
 // The main game initializes men and navigation once after loading this save.
 // Constructing two 3×3 navigation maps during demo creation can exhaust mobile memory.
 return copy(s);
}
