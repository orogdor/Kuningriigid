// World-scale foliage and geological landmarks, light-weight instanced geometry.
// This module affects only the presentation. No gameplay pathfinding or yield changes.
import * as T from './vendor/three.module.js';
import {surface,riverNear} from './continuous-landscape.js?v=68d';

function instanceGroup(group, kind, entries, geometry, color, castShadow=false){
 if(!entries.length)return null;
 const mesh=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({color,roughness:1,flatShading:kind==='rock'}),entries.length);
 const dummy=new T.Object3D();
 for(let i=0;i<entries.length;i++){
  const p=entries[i];dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.rot||0,0);dummy.scale.set(p.sx,p.sy,p.sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  if(p.color)mesh.setColorAt(i,new T.Color(p.color));
 }
 mesh.instanceMatrix.needsUpdate=true;
 if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 mesh.castShadow=castShadow;mesh.receiveShadow=false;
 mesh.userData.atlasBiomeV47=kind;
 group.add(mesh);return mesh;
}
const palette={
 leafy:['#446c43','#527747','#64884c','#78924d'],jungle:['#315b3d','#416b3e','#507e4b'],
 pine:['#496c58','#547866','#375b54'],taiga:['#5c765f','#617f67','#48665c'],
 palms:['#647c3e','#758d43','#4e7540'],cactus:['#62836c','#71855c'],
 boulders:['#92968d','#858b83','#a9a99a'],sand:['#c5b487','#bfa975']
};
function color(arr,idx){return arr[idx%arr.length]}
import {addV48Instances} from './model-runtime-v48.js';

// V48: single batched draw per authored asset. Farther and mobile quality modes
// retain a lower object density; mesh topology is shared between all instances.
export function createAtlasBiomeDetail(game,group,quality='medium'){
 const factor=quality==='high'?.60:quality==='low'?.15:.29;
 const oak=[],pine=[],palm=[],cactus=[],rock=[];
 const startSet=new Set((game.startLocations||[]).map(p=>p.c+':'+p.r));
 let biomes={};
 for(const cell of game.cells){
  const biome=cell.visualBiome||cell.biome;biomes[biome]=(biomes[biome]||0)+1;
  if(!cell.land||cell.mountain||cell.river||startSet.has(cell.c+':'+cell.r))continue;
  const j=game.noise;let density=0,type='oak';
  if(['forest','coastal_forest'].includes(biome)){density=6;type='oak'}
  else if(biome==='jungle'||biome==='coastal_jungle'){density=7;type='palm'}
  else if(biome==='taiga'){density=7;type='pine'}
  else if(biome==='grassland'||biome==='coastal_grassland'){density=1.0;type='oak'}
  else if(biome==='lush_river'){density=3;type='oak'}
  else if(biome==='steppe'||biome==='coastal_steppe'){density=.5;type='oak'}
  else if(biome==='desert'){density=.7;type='cactus'}
  const effective=density*factor,count=Math.floor(effective+(j(cell.c+17,cell.r+201)<effective%1?1:0));
  for(let i=0;i<count;i++){
   const nx=j(cell.c*29+i*1.7,cell.r*7+i*13.2),nz=j(cell.c*11+i*17.8,cell.r*23+i*4.9);
   const x=cell.x+(nx-.5)*39,z=cell.z+(nz-.5)*39,y=surface(game,x,z,'world'),stream=riverNear(game,x,z);
   if(y<3||y>45||stream.distance<stream.width+3.2)continue;
   const k=j(cell.c*13+i*4.1,cell.r*19+i*2.9),size=3.8+k*4.2,rot=k*6.28;
   const target=type==='pine'?pine:type==='palm'?palm:type==='cactus'?cactus:oak;
   target.push({x,y,z,scale:size/(type==='pine'?1.7:type==='cactus'?1.7:1.45),rot,tint:k>.78?'#d5e4c4':'#ffffff'});
  }
  if(['steppe','desert','tundra','mesa','coastal_steppe'].includes(biome)&&j(cell.c+126,cell.r+113)>.72){
   const x=cell.x+(j(cell.c+31,cell.r+72)-.5)*33,z=cell.z+(j(cell.c+13,cell.r+61)-.5)*33,y=surface(game,x,z,'world'),size=2.2+j(cell.c+7,cell.r+99)*4;
   rock.push({x,y,z,scale:size/1.5,rot:j(cell.c,cell.r)*6.28});
  }
 }
 const defs=[['oak_1000_3',oak],['pine_1000_3',pine],['palm_1000_3',palm],['cactus_1000_3',cactus],['rock_1000_3',rock]];
 defs.forEach(([kind,points])=>addV48Instances(group,kind,points,{castShadow:false,lod:quality}));
 group.userData.visualBiomes=biomes;
 group.userData.natureInstances=defs.reduce((sum,[,a])=>sum+a.length,0);
 group.userData.v48Models=defs.filter(([,a])=>a.length).map(([k])=>k);
 return {biomes,instances:group.userData.natureInstances,models:group.userData.v48Models};
}
