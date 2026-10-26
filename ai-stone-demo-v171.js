// V171: playable real AI settlement near the Stone-to-Bronze transition.
// Demo fetch does not modify the player's own autosave.
export async function loadAIStoneV171(fetcher=fetch){
 const response=await fetcher('./scenarios/ai-stone-v171.json?v=171-stone-takeover');
 if(!response.ok)throw Error('Kiviaja lõpu AI testsalvestust ei saadud laadida ('+response.status+').');
 const s=await response.json(),test=s.stoneTestV171;
 const city=s.cities?.find(c=>c.id===test?.targetCityId);
 if(s.demo!=='ai-stone-v171'||s.version!==4||s.ages?.[0]!==0||!city||city.team!==0
   ||test?.townStats?.defensesReady!==test?.townStats?.defensesTotal
   ||test?.townStats?.defensesTotal<12)
  throw Error('V171 testmängu kiviaja lõpu küla ei ole valideeritud.');
 return s;
}
