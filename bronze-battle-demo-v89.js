import {Civilization,createGame,TROOPS} from './civilization-core.js';
import {TECHS} from './research.js';
import {createBattle} from './campaign.js';
import {battlefieldTiles} from './battlefield-v88.js';
import {initArmyExperience} from './army-experience-v88.js';
import {setRelation} from './diplomacy-v87.js';
export const BRONZE_BATTLE_NAME='Pronksiaja testlahing · 32 vs 32 salka';
export function createBronzeBattleState(seed=8417){
 const g=new Civilization(createGame(seed)),s=g.s;
 const cell=g.cells.find(p=>p.c>4&&p.r>4&&p.c<215&&p.r<160&&battlefieldTiles(p).every(t=>g.canTraverse(0,t)))||g.cell(s.armies[0]);
 s.cities=[];s.settlers=[];s.units=[];s.ships=[];s.shipments=[];s.time=0;s.winner=null;s.demo='bronze-battle';
 const roster=[...Array(8).fill('bronze_spearman'),...Array(8).fill('bronze_axeman'),...Array(10).fill('bronze_archer'),...Array(6).fill('chariot')];
 for(const team of [0,1]){s.ages[team]=1;s.research[team].known=Object.keys(TECHS).filter(k=>TECHS[k].age<=1);s.research[team].active=null;s.research[team].queue=[];Object.assign(s.armies[team],{c:cell.c,r:cell.r,path:[],xp:400,autoExplore:false});
  roster.forEach((kind,i)=>s.units.push({team,armyId:0,kind,grade:i<4?'mobilized':i>=28?'elite':'standard',hp:TROOPS[kind].hp*(i<4?.4:i>=28?1.4:1),morale:100}));
 }
 setRelation(s,0,1,'war');for(const t of battlefieldTiles(cell))g.reveal(0,t,0);initArmyExperience(s,TROOPS);s.battle=createBattle(cell,s.units,s);
 const ranks={};for(const u of s.battle.squads){const i=ranks[u.team]||0;ranks[u.team]=i+1;const side=u.team?1:-1,archer=u.kind==='bronze_archer',chariot=u.kind==='chariot',n=archer?i-16:chariot?i-26:i;
  u.x=side*(archer?100:chariot?60:65+Math.floor(n/8)*9);u.z=chariot?(n<3?-1:1)*(86+(n%3)*9):((n%(archer?10:8))-(archer?4.5:3.5))*15;u.advance=u.team===1;
 }
 return s;
}
