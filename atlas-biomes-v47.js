// World-scale foliage and geological landmarks, light-weight instanced geometry.
// This module affects only the presentation. No gameplay pathfinding or yield changes.
import * as T from './vendor/three.module.js';
import {surface,riverNear} from './continuous-landscape.js?v=85a';

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
import {getWorldModel,WORLD_MODEL_MATERIAL} from './world-models-v152.js?v=152a';
import {spatialInstances} from './spatial-batches-v86.js?v=86a';

// V48: single batched draw per authored asset. Farther and mobile quality modes
// retain a lower object density; mesh topology is shared between all instances.
export function createAtlasBiomeDetail(game,group,quality='medium'){
 // V152: new procedural tree, shrub, cactus and rock models (world-models-v152.js) with mixed
 // species per biome and gentle per-tree colour variation. Placement rules are unchanged.
 const factor=quality==='high'?.60:quality==='low'?.15:.29;
 const sets={oak:[],lime:[],birch:[],pine:[],spruce:[],palm:[],cactus:[],rock:[],shrub:[]};
 const startSet=new Set((game.startLocations||[]).map(p=>p.c+':'+p.r));
 const tints=['#ffffff','#f3f7e6','#e6efd6','#fff4de','#e2ead9','#f7f1d4'];
 const species={forest:[['oak',.5],['lime',.28],['birch',.22]],taiga:[['spruce',.48],['pine',.4],['birch',.12]],grass:[['oak',.45],['lime',.3],['birch',.25]],
  lush:[['birch',.35],['lime',.35],['oak',.3]],steppe:[['oak',.6],['lime',.4]],jungle:[['palm',.6],['lime',.4]],desert:[['cactus',1]]};
 const pick=(list,k)=>{let acc=0;for(const [n,w] of list){acc+=w;if(k<acc)return n;}return list[list.length-1][0];};
 let biomes={};
 for(const cell of game.cells){
  const biome=cell.visualBiome||cell.biome;biomes[biome]=(biomes[biome]||0)+1;
  if(!cell.land||cell.mountain||cell.river||startSet.has(cell.c+':'+cell.r))continue;
  const j=game.noise;let density=0,list=species.grass,bush=0;
  if(['forest','coastal_forest'].includes(biome)){density=6;list=species.forest;bush=1}
  else if(biome==='jungle'||biome==='coastal_jungle'){density=7;list=species.jungle;bush=1.5}
  else if(biome==='taiga'){density=7;list=species.taiga;bush=.6}
  else if(biome==='grassland'||biome==='coastal_grassland'){density=1.0;list=species.grass;bush=1.4}
  else if(biome==='lush_river'){density=3;list=species.lush;bush=1.4}
  else if(biome==='steppe'||biome==='coastal_steppe'){density=.5;list=species.steppe;bush=1.6}
  else if(biome==='desert'){density=.7;list=species.desert;bush=.3}
  else if(biome==='tundra'){bush=.9}
  const effective=density*factor,count=Math.floor(effective+(j(cell.c+17,cell.r+201)<effective%1?1:0));
  for(let i=0;i<count;i++){
   const nx=j(cell.c*29+i*1.7,cell.r*7+i*13.2),nz=j(cell.c*11+i*17.8,cell.r*23+i*4.9);
   const x=cell.x+(nx-.5)*39,z=cell.z+(nz-.5)*39,y=surface(game,x,z,'world'),stream=riverNear(game,x,z);
   if(y<3||y>45||stream.distance<stream.width+3.2)continue;
   const k=j(cell.c*13+i*4.1,cell.r*19+i*2.9),kind=pick(list,j(cell.c*5+i*7.3,cell.r*3+i*1.1)),size=3.8+k*4.2,rot=k*6.28;
   const div=kind==='pine'||kind==='spruce'||kind==='cactus'?1.7:kind==='birch'?1.6:1.45;
   sets[kind].push({x,y,z,scale:size/div,rot,tint:tints[Math.floor(j(cell.c+i*3.7,cell.r*2+i)*tints.length)%tints.length]});
  }
  const shrubs=Math.floor(bush*factor*1.5+(j(cell.c+71,cell.r+9)<(bush*factor*1.5)%1?1:0));
  for(let i=0;i<shrubs;i++){
   const x=cell.x+(j(cell.c*7+i*5.1,cell.r*13+i)-.5)*42,z=cell.z+(j(cell.c*3+i,cell.r*17+i*2.3)-.5)*42,y=surface(game,x,z,'world'),stream=riverNear(game,x,z);
   if(y<2.5||y>45||stream.distance<stream.width+2.5)continue;
   const k=j(cell.c+i*9.1,cell.r+i*4.4);
   sets.shrub.push({x,y,z,scale:2.2+k*2.6,rot:k*6.28,tint:biome==='desert'||biome==='steppe'?'#e8dfb4':tints[i%tints.length]});
  }
  if(['steppe','desert','tundra','mesa','coastal_steppe'].includes(biome)&&j(cell.c+126,cell.r+113)>.72){
   const x=cell.x+(j(cell.c+31,cell.r+72)-.5)*33,z=cell.z+(j(cell.c+13,cell.r+61)-.5)*33,y=surface(game,x,z,'world'),size=2.2+j(cell.c+7,cell.r+99)*4;
   sets.rock.push({x,y:y-.15,z,scale:size/1.5,rot:j(cell.c,cell.r)*6.28});
  }
 }
 const defs=Object.entries(sets);
 defs.forEach(([kind,points])=>addWorldModelInstances(group,kind,points,{lod:quality,spatialChunks:true}));
 group.userData.visualBiomes=biomes;
 group.userData.natureInstances=defs.reduce((sum,[,a])=>sum+a.length,0);
 group.userData.v152Models=defs.filter(([,a])=>a.length).map(([k])=>k);
 return {biomes,instances:group.userData.natureInstances,models:group.userData.v152Models};
}
function addWorldModelInstances(group,name,placements,opts={}){
 if(!placements.length)return null;
 const lod=opts.lod||'high',mesh=new T.InstancedMesh(getWorldModel(name,'low'),WORLD_MODEL_MATERIAL,placements.length),dummy=new T.Object3D();
 if(lod!=='low')mesh.userData.lodGeometries={high:getWorldModel(name,lod),low:getWorldModel(name,'low')};
 placements.forEach((p,i)=>{const s=p.scale||1;dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.rot||0,0);dummy.scale.set(s,s*(.9+((i*.618)%1)*.22),s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new T.Color(p.tint||'#ffffff'));});
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=false;mesh.userData.v152Model=name;mesh.name='world '+name;
 const result=opts.spatialChunks?spatialInstances(mesh):mesh;group.add(result);return result;
}
