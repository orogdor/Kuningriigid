import assert from 'node:assert/strict';
import {forestCandidatesV330} from '../forest-placement-v330.js';
import {createAtlasBiomeDetail} from '../atlas-biomes-v47.js';
import * as T from '../vendor/three.module.js';
const points=(centres,seed=77)=>centres.flatMap(([x,z])=>[...forestCandidatesV330({x,z},5,seed,31)]);
const centres=[];for(let z=0;z<20;z++)for(let x=0;x<20;x++)centres.push([x*50,z*50]);
const a=points(centres),keys=new Set(a.map(p=>p.x+':'+p.z));assert.equal(keys.size,a.length,'no duplicate edge ownership');assert.deepEqual(a,points(centres),'deterministic seed');assert.notDeepEqual(a,points(centres,78),'seed varies the forest');
const common=ps=>new Set(ps.filter(p=>p.x>=0&&p.x<100&&p.z>=0&&p.z<100).map(p=>p.x+':'+p.z));
const b=points([[25,25],[75,25],[25,75],[75,75]]);assert.deepEqual(common(a),common(b),'world positions do not depend on tile partition');
const detailOptions={halfX:112.5,halfZ:97.5},spacing=7;
const detail=[0,1].flatMap(row=>[0,1].flatMap(col=>[...forestCandidatesV330({x:col*225,z:row*195},spacing,77,346,detailOptions)]));
const whole=[...forestCandidatesV330({x:112.5,z:97.5},spacing,77,346,{halfX:225,halfZ:195})];
const key=p=>p.x+':'+p.z;
assert.equal(new Set(detail.map(key)).size,detail.length,'one owner for a detail tree on shared edges');
assert.deepEqual(new Set(detail.map(key)),new Set(whole.map(key)),'detail spacing stays continuous even when it does not divide tile dimensions');
const noise=(x,z)=>{const n=Math.sin(x*127.1+z*311.7+77*.017)*43758.5453;return n-Math.floor(n)};
const cells=centres.map(([x,z])=>({x,z,c:x/50,r:z/50,land:true,biome:'forest',visualBiome:'forest'}));
const game={cells,noise,startLocations:[],cell:({c,r})=>cells.find(p=>p.c===c&&p.r===r),s:{seed:77,geographyVersion:7}},group=new T.Group();createAtlasBiomeDetail(game,group,'high',()=>20);
const actual=[],m=new T.Matrix4();for(const root of group.children){const source=root.sourceSaplingV328;if(!source)continue;for(let i=0;i<source.count;i++){source.getMatrixAt(i,m);actual.push({x:m.elements[12],z:m.elements[14]});}}
const metrics={trees:actual.length};for(const axis of ['x','z']){let edges=0,centres=0;for(const p of actual){const u=((p[axis]+25)%50+50)%50;if(Math.min(u,50-u)<2.5)edges++;if(Math.abs(u-25)<2.5)centres++;}metrics[axis]={edges,centres,ratio:edges/centres};assert.ok(edges/actual.length>.075,'trees reach '+axis+' tile edges');assert.ok(edges/centres>.75&&edges/centres<1.3,'no '+axis+' seam density trench');}
assert.ok(actual.length>20000);
console.log('PASS V330 continuous world forest: tile re-partition invariance, seed, ownership, actual tree edge/centre density',metrics);
