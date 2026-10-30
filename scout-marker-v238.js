// V238 Scout visibility: keep real-scale animated scout model, add a small
// camera-facing marker and a terrain ring so single explorers are findable.
// All geometry/materials/textures are shared; not one texture per scout.
import * as T from './vendor/three.module.js';

const colors=['#f6d88b','#dca58a','#c4aff5','#d7be73'];
const cache=new Map();
function material(team){
 const color=colors[Math.abs(team|0)%colors.length];
 if(cache.has(color))return cache.get(color);
 const canvas=document.createElement('canvas');
 canvas.width=320;canvas.height=112;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='rgba(12,28,33,0.92)';
 ctx.beginPath();ctx.roundRect(5,8,310,96,22);ctx.fill();
 ctx.strokeStyle=color;ctx.lineWidth=7;ctx.stroke();
 ctx.fillStyle=color;ctx.beginPath();ctx.arc(45,56,20,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#1a2328';ctx.font='bold 30px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✦',45,57);
 ctx.fillStyle='#fff5d7';ctx.font='bold 43px Arial,sans-serif';ctx.textAlign='left';ctx.fillText('SCOUT',83,68);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const mat=new T.SpriteMaterial({map:texture,transparent:true,depthTest:true,depthWrite:false,fog:true});
 cache.set(color,mat);return mat;
}
const ringGeo=new T.RingGeometry(1.25,1.55,30);
ringGeo.rotateX(-Math.PI/2);ringGeo.userData.shared=true;
const rings=colors.map(c=>new T.MeshBasicMaterial({color:c,side:T.DoubleSide,transparent:true,opacity:.68,depthWrite:false,depthTest:true}));
export function attachScoutMarkerV238(root,team=0){
 if(root.userData.scoutMarkerV238)return root.userData.scoutMarkerV238;
 const holder=new T.Group();
 holder.name='V238 scout location';
 holder.userData.scoutMarkerV238=true;
 const ring=new T.Mesh(ringGeo,rings[Math.abs(team|0)%rings.length]);
 ring.position.y=.13;ring.renderOrder=45;holder.add(ring);
 const sprite=new T.Sprite(material(team));
 sprite.position.set(0,2.8,0);
 sprite.scale.set(2.6,.91,1);
 sprite.renderOrder=4;holder.add(sprite);
 root.add(holder);
 root.userData.scoutMarkerV238=holder;
 return holder;
}
// V239: bounded world-unit labels never obscure a nearby first-person camera.
const markerPointV239=new T.Vector3(),eyePointV239=new T.Vector3();
export function sizeScoutMarkerV238(root,zoom=150,options={}){
 const holder=root?.userData?.scoutMarkerV238;if(!holder)return;
 const scale=Math.max(.72,Math.min(1.55,(Number(zoom)||150)/145));
 const sprite=holder.children.find(c=>c.isSprite),ring=holder.children.find(c=>c.isMesh);
 let distance=Infinity;
 if(options.camera?.getWorldPosition){
  root.getWorldPosition(markerPointV239);
  options.camera.getWorldPosition(eyePointV239);
  distance=markerPointV239.distanceTo(eyePointV239);
 }
 if(sprite){
  sprite.visible=options.names!==false&&!(options.firstPerson&&distance<9);
  sprite.position.y=2.8;sprite.scale.set(2.6*scale,.91*scale,1);
 }
 if(ring)ring.visible=options.ring!==false;
 holder.visible=true;
}
