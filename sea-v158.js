// V326: sea and rivers share palette, flowing ripples, glints and sky reflection.
import {sliceDueV342} from './frame-slice-v342.js';
import * as T from './vendor/three.module.js';
import {waterMaterial} from './landscape-v149.js';
export function seaMaterial({scale=1,scaleZ=scale,origin={x:0,z:0}}={}){
 return waterMaterial(scale===1?'world':'detail',origin,{sea:true,scale,scaleZ});
}
// Detail map sea: a plane at sea level over the 3×3 area; depth from the local ground height.
export function createDetailSea(...args){const steps=detailSeaStepsV242(...args);let result;do{result=steps.next();}while(!result.done);return result.value;}
export function* detailSeaStepsV242(localGround,{halfX=380,halfZ=330,seg=166,origin={x:0,z:0}}={}){
 const geo=new T.PlaneGeometry(halfX*2,halfZ*2,seg,Math.round(seg*halfZ/halfX));geo.rotateX(-Math.PI/2);
 const p=geo.attributes.position,depth=new Float32Array(p.count);let wet=0;
 for(let i=0;i<p.count;i++){if(i&&(i%192===0||((i&15)===0&&sliceDueV342())))yield;const y=localGround(p.getX(i),p.getZ(i)),worldY=y/.30+.7;depth[i]=.72-worldY;if(depth[i]>-.5)wet++;}
 if(wet<8)return null;
 geo.setAttribute('aDepth',new T.BufferAttribute(depth,1));
 const mesh=new T.Mesh(geo,seaMaterial({scale:4.5,scaleZ:3.9,origin}));mesh.position.y=.006;mesh.renderOrder=5;mesh.name='v158 detail sea';mesh.receiveShadow=true;return mesh;
}
