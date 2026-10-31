import assert from 'node:assert/strict';
import {snapWallEndsV243,wallStrokePlanV175,wallCrossesGateOpeningV175} from '../wall-draw-v175.js';
import {wallEndJoinV1758} from '../wall-terrain-v1758.js';
import {fieldContains,validateField} from '../farming-v127.js';
import {buildingClearance,Navigation} from '../navigation.js';
import {initialState,placeBuilding} from '../economy.js';
import {Civilization} from '../civilization-core.js';
import fs from 'node:fs';
const tower={type:'watchtower',x:0,z:0,hp:350},gate={type:'woodgate',x:30,z:0,hp:350};
let points=snapWallEndsV243([{x:5.3,z:0},{x:16,z:0}],[tower,gate]);assert.equal(points[0].x,4.7);
assert.equal(snapWallEndsV243([{x:0,z:0},{x:16,z:0}],[tower])[0].x,4.7,'stroke started on the tower selects the outward side');
let plan=wallStrokePlanV175(points);assert(wallEndJoinV1758({...plan.segments[0],type:'palisade'},tower));
points=snapWallEndsV243([{x:20,z:0},{x:26.3,z:0}],[tower,gate]);assert.equal(points[1].x,26.5);
plan=wallStrokePlanV175(points);const last={...plan.segments.at(-1),type:'palisade'};assert(wallEndJoinV1758(last,gate));assert(!wallCrossesGateOpeningV175(last,gate));
const wide={...gate,extendedPalisadeV166:true};points=snapWallEndsV243([{x:14,z:0},{x:23.2,z:0}],[wide]);assert.equal(points[1].x,23);plan=wallStrokePlanV175(points);assert(wallEndJoinV1758({...plan.segments.at(-1),type:'palisade'},wide));
assert.equal(snapWallEndsV243([{x:30,z:0},{x:45,z:0}],[wide])[0].x,37,'stroke started inside a wide gate selects the outward post');
assert(wallCrossesGateOpeningV175({x:30,z:0,palisadeSpanV167:7,wallAngleV175:0},gate));
assert(!wallEndJoinV1758({type:'palisade',drawnWallV175:true,x:0,z:0,palisadeSpanV167:8,wallAngleV175:0},tower));
const f={type:'field',x:0,z:0,width:40,depth:10,freeRotationV243:true,buildingRotationV228:Math.PI/2};
assert(fieldContains(f,{x:0,z:19}));assert(!fieldContains(f,{x:19,z:0}));
assert.equal(validateField({economy:{buildings:[]},world:{resources:[]}},f,()=>true),'');
const footprint=buildingClearance({type:'gatehouse',bronzeWall:true,buildingRotationV228:Math.PI/2});assert(Math.abs(footprint.rx-2.2)<1e-8&&Math.abs(footprint.rz-3.5)<1e-8);
const economy=initialState(1);economy.realms[0].resources.plank=100;economy.buildings.push({type:'hall',x:0,z:0,team:0,hp:350,ready:true});
const angle=137*Math.PI/180,placed=placeBuilding(economy,0,'house',{x:10,z:0,buildingRotationV228:angle,freeRotationV243:true},{passable:()=>true,nearBuildings:()=>[],requirement:()=>'',segmentDry:()=>true});
assert.equal(placed.building.buildingRotationV228,angle);assert.equal(JSON.parse(JSON.stringify(placed.building)).buildingRotationV228,angle);
const gateAngle=Math.PI/4,rotatedGate=placeBuilding(economy,0,'woodgate',{x:-12,z:0,buildingRotationV228:gateAngle,freeRotationV243:true},{passable:()=>true,nearBuildings:()=>[],requirement:()=>'',segmentDry:()=>true}).building;
assert.equal(rotatedGate.wallAngleV175,gateAngle);
const nav=new Navigation({resources:[]},()=>true,()=>[rotatedGate],{minX:-30,minZ:-20,w:61,h:41});
assert(nav.clear({x:-12-4*Math.sin(gateAngle),z:-4*Math.cos(gateAngle)},{x:-12+4*Math.sin(gateAngle),z:4*Math.cos(gateAngle)}),'rotated gate passage remains open');
const state=JSON.parse(fs.readFileSync(new URL('../scenarios/ai-stone-v174.json',import.meta.url))),game=new Civilization(state),city=game.s.cities.find(c=>c.id===state.stoneTestV174.targetCityId);
Object.assign(city.economy.realms[city.team].resources,{wood:1000,stone:1000});
for(const kind of ['watchtower','woodgate']){
 let found=false;
 for(let z=-70;z<=70&&!found;z+=5)for(let x=-65;x<=65&&!found;x+=5){
  const endpoint=kind==='woodgate'?3.5:4.7,wall={type:'palisade',x:x+endpoint+3.5,z,wallAngleV175:0,wallAxis:0,palisadeSpanV167:7,drawnWallV175:true};
  if(game.previewBuild(city,'palisade',wall).error)continue;
  const obstacle={type:kind,x,z,team:city.team,hp:350,ready:true};city.economy.buildings.push(obstacle);
  const joined=game.previewBuild(city,'palisade',wall);city.economy.buildings.pop();
  if(!joined.error){city.economy.buildings.push(obstacle);const built=game.build(city,'palisade',wall);assert(built.building,'construction must succeed at '+kind+': '+built.error);city.economy.buildings.splice(city.economy.buildings.indexOf(built.building),1);city.economy.buildings.splice(city.economy.buildings.indexOf(obstacle),1);found=true;}
 }
 assert(found,'real city must accept a wall joined to '+kind);
}
console.log('V243 wall joins, open gate, rotating fields and gate footprint PASS');
