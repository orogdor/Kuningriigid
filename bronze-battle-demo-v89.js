import {deployHistoricalBattle} from './historical-tactics-v92.js?v=103a';
import {initializeMen} from './individual-battle-v91.js?v=103a';
import {soldierCount} from './soldier-collision-v90.js?v=103a';
import {Civilization,createGame,TROOPS} from './civilization-core.js';
import {TECHS} from './research.js';
import {createBattle} from './campaign.js?v=103a';
import {battlefieldTiles} from './battlefield-v88.js';
import {initArmyExperience} from './army-experience-v88.js';
import {setRelation} from './diplomacy-v87.js';
export const BRONZE_BATTLE_NAME='Hilispronksiaja testlahing · 241 vs 241 võitlejat';
export function createBronzeBattleState(seed=9517){
 const g=new Civilization(createGame(seed)),s=g.s;
 const cell=g.cells.find(p=>p.c>4&&p.r>4&&p.c<215&&p.r<160&&battlefieldTiles(p).every(t=>g.canTraverse(0,t)))||g.cell(s.armies[0]);
 s.cities=[];s.settlers=[];s.units=[];s.ships=[];s.shipments=[];s.time=0;s.winner=null;s.demo='bronze-battle';
 const roster=[...Array(5).fill('bronze_spearman'),...Array(2).fill('bronze_axeman'),...Array(2).fill('bronze_archer'),'chariot','bronze_cavalry','bronze_catapult'];
 for(const team of [0,1]){s.ages[team]=1;s.research[team].known=Object.keys(TECHS).filter(k=>TECHS[k].age<=1);s.research[team].active=null;s.research[team].queue=[];Object.assign(s.armies[team],{c:cell.c,r:cell.r,path:[],xp:400,autoExplore:false});
  roster.forEach((kind,i)=>{const grade=i===0||kind==='chariot'?'elite':i>=7&&i<9?'mobilized':'standard';s.units.push({team,armyId:0,kind,grade,hp:TROOPS[kind].hp*({elite:1.4,mobilized:.4}[grade]||1),menCount:soldierCount({kind}),morale:100});});
 }
 setRelation(s,0,1,'war');for(const t of battlefieldTiles(cell))g.reveal(0,t,0);initArmyExperience(s,TROOPS);s.battle=createBattle(cell,s.units,s);
 deployHistoricalBattle(s.battle);for(const u of s.battle.squads)u.advance=true;
 initializeMen(s.battle,g.battleNavigation(s.battle));return s;
}
