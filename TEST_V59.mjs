import assert from 'node:assert/strict';
import {recordWorldStep,roadStrength,roadLevel,roadBoost} from './roads.js?v=59';
import {worldTravelSample} from './map-units.js?v=59';
import {Navigation} from './navigation.js?v=59';
import {createDetailWorldRoads,createDetailTrailLinks} from './detail-roads.js?v=59';

// World-map traffic: first passage has no visible road or speed bonus.
const a={c:10,r:10},b={c:11,r:10},s={time:30,worldRoads:{},roadRevision:0};
recordWorldStep(s,a,b,'army',30);
assert.equal(roadLevel(roadStrength(s,a,b)),0,'single crossing must be invisible');
assert.equal(s.roadRevision,0,'invisible wear must not force atlas redraw');
assert.equal(roadBoost(s,a,b),1);
for(let i=0;i<3;i++)recordWorldStep(s,a,b,'army',30);
assert.ok(roadLevel(roadStrength(s,a,b))>=1,'four passages must create a path');
assert.equal(s.roadRevision,1,'atlas redraw only when road level changes');
assert.equal(roadBoost(s,a,b),1.5);

// Fractional travel does not jump between grid centres.
const traveller={c:10,r:10,path:[{c:11,r:10}],travelClock:1.5,travelDuration:3};
const halfway=worldTravelSample(traveller);
assert.equal(halfway.fraction,.5);
const start=worldTravelSample({...traveller,travelClock:0});
const end=worldTravelSample({...traveller,travelClock:3});
assert.ok(halfway.x>Math.min(start.x,end.x)&&halfway.x<Math.max(start.x,end.x));
const closeToEnd=worldTravelSample({...traveller,travelClock:2.99});
const afterCross=worldTravelSample({c:11,r:10,path:[{c:12,r:10}],travelClock:.01,travelDuration:3});
assert.ok(Math.abs(closeToEnd.x-afterCross.x)<1,'no visible snap on cell crossing');
const ship=worldTravelSample({kind:'transport',c:10,r:10,path:[{c:10,r:11}],clock:1.5});
assert.equal(ship.fraction,.5,'ships also interpolate');

// Detail-map walkers must use the same road-development principle.
const world={resources:[],heat:{},heatLast:{},trailTime:30,revision:0};
const nav=new Navigation(world,()=>true),walker={x:0,z:0};
let goal={x:12,z:0};
for(let i=0;i<18;i++)nav.move(walker,goal,.25,3);
const central=nav.index(6,0);
assert.equal(nav.roadLevel(central),0,'one detailed walk must not create a road');
for(let trip=0;trip<10;trip++){
 goal={x:trip%2?12:0,z:0};
 for(let i=0;i<19;i++)nav.move(walker,goal,.25,3);
 world.trailTime+=2;
}
assert.ok(nav.roadLevel(central)>=1,'repeated local traffic must form a road');
const spots=Object.keys(world.heat).map(key=>({key:Number(key),heat:nav.roadStrength(Number(key))})).filter(p=>nav.roadLevel(p.key)>0);
assert.ok(spots.length>2,'consecutive detailed road cells must exist');
const localMeshes=createDetailTrailLinks(spots,nav,()=>0);
assert.ok(localMeshes.children[0]?.geometry?.attributes?.position.count>0,'local connected road ribbons should render');

// The same world road becomes a walkable terrain-following strip on detail map.
const game={s,seen:()=>true};
const ribbons=createDetailWorldRoads(game,a,nav,()=>0);
assert.ok(ribbons.children[0]?.geometry?.attributes?.position.count>0,'world road must continue onto detail view');
const fogged=createDetailWorldRoads({...game,seen:(_team,tile)=>tile.c===10},a,nav,()=>0);
assert.equal(fogged.children.length,0,'no road leak through unexplored neighbouring cell');
console.log('V59 PASS: roads require traffic in both views, connected detailed geometry, no world unit snapping, ship interpolation');
