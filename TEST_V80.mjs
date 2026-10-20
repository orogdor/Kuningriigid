import assert from 'node:assert/strict';
import {createMedievalDemoState,MEDIEVAL_DEMO_NAME} from './medieval-demo-v80.js';
import {MEDIEVAL_TYPES,createMedievalBuilding} from './medieval-buildings-v80.js';
import {Civilization} from './civilization-core.js';
const s=createMedievalDemoState(),g=new Civilization(s),city=s.cities.find(c=>c.team===0);
assert.equal(city.name,MEDIEVAL_DEMO_NAME);assert.equal(s.ages[0],2);
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
