// V119: downward, progressive research tree. Only researched and currently researchable nodes exist in the DOM.
import {TECHS,techBlock,ERA_NAMES} from './research.js?v=118a';
import {V118_ERA_IDS} from './tech-tree-data-v118.js?v=118a';
import {VERTICAL_TREE,visibleResearchIds,verticalResearchLayout} from './tech-tree-layout-v119.js?v=119a';
import {ERA_MATERIALS,ageDeficit} from './era-economy.js?v=118a';
import {RESOURCE_NAMES} from './economy.js?v=117a';
import {researchCost,EUREKAS} from './science.js?v=117a';
const NS='http://www.w3.org/2000/svg';
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const fmt=n=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:1});
const element=(tag,cls,text)=>{
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(text!==undefined)e.textContent=text;
 return e;
};
function downwardArrow(svg,source,target,optional,implicit){
 const x1=source.x+VERTICAL_TREE.nodeWidth/2,y1=source.y+VERTICAL_TREE.nodeHeight,
       x2=target.x+VERTICAL_TREE.nodeWidth/2,y2=target.y;
 const distance=y2-y1;
 const bend=Math.min(Math.max(18,distance*.37),100);
 const line=document.createElementNS(NS,'path');
 line.setAttribute('d','M'+x1+','+y1+' C'+x1+','+(y1+bend)+' '+x2+','+(y2-bend)+' '+x2+','+y2);
 line.setAttribute('marker-end','url(#tech-arrow-v119)');
 line.classList.add('tech-link-path');
 if(optional)line.classList.add('optional');
 if(implicit)line.classList.add('implicit');
 svg.append(line);
 return line;
}
export function renderTechTreeV119(tree,game,{choose,queue,remove,rate}){
 const state=game.s,research=state.research[0],known=new Set(research.known||[]),isOpen=id=>techBlock(research,id)==='';
 const ids=visibleResearchIds(TECHS,research,isOpen),visible=new Set(ids),entries=ids.map(id=>[id,TECHS[id]]);
 const narrow=matchMedia('(max-width:480px)').matches;
 const compact=matchMedia('(max-width:700px)').matches;
 const layout=verticalResearchLayout(TECHS,ids,ERA_NAMES.length,V118_ERA_IDS,narrow?1:compact?2:4);
 const initialZoom=narrow?1:compact?.77:1;
 let zoom=clamp(Number(tree.dataset.zoom||initialZoom),.62,1.3);
 let selected=tree.dataset.selectedTech;
 const firstAvailable=ids.find(id=>!known.has(id)&&(TECHS[id].age===state.ages[0]));
 const lastKnown=[...ids].reverse().find(id=>known.has(id));
 if(!visible.has(selected))selected=research.active||firstAvailable||lastKnown||ids[0];
 const controls=element('div','tech-tree-controls');
 const summary=element('strong','tech-tree-subtitle',known.size+' researched · '+ids.filter(id=>!known.has(id)).length+' available now');
 const minus=element('button','tech-control','−'),scale=element('span','tech-scale',''),plus=element('button','tech-control','+');
 minus.type=plus.type='button';
 minus.setAttribute('aria-label','Zoom out of technology tree');
 plus.setAttribute('aria-label','Zoom into technology tree');
 controls.append(summary,minus,scale,plus);
 const jumps=element('div','tech-ages'),ageButtons=[];
 for(const band of layout.bands){
  const b=element('button','tech-age-jump',ERA_NAMES[band.age]);
  b.type='button';
  if(band.age===state.ages[0])b.classList.add('present-age');
  jumps.append(b);ageButtons.push({button:b,band});
 }
 // A div avoids the game's global <aside> positioning used for the map HUD.
 const inspector=element('div','tech-inspector');
 inspector.setAttribute('role','region');
 inspector.setAttribute('aria-label','Selected technology details');
 inspector.setAttribute('aria-live','polite');
 const legend=element('p','tech-legend','Research progresses downward ↓. Solid arrows = all prerequisites required (AND); dashed arrows = one alternative (OR). Locked branches remain hidden.');
 const frame=element('div','tech-map-viewport tech-vertical-viewport'),
       space=element('div','tech-map-space'),canvas=element('div','tech-map-canvas');
 canvas.style.width=layout.width+'px';
 canvas.style.height=layout.height+'px';
 const svg=document.createElementNS(NS,'svg');
 svg.setAttribute('viewBox','0 0 '+layout.width+' '+layout.height);
 svg.setAttribute('width',layout.width);
 svg.setAttribute('height',layout.height);
 svg.classList.add('tech-links');
 const defs=document.createElementNS(NS,'defs'),marker=document.createElementNS(NS,'marker'),shape=document.createElementNS(NS,'path');
 marker.setAttribute('id','tech-arrow-v119');marker.setAttribute('viewBox','0 0 8 8');
 marker.setAttribute('markerWidth','6');marker.setAttribute('markerHeight','6');
 marker.setAttribute('refX','7');marker.setAttribute('refY','4');
 marker.setAttribute('orient','auto');
 shape.setAttribute('d','M0,0 L8,4 L0,8 Z');
 shape.setAttribute('fill','#ecd19a');
 marker.append(shape);defs.append(marker);svg.append(defs);
 for(const band of layout.bands){
  const bg=element('div','tech-era-band tech-vertical-era');
  bg.style.top=band.start+'px';bg.style.height=(band.end-band.start)+'px';
  bg.style.width=layout.width+'px';
  if(band.age===state.ages[0])bg.classList.add('current');
  canvas.append(bg);
  const heading=element('h3','tech-era-heading tech-vertical-heading',(band.age+1)+'. '+ERA_NAMES[band.age]);
  heading.style.top=(band.start+7)+'px';heading.style.left='20px';
  canvas.append(heading);
 }
 const paths=layout.edges.map(edge=>({
  ...edge,node:downwardArrow(svg,layout.positions.get(edge.from),layout.positions.get(edge.to),edge.optional,edge.implicit)
 }));
 canvas.append(svg);
 const cards=new Map();
 for(const [id,tech] of entries){
  const {x,y}=layout.positions.get(id),done=known.has(id),active=research.active===id,progress=research.progress[id]||0,cost=researchCost(state,tech);
  const card=element('button','tech-card tech-tree-node tech-vertical-node '+(done?'known':active?'researching':'available'));
  card.type='button';card.dataset.tech=id;
  card.style.left=x+'px';card.style.top=y+'px';
  card.style.width=VERTICAL_TREE.nodeWidth+'px';card.style.height=VERTICAL_TREE.nodeHeight+'px';
  card.setAttribute('aria-pressed','false');
  card.setAttribute('aria-label',tech.name+'; '+(done?'Researched':active?'Researching':'Available'));
  card.append(element('strong','tech-node-name',(done?'✓ ':active?'▶ ':'')+tech.name));
  card.append(element('span','tech-time',done?'Researched':fmt(cost)+' RP · '+(rate>0?Math.ceil((cost-progress)/rate)+' min':'Waiting for research')));
  card.append(element('small','tech-parents',done?'✓ Known':active?'▶ Researching':'● Available'));
  const bar=element('progress');bar.max=cost;bar.value=done?cost:progress;card.append(bar);
  const detail=element('small','tech-progress-detail');
  detail.hidden=!progress;detail.textContent='Progress '+fmt(progress)+' / '+fmt(cost);card.append(detail);
  if(EUREKAS[id])card.append(element('small',research.boosted?.includes(id)?'eureka-earned':'eureka-available',research.boosted?.includes(id)?'⚡ +35% earned':'⚡ +35% bonus'));
  card.onclick=()=>inspect(id);
  canvas.append(card);cards.set(id,card);
 }
 space.append(canvas);frame.append(space);tree.append(controls,jumps,inspector,legend,frame);
 function redrawScale(){
  space.style.width=(layout.width*zoom)+'px';
  space.style.height=(layout.height*zoom)+'px';
  canvas.style.transform='scale('+zoom+')';
  scale.textContent=Math.round(zoom*100)+'%';
  tree.dataset.zoom=zoom;
 }
 function setZoom(next){
  const old=zoom;zoom=clamp(next,.62,1.3);
  const centerX=frame.scrollLeft+frame.clientWidth/2,centerY=frame.scrollTop+frame.clientHeight/2;
  redrawScale();
  frame.scrollLeft=centerX*zoom/old-frame.clientWidth/2;
  frame.scrollTop=centerY*zoom/old-frame.clientHeight/2;
 }
 minus.onclick=()=>setZoom(zoom-.1);
 plus.onclick=()=>setZoom(zoom+.1);
 for(const {button,band} of ageButtons)button.onclick=()=>frame.scrollTo({top:band.start*zoom,left:0,behavior:'smooth'});
 frame.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();setZoom(zoom+(e.deltaY<0?.1:-.1));}},{passive:false});
 let pinch=null;
 frame.addEventListener('touchstart',e=>{
  if(e.touches.length===2)pinch={distance:Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY),zoom};
 },{passive:true});
 frame.addEventListener('touchmove',e=>{
  if(e.touches.length!==2||!pinch)return;
  e.preventDefault();
  const distance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
  setZoom(pinch.zoom*distance/Math.max(1,pinch.distance));
 },{passive:false});
 frame.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=null;},{passive:true});
 function inspect(id){
  if(!visible.has(id))return;
  selected=id;tree.dataset.selectedTech=id;
  const tech=TECHS[id],parents=(tech.requires||[]).filter(p=>visible.has(p)),
        alternatives=(tech.oneOf||[]).filter(p=>visible.has(p)),
        children=layout.edges.filter(e=>e.from===id).map(e=>e.to),
        highlighted=new Set([id,...parents,...alternatives,...children]);
  for(const [key,card] of cards){
   card.classList.toggle('is-selected',key===id);
   card.classList.toggle('is-neighbor',key!==id&&highlighted.has(key));
   card.setAttribute('aria-pressed',String(key===id));
  }
  for(const line of paths){
   line.node.classList.toggle('is-selected',line.to===id||line.from===id);
   line.node.classList.toggle('is-faded',line.to!==id&&line.from!==id);
  }
  inspector.replaceChildren();
  const intro=element('div','tech-info-intro');
  intro.append(element('strong','tech-info-name',tech.name),
               element('small','',ERA_NAMES[tech.age]+' · '+fmt(researchCost(state,tech))+' teaduspunkti'));
  const missing=techBlock(research,id);
  intro.append(element('p','',known.has(id)?'✓ Researched':research.active===id?'▶ Researching':missing||'✓ Ready to research'));
  inspector.append(intro);
  const relations=element('div','tech-info-relations');
  const text=(parents.length?'AND: '+parents.map(p=>TECHS[p].name+(known.has(p)?' ✓':'')).join(' + '):'Basic knowledge or era prerequisites fulfilled')+
             (alternatives.length?' · OR: '+alternatives.map(p=>TECHS[p].name+(known.has(p)?' ✓':'')).join(' / '):'');
  relations.append(element('p','',text),element('p','tech-info-unlocks','Unlocks: '+tech.unlocks));
  if(children.length)relations.append(element('p','','Visible successors: '+[...new Set(children)].map(p=>TECHS[p].name).join(' · ')));
  if(ERA_MATERIALS[id]){
   const deficit=ageDeficit(state,0,id);
   relations.append(element('p','tech-era-cost','Era materials: '+Object.entries(ERA_MATERIALS[id]).map(([k,n])=>n+' '+(RESOURCE_NAMES[k]||k)).join(', ')+(Object.keys(deficit).length?' · Missing: '+Object.entries(deficit).map(([k,n])=>fmt(n)+' '+(RESOURCE_NAMES[k]||k)).join(', '):' · All materials available')));
  }
  inspector.append(relations);
  const actions=element('div','tech-info-actions');
  const study=element('button','tech-study','⚗ Research');study.type='button';
  study.disabled=known.has(id)||!!missing||!state.cities.some(c=>c.team===0)||research.active===id;
  study.onclick=()=>choose(id);actions.append(study);
  const plan={known:[...research.known,...(research.active?[research.active]:[]),...(research.queue||[])]};
  const queued=research.queue?.includes(id);
  const add=element('button','tech-plan-queue',queued?'✓ Queued':'＋ Add to Queue');add.type='button';
  add.disabled=known.has(id)||queued||research.active===id||(research.queue?.length||0)>=4||!!techBlock(plan,id)||!state.cities.some(c=>c.team===0);
  add.onclick=()=>queue(id);actions.append(add);inspector.append(actions);
 }
 redrawScale();
 if(selected)inspect(selected);
 const destination=layout.positions.get(research.active||selected);
 if(destination){
  frame.scrollLeft=Math.max(0,(destination.x+VERTICAL_TREE.nodeWidth/2)*zoom-frame.clientWidth/2);
  frame.scrollTop=Math.max(0,destination.y*zoom-frame.clientHeight*.24);
 }
}
