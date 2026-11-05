import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {Civilization,createGame} from '../civilization-core.js';
import {getRivers,riverNear,baseHeight,smoothAtlasHeight,visualElevation,visibleRiverHeight,estuaryShoreHeightV323,worldElevation} from '../continuous-landscape.js';
import {createRiverNetwork} from '../continuous-landscape-visual.js';
import {localNaturalSeaGroundV322} from '../estuary-v322.js';
import {DETAIL_X,DETAIL_Z} from '../detail-scale-v123.js';

const game=new Civilization(createGame(77,'tectonic')),saved=JSON.stringify(game.s),edges=getRivers(game);
const inland=edges.find(e=>e.c.land&&!e.c.coast&&!e.c.ford&&!e.c.bridge&&baseHeight(game,e.c.x,e.c.z)>12);
assert.ok(inland);
const group=createRiverNetwork(game,'detail',inland.c,'medium');
const water=group.children.find(m=>m.name==='continuous water surface');
assert.ok(water,'restore an actual river water surface');
assert.ok(water.geometry.attributes.aFlow,'restore flowing ripple direction');
assert.ok(water.geometry.attributes.aShore,'restore river bank shading');
assert.ok(water.geometry.attributes.color.itemSize===4,'restore colour and alpha, not ocean-only material');
const shader={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>\n#include <normal_fragment_maps>\n#include <opaque_fragment>'};
water.material.onBeforeCompile(shader);
assert.match(shader.fragmentShader,/vL149F|vL149S/,'flowing river shader is active');
assert.ok(!shader.fragmentShader.includes('vSeaD'),'inland river does not become sea surf');
const attrs=water.geometry.attributes;
for(const name of ['position','color','aFlow','aShore'])assert.ok(attrs[name].array.every(Number.isFinite),name);
for(const p of inland.points){
 const raw=riverNear(game,p.x,p.z).waterHeight,t=Math.max(0,Math.min(1,(game.atlasHeight(p.x,p.z)-.30)/3.7)),old=.78+(raw-.78)*t*t*(3-2*t);
 assert.ok(Math.abs(visibleRiverHeight(game,p.x,p.z)-old)<1e-9,'restore established inland water levels');
}
let samples=0,maxStep=0,maxDelta=0;
for(const e of edges.filter(e=>!e.to.land))for(const p of e.points){
 const h=baseHeight(game,p.x,p.z),shore=estuaryShoreHeightV323(game,p.x,p.z);
 assert.ok(Number.isFinite(shore));
 maxDelta=Math.max(maxDelta,Math.abs(h-shore));
 // The filter is inactive outside the narrow coast band: never excavate a
 // broad estuary terrace or alter upstream river banks.
 if(Math.abs(h-.72)>=4)assert.equal(shore,h);
 for(const d of [-24,-12,0,12,24]){
  const x=p.x+d,z=p.z,val=estuaryShoreHeightV323(game,x,z),next=estuaryShoreHeightV323(game,x+.01,z);
  maxStep=Math.max(maxStep,Math.abs(next-val));
  const local=localNaturalSeaGroundV322(game,{x,z},0,0,DETAIL_X,DETAIL_Z)/.30+.7;
  assert.ok(Math.abs(local-val)<1e-9,'sea and natural shore use exactly the same height');samples++;
 }
}
assert.ok(maxStep<.15,'no abrupt coastal plateau boundary over a centimetre: '+maxStep);
assert.ok(samples>100);assert.equal(JSON.stringify(game.s),saved,'rendering does not change saved game data');
const main=readFileSync(new URL('../civilization.js',import.meta.url),'utf8'),atlas=readFileSync(new URL('../atlas-style.js',import.meta.url),'utf8');
assert.ok(!main.includes('unifiedWaterStepsV324'));assert.ok(!atlas.includes('createUnifiedWaterV324'));
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),boot=readFileSync(new URL('../boot-v83.js',import.meta.url),'utf8');
assert.ok(html.includes('src="boot-v83.js?v=325a"'));assert.ok(boot.includes("import('./civilization.js?v=325a')"));
// Reproducible real geometry around the same wide seed-77 outlet as V324.
const e=edges.find(e=>!e.to.land&&e.c.riverWidth>6)||edges.find(e=>!e.to.land),p=e.points.at(-5),x=p.x,z=p.z,n=136,radius=85,heights=[];
for(let iz=0;iz<=n;iz++)for(let ix=0;ix<=n;ix++)heights.push(visualElevation(game,x-radius+ix*radius*2/n,z-radius+iz*radius*2/n));
mkdirSync('reports',{recursive:true});writeFileSync('reports/river-estuary-v325-geometry.json',JSON.stringify({x,z,n,radius,heights}));
const report={samples,maxStep,maxDelta,riverVertices:attrs.position.count,inlandFlowRestored:true,broadEstuaryExcavation:false};
writeFileSync('reports/river-estuary-v325.json',JSON.stringify(report,null,2));console.log('V325 river appearance and coastal continuity PASS',report);
group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
