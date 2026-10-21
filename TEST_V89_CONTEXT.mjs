import assert from 'node:assert/strict';
import {createBronzeBattleState} from './bronze-battle-demo-v89.js';
import {Civilization,TROOPS} from './civilization-core.js';
import {detailTrailWidth,detailWorldRoadWidth} from './road-width-v89.js';
import {selectionDetails} from './selection-info-v89.js';
import {createUnifiedRoadNetwork} from './continuous-landscape-visual.js';
import {recordWorldStep} from './roads.js';
const s=createBronzeBattleState(),g=new Civilization(s);assert.equal(s.battle.squads.length,64);for(const team of [0,1]){const u=s.battle.squads.filter(q=>q.team===team);assert.equal(u.length,32);assert.equal(new Set(u.map(q=>q.kind)).size,4);assert.ok(u.every(q=>TROOPS[q.kind].age===1));assert.equal(s.ages[team],1);assert.equal(s.armies[team].level,3);}
const unit=s.battle.squads[0],info=selectionDetails(g,{entity:unit,kind:'unit',local:true},TROOPS,{});assert.match(info,/HP/);assert.match(info,/LVL 3/);assert.match(info,/Mobiliseeritud/);
const armyInfo=selectionDetails(g,{entity:s.armies[0],kind:'army'},TROOPS,{});assert.match(armyInfo,/32 salka/);assert.match(armyInfo,/XP/);
for(let level=1;level<=4;level++)assert.equal(detailWorldRoadWidth(level),2*detailTrailWidth(level));
const cell=g.cell(s.armies[0]),other=g.cell({c:cell.c+1,r:cell.r});for(let i=0;i<5;i++)recordWorldStep(s,cell,other,'army',0);const road=createUnifiedRoadNetwork(g,'detail',cell);assert.equal(road.userData.detailWidthRatio,2);const mesh=road.children.find(x=>x.name==='continuous road pavement');assert.ok(mesh);const pos=mesh.geometry.attributes.position,indices=mesh.geometry.index;const a=indices.getX(0),b=indices.getX(1),width=Math.hypot(pos.getX(a)-pos.getX(b),pos.getZ(a)-pos.getZ(b));assert.ok(Math.abs(width-detailWorldRoadWidth(1))<.001,`actual projected width ${width}`);
console.log(JSON.stringify({passed:true,squads:64,perArmy:32,typesPerArmy:4,actualRoadWidth:width,normalRoadWidth:detailTrailWidth(1),checks:'exact projected 2x width; Bronze-only armies; country technology; grade and XP context; save-compatible scenario'}));
