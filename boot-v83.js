// V336: show a real interactive start menu before importing the large game module.
// Installed legacy APK/EXE shells still require the full renderer startup signal;
// keep their eager initialization until the shell protocol can be upgraded safely.
const status=document.getElementById('menu-status');
const english=()=>document.getElementById('menulanguage')?.value!=='et';
const byId=id=>document.getElementById(id);
let loading=null;
function showError(error){
 console.error('Game startup failed:',error);
 if(window.KINGDOMS_WEBGPU_WANTED_V227)window.KINGDOMS_WEBGPU_RECOVER_V227?.(error);
 byId('startmenu').hidden=false;
 status.classList.add('menu-error');status.hidden=false;
 status.textContent=english()?'The game could not start. Error: '+String(error?.message||error):'Mängu käivitamine ebaõnnestus. Viga: '+String(error?.message||error);
 const retry=document.createElement('button');retry.textContent=english()?'Reload page':'Laadi leht uuesti';retry.onclick=()=>location.reload();status.append(retry);
 const details=document.createElement('details'),summary=document.createElement('summary'),message=document.createElement('p');
 summary.textContent=english()?'Error details':'Vea üksikasjad';details.open=true;message.style.whiteSpace='pre-wrap';message.style.overflowWrap='anywhere';message.textContent=String(error?.stack||error?.message||error);
 details.append(summary,message);status.append(details);
}
async function startEngine(openContinue=false){
 if(loading)return loading;
 status.classList.remove('menu-error');status.hidden=false;
 status.textContent=english()?'Loading game…':'Mängu laadimine…';
 loading=(async()=>{
  try{
   await import('./civilization.js?v=336a');
   if(!window.gameDebug)throw new Error('Game initialization did not finish');
   for(const id of ['continue','newgame','quality','v51export','v51import'])byId(id).disabled=false;
   status.hidden=true;
   if(openContinue)byId('continue').click(); // The real game now owns its click handler.
  }catch(error){showError(error);throw error;}
 })();
 return loading;
}
async function newWorld(){
 if(loading)return;
 const btn=byId('newgame');
 btn.disabled=true;status.hidden=false;status.textContent=english()?'Generating world…':'Maailma loomine…';
 try{
  const [{createGame},{replaceProtectedGame}]=await Promise.all([
   import('./civilization-core.js?v=2273'),import('./save-safety-v73.js?v=256')
  ]);
  const raw=byId('seed').value.trim();
  const seed=raw?Array.from(raw).reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0):Math.floor(Math.random()*2147483647);
  const state=createGame(seed,byId('maptype').value);
  state.difficulty=byId('difficulty')?.value||'normal';
  state.migrationV274={until:120};state.peaceUntilV276=1200;state.tempo='normal';
  const valid=v=>v?.version===4&&Number.isFinite(v.seed)&&Array.isArray(v.cities)&&Array.isArray(v.settlers)&&Array.isArray(v.units)&&Array.isArray(v.armies);
  replaceProtectedGame(localStorage,JSON.stringify(state),valid);
  sessionStorage.setItem('kingdoms-civ-start','1');
  await startEngine();
 }catch(error){btn.disabled=false;showError(error);}
}
const query=new URLSearchParams(location.search);
const nativeLegacy=!!(window.KuningriigidNative||window.KuningriigidWindow);
if(nativeLegacy||query.has('demo')||query.has('autostart')||sessionStorage.getItem('kingdoms-civ-start')){
 // Existing native updaters consider a version healthy only after gameDebug exists.
 startEngine().catch(()=>{});
}else{
 // The initial menu needs no Civilization instance, generated world, WebGL context or tree meshes.
 for(const id of ['continue','newgame'])byId(id).disabled=false;
 status.hidden=true;
 byId('continue').onclick=()=>startEngine(true).catch(()=>{});
 byId('newgame').onclick=newWorld;
 // These controls depend on the full game UI; initialize it when they are first used.
 byId('quality').disabled=false;
 byId('quality').onclick=()=>startEngine().then(()=>byId('quality').click()).catch(()=>{});
 byId('menu-saves')?.addEventListener('toggle',e=>{if(e.target.open)startEngine().catch(()=>{});},{once:true});
 window.KUNINGRIIGID_MENU_READY_V336=true;
}
