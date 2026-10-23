// An independently saved AI city tour, without touching the user's current save.
export async function loadAICityV136(fetcher=fetch){
 const r=await fetcher('./scenarios/ai-city-v136.json?v=136a');
 if(!r.ok)throw Error('V136 AI town scenario has not been published ('+r.status+').');
 return r.json();
}
