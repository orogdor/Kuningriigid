// V284: Stone Age workers work ON their building model instead of in front of its door.
//  - quarry (kivimurd): the stonecutter climbs onto the middle terrace of the rock heap and cuts at the upper
//    terrace wall with his pick; chips fly from the wall at every blow.
//  - mason (kiviraiduri koda): the mason stands between the back wall and the stone workbench under the roof, facing
//    the open front, and dresses the stone on the bench with his hammer stone; chips fly from the bench.
// The spot is found on the drawn model itself (its own local frame -> world, then a ray down onto the mesh), so it
// follows every size, rotation and level-of-detail swap. Drawing only: economy and worker timing are unchanged.
import * as T from './vendor/three.module.js';

// spot / target in the model's normalised footprint (-.5..+.5; +z is the front/door side), job motion, chip timing
export const WORK_SPOTS_V284={
 quarry:{spot:[-.05,-.27],look:[-.05,-.5],onTop:true,action:'mine',period:1.85,hit:.6,chipAt:[0,.2,1.05]},
 mason:{spot:[.04,.05],look:[.04,.24],onTop:false,action:'build',period:1.12,hit:.6,chipAt:[0,.95,.55]}
};
const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0),v=new T.Vector3(),w2=new T.Vector3();
// the detailed (near) mesh if it is in place, otherwise the middle/far level: all share the same footprint frame
function nearMesh(root){let near=null,any=null;root?.traverse(o=>{if(!o.isMesh||!o.userData?.stoneDetailedAsset)return;any??=o;if(!near&&!o.userData.stoneFarDerivedFromDetail&&!o.userData.stoneBakedLevelV244)near=o;});return near||any;}
// world point of a normalised footprint position on the mesh (y = top surface if onTop, else the mesh base)
function footprintPoint(mesh,[nx,nz],onTop,out){
 const g=mesh.geometry;if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox;
 const lx=b.min.x+(nx+.5)*(b.max.x-b.min.x),lz=b.min.z+(nz+.5)*(b.max.z-b.min.z);
 mesh.updateMatrixWorld(true);
 if(!onTop)return mesh.localToWorld(out.set(lx,b.min.y,lz));
 const top=mesh.localToWorld(out.set(lx,b.max.y+1,lz));
 ray.set(top,down);ray.far=1e4;const hit=ray.intersectObject(mesh,false)[0];
 return hit?out.copy(hit.point):mesh.localToWorld(out.set(lx,b.min.y,lz));
}
// cached per building model; returns {x,y,z,heading} in the people layer's frame or null while the model streams in
export function workSpotV284(type,buildingModel,peopleLayer){
 const spec=WORK_SPOTS_V284[type];if(!spec||!buildingModel)return null;
 const mesh=nearMesh(buildingModel);if(!mesh)return null;
 const key=mesh.uuid+':'+mesh.matrixWorld.elements.join(',');
 const cache=buildingModel.userData.workSpotV284;if(cache?.key===key)return cache.spot;
 const p=footprintPoint(mesh,spec.spot,spec.onTop,v),q=footprintPoint(mesh,spec.look,false,w2);
 peopleLayer.updateMatrixWorld(true);peopleLayer.worldToLocal(p);peopleLayer.worldToLocal(q);
 const spot={x:p.x,y:p.y,z:p.z,heading:Math.atan2(q.x-p.x,q.z-p.z),spec};
 buildingModel.userData.workSpotV284={key,spot};return spot;
}
// a few stone chips that burst from the struck stone at every blow (shared geometry and material)
const chipGeo=new T.TetrahedronGeometry(.075,0),chipMat=new T.MeshStandardMaterial({color:'#b9b2a3',roughness:.9,flatShading:true});chipGeo.userData.shared=true;
function chips(model){
 if(model.userData.chipsV284)return model.userData.chipsV284;
 const g=new T.Group();g.name='V284 stone chips';for(let i=0;i<6;i++){const m=new T.Mesh(chipGeo,chipMat);m.userData.dir=[(i/5-.5)*1.8,.9+((i*7)%5)*.25,.4+((i*3)%4)*.3];g.add(m);}
 model.add(g);model.userData.chipsV284=g;return g;
}
// blend: 0 = at the door (normal motion), 1 = at the work spot (climbed up / behind the bench)
export function applyWorkSpotV284(model,spot,working,time,dt,base){
 const u=model.userData,target=working&&spot?1:0;
 u.workBlendV284=(u.workBlendV284??0)+Math.sign(target-(u.workBlendV284??0))*Math.min(Math.abs(target-(u.workBlendV284??0)),dt/1.4);
 const k=u.workBlendV284;if(!spot||k<=0){if(u.chipsV284)u.chipsV284.visible=false;return {moving:false,blend:0};}
 const e=k*k*(3-2*k),climb=spot.spec.onTop?Math.sin(Math.PI*e)*.25:0; // a little hop while climbing the terraces
 model.position.set(base.x+(spot.x-base.x)*e,base.y+(spot.y-base.y)*e+climb,base.z+(spot.z-base.z)*e);
 if(k>.5)model.rotation.y=spot.heading;
 const g=chips(model),spec=spot.spec;g.visible=k>=1;
 // the chips fly at the moment of the blow: use the same work clock as the job motion (stone-motion-v222)
 const rig=model.children[0]?.userData?.rig,wt=rig?.workClock!=null?rig.workClock+rig.phase+rig.phase*.06:time;
 if(g.visible){const u_=((wt/spec.period)%1+1)%1,t=(u_-spec.hit)*spec.period,on=t>=0&&t<.45;
  // the burst starts where the tool's stone head is at the moment of the blow (fixed point on the spec as fallback)
  if(on&&!u.chipOriginV284){model.updateMatrixWorld(true);const hand=rig?.tool?.parent?.getWorldPosition(new T.Vector3());let best=null,far=-1;
   rig?.tool?.traverse(o=>{if(!o.isMesh||!hand)return;if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();const p=o.localToWorld(o.geometry.boundingSphere.center.clone()),d=p.distanceTo(hand);if(d>far){far=d;best=p;}});
   u.chipOriginV284=best?model.worldToLocal(best):new T.Vector3(...spec.chipAt);}
  if(!on)u.chipOriginV284=null;
  if(u.chipOriginV284)g.position.copy(u.chipOriginV284);
  g.children.forEach((c,i)=>{c.visible=on;if(!on)return;const d=c.userData.dir,s=t;c.position.set(d[0]*s*1.3,Math.max(0,d[1]*s*2.6-4.9*s*s)+.04,(d[2]-1)*s*1.1);c.rotation.set(s*20+i,s*15,0);});}
 return {moving:k>0&&k<1,blend:k};
}
