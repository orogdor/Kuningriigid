// Serializable economy rules shared by simulation, trade planner and HUD.
export const GOODS={
 meat:{name:'Liha',age:0,food:true},fish:{name:'Kala',age:0,food:true},berries:{name:'Marjad',age:0,food:true},
 vegetables:{name:'Köögiviljad',age:1,food:true},fruit:{name:'Puuviljad',age:2,food:true},cheese:{name:'Juust',age:3,food:true},
 spices:{name:'Vürtsid',age:4,food:true},coffee:{name:'Kohv',age:5,food:true},
 flax:{name:'Lina',age:1},gems:{name:'Vääriskivid',age:2},silk:{name:'Siid',age:3},dyes:{name:'Värvitaimed',age:4},cocoa:{name:'Kakao',age:5},rubber:{name:'Kautšuk',age:6},
 cloth:{name:'Linane kangas',age:1,luxury:true},jewelry:{name:'Ehted',age:2,luxury:true},silkcloth:{name:'Siidkangas',age:3,luxury:true},
 perfume:{name:'Parfüüm',age:4,luxury:true},chocolate:{name:'Šokolaad',age:5,luxury:true},electronics:{name:'Elektroonika',age:6,luxury:true}
};
export const FOOD_VARIETIES=['cereal',...Object.keys(GOODS).filter(k=>GOODS[k].food)];
export const LUXURIES=['pottery',...Object.keys(GOODS).filter(k=>GOODS[k].luxury)];
export const NEEDS=[{food:2,luxury:0},{food:3,luxury:1},{food:4,luxury:2},{food:5,luxury:3},{food:6,luxury:4},{food:7,luxury:5},{food:8,luxury:6}];
export const foodTotal=r=>['bread','flour','grain',...Object.keys(GOODS).filter(k=>GOODS[k].food)].reduce((n,k)=>n+Math.max(0,r[k]||0),0);
export function cityNeeds(city,age=0){
 const r=city.economy.realms[city.team],stock=r.resources,threshold=Math.max(.5,(r.pop||3)*.1),need=NEEDS[Math.min(6,Math.max(0,age))];
 const foods=FOOD_VARIETIES.filter(k=>k==='cereal'?(stock.bread||0)+(stock.flour||0)+(stock.grain||0)>=threshold:(GOODS[k].age<=age&&(stock[k]||0)>=threshold));
 const luxuries=LUXURIES.filter(k=>(k==='pottery'||GOODS[k].age<=age)&&(stock[k]||0)>=threshold);
 const missing=Math.max(0,need.food-foods.length)+Math.max(0,need.luxury-luxuries.length);
 const extra=Math.max(0,foods.length-need.food)+Math.max(0,luxuries.length-need.luxury);
 return {need,foods,luxuries,threshold,missing,extra,productivity:1-.05*missing+.02*extra};
}
export function nationalStock(s,team){const total={};for(const city of s.cities.filter(c=>c.team===team&&c.districtOf==null))for(const[k,v]of Object.entries(city.economy.realms[team].resources))total[k]=(total[k]||0)+v;return total;}
export const GOOD_BUILDINGS={
 vegetable_garden:{name:'Köögiviljaaed',out:'vegetables',deposit:'grain',age:1},orchard:{name:'Viljapuuaed',out:'fruit',deposit:'fruit',age:2},dairy:{name:'Juustukoda',out:'cheese',input:{grain:2,water:1},age:3},
 spice_garden:{name:'Vürtsiaed',out:'spices',deposit:'spices',age:4},coffee_farm:{name:'Kohviistandus',out:'coffee',deposit:'coffee',age:5},
 flax_farm:{name:'Linapõld',out:'flax',deposit:'flax',age:1},gem_mine:{name:'Vääriskivikaevandus',out:'gems',deposit:'gems',age:2},silk_farm:{name:'Siidikasvandus',out:'silk',deposit:'silk',age:3},dye_garden:{name:'Värvitaimeaed',out:'dyes',deposit:'dyes',age:4},cocoa_farm:{name:'Kakaoistandus',out:'cocoa',deposit:'cocoa',age:5},rubber_farm:{name:'Kautšukiistandus',out:'rubber',deposit:'rubber',age:6},
 weaver:{name:'Kangakoda',out:'cloth',input:{flax:2},age:1},jeweler:{name:'Juveliir',out:'jewelry',input:{gems:1,copper:1},age:2},silk_weaver:{name:'Siidikudumiskoda',out:'silkcloth',input:{silk:2},age:3},perfumery:{name:'Parfüümikoda',out:'perfume',input:{dyes:1,spices:1,water:1},age:4},chocolatier:{name:'Šokolaadivabrik',out:'chocolate',input:{cocoa:2,water:1},age:5},electronics_factory:{name:'Elektroonikatehas',out:'electronics',input:{copper:1,rubber:1,power:1},age:6}
};
export function installGoods(BUILDINGS,NAMES,START,MATERIALS){
 for(const[k,d]of Object.entries(GOODS)){NAMES[k]=d.name;START[k]??=0;if(!d.food)MATERIALS.add(k);}
 for(const[k,d]of Object.entries(GOOD_BUILDINGS))BUILDINGS[k]={icon:d.deposit?'♧':'⚒',cost:{wood:20+d.age*4,stone:8+d.age*3},requires:['hall'],workers:1,time:18+d.age*3,rate:d.input?3:6,cycle:10,...d};
}
export function seedGoods(cells){const deposits=[...new Set(Object.values(GOOD_BUILDINGS).map(d=>d.deposit).filter(d=>d&&d!=='grain'))];
 // Regular regional patterns guarantee every resource on a sufficiently sized landmass;
 // existing map terrain, structures and stored resources are never replaced.
 let i=0;for(const cell of cells){if(!cell.land||cell.mountain)continue;cell.deposits[deposits[i++%deposits.length]]=true;}
}

export function consumeLuxuries(city,age,dt){const r=city.economy.realms[city.team];for(const k of LUXURIES){if(k!=='pottery'&&GOODS[k].age>age)continue;r.resources[k]=Math.max(0,(r.resources[k]||0)-r.pop*.02*dt/60);}}
