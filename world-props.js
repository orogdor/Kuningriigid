// V58: evenly distributed, quality-aware GPU deployment of five low-poly World Atlas GLB props.
// Uses real GLB geometry. Does not claim 3-view Mudelitehas 0.1.2 certification.
import * as T from './vendor/three.module.js';
import {crossingTemplate,crossingFrame,applyCrossingTransform} from './landscape-polish-v84.js?v=162a';
import {loadWorldGLB} from './scripts/glb_lite.js';
import {createWorldObjectCatalog} from './world-object-catalog.js';
const ROOT='./assets/world1000/';
const FILES={village:'world_village_1000',ruins:'ancient_ruin_1000',rock:'rock_outcrop_1000',bridge:'river_bridge_1000',forest:'forest_cluster_1000'};
export function createWorldAtlasProps(game,scene,quality='medium'){
 const group=new T.Group();scene.add(group);
 const templates=new Map(),instanced=[],dummy=new T.Object3D(),obj=new T.Object3D();
 let ready=false,lastRevision=null;
 // Select props evenly across the whole map. Taking the first N from the
 // row-major cell array made distant southern areas comparatively empty.
 // Keep crossings independent of detail quality: visible bridges aid navigation.
 const catalog=createWorldObjectCatalog(game,quality),candidates=catalog.candidates;
 const multipliers={rock:1.65,forest:1.55,bridge:1.35};
 function materialize(){
  for(const item of instanced)group.remove(item.mesh);instanced.length=0;
  for(const kind of ['rock','forest','bridge']){
   const variants=kind==='bridge'?[false,true]:[null];
   for(const ford of variants){
    const template=kind==='bridge'?crossingTemplate(ford):templates.get(kind),sites=candidates[kind].filter(c=>kind!=='bridge'||!c.bridge===ford);if(!template||!sites.length)continue;
    for(const src of template.children){if(!src.isMesh)continue;
     const mesh=new T.InstancedMesh(src.geometry,src.material,sites.length);
     mesh.name='atlas1000_'+kind+'_'+src.name;mesh.frustumCulled=false;mesh.userData.worldProp=kind;group.add(mesh);
     instanced.push({kind,mesh,sites,visibility:[]});
    }
   }
  }
 }
 let crossingRevision=-1;
 function update(force=false){if(!ready)return;const bridges=game.s.crossingRevision||0;if(bridges!==crossingRevision){crossingRevision=bridges;materialize();force=true}const rev=game.s.visionRevision||0;if(!force&&rev===lastRevision)return;lastRevision=rev;
  for(const {kind,mesh,sites,visibility} of instanced){let changed=false;sites.forEach((cell,i)=>{
   const visible=game.seen(0,cell);if(!force&&visibility[i]===visible)return;visibility[i]=visible;changed=true;
   if(kind==='bridge'){
    applyCrossingTransform(obj,crossingFrame(game,cell));
    if(!visible)obj.matrix.makeScale(0,0,0);mesh.setMatrixAt(i,obj.matrix);obj.matrixAutoUpdate=true;return;
   }
   obj.position.set(cell.x,game.atlasHeight(cell.x,cell.z)+.45,cell.z);obj.scale.setScalar(visible?multipliers[kind]:0);
   obj.rotation.set(0,game.noise(cell.c,cell.r+16)*Math.PI*2,0);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);
  });if(changed)mesh.instanceMatrix.needsUpdate=true;}
 }
 function landmark(kind){const src=templates.get(kind);if(!src)return null;const copy=src.clone(true);copy.scale.setScalar(kind==='village'?2.15:2.05);copy.name='World Atlas 1000 '+kind;return copy}
 const initialized=Promise.allSettled(Object.entries(FILES).map(async ([kind,name])=>{
  const m=await loadWorldGLB(ROOT+name+'.glb');templates.set(kind,m);return kind;
 })).then(results=>{const errors=results.filter(r=>r.status==='rejected');if(errors.length)console.warn('World Atlas 1000 GLB load incomplete:',errors.map(r=>r.reason));materialize();ready=true;update(true);return errors.length===0;});
 return {group,get ready(){return ready},initialized,landmark,update,
  // The detail renderer uses exactly the same selected atlas props.
  siteCatalog:catalog,
  detailModel(kind){return templates.get(kind)?.clone(true)||null},
  counts:catalog.counts};
}
