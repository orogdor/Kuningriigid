import * as T from './vendor/three.module.js';
const ringGeometry=new T.RingGeometry(2.35,2.48,40),barGeometry=new T.PlaneGeometry(4,.22);
const impactRing=new T.RingGeometry(.78,1,32),pebble=new T.SphereGeometry(.12,7,5),arrow=new T.CylinderGeometry(.025,.025,.8,5),tracer=new T.CylinderGeometry(.022,.022,.5,6);
const firearms=new Set(['musketeer','rifleman','motorized','arquebusier','cuirassier','field_cannon','line_infantry','dragoon','industrial_artillery','modern_infantry','machinegun_team','tank','rocket_team']);
export class BattleFeedback{
 constructor(parent,camera,height){this.parent=parent;this.camera=camera;this.height=height;this.markers=new Map();this.shots=new Map();this.impacts=new Map()}
 clear(){for(const g of this.markers.values()){g.traverse(o=>o.material?.dispose());this.parent.remove(g)}for(const g of this.shots.values()){g.material.dispose();this.parent.remove(g)}for(const g of this.impacts.values()){g.material.dispose();this.parent.remove(g);}this.markers.clear();this.shots.clear();this.impacts.clear()}
 update(squads,selected,battle,stats){
  const impactIds=new Set();
  for(const hit of battle?.rockImpacts||[]){
   impactIds.add(hit.id);let mesh=this.impacts.get(hit.id);
   if(!mesh){mesh=new T.Mesh(impactRing,new T.MeshBasicMaterial({color:hit.friendlies?'#cfa982':'#bbb49f',transparent:true,opacity:.6,side:T.DoubleSide,depthWrite:false}));mesh.rotation.x=-Math.PI/2;this.parent.add(mesh);this.impacts.set(hit.id,mesh);}
   const age=Math.max(0,battle.elapsed-hit.at);mesh.position.set(hit.x,this.height(hit.x,hit.z)+.13,hit.z);mesh.scale.setScalar(hit.radius*(.25+.75*Math.min(1,age/.8)));mesh.material.opacity=Math.max(0,.65-age*.55);
  }
  for(const [id,mesh] of this.impacts)if(!impactIds.has(id)){mesh.material.dispose();this.parent.remove(mesh);this.impacts.delete(id);}
  const live=new Set();for(const u of squads){live.add(u.source);let root=this.markers.get(u.source);if(!root){root=new T.Group();const ring=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:u.team?'#d98f76':'#efd18a',side:T.DoubleSide,depthTest:false,transparent:true,opacity:.9}));ring.rotation.x=-Math.PI/2;ring.position.y=.08;root.add(ring);const bar=new T.Group(),back=new T.Mesh(barGeometry,new T.MeshBasicMaterial({color:'#20372d',depthTest:false})),front=new T.Mesh(barGeometry,new T.MeshBasicMaterial({color:u.team?'#cc7b63':'#a4c385',depthTest:false}));front.position.z=.02;bar.add(back,front);bar.position.y=3;root.add(bar);this.parent.add(root);this.markers.set(u.source,root)}const max=u.maxHp||stats[u.kind].hp,ratio=Math.max(0,Math.min(1,u.hp/max));root.visible=u.hp>0&&!u.retreated;root.position.set(u.x,this.height(u.x,u.z),u.z);root.children[0].visible=u===selected;const bar=root.children[1];bar.visible=u===selected||u.hp<max;bar.quaternion.copy(this.camera.quaternion);bar.children[1].scale.x=ratio;bar.children[1].position.x=-2*(1-ratio);
 const gun=firearms.has(u.kind);let shot=this.shots.get(u.source);
 if(battle&&(stats[u.kind].range>5||u.kind==='chariot')&&u.shot&&u.projectile!==null&&u.attackTime!=null){if(!shot){shot=new T.Mesh(u.kind==='slinger'||u.projectile==='stone'?pebble:gun?tracer:arrow,new T.MeshBasicMaterial({color:gun?'#ffd680':'#e7d9b7',transparent:gun,opacity:gun?.92:1}));this.parent.add(shot);this.shots.set(u.source,shot)}
  shot.scale.setScalar(u.projectile==='stone'?3:1);const duration=u.projectile==='stone'?1.1:gun?(u.kind==='musketeer'?.24:.14):.65,f=(battle.elapsed-u.attackTime)/duration;
  shot.visible=!u.retreated&&f>=0&&f<1;
  if(shot.visible){const a=u.shot,x=a.x+(a.toX-a.x)*f,z=a.z+(a.toZ-a.z)*f,y0=this.height(a.x,a.z)+(gun?1.3:1.5),y1=this.height(a.toX,a.toZ)+1;
   shot.position.set(x,y0+(y1-y0)*f+(gun?0:Math.sin(Math.PI*f)*(u.projectile==='stone'?8:3)),z);
   if(u.kind!=='slinger')shot.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(a.toX-a.x,y1-y0+(gun?0:Math.cos(Math.PI*f)*9),a.toZ-a.z).normalize());
  }
 }else if(shot)shot.visible=false;
 // Short golden muzzle flash on rifle shots, smoke-gray flash for muskets.
 let flash=root.userData.muzzle;
 if(gun&&battle&&u.shot&&u.attackTime!=null){const age=battle.elapsed-u.attackTime;if(!flash){flash=new T.Mesh(new T.SphereGeometry(.18,6,4),new T.MeshBasicMaterial({color:u.kind==='musketeer'?'#ddd5bc':'#ffe499',transparent:true,opacity:.85,depthWrite:false}));root.add(flash);root.userData.muzzle=flash}flash.visible=age>=0&&age<(u.kind==='musketeer'?.20:.09);if(flash.visible){flash.position.set((u.shot.x-u.x)*.35+Math.sign(u.shot.toX-u.shot.x)*.6,1.5,(u.shot.z-u.z)*.35+Math.sign(u.shot.toZ-u.shot.z)*.6);flash.scale.setScalar(1+age*6)}}else if(flash)flash.visible=false;
 }
 for(const[id,root]of this.markers)if(!live.has(id))root.visible=false;for(const[id,shot]of this.shots)if(!live.has(id))shot.visible=false;
 }
}
