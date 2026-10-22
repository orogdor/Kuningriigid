// V121: distinguish choosing a world tile from explicitly opening its detail on a double-tap.
export class TileDoubleTap {
 constructor({mouseMs=340,touchMs=460,tolerance=26}={}){this.mouseMs=mouseMs;this.touchMs=touchMs;this.tolerance=tolerance;this.last=null}
 reset(){this.last=null}
 push({tile,x,y,time,pointerType='mouse'}){
  const last=this.last,maxAge=pointerType==='touch'?this.touchMs:this.mouseMs;
  this.last={tile,x,y,time,pointerType};
  if(!last||last.tile!==tile||last.pointerType!==pointerType||time<last.time||time-last.time>maxAge||Math.hypot(x-last.x,y-last.y)>this.tolerance)return false;
  this.reset();return true;
 }
}
export const detailWheelTransition=({view,zoom,deltaY,isBattle=false,localMax=300})=>{
 const next=zoom+deltaY*(view==='world'?.5:.04);
 return {zoom:Math.max(view==='world'?150:22,Math.min(view==='world'?9000:isBattle?2800:localMax,next)),
   exitToWorld:view==='local'&&!isBattle&&deltaY>0&&next>=localMax};
};
