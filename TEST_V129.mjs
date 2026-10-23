import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Civilization,createGame} from './civilization-core.js';
import {MIN_CITY_SPACING,citySpacingAllowed} from './counties-v126.js';
assert.equal(MIN_CITY_SPACING,17);
assert.equal(citySpacingAllowed({c:16,r:16},[{c:0,r:0}]),false,'diagonal crowding is blocked');
assert.equal(citySpacingAllowed({c:17,r:0},[{c:0,r:0}]),true);
const file='scenarios/iron-ai-v129.json';
assert.ok(fs.existsSync(file),'new natural AI test state is required');
{
 const g=new Civilization(JSON.parse(fs.readFileSync(file)));g.refreshVision();
 for(const city of g.s.cities){
  assert.equal(citySpacingAllowed(city,g.s.cities.filter(c=>c!==city)),true,city.name+' has county growth room');
  const rural=[...g.territory].filter(([key,owner])=>{const[c,r]=key.split(':').map(Number);return owner.id===city.id&&g.isCountyTile({c,r},city)});
  assert.ok(rural.length>0,city.name+' has a county');
  for(const[key]of rural){const[c,r]=key.split(':').map(Number);assert.ok(g.seen(city.team,{c,r}),'own county is explored');}
 }
}
console.log('V129 PASS: diagonal city spacing, counties around test cities, own territory visible');
