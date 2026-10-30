// Only presentation assets are gated. Simulation/research rules stay available.
import {loadSoldierV241,V148_KINDS} from './soldier-models-v148.js?v=234';
import {detailedAsset} from './stone-near-lod.js?v=224';
import {V118_ERA_IDS} from './tech-tree-data-v118.js?v=118a';
const stone={hall:'peamaja',house:'house',lumber:'lumber',quarry:'quarry',well:'well',farm:'farm',
 hunter:'hunter',fisher:'fisher',barracks:'barracks',archery:'archery',study:'study',
 claypit:'claypit',pottery_kiln:'pottery_kiln',pasture:'pasture',mason:'mason',
 palisade:'palisade',woodgate:'woodgate',watchtower:'watchtower'};
export function desiredAssetsV241(game,{TROOPS,UNIT_TECH,BUILD_TECH,BUILD_AGE}){
 const soldiers=new Set(),buildings=new Set();
 for(let team=0;team<game.s.research.length;team++){
  const research=game.s.research[team],age=game.s.ages[team]||0;
  if(!research)continue;
  const available=new Set([...research.known,...(research.active?[research.active]:[])]);
  const upcomingAge=Math.max(age,V118_ERA_IDS.indexOf(research.active));
  for(const kind of V148_KINDS){
   const def=TROOPS[kind],tech=UNIT_TECH[kind];
   const present=game.s.units.some(u=>u.team===team&&u.kind===kind&&u.hp>0);
   if(def&&def.age<=upcomingAge&&(tech?available.has(tech):present)&&!game.obsoleteUnit(team,kind))soldiers.add(kind);
  }
  // Later buildings are procedural; they have no external model to download.
  // Do not preload obsolete Stone Age buildings from a later-era save.
  if(age===0)for(const [type,name] of Object.entries(stone)){
   const tech=BUILD_TECH[type];
   // Ungated structures (hall, house, well, lumber) stream on first actual use,
   // rather than downloading all four before a player has founded a city.
   if(tech&&(BUILD_AGE[type]||0)===0&&available.has(tech)&&!game.obsoleteBuilding(team,type))buildings.add(name);
  }
 }
 return {soldiers:[...soldiers],buildings:[...buildings]};
}
export function createAssetDemandV241(game,definitions){
 let stamp='',pending=[];
 return {
  update(force=false){
   const next=game.s.research.map((r,t)=>[game.s.ages[t],r.active,...r.known].join(',')).join('|');
   if(!force&&next===stamp)return;stamp=next;
   const desired=desiredAssetsV241(game,definitions);
   pending=[...desired.soldiers.map(loadSoldierV241),...desired.buildings.map(detailedAsset)];
   // Failures retain the existing procedural visuals; no unhandled rejections.
   for(const promise of pending)promise.catch(error=>console.warn('Asset prefetch unavailable',error));
  },
  settled:()=>Promise.allSettled(pending),
  desired:()=>desiredAssetsV241(game,definitions)
 };
}
