// Load a tested AI-built campaign. Normal autosaves stay untouched.
export async function loadAIModernV140(fetcher=fetch){
 const response=await fetcher('./scenarios/ai-modern-v140.json?v=140a');
 if(!response.ok)throw Error('Moodsa ajastu AI test pole veel avaldatud ('+response.status+').');
 const s=await response.json();
 if(!s.cities?.some(c=>c.team===0))throw Error('AI testis puudub mängija ülevõetud linn.');
 return s;
}
