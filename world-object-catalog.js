// V75: canonical world-object positions shared by atlas and local detail maps.
// Pure geometry/selection data; never persist it in version-4 game saves.
const key=cell=>cell.c+':'+cell.r;
function spreadAcrossMap(sites,limit){
 if(sites.length<=limit)return sites;
 const step=sites.length/limit;
 return Array.from({length:limit},(_,i)=>sites[Math.floor((i+.5)*step)]);
}
export const PROP_KINDS=Object.freeze(['village','ruins','rock','forest','bridge']);
export function createWorldObjectCatalog(game,quality='medium'){
 const density=quality==='low'?.5:quality==='high'?1:.75;
 // These are the exact original V58 atlas selection rules; don't generate
 // different random objects in the local renderer.
 const candidates={
  rock:spreadAcrossMap(game.cells.filter(c=>c.mountain&&game.noise(c.c*11+5,c.r*7+25)>.972),Math.round(260*density)),
  forest:spreadAcrossMap(game.cells.filter(c=>c.land&&!c.mountain&&c.biome==='forest'&&game.noise(c.c*17+15,c.r*13+24)>.964),Math.round(220*density)),
  bridge:spreadAcrossMap(game.cells.filter(c=>c.land&&(c.bridge||c.ford)&&c.river),120)
 };
 const byCell=new Map();
 for(const [kind,cells]of Object.entries(candidates))
  for(const cell of cells){
   const id=kind+':'+key(cell),item={id,kind,c:cell.c,r:cell.r,cell};
   if(!byCell.has(key(cell)))byCell.set(key(cell),[]);
   byCell.get(key(cell)).push(item);
  }
 // Landmarks are persisted in game.s.landmarks. Read their current state, not
 // a frozen copy, so a claimed village / explored ruin stays correctly marked.
 return {
  candidates,
  at(tile){
   const items=[...(byCell.get(key(tile))||[])];
   for(const landmark of game.s.landmarks||[])
    if(landmark.c===tile.c&&landmark.r===tile.r&&['village','ruins'].includes(landmark.kind))
     items.push({id:'landmark:'+landmark.id,kind:landmark.kind,c:tile.c,r:tile.r,cell:game.cell(tile),landmark});
   return items;
  },
  all(){return [...byCell.values()].flat()},
  counts:Object.fromEntries(Object.entries(candidates).map(([k,v])=>[k,v.length]))
 };
}
