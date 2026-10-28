// V219: independently generated game, no copied/prepared older town.
export async function loadFreshBronzeV219(fetcher=fetch){
 const r=await fetcher('./scenarios/bronze-fresh-v219.json?v=219');
 if(!r.ok)throw Error('V219 uue maailma salvestus ei ole veel avaldatud ('+r.status+').');
 const state=await r.json(),m=state?.bronzeFreshV219;
 if(state.version!==4||state.demo!=='bronze-fresh-v219'||m?.seed!==5932019||
  !m?.newMap||m?.priorSaveLoaded!==false||m?.initial?.at!==0||
  m?.initial?.cityCount!==0||!m?.organicAI||state.ages?.[0]!==1||
  state.cities?.find(c=>c.id===m?.cityId)?.team!==0)
  throw Error('V219 uue mandrimaailma salvestus ei läbinud kontrolli.');
 return state;
}
