export const UNIT_GRADES=Object.freeze({
 mobilized:{name:'Mobiliseeritud',cost:.5,strength:.4},
 standard:{name:'Standard',cost:1,strength:1},
 elite:{name:'Eliit',cost:1.3,strength:1.4}
});
export const troopCost=(definition,grade='standard')=>Object.fromEntries(Object.entries(definition.cost||{}).map(([k,v])=>[k,+(v*(UNIT_GRADES[grade]?.cost??1)).toFixed(6)]));
const unit=(name,age,tech,visual,role,cost,requires,hp,dmg,range,speed,time=55)=>({name,age,tech,visual,role,cost,requires,hp,dmg,range,speed,time});
export const ERA_UNITS={
 bronze_cavalry:unit('Pronksiaja ratsavägi',1,'bronze','cavalry','cavalry',{bronze:6,bread:16,wood:16},['barracks','pasture'],200,20,3,4.4,65),
 bronze_catapult:unit('Pronksiaja katapult',1,'wheel','catapult','siege',{plank:45,bronze:4,stone:15},['barracks','cartwright'],180,4,30,1.3,100),
 bronze_spearman:unit('Pronksodamees',1,'bronze','spearman','melee',{wood:18,bronze:3,bread:6},['barracks'],150,14,3.3,2.8,38),
 bronze_axeman:unit('Pronkskirvemees',1,'bronze','axeman','melee',{wood:12,bronze:4,bread:6},['barracks'],155,17,2.6,2.7,40),
 bronze_archer:unit('Pronksiaja vibukütt',1,'bronze','archer','ranged',{wood:22,bronze:2,bread:6},['archery'],115,16,15,2.9,38),
 chariot:unit('Sõjavanker',1,'wheel','cavalry','cavalry',{carts:1,bronze:6,bread:12},['barracks','cartwright'],235,23,3.6,4.7,64),
 iron_archer:unit('Rauaaja vibukütt',2,'iron','archer','ranged',{wood:24,iron:5,bread:8},['archery'],140,21,17,3,47),
 javelinman:unit('Heiteodamees',2,'iron','spearman','ranged',{wood:18,iron:6,bread:8},['barracks'],155,24,10,3.4,46),
 pikeman:unit('Piigimees',4,'renaissance','halberdier','melee',{plank:10,iron:12,bread:10},['barracks'],230,30,5,2.6,57),
 arquebusier:unit('Arkebuusimees',4,'gunpowder','musketeer','ranged',{gunpowder:6,iron:8,bread:9},['barracks','powdermill'],150,24,14,2.8,60),
 cuirassier:unit('Kürassiir',4,'gunpowder','cavalry','cavalry',{weapons:7,iron:20,bread:16},['stable','powdermill'],330,35,12,4.8,80),
 field_cannon:unit('Välisuurtükk',4,'gunpowder','musketeer','siege',{plank:30,iron:28,gunpowder:18,bread:10},['siegeworkshop','powdermill'],260,52,24,1.8,100),
 line_infantry:unit('Rivijalavägi',5,'industrialization','rifleman','ranged',{gunpowder:8,steel:5,bread:10},['barracks','steelworks'],230,34,18,2.9,65),
 dragoon:unit('Ratsalaskur',5,'rifles','cavalry','cavalry',{gunpowder:10,steel:9,bread:18},['stable','steelworks'],285,40,19,4.8,85),
 industrial_artillery:unit('Vintraudne suurtükk',5,'rifles','rifleman','siege',{steel:25,machines:3,gunpowder:20,bread:12},['engineworks','powdermill'],320,70,31,2,112),
 modern_infantry:unit('Moodne jalavägi',6,'modernity','rifleman','ranged',{steel:8,weapons:5,bread:12},['barracks','steelworks'],280,46,24,3.5,72),
 machinegun_team:unit('Kuulipildujameeskond',6,'modernity','rifleman','ranged',{steel:12,machines:2,gunpowder:12,bread:12},['barracks','engineworks'],310,58,27,2.5,88),
 tank:unit('Tank',6,'combustion','motorized','vehicle',{steel:35,machines:8,vehicles:2,fuel:18},['autofactory'],570,84,25,4.5,130),
 rocket_team:unit('Tankitõrjerühm',6,'modernity','rifleman','ranged',{steel:12,weapons:8,gunpowder:14,bread:12},['barracks','powdermill'],250,78,23,3,92)
};
export const visualKind=kind=>ERA_UNITS[kind]?.visual||kind;
export const troopRole=kind=>ERA_UNITS[kind]?.role||(['archer','slinger','crossbowman','musketeer','rifleman','motorized'].includes(kind)?'ranged':['cavalry','knight','heavy_cavalry'].includes(kind)?'cavalry':['catapult','battering_ram','siege_tower'].includes(kind)?'siege':'melee');
export const rangedTroop=kind=>['ranged','siege'].includes(troopRole(kind));
export function installEraUnits(troops,tech){for(const[id,d]of Object.entries(ERA_UNITS)){troops[id]={...d};tech[id]=d.tech;}}
