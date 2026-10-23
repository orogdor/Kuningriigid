import assert from 'node:assert/strict';
import {Civilization,createGame} from './civilization-core.js';
import {countyFootprint,countyTileLimit,urbanTile} from './counties-v126.js';
import {COLS,ROWS} from './campaign.js';

for(let radius=1;radius<=4;radius++){
 const city={c:30,r:30},tiles=countyFootprint(city,radius,()=>({land:true}));
 assert.equal(tiles.length,countyTileLimit(radius));
 const urban=tiles.filter(p=>urbanTile(city,p,radius));assert.ok(urban.length>=4*radius+1&&urban.length<(2*radius+1)**2,'non-square but connected urban centre');
 assert.equal(new Set(tiles.map(p=>p.c+':'+p.r)).size,tiles.length);
}
const edge=countyFootprint({c:0,r:0},4,p=>p.c>=0&&p.c<COLS&&p.r>=0&&p.r<ROWS?{land:true}:null);
assert.ok(edge.every(p=>p.c>=0&&p.r>=0));
const g=new Civilization(createGame(12501));
for(let i=0;i<8;i++){g.aiTeam(0);g.tick(12)}
const city=g.s.cities.find(c=>c.team===0);assert.ok(city);
g.refreshTerritory();
const rural=[...g.territory].map(([key,owner])=>({key,owner,p:{c:+key.split(':')[0],r:+key.split(':')[1]}})).find(x=>x.owner===city&&g.isCountyTile(x.p,city)&&g.cell(x.p).land&&!g.cell(x.p).mountain);
assert.ok(rural,'county has rural land');
const ctx=g.contextAt(rural.p,true);
assert.equal(ctx.economy.realms[0],city.economy.realms[0],'county shares resources and workers');
assert.match(g.buildRule(ctx,'house'),/Maakonnas/);
assert.doesNotMatch(g.buildRule(city,'house'),/Maakonn/);
ctx.economy.buildings.push(...[0,1,2].map(i=>({type:'well',x:i*15,z:0,hp:100,ready:i===0,team:0})));
assert.match(g.previewBuild(ctx,'well',{x:40,z:30}).error,/kuni 3/,'fourth order rejected before placement');
assert.equal(g.countySlots(ctx).used,3,'virtual hall does not count');
ctx.economy.buildings[1].hp=0;
assert.equal(g.countySlots(ctx).used,2);
assert.doesNotMatch(g.buildRule(ctx,'well'),/kuni 3/,'destroyed building frees a slot');
city.economy.realms[0].pop=64;g.refreshTerritory();
assert.equal(g.radius(city),4);
assert.ok([...g.territory.values()].filter(c=>c.id===city.id).length<=243);
// Save/load retains districts, stock and the limit without resetting the game.
const restored=new Civilization(JSON.parse(JSON.stringify(g.s)));
const saved=restored.s.cities.find(c=>c.id===city.id);
assert.equal(saved.districts[rural.key].economy.buildings.length,4);
assert.equal(saved.economy.realms[0].pop,64);
console.log('V126 PASS: county sizes, edge bounds, shared economy, urban/rural rules, queued slots, destroyed slots, growth and save/load');
