// V65: single deterministic geometry for both the 50x50 world tile and its
// 150x130 local detail map. The same paths and rock sites are projected into
// either view, rather than independently regenerated.
import {COLS,ROWS} from './campaign.js';

import {DETAIL_X,DETAIL_Z,DETAIL_TILE_X,DETAIL_TILE_Z,DETAIL_HALF_X,DETAIL_HALF_Z} from './detail-scale-v123.js';
export const TILE_X=DETAIL_TILE_X,TILE_Z=DETAIL_TILE_Z;
const H_W=25,H_D=25;
export function worldToDetail(tile,x,z){return {x:(x-tile.x)*DETAIL_X,z:(z-tile.z)*DETAIL_Z}}
export function detailToWorld(tile,x,z){return {x:tile.x+x/DETAIL_X,z:tile.z+z/DETAIL_Z}}
export const detailBounds=p=>Math.abs(p.x)<=DETAIL_HALF_X+.3&&Math.abs(p.z)<=DETAIL_HALF_Z+.3;
export function pointsOfRiver(game,cell,count=10){
 if(!cell?.river||!cell.riverTo)return [];
 const target=game.cell(cell.riverTo);
 if(!target)return [];
 const dx=target.x-cell.x,dz=target.z-cell.z,len=Math.hypot(dx,dz)||1;
 const nx=-dz/len,nz=dx/len,turn=game.noise(cell.c*31+405,cell.r*23+11)-.5;
 // The curve joins at exact cell centres. No mismatched tile-edge seams.
 const amplitude=Math.min(7,len*.12)*turn*2;
 const points=[];
 for(let i=0;i<=count;i++){
  const t=i/count,bend=Math.sin(Math.PI*t)*amplitude+Math.sin(Math.PI*2*t)*amplitude*.25;
  points.push({x:cell.x+dx*t+nx*bend,z:cell.z+dz*t+nz*bend,width:Math.max(2.15,Math.min(10,cell.riverWidth||3))*(1+.1*t)});
 }
 return points;
}
export function riverSegmentsNear(game,tile){
 const segments=[];
 for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){
  const c=tile.c+dc,r=tile.r+dr;if(c<0||r<0||c>=COLS||r>=ROWS)continue;
  const source=game.cell({c,r});if(!source?.river||!source.riverTo)continue;
  const to=game.cell(source.riverTo);
  if(!to)continue;
  // A river segment touches this tile if it crosses its 50x50 square.
  const minX=Math.min(source.x,to.x)-8,maxX=Math.max(source.x,to.x)+8;
  const minZ=Math.min(source.z,to.z)-8,maxZ=Math.max(source.z,to.z)+8;
  if(maxX<tile.x-H_W||minX>tile.x+H_W||maxZ<tile.z-H_D||minZ>tile.z+H_D)continue;
  segments.push({cell:source,points:pointsOfRiver(game,source)});
 }
 return segments;
}
export function rockSites(game,cell){
 if(!cell?.mountain)return [];
 const amount=cell.h>38?3:2,result=[];
 for(let i=0;i<amount;i++){
  const x=cell.x+(game.noise(cell.c*11+i,cell.r+308)-.5)*33;
  const z=cell.z+(game.noise(cell.c+i,cell.r*17+408)-.5)*33;
  const h=game.atlasHeight(x,z);
  if(h<=18)continue;
  result.push({x,z,h,size:6+(Math.min(48,h)-15)*.38+game.noise(cell.c+i,cell.r+907)*5,angle:game.noise(cell.c*13+i,cell.r*19+81)*Math.PI*2,snow:h>29});
 }
 return result;
}
export function roadCurve(game,a,b,count=12){
 // Canonical endpoint order is required: both neighbouring detail tiles and
 // the world atlas must bend the same side of a road.
 if(a.r*COLS+a.c>b.r*COLS+b.c)[a,b]=[b,a];
 const aa=game.cell(a),bb=game.cell(b);if(!aa||!bb)return [];
 const dx=bb.x-aa.x,dz=bb.z-aa.z,dist=Math.hypot(dx,dz)||1;
 const nx=-dz/dist,nz=dx/dist;
 // Canonical ordering gives the same bend even when displaying from the other tile.
 const offset=(game.noise(a.c*7+b.c,a.r*7+b.r)) *2;
 const points=[];
 for(let i=0;i<=count;i++){
  const t=i/count,bend=Math.sin(Math.PI*t)*offset;
  points.push({x:aa.x+dx*t+nx*bend,z:aa.z+dz*t+nz*bend});
 }
 return points;
}
export function lineToDetail(tile,points){
 return points.map(p=>({...worldToDetail(tile,p.x,p.z),width:p.width}));
}
export function segmentTouchesTile(tile,a,b,margin=1){
 const A=worldToDetail(tile,a.x,a.z),B=worldToDetail(tile,b.x,b.z);
 return Math.max(A.x,B.x)>=-DETAIL_HALF_X-margin&&Math.min(A.x,B.x)<=DETAIL_HALF_X+margin
  &&Math.max(A.z,B.z)>=-DETAIL_HALF_Z-margin&&Math.min(A.z,B.z)<=DETAIL_HALF_Z+margin;
}
