// Only a genuine V144 AI test snapshot is accepted; player saves are untouched.
export async function loadAIMedievalV144(fetcher=fetch){
 const r=await fetcher('./scenarios/ai-medieval-v144.json?v=144a');
 if(!r.ok)throw Error('Keskaja AI testsalvestuse laadimine ebaõnnestus: '+r.status);
 const s=await r.json();
 const t=s.medievalTestV144,city=s.cities?.find(c=>c.id===t?.targetCityId);
 if(s.demo!=='ai-medieval-v144'||s.ages?.[0]!==3||!city||city.team!==0)
  throw Error('Keskaja AI testmäng ei ole valideeritud keskaja salvestus.');
 return s;
}
