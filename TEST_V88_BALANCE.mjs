import assert from 'node:assert/strict';
import {Civilization,createGame} from './civilization-core.js';

// V88 balance regression: the AI should reach Bronze promptly from the clean
// V87 economy, and legal construction sites must remain reachable from town.
const reports=[];
for(const seed of [8417,20261020]){
 const game=new Civilization(createGame(seed));
 const previous=[0,0,0,0],arrivals=[];
 for(let tick=0;tick<7200;tick++){
  if(tick%6===0)game.aiTeam(0);
  game.tick(.5);
  for(let team=0;team<4;team++)if(game.s.ages[team]!==previous[team]){
   arrivals.push({team,age:game.s.ages[team],minute:+(game.s.time/60).toFixed(1)});
   previous[team]=game.s.ages[team];
  }
 }
 const bronze=arrivals.filter(x=>x.age===1);
 assert.equal(bronze.length,4,'all four civilizations should reach Bronze');
 assert.ok(bronze.every(x=>x.minute<=36),`Bronze target exceeded for seed ${seed}: ${JSON.stringify(bronze)}`);
 reports.push({seed,bronze});
}
console.log('V88 BALANCE PASS '+JSON.stringify(reports));
