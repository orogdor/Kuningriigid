// V123: one world-map tile remains 50 x 50 atlas metres.
// Each local/detail tile now spans 225 x 195 gameplay units (50% larger
// linear dimensions than V122's 150 x 130). 3x3 neighbours remain seamless.
export const DETAIL_X=4.5,DETAIL_Z=3.9,DETAIL_Y=.30;
export const DETAIL_TILE_X=50*DETAIL_X,DETAIL_TILE_Z=50*DETAIL_Z;
export const DETAIL_HALF_X=DETAIL_TILE_X/2,DETAIL_HALF_Z=DETAIL_TILE_Z/2;
export const DETAIL_NAV_MARGIN=4;
export function tileDelta(x,z){
 return {dc:Math.floor((x+DETAIL_HALF_X)/DETAIL_TILE_X),
         dr:Math.floor((z+DETAIL_HALF_Z)/DETAIL_TILE_Z)};
}
export function localTilePoint(x,z,dc,dr){
 return {x:x-dc*DETAIL_TILE_X,z:z-dr*DETAIL_TILE_Z};
}
