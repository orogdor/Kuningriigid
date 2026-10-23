import assert from 'node:assert/strict';
import fs from 'node:fs';
import {populationCityRadius,grownCityRadius,nextCityPopulation} from './city-area-v142.js';
import {countyFootprint,countyTileLimit,countyBuildRule} from './counties-v126.js';
import {Civilization,createGame} from './civilization-core.js';
for(const [pop,extent]of [[0,3],[3,3],[7,3],[8,5],[17,5],[18,7],[31,7],[32,9],[49,9],[50,11],[72,13],[98,15]]){
 const radius=populationCityRadius(pop);assert.equal(radius*2+1,extent);
 const tiles=countyFootprint({id:2,c:30,r:30},radius,()=>({land:true}));assert.equal(tiles.length,3*extent*extent);
}
for(const [radius,pop]of [[1,8],[2,18],[3,32],[4,50],[5,72]])assert.equal(nextCityPopulation(radius),pop);
assert.equal(grownCityRadius(4,3),4,'population loss does not erase existing urban territory');
const g=new Civilization(createGame(12501));for(let i=0;i<8;i++){g.aiTeam(0);g.tick(12)}
const city=g.s.cities.find(c=>c.team===0);assert.ok(city);
city.economy.realms[0].pop=7;g.refreshTerritory();const before=g._perf.stats.territoryBuilds;
city.economy.realms[0].pop=8;g.refreshTerritory();assert.equal(g.radius(city),2);assert.ok(g._perf.stats.territoryBuilds>before,'new population threshold invalidates territory cache');
city.economy.realms[0].pop=32;g.refreshTerritory();assert.equal(g.radius(city),4);assert.ok(g.constructionArea(city).tiles.length<=243);
city.economy.realms[0].pop=3;g.refreshTerritory();assert.equal(g.radius(city),4);
const restored=new Civilization(JSON.parse(JSON.stringify(g.s)));assert.equal(restored.radius(restored.s.cities.find(c=>c.id===city.id)),4);
assert.match(countyBuildRule({economy:{buildings:Array.from({length:3},()=>({type:'farm',hp:100}))}},'farm',new Set(['farm'])),/kuni 3/);
if(fs.existsSync('scenarios/ai-iron-v142.json')){
 const saved=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-iron-v142.json')));assert.equal(saved.s.ages[0],2);assert.equal(saved.s.demo,'ai-iron-v142');
 for(const city of saved.s.cities)assert.ok(saved.radius(city)>=populationCityRadius(city.economy.realms[city.team].pop));
}
console.log('V142 PASS: proportional city growth, 32 residents = 9x9 envelope, growing county, cache refresh, no shrink, save compatibility, rural 3-building limit');
