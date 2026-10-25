// V75: render the *same* world landmarks and model sites in the detail map.
// Models reuse atlas GLB geometry and materials; fallback templates are shared,
// so changing tiles does not allocate new GPU resources on every visit.
import * as T from './vendor/three.module.js';
import {createCrossingModel} from './landscape-polish-v84.js?v=162a';
import {worldToDetail} from './landscape-shared.js?v=123a';

const stone=new T.MeshStandardMaterial({color:'#8f8a81',roughness:1,flatShading:true});
const stoneLight=new T.MeshStandardMaterial({color:'#b5aa91',roughness:1,flatShading:true});
const wood=new T.MeshStandardMaterial({color:'#775a3c',roughness:1,flatShading:true});
const roof=new T.MeshStandardMaterial({color:'#94754b',roughness:1,flatShading:true});
const leaves=new T.MeshStandardMaterial({color:'#4e7050',roughness:1,flatShading:true});
const templates=new Map();
function addMesh(group,geometry,material,x,y,z){
 const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);
 mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
}
function fallback(kind){
 if(templates.has(kind))return templates.get(kind).clone(true);
 const g=new T.Group();g.name='detail-fallback-'+kind;
 if(kind==='village'){
  for(const [x,z]of [[-7,-4],[6,-2],[0,7]]){
   addMesh(g,new T.CylinderGeometry(3.3,3.4,4,6),wood,x,2,z);
   addMesh(g,new T.ConeGeometry(4.5,3.5,6),roof,x,5.7,z);
   addMesh(g,new T.BoxGeometry(1.4,2.4,.25),stoneLight,x,1.4,z+3.3);
  }
 }else if(kind==='ruins'){
  addMesh(g,new T.CylinderGeometry(11,11,1,8),stone,0,.4,0);
  for(const [x,z,h]of [[-7,-4,5],[7,-4,8],[-7,5,3.6],[7,5,6]]){
   addMesh(g,new T.CylinderGeometry(1.5,1.7,h,7),stoneLight,x,h/2+.6,z);
  }
  addMesh(g,new T.BoxGeometry(11,1.5,2.5),stone,0,1.5,2);
 }else if(kind==='forest'){
  for(const [x,z,h]of [[0,0,7],[-5,4,6],[5,-3,9],[-6,-5,5],[7,6,6]]){
   addMesh(g,new T.CylinderGeometry(.7,1.1,h*.55,6),wood,x,h*.27,z);
   addMesh(g,new T.ConeGeometry(3.1,h*.8,7),leaves,x,h*.78,z);
  }
 }else if(kind==='bridge'){
  addMesh(g,new T.BoxGeometry(11,1.3,24),wood,0,1,0);
  for(const x of [-5,5]){
   for(const z of [-9,0,9])addMesh(g,new T.BoxGeometry(.8,4,.8),stone,x,1.9,z);
  }
 }else{
  for(const [x,z,r]of [[0,0,5],[-5,3,3.1],[5,-2,3.8]]){
   const rock=addMesh(g,new T.DodecahedronGeometry(r,0),stone,x,r*.47,z);
   rock.rotation.y=(x+z+8)*.27;rock.scale.y=.75;
  }
 }
 templates.set(kind,g);return g.clone(true);
}
const sizeByKind={village:35,ruins:30,forest:28,rock:23,bridge:28};
export function buildDetailWorldObjects(game,worldProps,tile,height){
 const holder=new T.Group();
 holder.name='V75 detail world objects '+tile.c+':'+tile.r;
 const sites=worldProps.siteCatalog.at(tile),ids=[];
 for(const site of sites){
  // The local view must not reveal a village/ruin hidden by fog of war on the atlas.
  if(!game.seen(0,site.cell))continue;
  if(site.kind==='bridge'){
   const built=game.contextAt(site.cell,false)?.economy.buildings.some(b=>b.type==='bridge'&&b.ready);
   if(built)continue; // The selectable city building supplies the same crossing.
   const model=createCrossingModel(game,site.cell,'detail',tile,height);
   model.userData.worldSiteId=site.id;model.userData.worldProp=site.kind;model.name='detail-world-site '+site.id;
   holder.add(model);ids.push(site.id);continue;
  }
  const model=worldProps.detailModel(site.kind)||fallback(site.kind);
  const box=new T.Box3().setFromObject(model);
  const width=Math.max(.01,box.max.x-box.min.x,box.max.z-box.min.z);
  const scale=sizeByKind[site.kind]/width;
  const p=worldToDetail(tile,site.cell.x,site.cell.z);
  // Ground all objects by their lowest source vertex, including non-centered GLBs.
  const centerX=(box.max.x+box.min.x)/2,centerZ=(box.max.z+box.min.z)/2;
  const y=height(p.x,p.z);
  model.scale.multiplyScalar(scale);
  model.position.set(p.x-centerX*scale,y-box.min.y*scale+.12,p.z-centerZ*scale);
  model.rotation.y=site.kind==='bridge'
   ?(site.cell.riverTo?Math.atan2(site.cell.riverTo.r-site.cell.r,site.cell.riverTo.c-site.cell.c):(site.cell.riverDir==='h'?Math.PI/2:0))
   :game.noise(site.c,site.r+16)*Math.PI*2;
  // Claiming a place must not erase its physical village/ruins from the map.
  model.userData.worldSiteId=site.id;
  model.userData.worldProp=site.kind;
  model.userData.claimedBy=site.landmark?.claimedBy??null;
  model.name='detail-world-site '+site.id;
  holder.add(model);ids.push(site.id);
 }
 holder.userData.siteIds=ids;
 return holder;
}
