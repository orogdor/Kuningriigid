import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {WALL_PROFILES,prepareWall,wallBlocksShot,parapetCover} from './siege-rules-v114.js?v=114a';
import {BUILD_AGE,BUILDINGS,Civilization,TROOPS} from './civilization-core.js?v=114a';
import {BUILD_TECH} from './research.js?v=114a';
import {siegeDamage,siegeSection,persistSiegeDamage} from './medieval-v62.js?v=114a';
import {createBronzeCityModel} from './bronze-city-v111.js?v=114a';
import {startSiegeCraft,tickSiegeCraft} from './siege-assault-v108.js?v=114a';
import {createBronzeSiegeState} from './bronze-siege-demo-v108.js?v=114a';
import {initializeMen,tickIndividualBattle} from './individual-battle-v91.js?v=114a';
for(const type of ['palisade','stonewall','reinforced_wall']){
 const profile=WALL_PROFILES[type];assert.equal(BUILD_AGE[type],type==='palisade'?0:1);
 assert.equal(BUILD_TECH[type],type==='palisade'?'fortifications':'stone_fortifications');
 assert.ok(!BUILDINGS[type].cost.iron,'all three tiers can be constructed before iron');
 const old={type,hp:175,damageMaxHp:350};prepareWall(old);assert.equal(old.hp,profile.hp/2);prepareWall(old);assert.equal(old.hp,profile.hp/2,'migration is idempotent');
 const section=siegeSection(old,0);assert.equal(section.maxHp,profile.hp);assert.equal(section.height,profile.height);assert.ok(section.walkable);
 const model=createBronzeCityModel(type);model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model);assert.ok(box.max.y>profile.height);assert.ok(model.children.length<10,'batched model');
 if(type!=='palisade'){assert.equal(siegeDamage({kind:'bronze_spearman'},section,100),0);assert.equal(siegeDamage({kind:'bronze_archer'},section,100),0);}
 assert.equal(siegeDamage({kind:'siege_tower'},section,100),0);
}
const wall={type:'stonewall',hp:900,maxHp:900,x:0,z:0,height:3.8};
assert.ok(wallBlocksShot({siegeSections:[wall]},{x:-10,z:0},{x:10,z:0}));
assert.ok(!wallBlocksShot({siegeSections:[{...wall,breached:true}]},{x:-10,z:0},{x:10,z:0}));
assert.ok(!wallBlocksShot({siegeSections:[wall]},{x:-10,z:0},{x:0,z:0},0,3.8));
assert.equal(parapetCover({u:{},m:{}},{u:{guardPost:true,wallType:'reinforced_wall'},m:{elevation:6.4}},'arrow'),.35);
for(const kind of ['ram','sap']){
 const s=createBronzeSiegeState(),b=s.battle,u=b.squads.find(u=>u.team===0&&u.kind==='bronze_spearman');
 const stock=s.cities.find(c=>c.team===0).economy.realms[0].resources;
 const made=startSiegeCraft(b,u,kind,s);assert.ok(made.ok);assert.ok(stock.wood<350);
 const w=made.work,section=b.siegeSections.find(s=>s.index===w.wallIndex);if(kind==='ram')assert.equal(section.type,'gatehouse');
 // Isolate breach work at its target, retaining crew dependency and elapsed labor.
 u.men=Array.from({length:12},()=>({hp:10,x:w.wallX-w.inwardX*5,z:w.wallZ-w.inwardZ*5}));
 w.ready=true;w.arrived=true;w.x=w.wallX;w.z=w.wallZ;b.squads=[u];let rebuilt=0;
 tickSiegeCraft(b,1,{rebuildSiegeAccess(){rebuilt++;}});assert.ok(section.hp>0,'never an instantaneous breach');
 for(let i=0;i<600&&section.hp>0;i++)tickSiegeCraft(b,1,{rebuildSiegeAccess(){rebuilt++;}});
 assert.equal(section.hp,0);assert.ok(section.breached&&rebuilt>0);persistSiegeDamage(s.cities[0],b);assert.equal(s.cities[0].economy.buildings[section.index].hp,0);
}
// Real height-aware ascent from the actual deployment, with all navigation ticks.
const s=createBronzeSiegeState(),g=new Civilization(s),b=s.battle,u=b.squads.find(u=>u.team===0&&u.kind==='bronze_spearman');
for(const w of b.siegeSections)if(w.type==='stonewall'){w.height=6.4;w.type='reinforced_wall';}
const nav=g.battleNavigation(b);initializeMen(b,nav);for(const v of b.squads)if(v!==u){v.hp=0;for(const m of v.men||[])m.hp=0;}b.defensePosts=[];b.fortress.cool=1e9;
assert.ok(startSiegeCraft(b,u,'ladder',s).ok);let climbing=false;
for(let i=0;i<2500&&!u.guardPost;i++){tickIndividualBattle(b,.1,TROOPS,0,nav);if(u.men.some(m=>m.elevation>3.8&&m.elevation<6.4))climbing=true;}
assert.ok(climbing);assert.ok(u.guardPost);assert.ok(u.men.every(m=>m.elevation===6.4));
console.log('V114 PASS: era tiers; save migration; batched wall models; stone immunity; parapet cover; blocked shots; resource-backed gate ram and undermining; persisted local breaches; actual high-wall ascent.');
for(const kind of ['ram','sap']){const s=createBronzeSiegeState(),g=new Civilization(s),b=s.battle,nav=g.battleNavigation(b);initializeMen(b,nav);const u=b.squads.find(u=>u.team===0&&u.kind==='bronze_spearman');for(const v of b.squads)if(v!==u){v.hp=0;for(const m of v.men||[])m.hp=0;}b.defensePosts=[];const r=startSiegeCraft(b,u,kind,s),w=r.work,wall=b.siegeSections.find(v=>v.index===w.wallIndex);for(let i=0;i<6500&&wall.hp>0;i++)tickIndividualBattle(b,.1,TROOPS,0,nav);assert.ok(w.arrived);assert.equal(wall.hp,0,kind+' reaches and breaches its wall with actual crew movement');console.log(JSON.stringify({kind,realApproach:true,elapsed:b.elapsed}));}
