// V236: coherent atlas/detail scout coordinates without changing strategic movement.
// Each 50 m world tile is split into 8 x 8 sectors. No new state needs saving.
export const SCOUT_SECTORS_V236=8;
export const ATLAS_TILE_METRES_V236=50;
export function scoutSectorAxisV236(worldValue,tileCentre,detailTileSize){
 if(!Number.isFinite(worldValue)||!Number.isFinite(tileCentre))return {sector:4,tileOffset:0,local:0};
 const relative=worldValue-tileCentre,half=ATLAS_TILE_METRES_V236/2;
 const tileOffset=Math.floor((relative+half)/ATLAS_TILE_METRES_V236);
 const inside=relative-tileOffset*ATLAS_TILE_METRES_V236;
 const sector=Math.max(0,Math.min(SCOUT_SECTORS_V236-1,Math.floor((inside+half)*SCOUT_SECTORS_V236/ATLAS_TILE_METRES_V236)));
 const local=(tileOffset+(sector+.5)/SCOUT_SECTORS_V236-.5)*detailTileSize;
 return {sector,tileOffset,local};
}
export function scoutSectorPositionV236(pose,tile){
 const x=scoutSectorAxisV236(pose.x,tile.x,225);
 const z=scoutSectorAxisV236(pose.z,tile.z,195);
 return {x:x.local,z:z.local,sectorX:x.sector,sectorZ:z.sector,offsetC:x.tileOffset,offsetR:z.tileOffset};
}
// Lightweight smoothing removes 8x8 boundary jumps without changing the sector.
export function blendScoutPositionV236(current,target,dt){
 const k=Math.min(1,Math.max(0,(dt||0)*7));
 return {x:current.x+(target.x-current.x)*k,z:current.z+(target.z-current.z)*k};
}

// V240: retain 8x8 sector identity, but interpolate the actual movement
// continuously instead of jumping 28 metres from sector centre to centre.
export function scoutDetailPositionV240(pose,tile){
 const sector=scoutSectorPositionV236(pose,tile);
 const x=(pose.x-tile.x)*225/ATLAS_TILE_METRES_V236;
 const z=(pose.z-tile.z)*195/ATLAS_TILE_METRES_V236;
 return {...sector,x,z};
}
export function scoutWorldFromDetailV240(tile,detail){
 return {x:tile.x+detail.x*ATLAS_TILE_METRES_V236/225,
  z:tile.z+detail.z*ATLAS_TILE_METRES_V236/195};
}
