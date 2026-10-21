import {atWar} from './diplomacy-v87.js';
// The winner is based on remaining viable factions, not military headcount.
// A faction without a city OR settler collapses; its scattered units cannot
// indefinitely block a conquest. A living settler can still found a new city.
import {armyUnits} from './v51-systems.js';
export const factionAlive=(s,team)=>s.cities.some(c=>c.team===team)||s.settlers.some(a=>a.team===team);
export function reconcileVictory(s,conqueror=null){
 const count=s.research?.length||4;
 for(let team=0;team<count;team++){
  if(factionAlive(s,team))continue;
  for(const unit of s.units)if(unit.team===team)unit.hp=0;
  for(const ship of s.ships||[])if(ship.team===team){ship.hp=0;ship.cargo=null;ship.path=[];}
  for(const army of s.armies)if(army.team===team){army.path=[];army.embarked=null;army.autoExplore=false;}
 }
 const survivors=Array.from({length:count},(_,team)=>team).filter(team=>factionAlive(s,team));
 if(!survivors.includes(0)){
  if(s.winner==null)s.winner=conqueror??survivors[0]??null;
 }else if(survivors.length===1){
  s.winner=0;
 }
 return {winner:s.winner,survivors};
}
export function captureEnemySettlers(game){
 const s=game.s;let taken=0;
 for(const settler of [...s.settlers]){
  if(settler.embarked!=null)continue;
  const captor=s.armies.find(a=>atWar(s,a.team,settler.team)&&a.embarked==null&&a.c===settler.c&&a.r===settler.r&&armyUnits(s,a).length);
  if(!captor)continue;
  s.settlers.splice(s.settlers.indexOf(settler),1);
  s.events??=[];s.events.push({time:s.time,text:'Asunik tabatud: '+settler.team+' → '+captor.team});
  taken++;
 }
 if(taken)reconcileVictory(s);
 return taken;
}
