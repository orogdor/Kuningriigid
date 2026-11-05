/* V293: the five lower circles are ONLY the live research queue.
 * Slot 1 = active research, slots 2–5 = the game's four queued discoveries.
 * Every icon is the same tech-specific SVG used by the research tree.
 */
(()=>{
 'use strict';
 if(typeof window!=='undefined'&&window.KINGDOMS_UI304)return;
 'use strict';
 const $=id=>document.getElementById(id);
 const query=root=>[...root.querySelectorAll('.v291-research-queue')];
 const art=(id,meta)=>window.KuningriigidTechArtV293?.src?.(id,meta)||'';
 const ACTIVE="v293-active-picture";
 const positions=5;
 let root,slots=[],prev='';
 function focusTech(id){
  const tree=$('researchtree');
  if(tree){
   if(id)tree.dataset.selectedTech=id;
   tree.dataset.renderKey=''; // force a new inspector selection even when research state is unchanged
  }
  const panel=$('researchpanel');
  if(panel?.hidden){const real=window.openKuningriigidResearchV296;if(typeof real==='function')real();else $('techtoggle')?.click();}
  else if(id){tree?.querySelector('.tech-map-viewport')?.focus?.()}
 }
 function enhanceSlot(button,i){
  button.dataset.researchIndex=String(i);
  button.classList.add('v293-research-slot');
  const cover=document.createElement('span');
  cover.className='v293-queue-center';
  const pic=document.createElement('img');
  pic.className='v293-queue-picture';
  pic.alt='';pic.draggable=false;pic.decoding='async';
  const label=document.createElement('span');label.className='v293-queue-mark';label.textContent='+';
  const progress=document.createElement('small');progress.className='v293-queue-progress';progress.hidden=true;
  cover.append(pic,label,progress);button.append(cover);
  // Capture fires before the old V291 generic research-queue button handler.
  button.addEventListener('click',e=>{
   e.preventDefault();e.stopImmediatePropagation();
   focusTech(button.dataset.techId||null);
  },true);
 }
 function enhance(){
  root=$('v291-hud');if(!root)return false;
  const found=query(root);
  if(found.length!==positions)return false;
  slots=found;
  slots.forEach(enhanceSlot);
  const research=root.querySelector('.v291-research-main');
  if(research&&!research.querySelector('.'+ACTIVE)){
   const image=document.createElement('img');image.className=ACTIVE;image.alt='';image.draggable=false;image.decoding='async';
   research.prepend(image);
  }
  return true;
 }
 function applySlot(btn,position,tech,percent,paused){
  const picture=btn.querySelector('.v293-queue-picture');
  const mark=btn.querySelector('.v293-queue-mark');
  const percentLabel=btn.querySelector('.v293-queue-progress');
  const hasTech=!!tech?.id;
  if(hasTech){
   const uri=art(tech.id,{name:tech.name,age:tech.age});
   if(picture.dataset.key!==tech.id){picture.src=uri;picture.dataset.key=tech.id;}
   picture.hidden=false;mark.hidden=true;
   btn.dataset.techId=tech.id;
   btn.title=(position===0?'Uurimisel: ':'Järjekorras: ')+tech.name;
   btn.setAttribute('aria-label',btn.title+' — ava tehnoloogiapuus');
  }else{
   picture.hidden=true;picture.removeAttribute('src');picture.dataset.key='';
   mark.hidden=false;btn.dataset.techId='';
   btn.title=position===0?'Vali uuritav avastus':'Lisa avastus järjekorda';
   btn.setAttribute('aria-label',btn.title);
  }
  btn.classList.toggle('v293-current',hasTech&&position===0);
  btn.classList.toggle('v293-pending',hasTech&&position>0);
  btn.classList.toggle('v293-empty',!hasTech);
  if(hasTech&&position===0){
   percentLabel.textContent=paused?'Ⅱ':String(Math.round(percent||0))+'%';
   percentLabel.hidden=false;
  }else percentLabel.hidden=true;
 }
 function update(force=false){
  if(!root||!slots.length)return;
  const state=window.kingdomsUiV288?.snapshot?.();
  if(!state)return;
  const active=state.researchActiveId?{id:state.researchActiveId,name:state.research,age:state.researchActiveAge}:null;
  const queue=(state.researchQueue||[]).slice(0,4);
  const values=[active,...Array.from({length:4},(_,i)=>queue[i]||null)];
  const stamp=JSON.stringify([values,state.researchPercent,state.researchPaused]);
  if(!force&&stamp===prev)return;prev=stamp;
  slots.forEach((btn,i)=>applySlot(btn,i,values[i],state.researchPercent,state.researchPaused));
  const main=root.querySelector('.'+ACTIVE);
  if(main){
   if(active){
    const uri=art(active.id,active);
    if(main.dataset.key!==active.id){main.src=uri;main.dataset.key=active.id;}
    main.hidden=false;
   }else{main.hidden=true;main.removeAttribute('src');main.dataset.key='';}
  }
 }
 function start(){
  if(!enhance())return;
  update(true);
  // Re-render only when queued research, active tech or progress changes.
  setInterval(update,900);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
