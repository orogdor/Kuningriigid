// V225: optional WebGPU renderer (?gpu=1). index.html maps ./vendor/three.module.js to this file
// only when the browser has WebGPU, so every game module gets the same three.js r170 classes from
// the WebGPU build. The game creates "WebGLRenderer"; here that name is a WebGPURenderer that
// starts its backend at once (the first frames before init are skipped by three.js itself).
export * from './three.webgpu.js';
import {WebGPURenderer} from './three.webgpu.js';
export const GPU_MODE_V225=true;
export class WebGLRenderer extends WebGPURenderer{
 constructor(opts={}){super({...opts,antialias:opts.antialias??true});this.isWebGPUShimV225=true;
  this.readyV225=this.init().then(()=>{window.KINGDOMS_GPU_V225={backend:this.backend?.isWebGPUBackend?'webgpu':'webgl2'};})
   .catch(e=>console.warn('V225 WebGPU init failed',e));}
}
