// Camera input is measured in real seconds, independently of simulation speed.
export class CameraKeys{
 constructor(){this.held=new Set()}
 clear(){this.held.clear()}
 handle(e,down,blocked=false){const code=e.code||e.key;const supported=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight'].includes(code);if(!supported)return false;if(!down)this.held.delete(code);else if(!blocked){this.held.add(code);e.preventDefault?.()}return supported}
 step(dt,zoom,world){const k=this.held,x=Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft')),z=Number(k.has('KeyS')||k.has('ArrowDown'))-Number(k.has('KeyW')||k.has('ArrowUp')),n=Math.hypot(x,z)||1,rate=zoom*.65*dt*(k.has('ShiftLeft')||k.has('ShiftRight')?2:1);return this.project(x/n*rate,z/n*rate,world)}
 project(x,z,world){const fx=world?.1:.48,fz=world?.7:.8,n=Math.hypot(fx,fz);return {x:(x*fz+z*fx)/n,z:(-x*fx+z*fz)/n}}
}
