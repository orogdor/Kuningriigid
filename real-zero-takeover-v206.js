// The V206 scenarios are built by the real AI from createGame(seed).
// Unlike V205 previews, this loader NEVER completes walls or adds resources.
export async function loadRealZeroV206(demo,fetcher=fetch){
 if(!['zero-v206-coast','zero-v206-mountain'].includes(demo))
  throw Error('Unknown from-zero AI town');
 const kind=demo.endsWith('coast')?'coast':'mountain';
 const response=await fetcher('./scenarios/zero-v206-'+kind+'.json?v=206');
 if(!response.ok)throw Error('New-game AI checkpoint is not published ('+response.status+')');
 const state=await response.json(),test=state.zeroTestV206;
 const city=state.cities?.find(c=>c.id===test?.targetCityId);
 if(state.version!==4||state.demo!==demo||test?.seed!==142023||
    test?.initial?.initialTime!==0||test?.priorSaveLoaded!==false||test?.organicAI!==true||
    city?.team!==0)throw Error('Invalid natural AI city checkpoint');
 const built=[...(city.economy?.buildings||[]),...Object.values(city.districts||{})
  .flatMap(d=>d.economy?.buildings||[])].filter(b=>b.outerRingV184&&b.hp>0);
 if(built.length!==test.secondWallBuilt)throw Error('Second-wall verification mismatch');
 return state;
}
