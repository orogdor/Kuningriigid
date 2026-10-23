import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DETAIL_TILE_X,DETAIL_TILE_Z,DETAIL_HALF_X,DETAIL_HALF_Z} from './detail-scale-v123.js';
import {ancientStreetSpace,historicalBuildingPlots,nextPlotBatch,urbanExpansionEligible} from './historic-urban-v138.js';
import {historicalTilePriority} from './historical-districts-v137.js';
import {Civilization} from './civilization-core.js';
const town={id:4,c:48,r:57},seed=138043;
const core=historicalBuildingPlots(town,town,'house',seed);
assert.ok(core.length>75,'town should have enough candidate parcels to fill an entire detail square');
assert.ok(core.some(p=>p.x>92)&&core.some(p=>p.x< -92),'lots reach both east and west tile edges');
assert.ok(core.some(p=>p.z>78)&&core.some(p=>p.z< -78),'lots reach both north and south tile edges');
assert.ok(core.every(p=>Math.abs(p.x)<=DETAIL_HALF_X-8&&Math.abs(p.z)<=DETAIL_HALF_Z-8),'roofs do not spill across a different detail tile');
assert.ok(new Set(core.map(p=>p.x+':'+p.z)).size===core.length,'plots do not duplicate positions');
const east={...town,c:town.c+1},north={...town,r:town.r+1};
const eastPlots=historicalBuildingPlots(east,town,'house',seed),northPlots=historicalBuildingPlots(north,town,'house',seed);
assert.ok(eastPlots.some(p=>p.x< -92),'neighboring eastern square develops from its shared border');
assert.ok(northPlots.some(p=>p.z< -78),'neighboring northern square develops from its shared border');
for(const x of [0,48,112,224])for(const z of [0,31,97,205]){
 const a=ancientStreetSpace(x,z,seed),b=ancientStreetSpace(x+DETAIL_TILE_X-DETAIL_TILE_X,z,seed);
 assert.deepEqual(a,b,'global historic road coordinates stable across tiles');
}
const first=nextPlotBatch(core,0,25),later=nextPlotBatch(core,25,25);
assert.equal(first.length,25);assert.equal(later.length,25);assert.notDeepEqual(first,later,'search advances to unoccupied edge parcels instead of endlessly retrying its centre');
assert.ok(historicalTilePriority(town,{...town,land:true,deposits:{}},true,5)>historicalTilePriority(town,east,true,0),'urban planner fills an occupied block before founding a disconnected new one');
const game=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-city-v137.json'))),city=game.s.cities.find(c=>c.team===0);
const area=game.constructionArea(city);
assert.ok(area.tiles.length>8);
const old=game.buildingSites(city,'house');
assert.ok(old.length>75);
assert.ok(old.some(p=>p.x>90&&p.z>40),'engine uses V138 plot planner all the way to the detail tile edge');
const count=game.allBuildings(city).length;
game.developOwnedCityTiles(city);
assert.ok(game.allBuildings(city).length>=count,'AI expansion should never erase existing houses');
assert.ok(Number.isFinite(city.aiTerritoryCursorV137));
const candidate=area.tiles.find(p=>Math.abs(p.c-city.c)+Math.abs(p.r-city.r)===2&&game.cell(p)?.land);
if(candidate){const ctx=game.contextAt(candidate,true);const before=ctx.urbanExpansionV138||false;game.isCountyTile(candidate,city);assert.equal(!!ctx.urbanExpansionV138,before,'reading city ownership never mutates urbanization');}
console.log('V138 PASS: dense ancient blocks, full tile edges, continuous road geometry, neighbor parcels, progressive AI expansion');
