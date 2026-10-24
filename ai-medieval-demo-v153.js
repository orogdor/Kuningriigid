// Only a genuine V153 AI test snapshot is accepted; player saves are untouched.
export async function loadAIMedievalV153(fetcher=fetch){
 const r=await fetcher('./scenarios/ai-medieval-v153.json?v=153-balanced-medieval');
 if(!r.ok)throw Error('Keskaja AI testsalvestuse laadimine ebaõnnestus: '+r.status);
 const s=await r.json();
 const t=s.medievalTestV153,city=s.cities?.find(c=>c.id===t?.targetCityId);
 if(s.demo!=='ai-medieval-v153'||s.ages?.[0]<3||!city||city.team!==0)
  throw Error('Keskaja AI testmäng ei ole valideeritud keskaja salvestus.');
 return s;
}
