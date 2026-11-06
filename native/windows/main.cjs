'use strict';
const {app,BrowserWindow,protocol,ipcMain,dialog}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path');
const {ContentStore}=require('./shared/content-store.cjs'),network=require('./shared/network.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'kingdoms',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true}}]);
const smoke=process.argv.includes('--native-smoke');
if(!smoke&&!app.requestSingleInstanceLock())app.exit(0);
app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus();}});
if(smoke){app.commandLine.appendSwitch('no-sandbox');app.commandLine.appendSwitch('enable-unsafe-swiftshader');app.commandLine.appendSwitch('use-gl','angle');app.commandLine.appendSwitch('use-angle','swiftshader');app.setPath('userData',path.join(app.getPath('temp'),'kuningriigid-smoke-'+process.pid));}
let win,store,closing=false,timer,healthTimer,launch,smokePass=0;const rendererErrors=[];
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.wasm':'application/wasm','.woff2':'font/woff2','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const pageSave="(async()=>{if(!window.gameDebug?.saveForNativeV1)return false;return await window.gameDebug.saveForNativeV1();})()";
async function saved(){try{return await Promise.race([win.webContents.executeJavaScript(pageSave),new Promise(r=>setTimeout(()=>r(false),15000))]);}catch{return false;}}
function status(data){if(win&&!win.isDestroyed())win.webContents.send('native-status',data);}
async function openGame(){clearTimeout(timer);clearInterval(healthTimer);launch=await store.beginLaunch();await win.loadURL(`kingdoms://game/${launch.manifest.version}/index.html`);let checking=false;
 healthTimer=setInterval(async()=>{if(checking||!win||win.isDestroyed())return;checking=true;try{const ok=await win.webContents.executeJavaScript("!!window.gameDebug && document.getElementById('menu-status')?.hidden===true");if(ok){clearInterval(healthTimer);clearTimeout(timer);await store.healthy();if(smoke){const display=await win.webContents.executeJavaScript("(async()=>{const a=await window.KuningriigidWindow.setMode('borderless');const b=await window.KuningriigidWindow.setMode('windowed');return !!a.ok&&!!b.ok;})()");if(!display)throw Error('Native display mode bridge failed');const result=await win.webContents.executeJavaScript("({title:document.title,renderer:!!window.gameDebug.rendererV328,url:location.href,save:typeof window.gameDebug.saveForNativeV1,sentinel:localStorage.getItem('native-smoke')})");result.saved=await saved();result.errors=rendererErrors;console.log('NATIVE_SMOKE '+JSON.stringify(result));if(!result.renderer||!result.saved||rendererErrors.length){app.exit(1);return;}if(smokePass++===0){await win.webContents.executeJavaScript("localStorage.setItem('native-smoke','kept-across-revisions')");const staged=await store.stage({...store.base,version:'ffffffffffffffffffffffffffffffffffffffff',sequence:store.base.sequence+1},async()=>{throw Error('Unchanged content must not download');});console.log('NATIVE_SMOKE_DELTA '+JSON.stringify(staged));await openGame();}else{const out=process.env.NATIVE_SMOKE_OUT?path.resolve(process.env.NATIVE_SMOKE_OUT):path.resolve(__dirname,'../dist');await fs.mkdir(out,{recursive:true});await win.webContents.executeJavaScript("document.getElementById('continue').click();new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");await new Promise(r=>setTimeout(r,1000));result.menuHidden=await win.webContents.executeJavaScript("document.getElementById('startmenu').hidden");const preview=await win.webContents.capturePage();result.preview=preview.getSize();if(result.preview.width<320||result.preview.height<200)throw Error('Empty native preview');await fs.writeFile(path.join(out,'native-game.png'),preview.toPNG());await fs.writeFile(path.join(out,'native-smoke.json'),JSON.stringify(result,null,2));app.exit(result.sentinel==='kept-across-revisions'?0:1);}}}}catch(e){if(smoke){console.error(e);app.exit(1);}}finally{checking=false;}},1000);
 timer=setTimeout(async()=>{clearInterval(healthTimer);if(smoke){console.error('NATIVE_SMOKE startup timeout');app.exit(1);return;}if(await store.rollback()){status({message:'Uus versioon ei käivitunud. Taastan eelmise.'});await openGame();}else status({message:'Mängu laadimine võtab kaua aega. Proovi rakendus uuesti avada.'});},120000);
 if(!smoke){if(launch.rolledBack)status({message:'Eelmine toimiv versioon taastatud.'});checkUpdate();}
}
async function checkUpdate(){try{const r=await store.stage(await network.check(),network.download,p=>status({message:`Uuenduse laadimine: ${(p.downloaded/1048576).toFixed(1)} MB`}));if(r.status==='ready')status({message:`${r.version}: uuendus valmis (${(r.downloaded/1048576).toFixed(1)} MB).`,restart:true});}catch(e){console.log('Update unavailable:',e.message);}}
if(smoke)setTimeout(()=>{console.error('Native smoke total timeout');app.exit(1);},300000).unref();
app.whenReady().then(async()=>{
 store=await new ContentStore(path.join(app.getPath('userData'),'content'),app.isPackaged?path.join(process.resourcesPath,'game'):path.resolve(__dirname,'../dist/game')).init();
 protocol.handle('kingdoms',async request=>{try{const u=new URL(request.url);if(u.hostname!=='game'||!['GET','HEAD'].includes(request.method))return new Response(null,{status:403});const parts=u.pathname.slice(1).split('/'),revision=parts.shift(),resource=decodeURIComponent(parts.join('/'));const file=await store.resolve(revision,resource);if(!file)return new Response(null,{status:404});return new Response(request.method==='HEAD'?null:await fs.readFile(file),{headers:{'Content-Type':mime[path.extname(resource)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});}catch{return new Response(null,{status:404});}});
 win=new BrowserWindow({width:1400,height:900,backgroundColor:'#121b1b',autoHideMenuBar:true,show:true,webPreferences:{backgroundThrottling:!smoke,preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
 ipcMain.handle('native-display-mode',(event,mode)=>{
  if(event.sender!==win.webContents||!['windowed','fullscreen','borderless'].includes(mode))return {ok:false,error:'Kuvarežiimi päring lükati tagasi.'};
  try{win.setFullScreen(mode!=='windowed');return {ok:true};}catch(error){return {ok:false,error:String(error.message||error)};}
 });
 win.webContents.on('console-message',({level,message})=>{if(level==='error'){rendererErrors.push(message);console.error('RENDERER_ERROR',message);}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('kingdoms://game/'))event.preventDefault();});
 win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
 win.webContents.session.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_details,callback)=>callback({cancel:true}));
 win.webContents.session.on('will-download',(_e,item)=>{item.setSaveDialogOptions({title:'Salvesta Kuningriikide fail'});});
 win.on('close',async e=>{if(closing||smoke)return;e.preventDefault();if(await saved()){closing=true;win.close();}else{const {response}=await dialog.showMessageBox(win,{type:'warning',buttons:['Jää mängu','Välju salvestamata'],defaultId:0,cancelId:0,message:'Viimast mänguseisu ei õnnestunud salvestada.'});if(response===1){closing=true;win.close();}}});
 ipcMain.on('native-restart',async()=>{if(await saved())await openGame();else status({message:'Uuenduse eelne salvestamine ei õnnestunud. Uuendus ootab järgmist käivitust.'});});
 await openGame();
}).catch(e=>{console.error(e);app.exit(1);});
app.on('window-all-closed',()=>app.quit());
