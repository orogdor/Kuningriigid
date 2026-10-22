// V123 one-step discovery silhouettes. No spoilers beyond technologies opened by
// finishing exactly one currently researchable discovery.
export function researchPreview(techs,research,canResearch){
 const known=new Set(research.known||[]),open=Object.keys(techs).filter(id=>!known.has(id)&&(research.active===id||canResearch(id,research)));
 const previews=new Map();
 for(const current of open){
  const simulated={...research,known:[...known,current],active:null,v118LegacyActive:null};
  for(const id of Object.keys(techs)){
   if(known.has(id)||open.includes(id)||!canResearch(id,simulated))continue;
   const sources=previews.get(id)||[];
   sources.push(current);previews.set(id,sources);
  }
 }
 return previews;
}
export function progressiveResearchIds(techs,research,canResearch){
 const known=new Set(research.known||[]);
 const present=Object.keys(techs).filter(id=>known.has(id)||research.active===id||canResearch(id,research));
 const previews=researchPreview(techs,research,canResearch);
 return {ids:[...present,...[...previews.keys()].filter(id=>!present.includes(id))],present:new Set(present),previews};
}
