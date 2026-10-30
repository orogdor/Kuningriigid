import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createNatureResourceV229} from '../nature-visuals-v229.js';
import {createGroundCoverV156,grassGeo} from '../ground-detail-v156.js';
import {createGroundCover} from '../graphics-v46.js';
import {terrainMaterial} from '../landscape-v149.js';
for(const kind of ['game','berry','fish','ox']){
 const g=createNatureResourceV229(kind).children[0],box=new T.Box3().setFromObject(g),size=box.getSize(new T.Vector3());
 assert.ok(g.children.length>1);assert.ok(Number.isFinite(size.y));assert.ok(box.min.y>=-.02);assert.ok(box.max.y<2.2);
 for(const m of g.children){let p=m.geometry.attributes.position;assert.ok(p.count>0);assert.equal(p.count%3,0);for(const x of p.array)assert.ok(Number.isFinite(x));}
 console.log(kind,'size',size.toArray().map(v=>v.toFixed(2)).join('x'),'draw calls',g.children.length);
}
const tile={land:true,c:1,r:2,biome:'grassland'};
const cover=createGroundCoverV156(tile,()=>1,'low');assert.ok(cover.children.length>2);assert.ok(cover.children.every(x=>x.isInstancedMesh));
const old=createGroundCover(tile,()=>1,'low');assert.ok(old.children[0].isInstancedMesh);assert.ok(grassGeo().boundingSphere.radius>0);
const mat=terrainMaterial('detail',{x:0,z:0});let shader={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>'};mat.onBeforeCompile(shader);assert.ok(shader.fragmentShader.includes('float organic='));
console.log('PASS instanced ground cover and detail terrain shader');
