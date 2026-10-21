import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {Civilization,createGame,TROOPS,BUILDINGS} from './civilization-core.js';
import {TECHS,UNIT_TECH} from './research.js';
import {UNIT_GRADES,troopCost} from './military-v88.js';
import {unitStats,syncArmyStats,initArmyExperience,rewardBattleExperience,formationTargets,xpForLevel} from './army-experience-v88.js';
import {mergeArmies,splitArmy} from './v51-systems.js';
import {createSoldier} from './visuals.js';
import {createBattle,tickBattle,tickDeployments,deploymentFor} from './campaign.js';
const roster=[];
for(let age=0;age<7;age++){
 const ids=Object.keys(TROOPS).filter(k=>TROOPS[k].age===age&&!['scout','militia','transport','warship'].includes(k));assert.ok(ids.length>=4,`era ${age}: ${ids}`);roster.push({age,units:ids});
 for(const kind of ids){const d=TROOPS[kind];assert.ok(TECHS[UNIT_TECH[kind]],kind);for(const b of d.requires)assert.ok(BUILDINGS[b],kind+': '+b);for(const grade of Object.keys(UNIT_GRADES)){const root=createSoldier(new T.Group(),0,0,'#aa7755',kind,grade);assert.equal(root.userData.grade,grade);let meshes=0;root.traverse(o=>{if(o.isMesh)meshes++});assert.ok(meshes>5);}}
}
const g=new Civilization(createGame(8417)),a=g.s.armies[0];
const city={id:900,team:0,c:a.c,r:a.r,trainingAgent:{},economy:{buildings:[{type:"hall",x:0,z:0}],realms:[{pop:100,resources:{wood:1000,stone:1000,bread:1000}}]},training:[]};
g.cityReady=()=>true;g.s.research[0].known=Object.keys(TECHS);
for(const [grade,ratio]of [['mobilized',.5],['standard',1],['elite',1.3]]){const before=city.economy.realms[0].resources.wood;const result=g.recruit(city,'spearman',grade);assert.ok(result.queued,JSON.stringify(result));assert.ok(Math.abs(before-city.economy.realms[0].resources.wood-TROOPS.spearman.cost.wood*ratio)<1e-8);result.queued.progress=result.queued.total;g.tickTraining(city,0);const u=g.s.units.at(-1);assert.equal(u.grade,grade);assert.equal(u.maxHp,TROOPS.spearman.hp*UNIT_GRADES[grade].strength);}
const pop=city.economy.realms[0].pop;assert.ok(g.recruit(city,'spearman','fake').error);assert.equal(city.economy.realms[0].pop,pop);
const unit={team:0,kind:'spearman',hp:50,maxHp:100,grade:'standard',armyId:0};const state={armies:[{team:0,id:0,c:10,r:11,path:[],xp:8100}],units:[unit]};syncArmyStats(state,state.armies[0],TROOPS);assert.equal(unit.hp/unit.maxHp,.5);
const level1=unitStats(TROOPS.spearman,{grade:'standard'}, {xp:0}),level10=unitStats(TROOPS.spearman,unit,state.armies[0]);for(const k of ['hp','dmg','range','speed','morale','attackSpeed'])assert.equal(level10[k],level1[k]*3,k);
const recovered=structuredClone(state);initArmyExperience(recovered,TROOPS);assert.equal(recovered.units[0].hp,unit.hp);
const battle={result:'victory',winnerTeam:0,squads:[{source:0,damageDealt:100,kills:1}]};state.armies[0].xp=0;const awards=rewardBattleExperience(state,battle,TROOPS);assert.equal(awards[0].earned,185);assert.equal(rewardBattleExperience(state,battle,TROOPS).length,0);
state.armies.push({team:0,id:4,c:10,r:11,path:[],xp:8100});state.units.push({team:0,kind:'archer',hp:100,armyId:4});state.armies[0].xp=0;assert.equal(mergeArmies(state,state.armies[1]).army.id,0);assert.equal(state.armies[0].xp,4050);assert.equal(state.units[1].armyId,0);assert.equal(state.armies.length,1);
const groups=formationTargets(state.units,{x:20,z:20});assert.equal(new Set(groups.map(g=>g.target.x+':'+g.target.z)).size,2);
const camp={armies:state.armies};deploymentFor(camp,{c:10,r:11},0,unit).target={x:30,z:0};tickDeployments(camp,state.units,TROOPS,1);assert.ok(camp.deployments['10:11'][0].x>-12);
for(const grade of ['mobilized','standard','elite']){const b=createBattle({c:10,r:11},[{team:0,kind:'spearman',hp:100,grade},{team:1,kind:'spearman',hp:1000}]);b.deploymentGap=null; // This fixture starts already in melee, after initial deployment.
b.squads[0].x=0;b.squads[0].z=0;b.squads[1].x=1;b.squads[1].z=0;tickBattle(b,.01,TROOPS);assert.ok(b.squads[0].damageDealt>0);assert.ok(b.squads[0].damageDealt<=TROOPS.spearman.dmg*UNIT_GRADES[grade].strength*1.5);}
console.log(JSON.stringify({passed:true,roster,grades:UNIT_GRADES,maxLevel:10,maxXP:xpForLevel(10),checks:'era roster, technology/buildings, all 3D models and grades, actual recruit payment/graduation, health fraction, 3x six stats, saves, XP idempotence, weighted merge, formation, movement, combat'}));
// Actual world paths converge before merging; the complete merged force enters battle.
const rallyGame=new Civilization(createGame(8417)),main=rallyGame.s.armies[0];rallyGame.s.units=rallyGame.s.units.filter(u=>u.team!==0);const base=rallyGame.cells.find(p=>[0,1,2].every(dx=>rallyGame.canTraverse(0,{c:p.c+dx,r:p.r})));main.c=base.c;main.r=base.r;main.path=[];
for(let id=0;id<3;id++){if(id)rallyGame.s.armies.push({team:0,id,c:base.c+id,r:base.r,path:[],xp:100*id});for(let n=0;n<5;n++)rallyGame.s.units.push({team:0,armyId:id,kind:'spearman',hp:125,grade:'standard'});}
rallyGame.s.nextArmyId=10;const rally=rallyGame.rallyArmies(main);assert.equal(rally.ordered,2);assert.ok(rallyGame.s.armies.find(a=>a.id===2).path.length);for(let n=0;n<10;n++)rallyGame.advanceWorldMovers(3);assert.equal(rallyGame.s.armies.filter(a=>a.team===0).length,1);assert.equal(rallyGame.s.units.filter(u=>u.team===0&&!(u.armyId||0)).length,15);
const unitedBattle=createBattle({c:10,r:11},rallyGame.s.units,rallyGame.s);assert.equal(unitedBattle.squads.filter(u=>u.team===0).length,15);const split=rallyGame.splitArmy(main);assert.equal(split.count,7);assert.equal(split.army.xp,main.xp);assert.equal(rallyGame.mergeArmies(split.army).count,15);
console.log('V88 MILITARY WORLD PASS: three physical armies rally, 15 squads merge and enter battle, split retains XP');
const {healMedievalArmies}=await import('./medieval-v62.js');
const hospitalCity={team:0,c:main.c,r:main.r,economy:{buildings:[{type:'infirmary',ready:true,hp:350,assigned:1}],realms:[{resources:{bread:100}}]}};
const wounded=rallyGame.s.units.find(u=>u.team===0);wounded.grade='mobilized';wounded.maxHp=50;wounded.hp=49;rallyGame.troopDefinitions=TROOPS;healMedievalArmies(rallyGame,hospitalCity,100);assert.equal(wounded.hp,50);wounded.grade='elite';wounded.maxHp=525;wounded.hp=500;healMedievalArmies(rallyGame,hospitalCity,100);assert.equal(wounded.hp,525);
const {buildShip,finishShip,SHIPS}=await import('./naval.js');
const coastal=rallyGame.s.coastalStartPositions.find(p=>[[-1,0],[1,0],[0,1],[0,-1]].some(([dc,dr])=>rallyGame.cell({c:p.c+dc,r:p.r+dr})?.land===false));
const dock={id:999,team:0,...coastal,economy:{buildings:[{type:'harbor',ready:true}],realms:[{resources:{wood:10000,plank:10000,stone:10000,bread:10000}}]},training:[]};rallyGame.s.research[0].known.push('shipbuilding','ocean_sailing');
for(const grade of Object.keys(UNIT_GRADES)){dock.training=[];const before=dock.economy.realms[0].resources.wood,r=buildShip(rallyGame,dock,'warship',grade);assert.ok(r.queued,JSON.stringify(r));assert.ok(Math.abs(before-dock.economy.realms[0].resources.wood-SHIPS.warship.cost.wood*UNIT_GRADES[grade].cost)<1e-8);assert.ok(finishShip(rallyGame,dock,r.queued));assert.equal(rallyGame.s.ships.at(-1).hp,SHIPS.warship.hp*UNIT_GRADES[grade].strength);}
console.log('V88 MILITARY HEALTH/NAVY PASS: mobilized healing cap, elite above-base healing, three ship grade payments and HP');
