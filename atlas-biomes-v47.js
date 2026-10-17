// World-scale foliage and geological landmarks, light-weight instanced geometry.
// This module affects only the presentation. No gameplay pathfinding or yield changes.
import * as T from './vendor/three.module.js';

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
export function createAtlasBiomeDetail(game,group,quality='medium'){
 const factor=quality==='high'?1:quality==='low'?.26:.57;
 const canopy=[],pine=[],pineTop=[],trunks=[],palm=[],palmTrunks=[],cacti=[],rocks=[],outcrops=[];
 const startSet=new Set((game.startLocations||[]).map(p=>p.c+':'+p.r));
 let biomes={};
 for(const cell of game.cells){
  const biome=cell.visualBiome||cell.biome;biomes[biome]=(biomes[biome]||0)+1;
  if(!cell.land||cell.mountain||cell.river||startSet.has(cell.c+':'+cell.r))continue;
  const j=game.noise;
  let density=0,type='oak';
  if(['forest','coastal_forest'].includes(biome)){density=7;type='oak'}
  else if(biome==='jungle'||biome==='coastal_jungle'){density=9;type='jungle'}
  else if(biome==='taiga'){density=8;type='pine'}
  else if(biome==='grassland'||biome==='coastal_grassland'){density=1.4;type='oak'}
  else if(biome==='lush_river'){density=3;type='oak'}
  else if(biome==='steppe'||biome==='coastal_steppe'){density=.55;type='oak'}
  else if(biome==='desert'){density=.8;type='cactus'}
  const count=Math.floor(density*factor+(j(cell.c+17,cell.r+201)<density*factor%1?1:0));
  for(let i=0;i<count;i++){
   const nx=j(cell.c*29+i*1.7,cell.r*7+i*13.2),nz=j(cell.c*11+i*17.8,cell.r*23+i*4.9);
   const x=cell.x+(nx-.5)*39,z=cell.z+(nz-.5)*39,y=game.atlasHeight(x,z);
   if(y<3||y>32)continue;
   const k=j(cell.c*13+i*4.1,cell.r*19+i*2.9),size=3.8+k*4.2,rot=k*6.28;
   if(type==='cactus'){
    cacti.push({x,y:y+size*.65,z,sx:size*.21,sy:size*1.3,sz:size*.21,rot,color:color(palette.cactus,i)});continue;
   }
   if(type==='pine'){
    const scale=size*(biome==='taiga'?.95:1);
    trunks.push({x,y:y+scale*.58,z,sx:scale*.18,sy:scale*1.15,sz:scale*.18,rot});
    pine.push({x,y:y+scale*1.16,z,sx:scale*.75,sy:scale*1.50,sz:scale*.75,rot,color:color(palette.taiga,i)});
    pineTop.push({x,y:y+scale*1.7,z,sx:scale*.54,sy:scale*1.10,sz:scale*.54,rot,color:color(palette.pine,i+2)});
   }else if(type==='jungle'&&k>.68&&cell.visualClimate?.heat>.66){
    palmTrunks.push({x,y:y+size*.88,z,sx:size*.15,sy:size*1.8,sz:size*.15,rot});
    palm.push({x,y:y+size*1.8,z,sx:size*1.15,sy:size*.5,sz:size*1.15,rot,color:color(palette.palms,i)});
   }else{
    trunks.push({x,y:y+size*.62,z,sx:size*.20,sy:size*1.2,sz:size*.20,rot});
    canopy.push({x,y:y+size*1.32,z,sx:size*(type==='jungle'?1.18:1.0),sy:size*(type==='jungle'?.82:.88),sz:size*(type==='jungle'?1.2:1.0),rot,color:color(type==='jungle'?palette.jungle:palette.leafy,i)});
   }
  }
  // Rocky ridges and scattered stones imply natural geology instead of flat tiles.
  if(['steppe','desert','tundra','mesa','coastal_steppe'].includes(biome) && j(cell.c+126,cell.r+113)>.72){
   let x=cell.x+(j(cell.c+31,cell.r+72)-.5)*33,z=cell.z+(j(cell.c+13,cell.r+61)-.5)*33,y=game.atlasHeight(x,z),size=2.2+j(cell.c+7,cell.r+99)*4;
   rocks.push({x,y:y+size*.38,z,sx:size,sy:size*.8,sz:size*.8,rot:j(cell.c,cell.r)*6,color:color(palette.boulders,cell.c)});
  }
 }
 const cone=new T.ConeGeometry(1,1,7),cylinder=new T.CylinderGeometry(1,1,1,6),leaves=new T.IcosahedronGeometry(1,0),rock=new T.DodecahedronGeometry(1,0);
 instanceGroup(group,'trunk',trunks,cylinder,'#7b624b');
 instanceGroup(group,'broadleaf',canopy,leaves,'#ffffff');
 instanceGroup(group,'conifer',pine,cone,'#ffffff');
 instanceGroup(group,'conifer-tip',pineTop,cone,'#ffffff');
 instanceGroup(group,'palm-trunk',palmTrunks,cylinder,'#92785a');
 instanceGroup(group,'palm-fronds',palm,leaves,'#ffffff');
 instanceGroup(group,'cactus',cacti,cylinder,'#ffffff');
 instanceGroup(group,'outcrop',rocks,rock,'#ffffff');
 group.userData.visualBiomes=biomes;
 group.userData.natureInstances=trunks.length+canopy.length+pine.length+pineTop.length+palm.length+palmTrunks.length+cacti.length+rocks.length;
 return {biomes,instances:group.userData.natureInstances};
}
