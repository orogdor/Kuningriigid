import {createAgeBuilding} from './buildings.js?v=87a';
import assert from 'node:assert/strict';
import {cityNeeds,NEEDS,GOODS,GOOD_BUILDINGS,seedGoods,nationalStock} from './city-needs-v87.js';
import {relation,setRelation,atWar,blockMerchants,tickDiplomacy} from './diplomacy-v87.js';
import {merchantRoute,planMerchants,advanceMerchant,receiveMerchant,MERCHANT_RANGE} from './merchant-v87.js';
import {takeFood,BUILDINGS,START,initialState,tickEconomy,canAfford,spendResources} from './economy.js';
import {Civilization,createGame} from './civilization-core.js?v=87a';
const city=(id,c,team=0,resources={})=>({id,c,r:0,team,economy:{realms:Array.from({length:4},()=>({pop:3,resources:{...START,wood:0,stone:0,bread:0,water:0,...resources}})),buildings:[{type:'hall',ready:true,hp:100,team}]}});
const a=city(0,0),b=city(1,20),stop=city(2,40),end=city(3,60);
const path=(a,b)=>Array.from({length:Math.abs(b.c-a.c)},(_,i)=>({c:a.c+Math.sign(b.c-a.c)*(i+1),r:0}));
const s={seed:12,time:0,cities:[a,b,stop,end],ages:[0,0,0,0],shipments:[],nextShipment:0,research:Array.from({length:4},()=>({known:[]}))};
const g={s,contexts:c=>[c],landPath:path,allBuildings:c=>c.economy.buildings,buildingDefinitions:BUILDINGS,storageCap:()=>1000,storageUsed:(c,k,r)=>r[k]||0,cell:p=>({land:true}),canTraverse:()=>true};
assert.equal(relation(s,0,1),'neutral');assert.equal(atWar(s,0,1),false);
assert.equal(cityNeeds(a,0).productivity,.9);Object.assign(a.economy.realms[0].resources,{meat:10,fish:10});assert.equal(cityNeeds(a,0).productivity,1);
a.economy.realms[0].resources.berries=10;assert.equal(cityNeeds(a,0).productivity,1.02);
for(let age=0;age<7;age++){assert.ok(Object.values(GOODS).filter(d=>d.food&&d.age<=age).length+1>=NEEDS[age].food);assert.ok(Object.values(GOODS).filter(d=>d.luxury&&d.age<=age).length+(age>=1?1:0)>=NEEDS[age].luxury);}
assert.equal(canAfford({grain:6},{grain:5,bread:4}),false,'explicit raw food and generic meals cannot spend the same stock twice');
const armyFood={meat:10,fish:10,bread:0};assert.ok(canAfford(armyFood,{bread:15}));spendResources(armyFood,{bread:15});assert.equal(armyFood.meat+armyFood.fish,5);assert.equal(armyFood.bread,0,'generic food cost never makes bread negative');
const r={meat:3,fish:2};assert.equal(takeFood(r,4),4);assert.equal(r.meat+r.fish,1);
let route=merchantRoute(g,a,end,0);assert.equal(route.length,3);assert.ok(route.every(l=>l.path.length<=MERCHANT_RANGE.road));s.cities=[a,end];assert.equal(merchantRoute(g,a,end,0),null,'range cannot be bypassed');
s.cities=[a,b];Object.assign(a.economy.realms[0].resources,{wood:0,meat:40});assert.equal(planMerchants(g),1);let cargo=s.shipments[0];assert.equal(b.economy.realms[0].resources.meat,0,'no teleport at dispatch');assert.equal(cargo.fees.length,1);const sent=cargo.goods.meat;advanceMerchant(g,cargo,4);assert.equal(cargo.c,1);assert.equal(b.economy.realms[0].resources.meat,0);advanceMerchant(g,cargo,100);receiveMerchant(g,cargo);assert.ok(Math.abs(b.economy.realms[0].resources.meat-sent)<1e-6,'destination fee and delivery together conserve arriving cargo');assert.equal(cargo.fees.length,2);
const before=b.economy.realms[0].resources.meat;receiveMerchant(g,cargo);assert.equal(b.economy.realms[0].resources.meat,before,'no second arrival fee');
s.cities=[a,b,stop,end];const travel={id:99,team:0,from:a.id,to:end.id,merchantV87:true,c:a.c,r:0,goods:{wood:100},legs:merchantRoute(g,a,end,0),leg:0,mode:'road',rangeLeft:32,travelClock:0,fees:[]};travel.path=travel.legs[0].path.map(p=>({...p}));s.shipments=[travel];
const startNational=nationalStock(s,0).wood;for(let i=0;i<3;i++){advanceMerchant(g,travel,200);receiveMerchant(g,travel);}assert.equal(travel.fees.length,3,'one tariff per visited intermediate/final city');assert.ok(!s.shipments.includes(travel));assert.ok(Math.abs(nationalStock(s,0).wood-startNational-100)<1e-6,'all cargo conserved between fees and recipient');
s.cities=[a,b,stop,end];b.team=1;stop.team=1;assert.equal(merchantRoute(g,a,end,0),null);setRelation(s,0,1,'friendly');assert.ok(merchantRoute(g,a,end,0));blockMerchants(s,b,0,true);assert.equal(merchantRoute(g,a,end,0),null);assert.equal(s.relations['0:1'].tension,15);for(let i=0;i<120&&!atWar(s,0,1);i++){s.time+=60;tickDiplomacy(s,60);}assert.ok(atWar(s,0,1),'sustained blockade can cause war');
const cells=Array.from({length:100},()=>({land:true,deposits:{}}));seedGoods(cells);for(const d of Object.values(GOOD_BUILDINGS))if(d.deposit&&d.deposit!=='grain')assert.ok(cells.some(c=>c.deposits[d.deposit]));
const seaA=city(10,0),seaB=city(11,10);for(const c of [seaA,seaB])c.economy.buildings.push({type:'harbor',team:0,ready:true,hp:100});
const sg={...g,s:{...s,cities:[seaA,seaB],relations:{},shipments:[],research:[{known:['shipbuilding','ocean_sailing']}]},cell:p=>({land:p.r!==1}),landPath:(a,b)=>a.c===b.c&&a.r===b.r?[]:null};
const sea=merchantRoute(sg,seaA,seaB,0);assert.ok(sea.some(l=>l.mode==='sea'),'ports connect through navigable water');assert.ok(sea.every(l=>l.path.length<=MERCHANT_RANGE[l.mode]));
const seaLeg=sea.find(l=>l.mode==='sea'),ship={team:0,from:10,to:11,goods:{wood:10},legs:[seaLeg],leg:0,path:[...seaLeg.path],mode:'sea',rangeLeft:72,c:0,r:0};advanceMerchant(sg,ship,1.5);assert.equal(ship.path.length,seaLeg.path.length-1,'sea advances in 1.5s versus 4s land');
for(const [type,d] of Object.entries(GOOD_BUILDINGS)){const model=createAgeBuilding(type,0,d.age);let meshes=0;model.traverse(o=>{if(o.isMesh)meshes++;});assert.ok(meshes>=4,'visible production model '+type);}
for(const [type,d] of Object.entries(GOOD_BUILDINGS)){const e=initialState(1),r=e.realms[0];for(const[k,n]of Object.entries(d.input||{}))r.resources[k]=100;e.buildings=[{type:'hall',team:0,x:0,z:0,hp:100,ready:true},{type,team:0,x:8,z:0,parent:0,hp:100,ready:true}];for(let i=0;i<180;i++)tickEconomy(e,1,{skipDemographics:true,assigned:b=>b.type===type?1:0,storageCap:()=>1000,moveCargo:()=>true});assert.ok(r.resources[d.out]>0,'workshop physically delivers '+d.out);}
const total=nationalStock({cities:[a]},0);assert.ok(total.wood>=0);
const game=new Civilization(createGame(8417));assert.equal(relation(game.s,0,1),'neutral');game.tick(.1);const restored=new Civilization(JSON.parse(JSON.stringify(game.s)));assert.equal(relation(restored.s,0,1),'neutral');
console.log('V87 PASS: city varieties, productivity, food consumption, range stops, physical transit, 5% fees, neutral diplomacy, blockade war and save restore');
