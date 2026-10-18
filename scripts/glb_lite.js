// Minimal glTF 2.0 GLB reader for static, vertex-colored meshes generated here.
// Uses THREE from the local Kuningriigid bundle; no internet services required.
import * as THREE from '../vendor/three.module.js';
export async function loadWorldGLB(url){
 const res=await fetch(url);if(!res.ok)throw new Error('Mudeli laadimine: '+res.status+' '+url);
 const raw=await res.arrayBuffer(),dv=new DataView(raw);
 if(dv.getUint32(0,true)!==0x46546c67)throw new Error('Vigane GLB');
 let offset=12,model=null,bin=null;
 while(offset<raw.byteLength){const bytes=dv.getUint32(offset,true),type=dv.getUint32(offset+4,true);offset+=8;
  if(type===0x4E4F534A)model=JSON.parse(new TextDecoder().decode(raw.slice(offset,offset+bytes)));
  if(type===0x004e4942)bin=raw.slice(offset,offset+bytes);
  offset+=bytes;
 }
 if(!model||!bin)throw new Error('GLB JSON/BIN puudub');
 const typed={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
 const scalar={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
 const ntypes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
 function accessor(id){const a=model.accessors[id],bv=model.bufferViews[a.bufferView],Ctor=typed[a.componentType],n=ntypes[a.type],stride=bv.byteStride??scalar[a.componentType]*n,begin=(bv.byteOffset??0)+(a.byteOffset??0),out=new Ctor(a.count*n),bufferView=new DataView(bin);
 for(let i=0;i<a.count;i++)for(let k=0;k<n;k++){const at=begin+i*stride+k*scalar[a.componentType];let v;switch(a.componentType){case 5120:v=bufferView.getInt8(at);break;case 5121:v=bufferView.getUint8(at);break;case 5122:v=bufferView.getInt16(at,true);break;case 5123:v=bufferView.getUint16(at,true);break;case 5125:v=bufferView.getUint32(at,true);break;default:v=bufferView.getFloat32(at,true)}out[i*n+k]=v}
 return {data:out,components:n,normalized:!!a.normalized,componentType:a.componentType};}
 const base=new THREE.Group();
 for(const meshDef of model.meshes||[]){for(const primitive of meshDef.primitives||[]){
  const g=new THREE.BufferGeometry(),positions=accessor(primitive.attributes.POSITION);
  g.setAttribute('position',new THREE.BufferAttribute(positions.data,3));
  if(primitive.attributes.COLOR_0!==undefined){const color=accessor(primitive.attributes.COLOR_0);const a=new Float32Array(color.data.length),factor=color.normalized?(color.componentType===5121?255:65535):1;
   for(let k=0;k<a.length;k++)a[k]=color.data[k]/factor;
   g.setAttribute('color',new THREE.BufferAttribute(a,color.components));
  }
  if(primitive.indices!==undefined)g.setIndex(new THREE.BufferAttribute(accessor(primitive.indices).data,1));
  g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:!!g.attributes.color,roughness:1,metalness:0,side:THREE.DoubleSide}));
  m.name=meshDef.name||'geomeetria';m.castShadow=true;m.receiveShadow=true;base.add(m);
 }}
 base.name=url.split('/').pop();return base;
}
