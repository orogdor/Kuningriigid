// V264: clearer HUD.
//  - World map: Army / City open a list of your armies / cities (and settlers) to find, focus and select.
//  - Top bar: resources grouped under three icons (food & water, building materials, goods & luxury);
//    hovering or tapping a group opens the full list. The game still renders the original resource
//    spans; this module only moves them into the groups after each render.
//  - Main menu: painted warrior portraits above the title (styling in ui-v264.css).
const $=id=>document.getElementById(id);
const GROUPS=[
 {id:'food',name:'Toit ja vesi',icon:'res_food',keys:['bread','water','grain','flour','fish','meat'],main:['bread','water']},
 {id:'build',name:'Ehitusmaterjalid',icon:'res_wood',keys:['wood','plank','stone','cutstone','clay','copper','tin','bronze','ore','coal','iron','steel','weapons'],main:['wood','stone','plank']},
 {id:'lux',name:'Kaubad ja luksus',icon:'res_gold',keys:['gold','pottery','paper','cloth','wine','jewelry','spices','salt'],main:['gold','pottery']}
];
const groupOf=k=>GROUPS.find(g=>g.keys.includes(k))||GROUPS[1];
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);

// ---------------------------------------------------------------- resources
// The game's own spans are kept (hidden) in a store inside the bar, so their numbers and the bread
// click (food stock window) keep working; the visible chips and the pop-up list are built from them.
let regrouping=false,shown=null,hideTimer=0;
const val=(s,sel)=>s?.querySelector(sel)?.textContent||'';
function regroup(){
 const bar=$('resources');if(!bar||regrouping)return;
 const spans=[...bar.querySelectorAll(':scope > span[data-resource]')];
 if(!spans.some(s=>!s.dataset.v264))return;
 regrouping=true;
 const frag=document.createDocumentFragment(),store=document.createElement('div');store.className='v264-store';store.hidden=true;
 for(const g of GROUPS){
  const items=spans.filter(s=>s.dataset.resource!=='population'&&groupOf(s.dataset.resource)===g);
  if(!items.length)continue;
  const chip=document.createElement('div');chip.className='v264-chip';chip.dataset.group=g.id;chip.tabIndex=0;chip.setAttribute('role','button');
  chip.setAttribute('aria-label',g.name);chip.title=g.name;
  const mains=g.main.map(k=>items.find(s=>s.dataset.resource===k)).filter(Boolean);
  chip.innerHTML=`<img class="v264-gicon" src="ui-art-v263/${g.icon}.webp" alt=""><div class="v264-vals">${mains.map(s=>`<div class="v264-val"><img src="ui-art-v263/${iconOf(s.dataset.resource)}.webp" alt=""><i>${esc(val(s,'b')||'0')}</i></div>`).join('')}</div><div class="v264-gname">${esc(g.name)}${items.length>mains.length?' +'+(items.length-mains.length):''}</div>`;
  frag.append(chip);
 }
 for(const s of spans){if(s.dataset.resource==='population'){s.dataset.v264='1';continue;}store.append(s);}
 const pop=spans.find(s=>s.dataset.resource==='population');if(pop)frag.append(pop);
 frag.append(store);
 bar.replaceChildren(frag);bar.classList.add('v264-grouped');
 regrouping=false;
 if(shown)fillPop(shown);
}
const ICON={bread:'res_food'};
function iconOf(k){return ICON[k]||'res_'+k;}
let pop=null;
function popEl(){
 if(pop)return pop;
 pop=document.createElement('div');pop.id='v264-respop';pop.hidden=true;pop.setAttribute('role','list');document.body.append(pop);
 pop.addEventListener('mouseenter',()=>clearTimeout(hideTimer));pop.addEventListener('mouseleave',()=>scheduleHide());
 pop.addEventListener('click',e=>{const r=e.target.closest('[data-key]');if(!r)return;const span=$('resources')?.querySelector(`.v264-store span[data-resource="${r.dataset.key}"]`);span?.click();});
 return pop;
}
function fillPop(id){
 const g=GROUPS.find(g=>g.id===id),el=popEl(),store=$('resources')?.querySelector('.v264-store');if(!g||!store)return;
 const items=[...store.querySelectorAll('span[data-resource]')].filter(s=>groupOf(s.dataset.resource)===g);
 el.innerHTML=`<strong>${esc(g.name)}</strong>`+items.map(s=>`<div class="v264-rrow${s.dataset.resource==='bread'?' clickable':''}" role="listitem" data-key="${esc(s.dataset.resource)}" title="${esc(s.title||'')}"><img src="ui-art-v263/${iconOf(s.dataset.resource)}.webp" alt=""><span class="n">${esc(val(s,'small'))}</span><b>${esc(val(s,'b'))}<em>${esc(val(s,'em'))}</em></b><span class="k">kuningriik ${esc(val(s,'i'))}</span></div>`).join('');
}
function showPop(chip){
 clearTimeout(hideTimer);const id=chip.dataset.group;shown=id;fillPop(id);const el=popEl(),r=chip.getBoundingClientRect();
 el.hidden=false;el.style.top=(r.bottom+6)+'px';el.style.left=Math.max(8,Math.min(window.innerWidth-280,r.left))+'px';
 for(const c of document.querySelectorAll('.v264-chip'))c.classList.toggle('open',c===chip);
}
function hidePop(){shown=null;if(pop)pop.hidden=true;for(const c of document.querySelectorAll('.v264-chip.open'))c.classList.remove('open');}
function scheduleHide(){clearTimeout(hideTimer);hideTimer=setTimeout(hidePop,220);}

// ---------------------------------------------------------------- army / city lists
let panel=null,mode=null;
function api(){return window.kingdomsUiV264;}
function build(){
 panel=document.createElement('div');panel.id='v264-listpanel';panel.hidden=true;panel.setAttribute('role','dialog');
 panel.innerHTML='<div class="v264-head"><strong></strong><button type="button" class="v264-close" aria-label="Sulge">✕</button></div><input type="search" placeholder="Otsi…" aria-label="Otsi"><div class="v264-rows"></div>';
 document.body.append(panel);
 panel.querySelector('.v264-close').onclick=()=>close();
 panel.querySelector('input').oninput=()=>fill();
}
function close(){if(panel)panel.hidden=true;mode=null;}
function fill(){
 const a=api();if(!a||!panel)return;
 const q=panel.querySelector('input').value.trim().toLowerCase(),rows=panel.querySelector('.v264-rows');rows.replaceChildren();
 const row=(img,title,sub,on,extra)=>{const b=document.createElement('button');b.type='button';b.className='v264-row';b.innerHTML=`<img src="ui-art-v263/${img}.webp" alt=""><span><b>${esc(title)}</b><small>${esc(sub)}</small></span>`;b.onclick=on;if(extra)b.append(extra);rows.append(b);return b;};
 if(mode==='army'){
  panel.querySelector('.v264-head strong').textContent='Armeed';
  const list=a.armies().filter(x=>!q||('armee '+(x.id+1)+' '+Object.keys(x.kinds).join(' ')).toLowerCase().includes(q));
  if(!list.length)rows.innerHTML='<p class="v264-empty">Armeid pole. Värba sõdalasi linnas.</p>';
  for(const x of list){
   const kinds=Object.entries(x.kinds).map(([n,c])=>c+'× '+n).join(', ')||'tühi';
   const icon=x.count&&Object.keys(x.kinds).length===1&&/avasta|scout/i.test(Object.keys(x.kinds)[0])?'unit_scout':'cmd_army';
   const b=row(icon,'Armee '+(x.id+1)+' · '+x.count+' meest',kinds+' · ruut '+(x.c+1)+':'+(x.r+1)+(x.ship?' · laeval':'')+(x.auto?' · avastab':''),()=>{a.selectArmy(x.id);close();});
   if(x.selected)b.classList.add('active');
  }
 }else{
  panel.querySelector('.v264-head strong').textContent='Linnad';
  const list=a.cities().filter(x=>!q||x.name.toLowerCase().includes(q));
  if(!list.length)rows.innerHTML='<p class="v264-empty">Linnu pole veel. Vali asunik ja raja linn.</p>';
  for(const x of list){
   if(x.type==='settler'){row('unit_settler',x.name,'Asunik · ruut '+(x.cc+1)+':'+(x.r+1),()=>{a.focusCity('settler',x.id);close();});continue;}
   const enter=document.createElement('span');enter.className='v264-enter';enter.textContent='Ava linn →';
   enter.onclick=e=>{e.stopPropagation();a.openCity(x.id);close();};
   row('cmd_city',x.name,x.pop+' elanikku · ruut '+(x.cc+1)+':'+(x.r+1),()=>{a.focusCity('city',x.id);},enter);
  }
 }
}
function toggle(kind){
 if(!panel)build();
 if(!panel.hidden&&mode===kind){close();return;}
 mode=kind;panel.querySelector('input').value='';panel.hidden=false;panel.dataset.kind=kind;fill();
 const btn=$(kind==='army'?'hud-army':'hud-city');
 if(btn){const r=btn.getBoundingClientRect();panel.style.left=Math.max(8,Math.min(window.innerWidth-340,r.left+r.width/2-160))+'px';}
}
window.uiListsV264={toggle,close};

// ---------------------------------------------------------------- main menu portraits
function menuArt(){
 const head=document.querySelector('#startmenu .menu-card');if(!head||head.querySelector('.v264-heroes'))return;
 const h=document.createElement('div');h.className='v264-heroes';h.setAttribute('aria-hidden','true');
 h.innerHTML=['unit_slinger','unit_axeman','unit_spearman'].map(n=>`<img src="ui-art-v263/${n}.webp" alt="">`).join('');
 head.prepend(h);
}

// ---------------------------------------------------------------- wiring
function start(){
 menuArt();regroup();
 const bar=$('resources');
 if(bar){new MutationObserver(()=>{if(!regrouping)regroup();}).observe(bar,{childList:true});
  bar.addEventListener('mouseover',e=>{const c=e.target.closest('.v264-chip');if(c)showPop(c);});
  bar.addEventListener('mouseout',e=>{if(e.target.closest('.v264-chip'))scheduleHide();});
  bar.addEventListener('click',e=>{const c=e.target.closest('.v264-chip');if(!c)return;if(c.classList.contains('open')&&shown===c.dataset.group)hidePop();else showPop(c);e.stopPropagation();},true);
  bar.addEventListener('keydown',e=>{const c=e.target.closest('.v264-chip');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();showPop(c);}});}
 document.addEventListener('click',e=>{
  if(!e.target.closest('.v264-chip,#v264-respop'))hidePop();
  if(panel&&!panel.hidden&&!e.target.closest('#v264-listpanel,#hud-army,#hud-city'))close();
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel&&!panel.hidden)close();});
 // the list only makes sense on the world map
 setInterval(()=>{if(panel&&!panel.hidden){if(api()?.view()!=='world')close();else fill();}},1500);
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();}
