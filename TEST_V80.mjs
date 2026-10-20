import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import * as T from './vendor/three.module.js';
import {createMedievalDemoState,MEDIEVAL_DEMO_NAME} from './medieval-demo-v80.js?v=80b';
import {createBronzeDemoState} from './bronze-demo-v79.js?v=80a';
import {MEDIEVAL_TYPES,createMedievalBuilding} from './medieval-buildings-v80.js?v=80a';
import {createAgeBuilding} from './buildings.js';
import {Civilization} from './civilization-core.js?v=80a';
import {Navigation,buildingFootprint} from './navigation.js?v=80a';
import {createDetailTrailLinks} from './detail-roads.js?v=80a';
import {urbanTrafficPairs,simulateUrbanHistory} from './urban-roads-v80.js?v=80a';

const demo=createMedievalDemoState(),g=new Civilization(structuredClone(demo)),city=g.s.cities.find(c=>c.team===0);
assert.equal(city.name,MEDIEVAL_DEMO_NAME);
assert.equal(demo.version,4);
assert.equal(g.upgrade(0),3,'medieval must use actual Age 3 (not Iron Age 2)');
assert.equal(g.s.ages[0],3);
assert.ok(g.s.research[0].known.includes('medieval_crafts'),'medieval tech must be truly unlocked');
const buildings=city.economy.buildings.filter(b=>MEDIEVAL_TYPES.includes(b.type));
assert.ok(buildings.length>=30,'medieval buildings are ready and placed');
assert.ok(buildings.filter(b=>b.type==='house').length>=4,'enough houses to test roads and shoppers');
assert.equal(new Set(buildings.map(b=>b.type)).size,MEDIEVAL_TYPES.length);
const meshCounts=[];
for(const type of MEDIEVAL_TYPES){
 const mesh=createAgeBuilding(type,0,3);
 assert.equal(mesh.userData.medievalAgeModel,true,'medieval mesh in real building render pipeline '+type);
 const bounds=new T.Box3().setFromObject(mesh).getSize(new T.Vector3());
 assert.ok(bounds.x>2&&bounds.y>2&&bounds.z>2,'model has real 3D geometry '+type);
 meshCounts.push({type,width:bounds.x,height:bounds.y,depth:bounds.z});
}
assert.notEqual(createAgeBuilding('hall',0,2).userData.medievalAgeModel,true,'iron age models unchanged');

const nav=g.nav(city);
const roadCells=Object.keys(city.world.heat||{}).map(Number).filter(id=>nav.roadLevel(id)>0&&nav.open(nav.point(id).x,nav.point(id).z));
assert.ok(roadCells.length>=80,'real city has network of footpaths, not single market line ('+roadCells.length+')');
const roadLocations=roadCells.map(id=>nav.point(id));
const roadX=Math.max(...roadLocations.map(p=>p.x))-Math.min(...roadLocations.map(p=>p.x));
const roadZ=Math.max(...roadLocations.map(p=>p.z))-Math.min(...roadLocations.map(p=>p.z));
assert.ok(roadX>=20&&roadZ>=20,'road network covers both map axes ('+roadX+' x '+roadZ+')');
const trail=createDetailTrailLinks(roadCells.map(key=>({key})),nav,()=>0);
const verts=trail.children[0]?.geometry.attributes.position;
assert.ok(verts?.count>=100,'visible continuous road ribbon network');
for(let i=0;i<verts.count;i++){
 const x=verts.getX(i),z=verts.getZ(i);
 assert.ok(nav.roadMargin(x,z)>=-.001,'visible road triangle must stay outside building rectangle');
}
for(const b of city.economy.buildings){
 const footprint=buildingFootprint(b);
 assert.equal(nav.open(b.x,b.z),false,'buildings block navigation centre '+b.type);
 assert.ok(footprint.x>=3.7&&footprint.z>=3.55,'all structures respect visual footprint');
}
const layout=urbanTrafficPairs(city.economy.buildings);
assert.equal(layout.list.length,city.economy.buildings.filter(b=>b.ready).length);
assert.ok(layout.pairs.length>=layout.list.length,'street connections form more than isolated routes');
const bronze=createBronzeDemoState();
const bronzeGame=new Civilization(bronze),bronzeTown=bronzeGame.s.cities[0];
const bronzeNav=bronzeGame.nav(bronzeTown);
const bronzeRoads=Object.keys(bronzeTown.world.heat||{}).map(Number).filter(id=>bronzeNav.roadLevel(id)>0&&bronzeNav.open(bronzeNav.point(id).x,bronzeNav.point(id).z));
assert.ok(bronzeRoads.length>=65,'Bronze demo updated to whole-town streets, not 3 houses ('+bronzeRoads.length+')');
// One stroll remains invisible. Repeated visits build the street.
const w={resources:[],heat:{},heatLast:{},trailTime:0},n=new Navigation(w,()=>true);
n.recordTraffic({x:-10,z:0},{x:10,z:0});
assert.equal(n.roadLevel(n.index(0,0)),0);
for(let i=0;i<9;i++)n.recordTraffic({x:-10,z:0},{x:10,z:0});
for(let x=-9;x<10;x++)assert.ok(n.roadLevel(n.index(x,0))>0,'no holes in traffic heat '+x);
mkdirSync('artifacts-v80',{recursive:true});
writeFileSync('artifacts-v80/Kuningriigid_V80_Keskaeg.json',JSON.stringify(demo));
writeFileSync('artifacts-v80/Medieval_road_report.json',JSON.stringify({medievalBuildings:buildings.length,roadCells:roadCells.length,roadX,roadZ,roadTriangles:verts.count/3,bronzeRoadCells:bronzeRoads.length,models:meshCounts},null,2));
console.log('V80 MODEL AND STREET PASS '+JSON.stringify({medievalBuildings:buildings.length,roadCells:roadCells.length,roadX,roadZ,roadTriangles:verts.count/3,bronzeRoadCells:bronzeRoads.length,age:g.upgrade(0)}));
