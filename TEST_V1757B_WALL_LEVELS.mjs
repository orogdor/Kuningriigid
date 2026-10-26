import assert from 'node:assert/strict';
import fs from 'node:fs';
import {woodFortCostV1757,woodFortBuildTimeV1757,woodFortSurchargeV1757} from './wood-fort-levels-v1757.js';
import {Civilization,BUILDINGS} from './civilization-core.js';
import {Navigation} from './navigation.js';

assert.deepEqual(BUILDINGS.palisade.cost,{wood:3});
assert.equal(BUILDINGS.palisade.time,9);
const low=woodFortCostV1757('palisade',1,BUILDINGS.palisade.cost);
const high=woodFortCostV1757('palisade',2,BUILDINGS.palisade.cost);
assert.deepEqual(low,{wood:3});
assert.deepEqual(high,{wood:12,stone:2});
assert.deepEqual(woodFortSurchargeV1757('palisade',2,BUILDINGS.palisade.cost),{wood:9,stone:2});
assert.equal(woodFortBuildTimeV1757('palisade',2,BUILDINGS.palisade.time),24);
assert.equal(woodFortBuildTimeV1757('palisade',1,BUILDINGS.palisade.time),9);

const base=JSON.parse(fs.readFileSync('scenarios/ai-stone-v174.json','utf8'));
function makeGame(){
 const state=structuredClone(base),game=new Civilization(state);
 const city=game.s.cities.find(c=>c.id===state.stoneTestV174.targetCityId);
 assert.ok(city,'real Stone Age AI settlement available');
 const stock=city.economy.realms[city.team].resources;
 stock.wood=Math.max(stock.wood||0,300);stock.stone=Math.max(stock.stone||0,150);
 return {game,city,stock};
}
// Match the exact same real, legal free site for both variants.
const first=makeGame();
let candidate=null;
outer:for(let z=-75;z<=75;z+=5)for(let x=-80;x<=80;x+=5){
 const p={x,z,wallAngleV175:0,wallAxis:0,palisadeSpanV167:5.2,
  drawnWallV175:true,woodFortTierV1757:2};
 if(!first.game.previewBuild(first.city,'palisade',p).error){candidate=p;break outer;}
}
assert.ok(candidate,'found a legal high palisade site in a real saved game');
const before={wood:first.stock.wood,stone:first.stock.stone,count:first.city.economy.buildings.length};
const placed=first.game.build(first.city,'palisade',candidate);
assert.ok(placed.building,placed.error);
assert.equal(placed.building.woodFortTierV1757,2);
assert.equal(placed.building.buildTimeV1757,24);
assert.equal(first.stock.wood,before.wood-12);
assert.equal(first.stock.stone,before.stone-2);
assert.equal(first.city.economy.buildings.length,before.count+1);
assert.equal(first.game.nav(first.city).open(candidate.x,candidate.z),false);
const serialized=JSON.parse(JSON.stringify(placed.building));
assert.equal(serialized.woodFortTierV1757,2,'tier survives V4 JSON save');
assert.equal(serialized.buildTimeV1757,24,'build time survives V4 JSON save');

const second=makeGame(),lowSpot={...candidate,woodFortTierV1757:1};
const lowPlaced=second.game.build(second.city,'palisade',lowSpot);
assert.ok(lowPlaced.building,lowPlaced.error);
assert.ok(!lowPlaced.building.woodFortTierV1757,'legacy cheap wall remains unmarked');
assert.equal(second.stock.wood,before.wood-3);
assert.equal(second.stock.stone,before.stone);
const third=makeGame();
third.stock.wood=11;third.stock.stone=10;
const insufficient=third.game.build(third.city,'palisade',candidate);
assert.ok(insufficient.error,'tier II rejects insufficient resources');
assert.equal(third.stock.wood,11,'rejection cannot spend resources');
const shortTime=first.game.constructionTime('palisade',1);
const tallTime=first.game.constructionTime('palisade',2);
assert.ok(tallTime>shortTime,'tier II truly takes longer');
console.log('V175.7b TWO PAID STONE AGE PALISADES PASS',JSON.stringify({
 low,high,location:{x:candidate.x,z:candidate.z},lowTime:shortTime,highTime:tallTime}));
