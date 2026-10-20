import {Civilization,createGame} from './civilization-core.js';
import {cityProblems} from './v51-systems.js';
const g=new Civilization(createGame(20261020));
const report=()=>console.log(JSON.stringify({minutes:g.s.time/60,winner:g.s.winner,teams:[0,1,2,3].map(team=>({team,age:g.s.ages[team],research:g.s.research[team].active,known:g.s.research[team].known,cities:g.s.cities.filter(c=>c.team===team).map(c=>({name:c.name,pop:c.economy.realms[team].pop,stock:c.economy.realms[team].resources,buildings:c.economy.buildings.filter(b=>!b.virtual).map(b=>({type:b.type,ready:b.ready,status:b.status,assigned:b.assigned})),issues:cityProblems(g,c)}))}))}));
// Automated economic soak: player decisions use the same legal AI commands.
// No resource grants, era unlocks or direct building completion.
for(let i=0;i<7200;i++){
 if(i%6===0)g.aiTeam(0);
 g.tick(.5);
 if((i+1)%600===0)report();
}
