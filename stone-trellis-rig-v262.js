// V262: the player's TRELLIS.2 Stone Age warriors (axeman, spearman, slinger; ~5000 triangles each)
// skinned onto the game's own 17-bone V221 human skeleton, so they use the same walk / attack motion
// as every other Stone Age person. The GLBs have no skeleton: skin weights are computed here once per
// kind (nearest bone segment, limbs restricted to their own side, a long weapon shaft follows the hand).
// NVIDIA Kimodo (text-to-motion) needs a GPU Space that cannot be called from this pipeline; the motion
// stays the game's procedural V222/V261 animation.
import * as T from './vendor/three.module.js';
import {loadGLB} from './glb-lite-v221.js';
import {requestAssetV241} from './asset-queue-v241.js';

const FILES=Object.freeze({axeman:'kirvemees.glb',spearman:'odamees.glb',slinger:'lingmees.glb'});
// rotation (about Y) that turns each model to face +Z like the skeleton; the slinger was generated in profile
const TURN=Object.freeze({axeman:0,spearman:0,slinger:-Math.PI/2});
export const hasTrellisRigV262=kind=>Object.prototype.hasOwnProperty.call(FILES,kind)&&
 !(typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('trellis262')==='0');
const DATA=new Map();
export function loadTrellisRigV262(kind){
 if(!hasTrellisRigV262(kind))return Promise.resolve(false);
 return requestAssetV241('trellis-rig-v262:'+kind,async()=>{
  const data=await loadGLB(new URL('./models-trellis-v262/'+FILES[kind],import.meta.url));
  if(data.primitives.length!==1)throw Error('V262 expected one mesh: '+kind);
  const prim=data.primitives[0],g=prim.geometry;
  if(TURN[kind])g.rotateY(TURN[kind]);
  g.computeBoundingBox();const b=g.boundingBox,c=b.getCenter(new T.Vector3()),h=b.max.y-b.min.y;
  // unit height, feet on the ground, centred: the V221 skeleton is authored in the same frame
  g.translate(-c.x,-b.min.y,-c.z);g.scale(1/h,1/h,1/h);
  // centre on the torso, not the bounding box (a weapon on one side would shift the body off the bones)
  const P=g.getAttribute('position'),xs=[],zs=[];
  for(let i=0;i<P.count;i++){const y=P.getY(i);if(y>.62&&y<.82){xs.push(P.getX(i));zs.push(P.getZ(i));}}
  const med=a=>{a.sort((u,v)=>u-v);return a.length?a[a.length>>1]:0;};g.translate(-med(xs),0,-med(zs));
  if(!g.getAttribute('normal'))g.computeVertexNormals();
  const tex=prim.image?new T.Texture(prim.image):null;
  if(tex){tex.flipY=false;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;tex.needsUpdate=true;}
  const material=new T.MeshStandardMaterial({map:tex,roughness:.9,metalness:0});
  DATA.set(kind,{geometry:g,material,skinned:false});return true;
 });
}
export const trellisRigReadyV262=kind=>DATA.has(kind);

const SIDE=/_(L|R)$/;
// bone segments in the skeleton's rest frame (no rotations in the V221 bind pose)
function segments(bones){
 const root=bones.hips.parent,world=new Map();
 const pos=b=>{if(world.has(b))return world.get(b);const p=b.position.clone();let q=b.parent;while(q&&q!==root){p.add(q.position);q=q.parent;}world.set(b,p);return p;};
 const list=Object.values(bones).filter(b=>b.isBone);
 return list.map((b,i)=>{
  const a=pos(b),kids=b.children.filter(c=>c.isBone);let e;
  if(b.name==='hips')e=pos(bones.spine);
  else if(kids.length===1)e=pos(kids[0]);
  else if(kids.length>1)e=kids.reduce((s,k)=>s.add(pos(k)),new T.Vector3()).multiplyScalar(1/kids.length);
  else if(b.name==='head')e=a.clone().add(new T.Vector3(0,.13,0));
  else if(b.name.startsWith('foot'))e=a.clone().add(new T.Vector3(0,-.04,.09));
  else{const d=a.clone().sub(pos(b.parent)).normalize();e=a.clone().addScaledVector(d,.08);}
  return {index:list.indexOf(b),bone:b,name:b.name,a,e,side:(b.name.match(SIDE)||[])[1]||null};
 });
}
function distToSeg(p,a,e){const ab=e.clone().sub(a),t=Math.max(0,Math.min(1,p.clone().sub(a).dot(ab)/Math.max(ab.lengthSq(),1e-9)));return p.distanceTo(a.clone().addScaledVector(ab,t));}

function skin(kind,skeleton,bones){
 const d=DATA.get(kind);if(d.skinned)return d.geometry;
 const g=d.geometry,P=g.getAttribute('position'),n=P.count,segs=segments(bones);
 const idx=new Uint16Array(n*4),wts=new Float32Array(n*4),p=new T.Vector3(),locked=new Uint8Array(n);
 const order=skeleton.bones;const boneIndex=s=>order.indexOf(s.bone);
 const handR=segs.find(s=>s.name==='hand_R');
 // a spear shaft: points above the head or below the knee that line up with the hand vertically
 let shaft=null;
 if(kind==='spearman'){
  // fit the shaft as a straight line through its top (above the head) and its butt (at the feet)
  const top=[0,0,0,0],bot=[0,0,0,0];
  for(let i=0;i<n;i++){p.fromBufferAttribute(P,i);if(p.x<-.24&&p.y>.75){top[0]+=p.x;top[1]+=p.y;top[2]+=p.z;top[3]++;}
   if(p.x<-.24&&p.y<.3){bot[0]+=p.x;bot[1]+=p.y;bot[2]+=p.z;bot[3]++;}} // V283: only the shaft lies this far out (feet end at x -.19)
  // V283: the axis runs through the shaft's real top and butt (the spear leans a little); before, an upright
  // axis missed the lower shaft, which then followed the legs and the spear bent like a bow
  if(top[3]){const t=top.map(v=>v/top[3]);shaft={t,b:bot[3]?bot.map(v=>v/bot[3]):[t[0],0,t[2]]};}
 }
 for(let i=0;i<n;i++){
  p.fromBufferAttribute(P,i);
  if(shaft){const k=(p.y-shaft.b[1])/(shaft.t[1]-shaft.b[1]),ax=shaft.b[0]+(shaft.t[0]-shaft.b[0])*k,az=shaft.b[2]+(shaft.t[2]-shaft.b[2])*k;
   // V283: the whole shaft is rigid in the hand (also the grip section), within 6 cm of the axis
   if(p.y>.1&&Math.hypot(p.x-ax,p.z-az)<.045&&(p.y>handR.a.y+.05||p.y<handR.a.y-.09||Math.hypot(p.x-ax,p.z-az)<.025)){idx[i*4]=boneIndex(handR);wts[i*4]=1;locked[i]=1;continue;}}
  if(false){idx[i*4]=boneIndex(handR);wts[i*4]=1;continue;}
  const side=p.x>.03?'L':p.x<-.03?'R':null;
  const best=[];
  for(const s of segs){
   if(s.side&&side&&s.side!==side)continue;
   // arms hang beside the skirt: below the wrist only the hand (weapon) may take arm weights
   if(/Arm|forearm/.test(s.name)&&p.y<handR.a.y+.02)continue;
   // the arms hang against the torso: only points outside the body outline follow an arm
   if(/Arm|forearm|hand/.test(s.name)&&Math.abs(p.x)<(p.y>.76?.12:.165))continue;
   if(s.name.startsWith('hand')&&p.y<handR.a.y-.02&&(Math.abs(p.x)<.2||p.y<.25))continue;
   let dd=distToSeg(p,s.a,s.e);
   if(s.name==='hips'&&p.y<s.a.y-.04)dd+=.05; // below the belt the thighs take over
   best.push([dd,s]);
  }
  best.sort((x,y)=>x[0]-y[0]);
  const top=best.slice(0,2),w=top.map(([dd])=>1/Math.pow(dd+.012,4)),sum=w.reduce((a,b)=>a+b,0);
  top.forEach(([,s],k)=>{idx[i*4+k]=boneIndex(s);wts[i*4+k]=w[k]/sum;});
 }
 smooth(g,idx,wts,order.length,locked);
 // V283: where the spear butt touches the boot the generated mesh joins them; those few faces stretched into a
 // long sheet when the spear swung. Drop faces that join the rigid shaft to the body below the hand.
 if(shaft&&g.index){const I=g.index.array,keep=[];for(let t=0;t<I.length;t+=3){const a=I[t],b=I[t+1],c=I[t+2],l=locked[a]+locked[b]+locked[c];
   if(l>0&&l<3&&Math.min(P.getY(a),P.getY(b),P.getY(c))<handR.a.y-.12)continue;keep.push(a,b,c);}
  g.setIndex(keep);}
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(idx,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(wts,4));
 g.computeBoundingBox();g.computeBoundingSphere();g.userData.shared=true;d.skinned=true;return g;
}

// Average weights over mesh neighbours (UV seams welded by position) so bone borders bend smoothly
// instead of tearing into flat sheets. Keeps the 4 strongest bones per vertex.
function smooth(g,idx,wts,nb,locked,passes=4){
 const P=g.getAttribute('position'),n=P.count,I=g.getIndex(),key=new Map(),weld=new Int32Array(n);
 for(let i=0;i<n;i++){const k=Math.round(P.getX(i)*2e4)+','+Math.round(P.getY(i)*2e4)+','+Math.round(P.getZ(i)*2e4);if(!key.has(k))key.set(k,key.size);weld[i]=key.get(k);}
 const m=key.size,adj=Array.from({length:m},()=>new Set());
 const tri=I?I.array:Array.from({length:n},(_,i)=>i);
 for(let t=0;t<tri.length;t+=3)for(let a=0;a<3;a++)for(let b=0;b<3;b++)if(a!==b)adj[weld[tri[t+a]]].add(weld[tri[t+b]]);
 let W=new Float32Array(m*nb);const fixed=new Uint8Array(m);
 for(let i=0;i<n;i++){const w=weld[i];if(locked[i])fixed[w]=1;for(let k=0;k<4;k++)if(wts[i*4+k]>0)W[w*nb+idx[i*4+k]]=wts[i*4+k];}
 for(let pass=0;pass<passes;pass++){
  const N=new Float32Array(W);
  for(let v=0;v<m;v++){if(fixed[v]||!adj[v].size)continue;const o=v*nb;for(let b=0;b<nb;b++)N[o+b]=W[o+b]*.5;const f=.5/adj[v].size;for(const u of adj[v])for(let b=0;b<nb;b++)N[o+b]+=W[u*nb+b]*f;}
  W=N;
 }
 for(let i=0;i<n;i++){const o=weld[i]*nb,top=[];for(let b=0;b<nb;b++)if(W[o+b]>.001)top.push([W[o+b],b]);top.sort((x,y)=>y[0]-x[0]);
  const t=top.slice(0,4),sum=t.reduce((a,[w])=>a+w,0)||1;for(let k=0;k<4;k++){idx[i*4+k]=t[k]?t[k][1]:0;wts[i*4+k]=t[k]?t[k][0]/sum:0;}}
}

// Replace the V221 body mesh of a freshly made rigged human with the TRELLIS warrior, sharing its skeleton.
export function applyTrellisRigV262(model,kind){
 const d=DATA.get(kind);if(!d)return false;
 const rig=model.userData.rig,B=rig.bones,body=rig.scale;
 const low=[];body.traverse(o=>{if(o.isSkinnedMesh&&o.skeleton)low.push(o);});
 const src=low[0];if(!src)return false;
 const geo=skin(kind,src.skeleton,B);
 const mesh=new T.SkinnedMesh(geo,d.material);mesh.name='V262 TRELLIS '+kind;mesh.castShadow=true;mesh.receiveShadow=false;
 mesh.bind(src.skeleton,src.bindMatrix);mesh.frustumCulled=false;
 // remove the V221 body (and its lazy LOD wrapper) but keep the bones
 for(const child of [...body.children])if(!child.isBone)body.remove(child);
 body.add(mesh);rig.trellisV262=true;return true;
}
