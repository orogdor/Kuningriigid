// Real AI-built compact historical towns; never replace the ordinary save.
export async function loadAICityV139(fetcher=fetch){
 const response=await fetcher('./scenarios/ai-city-v139.json?v=139a');
 if(!response.ok)throw Error('V139 test game has not been published ('+response.status+').');
 return response.json();
}
