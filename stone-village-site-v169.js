// V169: first AI villages should not be founded on terrain where no real
// wooden perimeter can fit. Move at most one tile inland, preserving the
// initial coastal expedition and normal settler path / founding rules.
import {reserveStoneVillageRingV168} from './stone-village-defenses-v166.js';
const LAND_OFFSETS=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,-1],[1,1],[-1,1]];
export function stoneVillageFoundingTileV169(game,settler,target){
 if(!target||settler.team===0||game.s.cities.some(c=>c.team===settler.team))return target;
 const preferred={x:-18,z:-12},plannedSeed=game.s.seed;
 const assess=(cell)=>{
  if(!cell?.land||cell.mountain||game.territoryOwner(cell))return null;
  if(!cell.deposits?.wood||!cell.deposits?.stone)return null;
  const nav=game.nav(cell);
  if(![-4,0,4].every(dx=>[-4,0,4].every(dz=>nav.passable(preferred.x+dx,preferred.z+dz))))return null;
  const route=game.landPath(settler,cell,settler.team);
  if(route==null||route.length>64)return null;
  const fake={c:cell.c,r:cell.r,team:settler.team,economy:{buildings:[{type:'hall',hp:1200,ready:true,x:preferred.x,z:preferred.z}]}};
  const survey=reserveStoneVillageRingV168(game,fake);
  return {cell,blocked:survey?.terrainBlockedAtFounding??Infinity,
    water:!!cell.deposits.water,coast:!!cell.coast,
    distance:Math.abs(cell.c-target.c)+Math.abs(cell.r-target.r)};
 };
 const base=assess(target);
 // A dry founding square takes precedence over further inland expansion.
 if(base?.blocked===0)return target;
 let best=base;
 for(const [dc,dr] of LAND_OFFSETS.slice(1)){
  const cell=game.cell({c:target.c+dc,r:target.r+dr});
  const next=assess(cell);
  if(!next)continue;
  const rank=x=>x.blocked*100 + (x.water?0:6) + x.distance*2 + (x.coast?0:1);
  if(!best||rank(next)<rank(best))best=next;
 }
 return best?.cell||target;
}
