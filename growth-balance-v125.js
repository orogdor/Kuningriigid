// V125: transparent, stable expansion and research-paced growth policy.
export const MAX_AI_CITIES=12;
export function cityCapacity(time,age){
 // Towns grow in waves; six by the middle of the Bronze/Iron eras and
 // ten-plus by the Renaissance/Industrial transition.
 return Math.min(MAX_AI_CITIES,Math.max(2,2+Math.floor(Math.max(0,time)/ (26*60))));
}
export function settlerPolicy({time,age,cities,pending,pop,food,lastAt,hasSettlement}){
 const capacity=cityCapacity(time,age);
 const interval=age<=1?6*60:age<=3?7*60:10*60;
 return {capacity,allow:hasSettlement&&cities+pending<capacity&&pending<2&&
  time>=10*60&&time-(lastAt||0)>=interval&&pop>=7&&food>=Math.max(25,pop*2.2),
  interval};
}
export function armyCapacity(ownCities,age,atWar=false){
 // Maintain several defensive units per city while limiting expensive armies
 // in peaceful early economies.
 return Math.min(44,Math.max(6,3+ownCities*2+age*2+(atWar?7:0)));
}
export function knowledgeCostFactor(age){
 return [2.2,2.8,3.3,3.9,4.4,5.0,5.6][Math.max(0,Math.min(6,age||0))];
}
export function knowledgeCityMultiplier(n){
 // More cities are useful, but cannot double a civilization's research rate
 // simply by establishing many unstaffed towns.
 if(n<=1)return 1;
 return Math.min(1.8,1+.12*Math.sqrt(n-1));
}
