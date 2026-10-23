import {readyForNextEra} from '../ai-development-v128.js';
import fs from 'node:fs';
import {Civilization,createGame,AGES,BUILD_AGE,BUILDINGS,TROOPS,FACTION_NAMES} from '../civilization-core.js';
import {BUILD_TECH,UNIT_TECH} from '../research.js?v=125a';
import {aiNavy} from '../naval.js?v=125b';
import {soldierCount} from '../soldier-collision-v90.js?v=101a';
import {fieldSize,fieldsForFarm} from '../farming-v127.js';
import {WALL_TYPES,TOWER_TYPES} from '../fortifications.js?v=118a';
const seed=Number(process.env.AUDIT_SEED||12501),limit=Number(process.env.AUDIT_TURNS||308);
const out=process.env.AUDIT_OUT||'reports/ai-audit-v127';fs.mkdirSync(out,{recursive:true});
const g=new Civilization(process.env.AUDIT_INPUT?JSON.parse(fs.readFileSync(process.env.AUDIT_INPUT)):createGame(seed)),s=g.s,events=[],violations=[],history=[],started=Date.now();let turn=0;
const tally=arr=>arr.reduce((o,k)=>(o[k]=(o[k]||0)+1,o),{});
const countMen=u=>u.soldiers?u.soldiers.filter(m=>m.hp>0).length:u.menCount||soldierCount(u);
const validAtOrder=(kind,type,team,ctx)=>{
 const age=s.ages[team],d=kind==='building'?BUILDINGS[type]:TROOPS[type],minAge=kind==='building'?BUILD_AGE[type]:d.age,tech=(kind==='building'?BUILD_TECH:UNIT_TECH)[type];
 const missing=(d.requires||[]).filter(t=>!g.cityReady(ctx,t));
 const bad=age<minAge||tech&&!s.research[team].known.includes(tech)||missing.length;
 return bad?{turn,kind,type,team,age,minAge,tech,known:tech?s.research[team].known.includes(tech):true,missing}:null;
};
const build=g.build.bind(g);g.build=(ctx,type,p)=>{const violation=validAtOrder('building',type,ctx.team,ctx),r=build(ctx,type,p);if(r.building){events.push({turn,event:'build',team:ctx.team,city:ctx.id,tile:[ctx.c,ctx.r],type,x:p.x,z:p.z,age:s.ages[ctx.team]});if(violation)violations.push(violation);}return r;};
const recruit=g.recruit.bind(g);g.recruit=(ctx,kind,...args)=>{const v=validAtOrder('unit',kind,ctx.team,ctx),r=recruit(ctx,kind,...args);if(r.unit){events.push({turn,event:'recruit',team:ctx.team,city:ctx.id,kind,age:s.ages[ctx.team]});if(v)violations.push(v);}return r;};
function sampleCity(c){
 const contexts=g.contexts(c),buildings=contexts.flatMap(ctx=>ctx.economy.buildings.filter(b=>!b.virtual&&b.hp>0).map(b=>({type:b.type,name:BUILDINGS[b.type]?.name,tile:[ctx.c,ctx.r],county:g.isCountyTile(ctx,c),x:b.x,z:b.z,ready:b.ready,disabled:!!b.disabled,assigned:b.assigned||0,status:b.status,width:b.width,depth:b.depth,farming:b.farming})));
 const fields=buildings.filter(b=>b.type==='field'),farms=contexts.flatMap(ctx=>ctx.economy.buildings.filter(b=>b.type==='farm'&&b.hp>0).map(b=>({tile:[ctx.c,ctx.r],ready:b.ready,fields:fieldsForFarm(ctx,b).length,tool:b.farming?.tool||null})));
 const countySlots=contexts.filter(ctx=>g.isCountyTile(ctx,c)).map(ctx=>({tile:[ctx.c,ctx.r],used:g.countySlots(ctx).used}));
 const walls=buildings.filter(b=>WALL_TYPES.has(b.type)||TOWER_TYPES.has(b.type)||b.type==='gatehouse');
 const resources=c.economy.realms[c.team].resources;
 return {id:c.id,team:c.team,name:c.name,tile:[c.c,c.r],age:s.ages[c.team],ageName:AGES[s.ages[c.team]].name,pop:c.economy.realms[c.team].pop,role:c.economicRole,buildings,counts:tally(buildings.map(b=>b.type)),readyCounts:tally(buildings.filter(b=>b.ready).map(b=>b.type)),fields:fields.length,fieldArea:fields.reduce((n,b)=>{const d=fieldSize(b);return n+d.width*d.depth},0),farms,livestock:buildings.filter(b=>b.type==='pasture').length,walls,countySlots,stock:Object.fromEntries(['wood','stone','plank','grain','meat','fish','water','copper','tin','bronze','ore','iron','weapons','steel','machines','fuel'].map(k=>[k,Math.round((resources[k]||0)*100)/100])),ageWait:s.research[c.team].ageWait,training:c.training||[],fertile:!!g.cell(c)?.deposits.grain};
}
function snapshot(reason){
 const cities=s.cities.map(sampleCity),armies=s.armies.map(a=>{const units=s.units.filter(u=>u.team===a.team&&(u.armyId||0)===(a.id||0)&&u.hp>0&&!u.garrison);return {id:a.id||0,team:a.team,tile:[a.c,a.r],age:s.ages[a.team],counts:tally(units.map(u=>u.kind)),squads:units.length,men:units.reduce((n,u)=>n+countMen(u),0),units:units.map(u=>({kind:u.kind,name:TROOPS[u.kind]?.name,age:TROOPS[u.kind]?.age,men:countMen(u),obsolete:g.obsoleteUnit(u.team,u.kind)||null}))}});
 const data={revision:process.env.AUDIT_REVISION||'V127',seed,turn,reason,elapsedSeconds:Math.round((Date.now()-started)/1000),ages:[...s.ages],cities,armies,garrisons:s.units.filter(u=>u.hp>0&&u.garrison).map(u=>({team:u.team,kind:u.kind,men:countMen(u),...u.garrison})),violations,events:events.length};
 fs.writeFileSync(`${out}/latest.json`,JSON.stringify(data,null,2));
 if(process.env.AUDIT_DEBUG_STATE){const ds=new Set(s.cities.flatMap(c=>Object.values(c.districts||{}).map(d=>d.economy)));fs.writeFileSync(process.env.AUDIT_DEBUG_STATE,JSON.stringify(s,function(k,v){return ds.has(this)&&['realms','resources'].includes(k)?undefined:v}));}
 if(reason!=='checkpoint')fs.writeFileSync(`${out}/turn-${turn}.json`,JSON.stringify(data,null,2));
 fs.writeFileSync(`${out}/orders.json`,JSON.stringify({seed,violations,events},null,2));
 history.push({turn,ages:[...s.ages],cities:cities.length,fields:cities.reduce((n,c)=>n+c.fields,0),farms:cities.reduce((n,c)=>n+c.farms.length,0),walls:cities.reduce((n,c)=>n+c.walls.length,0),troops:s.units.filter(u=>u.hp>0).length});
 fs.writeFileSync(`${out}/history.json`,JSON.stringify(history,null,2));
 console.log(JSON.stringify({turn,reason,elapsed:data.elapsedSeconds,ages:s.ages,cities:cities.length,farms:history.at(-1).farms,fields:history.at(-1).fields,walls:history.at(-1).walls,troops:history.at(-1).troops,violations:violations.length}));
}
let ages=[...s.ages],testSaved=false;const ironTechs=Object.entries((await import('../research.js?v=125a')).TECHS).filter(([,v])=>v.age===2).map(([id])=>id);
try{for(turn=Math.floor(s.time/60)+1;turn<=limit;turn++){
 for(let k=0;k<5;k++){g.aiTeam(0);aiNavy(g,0);g.tick(12);}
 const target=1,known=ironTechs.filter(id=>s.research[target].known.includes(id));
 if(process.env.AUDIT_SAVE_FILE&&!testSaved&&s.ages[target]===2&&known.length>=Math.ceil(ironTechs.length/2)&&readyForNextEra(s,target,TROOPS)){
  s.ironAITestV128={seed,turn,target,ironTechs:ironTechs.length,knownIronTechs:known.length,source:'Ordinary AI simulation; no injected resources, technology or troops'};
  const districtEconomies=new Set(s.cities.flatMap(c=>Object.values(c.districts||{}).map(d=>d.economy)));
  fs.writeFileSync(process.env.AUDIT_SAVE_FILE,JSON.stringify(s,function(key,value){return districtEconomies.has(this)&&['realms','resources'].includes(key)?undefined:value}));testSaved=true;snapshot('iron-midpoint');
  if(process.env.AUDIT_STOP_AT_IRON==='1')break;
 }
 const changed=s.ages.some((v,i)=>v!==ages[i]);
 if(changed||turn%25===0){snapshot(changed?'era-change':'checkpoint');ages=[...s.ages];}
 if(s.ages.every(a=>a>=6)){snapshot('all-modern');break;}
 }turn=Math.min(turn,limit);snapshot('final');
}catch(e){snapshot('error');console.error(e);process.exitCode=1;}
