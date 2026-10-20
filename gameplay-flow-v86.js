// Recovery keeps larger towns productive without removing a shortage penalty.
export function availableLabor(pop,shortage=false,mobilized=0){
 const population=Math.max(0,Number(pop)||0);
 return Math.max(0,(shortage?Math.min(population,Math.max(3,population*.75)):population)-mobilized);
}
export function automaticUIRefreshDue(now,last,changed,editing=false){
 return !editing&&now-last>=(changed?250:800);
}
