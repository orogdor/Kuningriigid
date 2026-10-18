// V55: seeded points of interest, one-time exploration rewards, and BFS frontier navigation.
import {COLS,ROWS} from './campaign.js';
const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
export const LANDMARK_NAMES={village:'Sõbralik küla',ruins:'Muistsed varemed'};
const hash=(a,b,seed)=>{let x=Math.imul((a+143)*374761393,(b+197)*668265263)^Math.imul(seed|0,2246822519);x=Math.imul(x^(x>>>13),1274126177);return ((x^(x>>>16))>>>0)/4294967296};
export function createLandmarks(cells,seed,starts){
 const candidates=cells.filter(c=>c.land&&!c.mountain&&!c.river&&c.h>4&&c.h<30&&!starts.some(p=>Math.hypot(c.c-p.c,c.r-p.r)<5));
 candidates.sort((a,b)=>hash(a.c,a.r,seed)-hash(b.c,b.r,seed));
 const result=[];const counts={village:0,ruins:0};
 for(const c of candidates){const kind=(counts.village<19&&(!c.coast||counts.ruins>=24))?'village':'ruins';if(counts[kind]>=(kind==='village'?19:24))continue;
  if(result.some(p=>Math.hypot(p.c-c.c,p.r-c.r)<10))continue;
  const number=++counts[kind];result.push({id:kind+'-'+number,kind,c:c.c,r:c.r,claimedBy:null,reward:kind==='village'?(number%3===0?{gold:30,bread:12}:{wood:22,bread:25}):(number%3===0?{gold:55,stone:15}:{science:35})});
  if(counts.village>=19&&counts.ruins>=24)break;
 }
 return result;
}
// BFS scans one connected region once; picks first path to unexplored territory.
export function findExplorationPath(game,army){
 if(!army||!game.canTraverse(army.team,army))return null;
 const w=COLS,h=ROWS,seen=game.s.explored[army.team]||{},total=w*h;
 const sites=(game.s.landmarks||[]).filter(l=>l.claimedBy==null&&seen[l.c+':'+l.r]&&Math.abs(army.c-l.c)+Math.abs(army.r-l.r)<=16).sort((a,b)=>Math.abs(army.c-a.c)+Math.abs(army.r-a.r)-Math.abs(army.c-b.c)-Math.abs(army.r-b.r));
 for(const site of sites){const route=game.landPath(army,site,army.team);if(route?.length)return route;}
 const queue=new Int32Array(total),prev=new Int32Array(total).fill(-2),start=army.r*w+army.c;let head=0,tail=1;queue[0]=start;prev[start]=-1;
 const reachableFrontier=(c,r)=>{for(let y=Math.max(0,r-2);y<=Math.min(h-1,r+2);y++)for(let x=Math.max(0,c-2);x<=Math.min(w-1,c+2);x++)if(!seen[x+':'+y])return true;return false};
 while(head<tail){const i=queue[head++],c=i%w,r=Math.floor(i/w);
  // Start is explored already; avoid a zero-distance search loop.
  if(i!==start&&reachableFrontier(c,r)){
   const result=[];let j=i;while(j!==start){result.push({c:j%w,r:Math.floor(j/w)});j=prev[j]}return result.reverse();
  }
  for(const [dc,dr] of dirs){const x=c+dc,y=r+dr;if(x<0||y<0||x>=w||y>=h)continue;const j=y*w+x;if(prev[j]!==-2||!game.canTraverse(army.team,{c:x,r:y}))continue;prev[j]=i;queue[tail++]=j}
 }
 return null;
}
export function collectLandmark(game,team,pos){
 const landmark=game.s.landmarks?.find(l=>l.claimedBy==null&&l.c===pos.c&&l.r===pos.r);if(!landmark)return null;
 landmark.claimedBy=team;landmark.claimedAt=game.s.time;
 const earned=[];
 for(const [kind,amount] of Object.entries(landmark.reward)){
  if(kind==='science'){
   const research=game.s.research[team];if(research.active)research.progress[research.active]=(research.progress[research.active]||0)+amount;
   else research.discoveryInsight=(research.discoveryInsight||0)+amount;
   earned.push('+'+amount+' teadust');continue;
  }
  const city=game.s.cities.filter(c=>c.team===team).sort((a,b)=>Math.abs(a.c-pos.c)+Math.abs(a.r-pos.r)-Math.abs(b.c-pos.c)-Math.abs(b.r-pos.r))[0];
  const settler=game.s.settlers.find(a=>a.team===team);
  if(city){const stock=city.economy.realms[team].resources;stock[kind]=(stock[kind]||0)+amount}
  else if(settler){settler.cargo??={};settler.cargo[kind]=(settler.cargo[kind]||0)+amount}
  else {const bank=(game.s.discoveryBank??={})[team]??={};bank[kind]=(bank[kind]||0)+amount;}
  earned.push('+'+amount+' '+({bread:'toitu',wood:'puitu',stone:'kivi',gold:'kulda'}[kind]||kind));
 }
 const name=LANDMARK_NAMES[landmark.kind];const text=name+' avastatud! '+earned.join(', ')+'.';
 if(team===0){game.s.events??=[];game.s.events.push({time:game.s.time,text});if(game.s.events.length>40)game.s.events.shift()}
 game.uiRevision++;return {landmark,text};
}
