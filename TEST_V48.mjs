import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from './vendor/three.module.js';
import {getV48Geometry,createV48Mesh} from './model-runtime-v48.js';
import {createAtlasBiomeDetail} from './atlas-biomes-v47.js';
import {createGame,Civilization} from './civilization-core.js';
import {createCityMiniature,createAtlasDecor} from './atlas-style.js';
import {addTree} from './visuals.js';
const manifest=JSON.parse(fs.readFileSync('models-v48/manifest.json','utf8'));
for(const [name,record] of Object.entries(manifest.models)){
 assert(record.quads>0 && record.quads<=1000,`${name} quad limit`);
 assert(fs.statSync(`models-v48/${name}.glb`).size>1000);
 const mesh=createV48Mesh(name);
 assert(mesh.isMesh);assert(mesh.geometry.index.count/3===record.triangles);
 for(const level of ['high','medium','low']){
  const geo=getV48Geometry(name,level);
  assert(geo.attributes.position.count>0 && Number.isFinite(geo.boundingSphere.radius));
  assert(geo.index.count>0);
 }
}
const tree=new T.Group();addTree(tree,0,0,0,5,1);assert(tree.children[0].userData.modelName==='oak_1000_3'||tree.children[0].userData.modelName==='pine_1000_3');
const game=new Civilization(createGame(101));
for(const quality of ['low','medium','high']){
 const g=new T.Group(),biome=createAtlasBiomeDetail(game,g,quality);
 assert(biome.instances>100 && g.children.length<=5);
 assert(g.children.every(mesh=>mesh.isInstancedMesh));
 console.log('Quality',quality,biome.instances,'trees/rocks,',g.children.length,'draw calls');
}
for(let age=0;age<=6;age++){
 const m=createCityMiniature(0,age);
 assert(m.userData.age===age);
 if(age===3)assert(m.children.some(x=>x.userData.modelName==='market_1000_3'));
}
const scene=new T.Scene(),world=createAtlasDecor(game,scene,'low');
assert(world.nature.instances>100);
console.log('V48 PASS:',Object.keys(manifest.models).length,'GLB models, meshes, 3 levels, 7 eras, world scene');
