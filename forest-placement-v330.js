// One jittered world-space lattice. Tiles only own points; they do not centre a grove.
export function forestRandomV330(x,z,seed=0,salt=0){const n=Math.sin(x*127.1+z*311.7+seed*.017+salt*53.79)*43758.5453;return n-Math.floor(n);}
export function* forestCandidatesV330(cell,spacing,seed=0,salt=0){
 const minX=cell.x-25,maxX=cell.x+25,minZ=cell.z-25,maxZ=cell.z+25;
 for(let gz=Math.floor(minZ/spacing);gz<=Math.floor(maxZ/spacing);gz++)for(let gx=Math.floor(minX/spacing);gx<=Math.floor(maxX/spacing);gx++){
  const x=(gx+.12+.76*forestRandomV330(gx,gz,seed,salt))*spacing,z=(gz+.12+.76*forestRandomV330(gx,gz,seed,salt+1))*spacing;
  // Half-open ownership prevents duplicates at shared tile edges.
  if(x>=minX&&x<maxX&&z>=minZ&&z<maxZ)yield {x,z,gx,gz};
 }
}
