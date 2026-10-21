// One shared visibility diff for all atlas layers. No per-vertex terrain work
// is repeated when a scout reveals a handful of cells.
export class VisionDelta {
 constructor(state){this.state=state;this.revision=null;this.known=new Set();this.changed=[];this.serial=0;}
 update(){
  const revision=this.state.visionRevision||0;
  if(this.revision===revision)return this;
  const next=new Set(Object.keys(this.state.explored?.[0]||{})),changed=[];
  for(const key of next)if(!this.known.has(key))changed.push(key);
  for(const key of this.known)if(!next.has(key))changed.push(key);
  this.known=next;this.changed=changed.map(key=>{const[c,r]=key.split(':').map(Number);return {c,r,key};});
  this.revision=revision;this.serial++;return this;
 }
}
