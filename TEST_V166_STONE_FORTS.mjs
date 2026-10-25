import assert from 'node:assert/strict';
import {Civilization,createGame,BUILDINGS} from './civilization-core.js';
import {stoneVillageWallPlan,stoneVillageDefenseEligibility,planStoneVillageDefenses} from './stone-village-defenses-v166.js';
import {Navigation} from './navigation.js';
const hall={type:'hall',hp:1200,ready:true,x:0,z:0};
const homes=[[-28,-17],[-12,-26],[15,-21],[29,13],[-24,20],[8,28]].map(([x,z])=>({type:'house',hp:350,ready:true,x,z}));
const study={type:'study',hp:350,ready:true,x:3,z:17};
const ring=stoneVillageWallPlan([hall,...homes,study],142023);
assert.equal(ring.gateOpenings,2);
assert.equal(ring.slots.filter(s=>s.type==='woodgate').length,2);
assert.equal(ring.slots.filter(s=>s.type==='watchtower').length,4);
assert.ok(ring.slots.filter(s=>s.type==='palisade').length>=24);
assert.equal(ring.slots.length,new Set(ring.slots.map(s=>s.x+':'+s.z)).size,'no duplicated construction sites');
assert.ok(ring.slots.every(p=>Math.abs(p.x)<110&&Math.abs(p.z)<89));
assert.deepEqual(ring.slots,stoneVillageWallPlan([hall,...homes,study],142023).slots,'persistent deterministic layout');
assert.ok(ring.slots.some(b=>b.type==='palisade'&&b.wallAxis===1),'side sections rotate');
assert.equal(BUILDINGS.woodgate.requires[0],'lumber');
assert.deepEqual(BUILDINGS.woodgate.cost,{wood:6});
assert.deepEqual(BUILDINGS.palisade.cost,{wood:4});
assert.ok(stoneVillageDefenseEligibility({age:0,pop:9,readyHouses:6,services:1,waiting:0,
 stock:{wood:90,stone:25,water:40,bread:45}}).ok);
assert.equal(stoneVillageDefenseEligibility({age:0,pop:4,readyHouses:6,services:1,waiting:0,
 stock:{wood:90,stone:25,water:40,bread:45}}).reason,'population');
assert.equal(stoneVillageDefenseEligibility({age:1,pop:20,readyHouses:6,services:1,waiting:0,
 stock:{wood:90,stone:25,water:40,bread:45}}).reason,'later-era');
// Navigation builds solid timber posts on either side but leaves the central path clear.
const gate={x:0,z:0,team:1,ready:true,hp:320,type:'woodgate',wallAxis:0};
const nav=new Navigation({resources:[],heat:{},heatLast:{},revision:0},()=>true,()=>[gate],{minX:-25,minZ:-25,w:51,h:51});
assert.equal(nav.open(0,0),true,'the wooden gate remains traversable');
assert.equal(nav.open(-3,0),false,'the gate is framed by real solid posts');
const vertical={...gate,wallAxis:1},navTurned=new Navigation({resources:[],heat:{},heatLast:{},revision:0},()=>true,()=>[vertical],{minX:-25,minZ:-25,w:51,h:51});
assert.equal(navTurned.open(0,0),true);
assert.equal(navTurned.open(0,3),false);
// A mock town proves real construction and resource payment, not a free instant model.
const resources={wood:150,stone:40,water:80,bread:90};
const city={id:1,team:1,economy:{realms:[{}, {pop:10,resources}],buildings:[hall,...homes,study]}};
const model={s:{time:1000,seed:142023,ages:[0,0],research:[{}, {known:['fortifications']}],units:[]},
 buildingDefinitions:BUILDINGS,allBuildings:ctx=>ctx.economy.buildings,
 buildRule:()=>'',previewBuild:()=>({}),
 build:(ctx,type,p)=>{const cost=BUILDINGS[type].cost;for(const [k,n]of Object.entries(cost))resources[k]-=n;
 const building={...p,type,ready:true,hp:350};ctx.economy.buildings.push(building);return {building};}};
planStoneVillageDefenses(model,1,city);
assert.equal(city.economy.buildings.at(-1).type,'woodgate','first construction creates a usable entrance');
assert.equal(resources.wood,144,'gate wood was actually deducted');
assert.equal(city.economy.buildings.at(-1).historicPalisadeV166,true);
model.s.time+=25;
planStoneVillageDefenses(model,1,city);
assert.equal(city.economy.buildings.at(-1).type,'woodgate','second opposing entrance follows');
assert.equal(resources.wood,138);
const completed=city.stoneDefensePlanV166.constructed;
resources.wood=10;model.s.time+=25;
planStoneVillageDefenses(model,1,city);
assert.equal(city.stoneDefensePlanV166.constructed,completed,'defense does not consume scarce construction timber');
// Real AI playthrough. Observe where each AI finishes Stone Age; do not inject resources.
const game=new Civilization(createGame(142023));
const eras={},forts=[],history=[];
for(let turn=1;turn<=70;turn++){
 for(let step=0;step<5;step++)game.tick(12);
 const list=game.s.cities.filter(c=>c.team>0).map(c=>({name:c.name,team:c.team,
  age:game.s.ages[c.team],pop:game.s.ages[c.team]>=0?Math.floor(c.economy.realms[c.team].pop):0,
  houses:game.allBuildings(c).filter(b=>b.type==='house'&&b.hp>0&&b.ready).length,
  walls:game.allBuildings(c).filter(b=>b.type==='palisade'&&b.hp>0).length,
  gates:game.allBuildings(c).filter(b=>b.type==='woodgate'&&b.hp>0).length,
  towers:game.allBuildings(c).filter(b=>b.type==='watchtower'&&b.hp>0).length,
  readyWalls:game.allBuildings(c).filter(b=>['palisade','woodgate','watchtower'].includes(b.type)&&b.hp>0&&b.ready).length,
  total: c.stoneDefensePlanV166?.slots.length||0,
  status:c.aiStoneDefenseStatusV166?.reason||null,
  stocks:{wood:Math.round(c.economy.realms[c.team].resources.wood||0),stone:Math.round(c.economy.realms[c.team].resources.stone||0)}
 }));
 for(const team of [1,2,3])if(eras[team]==null&&game.s.ages[team]>0)eras[team]=turn;
 if([25,35,45,55,70].includes(turn)){const item={turn,ages:game.s.ages.slice(1),list};history.push(item);console.log('V166 AI TOWN',JSON.stringify(item));}
 if(turn===70)forts.push(...list);
}
console.log('V166 STONE DEFENSES PASS',JSON.stringify({planSlots:ring.slots.length,firstBronze:eras,towns:forts,checkpoints:history.length}));
