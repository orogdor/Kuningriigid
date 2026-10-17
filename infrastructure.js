// V44: physically travelled rail freight and fuel-consuming air freight.
import {roadKey} from './roads.js';
export const railLinkKey=(a,b)=>Math.min(a.id,b.id)+':'+Math.max(a.id,b.id);
export function railRoute(game,from,to){const link=game.s.railLinks?.[railLinkKey(from,to)];if(!link)return null;
 const points=from.id===link.from?link.tiles:link.tiles.slice().reverse();
 if(points.some(p=>!game.canTraverse(from.team,p)))return null;
 return points.slice(1).map(p=>({...p}));
}
export function buildRailNetworks(game){const state=game.s;
 state.railLinks??={};state.railEdges??={};state.railRevision??=0;
 const ports=state.cities.filter(c=>game.cityReady(c,'railstation'));
 for(let i=0;i<ports.length;i++)for(let j=i+1;j<ports.length;j++){
  const a=ports[i],b=ports[j],key=railLinkKey(a,b);if(a.team!==b.team||state.railLinks[key])continue;
  if(!state.research[a.team]?.known.includes('railways'))continue;
  const path=game.landPath(a,b,a.team);if(!path?.length||path.length>45)continue;
  const tiles=[{c:a.c,r:a.r},...path.map(p=>({c:p.c,r:p.r}))];
  const expense={steel:Math.max(5,Math.ceil(path.length*.85)),machines:Math.max(2,Math.ceil(path.length/8))};
  const stock=a.economy.realms[a.team].resources;
  if(Object.entries(expense).some(([k,n])=>(stock[k]||0)<n))continue;
  for(const[k,n]of Object.entries(expense))stock[k]-=n;
  state.railLinks[key]={from:a.id,to:b.id,team:a.team,tiles};
  for(let t=1;t<tiles.length;t++)state.railEdges[roadKey(tiles[t-1],tiles[t])]=a.team;
  state.railRevision++;
 }
}
export function airFreightCost(a,b){return 6+Math.ceil((Math.abs(a.c-b.c)+Math.abs(a.r-b.r))/8)}
export function airRouteAvailable(game,a,b){if(a.team!==b.team||!game.cityReady(a,'airfield')||!game.cityReady(b,'airfield'))return false;
 if(!game.s.research[a.team]?.known.includes('aviation'))return false;
 const stock=a.economy.realms[a.team].resources;return (stock.fuel||0)>=airFreightCost(a,b)+6;
}
export function flightDuration(a,b){return 7+Math.hypot(a.c-b.c,a.r-b.r)*.32}
