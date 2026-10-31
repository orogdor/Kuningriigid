import {buildingClearance} from './navigation.js?v=2273';
import {fieldSize,validateField} from './farming-v127.js';
import {configureWallFootprint} from './fortifications.js?v=1757a';
const WALLS=new Set(['palisade','stonewall','reinforced_wall']);
const GATES=new Set(['woodgate','gatehouse']);
const restricted=new Set(['bridge','fisher','harbor']);
function valid(game,ctx,b){return !!ctx&&ctx.team===0&&!game.s.battle&&!!b&&!b.virtual&&b.hp>0&&ctx.economy.buildings.includes(b)}
function overlap(a,ar,b,br){return !!ar&&!!br&&Math.abs(a.x-b.x)<ar.rx+br.rx-.15&&Math.abs(a.z-b.z)<ar.rz+br.rz-.15}
function changed(game,ctx){ctx.world.revision=(ctx.world.revision||0)+1;game.nav(ctx).rebuild();game.uiRevision=(game.uiRevision||0)+1}
export function rotateBuilding(game,ctx,b){
 if(!valid(game,ctx,b))return {error:'Vali oma linna hoone.'};
 if(restricted.has(b.type)||b.landEntry||b.accessEntry)return {error:'Selle ehitise asend sõltub maastikust või põllu kujust.'};
 if(b.wallUpgradeV184)return {error:'Oota müüri uuendamise lõppu.'};
 if(game.wallGuards?.(ctx,b)?.length)return {error:'Kutsu esmalt müüril olevad sõdurid tagasi.'};
 const candidate={...b},old=buildingClearance(b);
 if(b.type==='field'){const d=fieldSize(b);candidate.width=b.freeRotationV243?d.width:d.depth;candidate.depth=b.freeRotationV243?d.depth:d.width;candidate.buildingRotationV228=((b.buildingRotationV228||0)+Math.PI/2)%(2*Math.PI);const check={...ctx,economy:{...ctx.economy,buildings:ctx.economy.buildings.filter(x=>x!==b)}};const error=validateField(check,candidate,game.nav(ctx).passable);if(error)return {error};Object.assign(b,candidate);changed(game,ctx);return {ok:true};}
 if(WALLS.has(b.type)||GATES.has(b.type)){
  candidate.wallAngleV175=(Number.isFinite(b.wallAngleV175)?b.wallAngleV175:(b.wallAxis?Math.PI/2:0))+Math.PI/2;
  if(Number.isFinite(b.buildingRotationV228))candidate.buildingRotationV228=(b.buildingRotationV228+Math.PI/2)%(2*Math.PI);
  candidate.wallAxis=b.wallAxis?0:1;
  if(WALLS.has(b.type)){candidate.navWidth=0;candidate.navDepth=0;configureWallFootprint(candidate)}
 }else candidate.buildingRotationV228=((b.buildingRotationV228||0)+Math.PI/2)%(2*Math.PI);
 const next=buildingClearance(candidate);
 if(next){
  for(const other of ctx.economy.buildings){if(other===b||other.virtual||other.hp<=0)continue;const o=buildingClearance(other);if(overlap(candidate,next,other,o)&&!overlap(b,old,other,o))return {error:'Pööratud hoone jaoks pole piisavalt ruumi.'};}
  const nav=game.nav(ctx);for(const x of [-next.rx,next.rx])for(const z of [-next.rz,next.rz])if(!nav.passable(b.x+x,b.z+z))return {error:'Pööratud hoone ulatuks ebasobivale maapinnale.'};
 }
 Object.assign(b,candidate);changed(game,ctx);return {ok:true};
}
export function pauseConstruction(game,ctx,b){
 if(!valid(game,ctx,b)||b.ready)return {error:'Vali ehitamisel olev hoone.'};
 b.disabled=!b.disabled;b.assigned=0;b.efficiency=0;b.workThisTick=0;game.uiRevision=(game.uiRevision||0)+1;return {ok:true,paused:b.disabled};
}
export function removeBuilding(game,ctx,b){
 if(!valid(game,ctx,b)||b.type==='hall')return {error:'Peahoonet ei saa kustutada.'};
 if(game.wallGuards?.(ctx,b)?.length)return {error:'Kutsu esmalt müüril olevad sõdurid tagasi.'};
 if(b.type==='bridge')return {error:'Silla kustutamine ei ole praegu toetatud.'};
 const buildings=ctx.economy.buildings,index=buildings.indexOf(b);buildings.splice(index,1);
 const hall=buildings.findIndex(x=>x.type==='hall'&&x.team===ctx.team),remap=n=>!Number.isInteger(n)?n:n===index?Math.max(0,hall):n>index?n-1:n;
 for(const other of buildings)if(other.parent!=null)other.parent=remap(other.parent);
 for(const cargo of ctx.economy.cargo||[])if(cargo.parent!=null)cargo.parent=remap(cargo.parent);
 for(const agent of game.parentCity(ctx)?.builderAgents||[]){if(agent){agent.job=null;agent.materialJob=null;agent.materialDepot=null;}}
 changed(game,ctx);return {ok:true};
}
