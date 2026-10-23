// V137: the first working market rewards each genuinely stocked food category.
// The existing food-variety economy groups grain/flour/bread as one cereal group.
import {GOODS} from './city-needs-v87.js';
export const MARKET_FOOD_GROWTH_PER_TYPE=.05;
export function marketFoodGrowth(buildings,stock,pop,age=0){
 const market=(buildings||[]).some(b=>b.type==='market'&&b.ready&&b.hp>0&&!b.disabled&&!b.virtual);
 if(!market)return {varieties:[],multiplier:1,bonus:0};
 const limit=Math.max(.5,(pop||3)*.1),varieties=[];
 if((stock.bread||0)+(stock.grain||0)+(stock.flour||0)>=limit)varieties.push('cereal');
 for(const [kind,d] of Object.entries(GOODS))if(d.food&&d.age<=age&&(stock[kind]||0)>=limit)varieties.push(kind);
 const bonus=MARKET_FOOD_GROWTH_PER_TYPE*varieties.length;
 return {varieties,multiplier:1+bonus,bonus};
}
