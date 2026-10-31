import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {worldLandDurationV258,rescaleWorldTravelV258} from '../world-movement-v258.js';
import {scoutDetailPositionV240} from '../scout-sector-v236.js';
import {worldTravelSample} from '../map-units.js';
import {center} from '../campaign.js';
import {createDetailTravellers} from '../detail-travellers-v157.js';
import {Civilization,createGame} from '../civilization-core.js';
import {TROOPS} from '../civilization-core.js';
import {advanceMerchant} from '../merchant-v87.js';

const a={c:20,r:20},east={c:21,r:20},south={c:20,r:21},diagonal={c:21,r:21};
assert.equal(worldLandDurationV258(a,east,3),75);
assert.equal(worldLandDurationV258(a,south,3),65);
assert.ok(Math.abs(worldLandDurationV258(a,diagonal,3)-Math.hypot(225,195)/3)<1e-9);
assert.equal(worldLandDurationV258(a,east,3,1.5),50,'road boost matches detail navigation');
const army={...a,team:0,id:7,path:[east],travelDuration:3,travelClock:1.5};
const before=worldTravelSample(army);rescaleWorldTravelV258(army,75);const after=worldTravelSample(army);
assert.equal(before.x,after.x,'upgrading an in-flight save keeps its visible position');
assert.equal(army.travelClock,37.5);
const game=new Civilization(createGame(73142)),actual=game.s.armies[0],start={c:actual.c,r:actual.r};
actual.path=[{c:start.c+1,r:start.r}];actual.travelClock=0;actual.travelDuration=0;game.canTraverse=()=>true;
const original=worldTravelSample(actual);game.advanceWorldMovers(1);const advanced=worldTravelSample(actual);
assert.ok(Math.abs((advanced.x-original.x)*4.5-TROOPS.scout.speed)<1e-6,'in one second scout moves the same metres as in detail view');
game.advanceWorldMovers(100);assert.equal(actual.c,start.c+1);assert.equal(actual.worldArrivalV258.c,actual.c,'arrival is recorded for the playable detail formation');
const city={id:4,team:0,c:22,r:20},cargo={team:0,c:20,r:20,leg:0,legs:[{stop:{cityId:4,c:22,r:20}}],mode:'road',path:[{c:21,r:20},{c:22,r:20}],rangeLeft:32,travelDuration:4,travelClock:2};
const tradeGame={s:{cities:[city],time:0},canTraverse:()=>true,cell:()=>({land:true})};
advanceMerchant(tradeGame,cargo,0);assert.equal(cargo.travelDuration,75);assert.equal(cargo.travelClock,37.5,'old merchant keeps its journey fraction');
advanceMerchant(tradeGame,cargo,37.5);assert.equal(cargo.c,21,'merchant moves the physical tile distance at walking speed');
const oldTile={...a,...center(a.c,a.r)},newTile={...east,...center(east.c,east.r)};
const p0=scoutDetailPositionV240(after,oldTile),p1=scoutDetailPositionV240(after,newTile);
assert.ok(Math.abs(p0.x-p1.x-225)<1e-8,'the same unit has consistent coordinates in adjacent detail tiles');

// A neighbouring army without a scout must still appear; all squads are present.
const root=new T.Group(),travellers=createDetailTravellers(root),state={armies:[army],units:[
 {team:0,armyId:7,kind:'artisan',hp:100,menCount:1},
 {team:0,armyId:7,kind:'trainer',hp:100,menCount:1}
],settlers:[],shipments:[]};
const args={state,game:{},tile:newTile,worldToLocal:(tile,x,z)=>({x:(x-tile.x)*4.5,z:(z-tile.z)*3.9}),ground:()=>1,age:()=>0,visible:()=>true,time:1,dt:.1};
assert.equal(travellers.sync(args),1,'neighbouring full army is rendered');
const proxy=root.children.find(o=>o.name==='V258 travelling army');assert.ok(proxy?.visible);
assert.equal(proxy.userData.walkers.length,2,'both squads are represented');
assert.ok(Math.abs(proxy.position.x-p1.x)<1e-8);
travellers.sync({...args,tile:oldTile});assert.equal(proxy.visible,false,'same-tile units are handled by playable inspection, without duplicates');
console.log('V258 travel distance, speed, old-save continuity and neighbouring army PASS');
