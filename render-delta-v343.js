// Accumulate simulation seconds between presented frames. Simulation/input keep
// their own requestAnimationFrame cadence; visual interpolation consumes each
// second exactly once, including when an FPS limit skips display callbacks.
export class RenderDeltaV343 {
 constructor(){this.pending=0;this.context=null;}
 step(dt,drawn,context){
  if(context!==this.context){this.context=context;this.pending=0;}
  this.pending+=Math.max(0,dt);
  if(!drawn)return null;
  const elapsed=this.pending;this.pending=0;return elapsed;
 }
}
