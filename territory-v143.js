import {countyTileLimit,countySearchRadius,countyFootprint,urbanTile} from './counties-v126.js';
const key=p=>p.c+':'+p.r,adj=[[1,0],[-1,0],[0,1],[0,-1]],dist=(a,b)=>(a.c-b.c)**2+(a.r-b.r)**2;
class Frontier{
 constructor(){this.a=[];this.seen=new Set();}
 push(p,score){const k=key(p);if(this.seen.has(k))return;this.seen.add(k);const a=this.a,v={p,score};let i=a.length;a.push(v);while(i){const j=(i-1)>>1;if(a[j].score<=score)break;a[i]=a[j];i=j;}a[i]=v;}
 pop(){const a=this.a,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let j=i*2+1;if(j+1<a.length&&a[j+1].score<a[j].score)j++;if(a[j].score>=last.score)break;a[i]=a[j];i=j;}a[i]=last;}return first?.p;}
}
// Larger cities get first choice of empty domestic peripheral land. Existing
// buildings and city centers remain attached to their city; no silent conquest.
export function allocateTerritory(cities,cellAt,radiusOf){
 cities=[...cities].sort((a,b)=>a.id-b.id);
 const territory=new Map(),urban=new Map(cities.map(c=>[c.id,new Set()])),reserved=new Map(),baseline=new Map(),counts=new Map(cities.map(c=>[c.id,0]));
 const claim=(city,p)=>{const k=key(p);if(!territory.has(k)){territory.set(k,city);counts.set(city.id,counts.get(city.id)+1);}};
 for(const c of cities){reserved.set(key(c),c);for(const [k,d]of Object.entries(c.districts||{}))if(d.economy?.buildings?.some(b=>!b.virtual&&b.hp>0))reserved.set(k,c);
  for(const p of countyFootprint(c,radiusOf(c),cellAt)){const k=key(p),old=baseline.get(k);if(!old||dist(c,p)<dist(old,p)||dist(c,p)===dist(old,p)&&c.id<old.id)baseline.set(k,c);}
 }
 for(const [k,c]of reserved){const [x,z]=k.split(':').map(Number);claim(c,{c:x,r:z});}
 const order=[...cities].sort((a,b)=>(b.economy.realms[b.team].pop-a.economy.realms[a.team].pop)||a.id-b.id);
 const allowed=(city,p)=>{const k=key(p),fixed=reserved.get(k),owner=territory.get(k),national=baseline.get(k);return (!fixed||fixed.id===city.id)&&(!owner||owner.id===city.id)&&(!national||national.team===city.team);};
 function fill(city,target,isUrban){
  let minC=city.c,maxC=city.c,minR=city.r,maxR=city.r;
  const radius=radiusOf(city),set=urban.get(city.id),front=new Frontier(),span=countySearchRadius(radius)+Math.ceil(radius/2)+2;
  const enqueue=p=>{if(isUrban&&Math.max(Math.abs(p.c-city.c),Math.abs(p.r-city.r))>11||!isUrban&&Math.max(Math.abs(p.c-city.c),Math.abs(p.r-city.r))>span)return;front.push(p,(isUrban&&!urbanTile(city,p,radius)?10000:0)+dist(city,p)+(p.r-city.r)*.0001+(p.c-city.c)*.00001);};
  enqueue(city);if(!isUrban)for(const [k,owner]of territory)if(owner.id===city.id){const [c,r]=k.split(':').map(Number);enqueue({c,r});}
  while(front.a.length&&(isUrban?set.size<target:counts.get(city.id)<target)){
   const p=front.pop(),cell=cellAt(p);if(!cell||isUrban&&cell.mountain||!allowed(city,p))continue;
   if(isUrban&&(Math.max(maxC,p.c)-Math.min(minC,p.c)>=12||Math.max(maxR,p.r)-Math.min(minR,p.r)>=12))continue;
   if(!cell.land){if(!isUrban&&adj.some(([dc,dr])=>{const q={c:p.c+dc,r:p.r+dr};return territory.get(key(q))?.id===city.id&&cellAt(q)?.land;}))claim(city,p);continue;}
   claim(city,p);if(isUrban){set.add(key(p));minC=Math.min(minC,p.c);maxC=Math.max(maxC,p.c);minR=Math.min(minR,p.r);maxR=Math.max(maxR,p.r);}
   for(const [dc,dr]of adj)enqueue({c:p.c+dc,r:p.r+dr});
  }
 }
 // Retain connected access to already developed districts even when a
 // larger neighbour changes the allocation around them.
 for(const city of order){
  const connected=new Set([key(city)]),pending=[...reserved].filter(([,c])=>c.id===city.id).map(([k])=>k).sort();
  for(const goal of pending){if(connected.has(goal))continue;
   const [gc,gr]=goal.split(':').map(Number),queue=[{c:gc,r:gr}],parents=new Map([[goal,null]]);let reached=null;
   for(let i=0;i<queue.length;i++){const p=queue[i],k=key(p);if(connected.has(k)){reached=k;break;}
    for(const [dc,dr]of adj){const q={c:p.c+dc,r:p.r+dr},qk=key(q),cell=cellAt(q);
     if(parents.has(qk)||!cell?.land||!allowed(city,q)||Math.max(Math.abs(q.c-city.c),Math.abs(q.r-city.r))>countySearchRadius(radiusOf(city))+8)continue;
     parents.set(qk,k);queue.push(q);
    }
   }
   if(reached)for(let k=reached;k!=null;k=parents.get(k)){const [c,r]=k.split(':').map(Number);claim(city,{c,r});connected.add(k);}
  }
 }
 for(const c of order){const r=radiusOf(c);let target=0;for(let dr=-6;dr<=6;dr++)for(let dc=-6;dc<=6;dc++)if(urbanTile(c,{c:c.c+dc,r:c.r+dr},r))target++;fill(c,target,true);}
 for(const c of order)fill(c,countyTileLimit(radiusOf(c)),false);
 return {territory,urban};
}
