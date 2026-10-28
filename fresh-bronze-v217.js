// Authentic newly generated map, no preset city or materials.
export async function loadFreshBronzeV217(fetcher=fetch){
 const r=await fetcher('./scenarios/bronze-fresh-v217.json?v=217');
 if(!r.ok)throw Error('Uue pronksiaja testsalvestuse avaldamine on pooleli ('+r.status+').');
 const s=await r.json(),m=s?.bronzeFreshV217;
 if(s.version!==4||s.demo!=='bronze-fresh-v217'||m?.seed!==9280471||
  m?.initial?.at!==0||m?.initial?.cities!==0||!m?.organicAI||m?.priorSaveLoaded!==false||
  m?.age!==1||s.ages[0]!==1||s.cities.find(c=>c.id===m?.cityId)?.team!==0)
  throw Error('Uue maailma pronksiaja lõpuseis ei läbinud kontrolli');
 return s;
}
