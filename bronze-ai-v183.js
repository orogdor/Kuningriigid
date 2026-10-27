export async function loadBronzeV183(demo,fetcher=fetch){
 if(!['bronze-v183-mountain','bronze-v183-coast'].includes(demo))throw Error('Tundmatu testmäng');
 const response=await fetcher('./scenarios/'+demo+'.json?v=183');
 if(!response.ok)throw Error('Pronksiaja testmäng ei laaditud: '+response.status);
 const state=await response.json(), city=state.cities?.find(c=>c.id===state.bronzeTestV183?.targetCityId);
 if(state.version!==4||state.demo!==demo||state.ages?.[0]!==1||city?.team!==0)throw Error('Vigane pronksiaja testmäng');
 return state;
}
