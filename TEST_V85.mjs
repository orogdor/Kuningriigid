import assert from 'node:assert/strict';
import {Civilization,createGame} from './civilization-core.js';
import {createRiverNetwork,disposeNetwork} from './continuous-landscape-visual.js';
import {createMountainOutcrops} from './landscape-polish-v84.js';
import {createDetailBorders} from './detail-borders-v85.js';
import {getRivers,worldToLocal,projectHeight} from './continuous-landscape.js';
for(const seed of [8417,17]){
 const g=new Civilization(createGame(seed)),tile=getRivers(g).find(e=>e.c.land).c;
 const state=JSON.stringify(g.s),river=createRiverNetwork(g,'detail',tile);
 const water=river.getObjectByName('continuous water surface'),pos=water.geometry.attributes.position;
 assert.ok(pos.count>100);for(const v of pos.array)assert.ok(Number.isFinite(v));
 // A shared x/z position may never have two water heights at a confluence.
 const heights=new Map();for(let i=0;i<pos.count;i++){const k=pos.getX(i).toFixed(3)+':'+pos.getZ(i).toFixed(3),y=pos.getY(i);if(heights.has(k))assert.ok(Math.abs(heights.get(k)-y)<.003);heights.set(k,y)}
 const mountain=g.cells.find(c=>c.mountain),rocks=createMountainOutcrops(g,'detail',mountain);
 assert.ok(rocks.userData.outcropCount>0);assert.ok(!rocks.children[0].isInstancedMesh,'cliff feet individually fit the terrain instead of scaling a cone');
 assert.equal(JSON.stringify(g.s),state,'rendering leaves campaign state intact');
 // A single owned tile with a neighbouring district has six outer edges,
 // never a boundary through the middle of the same city.
 const c=tile,adjacent=g.cell({c:c.c+1,r:c.r}),city={id:900,team:0};
 const owners=new Map([[c.c+':'+c.r,city],[adjacent.c+':'+adjacent.r,city]]);
 const fake={...g,cells:[c,adjacent],territory:owners,refreshTerritory(){},seen(){return true},atlasHeight:(x,z)=>g.atlasHeight(x,z),cell:p=>g.cell(p)};
 const border=createDetailBorders(fake,c);
 assert.equal(border.children[0].geometry.attributes.position.count,6*50*6,'only exterior edges rendered');
 assert.equal(border.userData.borderTeams,1);
 for(const net of [river,rocks,border])disposeNetwork(net);
 console.log('V85 PASS',seed,{riverVertices:pos.count});
}
