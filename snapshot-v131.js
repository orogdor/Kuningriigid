// The copy is atomic on the main thread. JSON encoding runs in a worker.
// Runtime proxies/revision accessors are converted to ordinary V4 save data.
export function plainSnapshot(state){
 const districts=new Set(state.cities.flatMap(c=>Object.values(c.districts||{}).map(d=>d.economy))),seen=new Map();
 function clone(value){
  if(value===null||typeof value!=='object')return value;
  if(seen.has(value))return seen.get(value);
  const out=Array.isArray(value)?[]:{};seen.set(value,out);
  for(const key of Object.keys(value)){if(districts.has(value)&&['realms','resources'].includes(key))continue;out[key]=clone(value[key])}
  return out;
 }
 return clone(state);
}
export const serializeSnapshot=state=>JSON.stringify(plainSnapshot(state));
export class SnapshotEncoder{
 constructor(makeWorker=()=>new Worker(new URL('./snapshot-worker-v131.js',import.meta.url),{type:'module'})){
  this.next=0;this.pending=new Map();
  try{this.worker=makeWorker();this.worker.onmessage=({data})=>{const job=this.pending.get(data.id);if(!job)return;this.pending.delete(data.id);if(data.error)job.reject(Error(data.error));else job.resolve(data.json)};this.worker.onerror=()=>this.fallback();}catch{this.worker=null}
 }
 fallback(){this.worker?.terminate();this.worker=null;for(const job of this.pending.values())try{job.resolve(JSON.stringify(job.snapshot))}catch(e){job.reject(e)}this.pending.clear()}
 encode(state){
  const snapshot=plainSnapshot(state);
  if(!this.worker)return Promise.resolve(JSON.stringify(snapshot));
  const id=++this.next;
  return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject,snapshot});try{this.worker.postMessage({id,snapshot})}catch{this.fallback()}});
 }
}
