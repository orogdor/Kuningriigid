import fs from 'node:fs';
import {Civilization} from '../civilization-core.js';
import {surplusForWalls} from '../ancient-walls-v139.js';
const game=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-city-v139.json')));
for(const city of game.s.cities.filter(c=>c.team===0)){
 const r=city.economy.realms[0],b=game.allBuildings(city),pending=b.filter(x=>x.hp>0&&!x.ready).length;
 const stock=r.resources,food=['bread','grain','meat','fish','berries','vegetables'].reduce((s,k)=>s+(stock[k]||0),0);
 const houses=b.filter(x=>x.type==='house'&&x.ready&&x.hp>0).length;
 const services=b.filter(x=>x.hp>0&&x.ready&&['market','warehouse','study','scriptorium','cellar','well'].includes(x.type)).length;
 console.log('V139 WALL DIAG',JSON.stringify({city:city.name,pop:r.pop,age:game.s.ages[0],gold:stock.gold,wood:stock.wood,stone:stock.stone,water:stock.water,food,pending,houses,services,eligible:surplusForWalls(stock,r.pop,pending),palisade:game.buildRule(city,'palisade'),stonewall:game.buildRule(city,'stonewall')}));
}
