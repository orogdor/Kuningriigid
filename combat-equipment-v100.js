import {BOW_UNITS} from './unit-balance-v99.js';
export const carriesSword=u=>BOW_UNITS.has(u.kind);
export const stoneThrower=u=>['bronze_catapult','catapult'].includes(u.kind);
export const ammunitionLoad=u=>carriesSword(u)?u.kind==='chariot'?48:40:['slinger','javelinman'].includes(u.kind)?20:stoneThrower(u)?12:u.kind==='cuirassier'?8:u.kind==='dragoon'?24:60;
export function prepareAmmunition(m,u){
 if(carriesSword(u)&&m.arrowLoadVersion!==100){if(m.ammo!=null)m.ammo*=2;m.arrowLoadVersion=100;}
 m.ammo??=ammunitionLoad(u);
}

export function migrateBattleAmmunition(battle){for(const u of battle?.squads||[])if(carriesSword(u))for(const m of u.men||[])prepareAmmunition(m,u);}
