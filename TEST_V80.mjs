import assert from 'node:assert/strict';
import {createMedievalDemoState,MEDIEVAL_DEMO_NAME} from './medieval-demo-v80.js';
import {MEDIEVAL_TYPES,createMedievalBuilding} from './medieval-buildings-v80.js';
import {Civilization} from './civilization-core.js';
const s=createMedievalDemoState(),g=new Civilization(s),city=s.cities.find(c=>c.team===0);
assert.equal(city.name,MEDIEVAL_DEMO_NAME);assert.equal(s.ages[0],3);
const buildings=city.economy.buildings.filter(b=>MEDIEVAL_TYPES.includes(b.type));
assert.ok(buildings.length>=24);
for(const b of buildings){const model=createMedievalBuilding(b.type,0);assert.ok(model?.userData.medievalAgeModel,b.type)}
const nav=g.nav(city),roads=Object.keys(city.world.heat||{}).map(Number).filter(k=>nav.roadLevel(k)>0);
assert.ok(roads.length>10,'demo must have organically worn roads');
const one={resources:[],heat:{},heatLast:{},trailTime:0};
const {Navigation}=await import('./navigation.js');const n=new Navigation(one,()=>true);
n.recordTraffic({x:-10,z:0},{x:10,z:0});
assert.equal(n.roadLevel(n.index(0,0)),0,'single walk should not show road');
for(let i=0;i<9;i++)n.recordTraffic({x:-10,z:0},{x:10,z:0});
for(let x=-9;x<10;x++)assert.ok(n.roadLevel(n.index(x,0))>0,'road gap at '+x);
console.log('V80 PASS '+JSON.stringify({buildings:buildings.length,roadCells:roads.length,age:s.ages[0],name:city.name}));

const {buildingClearance}=await import('./navigation.js');
const {seedCityStreetNetwork,streetConnections}=await import('./town-streets-v80.js');
const {createBronzeDemoState}=await import('./bronze-demo-v79.js?v=80c');
const {createDetailTrailLinks}=await import('./detail-roads.js');
const {createAgeBuilding}=await import('./buildings.js');
const bronze=new Civilization(createBronzeDemoState());
const bronzeCity=bronze.s.cities.find(c=>c.team===0),bn=bronze.nav(bronzeCity);
const bronzePlan=streetConnections(bronzeCity.economy.buildings);
assert.ok(bronzePlan.length>=30,'an interlinked city needs dozens of street segments');
const vizSites=bronzeCity.economy.buildings.filter(b=>b.ready&&!b.virtual);
const visibleKeys=Object.keys(bronzeCity.world.heat).map(Number).filter(i=>bn.roadLevel(i)>0&&bn.open(bn.point(i).x,bn.point(i).z));
assert.ok(visibleKeys.length>=35,'multiple travelled streets appear in bronze showcase');
for(const key of visibleKeys){
 const p=bn.point(key);
 for(const b of vizSites){
  const c=buildingClearance(b);if(!c)continue;
  assert.ok(Math.abs(p.x-b.x)>c.rx||Math.abs(p.z-b.z)>c.rz,
   'visible road cell must avoid solid/protruding building: '+b.type+' at '+JSON.stringify(p));
 }
}
const ribbons=createDetailTrailLinks(visibleKeys.map(key=>({key,heat:bn.roadStrength(key)})),bn,()=>0);
let triangles=0;
for(const mesh of ribbons.children){
 const pos=mesh.geometry.getAttribute('position');triangles+=pos.count/3;
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i);
  for(const b of vizSites){
   const f=buildingClearance(b);if(!f)continue;
   assert.ok(Math.abs(x-b.x)>f.rx-.65||Math.abs(z-b.z)>f.rz-.65,
    'rendered road ribbon must not cross a building: '+b.type+' ('+x+','+z+')');
  }
 }
}
assert.ok(triangles>20,'the street graph should render as many linked ribbons');
const managed=new Navigation({resources:[],heat:{},heatLast:{},trailTime:0,revision:0},
 ()=>true,()=>[{type:'house',x:0,z:0,ready:true,hp:1000}]);
assert.equal(managed.open(3,0),false,'house edge, porch and props excluded');
assert.equal(managed.open(6,0),true,'public road corridor remains walkable');
const actor={x:-7,z:0};
for(let i=0;i<300;i++)managed.move(actor,{x:7,z:0},.1,3);
for(const key of Object.keys(managed.world.heat)){
 const p=managed.point(Number(key)),f=buildingClearance({type:'house'});
 assert.ok(Math.abs(p.x)>f.rx||Math.abs(p.z)>f.rz,'pedestrians cannot deposit wear inside a house');
}
const medievalModel=createAgeBuilding('hall',0,3);
assert.equal(medievalModel.userData.medievalAgeModel,true,'Medieval architecture activates at age 3');
const ironModel=createAgeBuilding('hall',0,2);
assert.notEqual(ironModel.userData.medievalAgeModel,true,'Iron Age must not inherit medieval architecture');
console.log('V80 ROAD NETWORK PASS '+JSON.stringify({links:bronzePlan.length,visibleCells:visibleKeys.length,triangles,medievalAge:s.ages[0]}));
