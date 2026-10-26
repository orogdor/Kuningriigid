// V173 3.2b: natural roads must survive compact infill and remain traffic-driven.
import assert from 'node:assert/strict';
import {Navigation} from './navigation.js';
import {historicalBuildingPlots,ancientStreetSpace} from './historic-urban-v138.js';
import {wornStreetCellsV173,activeStreetCandidateV173,visibleTrailStrengthV173,
 overlapsWornStreetV173} from './living-streets-v173.js';
import {recordWorldStep,roadLevel,roadStrength,decayWorldRoads} from './roads.js?v=59';
import {streetConnections,tickTownStreets} from './town-streets-v80.js';
import {Civilization} from './civilization-core.js';
import fs from 'node:fs';

// Actual historical traveller wear: one journey is not a paved road.
const w={resources:[],heat:{},heatLast:{},trailTime:0};
const buildings=[{type:'hall',x:-25,z:-20,ready:true,hp:1200,team:1},
 {type:'house',x:18,z:-20,ready:true,hp:350,team:1},
 {type:'house',x:18,z:15,ready:true,hp:350,team:1}];
const nav=new Navigation(w,()=>true,()=>buildings,{minX:-65,minZ:-65,w:131,h:131});
const game={nav:()=>nav,contexts:()=>[city]};
const city={c:12,r:12,team:1,economy:{buildings,realms:[{}, {pop:18}]}};
const links=streetConnections(buildings);
assert.ok(links.length>=2,'historic house-to-hall footpaths have real links');
const before=historicalBuildingPlots(city,city,'house',771,true);
assert.ok(before.length>50);
const startState=JSON.stringify(w);
for(let t=0;t<95;t++){w.trailTime=t*7;tickTownStreets(game,city,7);}
const paths=wornStreetCellsV173(w,w.trailTime);
assert.ok(paths.length>18,'repeated citizen errands produce visible footpaths');
assert.ok(Object.values(w.heat).some(h=>h>4),'road wear is accumulated organically');
const after=historicalBuildingPlots({...city,world:w},city,'house',771,true);
assert.ok(after.length>0,'the real village can still grow after roads are worn');
assert.ok(after.every(p=>activeStreetCandidateV173(w,p,'house',w.trailTime)),
 'AI rejects lots that would bury existing visible traffic paths');
assert.ok(after.length<before.length,'actual worn footpaths protect some previously vacant building sites');
const original=JSON.stringify(w);
historicalBuildingPlots({...city,world:w},city,'house',771,true);
assert.equal(JSON.stringify(w),original,'AI planner never adds or deletes road wear');
assert.ok(after.every(p=>!ancientStreetSpace(p.x-buildings[0].x,p.z-buildings[0].z,771).road),
 'road and building centerlines stay separate');
const trial=paths[Math.floor(paths.length/2)];
assert.ok(overlapsWornStreetV173(trial,'house',paths),'busy path is protected by roof clearance');
assert.ok(!activeStreetCandidateV173(w,trial,'house',w.trailTime),'footpath is not converted to housing');

const saved=JSON.parse(JSON.stringify(w));
assert.equal(wornStreetCellsV173(saved,w.trailTime).length,paths.length,'road wear survives JSON save roundtrip');
assert.ok(visibleTrailStrengthV173(10,0,1000)<4,'unused footpath fades away');
saved.trailTime=w.trailTime+120000;
assert.equal(wornStreetCellsV173(saved,saved.trailTime).length,0,'long-disused streets are not permanent zoning locks');
// Normal movement and decay remain controlled by Navigation.
nav.world.trailTime=w.trailTime+120000;nav.pruneTrails();
assert.ok(wornStreetCellsV173(w,nav.world.trailTime).length===0,'inactive naturally generated footpaths disappear');

// Campaign-level world roads still form by passing units and decay by disuse.
const road={time:0,worldRoads:{},roadRevision:0};
const a={c:10,r:10},b={c:11,r:10};
recordWorldStep(road,a,b,'army',0);
assert.equal(roadLevel(roadStrength(road,a,b)),0);
for(let i=0;i<3;i++)recordWorldStep(road,a,b,'army',0);
assert.ok(roadLevel(roadStrength(road,a,b))>=1,'world road arises only after real traffic');
const firstLevel=roadLevel(roadStrength(road,a,b));
road.time=35000;decayWorldRoads(road,35000);
assert.ok(roadLevel(roadStrength(road,a,b))<firstLevel,'unused world road loses level');

// V172 V4 save still loads and keeps player-owned capital after changes.
const state=JSON.parse(fs.readFileSync('scenarios/ai-stone-v172.json','utf8'));
const sample=new Civilization(state);
assert.equal(sample.s.demo,'ai-stone-v172');
const selected=sample.s.cities.find(c=>c.id===sample.s.stoneTestV172.targetCityId);
assert.equal(selected?.team,0);
const snapshot=JSON.stringify(sample.s);
const samplePlots=sample.buildingSites(selected,'house');
assert.ok(samplePlots.length>20,'existing V172 saved city can still identify building sites');
assert.equal(JSON.stringify(sample.s),snapshot,'reading candidate plots never changes saved town or roads');
const liveState=JSON.parse(fs.readFileSync('scenarios/ai-stone-v173.json','utf8'));
const liveGame=new Civilization(liveState);
const livedCity=liveGame.s.cities.find(c=>c.id===liveGame.s.stoneTestV173.targetCityId);
assert.equal(livedCity?.team,0,'V173 real AI city is player-owned');
const livedNav=liveGame.nav(livedCity);
const pavedCells=Object.keys(livedCity.world.heat||{}).map(Number)
 .filter(i=>livedNav.roadLevel(i)>=1&&livedNav.open(livedNav.point(i).x,livedNav.point(i).z));
assert.ok(pavedCells.length>25,'late Stone Age village has naturally worn paths already stored in its V4 save');
assert.ok(Object.keys(liveGame.s.worldRoads||{}).length>5,'AI empires continue to wear inter-city road edges');
const roadStamp=JSON.stringify(livedCity.world.heat);
liveGame.buildingSites(livedCity,'house');
assert.equal(JSON.stringify(livedCity.world.heat),roadStamp,'V173 street-aware site selection never replaces accumulated live roads');
console.log('V173 STREET PRESERVATION PASS',JSON.stringify({
 links:links.length,visibleBefore:0,visibleAfter:paths.length,
 buildableAfter:after.length,previousCandidates:before.length,
 worldRoadFirstLevel:firstLevel,saveProtocol:sample.s.version,liveVillageRoadCells:pavedCells.length,worldRoadEdges:Object.keys(liveGame.s.worldRoads||{}).length
}));
