// V124 reproducible, opt-in battle laboratory.
// These are deliberate stress-test encounters, NOT battles alleged to have occurred
// naturally in the automated economic campaign. Every playable link constructs
// the same seed, army rosters, initial squad positions and individual soldiers.
import {Civilization,createGame,TROOPS} from './civilization-core.js?v=123a';
import {TECHS} from './research.js?v=118a';
import {soldierCount} from './soldier-collision-v90.js?v=110a';
import {createBattle} from './campaign.js?v=118a';
import {battlefieldTiles} from './battlefield-v88.js';
import {deployHistoricalBattle} from './historical-tactics-v92.js?v=117a';
import {initializeMen,battleManCount} from './individual-battle-v91.js?v=117a';
import {setRelation} from './diplomacy-v87.js';
import {initArmyExperience} from './army-experience-v88.js';
const packs=(...parts)=>parts.flatMap(([kind,n])=>Array(n).fill(kind));
export const BATTLE_SPECS_V124=[
 {id:1,title:'Forest Pass — Stone Age',age:0,seed:124001,teams:[
  packs(['spearman',3],['axeman',2],['slinger',2],['archer',1]),
  packs(['spearman',3],['axeman',2],['slinger',2],['archer',1])]},
 {id:2,title:'Bronze Ford Crossing',age:1,seed:124002,teams:[
  packs(['bronze_spearman',4],['bronze_axeman',2],['bronze_archer',2],['chariot',1]),
  packs(['bronze_spearman',4],['bronze_axeman',2],['bronze_archer',2],['chariot',1])]},
 {id:3,title:'Chariots at the River',age:1,seed:124003,teams:[
  packs(['bronze_spearman',4],['bronze_archer',3],['chariot',3]),
  packs(['bronze_spearman',4],['bronze_axeman',3],['chariot',3])]},
 {id:4,title:'The Iron Ridge',age:2,seed:124004,teams:[
  packs(['infantry',6],['iron_archer',3],['cavalry',2]),
  packs(['infantry',6],['iron_archer',3],['cavalry',2])]},
 {id:5,title:'Iron Cavalry Breakthrough',age:2,seed:124005,teams:[
  packs(['infantry',7],['cavalry',4],['iron_archer',2]),
  packs(['infantry',7],['cavalry',4],['iron_archer',2])]},
 {id:6,title:'Medieval Knights and Halberds',age:3,seed:124006,teams:[
  packs(['man_at_arms',5],['halberdier',3],['knight',3],['crossbowman',2]),
  packs(['man_at_arms',5],['halberdier',3],['knight',3],['crossbowman',2])]},
 {id:7,title:'Medieval Crossbow Lines',age:3,seed:124007,teams:[
  packs(['man_at_arms',6],['crossbowman',5],['heavy_cavalry',2]),
  packs(['man_at_arms',5],['crossbowman',6],['heavy_cavalry',2])]},
 {id:8,title:'Renaissance Matchlocks',age:4,seed:124008,teams:[
  packs(['musketeer',7],['halberdier',5],['heavy_cavalry',2]),
  packs(['arquebusier',6],['musketeer',4],['halberdier',4])]},
 {id:9,title:'Industrial Rifle Columns',age:5,seed:124009,teams:[
  packs(['rifleman',9],['musketeer',3],['cavalry',2]),
  packs(['rifleman',9],['musketeer',3],['cavalry',2])]},
 {id:10,title:'Modern Combined Arms',age:6,seed:124010,teams:[
  packs(['modern_infantry',8],['motorized',5],['rifleman',5]),
  packs(['modern_infantry',8],['motorized',5],['rifleman',5])]}
];
const copy=x=>JSON.parse(JSON.stringify(x));
export function createV124ReplayState(number){
 const spec=BATTLE_SPECS_V124.find(x=>x.id===Number(number));
 if(!spec)throw Error('Unknown V124 battle replay '+number);
 const game=new Civilization(createGame(spec.seed)),s=game.s;
 // The generated battle arena is taken from the real campaign terrain generator.
 // The exact, stable cell coordinate is recorded with the scenario manifest.
 const startC=43+spec.id*9,startR=39+spec.id*4;
 const cells=game.cells.filter(c=>c.c>=startC&&c.c<=startC+18&&c.r>=startR&&c.r<=startR+18&&c.land&&!c.mountain);
 const cell=cells.find(p=>battlefieldTiles(p).every(t=>game.canTraverse(0,t)))||
  game.cells.find(p=>p.c>4&&p.r>4&&p.c<215&&p.r<160&&battlefieldTiles(p).every(t=>game.canTraverse(0,t)))||
  game.cell(s.armies[0]);
 s.cities=[];s.settlers=[];s.units=[];s.ships=[];s.shipments=[];s.time=spec.id*60;s.winner=null;s.demo='v124-battle-'+spec.id;
 for(const team of [0,1]){
  s.ages[team]=spec.age;s.research[team].known=Object.keys(TECHS).filter(id=>TECHS[id].age<=spec.age);
  s.research[team].active=null;s.research[team].queue=[];s.research[team].progress={};
  Object.assign(s.armies[team],{c:cell.c,r:cell.r,path:[],xp:spec.id*70,autoExplore:false,embarked:null});
  spec.teams[team].forEach((kind,index)=>{
   const def=TROOPS[kind];
   if(!def)throw Error('Unsupported unit '+kind+' in replay '+spec.id);
   if(def.age>spec.age)throw Error('Unit '+kind+' is newer than replay era '+spec.age);
   const grade=index%7===0?'elite':index%5===0?'mobilized':'standard';
   const ratio=grade==='elite'?1.3:grade==='mobilized'?.75:1;
   s.units.push({team,armyId:0,kind,grade,hp:def.hp*ratio,maxHp:def.hp*ratio,
    menCount:soldierCount({kind}),morale:100,combatMode:'auto'});
  });
 }
 setRelation(s,0,1,'war');for(const tile of battlefieldTiles(cell))game.reveal(0,tile,0);
 initArmyExperience(s,TROOPS);
 s.battle=createBattle(cell,s.units,s);
 s.battle.attackerTeam=0;
 deployHistoricalBattle(s.battle);
 for(const u of s.battle.squads)u.advance=true;
 initializeMen(s.battle,game.battleNavigation(s.battle));
 s.battle.testReplayV124={id:spec.id,title:spec.title,seed:spec.seed,age:spec.age,
  initialMen:battleManCount(s.battle),location:{c:cell.c,r:cell.r},testGenerated:true};
 return s;
}
export function replayDetails(number){
 const spec=BATTLE_SPECS_V124.find(x=>x.id===Number(number));
 return spec?{id:spec.id,title:spec.title,seed:spec.seed,age:spec.age,
  teams:copy(spec.teams),unitCount:spec.teams.map(x=>x.length)}:null;
}
