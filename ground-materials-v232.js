// ambientCG CC0 assets; source IDs and licence are recorded beside the textures.
import * as T from './vendor/three.module.js';
const uniforms={uGroundReady232:{value:0}};
const normal=new T.DataTexture(new Uint8Array([128,128,255,255]),1,1);normal.needsUpdate=true;
const white=new T.DataTexture(new Uint8Array([255,255,255,255]),1,1);white.needsUpdate=true;
const names=['grass','soil','forest'],types=['color','normal','rough'];let loading;
for(const name of names)for(const type of types)uniforms['uGround232_'+name+'_'+type]={value:type==='normal'?normal:white};
export function groundUniforms232(tile){
 if(!loading&&typeof window!=='undefined'){
  const loader=new T.TextureLoader();loading=Promise.all(names.flatMap(name=>types.map(async type=>{
   const texture=await loader.loadAsync('./textures-ground-v232/'+name+'-'+type+'.webp');
   texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;
   if(type==='color')texture.colorSpace=T.SRGBColorSpace;
   uniforms['uGround232_'+name+'_'+type].value=texture;
  }))).then(()=>{uniforms.uGroundReady232.value=1;}).catch(e=>console.warn('Ground textures unavailable; retaining procedural terrain',e));
 }
 return {...uniforms,uGroundForest232:{value:tile?.biome==='forest'?1:0}};
}
export const GROUND_GLSL232=`
uniform float uGroundReady232;uniform float uGroundForest232;
${names.flatMap(name=>types.map(type=>'uniform sampler2D uGround232_'+name+'_'+type+';')).join('\n')}
vec4 groundSample232(sampler2D image,vec2 uv){
 float blend=smoothstep(.2,.8,l149n(uv*.11+vec2(71.0,13.0)));
 return mix(texture2D(image,uv),texture2D(image,uv*.73+vec2(.37,.61)),blend);
}
vec3 groundWeights232(vec2 q){
 float dirt=smoothstep(.57,.82,l149f(q*.09+vec2(13.0,29.0)));
 float forest=uGroundForest232*(.68+.25*l149n(q*.13));
 return vec3((1.0-dirt)*(1.0-forest),dirt*(1.0-forest),forest);
}
// V356: height blend. The brightness of each photograph is its height (stones, clods and grass tips
// are lighter than the hollows between them), so where two grounds meet the higher one wins pixel by
// pixel: soil shows between grass tufts and grass grows over soil, not a blurry cross-fade.
// The weights are sharpened in place (inout) so normal and roughness use the same mix.
float groundLum232(vec3 c){return dot(c,vec3(.30,.59,.11));}
vec3 groundColor232(vec2 uv,inout vec3 w){
 vec3 g=groundSample232(uGround232_grass_color,uv).rgb,s=groundSample232(uGround232_soil_color,uv).rgb,f=groundSample232(uGround232_forest_color,uv).rgb;
 vec3 h=vec3(groundLum232(g)*1.7,groundLum232(s)*1.25,groundLum232(f)*1.35)*.55+w;
 float top=max(h.x,max(h.y,h.z))-.22;
 vec3 b=max(h-vec3(top),vec3(0.0))*step(vec3(.001),w);
 w=b/max(b.x+b.y+b.z,1e-4);
 return g*w.x+s*w.y+f*w.z;
}
vec3 groundNormal232(vec2 uv,vec3 w){return normalize((groundSample232(uGround232_grass_normal,uv).xyz*w.x+groundSample232(uGround232_soil_normal,uv).xyz*w.y+groundSample232(uGround232_forest_normal,uv).xyz*w.z)*2.0-1.0);}
float groundRough232(vec2 uv,vec3 w){return groundSample232(uGround232_grass_rough,uv).r*w.x+groundSample232(uGround232_soil_rough,uv).r*w.y+groundSample232(uGround232_forest_rough,uv).r*w.z;}
`;
