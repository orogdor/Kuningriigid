// Share in-flight work and limit background asset downloads. A failed request
// can be retried after a short cooldown, without issuing a request every frame.
// V279: five downloads at a time, and `priority` requests (the far models of buildings that are already on
// screen) jump the queue, so towns get their real models before optional soldiers or detail meshes.
const entries=new Map(),queue=[];let active=0;
const MAX_ACTIVE=5;
function pump(){
 while(active<MAX_ACTIVE&&queue.length){
  const job=queue.shift();active++;
  Promise.resolve().then(job.run).then(job.resolve,job.reject).finally(()=>{active--;pump();});
 }
}
export function requestAssetV241(key,run,{priority=false}={}){
 const previous=entries.get(key);
 if(previous&&(!previous.failedAt||Date.now()-previous.failedAt<15000))return previous.promise;
 const entry={failedAt:0};
 entry.promise=new Promise((resolve,reject)=>{const job={run,resolve,reject,key};if(priority){const i=queue.findIndex(j=>!j.priority);job.priority=true;if(i<0)queue.push(job);else queue.splice(i,0,job);}else queue.push(job);});
 entries.set(key,entry);entry.promise.catch(()=>{entry.failedAt=Date.now();});pump();
 return entry.promise;
}
