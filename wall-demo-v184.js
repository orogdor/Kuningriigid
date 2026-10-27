export async function loadWallV184(demo,fetcher=fetch){
 if(!['wall-v184-coast','wall-v184-mountain'].includes(demo))throw Error('Tundmatu test');
 const response=await fetcher('./scenarios/'+demo+'.json?v=184');
 if(!response.ok)throw Error('Müüride testmäng ei laaditud ('+response.status+').');
 const s=await response.json(),city=s.cities?.find(c=>c.id===s.wallTestV184?.targetCityId);
 if(s.version!==4||s.demo!==demo||!city||city.team!==0||!s.wallTestV184?.controlled)throw Error('Vigane testmäng');
 return s;
}


// V190 reference-preview towns are generated from the pre-outer-ring Bronze
// scenario. Unlike the older wall-v184 saved demos, this uses the LIVE organic
// planner, so visual QA always reflects the installed curtain algorithm.
export async function loadOrganicWallV190(demo,fetcher=fetch){
 if(!['wall-v190-coast','wall-v190-mountain'].includes(demo))throw Error('Tundmatu eeslinna test');
 const kind=demo.endsWith('coast')?'coast':'mountain';
 const response=await fetcher('./scenarios/bronze-v183-'+kind+'.json?v=183');
 if(!response.ok)throw Error('Eeslinna test ei laaditud ('+response.status+').');
 const s=await response.json();
 const {Civilization}=await import('./civilization-core.js?v=194');
 const {planOuterRingV184}=await import('./ai-defenses-v128.js?v=194');
 const game=new Civilization(s);
 const city=game.s.cities.find(c=>c.id===s.bronzeTestV183?.targetCityId);
 if(s.version!==4||!city||city.team!==0)throw Error('Vigane eeslinna testsalvestus');
 const realm=city.economy.realms[city.team],originalResources={...realm.resources},originalPop=realm.pop;
 // Controlled, visual-only completion. In ordinary gameplay each segment is
 // purchased and completed by real builders over time.
 for(const ctx of game.contexts(city))for(const b of ctx.economy.buildings)if(b.hp>0&&!b.ready)b.ready=true;
 realm.pop=Math.max(30,realm.pop);
 for(let i=0;i<180;i++){
  Object.assign(realm.resources,{wood:120,stone:120,cutstone:100,water:100,meat:100,gold:999});
  planOuterRingV184(game,city.team,city);
  for(const ctx of game.contexts(city))for(const b of ctx.economy.buildings)if(b.outerRingV184&&b.hp>0)b.ready=true;
  if(city.outerRingDiagnosticV184?.reason==='complete')break;
 }
 if(city.outerRingDiagnosticV184?.reason!=='complete')throw Error('Eeslinna müür ei valminud: '+JSON.stringify({outer:city.outerRingDiagnosticV184,survey:city.historicSurveyDiagnosticV191}));
 realm.resources=originalResources;realm.pop=originalPop;
 game.s.demo=demo;
 game.s.wallTestV190={kind,targetCityId:city.id,controlled:true,
  organic:!!city.outerRingV184?.organicOutlineV189,
  outerSegments:city.outerRingV184.slots.length,
  suburbArea:city.outerRingV184.areaEstimateV186,
  naturalBoundary:city.outerRingV184.naturalBoundaryV194?.kind||null,
  naturalLength:city.outerRingV184.naturalBoundaryV194?.length||0};
 return game.s;
}
