import assert from 'node:assert/strict';
import {createGame,Civilization} from './civilization-core.js';
import {ACTIVE_SAVE_KEY,BACKUP_SAVE_KEY,decodeValidGame,loadProtectedGame,writeAutosave,replaceProtectedGame} from './save-safety-v73.js';

const valid=v=>v?.version===4&&Number.isFinite(v.seed)&&Array.isArray(v.cities)&&Array.isArray(v.settlers)&&Array.isArray(v.units)&&Array.isArray(v.armies);
const makeStorage=()=>{const items=new Map();return {
 getItem:k=>items.get(k)??null,
 setItem:(k,v)=>items.set(k,String(v)),
 removeItem:k=>items.delete(k),
 items
}};
const old=createGame(20261019);
old.time=90;old.ships=[{id:71,team:0,kind:'transport',hp:180,c:5,r:5,path:[],cargo:{kind:'army',armyId:123}}];
old.units.push({kind:'spearman',team:0,hp:100,armyId:123});
old.armies.push({id:123,team:0,c:5,r:6,path:[],embarked:71});
old.roadTraffic={'5:5':8};
old.research[0].known.push('shipbuilding');
const original=JSON.stringify(old),store=makeStorage();
store.setItem(ACTIVE_SAVE_KEY,original);
store.setItem('kingdoms-v51-slot-1',original);
const newer=structuredClone(old);newer.time=180;newer.events=[{time:170,text:'V72 säilinud'}];
assert.equal(writeAutosave(store,JSON.stringify(newer),180,0,valid),true);
assert.equal(JSON.parse(store.getItem(ACTIVE_SAVE_KEY)).time,180);
assert.equal(JSON.parse(store.getItem(BACKUP_SAVE_KEY)).time,90);
assert.equal(loadProtectedGame(store,valid).state.time,180);
assert.equal(loadProtectedGame(store,valid).recovered,false);
store.setItem(ACTIVE_SAVE_KEY,'{broken json');
assert.equal(loadProtectedGame(store,valid).state.time,90,'corrupt current restores valid backup');
assert.equal(loadProtectedGame(store,valid).recovered,true);
const recovered=new Civilization(loadProtectedGame(store,valid).state);
assert.ok(recovered.s.ships.some(x=>x.cargo?.armyId===123),'V72 transported army survives');
assert.ok(recovered.s.units.some(x=>x.armyId===123),'V72 saved units survive');
assert.ok(recovered.s.research[0].known.includes('shipbuilding'),'old research survives');
assert.deepEqual(recovered.s.roadTraffic,old.roadTraffic,'road usage data survives');
store.setItem(ACTIVE_SAVE_KEY,original);
const imported=structuredClone(old);imported.time=360;
const replacement=replaceProtectedGame(store,JSON.stringify(imported),valid);
assert.equal(replacement.backedUp,true);
assert.equal(JSON.parse(store.getItem(BACKUP_SAVE_KEY)).time,90,'manual load preserves old autosave');
assert.equal(JSON.parse(store.getItem(ACTIVE_SAVE_KEY)).time,360);
assert.equal(store.getItem('kingdoms-v51-slot-1'),original,'legacy manual slots unchanged');
assert.throws(()=>replaceProtectedGame(store,JSON.stringify({version:5}),valid),/Vigane/);
assert.equal(JSON.parse(store.getItem(ACTIVE_SAVE_KEY)).time,360,'invalid import does not overwrite the current game');
assert.equal(decodeValidGame('{',valid),null);
const lowQuota=makeStorage();
lowQuota.setItem(ACTIVE_SAVE_KEY,original);
const originalSet=lowQuota.setItem;
lowQuota.setItem=(k,v)=>{if(k===BACKUP_SAVE_KEY)throw Error('Quota exceeded');return originalSet(k,v)};
const latest=structuredClone(old);latest.time=720;
assert.equal(writeAutosave(lowQuota,JSON.stringify(latest),720,0,valid),false,'backup failure is not a primary-save failure');
assert.equal(JSON.parse(lowQuota.getItem(ACTIVE_SAVE_KEY)).time,720);
assert.equal(replaceProtectedGame(lowQuota,JSON.stringify(old),valid).backedUp,false);
assert.equal(JSON.parse(lowQuota.getItem(ACTIVE_SAVE_KEY)).time,90,'import survives backup quota failure');
const failed=makeStorage();failed.setItem(ACTIVE_SAVE_KEY,original);const setter=failed.setItem;
failed.setItem=(k,v)=>{if(k===ACTIVE_SAVE_KEY)throw Error('Primary storage blocked');return setter(k,v)};
assert.throws(()=>replaceProtectedGame(failed,JSON.stringify(imported),valid),/Primary storage blocked/);
assert.equal(failed.getItem(ACTIVE_SAVE_KEY),original,'failed import preserves current save');
console.log('V73 SAVE PASS: V72 cargo, research, roads, legacy slots, backup fallback, invalid imports and low-quota recovery');
