import * as T from './vendor/three.module.js';
// Continuous world-space grain: no repeated square tiles and no image downloads.
export function landscapeMaterial(kind='terrain',scope='world',tile=null){
 const water=kind==='water';
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:water?.3:1,metalness:water?.12:0,side:water?T.DoubleSide:T.FrontSide});
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 landscapeP;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nlandscapeP = position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
 varying vec3 landscapeP;
 float landscapeHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float landscapeNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(landscapeHash(i),landscapeHash(i+vec3(1,0,0)),f.x),mix(landscapeHash(i+vec3(0,1,0)),landscapeHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(landscapeHash(i+vec3(0,0,1)),landscapeHash(i+vec3(1,0,1)),f.x),mix(landscapeHash(i+vec3(0,1,1)),landscapeHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 `);
  const world=scope==='world'?'landscapeP':`vec3(landscapeP.x / 3.0 + ${Number(tile.x).toFixed(4)}, landscapeP.y / 0.30 + 0.7, landscapeP.z / 2.6 + ${Number(tile.z).toFixed(4)})`;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec3 landP=${world};
 float broad=landscapeNoise(landP*0.16),grain=landscapeNoise(landP*2.8);
 ${water?`float ripple=sin(landP.x*2.3+sin(landP.z*1.7))*sin(landP.z*3.2+landP.x*.3);diffuseColor.rgb*=0.94+grain*.08+ripple*.035;`:`
 float rock=1.0-smoothstep(0.005,0.075,diffuseColor.g-diffuseColor.r);
 float strata=sin(landP.y*2.6+broad*4.0+sin(landP.x*.14+landP.z*.08));
 float fissure=pow(1.0-abs(sin(landP.x*.29+landP.z*.21+broad*3.0)),16.0);
 diffuseColor.rgb*=mix(.87+grain*.20+broad*.12,.78+grain*.22+broad*.22+strata*.09-fissure*.15,rock);
 `}`);
 };
 material.customProgramCacheKey=()=>`landscape-v85-${kind}-${scope}-${tile?.x||0}-${tile?.z||0}`;
 return material;
}
