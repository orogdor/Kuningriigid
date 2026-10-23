// Exact-coordinate cache: no rounding or reduced terrain detail.
const scalarCaches=new WeakMap();
export function memoHeight(game,x,z,compute){
 const revision=(game.s?.terrainRevision||0)+':'+(game.s?.crossingRevision||0);let cache=scalarCaches.get(game);
 if(!cache||cache.revision!==revision){cache={revision,rows:new Map(),size:0,hits:0};scalarCaches.set(game,cache)}
 let row=cache.rows.get(x);if(row?.has(z)){cache.hits++;return row.get(z)}
 const value=compute();if(!row){row=new Map();cache.rows.set(x,row)}row.set(z,value);cache.size++;
 if(cache.size>30000){const key=cache.rows.keys().next().value;cache.size-=cache.rows.get(key).size;cache.rows.delete(key)}
 return value;
}
export const heightCacheStats=game=>{const c=scalarCaches.get(game);return c?{size:c.size,hits:c.hits}:null};
export function freezeStaticTransforms(root){
 const dynamic=new Set((root.userData.animations||[]).map(a=>a.node));
 for(const key of ['smoke','towerGuard','roofBallista'])if(root.userData[key])dynamic.add(root.userData[key]);
 function visit(node,animated=false){animated=animated||dynamic.has(node);if(!animated){node.updateMatrix();node.matrixAutoUpdate=false}for(const child of node.children)visit(child,animated)}
 visit(root);return root;
}
const transforms=new WeakMap();
export function updateStaticRoot(root){
 const p=root.position,q=root.quaternion,s=root.scale,c=transforms.get(root);
 if(c&&c.x===p.x&&c.y===p.y&&c.z===p.z&&c.qx===q.x&&c.qy===q.y&&c.qz===q.z&&c.qw===q.w&&c.sx===s.x&&c.sy===s.y&&c.sz===s.z)return;
 root.updateMatrix();transforms.set(root,{x:p.x,y:p.y,z:p.z,qx:q.x,qy:q.y,qz:q.z,qw:q.w,sx:s.x,sy:s.y,sz:s.z});
}

// Retain live menu nodes; patch only changed attributes and text. Remember raw
// source text so the localization observer's translated text remains untouched.
const sources=new WeakMap();
function patchNode(old,next){
 if(old.nodeType!==next.nodeType||old.nodeName!==next.nodeName){old.replaceWith(next);return next}
 if(old.nodeType===3){if(sources.get(old)!==next.data){if(old.data!==next.data)old.data=next.data;sources.set(old,next.data)}return old}
 if(old.nodeType!==1)return old;
 let attrs=sources.get(old);if(!(attrs instanceof Map)){attrs=new Map();sources.set(old,attrs)}
 for(const a of [...old.attributes])if(!next.hasAttribute(a.name))old.removeAttribute(a.name);
 for(const a of next.attributes)if(attrs.get(a.name)!==a.value||!old.hasAttribute(a.name)){if(old.getAttribute(a.name)!==a.value)old.setAttribute(a.name,a.value);attrs.set(a.name,a.value)}
 if(next.onclick)old.onclick=next.onclick;
 const children=[...old.childNodes];let index=0;
 for(const node of [...next.childNodes]){const previous=children[index++];if(previous)patchNode(previous,node);else old.append(node)}
 for(let i=index;i<children.length;i++)children[i].remove();
 return old;
}
export function patchMenu(target,next){patchNode(target,next)}
