// V62: Deterministic, buildable shoreline starts for a freshly generated world.
// We sample the actual terrain elevation, including coastline noise, BEFORE
// adding each faction's gentle land-only starting plateau.
export const COAST_START_DISTANCE=28;
const steps=[[1,0],[-1,0],[0,1],[0,-1]];
export function chooseCoastalStarts(cols,rows,heightAt,preferred=[],minDistance=COAST_START_DISTANCE){
 const heights=new Float32Array(cols*rows);
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)heights[r*cols+c]=heightAt(c,r);
 const height=(c,r)=>c<0||r<0||c>=cols||r>=rows?-40:heights[r*cols+c];
 const coast=(c,r)=>steps.some(([dc,dr])=>height(c+dc,r+dr)<=0);
 const candidates=[];
 for(let r=3;r<rows-3;r++)for(let c=3;c<cols-3;c++){
  const h=height(c,r);
  if(h<=1.25||h>=30||!coast(c,r))continue;
  let dry=0,local=0,shelter=0;
  for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){
   const y=height(c+dc,r+dr);
   if(y>0&&y<30)dry++;
   if(Math.abs(dc)<=1&&Math.abs(dr)<=1&&y>0&&y<30)local++;
   if(Math.abs(dc)+Math.abs(dr)===1&&y>0)shelter++;
  }
  // The starting tile borders the sea but is not a tiny isolated sandbar.
  if(dry<11||local<5||shelter<2)continue;
  candidates.push({c,r,quality:dry*.32+local*.8+shelter*1.4-Math.max(0,h-18)*.3});
 }
 if(candidates.length<4)throw new Error('No playable coastline found for all four factions');
 const selected=[];
 const separation=(a,b)=>Math.hypot(a.c-b.c,a.r-b.r);
 for(let team=0;team<4;team++){
  const target=preferred[team]||{c:Math.round((team%2?.77:.23)*cols),r:Math.round((team>=2?.77:.23)*rows)};
  let best=null,bestScore=-Infinity;
  for(const p of candidates){
   const nearest=selected.length?Math.min(...selected.map(q=>separation(q,p))):Infinity;
   if(nearest<minDistance)continue;
   const targetDist=separation(target,p);
   // Keep each faction in the broad region assigned by the existing map,
   // but prioritize separation and a healthy inland buildable hinterland.
   const score=-targetDist*1.15+p.quality+(Number.isFinite(nearest)?Math.min(nearest,70)*.38:0);
   if(score>bestScore){bestScore=score;best=p}
  }
  if(!best)throw new Error('Cannot place four separated coastal factions');
  selected.push({c:best.c,r:best.r});
 }
 return selected;
}
