// V158: light and atmosphere.
// A warm sun whose shadow box follows the camera focus (so shadows exist everywhere you look,
// not only near the map centre), a soft sky/ground hemisphere, a gradient sky dome, a distant
// land skirt so the detail map fades into haze instead of ending in a void, and moving cloud
// shadows (a shared uniform the terrain shaders read). Presentation only.
import * as T from './vendor/three.module.js';

export const CLOUD_TIME={value:0};
function skyDome(top,horizon,ground){
 const geo=new T.SphereGeometry(9000,32,16);
 const mat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new T.Color(top)},horizon:{value:new T.Color(horizon)},ground:{value:new T.Color(ground)}},
  vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position.z=gl_Position.w;}',
  fragmentShader:'uniform vec3 top,horizon,ground;varying vec3 vP;void main(){float h=vP.y;vec3 c=h>0.0?mix(horizon,top,pow(clamp(h*1.6,0.0,1.0),.7)):mix(horizon,ground,clamp(-h*6.0,0.0,1.0));gl_FragColor=vec4(c,1.0);\n#include <colorspace_fragment>\n}'});
 const m=new T.Mesh(geo,mat);m.frustumCulled=false;m.renderOrder=-10;m.name='v158 sky';return m;
}
export function setupAtmosphere({renderer,worldScene,localScene,quality}){
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
 renderer.shadowMap.type=T.PCFSoftShadowMap;
 const rigs=new Map(),rigsSkirt={mesh:null};
 for(const [scene,local] of [[worldScene,false],[localScene,true]]){
  // remove the earlier flat light set (hemisphere + 2 directional lights)
  for(const o of [...scene.children])if(o.isHemisphereLight||o.isDirectionalLight)scene.remove(o);
  const hemi=new T.HemisphereLight(local?0xdfe9f2:0xe3ecf0,local?0x5b6a45:0x4d5a48,local?1.05:1.15);scene.add(hemi);
  const sun=new T.DirectionalLight(0xffe2b8,local?2.7:2.35);sun.castShadow=true;sun.shadow.mapSize.set(quality==='high'?2048:1024,quality==='high'?2048:1024);
  sun.shadow.bias=-.0005;sun.shadow.normalBias=local?.02:.6;sun.shadow.radius=3;scene.add(sun);scene.add(sun.target);
  const fill=new T.DirectionalLight(0xa9c6db,.32);fill.position.set(130,90,-120);scene.add(fill);
  const sky=local?skyDome('#7fa9c8','#d9e3dc','#a8b79a'):skyDome('#5b86a3','#c9d6d2','#2b4a55');scene.add(sky);
  scene.background=null;
  if(local){scene.fog=new T.Fog('#d3ddd5',420,1150);
   // distant land under and around the 3×3 detail area, fading into the haze
   const skirt=new T.Mesh(new T.RingGeometry(330,5200,64,2),new T.MeshStandardMaterial({color:'#7f9560',roughness:1}));skirt.rotation.x=-Math.PI/2;skirt.position.y=-1.4;skirt.receiveShadow=false;skirt.name='v158 land skirt';scene.add(skirt);rigsSkirt.mesh=skirt;
  }else scene.fog=new T.Fog('#b9cbc9',2100,7600);
  rigs.set(scene,{sun,hemi,fill,sky,local,extent:0});
 }
 let worldShadows=quality!=='low';
 function update(scene,focus,zoom,dt){
  CLOUD_TIME.value+=dt||0;
  const rig=rigs.get(scene);if(!rig)return;
  rig.sky.position.copy(focus);
  const dir=new T.Vector3(-0.55,1.0,0.62).normalize();
  const extent=rig.local?Math.max(60,Math.min(300,zoom*1.15)):Math.max(120,Math.min(520,zoom*.9));
  rig.sun.target.position.copy(focus);rig.sun.position.copy(focus).addScaledVector(dir,extent*2.6);
  // world map shadows only when zoomed in (cheap: only nearby chunks render into the shadow map)
  rig.sun.castShadow=rig.local?true:(worldShadows&&zoom<480);
  if(Math.abs(rig.extent-extent)>extent*.06){rig.extent=extent;const c=rig.sun.shadow.camera;c.left=-extent;c.right=extent;c.top=extent;c.bottom=-extent;c.near=1;c.far=extent*6;c.updateProjectionMatrix();}
 }
 function setQuality(q){worldShadows=q!=='low';for(const rig of rigs.values()){const s=q==='high'?2048:1024;if(rig.sun.shadow.mapSize.x!==s){rig.sun.shadow.mapSize.set(s,s);rig.sun.shadow.map?.dispose();rig.sun.shadow.map=null;}}}
 const birdsW=createBirds(15),birdsL=createBirds(12);worldScene.add(birdsW.mesh);localScene.add(birdsL.mesh);
 const updateCore=update;
 function updateAll(scene,focus,zoom,dt){updateCore(scene,focus,zoom,dt);const t=CLOUD_TIME.value;if(scene===worldScene)birdsW.update(focus,zoom,t,false);else birdsL.update(focus,zoom,t,true);}
 function setSkirt(water){if(rigsSkirt.mesh)rigsSkirt.mesh.material.color.set(water?'#4d8a8e':'#7f9560');}
 return {update:updateAll,setQuality,setSkirt};
}
// Wind: plants sway with height above their base. Works for plain and instanced meshes; each
// instance gets its own phase from its position. Shadows keep the rest pose (cheap and fine).
export function addWind(material,{strength=.05,from=.35,key='wind'}={}){
 const prev=material.onBeforeCompile;
 material.onBeforeCompile=(shader,r)=>{prev?.call(material,shader,r);shader.uniforms.uWindT=CLOUD_TIME;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uWindT;')
   .replace('#include <begin_vertex>',`#include <begin_vertex>
  {vec3 base=vec3(0.0);
  #ifdef USE_INSTANCING
   base=instanceMatrix[3].xyz;
  #endif
   base+=modelMatrix[3].xyz;
   float ph=base.x*.13+base.z*.17;float hgt=max(0.0,transformed.y-${from.toFixed(2)});float k=hgt*hgt*${strength.toFixed(3)};
   float gust=.6+.4*sin(uWindT*.35+base.x*.01);
   transformed.x+=sin(uWindT*1.7+ph)*k*gust;transformed.z+=cos(uWindT*1.3+ph*1.3)*k*.6*gust;}`);};
 const prevKey=material.customProgramCacheKey?.bind(material);
 material.customProgramCacheKey=()=>(prevKey?prevKey():'')+'-'+key;material.needsUpdate=true;
 return material;
}
// Birds: a few small flocks gliding and flapping over the camera focus.
export function createBirds(count=18){
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute([0,0,.25, -1,0,-.15, 0,0,-.05, 0,0,.25, 0,0,-.05, 1,0,-.15],3));g.computeVertexNormals();
 const mat=new T.MeshBasicMaterial({color:'#2b2a26',side:T.DoubleSide});
 const mesh=new T.InstancedMesh(g,mat,count);mesh.frustumCulled=false;mesh.name='v158 birds';
 const birds=[...Array(count)].map((_,i)=>({flock:i%3,a:i*2.39,r:.7+((i*37)%10)/14,h:((i*53)%10)/10,phase:i*1.7}));
 const m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),pos=new T.Vector3(),sc=new T.Vector3();
 function update(focus,zoom,time,local){
  const R=(local?Math.min(260,zoom*1.2):Math.min(900,zoom*1.0)),H=local?Math.max(18,zoom*.22):Math.max(40,zoom*.18),S=local?1.0:Math.max(2.5,zoom*.012);
  birds.forEach((b,i)=>{const fa=time*.05*(1+b.flock*.3)+b.flock*2.1,cx=focus.x+Math.cos(fa)*R*.45,cz=focus.z+Math.sin(fa*1.3)*R*.35;
   const ang=time*.35*(b.flock%2?1:-1)+b.a,rr=R*.08*b.r;pos.set(cx+Math.cos(ang)*rr,H*(1+b.h*.4),cz+Math.sin(ang)*rr);
   const flap=Math.sin(time*9+b.phase);e.set(0,-ang+(b.flock%2?0:Math.PI),flap*.25);q.setFromEuler(e);sc.set(S,S*(1+flap*.15),S);
   m.compose(pos,q,sc);mesh.setMatrixAt(i,m);});
  mesh.instanceMatrix.needsUpdate=true;
 }
 return {mesh,update};
}
