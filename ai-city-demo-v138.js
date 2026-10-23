// Load an authentic AI-grown V138 settlement without touching normal saved games.
export async function loadAICityV138(fetcher=fetch){
 const response=await fetcher('./scenarios/ai-city-v138.json?v=138a');
 if(!response.ok)throw Error('V138 AI test city scenario is unavailable ('+response.status+').');
 return response.json();
}
