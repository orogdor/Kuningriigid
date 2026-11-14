import {WATER_STYLE_V326} from './water-style-v326.js';
import {atlasSeaGeometryV326,atlasGroundSamplerV326} from './atlas-sea-v326.js';
import {spatialInstances} from './spatial-batches-v86.js?v=86a';
import * as T from './vendor/three.module.js';
import {smoothBiomeColor,groundBaseColor,cellRegion,regionContour,regionFill} from './landscape-v149.js?v=162a';
import {createMountainOutcrops} from './landscape-polish-v84.js?v=162a';
import {createV48Mesh} from './model-runtime-v48.js';
import {createTerritoryChunksV351} from './territory-chunks-v351.js';
import {roadPoints,roadLevel,roadStrength} from './roads.js?v=59';
import {createAtlasBiomeDetail} from './atlas-biomes-v47.js?v=162a';
import {settlementGeometry,getWorldModel,WORLD_MODEL_MATERIAL,SETTLEMENT_MATERIAL} from './world-models-v152.js?v=161a';
import {seaMaterial} from './sea-v158.js?v=161a';
import {createRiverNetwork,createUnifiedRoadNetwork,disposeNetwork} from './continuous-landscape-visual.js?v=162a';
import {surface,riverNear} from './continuous-landscape.js?v=162a';
import {COLS,ROWS,WORLD_WIDTH,WORLD_DEPTH,WORLD_CENTER_X,WORLD_CENTER_Z,ORIGIN_X,ORIGIN_Z,center} from './campaign.js';
const palette={
 sea:'#173f58',deepSea:'#102d4e',shallow:'#64aba7',beach:'#dfcea0',coastGrass:'#b7c28b',
 grass:'#92ae69',lush:'#79a763',steppe:'#a9ab72',forest:'#4f7756',jungle:'#3f6b46',
 desert:'#c4b078',mesa:'#997e63',tundra:'#a8ad97',taiga:'#6a7e64',
 hills:'#777d74',mountain:'#767c79',snow:'#e8e7dc',river:'#68a8bf'
};
function visualBiome(cell){
 if(!cell)return 'sea';
 if(cell.visualBiome)return cell.visualBiome;
 if(!cell.land)return 'sea';
 if(cell.mountain)return cell.h>38?'snow_mountain':'mountain';
 return cell.biome==='forest'?'forest':'grassland';
}
function biomeBaseColor(game,cell,h,x,z){
 const vb=visualBiome(cell), climate=cell.visualClimate||{}, north=game.s.geographyVersion?Math.abs((z-ORIGIN_Z)/WORLD_DEPTH-.5)*2:Math.abs((z-ORIGIN_Z)/WORLD_DEPTH-.5)*2;
 let color=new T.Color(h<.7?palette.shallow:h<3.4?palette.beach:palette.grass);
 if(vb==='grassland')color.set(palette.grass);
 else if(vb==='coastal_grassland')color.set(palette.coastGrass);
 else if(vb==='steppe'||vb==='coastal_steppe')color.set(palette.steppe);
 else if(vb==='forest'||vb==='coastal_forest')color.set(palette.forest);
 else if(vb==='jungle'||vb==='coastal_jungle')color.set(palette.jungle);
 else if(vb==='lush_river')color.set(palette.lush);
 else if(vb==='desert')color.set(palette.desert);
 else if(vb==='mesa')color.set(palette.mesa);
 else if(vb==='tundra')color.set(palette.tundra);
 else if(vb==='taiga')color.set(palette.taiga);
 else if(vb==='snow')color.set(palette.snow);
 else if(vb==='mountain')color.set(palette.mountain);
 else if(vb==='snow_mountain')color.set('#929b91');
 if(h<.7)color.set(palette.shallow);
 if(h>=3.4&&vb.startsWith('coastal_'))color.lerp(new T.Color(palette.beach),.16);
 if((vb==='mountain'||vb==='snow_mountain')&&h>22)color.lerp(new T.Color('#9aa09b'),.22);
 if((climate.lat??north)>.78&&h>3&&vb!=='desert'&&vb!=='mesa')color.lerp(new T.Color('#d7ddd2'),Math.max(0,((climate.lat??north)-.78)*1.6));
 return color;
}
// V150: biome colours blend smoothly between neighbouring cells along warped natural edges
// (no square tiles); beaches and shallows still follow the real height; grain cells show
// a patchwork of strip fields painted into the ground.
const atlasBase=(game,cell,out)=>groundBaseColor(cell,out); // V161: same palette as the detail map
export function atlasColor(game,x,z,h){
 const c=Math.min(COLS-1,Math.max(0,Math.floor((x-ORIGIN_X)/50))),r=Math.min(ROWS-1,Math.max(0,Math.floor((z-ORIGIN_Z)/50))),cell=game.cells[r*COLS+c];
 let color=smoothBiomeColor(game,x,z,'ground',(cl,out)=>atlasBase(game,cl,out));
 if(h<.7)color.set(palette.shallow);
 else if(h<3.4)color.lerp(new T.Color(palette.beach),Math.min(1,(3.4-h)/1.6)*.85);
 // Water is drawn by the real 3D channel. Do not paint the entire 50 m
 // river tile blue; it made square-ended ribbons and polygon patches.
 if(cell?.river){const near=riverNear(game,x,z);if(near.distance<near.width*1.6)color.lerp(new T.Color('#728e74'),.10)}
 color.multiplyScalar(.92+game.smooth(x/17+20,z/17+30)*.14);
 return color;
}
export function createAtlasDecor(game,scene,quality='medium',{terrainGeometry=null}={}){const group=new T.Group();scene.add(group);const height=(x,z)=>Math.max(.7,surface(game,x,z,'world'));const material=c=>new T.MeshStandardMaterial({color:c,roughness:1});
 // One ocean mesh uses depth-dependent color, showing shelves and deep water.
 const seaSource=terrainGeometry||new T.PlaneGeometry(WORLD_WIDTH+200,WORLD_DEPTH+200,COLS*3,ROWS*3);
 if(!terrainGeometry){seaSource.rotateX(-Math.PI/2);seaSource.translate(WORLD_CENTER_X,0,WORLD_CENTER_Z);
  const p=seaSource.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,game.atlasHeight(p.getX(i),p.getZ(i)));}
 const worldGroundV326=atlasGroundSamplerV326(seaSource);
 const geo=atlasSeaGeometryV326(game,seaSource);if(!terrainGeometry)seaSource.dispose();
 const water=new T.Mesh(geo,seaMaterial({scale:1}));water.position.y=.72;water.userData.water=true;group.add(water);group.userData.water=water;
 const shore=[];for(let z=ORIGIN_Z;z<ORIGIN_Z+WORLD_DEPTH;z+=10)for(let x=ORIGIN_X;x<ORIGIN_X+WORLD_WIDTH;x+=10){const points=[[x,z],[x+10,z],[x+10,z+10],[x,z+10]],hits=[];for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4],ha=game.atlasHeight(...a)-.8,hb=game.atlasHeight(...b)-.8;if((ha>0)!==(hb>0)){const t=ha/(ha-hb);hits.push([a[0]+(b[0]-a[0])*t,1.04,a[1]+(b[1]-a[1])*t])}}if(hits.length===2){const near=riverNear(game,x+5,z+5);/* V249: no coast line drawn across a river mouth */if(near.distance>near.width*1.6+4)shore.push(...hits[0],...hits[1])}}group.add(new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(shore,3)),new T.LineBasicMaterial({color:WATER_STYLE_V326.shallow,transparent:true,opacity:.06})));
 // The shared flowing-water shader supplies ocean motion; no extra pale strokes.
 const waveLines=new T.Group();group.add(waveLines);group.userData.waveLines=waveLines;
 // Continuous terrain relief replaces separate rock instances.
 const peaks=game.cells.filter(c=>c.mountain);
 const dummy=new T.Object3D();
 // Civ-style world variety: fields, forests, jungles, tundra woods, deserts and mesas.
 const fields=game.cells.filter(c=>c.deposits.grain),
       plots=new T.InstancedMesh(new T.PlaneGeometry(17,12),material('#b9aa60'),fields.length),
       rocks=game.cells.filter(c=>c.deposits.stone&&c.biome!=='hills'),
       stones=new T.InstancedMesh(getWorldModel('rock','low'),WORLD_MODEL_MATERIAL,rocks.length);if(quality!=='low')stones.userData.lodGeometries={high:getWorldModel('rock','high'),low:getWorldModel('rock','low')};
 // V150: fields are painted into the terrain as strip-field patchwork (farmlandTint); no flat plates.
 plots.count=0;
 rocks.forEach((a,i)=>{dummy.position.set(a.x-10,height(a.x-10,a.z)-.2,a.z);dummy.rotation.set(0,i*1.4,0);dummy.scale.set(3.2,3.4,3.2);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix)});
 group.add(spatialInstances(plots),spatialInstances(stones));
 const nature=createAtlasBiomeDetail(game,group,quality,worldGroundV326);
 // All tributaries and banks are one connected world-space 3D network.
 let rivers=createRiverNetwork(game,'world',null,quality,worldGroundV326),crossingRevision=game.s.crossingRevision||0;group.add(rivers);group.add(createMountainOutcrops(game,'world'));
 // Real-world traffic generates the atlas road network (no roads appear just because a route was planned).
 const roadGroup=new T.Group();roadGroup.name='V67 continuous road graph';roadGroup.userData.roadNetwork=true;group.add(roadGroup);let roadStamp='',roadRaw='';
 function roads(state){
  if(crossingRevision!==(state.crossingRevision||0)){crossingRevision=state.crossingRevision||0;group.remove(rivers);disposeNetwork(rivers);rivers=createRiverNetwork(game,'world',null,quality,worldGroundV326);group.add(rivers)}
  const raw=(state.roadRevision||0)+':'+(state.railRevision||0)+':'+(state.visionRevision||0);
  if(raw===roadRaw)return;roadRaw=raw;
  // V351: a road or rail piece is drawn when both of its ends are known. Discovering map cells
  // rebuilds the network only when that changes for some piece, not for every new cell.
  let known='';
  for(const edges of [state.worldRoads,state.railEdges]){for(const key of Object.keys(edges||{})){const [a,b]=roadPoints(key);known+=a&&b&&game.seen(0,a)&&game.seen(0,b)?'1':'0';}known+='|';}
  const stamp=(state.roadRevision||0)+':'+(state.railRevision||0)+':'+known;
  if(stamp===roadStamp)return;roadStamp=stamp;
  for(const o of [...roadGroup.children]){roadGroup.remove(o);disposeNetwork(o)}
  const network=createUnifiedRoadNetwork(game,'world');
  roadGroup.userData.roadEdges=network.userData.roadEdges;
  roadGroup.userData.roadVertexCount=network.userData.roadVertexCount;
  for(const mesh of [...network.children])roadGroup.add(mesh);
  // Permanent rail sleepers are separate from traffic-eroded footpaths.
  const rails=[];
  for(const key of Object.keys(state.railEdges||{})){
   const [a,b]=roadPoints(key);if(!game.seen(0,a)||!game.seen(0,b))continue;
   const pa=center(a.c,a.r),pb=center(b.c,b.r),dx=pb.x-pa.x,dz=pb.z-pa.z,len=Math.hypot(dx,dz);
   if(!len)continue;const nx=-dz/len*2.4,nz=dx/len*2.4;
   for(const offset of [-1,1]){
    const ax=pa.x+offset*nx,az=pa.z+offset*nz,bx=pb.x+offset*nx,bz=pb.z+offset*nz;
    rails.push(ax,surface(game,ax,az,'world')+1.4,az,bx,surface(game,bx,bz,'world')+1.4,bz);
   }
   for(let step=1;step<10;step++){
    const t=step/10,x=pa.x+dx*t,z=pa.z+dz*t;
    rails.push(x-nx*1.25,surface(game,x-nx*1.25,z-nz*1.25,'world')+1.22,z-nz*1.25,x+nx*1.25,surface(game,x+nx*1.25,z+nz*1.25,'world')+1.22,z+nz*1.25);
   }
  }
  if(rails.length){const railLine=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(rails,3)),new T.LineBasicMaterial({color:'#3f4c56'}));roadGroup.add(railLine)}
 }
 const territories=new T.Group(),routes=new T.Group();group.add(territories,routes);let previous='',lastRoute='';
 function disposeGroup(g){for(const o of [...g.children]){o.geometry?.dispose();o.material?.dispose();g.remove(o)}}
 // V351: territory fills and borders are kept in 8x8-cell chunks (territory-chunks-v351.js). Discovering
 // a map cell or moving a border recomputes only the chunks whose visible territory cells changed;
 // the meshes, their names, materials and draw order are the same as before.
 const territoryChunks=createTerritoryChunksV351(game,{height,vision:()=>({revision:game.s.visionRevision||0,explored:game.s.explored?.[0],all:!!globalThis.KINGDOMS_REVEAL_V248}),stamp:()=>game.territoryStamp}),territoryGeo=new Map(),territoryMat=new Map(),territoryObj=new Map();
 let territoryLayout='',territoryBuilt=false;
 const TERRITORY_BUDGET_MS=5,teamColor=['#3fd2c6','#ff8a66','#b98cff','#ffd75e'];
 const territoryMaterial=(key,make)=>{if(!territoryMat.has(key))territoryMat.set(key,make());return territoryMat.get(key)};
 const territoryGeometry=(key,attributes)=>{const geo=new T.BufferGeometry();for(const [name,array,size] of attributes)geo.setAttribute(name,new T.Float32BufferAttribute(array,size));territoryGeo.get(key)?.dispose();territoryGeo.set(key,geo);const o=territoryObj.get(key);if(o)o.geometry=geo;};
 function territoryObject(key){
  const [kind,a,b,c]=key.split('|'),geo=territoryGeo.get(key);let o;
  if(kind==='fill'||kind==='edge'){
   const team=+b,rural=c==='true',color=rural?['#b6ce75','#dba082','#bca3d6','#dfcc87'][team]:['#69d4c3','#e77e64','#ac87e2','#ead06b'][team];
   if(kind==='fill'){o=new T.Mesh(geo,territoryMaterial(key,()=>new T.MeshBasicMaterial({color,vertexColors:true,transparent:true,opacity:rural?.07:.11,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8})));o.name=rural?'county area':'urban area';}
   else{o=new T.LineSegments(geo,territoryMaterial(key,()=>new T.LineBasicMaterial({color,transparent:true,opacity:rural?.95:.9})));o.name=rural?'county border':'urban border';}
  }else if(kind==='glow'){
   o=new T.Mesh(geo,territoryMaterial(key,()=>new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.42,side:T.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8})));o.name='national border glow '+a;o.renderOrder=13;
  }else{
   const i=kind==='underlay'?0:+a+1;
   o=new T.Mesh(geo,territoryMaterial(key,()=>new T.MeshBasicMaterial({color:i===0?'#f4ecd4':teamColor[i-1],side:T.DoubleSide,transparent:true,opacity:i===0?.85:1,depthWrite:false,depthTest:false})));o.name=i===0?'national border outline':'national border '+(i-1);o.renderOrder=i===0?14:15;
  }
  return o;
 }
 function territory(state){
  game.refreshTerritory();const stamp=game.territoryStamp+':'+(state.visionRevision||0);
  if(stamp===previous&&!territoryChunks.pending)return;
  if(stamp!==previous){previous=stamp;territoryChunks.sync();}
  // The first build (new game, loaded save) is done at once; later changes are spread over frames.
  const {changed}=territoryChunks.work(territoryBuilt?TERRITORY_BUDGET_MS:Infinity);territoryBuilt=true;
  const layers=territoryChunks.layers;let teamChanged=false;
  for(const id of changed){
   const L=layers.get(id);if(!L)continue;
   if(L.kind==='group'){
    // V150: rounded, natural-looking territory shapes (same cells, smooth outline).
    territoryGeometry('fill|'+id,[['position',L.arrays.fill,3],['color',L.arrays.rgba,4]]);
    territoryGeometry('edge|'+id,[['position',L.arrays.edges,3]]);
   }else{
    // V152: country borders read as a map border, not as a river: a dashed line (cream edge, team core)
    // plus a soft team-coloured glow that fades inwards from the border.
    teamChanged=true;
    const c=new T.Color(teamColor[L.team]),n=L.arrays.glowAlpha.length,col=new Float32Array(n*4);
    for(let i=0;i<n;i++){col[i*4]=c.r;col[i*4+1]=c.g;col[i*4+2]=c.b;col[i*4+3]=L.arrays.glowAlpha[i];}
    territoryGeometry('glow|'+L.team,[['position',L.arrays.glowPos,3],['color',col,4]]);
    territoryGeometry('national|'+L.team,[['position',L.arrays.national,3]]);
   }
  }
  const teams=[0,1,2,3].map(team=>layers.get('t|'+team)).filter(L=>L?.arrays);
  const underlayKey=teams.map(L=>L.id+':'+L.version).join(' ');
  if(teamChanged||underlayKey!==territory.underlayKey){
   territory.underlayKey=underlayKey;
   const size=teams.reduce((n,L)=>n+L.arrays.underlay.length,0),underlay=new Float32Array(size);let offset=0;
   for(const L of teams){underlay.set(L.arrays.underlay,offset);offset+=L.arrays.underlay.length;}
   territoryGeometry('underlay',[['position',underlay,3]]);
  }
  // Same children in the same order as the old whole-world pass created them.
  const want=[];
  for(const id of territoryChunks.order){const L=layers.get(id);if(L.kind==='group'&&L.arrays)want.push('fill|'+id,'edge|'+id);}
  for(const L of teams)if(L.arrays.glowPos.length)want.push('glow|'+L.team);
  if(teams.some(L=>L.arrays.underlay.length))want.push('underlay');
  for(const L of teams)if(L.arrays.national.length)want.push('national|'+L.team);
  const layout=want.join(' ');
  if(layout!==territoryLayout){
   territoryLayout=layout;
   for(const o of [...territories.children])territories.remove(o);territoryObj.clear();
   for(const key of want){const o=territoryObject(key);territoryObj.set(key,o);territories.add(o);}
   const keep=new Set(want);
   for(const [key,geo] of territoryGeo)if(!keep.has(key)){geo.dispose();territoryGeo.delete(key);}
   for(const [key,material] of territoryMat)if(!keep.has(key)){material.dispose();territoryMat.delete(key);}
  }
 }
 function route(state,mover){const path=mover?.path||[],stamp=(mover?.c??'')+':'+(mover?.r??'')+JSON.stringify(path);if(stamp===lastRoute)return;lastRoute=stamp;disposeGroup(routes);if(!path.length)return;const tiles=[mover,...path],points=[];for(let i=1;i<tiles.length;i++){const a=center(tiles[i-1].c,tiles[i-1].r),b=center(tiles[i].c,tiles[i].r);for(let j=0;j<10;j++){const x=a.x+(b.x-a.x)*j/10,z=a.z+(b.z-a.z)*j/10;points.push(new T.Vector3(x,height(x,z)+2,z))}}const end=center(path.at(-1).c,path.at(-1).r);points.push(new T.Vector3(end.x,height(end.x,end.z)+2,end.z));const line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineDashedMaterial({color:'#f4d48b',dashSize:5,gapSize:3,transparent:true,opacity:1,depthTest:false}));line.computeLineDistances();routes.add(line);const dots=new T.InstancedMesh(new T.RingGeometry(2,3,12),new T.MeshBasicMaterial({color:'#fae4a4',side:T.DoubleSide,depthTest:false,depthWrite:false}),path.length);path.forEach((p,i)=>{const q=center(p.c,p.r);dummy.position.set(q.x,height(q.x,q.z)+2,q.z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix)});routes.add(dots)}

 return {group,ground:worldGroundV326,territory,territoryChunks,territories,route,roads,routes,waveLines,peaks:peaks.length,shoreSegments:shore.length/6,nature};
}
// V46: readable settlement silhouettes from prehistoric huts to modern urban skylines.
const cityMaterials=new Map(),cityGeometries=new Map();
function cityMat(c,metal=false){const k=c+metal;if(!cityMaterials.has(k))cityMaterials.set(k,new T.MeshStandardMaterial({color:c,roughness:metal?.45:.91,metalness:metal?.2:0}));return cityMaterials.get(k)}
function cityGeom(key,fn){if(!cityGeometries.has(key)){const g=fn();g.userData.shared=true;cityGeometries.set(key,g)}return cityGeometries.get(key)}
export function createCityMiniature(team,age){
 // V152: one merged, era-specific settlement model (pitched-roof houses, landmark, lanes, walls).
 const g=new T.Group(),mesh=new T.Mesh(settlementGeometry(team,Math.max(0,Math.min(6,age|0))),SETTLEMENT_MATERIAL);
 mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.modelName='settlement_v152';g.add(mesh);
 g.userData.age=age;return g;
}
// V158: compact city label – dark rounded plate, team-coloured shield, name and population,
// constant size on screen (sizeAttenuation off) so it never covers the town when zoomed in.
export function cityBanner(name,team){
 const m=/^(.*?)\s*·\s*(\d+)\s*(?:el\.|elanikku|residents)?\s*$/.exec(name),title=m?m[1]:name,pop=m?m[2]:'';
 const canvas=document.createElement('canvas');canvas.width=520;canvas.height=104;const ctx=canvas.getContext('2d');
 const team_=['#4f9a92','#c0634a','#8a6cc0','#c9a43a'][team]||'#4f9a92';
 if(ctx.roundRect){ctx.fillStyle='rgba(12,26,28,.86)';ctx.beginPath();ctx.roundRect(4,12,512,80,40);ctx.fill();ctx.strokeStyle='rgba(230,199,126,.75)';ctx.lineWidth=3;ctx.stroke();}
 else if(ctx.fillRect){ctx.fillStyle='rgba(12,26,28,.86)';ctx.fillRect(4,12,512,80);}
 // team shield
 if(ctx.beginPath){ctx.fillStyle=team_;ctx.beginPath();ctx.moveTo(30,30);ctx.lineTo(70,30);ctx.lineTo(70,58);ctx.quadraticCurveTo?.(70,76,50,84);ctx.quadraticCurveTo?.(30,76,30,58);ctx.closePath?.();ctx.fill();ctx.strokeStyle='rgba(255,240,200,.8)';ctx.lineWidth=2.5;ctx.stroke();}
 if(ctx.fillText){let size=38;ctx.font='600 '+size+'px Georgia,serif';const maxW=pop?330:410;while(ctx.measureText&&ctx.measureText(title).width>maxW&&size>22){size-=2;ctx.font='600 '+size+'px Georgia,serif';}
  ctx.fillStyle='#f4ead2';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(title,88,53);
  if(pop){ctx.font='600 30px Inter,Arial,sans-serif';ctx.textAlign='right';ctx.fillStyle='#e6c77e';ctx.fillText('👥 '+pop,496,54);}}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,transparent:true,sizeAttenuation:false}));
 sprite.scale.set(.21,.042,1);sprite.center.set(.5,0);sprite.renderOrder=40;sprite.userData.v158Label=true;return sprite}
