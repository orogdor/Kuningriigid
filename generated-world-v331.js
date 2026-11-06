// Immutable generated geography belongs to the saved game. Large data lives in
// IndexedDB; portable JSON saves carry the same compressed payload inline.
import {packSave,unpackSave} from './save-compression-v256.js';
const worlds=new WeakMap(),payloads=new WeakMap(),writes=new WeakMap(),stored=new WeakSet();
let database;
function identity(s){return [s.seed,s.type??null,s.geographyVersion??0,s.worldScaleVersion??0];}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function refFor(s,w){return {schema:1,id:w.id,identity:identity(s),cols:w.cols,rows:w.rows};}
function validate(s,w,ref=s.generatedWorldV331){
 if(!w||w.schema!==1||!same(w.identity,identity(s))||!Number.isInteger(w.cols)||!Number.isInteger(w.rows)||w.cols<1||w.rows<1||w.cols*w.rows>100000||!Array.isArray(w.cells)||w.cells.length!==w.cols*w.rows||!Array.isArray(w.startLocations))throw Error('Salvestatud maailma andmed on vigased või ei vasta mänguseisule.');
 if(ref&&(ref.schema!==1||ref.id!==w.id||ref.cols!==w.cols||ref.rows!==w.rows||!same(ref.identity,w.identity)))throw Error('Salvestatud maailma viide ei vasta mänguseisule.');
 for(let i=0;i<w.cells.length;i++){const c=w.cells[i];if(!c||c.c!==i%w.cols||c.r!==Math.floor(i/w.cols)||!Number.isFinite(c.x)||!Number.isFinite(c.z)||!Number.isFinite(c.h)||!Array.isArray(c.detail?.heights)||c.detail.heights.length!==81||!Array.isArray(c.detail.resources)||!c.detail.heights.every(Number.isFinite)||!c.detail.resources.every(r=>Array.isArray(r)&&r.length===3&&Number.isInteger(r[0])&&r[0]>=0&&r[0]<=4&&Number.isFinite(r[1])&&Number.isFinite(r[2])))throw Error('Salvestatud maailma ruut on vigane.');}
 return w;
}
function decode(s,payload){
 if(typeof payload!=='string'||payload.length>64*1024*1024)throw Error('Salvestatud maailma fail on liiga suur või vigane.');
 const packed=JSON.parse(payload);if(packed.encoding!=='world-chunks-v1'||!Array.isArray(packed.cells)||packed.cells.length>1000)throw Error('Salvestatud maailma vorming on vigane.');
 const w=JSON.parse(unpackSave(packed.header));w.cells=[];
 for(const chunk of packed.cells){const cells=JSON.parse(unpackSave(chunk));if(!Array.isArray(cells)||cells.length>256)throw Error('Salvestatud maailma plokk on vigane.');w.cells.push(...cells);}
 return validate(s,w);
}
function attach(s,w,payload){worlds.set(s,w);if(payload)payloads.set(s,payload);s.generatedWorldV331=refFor(s,w);return w;}
export function captureGeneratedWorldV331(game){
 const s=game.s,id=globalThis.crypto?.randomUUID?.()||s.seed+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 // References are packed once before the first frame. Mutable city resources
 // and later bridge/building changes remain in the normal game state.
 worlds.set(s,{schema:1,id,identity:identity(s),cols:game.cols,rows:game.rows,cells:game.cells,continents:game.continents,startLocations:game.startLocations,startPassages:game.startPassages,lakeOutletsV275:game.lakeOutletsV275,fishDistance:game.fishDistance});
}
export function restoreGeneratedWorldV331(s,cols,rows){
 if(!s.generatedWorldV331)return null;
 let w=worlds.get(s);if(!w&&s.generatedWorldV331.payload){const p=s.generatedWorldV331.payload;w=attach(s,decode(s,p),p);}
 if(!w)throw Error('Salvestatud maailm puudub. Impordi maailmaga salvestus või taasta varukoopia.');
 validate(s,w);if(w.cols!==cols||w.rows!==rows)throw Error('Salvestatud maailma mõõtmed ei sobi selle mänguversiooniga.');return w;
}
function db(){
 if(!globalThis.indexedDB)return Promise.reject(Error('Maailma püsisalvestus pole saadaval.'));
 if(database)return database;
 database=new Promise((resolve,reject)=>{const r=indexedDB.open('kingdoms-generated-world-v331',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('worlds'))r.result.createObjectStore('worlds');};r.onsuccess=()=>{const d=r.result;d.onversionchange=()=>{d.close();database=null;};resolve(d);};r.onerror=()=>{database=null;reject(r.error||Error('Maailma salvestusruumi ei saa avada.'));};r.onblocked=()=>reject(Error('Maailma salvestusruum on teises aknas hõivatud.'));});return database;
}
export const generatedWorldStorageV331={
 async read(id){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('worlds','readonly'),r=t.objectStore('worlds').get(id);t.oncomplete=()=>resolve(r.result??null);t.onerror=t.onabort=()=>reject(t.error||Error('Maailma lugemine ebaõnnestus.'));});},
 async write(id,payload){const d=await db();await new Promise((resolve,reject)=>{const t=d.transaction('worlds','readwrite');t.objectStore('worlds').put(payload,id);t.oncomplete=()=>resolve();t.onerror=t.onabort=()=>reject(t.error||Error('Maailma salvestamine ebaõnnestus.'));});}
};
export async function hydrateGeneratedWorldV331(s,storage=generatedWorldStorageV331){
 const ref=s.generatedWorldV331;if(!ref)return false;
 if(worlds.has(s)){validate(s,worlds.get(s));return true;}
 const embedded=typeof ref.payload==='string',payload=embedded?ref.payload:await storage.read(ref.id);
 if(!payload)throw Error('Selle salvestuse maailm puudub seadmes. Impordi eksporditud salvestus, kus maailm on kaasas.');
 attach(s,decode(s,payload),payload);if(!embedded)stored.add(s);return true;
}
function packedWorld(s){
 if(payloads.has(s))return payloads.get(s);
 const w=worlds.get(s);if(!w)throw Error('Mängu maailm pole salvestamiseks valmis.');validate(s,w,s.generatedWorldV331);
 // Bound temporary allocation: never stringify the entire generated world at once.
 const {cells,...header}=w,replacer=(_k,v)=>ArrayBuffer.isView(v)?Array.from(v):v;
 const packed={encoding:'world-chunks-v1',header:packSave(JSON.stringify(header,replacer)),cells:[]};
 for(let i=0;i<cells.length;i+=256)packed.cells.push(packSave(JSON.stringify(cells.slice(i,i+256))));
 const payload=JSON.stringify(packed);if(payload.length>64*1024*1024)throw Error('Genereeritud maailm on salvestamiseks liiga suur.');
 payloads.set(s,payload);s.generatedWorldV331=refFor(s,w);return payload;
}
export async function persistGeneratedWorldV331(s,storage=generatedWorldStorageV331){
 if(stored.has(s))return;
 if(writes.has(s))return writes.get(s);
 const job=(async()=>{const payload=packedWorld(s);try{await storage.write(s.generatedWorldV331.id,payload);stored.add(s);s.generatedWorldV331=refFor(s,worlds.get(s));}catch(error){
  // The self-contained fallback must be saved successfully by the normal save
  // transaction. Never publish a dangling reference after a quota/storage error.
  s.generatedWorldV331={...refFor(s,worlds.get(s)),payload};
 }})();writes.set(s,job);try{await job;}finally{writes.delete(s);}
}
export async function portableGeneratedWorldSaveV331(s,serialized){
 const payload=packedWorld(s),plain=JSON.parse(serialized);plain.generatedWorldV331={...refFor(s,worlds.get(s)),payload};return JSON.stringify(plain);
}
export async function importGeneratedWorldV331(s,storage=generatedWorldStorageV331){
 if(!s.generatedWorldV331)return s;await hydrateGeneratedWorldV331(s,storage);await persistGeneratedWorldV331(s,storage);return s;
}
export function generatedWorldStatusV331(game){const w=worlds.get(game.s);return {source:game.worldSourceV331||'unknown',loadMs:Math.round(game.worldLoadMsV331||0),id:game.s.generatedWorldV331?.id||null,cells:game.cells.length,persisted:stored.has(game.s),payloadBytes:payloads.get(game.s)?.length||0,hasWorld:!!w};}
