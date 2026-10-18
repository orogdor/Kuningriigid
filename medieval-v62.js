// V62: optional medieval expansion. Definitions are data; older V4 saves retain their schema.
export const MEDIEVAL_TECHS={
 armor_craft:{name:'Soomusevalmistamine',age:3,turns:4,requires:['civics','smithing'],unlocks:'Soomustöökoda ja raskerelvastus'},
 crossbows:{name:'Ristvibud',age:3,turns:3,requires:['civics','archery'],unlocks:'Ristvibude harjutusplats ja ristvibumees'},
 guilds:{name:'Käsitöögildid',age:3,turns:4,requires:['civics','woodworking'],unlocks:'Gildimaja ja meistritöökoda; tööstusboonus'},
 watermills:{name:'Vesiveskid',age:3,turns:3,requires:['civics','milling'],unlocks:'Jõe ääres töötav vesiveski'},
 windmills:{name:'Tuuleveskid',age:3,turns:3,requires:['civics','milling'],unlocks:'Tuuleveski jahvatab vilja'},
 medieval_healing:{name:'Haavatute ravimine',age:3,turns:4,requires:['civics','learning'],unlocks:'Ravitsejamaja taastab linnas sõdurite tervist'},
 city_trade:{name:'Linnakaubandus',age:3,turns:3,requires:['civics','commerce'],unlocks:'Kaubahoov ja kõrts; suuremad veosed'},
 monasticism:{name:'Kloostrikultuur',age:3,turns:3,requires:['civics','writing'],unlocks:'Klooster ja kirik suurendavad teadust'},
 knighthood:{name:'Rüütlivägi',age:3,turns:5,requires:['civics','horsemanship','armor_craft'],unlocks:'Rüütel, raske ratsavägi ja hellebardimees'},
 castle_building:{name:'Linnuseehitus',age:3,turns:5,requires:['civics','stone_fortifications','masonry'],unlocks:'Linnus, väravahoone ning garnisoni kaitse'},
 siege_engineering:{name:'Piiramistehnika',age:3,turns:5,requires:['castle_building','woodworking'],unlocks:'Piiramistöökoda, katapult, müürilõhkuja ja piiramistorn'},
 city_fortifications:{name:'Linnade kindlustamine',age:3,turns:5,requires:['castle_building','siege_engineering'],unlocks:'Tugevdatud müür, eraldi purustatavad väravad'}
};
export const MEDIEVAL_BUILDINGS={
 armor_workshop:{name:'Soomustöökoda',icon:'🛡',cost:{plank:40,iron:24,stone:25},requires:['smith'],workers:3,time:92,input:{iron:3,coal:1},out:'weapons',rate:5,cycle:20},
 crossbow_range:{name:'Ristvibude harjutusplats',icon:'⚔',cost:{wood:45,plank:28,stone:16},requires:['archery'],workers:0,time:74},
 guildhall:{name:'Gildimaja',icon:'✥',cost:{plank:65,stone:52,iron:10},requires:['saw'],workers:2,time:110},
 master_workshop:{name:'Meistritöökoda',icon:'⚒',cost:{plank:45,stone:32,iron:12},requires:['guildhall'],workers:3,time:98,input:{wood:4},out:'plank',rate:8,cycle:16},
 watermill:{name:'Vesiveski',icon:'≈',cost:{plank:45,stone:50,iron:8},requires:['mill'],workers:3,time:100,input:{grain:5},out:'flour',rate:11,cycle:16},
 windmill:{name:'Tuuleveski',icon:'◈',cost:{plank:55,stone:42,iron:6},requires:['mill'],workers:3,time:104,input:{grain:5},out:'flour',rate:9,cycle:17},
 infirmary:{name:'Ravitsejamaja',icon:'✚',cost:{plank:35,stone:28,bread:12},requires:['house'],workers:2,time:90},
 trade_yard:{name:'Kaubahoov',icon:'⚖',cost:{plank:50,stone:30,iron:8},requires:['market'],workers:2,time:95},
 inn:{name:'Kõrts',icon:'♧',cost:{plank:38,stone:23,bread:16},requires:['market'],workers:2,time:79},
 monastery:{name:'Klooster',icon:'✠',cost:{stone:80,plank:52,iron:8},requires:['scriptorium'],workers:3,time:115},
 chapel:{name:'Kirik',icon:'✥',cost:{stone:60,plank:40},requires:['scriptorium'],workers:2,time:98},
 keep:{name:'Linnus ja peatorn',icon:'♜',cost:{stone:125,cutstone:65,iron:24},requires:['stonetower'],workers:2,time:185},
 gatehouse:{name:'Väravahoone',icon:'▣',cost:{stone:88,cutstone:34,plank:18},requires:['stonewall'],workers:1,time:130},
 siegeworkshop:{name:'Piiramistöökoda',icon:'⚒',cost:{wood:60,plank:70,iron:25},requires:['barracks','saw'],workers:2,time:140},
 reinforced_wall:{name:'Tugevdatud linnamüür',icon:'▤',cost:{stone:74,cutstone:44,iron:12},requires:['stonewall'],workers:0,time:105}
};
export const MEDIEVAL_BUILD_TECH={
 armor_workshop:'armor_craft',crossbow_range:'crossbows',guildhall:'guilds',master_workshop:'guilds',watermill:'watermills',windmill:'windmills',infirmary:'medieval_healing',trade_yard:'city_trade',inn:'city_trade',monastery:'monasticism',chapel:'monasticism',keep:'castle_building',gatehouse:'castle_building',siegeworkshop:'siege_engineering',reinforced_wall:'city_fortifications'
};
export const MEDIEVAL_UNITS={
 crossbowman:{name:'Ristvibumees',age:3,cost:{weapons:4,plank:6,bread:10},requires:['crossbow_range'],hp:140,dmg:22,range:17,speed:2.65,time:63},
 halberdier:{name:'Hellebardimees',age:3,cost:{weapons:5,iron:8,bread:12},requires:['barracks','armor_workshop'],hp:200,dmg:25,range:4,speed:2.5,time:69},
 knight:{name:'Rüütel',age:3,cost:{weapons:8,iron:16,bread:20},requires:['stable','armor_workshop'],hp:290,dmg:35,range:3.4,speed:4.3,time:93},
 heavy_cavalry:{name:'Raskeratsavägi',age:3,cost:{weapons:10,iron:21,bread:22},requires:['stable','armor_workshop'],hp:330,dmg:39,range:3.5,speed:3.9,time:110},
 man_at_arms:{name:'Soomustatud jalaväelane',age:3,cost:{weapons:6,iron:12,bread:14},requires:['armor_workshop','barracks'],hp:250,dmg:29,range:3,speed:2.5,time:79},
 catapult:{name:'Katapult',age:3,cost:{plank:65,iron:12,stone:30},requires:['siegeworkshop'],hp:230,dmg:38,range:27,speed:1.5,time:118,siege:3.4},
 battering_ram:{name:'Müürilõhkuja',age:3,cost:{plank:45,iron:20},requires:['siegeworkshop'],hp:360,dmg:14,range:3.9,speed:1.6,time:94,siege:5.5},
 siege_tower:{name:'Piiramistorn',age:3,cost:{plank:75,iron:16},requires:['siegeworkshop'],hp:300,dmg:9,range:4,speed:1.35,time:115,siege:3.3}
};
export const MEDIEVAL_UNIT_TECH={crossbowman:'crossbows',halberdier:'knighthood',knight:'knighthood',heavy_cavalry:'knighthood',man_at_arms:'armor_craft',catapult:'siege_engineering',battering_ram:'siege_engineering',siege_tower:'siege_engineering'};
export const SIEGE_KINDS=new Set(['catapult','battering_ram','siege_tower']);
export const isSiegeUnit=kind=>SIEGE_KINDS.has(kind);
export function hasReady(city,type){return city?.economy?.buildings?.some(b=>b.type===type&&b.ready&&b.hp>0&&!b.disabled)}
export const siegeSection=(building,index)=>({
 index,type:building.type,x:building.x,z:building.z,hp:Math.max(1,building.hp||350),maxHp:Math.max(1,building.hp||350),breached:false
});
export function attachSiegeSections(city,battle){
 if(!battle.fortress)return;
 battle.siegeSections=(city.economy.buildings||[]).flatMap((b,i)=>b.ready&&b.hp>0&&!b.disabled&&['palisade','stonewall','reinforced_wall','gatehouse'].includes(b.type)?[siegeSection(b,i)]:[]);
 battle.siegeProtected=battle.siegeSections.length>0;
 battle.keepProtected=hasReady(city,'keep');
 battle.fortress.keepBonus=battle.keepProtected?180:0;
 battle.fortress.hp+=battle.fortress.keepBonus;
 battle.fortress.maxHp+=battle.fortress.keepBonus;
}
export function siegeDamage(attacker,section,damage){
 const mode=isSiegeUnit(attacker.kind);
 const multiplier=mode?({catapult:2.9,battering_ram:3.4,siege_tower:1.6}[attacker.kind]||1):.16;
 const armor=section.type==='reinforced_wall'?.72:section.type==='gatehouse'?.86:1;
 const dealt=Math.max(.5,damage*multiplier*armor);
 section.hp=Math.max(0,section.hp-dealt);
 if(section.hp===0)section.breached=true;
 return dealt;
}
export function persistSiegeDamage(city,battle){
 if(!city||!battle?.siegeSections)return;
 for(const sec of battle.siegeSections){const b=city.economy.buildings[sec.index];if(!b||b.type!==sec.type)continue;b.hp=Math.max(0,Math.min(b.hp,sec.hp));if(b.hp<=0)b.disabled=true}
}
export function medievalBonus(game,city,b){
 // Only ready, active workplaces provide bonuses; districts are shared with the parent.
 const parent=game.parentCity(city);
 const all=game.allBuildings(parent);
 const ready=t=>all.some(x=>x.type===t&&x.ready&&x.hp>0&&!x.disabled&&(x.assigned||0)>=.5);
 if(ready('guildhall')&&b.type!=='guildhall'&&!['hall','keep','gatehouse'].includes(b.type))return 1.13;
 return 1;
}
export function healMedievalArmies(game,city,dt){
 if(game.s.battle&&!game.s.battle.result)return;
 if(!hasReady(city,'infirmary'))return;
 const workers=city.economy.buildings.filter(b=>b.type==='infirmary'&&b.ready&&b.hp>0&&!b.disabled).reduce((n,b)=>n+Math.min(1,b.assigned||0),0);
 if(workers<.1)return;
 const armies=game.s.armies.filter(a=>a.team===city.team&&a.c===city.c&&a.r===city.r&&a.embarked==null);
 const stock=city.economy.realms[city.team].resources;
 for(const u of game.s.units){
  if(u.team!==city.team||u.hp<=0||u.garrison||!armies.some(a=>(a.id||0)===(u.armyId||0)))continue;
  const stats=game.troopDefinitions?.[u.kind];if(!stats||u.hp>=stats.hp||stock.bread<1)continue;
  const gained=Math.min(stats.hp-u.hp,dt*.25*workers);
  u.hp+=gained;u.medievalHealSupply=(u.medievalHealSupply||0)+gained;
  if(u.medievalHealSupply>=12){const meals=Math.min(Math.floor(u.medievalHealSupply/12),Math.floor(stock.bread||0));stock.bread-=meals;u.medievalHealSupply-=12*meals;}
 }
}
