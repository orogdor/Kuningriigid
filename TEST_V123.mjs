import assert from 'node:assert/strict';
import {TECHS,techBlock,newResearch,grantTech} from './research.js?v=118a';
import {progressiveResearchIds} from './research-preview-v123.js';
import {verticalResearchLayout,VERTICAL_TREE} from './tech-tree-layout-v119.js?v=119a';
import {V118_ERA_IDS} from './tech-tree-data-v118.js?v=118a';
import {DETAIL_X,DETAIL_Z,DETAIL_TILE_X,DETAIL_TILE_Z,DETAIL_HALF_X,DETAIL_HALF_Z,tileDelta,localTilePoint} from './detail-scale-v123.js';
import {localToWorld,worldToLocal,localSurface,surface} from './continuous-landscape.js';
import {detailHeight} from './world-details.js';
import {Civilization,createGame} from './civilization-core.js';
import {BATTLEFIELD} from './battlefield-v88.js';
const available=(id,r)=>!techBlock(r,id);
const start=newResearch(),initial=progressiveResearchIds(TECHS,start,available);
assert.ok(initial.present.has('stone_tools'),'Stone tools must be available');
assert.ok(initial.previews.has('water'),'Water is shown as one-step grey preview');
assert.ok(!initial.present.has('water'),'Preview is still locked');
assert.ok(!initial.ids.includes('modernity'),'Far future hidden');
assert.ok(initial.previews.get('water').includes('stone_tools'));
const planned=newResearch();
grantTech(planned,'stone_tools');
const next=progressiveResearchIds(TECHS,planned,available);
assert.ok(next.present.has('water'),'Grey preview becomes real option upon discovering prerequisite');
assert.ok(!next.previews.has('water'));
for(const [id,unlocks] of initial.previews) {
 assert.ok(unlocks.length>0);
 assert.ok(!available(id,start),'No already available tech is grey');
 for(const prerequisite of unlocks) {
  const simulated={...start,known:[...start.known,prerequisite],active:null,v118LegacyActive:null};
  assert.equal(techBlock(simulated,id),'','Preview is genuinely unlocked by one next research '+id);
 }
}
const layout=verticalResearchLayout(TECHS,initial.ids,7,V118_ERA_IDS,2);
for(const edge of layout.edges){
 const a=layout.positions.get(edge.from),b=layout.positions.get(edge.to);
 assert.ok(a&&b&&a.y+VERTICAL_TREE.nodeHeight<b.y,'Arrows must point down');
}
assert.equal(DETAIL_X,4.5);assert.equal(DETAIL_Z,3.9);
assert.equal(DETAIL_TILE_X,225);assert.equal(DETAIL_TILE_Z,195);
assert.deepEqual(tileDelta(DETAIL_HALF_X+.1,0),{dc:1,dr:0});
assert.deepEqual(tileDelta(-DETAIL_HALF_X-.1,0),{dc:-1,dr:0});
assert.deepEqual(tileDelta(0,DETAIL_HALF_Z+.1),{dc:0,dr:1});
assert.deepEqual(localTilePoint(225,195,1,1),{x:0,z:0});
assert.equal(BATTLEFIELD.tileWidth,225);assert.equal(BATTLEFIELD.tileDepth,195);
const game=new Civilization(createGame(12345));
const origin=game.cell(game.startLocations[0]);
for(const [x,z] of [[0,0],[112.5,0],[-112.5,25],[0,97.5],[70,-85]]){
 const p=localToWorld(origin,x,z),back=worldToLocal(origin,p.x,p.z);
 assert.ok(Math.abs(back.x-x)<1e-7&&Math.abs(back.z-z)<1e-7);
 const world=surface(game,p.x,p.z);
 assert.ok(Math.abs(localSurface(game,origin,x,z)-(world-.7)*.30)<1e-7);
}
const right=game.cell({c:origin.c+1,r:origin.r});
if(right)for(const z of [-50,0,50]){
 assert.ok(Math.abs(localSurface(game,origin,DETAIL_HALF_X,z)-localSurface(game,right,-DETAIL_HALF_X,z))<1e-7,'No terrain seams');
}
const nav=game.nav(origin);
assert.ok(nav.w>=219&&nav.h>=189,'Citizen pathfinding covers expanded tile');
assert.ok(nav.index(95,75)>=0,'New outer buildable land is in the navigation grid');
assert.ok(nav.index(140,0)<0,'Navigation does not extend beyond the coastal safety margin');
const before={...game.s.cities[0]?.economy?.buildings?.[0]};
assert.ok(game.s.version===4);
assert.ok(!game.s.cities.length||game.s.cities[0].economy.buildings[0].type===before.type,'Old buildings retained');
console.log('V123 PASS: immediate grey previews only, accurate next unlocks, 1.5x tile dimensions, stitched terrain, citizens and battle grid, V4 saves.');
