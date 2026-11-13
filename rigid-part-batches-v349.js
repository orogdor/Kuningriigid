// V349: small rigid parts that many animated models share (tool pieces, carried
// baskets, belt bands, sheep and dog parts) are drawn as one InstancedMesh per
// geometry+material instead of one draw call per part (and one more per part
// in the shadow pass).
//
// The original meshes stay where they are: animation, visibility, picking and
// every other piece of game code keeps working on them. Only the renderer is
// affected. While the renderer walks the scene it asks every mesh whether it
// is inside the view (Object3D.intersectsFrustum). A marked mesh answers "no"
// and hands its current world matrix to the batch instead; the batch is the
// last thing in the scene, so it is uploaded and drawn with this frame's
// matrices. Looks are unchanged: same geometry, same material object, same
// shadow flags, same render order.
//
// A part is drawn the old way whenever instancing could not reproduce it
// exactly: mirrored transforms, sheared transforms (instancing derives normals
// from the instance matrix), transparent or multi-material meshes, morph
// targets, custom render callbacks, or a scene that has no batches attached.
import * as T from './vendor/three.module.js';

const base=T.Mesh.prototype.intersectsFrustum;
const records=new WeakMap(),states=new WeakMap();
let enabled=true,current=null;const stack=[];
export function setRigidPartBatchingV349(on){enabled=!!on;}

const plainCompile=T.Material.prototype.onBeforeCompile,plainBefore=T.Object3D.prototype.onBeforeRender,plainAfter=T.Object3D.prototype.onAfterRender;
function materialOk(m){
 return !!m&&m.isMaterial===true&&!m.transparent&&m.onBeforeCompile===plainCompile
  &&(m.isMeshStandardMaterial||m.isMeshBasicMaterial||m.isMeshLambertMaterial||m.isMeshPhongMaterial)===true;
}
function eligible(mesh){
 const g=mesh.geometry;
 return mesh.isMesh&&!mesh.isInstancedMesh&&!mesh.isSkinnedMesh&&!mesh.isBatchedMesh&&!!g&&materialOk(mesh.material)
  &&!mesh.morphTargetInfluences&&!Object.keys(g.morphAttributes||{}).length;
}
// Checked every frame: things game code may change after marking.
function stillOk(mesh){
 return materialOk(mesh.material)&&!mesh.customDepthMaterial&&!mesh.customDistanceMaterial&&mesh.onBeforeRender===plainBefore&&mesh.onAfterRender===plainAfter;
}
// Mirrored (negative determinant) or sheared matrices cannot be instanced exactly.
function instancable(e){
 const ax=e[0],ay=e[1],az=e[2],bx=e[4],by=e[5],bz=e[6],cx=e[8],cy=e[9],cz=e[10];
 const det=ax*(by*cz-bz*cy)-ay*(bx*cz-bz*cx)+az*(bx*cy-by*cx);if(!(det>0))return false;
 const a=ax*ax+ay*ay+az*az,b=bx*bx+by*by+bz*bz,c=cx*cx+cy*cy+cz*cz,ab=ax*bx+ay*by+az*bz,ac=ax*cx+ay*cy+az*cz,bc=bx*cx+by*cy+bz*cz;
 return ab*ab<=1e-8*a*b&&ac*ac<=1e-8*a*c&&bc*bc<=1e-8*b*c;
}
function batchedTest(frustum){
 const st=current,rec=records.get(this);
 if(!st||!rec||!enabled)return base.call(this,frustum);
 if(st.frustum===null)st.frustum=frustum;
 // Shadow pass (another frustum): already in the batch this frame, or drawn the old way.
 if(frustum!==st.frustum)return rec.frame===st.frame?false:base.call(this,frustum);
 if(rec.frame===st.frame)return false;
 const e=this.matrixWorld.elements;
 if(!stillOk(this)||!instancable(e))return base.call(this,frustum);
 let b=rec.bucket;
 if(!b||b.state!==st||b.geometry!==this.geometry||b.material!==this.material||b.castShadow!==this.castShadow||b.receiveShadow!==this.receiveShadow||b.renderOrder!==this.renderOrder)b=rec.bucket=bucketFor(st,this);
 if(b.count===b.capacity)grow(b);
 const a=b.mesh.instanceMatrix.array,o=b.count++*16;
 for(let i=0;i<16;i++)a[o+i]=e[i];
 a[o+12]-=st.anchor.x;a[o+13]-=st.anchor.y;a[o+14]-=st.anchor.z;
 rec.frame=st.frame;return false;
}
function bucketFor(st,src){
 const key=src.geometry.id+':'+src.material.id+':'+(src.castShadow?1:0)+(src.receiveShadow?1:0)+':'+src.renderOrder;
 let b=st.buckets.get(key);
 if(!b){b={state:st,key,geometry:src.geometry,material:src.material,castShadow:src.castShadow,receiveShadow:src.receiveShadow,renderOrder:src.renderOrder,capacity:0,count:0,idle:0,mesh:null};st.buckets.set(key,b);grow(b,8);}
 return b;
}
function grow(b,capacity=b.capacity*2){
 const old=b.mesh,mesh=new T.InstancedMesh(b.geometry,b.material,capacity);
 mesh.name='V349 rigid parts';mesh.castShadow=b.castShadow;mesh.receiveShadow=b.receiveShadow;mesh.renderOrder=b.renderOrder;
 mesh.matrixAutoUpdate=false;mesh.raycast=()=>{};mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
 // Asked last in the scene walk: every part has been collected by then.
 mesh.intersectsFrustum=function(frustum){
  const st=b.state;if(current!==st)return false;
  if(frustum===st.frustum&&b.uploaded!==st.frame){b.uploaded=st.frame;this.count=b.count;
   if(b.count){this.instanceMatrix.clearUpdateRanges();this.instanceMatrix.addUpdateRange(0,b.count*16);this.instanceMatrix.needsUpdate=true;}}
  return this.count>0;
 };
 mesh.count=0;
 if(old){mesh.instanceMatrix.array.set(old.instanceMatrix.array);old.removeFromParent();old.dispose();}
 b.capacity=capacity;b.mesh=mesh;b.state.holder.add(mesh);mesh.matrixWorld.copy(b.state.holder.matrixWorld);
}

// Mark every suitable mesh under root (or root itself). Safe to call more than once.
export function markRigidPartsV349(root){
 root?.traverse?.(o=>{if(o.isMesh&&!records.has(o)&&eligible(o)){records.set(o,{bucket:null,frame:-1});o.intersectsFrustum=batchedTest;}});
 return root;
}
// Batches are only used in scenes they are attached to (WebGL renderer).
export function attachRigidPartBatchesV349(scene){
 if(states.has(scene))return states.get(scene).api;
 const holder=new T.Group();holder.name='V349 rigid part batches';holder.matrixAutoUpdate=false;scene.add(holder);
 const st={holder,buckets:new Map(),frame:0,frustum:null,anchor:new T.Vector3(),api:null};
 const before=scene.onBeforeRender,after=scene.onAfterRender;
 scene.onBeforeRender=function(renderer,sc,camera,...rest){
  before.call(this,renderer,sc,camera,...rest);
  stack.push(current); // a render inside a render (none today) gets its own state
  if(!enabled||!renderer?.isWebGLRenderer){current=null;return;}
  if(holder.parent!==scene||scene.children[scene.children.length-1]!==holder)scene.add(holder); // keep it last in the walk
  st.frame++;st.frustum=null;
  st.anchor.set(Math.round(camera.position.x),Math.round(camera.position.y),Math.round(camera.position.z));
  holder.matrix.makeTranslation(st.anchor.x,st.anchor.y,st.anchor.z);holder.matrixWorld.copy(holder.matrix);
  for(const b of st.buckets.values()){
   if(b.count)b.idle=0;else if(++b.idle>900){b.mesh.removeFromParent();b.mesh.dispose();st.buckets.delete(b.key);b.state=null;continue;}
   b.count=0;b.mesh.matrixWorld.copy(holder.matrixWorld);
  }
  current=st;
 };
 scene.onAfterRender=function(...args){current=stack.length?stack.pop():null;after.apply(this,args);};
 st.api={holder,stats:()=>{let batches=0,instances=0;for(const b of st.buckets.values())if(b.mesh.count){batches++;instances+=b.mesh.count;}return {batches,instances,buckets:st.buckets.size};}};
 states.set(scene,st);return st.api;
}
