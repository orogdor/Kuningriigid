import * as T from './vendor/three.module.js';
// A finished tower replaces the middle of its supporting curtain visually.
// Its wall collision stays intact, so no navigable gap is introduced.
export function wallHasTowerV180(wall,buildings){
 return !!(wall?.drawnWallV175&&!wall.cliffEmbedStartV179&&!wall.cliffEmbedEndV179&&
  buildings?.some(b=>b!==wall&&['watchtower','stonetower'].includes(b.type)&&b.hp>0&&b.ready&&Math.hypot(b.x-wall.x,b.z-wall.z)<.5));
}
export function cutWallAtTowerV180(model,wall){
 const span=wall.palisadeSpanV167||7,cut=Math.min(4.2,span-.2),fraction=Math.max(0,(span-cut)/(2*span));
 const group=new T.Group();group.userData={...model.userData};
 for(const sign of [-1,1]){const piece=model.clone(true);piece.scale.x*=fraction;piece.position.x+=sign*7*(1-fraction)/2;group.add(piece);}
 return group;
}
