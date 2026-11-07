// Renderer-only, replaceable cache. No saved game or mutable simulation data is stored here.
const DATABASE='kuningriigid-atlas-cache-v336',STORE='meshes',SCHEMA=1;
let connection;
function open(){
 if(!globalThis.indexedDB)return Promise.reject(Error('IndexedDB unavailable'));
 if(!connection)connection=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DATABASE,1);
  request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();connection=null};resolve(db)};
  request.onerror=()=>{connection=null;reject(request.error)};
  request.onblocked=()=>{connection=null;reject(Error('Atlas cache blocked'))};
 });
 return connection;
}
export function terrainMeshKeyV336(state,quality){
 const w=state?.generatedWorldV331;
 if(!w?.id||typeof w.id!=='string'||w.id.length>128)return null;
 return ['v344-1',w.id,JSON.stringify(w.identity||[]),quality,state.terrainRevision||0,state.crossingRevision||0].join('|');
}
export async function readTerrainMeshV336(key){
 if(!key)return null;
 try{const db=await open();return await new Promise(resolve=>{
  const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(key);
  req.onsuccess=()=>resolve(req.result?.schema===SCHEMA?req.result.geometry:null);
  req.onerror=()=>resolve(null);tx.onabort=()=>resolve(null);
 });}catch{return null;}
}
export async function writeTerrainMeshV336(key,geometry){
 if(!key||!geometry)return false;
 try{const db=await open();await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({schema:SCHEMA,geometry},key);
  tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error||Error('Cache write failed'));
 });return true;}catch(error){console.warn('V336 terrain cache write failed',String(error?.message||error));return false;}
}
