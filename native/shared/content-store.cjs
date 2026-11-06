'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const HASH=/^[0-9a-f]{64}$/,REV=/^[0-9a-f]{40}$/;
function safePath(p){return typeof p==='string'&&p.length>0&&p.length<500&&!/[\\\u0000:%?#]/.test(p)&&!p.startsWith('/')&&p.split('/').every(s=>s&&s!=='.'&&s!=='..'&&!s.startsWith('.'));}
function validate(m,shell=1){
 if(!m||m.schema!==1||!REV.test(m.version)||!Number.isSafeInteger(m.sequence)||m.sequence<0||!Number.isInteger(m.minShell)||m.minShell<1||m.minShell>shell||!Array.isArray(m.files)||!m.files.length||m.files.length>20000)throw Error('Unsupported or invalid content manifest');
 const paths=new Set();let total=0;for(const f of m.files){if(!safePath(f.path)||paths.has(f.path)||!HASH.test(f.sha256)||!Number.isSafeInteger(f.size)||f.size<0||f.size>134217728)throw Error('Invalid manifest file');paths.add(f.path);total+=f.size;}
 if(!paths.has('index.html')||total>2147483648)throw Error('Incomplete/oversize game');return m;
}
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
async function atomic(file,data){await fs.mkdir(path.dirname(file),{recursive:true});const tmp=file+'.'+crypto.randomUUID()+'.tmp';const h=await fs.open(tmp,'wx');try{await h.writeFile(data);await h.sync();}finally{await h.close();}try{await fs.rename(tmp,file);}catch(e){await fs.rm(tmp,{force:true});throw e;}}
class ContentStore{
 constructor(root,bundle,{shell=1}={}){this.root=root;this.bundle=bundle;this.shell=shell;this.cache=new Map();this.updating=false;this.stateQueue=Promise.resolve();}
 async init(){this.base=validate(JSON.parse(await fs.readFile(path.join(this.bundle,'_bundle-manifest.json'),'utf8')),this.shell);this.baseHashes=new Map(this.base.files.map(f=>[f.sha256,f.path]));await fs.mkdir(path.join(this.root,'objects'),{recursive:true});return this;}
 async state(){try{return JSON.parse(await fs.readFile(path.join(this.root,'state.json'),'utf8'));}catch{return {active:this.base.version,previous:null,pending:null,booting:false,blocked:null};}}
 async setState(s){await atomic(path.join(this.root,'state.json'),JSON.stringify(s));}
 async mutate(fn){const next=this.stateQueue.then(async()=>{const s=await this.state();const value=await fn(s);await this.setState(s);return value;});this.stateQueue=next.catch(()=>{});return next;}
 async getManifest(v){if(v===this.base.version)return this.base;if(this.cache.has(v))return this.cache.get(v);if(!REV.test(v))throw Error('Invalid revision');const m=validate(JSON.parse(await fs.readFile(path.join(this.root,'manifests',v+'.json'),'utf8')),this.shell);if(m.version!==v)throw Error('Revision mismatch');this.cache.set(v,m);return m;}
 async beginLaunch(){return this.mutate(async s=>{let rolledBack=false;if(s.booting){s.blocked=s.active;s.active=s.previous||this.base.version;s.pending=null;s.booting=false;rolledBack=true;}else if(s.pending&&s.pending!==s.active){s.previous=s.active;s.active=s.pending;s.pending=null;s.booting=true;}
 try{this.current=await this.getManifest(s.active);}catch{s.active=this.base.version;s.booting=false;this.current=this.base;}return {manifest:this.current,rolledBack};});}
 async healthy(){return this.mutate(s=>{s.booting=false;});}
 async rollback(){return this.mutate(async s=>{if(!s.previous||s.active===s.previous)return false;s.blocked=s.active;s.active=s.previous;s.pending=null;s.booting=false;this.current=await this.getManifest(s.active);return true;});}
 async stage(input,download,onProgress=()=>{}){
  if(this.updating)return {status:'busy'};const m=validate(input,this.shell),s=await this.state(),active=await this.getManifest(s.active);
  if(m.version===s.active||m.version===s.pending)return {status:'current',version:active.label};
  if(m.sequence<active.sequence||m.version===s.blocked)return {status:'ignored'};
  this.updating=true;let downloaded=0,changed=0,reused=0,done=0;
  try{for(const f of m.files){
   if(this.baseHashes.has(f.sha256)){reused++;done++;continue;}
   const dest=path.join(this.root,'objects',f.sha256);let valid=false;try{const b=await fs.readFile(dest);valid=b.length===f.size&&digest(b)===f.sha256;}catch{}
   if(valid){reused++;done++;continue;}
   const bytes=await download(f,m);if(bytes.length!==f.size||digest(bytes)!==f.sha256)throw Error('Content verification failed: '+f.path);
   await atomic(dest,bytes);downloaded+=bytes.length;changed++;done++;onProgress({done,total:m.files.length,downloaded,changed});
  }
  await atomic(path.join(this.root,'manifests',m.version+'.json'),JSON.stringify(m));this.cache.set(m.version,m);await this.mutate(fresh=>{fresh.pending=m.version;});
  await this.collect();return {status:'ready',version:m.label,revision:m.version,downloaded,changed,reused};
  }finally{this.updating=false;}
 }
 async collect(){const s=await this.state(),keep=new Set();for(const v of new Set([s.active,s.previous,s.pending].filter(Boolean))){const m=await this.getManifest(v);for(const f of m.files)keep.add(f.sha256);}for(const name of await fs.readdir(path.join(this.root,'objects')))if(HASH.test(name)&&!keep.has(name))await fs.rm(path.join(this.root,'objects',name),{force:true});}
 async resolve(revision,resource){if(!safePath(resource))return null;const s=await this.state();if(![this.base.version,s.active,s.previous].includes(revision))return null;const m=await this.getManifest(revision),f=m.files.find(x=>x.path===resource);if(!f)return null;const bundled=this.baseHashes.get(f.sha256);return bundled?path.join(this.bundle,...bundled.split('/')):path.join(this.root,'objects',f.sha256);}
}
module.exports={ContentStore,validate,safePath,digest,atomic};
