// Population and infrastructure, never troops, determine Bronze town development.
export const MIN_BRONZE_TURNS_V160=95;
export const BRONZE_FORTIFY_POP_V160=18;
export const BRONZE_FULL_WALL_POP_V160=25;
export function bronzePhaseTurns(state,team){
 if(state.ages?.[team]!==1)return 0;
 state.ageStartedAtV160??={};
 if(state.ageStartedAtV160[team]==null){
  const recorded=state.research?.[team]?.completed?.find(d=>d.id==='bronze')?.time;
  state.ageStartedAtV160[team]=Number.isFinite(recorded)?recorded:(state.time||0);
 }
 return Math.max(0,((state.time||0)-state.ageStartedAtV160[team])/60);
}
export function bronzeResearchGoals(state,team,techs,goals){
 if(state.ages?.[team]!==1||bronzePhaseTurns(state,team)>=MIN_BRONZE_TURNS_V160)return goals;
 // Keep science moving on Bronze research branches; defer only Iron-era goals.
 return goals.filter(id=>(techs[id]?.age??99)<=1);
}
export function prosperousTownGrowth({age,pop,stock={},marketVarieties=0,housingFree=0}){
 if(age!==1&&age!==2)return 1;
 const food=(stock.bread||0)+(stock.flour||0)*.85+(stock.grain||0)*.7+
  (stock.meat||0)+(stock.fish||0)+(stock.berries||0)+(stock.vegetables||0)+(stock.fruit||0)+(stock.cheese||0);
 if(food<pop*1.6||(stock.water||0)<pop*1.1||housingFree<1)return 1;
 return Math.min(2.5,(age===1?2.05:1.4)+(marketVarieties>=2?.30:0)+(food>=pop*3?.12:0));
}
