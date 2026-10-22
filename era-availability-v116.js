// Replacement is national and technology-based, never dependent on local stock/buildings.
export const UNIT_SUCCESSORS={
 slinger:['bronze_archer'],spearman:['bronze_spearman'],axeman:['bronze_axeman'],archer:['bronze_archer'],
 bronze_spearman:['infantry'],bronze_axeman:['infantry'],bronze_archer:['iron_archer'],
 bronze_cavalry:['cavalry'],chariot:['cavalry'],infantry:['man_at_arms'],cavalry:['knight','heavy_cavalry'],
 iron_archer:['crossbowman'],javelinman:['crossbowman'],crossbowman:['arquebusier','musketeer'],
 man_at_arms:['pikeman'],halberdier:['pikeman'],knight:['cuirassier'],heavy_cavalry:['cuirassier'],
 arquebusier:['line_infantry','rifleman'],musketeer:['line_infantry','rifleman'],pikeman:['line_infantry'],
 cuirassier:['dragoon'],line_infantry:['modern_infantry'],rifleman:['modern_infantry'],dragoon:['motorized'],
 bronze_catapult:['catapult'],catapult:['field_cannon'],field_cannon:['industrial_artillery'],battering_ram:['field_cannon'],siege_tower:['field_cannon']
};
// Only genuine functional replacements. Sawmills do not replace woodcutters,
// farms do not replace hunters, and the three requested wall tiers remain distinct.
// An outdated model becomes unbuildable only after a valid successor is researched.\n// Resource specialists (hunters, foresters, mills, quarries) are not interchangeable and remain available.\nexport const BUILDING_SUCCESSORS={study:['scriptorium'],scriptorium:['academy'],academy:['university'],university:['polytechnic'],polytechnic:['laboratory'],watchtower:['stonetower'],archery:['crossbow_range'],palisade:['stonewall']};
function successor(graph,id,unlocked){const seen=new Set([id]),queue=[...(graph[id]||[])];let found=null;while(queue.length){const next=queue.shift();if(seen.has(next))continue;seen.add(next);if(unlocked(next))found=next;queue.push(...(graph[next]||[]));}return found;}
export const unitSuccessor=(state,team,id,troops,tech)=>successor(UNIT_SUCCESSORS,id,k=>troops[k]&&(troops[k].age??0)<=(state.ages[team]||0)&&(!tech[k]||state.research[team].known.includes(tech[k])));
export const buildingSuccessor=(state,team,id,ages,tech)=>successor(BUILDING_SUCCESSORS,id,k=>(ages[k]??99)<=(state.ages[team]||0)&&(!tech[k]||state.research[team].known.includes(tech[k])));
export function suppliesBuilding(candidate,required){if(candidate===required)return true;return !!successor(BUILDING_SUCCESSORS,required,k=>k===candidate);}
export const ballistaUnlocked=(state,team)=>(state?.ages?.[team]??0)>=2&&!!state?.research?.[team]?.known?.includes('ancient_artillery');
export const CRAFT_AGES={ladder:0,camp:1,sap:1,ram:2,tower:2};
export function craftError(state,team,kind){const age=state?.ages?.[team]??0;if(age<(CRAFT_AGES[kind]??0))return 'See piiramisvahend avaneb rauaajal.';if(['tower','ram'].includes(kind)&&!state?.research?.[team]?.known?.includes('early_siege_engineering'))return 'Uuri: Varane piiramistehnika';return '';}
