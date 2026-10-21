// National, additive work-speed improvements. They never create resources,
// enlarge deposits, change recipe inputs, or accelerate construction/science.
const crops=['farm'];
const food=['farm','hunter','fisher','pasture','mill','bakery','watermill','windmill'];
const mines=['quarry','mine','coppermine','tinmine','claypit','gem_mine','oilwell'];
const targetLabels={farm:'viljapõllud',hunter:'jahimehed',fisher:'kalamehed',pasture:'karjamaad',mill:'käsiveskid',bakery:'pagaritöökojad',watermill:'vesiveskid',windmill:'tuuleveskid'};
const rows=[
 ['stone_sickles','Tulekivisirbid',0,'food',['agriculture'],crops],
 ['nets_traps','Püünised ja kalavõrgud',0,'food',['hunting'],['hunter','fisher']],
 ['antler_picks','Sarvkirkad',0,'mining',['stone_tools'],mines],
 ['stone_wedges','Kivikiilud',0,'mining',['stone_tools'],mines],
 ['canal_irrigation','Põldude kanalniisutus',1,'food',['bronze','agriculture'],crops],
 ['manure_fertilization','Sõnnikuga väetamine',1,'food',['bronze','agriculture'],crops],
 ['bronze_chisels','Pronkspeitlid',1,'mining',['bronze'],mines],
 ['ore_baskets','Maagi tõstekorvid',1,'mining',['bronze'],mines],
 ['iron_ploughshare','Rauast adratera',2,'food',['iron','agriculture'],crops],
 ['iron_scythes','Raudvikatid',2,'food',['iron','agriculture'],crops],
 ['iron_pickaxes','Raudkirkad',2,'mining',['iron'],mines],
 ['drainage_adits','Kaevanduse kuivenduskäigud',2,'mining',['iron'],mines],
 ['heavy_plough','Raske hõlmader',3,'food',['civics','agriculture'],crops],
 ['three_field_rotation','Kolmeväljasüsteem',3,'food',['civics','agriculture'],crops],
 ['horse_windlass','Hobujõul kaevandusvints',3,'mining',['civics'],mines],
 ['shaft_timbering','Kaevandusšahtide toestus',3,'mining',['civics'],mines],
 ['water_meadows','Niisutatavad luhaniidud',4,'food',['renaissance'],['farm','pasture']],
 ['seed_selection','Süstemaatiline seemnevalik',4,'food',['renaissance'],crops],
 ['waterwheel_pumps','Vesirattaga kaevanduspumbad',4,'mining',['renaissance'],mines],
 ['powered_hoists','Mehhaniseeritud maagitõstukid',4,'mining',['renaissance'],mines],
 ['mechanical_reaper','Mehaaniline viljalõikaja',5,'food',['industrialization'],crops],
 ['mineral_fertilizers','Mineraalväetised',5,'food',['industrialization'],crops],
 ['pneumatic_drills','Suruõhupuurid',5,'mining',['industrialization'],mines],
 ['dynamite_mining','Dünamiidiga kaevandamine',5,'mining',['industrialization'],mines],
 ['precision_farming','Täppisviljelus ja tilkniisutus',6,'food',['modernity'],crops],
 ['food_automation','Toidutootmise automatiseerimine',6,'food',['modernity'],food],
 ['mechanized_cutters','Mehhaniseeritud kaevanduskombainid',6,'mining',['modernity'],mines],
 ['automated_mining','Kaevandamise andurjuhtimine',6,'mining',['modernity'],mines]
];
export const PRODUCTIVITY_TECHS=Object.fromEntries(rows.map(([id,name,age,category,requires,targets])=>[id,{
 name,age,turns:2,requires,category,targets,workBonus:.25,
 unlocks:`Kogu riigis ${category==='food'?'toidu tootmise':'maavarade kaevandamise'} töökiirus +25 protsendipunkti (${category==='mining'?'kaevandused ja kivimurrud':targets===crops?'põllud':targets.map(type=>targetLabels[type]||type).join(', ')}).`
}]));
export function productivityBonus(state,team,type){
 const known=new Set(state.research?.[team]?.known||[]);
 // Basic stone collection uses the same national tools as a quarry.
 const target=type==='basic_stone'?'quarry':type;
 return 1+Object.entries(PRODUCTIVITY_TECHS).reduce((n,[id,t])=>n+(known.has(id)&&t.targets.includes(target)?t.workBonus:0),0);
}
export function productivityResearchOrder(age){return Object.entries(PRODUCTIVITY_TECHS).filter(([,t])=>t.age<=age).map(([id])=>id);}
