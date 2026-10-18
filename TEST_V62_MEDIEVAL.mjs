import assert from 'node:assert/strict';
import {TECHS,BUILD_TECH,UNIT_TECH,techBlock} from './research.js';
import {BUILDINGS,BUILD_AGE,TROOPS,Civilization,createGame} from './civilization-core.js';
import {MEDIEVAL_TECHS,MEDIEVAL_BUILDINGS,MEDIEVAL_UNITS,attachSiegeSections,persistSiegeDamage,siegeDamage,medievalBonus,healMedievalArmies} from './medieval-v62.js';
import {createAgeBuilding} from './buildings.js';
import {SCIENCE_BUILDINGS} from './science.js';
import {demand} from './labor.js';
import {createBattle,tickBattle} from './campaign.js';
import {fortifyBattle,wallCapacity,WALL_TYPES} from './fortifications.js?v=62';
import {createSoldier} from './visuals.js';
import * as T from './vendor/three.module.js';
assert.equal(Object.keys(MEDIEVAL_TECHS).length,12);
assert.equal(Object.keys(MEDIEVAL_BUILDINGS).length,15);
assert.equal(Object.keys(MEDIEVAL_UNITS).length,8);
assert.equal(techBlock({known:['civics','smithing']},'armor_craft'),'');
for(const [t,d] of Object.entries(MEDIEVAL_TECHS)){assert.equal(TECHS[t].age,3);assert(d.requires.every(k=>TECHS[k]))}
for(const type of Object.keys(MEDIEVAL_BUILDINGS)){
 assert.equal(BUILD_AGE[type],3);assert(BUILD_TECH[type]);
 const model=createAgeBuilding(type,0,3);assert(model.children.some(c=>c.isMesh),'missing mesh '+type);
}
for(const [type,d] of Object.entries(MEDIEVAL_UNITS)){
 assert.equal(TROOPS[type],d);assert(UNIT_TECH[type]);assert(d.time>0);
 const g=new T.Group();createSoldier(g,0,0,'#7691aa',type);assert(g.children.length>0);
}
assert.equal(wallCapacity('reinforced_wall'),4);assert.equal(wallCapacity('keep'),6);assert(WALL_TYPES.has('reinforced_wall'));
for(const t of ['monastery','chapel','guildhall','infirmary','keep','trade_yard'])assert(demand({type:t,hp:350,ready:true},BUILDINGS)>0);
assert(SCIENCE_BUILDINGS.monastery>0&&SCIENCE_BUILDINGS.chapel>0);
const state=createGame(17),game=new Civilization(state),pos=state.settlers[0],city={id:0,team:0,c:pos.c,r:pos.r,name:'Test',economy:{realms:[],buildings:[],cargo:[],time:0},hp:600,world:game.makeWorld(game.cell(pos))};
const hall={type:'hall',team:0,x:0,z:0,hp:1200,ready:true},wall={type:'reinforced_wall',team:0,x:19,z:0,hp:350,ready:true},gate={type:'gatehouse',team:0,x:-19,z:0,hp:350,ready:true},keep={type:'keep',team:0,x:0,z:16,hp:350,ready:true};
city.economy.buildings=[hall,wall,gate,keep];game.s.cities.push(city);game.prepareCity(city);
const troops=[{kind:'catapult',team:1,hp:230,morale:100},{kind:'battering_ram',team:1,hp:360,morale:100},{kind:'siege_tower',team:1,hp:300,morale:100}];
const battle=createBattle(pos,troops);battle.squads.forEach((u,i)=>{u.x=15+i;u.z=0;u.advance=true;});
battle.fortress={team:0,cityId:0,x:0,z:0,hp:600,maxHp:600,cool:1000};
fortifyBattle(game,city,battle);
assert.equal(battle.siegeSections.length,2);assert(battle.keepProtected);
const section=battle.siegeSections.find(s=>s.type==='reinforced_wall'),portal=battle.siegeSections.find(s=>s.type==='gatehouse');
const old=section.hp;tickBattle(battle,.1,TROOPS,0);assert(section.hp<old,'catapult must hit a real wall');assert(portal.hp===350,'gate independently survives');
siegeDamage({kind:'catapult'},section,200);assert(section.breached);
persistSiegeDamage(city,battle);assert.equal(wall.hp,0);assert.equal(gate.hp,350);
const scout=game.s.units[0];scout.hp=30;
const healer={type:'infirmary',team:0,x:6,z:-18,hp:350,ready:true,assigned:2};
const guild={type:'guildhall',team:0,x:-6,z:-18,hp:350,ready:true,assigned:1};
const tavern={type:'inn',team:0,x:0,z:-18,hp:350,ready:true,assigned:1};
city.economy.buildings.push(healer,guild,tavern);
city.economy.realms[0].resources.bread=100;
const hp0=scout.hp;healMedievalArmies(game,city,100);
assert(scout.hp>hp0,'infirmary should restore wounded home army health');
assert(medievalBonus(game,city,{type:'armor_workshop'})>1,'staffed guild increases workshop output');
assert(game.env(city).growthFactor<1,'tavern speeds population growth');
const saved=JSON.parse(JSON.stringify(game.s)),restored=new Civilization(saved);
assert.equal(restored.s.version,4);assert.equal(restored.s.cities[0].economy.buildings.find(b=>b.type==='reinforced_wall').hp,0);
console.log('V62 MEDIEVAL PASS: 12 discoveries, 15 modelled buildings, 8 units, siege breach, independent gate, save compatibility');
