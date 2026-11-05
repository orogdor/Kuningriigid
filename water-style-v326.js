// Palette and material response shared by the existing river and the sea.
import * as T from './vendor/three.module.js';
import {CLOUD_TIME,WATER_SKY_V251,SEA_EFFECT_V226} from './atmosphere-v158.js?v=161a';
export const WATER_STYLE_V326=Object.freeze({deep:'#1f4b55',shallow:'#5e8466',roughness:.14,metalness:.02});
// WebGPU ignores onBeforeCompile; build the same flow phases, palette,
// bank foam and sky reflection as the WebGL waterMaterial in TSL.
export function waterNodeMaterialV326({sea=false,scale=1,scaleZ=scale,origin={x:0,z:0}}={}){
 const {Fn,vec2,vec3,float,floor,fract,sin,dot,mix,clamp,smoothstep,normalize,pow,abs,length,
  positionLocal,positionViewDirection,normalView,attribute,uniform}=T;
 const fx=sea?uniform(SEA_EFFECT_V226.value).onRenderUpdate(()=>SEA_EFFECT_V226.value):float(1);
 const clock=uniform(CLOUD_TIME.value).onRenderUpdate(()=>CLOUD_TIME.value);
 const sky=uniform(WATER_SKY_V251.value).onRenderUpdate(()=>WATER_SKY_V251.value);
 const sh=p=>{const a=fract(p.mul(vec2(123.34,456.21))),b=a.add(dot(a,a.add(45.32)));return fract(b.x.mul(b.y));};
 const noise=Fn(([p])=>{const i=floor(p),f0=fract(p),f=f0.mul(f0).mul(float(3).sub(f0.mul(2)));
  return mix(mix(sh(i),sh(i.add(vec2(1,0))),f.x),mix(sh(i.add(vec2(0,1))),sh(i.add(vec2(1,1))),f.x),f.y);});
 const wp=positionLocal.xz.div(vec2(scale,scaleZ)).add(vec2(origin.x,origin.z));
 const depth=sea?attribute('aDepth','float'):float(4);
 const shore=sea?float(1).sub(smoothstep(0,3.6,depth)):attribute('aShore','float');
 const flow=sea?vec2(.65,.12):attribute('aFlow','vec2'),speed=length(flow).add(.001),fd=flow.div(speed);
 const t=clock.mul(speed.mul(.55).add(.35)),phase1=fract(t.mul(.22)),phase2=fract(t.mul(.22).add(.5)),blend=abs(phase1.mul(2).sub(1));
 const o1=fd.mul(phase1).mul(3.2),o2=fd.mul(phase2).mul(3.2);
 const a1=wp.sub(o1).mul(.45),a2=wp.sub(o2).mul(.45).add(5.3);
 const b1=wp.sub(o1.mul(1.6)).mul(1.15).add(7.1),b2=wp.sub(o2.mul(1.6)).mul(1.15).add(2.9);
 const r1=mix(noise(a1),noise(a2),blend),r2=mix(noise(b1),noise(b2),blend),ripple=r1.mul(.6).add(r2.mul(.4));
 const deep=uniform(new T.Color(WATER_STYLE_V326.deep)),shallow=uniform(new T.Color(WATER_STYLE_V326.shallow));
 const vertex=sea?null:attribute('color','vec4');
 const base=sea?mix(deep,shallow,pow(shore,2.2).mul(.85)).mul(sin(wp.x.mul(.11).add(wp.y.mul(.07))).mul(.03).add(.97)):vertex.rgb;
 let water=base.mul(ripple.sub(.5).mul(.10).mul(fx).add(.98));
 water=water.add(vec3(.045,.055,.06).mul(smoothstep(.80,.96,r2)).mul(float(1).sub(shore.mul(.7))).mul(fx));
 const foam=smoothstep(.90,1,shore).mul(smoothstep(.60,.88,r1));
 water=mix(water,vec3(.70,.74,.70),foam.mul(.22).mul(fx));
 const e=.35,rx=mix(noise(a1.add(vec2(e,0))),noise(a2.add(vec2(e,0))),blend).mul(.6)
  .add(mix(noise(b1.add(vec2(e*2.5,0))),noise(b2.add(vec2(e*2.5,0))),blend).mul(.4));
 const rz=mix(noise(a1.add(vec2(0,e))),noise(a2.add(vec2(0,e))),blend).mul(.6)
  .add(mix(noise(b1.add(vec2(0,e*2.5))),noise(b2.add(vec2(0,e*2.5))),blend).mul(.4));
 const normal=normalize(normalView.add(vec3(rx.sub(ripple).div(e).mul(-.32).mul(fx),0,rz.sub(ripple).div(e).mul(-.32).mul(fx))));
 const fres=pow(float(1).sub(clamp(dot(positionViewDirection,normal),0,1)),5).mul(.97).add(.03);
 const m=new T.MeshStandardNodeMaterial({roughness:WATER_STYLE_V326.roughness,metalness:WATER_STYLE_V326.metalness,
  side:T.DoubleSide,transparent:true,depthWrite:false});
 m.colorNode=mix(water,sky.mul(ripple.mul(.22).add(.78)),clamp(fres.mul(.75),0,.75));
 const alpha=sea?float(.94).sub(pow(shore,2.5).mul(.36)):vertex.a;
 m.opacityNode=clamp(alpha.add(fres.mul(.35)),0,1).mul(sea?smoothstep(-.12,.20,depth):1);
 m.normalNode=normal;if(sea)m.alphaTest=.0025;
 m.userData.animated=true;return m;
}
