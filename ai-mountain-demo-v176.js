// An isolated takeover snapshot. Loading it never writes the normal autosave.
export async function loadAIMountainV176(fetcher=fetch){
 const response=await fetcher('./scenarios/ai-mountain-v176.json?v=178a');
 if(!response.ok)throw Error('Mäeäärse AI linna testmängu ei saanud laadida ('+response.status+').');
 const s=await response.json(),test=s.mountainTestV176,city=s.cities?.find(c=>c.id===test?.targetCityId);
 if(s.version!==4||s.demo!=='ai-mountain-v176'||s.cities?.length!==1||city?.team!==0||
    !test?.mountain||!city.stoneDefensePlanV166?.naturalBarriersV176?.some(b=>b.kind==='mountain'))
  throw Error('Mäeäärse ühe linna ülevõtmissalvestus ei ole valideeritud.');
 return s;
}
