// V119: stable top-to-bottom DAG layout; hidden research is not represented by nodes or edges.
// Pure functions also run in Node regression tests (no DOM dependency).
export const VERTICAL_TREE = Object.freeze({nodeWidth:218,nodeHeight:102,colGap:34,rowGap:64,marginX:36,topGap:74,bottomGap:24,eraGap:65});
export function visibleResearchIds(techs,research,canResearch){
 const known=new Set(research.known||[]);
 return Object.keys(techs).filter(id=>known.has(id)||research.active===id||canResearch(id));
}
export function verticalResearchLayout(techs,ids,eraCount,eraIds,columns=4){
 const width=Math.max(1,columns)*(VERTICAL_TREE.nodeWidth+VERTICAL_TREE.colGap)-VERTICAL_TREE.colGap+2*VERTICAL_TREE.marginX;
 const shown=new Set(ids),positions=new Map(),bands=[],edges=[];
 let top=VERTICAL_TREE.topGap;
 const maxColumns=Math.max(1,columns);
 for(let age=0;age<eraCount;age++){
  const group=ids.filter(id=>techs[id].age===age);
  if(!group.length)continue;
  const levels=new Map(),visiting=new Set();
  function predecessors(id){
   const t=techs[id],all=[...(t.requires||[]),...(t.oneOf||[])].filter(p=>shown.has(p));
   // The age gate is implicit for other root-level discoveries in that same age.
   const gate=eraIds[age];
   if(age>0&&id!==gate&&shown.has(gate)&&!all.some(p=>techs[p].age===age))all.push(gate);
   return [...new Set(all)];
  }
  function rank(id){
   if(levels.has(id))return levels.get(id);
   if(visiting.has(id))throw new Error('Tehnoloogiapuu tsükkel: '+id);
   visiting.add(id);
   const inEra=predecessors(id).filter(p=>techs[p].age===age);
   const r=inEra.length?Math.max(...inEra.map(rank))+1:0;
   visiting.delete(id);levels.set(id,r);return r;
  }
  for(const id of group)rank(id);
  const maxRank=Math.max(...group.map(id=>levels.get(id)));
  const start=top-48;
  for(let row=0;row<=maxRank;row++){
   const nodes=group.filter(id=>levels.get(id)===row);
   // Nodes stay grouped by their functional branches across adjacent rows.
   nodes.sort((a,b)=>String(techs[a].category||'').localeCompare(String(techs[b].category||''))||a.localeCompare(b));
   for(let offset=0;offset<nodes.length;offset+=maxColumns){
    const slice=nodes.slice(offset,offset+maxColumns);
    const total=slice.length*VERTICAL_TREE.nodeWidth+(slice.length-1)*VERTICAL_TREE.colGap;
    const left=(width-total)/2;
    slice.forEach((id,i)=>positions.set(id,{
     x:Math.round(left+i*(VERTICAL_TREE.nodeWidth+VERTICAL_TREE.colGap)),
     y:Math.round(top),age
    }));
    top+=VERTICAL_TREE.nodeHeight+VERTICAL_TREE.rowGap;
   }
  }
  const end=top;
  bands.push({age,start:Math.max(0,start),end});
  top+=VERTICAL_TREE.eraGap;
 }
 for(const id of ids){
  const t=techs[id],dest=positions.get(id);
  if(!dest)continue;
  const add=(parent,optional,implicit=false)=>{
   if(!shown.has(parent)||!positions.has(parent))return;
   const source=positions.get(parent);
   if(source.y>=dest.y)throw new Error('Nool ei liigu alla: '+parent+' → '+id);
   if(!edges.some(e=>e.from===parent&&e.to===id))edges.push({from:parent,to:id,optional,implicit});
  };
  for(const p of t.requires||[])add(p,false);
  for(const p of t.oneOf||[])add(p,true);
  const gate=eraIds[t.age];
  if(t.age>0&&id!==gate&&!edges.some(e=>e.to===id&&techs[e.from].age===t.age))add(gate,false,true);
 }
 return {ids,positions,bands,edges,width,height:Math.max(360,top+VERTICAL_TREE.bottomGap),columns:maxColumns};
}
