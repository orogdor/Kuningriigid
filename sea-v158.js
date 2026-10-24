// V158: one sea look for both maps. Colour follows the water depth (attribute aDepth in world
// metres), the surface ripples and catches the sun, and surf foam rolls in along the shoreline.
import * as T from './vendor/three.module.js';
import {CLOUD_TIME} from './atmosphere-v158.js?v=158a';

export function seaMaterial({scale=1}={}){
 // scale: model units per world metre on the horizontal plane (1 on the world map, ~4.5 on detail maps)
 const m=new T.MeshStandardMaterial({color:'#ffffff',roughness:.22,metalness:.12,transparent:true,depthWrite:false});
 m.onBeforeCompile=shader=>{
  shader.uniforms.uSeaT=CLOUD_TIME;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float aDepth;varying float vSeaD;varying vec2 vSeaP;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvSeaD=aDepth;vSeaP=(modelMatrix*vec4(position,1.0)).xz/'+scale.toFixed(3)+';');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
uniform float uSeaT;varying float vSeaD;varying vec2 vSeaP;float seaRipple=0.0;
float sh(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float sn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(sh(i),sh(i+vec2(1,0)),f.x),mix(sh(i+vec2(0,1)),sh(i+vec2(1,1)),f.x),f.y);}`)
   .replace('#include <color_fragment>',`#include <color_fragment>
 float d=max(vSeaD,0.0);
 vec3 shallow=vec3(.42,.70,.66),mid=vec3(.16,.45,.52),deep=vec3(.05,.20,.32);
 vec3 sea=mix(shallow,mid,smoothstep(.3,4.0,d));sea=mix(sea,deep,smoothstep(4.0,22.0,d));
 vec2 p=vSeaP;float t=uSeaT;
 float r1=sn(p*.18+vec2(t*.22,t*.10)),r2=sn(p*.47-vec2(t*.15,-t*.27)+3.0);seaRipple=r1*.6+r2*.4;
 sea*=.94+seaRipple*.12;
 // surf: bands rolling towards the shore, broken up by noise
 float band=.5+.5*sin(d*7.0-t*1.6+sn(p*.35)*4.0);
 float surf=(1.0-smoothstep(0.0,1.1,d))*smoothstep(.55,.95,band)+(1.0-smoothstep(0.0,.18,d))*.8;
 sea=mix(sea,vec3(.93,.96,.94),clamp(surf,0.0,1.0)*.75);
 diffuseColor.rgb=sea;
 diffuseColor.a=mix(.55,.93,smoothstep(0.0,1.6,d))*(1.0-smoothstep(-.05,0.0,-vSeaD)*0.0);`)
   .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 normal=normalize(normal+vec3(seaRipple-.5,0.0,.5-sn(vSeaP*.31+uSeaT*.2))*.22);`);
 };
 m.customProgramCacheKey=()=>'sea-v158-'+scale.toFixed(2);
 return m;
}
// Detail map sea: a plane at sea level over the 3×3 area; depth from the local ground height.
export function createDetailSea(localGround,{halfX=380,halfZ=330,seg=110}={}){
 const geo=new T.PlaneGeometry(halfX*2,halfZ*2,seg,Math.round(seg*halfZ/halfX));geo.rotateX(-Math.PI/2);
 const p=geo.attributes.position,depth=new Float32Array(p.count);let wet=0;
 for(let i=0;i<p.count;i++){const y=localGround(p.getX(i),p.getZ(i)),worldY=y/.30+.7;depth[i]=.72-worldY;if(depth[i]>-.5)wet++;}
 if(wet<8)return null;
 geo.setAttribute('aDepth',new T.BufferAttribute(depth,1));
 const mesh=new T.Mesh(geo,seaMaterial({scale:4.5}));mesh.position.y=.006;mesh.renderOrder=5;mesh.name='v158 detail sea';mesh.receiveShadow=true;return mesh;
}
