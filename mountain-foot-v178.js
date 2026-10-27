import {localVisualSurface} from './continuous-landscape.js?v=162a';
import {DETAIL_HALF_X,DETAIL_HALF_Z,tileDelta,localTilePoint} from './detail-scale-v123.js';
// A mountain tile may contain a shallow foot outside its visible rock face.
// Only a strip next to genuinely non-mountain land can be buildable; mountain
// interiors and steep rock remain impassable to walking and wall construction.
export function mountainBlockedV178(game,origin,x,z){
 const {dc,dr}=tileDelta(x,z),tile=game.cell({c:origin.c+dc,r:origin.r+dr});
 if(!tile)return true;if(!tile.mountain)return false;
 const p=localTilePoint(x,z,dc,dr),neighbours=[[-1,0,p.x+DETAIL_HALF_X],[1,0,DETAIL_HALF_X-p.x],[0,-1,p.z+DETAIL_HALF_Z],[0,1,DETAIL_HALF_Z-p.z]];
 if(!neighbours.some(([ox,oz,d])=>d>=0&&d<=40&&game.cell({c:tile.c+ox,r:tile.r+oz})?.land&&!game.cell({c:tile.c+ox,r:tile.r+oz})?.mountain))return true;
 const h=(a,b)=>localVisualSurface(game,origin,a,b),step=2,base=h(x,z);
 return Math.max(Math.abs(h(x+step,z)-base),Math.abs(h(x-step,z)-base),Math.abs(h(x,z+step)-base),Math.abs(h(x,z-step)-base))/step>.55;
}
