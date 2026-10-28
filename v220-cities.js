// Genuine AI saves grown in three different freshly generated continent maps.
export async function loadV220City(demo,fetcher=fetch){
 if(!['v220-city-a','v220-city-b','v220-city-c'].includes(demo))
  throw Error('Unknown V220 AI city');
 const r=await fetcher('./scenarios/'+demo+'.json?v=220');
 if(!r.ok)throw Error('AI uue maailma salvestus ei ole veel avaldatud ('+r.status+').');
 const s=await r.json(),m=s?.v220City;
 const seeds={a:7531027,b:8419063,c:9622017};
 if(s.version!==4||s.demo!==demo||m?.seed!==seeds[demo.slice(-1)]||
  !m?.newMap||!m?.organicAI||m?.priorSaveLoaded!==false||
  m?.initial?.at!==0||m?.initial?.cities!==0||s.ages?.[0]!==1||
  s.cities?.find(c=>c.id===m?.cityId)?.team!==0)
  throw Error('V220 uue AI maailma salvestus ei läbinud kontrolli');
 return s;
}
