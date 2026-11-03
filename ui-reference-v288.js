/* V288 — reference-picture world HUD, preserving the actual Kuningriigid controls.
 * Uses real game data supplied by civilization.js and the original V264 handlers.
 * No dummy "end turn": the large round control is the real-time pause/resume.
 */
(() => {
  const $ = id => document.getElementById(id);
  const isEt = () => (document.documentElement.lang || '').startsWith('et');
  const tr = (et,en) => isEt() ? et : en;
  const make=(tag,cls,parent)=>{const el=document.createElement(tag);if(cls)el.className=cls;parent?.append(el);return el;};
  const art = name => 'ui-art-v263/'+name+'.webp';
  const safe=(v)=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const API=()=>window.kingdomsUiV288;
  let lastRivals='',activeDiplomat=null;

  function actionButton(id,cls,artName,label,parent,trigger){
    let b=$(id);if(!b){b=make('button',cls,parent);b.id=id;b.type='button';}
    b.classList.add(cls);b.title=label;b.setAttribute('aria-label',label);
    if(artName)b.style.setProperty('--v288-icon',"url('"+artName+"')");
    if(trigger&&!b.dataset.wired){b.addEventListener('click',trigger);b.dataset.wired='1';}
    return b;
  }
  function mirror(id){const b=$(id);if(b&&!b.disabled)b.click();}
  function buildHeader(){
    const header=document.querySelector('header');if(!header)return;
    if(!$('#v288-era')){
      const chip=make('div','v288-era',header);chip.id='v288-era';
      chip.innerHTML='<img alt="" src="'+art('unit_spearman')+'"><span><b id="v288-age"></b><small id="v288-turn"></small></span>';
      const wordmark=header.querySelector('.v287-wordmark');
      if(wordmark)wordmark.after(chip);else header.prepend(chip);
    }
    if(!$('#v288-header-actions')){
      const actions=make('div','v288-header-actions',header);actions.id='v288-header-actions';
      actionButton('v288-help','v288-icon',art('res_pottery'),tr('Juhend','Help'),actions,()=>mirror('hud-help'));
      actionButton('v288-journal','v288-icon',art('cmd_research'),tr('Päevik','Journal'),actions,()=>mirror('journal'));
      actionButton('v288-settings','v288-icon',art('cmd_city'),tr('Menüü ja seaded','Menu and settings'),actions,()=>mirror('menubtn'));
    }
  }
  function buildResearch(){
    if($('#v288-research'))return;
    const card=make('button','v288-research',document.body);
    card.id='v288-research';card.type='button';
    card.setAttribute('aria-label',tr('Ava uurimused','Open research'));
    card.innerHTML='<span class="v288-section-title">'+tr('Uurimus','Research')+'</span>'+
      '<span class="v288-study"><img src="ui-art-v288/research.svg" alt=""><span><b id="v288-study-name"></b><small id="v288-study-sub"></small><span class="v288-progress"><i></i></span></span></span>';
    card.addEventListener('click',()=>mirror('techtoggle'));
  }
  function buildRivals(){
    if($('#v288-rivals'))return;
    const box=make('aside','v288-rivals',document.body);box.id='v288-rivals';
    box.setAttribute('aria-label',tr('Riikide ülevaade','Kingdom overview'));
    const images=['unit_spearman','unit_axeman','unit_slinger','unit_scout'];
    for(let i=0;i<4;i++){
      const b=make('button','v288-rival',box);b.type='button';b.dataset.team=String(i);
      b.innerHTML='<span class="v288-rival-portrait"><img src="'+art(images[i])+'" alt=""></span><span class="v288-rival-info"><b class="v288-rival-name"></b><small class="v288-rival-stat"></small></span><span class="v288-rival-power"></span>';
      b.addEventListener('click',()=>{if(i===0){window.uiListsV264?.toggle('city');return;}openDiplomacy(i);});
    }
  }
  function buildDiplomacy(){
    if($('#v288-diplomacy-panel'))return;
    const panel=make('section','v288-diplomacy-panel',document.body);panel.id='v288-diplomacy-panel';panel.hidden=true;
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');
    panel.innerHTML='<div class="v288-diplomacy-head"><strong>'+tr('Diplomaatia','Diplomacy')+'</strong><button id="v288-diplomacy-close" type="button" aria-label="'+tr('Sulge','Close')+'">✕</button></div><div id="v288-diplomacy-list"></div><p id="v288-diplomacy-message" role="status"></p>';
    $('#v288-diplomacy-close').addEventListener('click',()=>{panel.hidden=true;activeDiplomat=null;});
  }
  function openDiplomacy(team=null){
    buildDiplomacy();const panel=$('v288-diplomacy-panel');
    if(team==null&&panel.hidden===false){panel.hidden=true;activeDiplomat=null;return;}
    activeDiplomat=team;
    panel.hidden=false;paintDiplomacy();
  }
  function paintDiplomacy(){
    const panel=$('v288-diplomacy-panel');if(!panel||panel.hidden)return;
    const data=API()?.snapshot?.();if(!data)return;
    const list=$('v288-diplomacy-list');list.replaceChildren();
    for(const leader of data.leaders.filter(x=>x.team>0&&(activeDiplomat==null||activeDiplomat===x.team))){
      const line=make('div','v288-diplomacy-row',list);
      const title=make('div','v288-diplomacy-name',line);
      title.innerHTML='<b>'+safe(leader.name)+'</b><small>'+safe(leader.population)+' '+tr('elanikku','population')+' · '+safe(leader.relation)+'</small>';
      const buttons=make('div','v288-diplomacy-actions',line);
      const choices=[['friendly',tr('Sõprus','Friendship')],['neutral',tr('Neutraalne','Neutral')],['war',tr('Sõda','War')]];
      for(const [value,label] of choices){
        const btn=make('button','',buttons);btn.type='button';btn.textContent=label;
        btn.disabled=leader.relation===value;
        btn.addEventListener('click',()=>{
          const result=API()?.diplomacy?.(leader.team,value);
          const message=$('v288-diplomacy-message');
          if(message)message.textContent=result?.error||tr('Suhe muudetud','Relation updated');
          paintDiplomacy();paintRivals(true);
        });
      }
    }
  }
  function buildDock(){
    const tools=$('tools');if(!tools)return;
    if(!$('#v288-diplomacy')){
      const dip=make('button','v288-new-action',tools);dip.id='v288-diplomacy';dip.type='button';
      dip.textContent='Diplomacy';dip.setAttribute('aria-label',tr('Diplomaatia','Diplomacy'));
      dip.addEventListener('click',()=>openDiplomacy());
    }
    for(const [id,name] of [['hud-build','build'],['hud-army','units'],['techtoggle','research'],['v288-diplomacy','diplomacy'],['hud-trade-v276','trade'],['hud-city','empire']]){
      $(id)?.setAttribute('data-v288-card',name);
    }
  }
  function buildMapTools(){
    if($('#v288-map-tools'))return;
    const box=make('div','v288-map-tools',document.body);box.id='v288-map-tools';
    const cfg=[
      ['v288-map-world',art('cmd_map'),tr('Maailmakaart','World map'),'maptoggle'],
      ['v288-map-layer',art('res_stone'),tr('Ressursikihid','Resource layer'),'hud-resource-toggle'],
      ['v288-map-actions',art('cmd_explore'),tr('Kaarditoimingud','Map actions'),'hud-map-details'],
      ['v288-map-plus',art('cmd_map'),tr('Suurenda','Zoom in'),'zin'],
      ['v288-map-minus',art('cmd_map'),tr('Vähenda','Zoom out'),'zout']
    ];
    for(const [id,img,title,original] of cfg){
      const b=actionButton(id,'v288-map-action',img,title,box,()=>mirror(original));
      b.dataset.original=original;
    }
  }
  function buildMapFooter(){
    const panel=$('atlasoverview');if(!panel||$('#v288-map-caption'))return;
    const caption=make('div','v288-map-caption',panel);caption.id='v288-map-caption';
    caption.textContent=tr('Maailmakaart','World map');
  }
  function paintRivals(force=false){
    const data=API()?.snapshot?.();if(!data)return;
    const stamp=data.leaders.map(x=>[x.name,x.population,x.relation].join(':')).join('|');
    if(!force&&stamp===lastRivals)return;
    lastRivals=stamp;
    for(const x of data.leaders){
      const el=document.querySelector('.v288-rival[data-team="'+x.team+'"]');if(!el)continue;
      el.querySelector('.v288-rival-name').textContent=x.name;
      el.querySelector('.v288-rival-stat').textContent=x.team===0?tr('Sinu riik','Your kingdom'):x.relation;
      el.querySelector('.v288-rival-power').textContent=x.population.toLocaleString(isEt()?'et-EE':'en-US');
      el.title=x.name+' · '+x.population+' '+tr('elanikku','population');
    }
  }
  function update(){
    const data=API()?.snapshot?.();
    if(data){
      const age=$('v288-age'),turn=$('v288-turn');
      if(age)age.textContent=data.age;
      if(turn)turn.textContent=tr('Käik ','Turn ')+data.turn;
      const study=$('v288-study-name'),sub=$('v288-study-sub');
      if(study)study.textContent=data.research||tr('Vali uurimus','Choose research');
      if(sub)sub.textContent=data.research?tr('Ava tehnoloogiapuu','Open technology tree'):tr('Uurimus ootab','Research idle');
      const progress=$('v288-research')?.querySelector('.v288-progress>i');if(progress)progress.style.width=String(data.researchPercent||0)+'%';
      if(sub&&data.research)sub.textContent=(data.researchPercent||0)+'% · '+(data.researchRate||0)+' '+tr('teadust/min','research/min');
      const p=$('pause');if(p)p.dataset.v288Paused=String(data.paused);
    }
    paintRivals();
    const active=document.body.classList.contains('ui-paint-v287');
    document.body.classList.toggle('ui-reference-v288',active);
    if(!active&&$('#v288-diplomacy-panel'))$('#v288-diplomacy-panel').hidden=true;
    if($('#v288-research'))$('#v288-research').setAttribute('aria-label',tr('Ava uurimused','Open research'));
    for(const b of document.querySelectorAll('#v288-map-tools [data-original]')){
      const original=$(b.dataset.original);
      b.disabled=!original||original.disabled;
      b.classList.toggle('active',original?.getAttribute('aria-pressed')==='true');
    }
  }
  function start(){
    buildHeader();buildResearch();buildRivals();buildDock();buildMapTools();buildMapFooter();buildDiplomacy();
    update();
    setInterval(update,1100);
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&$('#v288-diplomacy-panel')?.hidden===false){
        $('#v288-diplomacy-panel').hidden=true;activeDiplomat=null;
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();