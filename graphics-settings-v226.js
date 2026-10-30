// V226 – central, persistent graphics settings and menu. No gameplay state is changed.
export const GRAPHICS_KEY_V226='kingdoms-graphics-v226';
export const GRAPHICS_DEFAULTS_V226=Object.freeze({
 preset:'high',renderer:'webgl',resolution:100,viewDistance:'far',
 shadows:'medium',shadowDistance:'medium',unitShadows:true,soldierNames:true,
 lighting:'enhanced',lightingEngine:'pbr',lightingLook:'natural',toneMap:'agx',ambient:'normal',daylight:'dynamic',
 terrainBlending:true,water:'animated',clouds:true,wind:true,fog:'medium',
 sky:'enhanced',particles:'medium',buildingDetail:'high',unitDetail:'high',
 vegetation:'medium',lod:'balanced',fpsLimit:'60',
 antiAlias:'msaa',texture:'high',postProcessing:true,
 uiScale:100,performanceOverlay:false,adaptiveResolution:true
});
export const GRAPHICS_PRESETS_V226={
 low:{lightingEngine:'classic',lightingLook:'fast',toneMap:'none',resolution:70,viewDistance:'near',shadows:'off',shadowDistance:'near',unitShadows:false,lighting:'classic',ambient:'normal',daylight:'dynamic',terrainBlending:false,water:'simple',clouds:false,wind:false,fog:'near',sky:'simple',particles:'off',buildingDetail:'low',unitDetail:'low',vegetation:'low',lod:'performance',fpsLimit:'30',texture:'low',postProcessing:false,adaptiveResolution:true},
 medium:{lightingEngine:'pbr',lightingLook:'natural',toneMap:'agx',resolution:85,viewDistance:'medium',shadows:'low',shadowDistance:'near',unitShadows:false,lighting:'standard',ambient:'normal',daylight:'dynamic',terrainBlending:true,water:'animated',clouds:false,wind:true,fog:'medium',sky:'enhanced',particles:'low',buildingDetail:'medium',unitDetail:'medium',vegetation:'medium',lod:'balanced',fpsLimit:'60',texture:'medium',postProcessing:true,adaptiveResolution:true},
 high:{lightingEngine:'pbr',lightingLook:'natural',toneMap:'agx',resolution:100,viewDistance:'far',shadows:'medium',shadowDistance:'medium',unitShadows:true,lighting:'enhanced',ambient:'normal',daylight:'dynamic',terrainBlending:true,water:'animated',clouds:true,wind:true,fog:'medium',sky:'enhanced',particles:'medium',buildingDetail:'high',unitDetail:'high',vegetation:'high',lod:'balanced',fpsLimit:'60',texture:'high',postProcessing:true,adaptiveResolution:true},
 ultra:{lightingEngine:'physical',lightingLook:'film',toneMap:'agx',resolution:125,viewDistance:'ultra',shadows:'high',shadowDistance:'far',unitShadows:true,lighting:'cinematic',ambient:'bright',daylight:'dynamic',terrainBlending:true,water:'animated',clouds:true,wind:true,fog:'far',sky:'enhanced',particles:'high',buildingDetail:'high',unitDetail:'high',vegetation:'high',lod:'quality',fpsLimit:'unlimited',texture:'high',postProcessing:true,adaptiveResolution:false}
};
export const LIGHTING_LOOKS_V235=Object.freeze({
 natural:{lightingEngine:'pbr',lighting:'enhanced',toneMap:'agx',ambient:'normal',postProcessing:true,shadows:'medium'},
 film:{lightingEngine:'physical',lighting:'cinematic',toneMap:'agx',ambient:'normal',postProcessing:true,shadows:'high'},
 soft:{lightingEngine:'pbr',lighting:'standard',toneMap:'neutral',ambient:'bright',postProcessing:true,shadows:'low'},
 fast:{lightingEngine:'classic',lighting:'classic',toneMap:'none',ambient:'normal',postProcessing:false,shadows:'low'},
 toon:{lightingEngine:'toon',lighting:'enhanced',toneMap:'neutral',ambient:'bright',postProcessing:true,shadows:'medium'}
});
const choices={
 lightingLook:[['natural','Natural · PBR + AgX'],['film','Filmilik · Physical + AgX'],['soft','Pehme · PBR + Neutral'],['fast','Kiire · Lambert'],['toon','Toon · stiliseeritud'],['custom','Kohandatud']],
 toneMap:[['agx','AgX · looduslik'],['neutral','Neutral · puhas'],['aces','ACES · filmilik'],['none','Väljas']],

 lightingEngine:[['classic','Classic · Lambert'],['pbr','PBR · Standard'],['physical','PBR · Physical'],['toon','Toon · stiliseeritud']],
 preset:[['low','Low'],['medium','Medium'],['high','High'],['ultra','Ultra'],['custom','Custom']],
 renderer:[['webgl','WebGL · kindel'],['webgpu','WebGPU · katseversioon'],['auto','Auto · WebGL varuvariant']],
 resolution:[[50,'50%'],[70,'70%'],[75,'75%'],[85,'85%'],[100,'100%'],[125,'125%'],[150,'150%']],
 viewDistance:[['near','Lähedal'],['medium','Keskmine'],['far','Kaugel'],['ultra','Väga kaugel']],
 shadows:[['off','Väljas'],['low','Madal'],['medium','Keskmine'],['high','Kõrge']],
 shadowDistance:[['near','Lühike'],['medium','Keskmine'],['far','Pikk']],
 lighting:[['classic','Classic'],['standard','Standard'],['enhanced','Enhanced'],['cinematic','Cinematic']],
 ambient:[['low','Tumedam'],['normal','Tavaline'],['bright','Heledam']],
 daylight:[['dynamic','24 h tsükkel (1 min = 1 tund)'],['day','Keskpäev · test'],['evening','Õhtu · test'],['night','Öö · test']],
 fog:[['off','Väljas'],['near','Tihe / lähedal'],['medium','Tavaline'],['far','Hõre / kaugel']],
 water:[['simple','Lihtne'],['animated','Animeeritud']],
 sky:[['simple','Lihtne'],['enhanced','Gradienttaevas']],
 particles:[['off','Väljas'],['low','Madal'],['medium','Keskmine'],['high','Kõrge']],
 buildingDetail:[['low','Madal'],['medium','Keskmine'],['high','Kõrge']],
 unitDetail:[['low','Madal'],['medium','Keskmine'],['high','Kõrge']],
 vegetation:[['low','Vähe'],['medium','Keskmiselt'],['high','Palju']],
 lod:[['performance','Jõudlus'],['balanced','Tasakaal'],['quality','Kvaliteet']],
 fpsLimit:[['30','30 FPS'],['60','60 FPS'],['120','120 FPS'],['unlimited','Piiramata']],
 antiAlias:[['off','Väljas'],['msaa','MSAA (taaskäivitus)']],
 texture:[['low','Madal (1×)'],['medium','Keskmine (2×)'],['high','Kõrge (4×)']],
 uiScale:[[80,'80%'],[100,'100%'],[125,'125%'],[150,'150%']]
};
const groups=[
 ['Üldine',[['preset','Graafikaprofiil'],['renderer','Renderdusmootor'],['resolution','Resolutsiooniskaala'],['viewDistance','Nähtavuskaugus'],['antiAlias','Servade silumine'],['fpsLimit','FPS piirang'],['adaptiveResolution','Automaatne resolutsioon']]],
 ['Valgus ja varjud',[['lightingLook','Valgustuse võrdlusprofiil'],['toneMap','Värviesitus'],['lightingEngine','Valgustusmootor'],['lighting','Valguse iseloom'],['ambient','Üldvalguse heledus'],['daylight','Päevaaeg / päikese liikumine'],['shadows','Varjude kvaliteet'],['shadowDistance','Varjude kaugus'],['unitShadows','Üksuste varjud']]],
 ['Maailm ja efektid',[['terrainBlending','Maastikutüüpide üleminekud'],['water','Vee kvaliteet'],['clouds','Pilvevarjud'],['wind','Taimede tuuleliikumine'],['fog','Udu'],['sky','Taeva kvaliteet'],['particles','Osakesed ja taevaefektid']]],
 ['Detailid',[['buildingDetail','Hoonete LOD'],['unitDetail','Üksuste detailide kuvamine'],['soldierNames','Sõdurite nimed'],['vegetation','Taimestiku tihedus'],['lod','LOD agressiivsus'],['texture','Tekstuuride filtreerimine']]],
 ['Lisaseaded',[['postProcessing','Filmiline toonikaardistus'],['uiScale','Kasutajaliidese suurus'],['performanceOverlay','FPS ja renderdusstatistika']]]
];
const booleans=new Set(['soldierNames','unitShadows','terrainBlending','clouds','wind','postProcessing','performanceOverlay','adaptiveResolution']);
function validate(base){const out={...GRAPHICS_DEFAULTS_V226};for(const [key,value] of Object.entries(base||{})){
 if(!(key in out))continue;
 if(booleans.has(key)){if(typeof value==='boolean')out[key]=value;}
 else if(choices[key]?.some(([v])=>v===value))out[key]=value;
}return out;}
export function loadGraphicsSettingsV226(){
 let obj=null;try{obj=JSON.parse(localStorage.getItem(GRAPHICS_KEY_V226)||'null')}catch{}
 if(!obj){let old='high';try{old=localStorage.getItem('kingdoms-quality')||'high'}catch{}
  let oldGPU=false;try{oldGPU=localStorage.getItem('kingdoms-gpu')==='1'}catch{}
  return validate({...GRAPHICS_DEFAULTS_V226,...(GRAPHICS_PRESETS_V226[old]||GRAPHICS_PRESETS_V226.high),preset:old==='low'?'low':old==='medium'?'medium':'high',renderer:oldGPU?'webgpu':'webgl'});}
 // Existing V234 users usually have the old fixed 'day' saved. Migrate it
 // exactly once, then respect any explicit fixed-hour test selection.
 try{
  const key='kingdoms-v235-cycle-migrated';
  if(!localStorage.getItem(key)){
   if(obj.daylight==='day')obj.daylight='dynamic';
   localStorage.setItem(key,'1');
   localStorage.setItem(GRAPHICS_KEY_V226,JSON.stringify(obj));
  }
 }catch{}
 return validate(obj);
}
export function saveGraphicsSettingsV226(settings){try{localStorage.setItem(GRAPHICS_KEY_V226,JSON.stringify(validate(settings)));localStorage.setItem('kingdoms-quality',settings.preset==='low'?'low':settings.preset==='medium'?'medium':'high');}catch{}}
export function graphicsViewFactorV226(s){return {near:.56,medium:.76,far:1,ultra:1.33}[s.viewDistance]||1;}
export function graphicsNearDistanceV226(s){const detail={low:.5,medium:.75,high:1}[s.buildingDetail]||1;const lod={performance:.67,balanced:1,quality:1.25}[s.lod]||1;return Math.max(25,Math.min(240,100*graphicsViewFactorV226(s)*lod*detail));}
export function graphicsVegetationQualityV226(s){return s.vegetation;}
export function autoGraphicsPresetV226(){
 const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent||'');
 const mem=navigator.deviceMemory||0,cores=navigator.hardwareConcurrency||0,pixels=(screen.width||1280)*(screen.height||720);
 return mobile||mem&&mem<=4||cores&&cores<=4?'low':mem>=12&&cores>=12&&pixels>=1500000?'high':'medium';
}
export function buildGraphicsMenuV226(settings,onChange){
 const anchor=document.querySelector('#startmenu .menu-utilities');if(!anchor)return;
 let root=document.getElementById('menu-graphics-v226');if(root)return;
 root=document.createElement('details');root.id='menu-graphics-v226';root.className='graphics-v226';
 const summary=document.createElement('summary');summary.textContent='⚙ Graafika ja jõudlus';root.append(summary);
 const body=document.createElement('div');body.className='graphics-v226-body';root.append(body);
 const description=document.createElement('p');description.className='graphics-v226-note';
 description.textContent='V235: PBR + AgX, filmilik, pehme, kiire ja Toon profiil. Päev kestab 24 minutit: 1 päris minut = 1 mängutund. Päikese aega saab visuaalseks võrdluseks fikseerida. WebGPU on katseline; vigade korral kasutatakse WebGL-i.';body.append(description);
 const controls=new Map(),dirty=new Set();
 function changed(key,value,fromPreset=false){
  if(key==='preset'&&value!=='custom'){Object.assign(settings,GRAPHICS_PRESETS_V226[value]);settings.preset=value;}
  else if(key==='lightingLook'&&value!=='custom'){
   Object.assign(settings,LIGHTING_LOOKS_V235[value]);settings.lightingLook=value;settings.preset='custom';
  }
  else{settings[key]=value;
   if(['lightingEngine','lighting','toneMap','ambient','shadows','postProcessing'].includes(key))settings.lightingLook='custom';
   if(!fromPreset&&key!=='renderer'&&key!=='antiAlias')settings.preset='custom';}
  if(key==='renderer'||key==='antiAlias')dirty.add(key);
  saveGraphicsSettingsV226(settings);
  controls.forEach((control,k)=>{control.value=String(settings[k]);});
  onChange?.(settings,key);
  status.textContent=dirty.size?'Renderdaja või MSAA muutub pärast mängu uuesti laadimist.':'Seaded rakendatud ja salvestatud.';
  restart.hidden=!dirty.size;
 }
 for(const [group,fields] of groups){
  const section=document.createElement('fieldset');section.className='graphics-v226-fieldset';
  const legend=document.createElement('legend');legend.textContent=group;section.append(legend);
  for(const [key,title] of fields){
   const label=document.createElement('label');label.className='graphics-v226-row';
   const span=document.createElement('span');span.textContent=title;label.append(span);
   let control;
   if(booleans.has(key)){control=document.createElement('select');
    for(const [v,t] of [['true','Sees'],['false','Väljas']]){const o=document.createElement('option');o.value=v;o.textContent=t;control.append(o);}
    control.value=String(settings[key]);control.addEventListener('change',()=>changed(key,control.value==='true'));
   }else{control=document.createElement('select');
    for(const [v,t] of choices[key]){const o=document.createElement('option');o.value=String(v);o.textContent=t;if(key==='renderer'&&v==='webgpu'&&!navigator.gpu)o.disabled=true;control.append(o);}
    control.value=String(settings[key]);control.addEventListener('change',()=>changed(key,key==='resolution'||key==='uiScale'?Number(control.value):control.value));
   }
   control.id='graphics-v226-'+key;control.setAttribute('aria-label',title);label.append(control);section.append(label);controls.set(key,control);
  }
  body.append(section);
 }
 const actions=document.createElement('div');actions.className='graphics-v226-actions';
 function action(text,cb){const btn=document.createElement('button');btn.type='button';btn.textContent=text;btn.onclick=cb;actions.append(btn);return btn;}
 action('Tuvasta sobiv profiil',()=>changed('preset',autoGraphicsPresetV226()));
 action('Taasta vaikimisi',()=>{Object.assign(settings,GRAPHICS_DEFAULTS_V226);saveGraphicsSettingsV226(settings);controls.forEach((c,k)=>c.value=String(settings[k]));dirty.add('renderer');dirty.add('antiAlias');restart.hidden=false;onChange?.(settings,'preset');status.textContent='Vaikesätted taastatud; renderdaja muutub pärast laadimist.';});
 const restart=action('Rakenda ja laadi mäng uuesti',()=>{try{sessionStorage.removeItem('kingdoms-gpu-error-v227')}catch{}const u=new URL(location.href);u.searchParams.delete('gpuFallback');u.searchParams.set('gpu',settings.renderer==='webgpu'?'1':'0');location.assign(u.toString());});restart.hidden=true;
 body.append(actions);
 const status=document.createElement('p');status.className='graphics-v226-note';status.setAttribute('role','status');status.textContent='Muutused rakenduvad kohe, välja arvatud renderdaja ja MSAA.';body.append(status);
 anchor.insertAdjacentElement('afterend',root);
 return root;
}
