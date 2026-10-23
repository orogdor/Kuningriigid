export async function loadIronCityV143(fetcher=fetch){
 const r=await fetcher('./scenarios/ai-iron-v143.json?v=142a');
 if(!r.ok)throw Error('Rauaaja testmängu laadimine ebaõnnestus: '+r.status);
 const s=await r.json();
 if(s.ages?.[0]!==2||!s.cities?.some(c=>c.team===0))throw Error('Rauaaja testsalvestus ei vasta oodatud seisule.');
 return s;
}
