// V247: run the test scene with three.js WebGPU in Deno, no browser.
//   deno run -A tests/deno-bench-v247/bench-deno.js
// Renders off screen at 1920×1080 (Deno needs no window for this). Compare with bench.html in Chrome.
import * as T from '../../vendor/three.webgpu.js';
import {buildScene,runBench} from './scene.js';
const QUICK=Deno.args.includes('--quick'); // tiny self-check for machines without a real GPU
const W=QUICK?320:1920,H=QUICK?180:1080;
// Deno has no requestAnimationFrame; three.js only uses it for its idle animation loop.
globalThis.requestAnimationFrame??=f=>setTimeout(()=>f(performance.now()),16);globalThis.cancelAnimationFrame??=id=>clearTimeout(id);
const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
if(!adapter)throw new Error('WebGPU adapter not found');
const device=await adapter.requestDevice({requiredLimits:{maxBufferSize:adapter.limits.maxBufferSize,maxStorageBufferBindingSize:adapter.limits.maxStorageBufferBindingSize}});
// A canvas stand-in: three.js draws into a texture we own instead of a window.
let target=null,format='bgra8unorm';
const context={configure(o){format=o.format;target=device.createTexture({size:[W,H],format,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC});},unconfigure(){},getCurrentTexture:()=>target};
const canvas={width:W,height:H,style:{},getContext:()=>context,addEventListener(){},removeEventListener(){},setAttribute(){}};
const renderer=new T.WebGPURenderer({canvas,context,device,antialias:true});
await renderer.init();renderer.setPixelRatio(1);renderer.setSize(W,H,false);renderer.shadowMap.enabled=true;
console.log('Deno',Deno.version.deno,'| GPU:',JSON.stringify(adapter.info||{}),'| backend:',renderer.backend.isWebGPUBackend?'webgpu':'?');
await runBench(renderer,device,buildScene(T,{width:W,height:H}),QUICK?{frames:5,warmup:1}:{});
// --ppm file.ppm saves the last frame (check that the picture is right)
const ppm=Deno.args[Deno.args.indexOf('--ppm')+1];
if(Deno.args.includes('--ppm')&&ppm){
 const row=Math.ceil(W*4/256)*256,buf=device.createBuffer({size:row*H,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),enc=device.createCommandEncoder();
 enc.copyTextureToBuffer({texture:target},{buffer:buf,bytesPerRow:row},[W,H]);device.queue.submit([enc.finish()]);await buf.mapAsync(GPUMapMode.READ);
 const src=new Uint8Array(buf.getMappedRange()),bgr=format.startsWith('bgra'),head=new TextEncoder().encode(`P6 ${W} ${H} 255\n`),out=new Uint8Array(head.length+W*H*3);out.set(head);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*row+x*4,o=head.length+(y*W+x)*3;out[o]=src[i+(bgr?2:0)];out[o+1]=src[i+1];out[o+2]=src[i+(bgr?0:2)];}
 await Deno.writeFile(ppm,out);console.log('saved',ppm);
}
Deno.exit(0);
