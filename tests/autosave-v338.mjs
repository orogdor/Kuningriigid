import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync(new URL('../civilization.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const boot=fs.readFileSync(new URL('../boot-v83.js',import.meta.url),'utf8');

assert.match(code,/const AUTOSAVE_INTERVAL_SECONDS_V338=5\*60;/);
assert.match(code,/const dt=menuOpen\|\|paused\|\|document\.hidden\?0:real;/);
assert.match(code,/tickAutosave\(dt\)/);
assert.equal((code.match(/\bsave\(\)/g)||[]).length,3,'Only the helper, its timer and the explicit native bridge may reference save()');
assert.doesNotMatch(code,/addEventListener\('pagehide',save\)|if\(document\.hidden\)save\(\)/);
assert.match(code,/const saveButton=.*?localStorage\.setItem\(V51_SLOT_PREFIX\+i,packSave\(serialized\)\)/);
assert.match(html,/<div id="autosave-notice" role="status" hidden><\/div>/);

const notice={hidden:true,textContent:''};
const timerCallbacks=[];
let now=0;
let saveCount=0;
let saveResult=true;
const context=vm.createContext({
 notice,$:()=>notice,document:{documentElement:{lang:'et'}},
 setTimeout:(callback,ms)=>timerCallbacks.push({callback,ms}),performance:{now:()=>now},
 save:async()=>{
  assert.equal(notice.hidden,false);
  assert.equal(notice.textContent,'Automaatsalvestus…');
  saveCount++;
  return saveResult;
 }
});

const scheduler=code.slice(code.indexOf('async function runAutosave()'),code.indexOf('function activeCity()'));
vm.runInContext('let saveTimer=0,autosavePending=false,autosaveNoticeUntil=0;const canAutosave=true,restarting=false,AUTOSAVE_INTERVAL_SECONDS_V338=5*60;'+scheduler,context);
const tick=seconds=>context.tickAutosave(seconds);
tick(299);
tick(0);
assert.equal(notice.hidden,true);
tick(1);
assert.equal(notice.textContent,'Automaatsalvestus…');
assert.equal(saveCount,0);
assert.equal(timerCallbacks[0].ms,250);
timerCallbacks.shift().callback();
await new Promise(setImmediate);
assert.equal(saveCount,1);
assert.equal(notice.textContent,'Automaatsalvestus tehtud');
now=3999;
tick(0);
assert.equal(notice.hidden,false);
now=4000;
tick(0);
assert.equal(notice.hidden,true);
saveResult=false;
tick(300);
timerCallbacks.shift().callback();
await new Promise(setImmediate);
assert.equal(saveCount,2);
assert.equal(notice.textContent,'Automaatsalvestus ebaõnnestus');

const version=Number(html.match(/<title>Kuningriigid · V(\d+)<\/title>/)?.[1]);
assert.ok(version>=338);
const startupKey=html.match(/src="boot-v83\.js\?v=(\d+[a-z])"/)?.[1]??'';
assert.match(startupKey,new RegExp(`^${version}[a-z]$`));
assert.match(boot,new RegExp(`import\\('\\./civilization\\.js\\?v=${startupKey}'\\)`));
console.log('PASS: action handling, five active minutes, notice before saving, success and failure feedback, manual save and startup');
