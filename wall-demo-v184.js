export async function loadWallV184(demo,fetcher=fetch){
 if(!['wall-v184-coast','wall-v184-mountain'].includes(demo))throw Error('Tundmatu test');
 const response=await fetcher('./scenarios/'+demo+'.json?v=184');
 if(!response.ok)throw Error('Müüride testmäng ei laaditud ('+response.status+').');
 const s=await response.json(),city=s.cities?.find(c=>c.id===s.wallTestV184?.targetCityId);
 if(s.version!==4||s.demo!==demo||!city||city.team!==0||!s.wallTestV184?.controlled)throw Error('Vigane testmäng');
 return s;
}
