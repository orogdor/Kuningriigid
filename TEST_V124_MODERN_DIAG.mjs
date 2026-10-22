import {createV124ReplayState} from './battle-replays-v124.js';
import {Civilization,TROOPS} from './civilization-core.js?v=123a';
import {tickIndividualBattle,battleManCount} from './individual-battle-v91.js?v=117a';
const s=createV124ReplayState(10),g=new Civilization(s),b=s.battle,nav=g.battleNavigation(b);
function sample(at){
 const byTeam=[0,1].map(team=>{
  const q=b.squads.filter(u=>!u.reserve&&u.team===team),living=q.flatMap(u=>(u.men||[]).filter(m=>m.hp>0&&!m.escaped));
  return {team,men:battleManCount(b,team),squads:q.length,xMean:living.reduce((n,m)=>n+m.x,0)/Math.max(living.length,1),xRange:[Math.min(...living.map(m=>m.x)),Math.max(...living.map(m=>m.x))],
   moving:q.filter(u=>u.moving).length,blocked:q.filter(u=>u.blockedFor>1).length,damage:q.reduce((n,u)=>n+(u.damageDealt||0),0),ranged:q.map(u=>u.kind).filter(x=>/rifle|motor|modern/.test(x)).length};
 });
 console.log('V124_MODERN_DIAG',JSON.stringify({at,result:b.result,casualties:b.casualties,byTeam}));
}
sample(0);
for(let n=1;n<=1000&&!b.result;n++){tickIndividualBattle(b,.2,TROOPS,1,nav);if(n%150===0)sample(n*.2)}
console.log('V124_MODERN_DIAG_FINAL',JSON.stringify({elapsed:b.elapsed,result:b.result,casualties:b.casualties}));
