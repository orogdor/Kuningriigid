// V118 scrollable technology tree. Pure DOM and SVG; no game-state schema change.
import {TECHS,techBlock,ERA_NAMES} from './research.js?v=118a';
import {ERA_MATERIALS,ageDeficit} from './era-economy.js?v=118a';
import {RESOURCE_NAMES} from './economy.js?v=117a';
import {researchCost,EUREKAS} from './science.js?v=117a';
const NS='http://www.w3.org/2000/svg', AGE_W=510, NODE_W=230, NODE_H=91, ROW_H=110;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const el=(tag,className,content)=>{const d=document.createElement(tag);if(className)d.className=className;if(content!=null)d.textContent=content;return d;};
const fmt=n=>Number(n||0).toLocaleString('et-EE',{maximumFractionDigits:1});
function lane(id,t){
 if(t.category==='food'||/farm|food|seed|manure|canal|sickle|plough|field|mill|animal|hunting|fishing|trap|net|reaper|agricul|water_meadows/.test(id))return 0;
 if(t.category==='mining'||/mine|ore|stone|masonry|smelt|smith|iron|bronze|copper|steel|oil|shaft|drill|chemistry|woodwork|forestry|wedge|pick|chisel|hoist|pump|kiln|pottery/.test(id))return 1;
 if(/settlement|trade|commerce|guild|writing|bridge|road|storage|cellar|craft|city_|industrialization|railway|electricity|power|combustion/.test(id))return 2;
 if(/learning|philosophy|university|scholastic|science|experiment|astronom|math|measure|modernity|renaissance|printing|electro|comput|education|mechanic/.test(id))return 3;
 return 4;
}
function svgPath(svg,from,to,optional){
 const x1=from.x+NODE_W,y1=from.y+NODE_H/2,x2=to.x,y2=to.y+NODE_H/2,dx=x2-x1;
 const path=document.createElementNS(NS,'path');
 let d;if(dx>35){const b=Math.max(28,Math.min(100,dx*.42));d='M'+x1+','+y1+' C'+(x1+b)+','+y1+' '+(x2-b)+','+y2+' '+x2+','+y2;}
 else {const right=Math.max(x1,x2)+34;d='M'+x1+','+y1+' C'+right+','+y1+' '+right+','+y2+' '+x2+','+y2;}
 path.setAttribute('d',d);path.classList.add('tech-link-path');if(optional)path.classList.add('optional');
 path.setAttribute('marker-end','url(#tech-arrow-v118)');svg.append(path);return path;
}
export function renderTechTreeV118(tree,game,{choose,queue,remove,rate}){
 const state=game.s,research=state.research[0],known=new Set(research.known),entries=Object.entries(TECHS);
 const groups=ERA_NAMES.map((_,age)=>entries.filter(([,t])=>t.age===age).sort((a,b)=>lane(a[0],a[1])-lane(b[0],b[1])));
 const maxRows=Math.max(...groups.map(g=>Math.ceil(g.length/2))), W=AGE_W*ERA_NAMES.length,H=135+maxRows*ROW_H;
 const positions=new Map();groups.forEach((g,age)=>g.forEach(([id],i)=>positions.set(id,{x:age*AGE_W+18+(i%2)*244,y:90+Math.floor(i/2)*ROW_H})));
 let zoom=clamp(parseFloat(tree.dataset.zoom||'1'),.60,1.3),selected=tree.dataset.selectedTech||research.active||groups[state.ages[0]]?.[0]?.[0]||entries[0][0];
 const controls=el('div','tech-tree-controls'),label=el('strong','tech-tree-subtitle','Avastuste harud · 111 teadmist');controls.append(label);
 const minus=el('button','tech-control','−'),percent=el('span','tech-scale','100%'),plus=el('button','tech-control','+');
 minus.type=plus.type='button';minus.setAttribute('aria-label','Vähenda tehnoloogiapuud');plus.setAttribute('aria-label','Suurenda tehnoloogiapuud');
 controls.append(minus,percent,plus);
 const ageNav=el('div','tech-ages');
 const focusButtons=[];ERA_NAMES.forEach((name,age)=>{const b=el('button','tech-age-jump',name);b.type='button';if(age===state.ages[0])b.classList.add('present-age');ageNav.append(b);focusButtons.push(b)});
 const inspector=el('aside','tech-inspector');inspector.setAttribute('aria-live','polite');
 const frame=el('div','tech-map-viewport'),space=el('div','tech-map-space'),canvas=el('div','tech-map-canvas');
 canvas.style.width=W+'px';canvas.style.height=H+'px';
 const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('width',W);svg.setAttribute('height',H);svg.classList.add('tech-links');
 const defs=document.createElementNS(NS,'defs'),marker=document.createElementNS(NS,'marker'),shape=document.createElementNS(NS,'path');
 marker.setAttribute('id','tech-arrow-v118');marker.setAttribute('viewBox','0 0 8 8');marker.setAttribute('markerWidth','5');marker.setAttribute('markerHeight','5');marker.setAttribute('refX','7');marker.setAttribute('refY','4');marker.setAttribute('orient','auto-start-reverse');
 shape.setAttribute('d','M0,0 L8,4 L0,8 Z');shape.setAttribute('fill','currentColor');marker.append(shape);defs.append(marker);svg.append(defs);
 const paths=[];
 for(const [id,t] of entries){const dest=positions.get(id);for(const parent of t.requires||[]){const p=positions.get(parent);if(p)paths.push({from:parent,to:id,node:svgPath(svg,p,dest,false)})}for(const parent of t.oneOf||[]){const p=positions.get(parent);if(p)paths.push({from:parent,to:id,node:svgPath(svg,p,dest,true)})}}
 canvas.append(svg);
 const cards=new Map();
 groups.forEach((group,age)=>{
  const band=el('div','tech-era-band');band.style.left=age*AGE_W+'px';band.style.width=AGE_W+'px';band.style.height=H+'px';if(age===state.ages[0])band.classList.add('current');canvas.append(band);
  const title=el('h3','tech-era-heading',(age+1)+'. '+ERA_NAMES[age]);title.style.left=(age*AGE_W+18)+'px';canvas.append(title);
  for(const [id,t] of group){
   const p=positions.get(id),done=known.has(id),blocked=techBlock(research,id),active=research.active===id,progress=research.progress[id]||0,cost=researchCost(state,t);
   const card=el('button','tech-card tech-tree-node '+(done?'known':active?'researching':blocked?'locked':'available'));
   card.type='button';card.dataset.tech=id;card.setAttribute('aria-pressed','false');card.style.left=p.x+'px';card.style.top=p.y+'px';card.style.width=NODE_W+'px';card.style.height=NODE_H+'px';
   card.append(el('strong','tech-node-name',(done?'✓ ':active?'▶ ':'')+t.name));
   card.append(el('span','tech-time',done?'Uuritud':fmt(cost)+' TP · '+(rate>0?Math.ceil((cost-progress)/rate)+' mängumin':'Ootab teadust')));
   const req=el('small','tech-parents',done?'✓ Teada':blocked||'Saad uurida');card.append(req);
   const bar=el('progress');bar.max=cost;bar.value=done?cost:progress;card.append(bar);
   const detail=el('small','tech-progress-detail');detail.hidden=!progress;detail.textContent='Tehtud '+fmt(progress)+' / '+fmt(cost);card.append(detail);
   if(EUREKAS[id]){const bonus=el('small',research.boosted?.includes(id)?'eureka-earned':'eureka-available',research.boosted?.includes(id)?'⚡ +35% saadud':'⚡ +35% avastusboonus');card.append(bonus)}
   card.addEventListener('click',()=>inspect(id));canvas.append(card);cards.set(id,card);
  }
 });
 space.append(canvas);frame.append(space);
 const legend=el('p','tech-legend','Pidev joon = kõik eeldused on vajalikud (JA). Katkendlik joon = piisab ühest alternatiivist (VÕI). Hallid sõlmed on nähtavad ka enne avamist.');
 tree.append(controls,ageNav,inspector,legend,frame);
 function redrawScale(){space.style.width=(W*zoom)+'px';space.style.height=(H*zoom)+'px';canvas.style.transform='scale('+zoom+')';percent.textContent=Math.round(zoom*100)+'%';tree.dataset.zoom=zoom;}
 function setZoom(next){const old=zoom;zoom=clamp(next,.60,1.3);const cx=frame.scrollLeft+frame.clientWidth/2,cy=frame.scrollTop+frame.clientHeight/2;redrawScale();frame.scrollLeft=cx*zoom/old-frame.clientWidth/2;frame.scrollTop=cy*zoom/old-frame.clientHeight/2;}
 minus.onclick=()=>setZoom(zoom-.1);plus.onclick=()=>setZoom(zoom+.1);
 function goAge(age){frame.scrollTo({left:age*AGE_W*zoom,top:0,behavior:'smooth'});}
 focusButtons.forEach((b,age)=>b.onclick=()=>goAge(age));
 frame.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();setZoom(zoom+(e.deltaY<0?.1:-.1));}},{passive:false});
 let pinch=null;
 frame.addEventListener('touchstart',e=>{if(e.touches.length===2)pinch={distance:Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY),zoom};},{passive:true});
 frame.addEventListener('touchmove',e=>{if(e.touches.length!==2||!pinch)return;e.preventDefault();const distance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);setZoom(pinch.zoom*distance/Math.max(1,pinch.distance));},{passive:false});
 frame.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=null;},{passive:true});
 function inspect(id){
  if(!TECHS[id])return;selected=id;tree.dataset.selectedTech=id;
  const tech=TECHS[id],parents=tech.requires||[],alternatives=tech.oneOf||[],children=entries.filter(([,t])=>t.requires.includes(id)||(t.oneOf||[]).includes(id)).map(([key])=>key);
  const highlighted=new Set([id,...parents,...alternatives,...children]);
  for(const [key,card] of cards){card.classList.toggle('is-selected',key===id);card.classList.toggle('is-neighbor',key!==id&&highlighted.has(key));card.setAttribute('aria-pressed',String(key===id));}
  for(const line of paths){line.node.classList.toggle('is-selected',line.to===id||line.from===id);line.node.classList.toggle('is-faded',line.to!==id&&line.from!==id);}
  inspector.replaceChildren();
  const intro=el('div','tech-info-intro');intro.append(el('strong','tech-info-name',tech.name),el('small','',ERA_NAMES[tech.age]+' · '+fmt(researchCost(state,tech))+' teaduspunkti'));
  const missing=techBlock(research,id);intro.append(el('p','',known.has(id)?'✓ Uuritud':missing||'✓ Saab kohe uurida'));inspector.append(intro);
  const relations=el('div','tech-info-relations');
  const req=el('p','',(parents.length?'JA: '+parents.map(k=>TECHS[k].name+(known.has(k)?' ✓':'')).join(' + '):'Ilma kohustuslike eeldusteta')+(alternatives.length?' · VÕI: '+alternatives.map(k=>TECHS[k].name+(known.has(k)?' ✓':'')).join(' / '):''));
  relations.append(req,el('p','tech-info-unlocks','Avab: '+tech.unlocks),el('p','',children.length?'Järgmised: '+children.map(k=>TECHS[k].name).join(' · '):'Selle haru lõppavastus'));
  if(ERA_MATERIALS[id]){const deficit=ageDeficit(state,0,id);relations.append(el('p','tech-era-cost','Ajastu materjalid: '+Object.entries(ERA_MATERIALS[id]).map(([k,n])=>n+' '+(RESOURCE_NAMES[k]||k)).join(', ')+(Object.keys(deficit).length?' · Puudu: '+Object.entries(deficit).map(([k,n])=>fmt(n)+' '+(RESOURCE_NAMES[k]||k)).join(', '):' · Materjalid olemas')))}
  inspector.append(relations);
  const actions=el('div','tech-info-actions');
  const investigate=el('button','tech-study','⚗ Uuri');investigate.disabled=known.has(id)||!!missing||!state.cities.some(c=>c.team===0)||research.active===id;
  investigate.onclick=()=>choose(id);actions.append(investigate);
  const future={known:[...research.known,...(research.active?[research.active]:[]),...(research.queue||[])]},isQueued=research.queue?.includes(id);
  const q=el('button','tech-plan-queue',isQueued?'✓ Järjekorras':'＋ Lisa järjekorda');
  q.disabled=known.has(id)||isQueued||research.active===id||(research.queue?.length||0)>=4||!!techBlock(future,id)||!state.cities.some(c=>c.team===0);
  q.onclick=()=>queue(id);actions.append(q);inspector.append(actions);
 }
 redrawScale();inspect(selected);
 const where=positions.get(research.active||selected)||{x:state.ages[0]*AGE_W,y:90};
 frame.scrollLeft=Math.max(0,(state.ages[0]*AGE_W+6)*zoom);
 frame.scrollTop=Math.max(0,(where.y-140)*zoom);
}
