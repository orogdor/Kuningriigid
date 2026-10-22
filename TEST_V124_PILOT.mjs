import {Civilization,createGame,BUILDINGS,TROOPS} from './civilization-core.js?v=123a';
import {TECHS,nextResearchForGoals,techBlock} from './research.js?v=118a';
import {scienceRate} from './science.js';
const game=new Civilization(createGame(1241023)),s=game.s;
for(let t=0;t<100;t++){
 for(let j=0;j<5;j++){
  game.aiTeam(0);game.tick(12);
 }
 if(t%10===0||t===99){
  const teams=[0,1,2,3].map(k=>({team:k,age:s.ages[k],cities:s.cities.filter(c=>c.team===k).length,known:s.research[k].known.length,active:s.research[k].active,pop:s.cities.filter(c=>c.team===k).reduce((v,c)=>v+c.economy.realms[k].pop,0),science:scienceRate(s,k).toFixed(2)}));
  console.log('PILOT',t+1,JSON.stringify(teams));
 }
}
