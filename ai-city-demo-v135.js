// V135 city tour: the snapshot is generated from real AI turns in CI.
export async function loadAICityV135(fetcher=fetch){
 const response=await fetcher('./scenarios/ai-city-v135.json?v=135a');
 if(!response.ok)throw Error('AI city test save is not published ('+response.status+').');
 return response.json();
}
