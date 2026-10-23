import assert from 'node:assert/strict';
import {BUILDINGS} from './civilization-core.js';
import {planAIDefenses,defenseEligibility} from './ai-defenses-v128.js';
import {canAfford} from './economy.js';
const stock={wood:500,stone:800,cutstone:500,plank:400,water:100,grain:150,meat:120,gold:1500};
const buildings=[
 {type:'hall',x:0,z:0,ready:true,hp:1200},
 ...[[-12,-10],[12,-10],[-12,10],[12,10]].map(([x,z])=>({type:'house',x,z,ready:true,hp:350})),
 {type:'quarry',x:-20,z:0,ready:true,hp:350},
 {type:'market',x:0,z:18,ready:true,hp:350},
 {type:'well',x:0,z:-18,ready:true,hp:350}
];
const team=1,city={id:4,team,economy:{buildings,realms:{1:{pop:20,resources:stock}}}};
const built=[];
const game={s:{time:120,seed:142023,ages:[0,3],research:[{}, {known:['masonry','stone_fortifications','fortifications']}]},
 buildingDefinitions:BUILDINGS,allBuildings:()=>buildings,
 canBuildNow:(c,type)=>!game.buildRule(c,type)&&canAfford(stock,BUILDINGS[type]?.cost||{}),
 buildingSites:()=>[{x:20,z:22},{x:25,z:25}],
 previewBuild:(c,type,p)=>game.buildRule(c,type)?{error:game.buildRule(c,type)}:{ok:true},
 buildRule:(c,type)=>{
  if(type==='mason'&&!buildings.some(b=>b.type==='quarry'&&b.ready))return 'Vaja: Kivimurd';
  if(type==='stonewall'&&!buildings.some(b=>b.type==='mason'&&b.ready))return 'Vaja: Kiviraidur';
  if(['stonetower','gatehouse','reinforced_wall'].includes(type)&&!buildings.some(b=>b.type==='stonewall'&&b.ready))return 'Vaja: Madal kivivall';
  return '';
 },
 build:(c,type,p)=>{
  const cost=BUILDINGS[type]?.cost||{};
  if(!canAfford(stock,cost))return {error:'No materials'};
  for(const [k,n]of Object.entries(cost))stock[k]-=n;
  const b={type,x:p.x,z:p.z,wallAxis:p.wallAxis,ready:true,hp:350};
  buildings.push(b);built.push(b);
  return {building:b};
 }
};
function advance(){planAIDefenses(game,team,city);game.s.time+=48;}
assert.equal(defenseEligibility({population:20,readyHouses:4,services:2,waiting:0,stock}).ok,true);
advance();assert.equal(built[0]?.type,'mason','The actual masonry chain must be built first');
advance();assert.equal(built[1]?.type,'stonewall','A stone wall must precede dependent towers/gates');
advance();assert.equal(built[2]?.type,'gatehouse','A gate can be placed only after a completed stone wall');
assert.ok(city.defensePlanV139?.slots?.length>4,'Historic perimeter persists in save');
assert.ok(city.defensePlanV139.constructed>=2,'Two real fortification builds placed');
assert.ok(built.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.z)));
assert.ok(!built.some((b,i)=>built.some((other,j)=>j<i&&b.type!=='mason'&&other.type!=='mason'&&Math.hypot(b.x-other.x,b.z-other.z)<5)));
const poor={...stock,wood:5},r=defenseEligibility({population:20,readyHouses:4,services:2,waiting:0,stock:poor});
assert.equal(r.ok,false,'Defenses never override subsistence material reserve');
console.log('V147 DEFENSE PASS: real mason before wall, real wall before gate, no overlaps, no free resources');
