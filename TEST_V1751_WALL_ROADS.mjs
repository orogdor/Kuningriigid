// V175.1 — real long palisades block soldiers, preserve gate traversal,
// and clip paved geometry. Old V4 village saves repair on first load.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Navigation,buildingClearance} from './navigation.js';
import {configureWallFootprint} from './fortifications.js';
import {stoneVillageWallPlan} from './stone-village-defenses-v166.js';
import {roadRibbonClearV175} from './continuous-landscape-visual.js';
import {createBronzeCityModel} from './bronze-city-v111.js';
import {Civilization} from './civilization-core.js';
import {roadStrength,roadLevel,recordWorldStep} from './roads.js';

const centre={type:'hall',x:0,z:0,hp:500,ready:true};
const plan=stoneVillageWallPlan([centre,{type:'house',x:12,z:10,hp:250},
 {type:'house',x:-12,z:-10,hp:250}],175);
const walls=plan.slots.map(p=>({...p,ready:true,hp:400,team:0,
 extendedPalisadeV166:p.type==='woodgate',navWidth:p.type==='palisade'?3.6:undefined,
 navDepth:p.type==='palisade'?1.1:undefined}));
const longs=walls.filter(w=>w.type==='palisade'&&w.palisadeSpanV167>=12);
assert.ok(longs.length>6);
for(const w of longs){
 // Simulate the actual old bug: a 28–42m wall saved with just 7m nav metadata.
 const repaired=buildingClearance(w),half=w.palisadeSpanV167/2;
 if(w.wallAxis)assert.ok(repaired.rz>half,'vertical long segment blocked in full');
 else assert.ok(repaired.rx>half,'horizontal long segment blocked in full');
 configureWallFootprint(w);
 const actual=buildingClearance(w);
 assert.ok(w.wallAxis?actual.rz>half:actual.rx>half,'config never shrinks the paid segment');
}
const world={resources:[],heat:{},heatLast:{},revision:0,trailTime:0};
const makeNav=(bs)=>new Navigation({resources:[],heat:{},heatLast:{},revision:0,trailTime:0},
 ()=>true,()=>bs,{minX:-112,minZ:-112,w:225,h:225});
const nav=makeNav(walls);
for(const w of longs){
 for(const f of [-.94,-.65,0,.65,.94]){
  const offset=f*w.palisadeSpanV167/2;
  const x=w.x+(w.wallAxis?0:offset),z=w.z+(w.wallAxis?offset:0);
  assert.equal(nav.open(x,z),false,'soldiers cannot cross any point on long palisade '+JSON.stringify({w,x,z}));
 }
}
const gates=walls.filter(w=>w.type==='woodgate');
assert.equal(gates.length,2);
for(const gate of gates)assert.equal(nav.open(gate.x,gate.z),true,'gate center remains traversable');
assert.equal(nav.open(plan.rx,0),false,'side wall is solid');
assert.equal(nav.open(0,plan.rz),true,'north/south entrance open');
const path=nav.route({x:0,z:0},{x:0,z:plan.rz+15},{preferRoads:false});
assert.ok(path?.length>2,'a squad routes from the town through the actual gate');
assert.ok(path.every(p=>nav.open(p.x,p.z)),'squad never crosses a wall cell');
const closed=walls.map(w=>({...w}));
for(const g of gates)closed.push({type:'palisade',x:g.x,z:g.z,wallAxis:g.wallAxis,
 palisadeSpanV167:14,navWidth:7.4,navDepth:1.2,hp:400,ready:true});
const noGate=makeNav(closed);
assert.equal(noGate.reachable({x:0,z:0},{x:0,z:plan.rz+15}),false,
 'a fully closed ring has NO route for soldiers');
const rotated=makeNav([{type:'woodgate',x:0,z:0,wallAxis:1,
 extendedPalisadeV166:true,ready:true,hp:250}]);
assert.equal(rotated.open(0,0),true,'rotated gate remains open');
assert.equal(rotated.open(0,5),false,'rotated side posts block the right positions');
assert.equal(rotated.open(5,0),true,'rotated gate permits normal cross-flow');

// Main world roads exist only after movement. Road painting cannot overlap
// physical wall footprints, but the actual opening is not covered.
const barriers=walls.filter(b=>b.type==='palisade'||b.type==='watchtower')
 .map(b=>{const f=buildingClearance(b);return [b.x,b.z,f.rx,f.rz];});
assert.equal(roadRibbonClearV175({x:0,z:plan.rz-12},{x:0,z:plan.rz+12},barriers),true,
 'open gateway corridor may display an actual worn road');
assert.equal(roadRibbonClearV175({x:plan.rx-12,z:0},{x:plan.rx+12,z:0},barriers),false,
 'world-road ribbon is clipped at impassable side wall');
const edge={time:10,worldRoads:{},roadRevision:0},a={c:4,r:4},b={c:5,r:4};
recordWorldStep(edge,a,b,'army',10);
assert.equal(roadLevel(roadStrength(edge,a,b,10)),0);
for(let i=0;i<3;i++)recordWorldStep(edge,a,b,'army',10);
assert.ok(roadLevel(roadStrength(edge,a,b,10))>=1,'auto road formation unchanged');

const source=JSON.parse(fs.readFileSync('scenarios/ai-stone-v174.json','utf8'));
const game=new Civilization(source);
const town=game.s.cities.find(x=>x.id===game.s.stoneTestV174?.targetCityId);
assert.equal(town?.team,0);
const actualWalls=town.economy.buildings.filter(w=>w.type==='palisade'&&w.hp>0);
assert.ok(actualWalls.length>=10);
const actualNav=game.nav(town);
let inspected=0;
for(const wall of actualWalls){const size=buildingClearance(w);
 if(w.palisadeSpanV167>=12){
  const half=wall.palisadeSpanV167/2;
  assert.ok(wall.wallAxis?size.rz>half:size.rx>half,'real saved wall has long collision');
  for(const fraction of [-.75,-.25,.25,.75]){
   const d=fraction*half;
   assert.equal(actualNav.open(wall.x+(wall.wallAxis?0:d),wall.z+(wall.wallAxis?d:0)),false,
    'saved city wall cannot be walked through');
   inspected++;
  }
 }
}
assert.ok(inspected>=24,'real AI stone village samples long wall sections');
const roadHeat=JSON.stringify(town.world.heat),count=Object.keys(town.world.heat).length;
assert.ok(count>10,'real traffic-driven paths exist');
game.buildingSites(town,'house');
assert.equal(JSON.stringify(town.world.heat),roadHeat,'AI construction preview leaves traffic unchanged');

const palisade=createBronzeCityModel('palisade',0,0);
const coords=[];palisade.traverse(m=>{if(!m.isMesh)return;const attr=m.geometry.getAttribute('position');
 for(let i=0;i<attr.count;i++)coords.push([attr.getX(i),attr.getZ(i)]);});
assert.ok(coords.length>300,'actual used palisade has visible stake detail');
assert.ok(Math.min(...coords.map(x=>x[0]))<-3.5&&Math.max(...coords.map(x=>x[0]))>3.5,
 'actual palisade end stakes reach both endpoints');
assert.ok(Math.max(...coords.map(x=>Math.abs(x[1])))<1.1,
 'prehistoric wall is one tight row of pointed posts, not two separated walls');

console.log('V175.1 FORTIFIED ROAD AND SOLDIER NAV PASS '+JSON.stringify({
 longSegments:longs.length,realVillageWalls:actualWalls.length,
 testedSolidWallPoints:inspected,realRoadHeatCells:count,
 gateRouteWaypoints:path.length,modelVertices:coords.length
}));
