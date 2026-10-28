// V205: immediately playable prepared takeover states, starting at a city
// with a completed second defensive curtain. These are QA fixtures: the
// previous AI gameplay simulation did not organically reach this point.
import {loadOrganicWallV190} from './wall-demo-v184.js?v=204';
export async function loadSecondWallTakeoverV205(demo,fetcher=fetch){
 if(!['takeover-v205-coast','takeover-v205-mountain'].includes(demo))
  throw Error('Unknown completed second-wall takeover');
 const kind=demo.endsWith('coast')?'coast':'mountain';
 const state=await loadOrganicWallV190('wall-v190-'+kind,fetcher);
 const city=state.cities.find(c=>c.id===state.wallTestV190?.targetCityId);
 const plan=city?.outerRingV184;
 if(!city||city.team!==0||!plan?.slots?.length||plan.nextIndex!==plan.slots.length||
    city.outerRingDiagnosticV184?.reason!=='complete')
  throw Error('The second defensive wall is not complete');
 // The source demo construction is already performed by the real V204 wall
 // placement/build methods. Confirm that all segments exist as ready buildings.
 const built=[...(city.economy?.buildings||[]),...Object.values(city.districts||{})
  .flatMap(d=>d.economy?.buildings||[])].filter(b=>b.outerRingV184&&b.hp>0);
 if(built.length!==plan.slots.length||built.some(b=>!b.ready))
  throw Error('The complete second wall is missing physical sections');
 state.demo=demo;
 state.wallTakeoverV205={
  targetCityId:city.id,kind,ready:true,secondWallSections:built.length,
  suburbArea:Math.round(plan.areaEstimateV186||0),
  naturalBoundary:plan.naturalBoundaryV194?.kind||null,
  preparedTestState:true
 };
 return state;
}
