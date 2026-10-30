// Share in-flight work and limit background asset downloads. A failed request
// can be retried after a short cooldown, without issuing a request every frame.
const entries=new Map(),queue=[];let active=0;
function pump(){
 while(active<3&&queue.length){
  const job=queue.shift();active++;
  Promise.resolve().then(job.run).then(job.resolve,job.reject).finally(()=>{active--;pump();});
 }
}
export function requestAssetV241(key,run){
 const previous=entries.get(key);
 if(previous&&(!previous.failedAt||Date.now()-previous.failedAt<15000))return previous.promise;
 const entry={failedAt:0};
 entry.promise=new Promise((resolve,reject)=>{queue.push({run,resolve,reject});});
 entries.set(key,entry);entry.promise.catch(()=>{entry.failedAt=Date.now();});pump();
 return entry.promise;
}
