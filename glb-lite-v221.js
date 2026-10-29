// V221: a small GLB loader for the game's own model files (no GLTFLoader in vendor/).
// Supports one or more mesh primitives with POSITION / NORMAL / TEXCOORD_0 / JOINTS_0 /
// WEIGHTS_0, indices, a base-colour texture (JPEG / PNG / WebP, also via EXT_texture_webp)
// and one skin. Returns plain data; callers build three.js meshes (see stone-age-models-v221.js).
import * as T from './vendor/three.module.js';

const COMP={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
const SIZE={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};

export async function loadGLB(url){
 const buf=await (await fetch(url)).arrayBuffer();
 const dv=new DataView(buf);if(dv.getUint32(0,true)!==0x46546c67)throw new Error('not a GLB: '+url);
 const jsonLen=dv.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,20,jsonLen)));
 const binStart=20+jsonLen+8,bin=buf.slice(binStart,binStart+dv.getUint32(20+jsonLen,true));
 const view=i=>{const v=json.bufferViews[i];return {offset:v.byteOffset||0,length:v.byteLength,stride:v.byteStride||0};};
 const accessor=i=>{
  const a=json.accessors[i],v=view(a.bufferView),C=COMP[a.componentType],n=SIZE[a.type],off=v.offset+(a.byteOffset||0);
  if(v.stride&&v.stride!==C.BYTES_PER_ELEMENT*n){const out=new C(a.count*n),src=new DataView(bin);
   for(let k=0;k<a.count;k++)for(let c=0;c<n;c++){const p=off+k*v.stride+c*C.BYTES_PER_ELEMENT;out[k*n+c]=C===Float32Array?src.getFloat32(p,true):C===Uint16Array?src.getUint16(p,true):C===Uint8Array?src.getUint8(p):src.getUint32(p,true);}
   return {array:out,size:n,normalized:!!a.normalized};}
  return {array:new C(bin.slice(off,off+a.count*n*C.BYTES_PER_ELEMENT)),size:n,normalized:!!a.normalized};
 };
 const images=await Promise.all((json.images||[]).map(async im=>{
  const v=view(im.bufferView),blob=new Blob([new Uint8Array(bin,v.offset,v.length)],{type:im.mimeType||'image/jpeg'});
  return await createImageBitmap(blob,{imageOrientation:'none'});
 }));
 const texSource=t=>{const tex=json.textures?.[t];return tex?(tex.source??Object.values(tex.extensions||{})[0]?.source):undefined;};
 const primitives=[];
 for(const mesh of json.meshes||[])for(const p of mesh.primitives){
  const g=new T.BufferGeometry(),A=p.attributes;
  const add=(name,key)=>{if(A[key]==null)return;const a=accessor(A[key]);g.setAttribute(name,new T.BufferAttribute(a.array,a.size,a.normalized));};
  add('position','POSITION');add('normal','NORMAL');add('uv','TEXCOORD_0');add('skinIndex','JOINTS_0');add('skinWeight','WEIGHTS_0');add('color','COLOR_0');
  if(p.indices!=null)g.setIndex(new T.BufferAttribute(accessor(p.indices).array,1));
  if(!A.NORMAL)g.computeVertexNormals();
  const m=json.materials?.[p.material??0]||{},pbr=m.pbrMetallicRoughness||{};
  const src=pbr.baseColorTexture?texSource(pbr.baseColorTexture.index):undefined;
  primitives.push({geometry:g,image:src!=null?images[src]:null,color:pbr.baseColorFactor||[1,1,1,1],extras:m.extras||{}});
 }
 let skin=null;
 if(json.skins?.length){
  const s=json.skins[0],ibm=s.inverseBindMatrices!=null?accessor(s.inverseBindMatrices).array:null;
  skin={joints:s.joints.map((n,i)=>({node:n,name:json.nodes[n].name,translation:json.nodes[n].translation||[0,0,0],rotation:json.nodes[n].rotation||[0,0,0,1],
   children:json.nodes[n].children||[],inverseBind:ibm?Array.from(ibm.slice(i*16,i*16+16)):null}))};
 }
 return {json,primitives,skin,extras:json.asset?.extras||{}};
}
