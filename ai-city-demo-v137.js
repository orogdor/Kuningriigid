// V137 live AI town tour, independent of the player's personal save.
export async function loadAICityV137(fetcher=fetch){
 const r=await fetcher('./scenarios/ai-city-v137.json?v=137a');
 if(!r.ok)throw Error('V137 AI test scenario is unavailable ('+r.status+').');
 return r.json();
}
