// V247 Deno vs browser test: one small stand-in for the world map, identical in both runners.
// Terrain with vertex colours, 20 000 instanced trees, 1 000 separate houses (≈1 100 draw calls,
// close to the real world map), sun with shadows. Deterministic, no textures or HTML needed.
export function buildScene(T,{width,height}){
 let seed=1;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const scene=new T.Scene();scene.background=new T.Color('#a9b8ac');
 scene.add(new T.HemisphereLight(0xe6eedb,0x536246,1.6));
 const sun=new T.DirectionalLight(0xffe1b0,2.5);sun.position.set(-150,260,120);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-260,right:260,top:260,bottom:-260,near:1,far:800});scene.add(sun);
 const h=(x,z)=>Math.sin(x*.021)*9+Math.cos(z*.017)*7+Math.sin((x+z)*.05)*2;
 const ground=new T.PlaneGeometry(600,600,256,256);ground.rotateX(-Math.PI/2);
 const p=ground.attributes.position,col=new Float32Array(p.count*3),c=new T.Color();
 for(let i=0;i<p.count;i++){const y=h(p.getX(i),p.getZ(i));p.setY(i,y);c.setHSL(.24-y*.004,.35,.32+y*.008);c.toArray(col,i*3);}
 ground.setAttribute('color',new T.BufferAttribute(col,3));ground.computeVertexNormals();
 const land=new T.Mesh(ground,new T.MeshStandardMaterial({vertexColors:true,roughness:.95}));land.receiveShadow=true;scene.add(land);
 const TREES=20000,crown=new T.ConeGeometry(2.2,7,7),trunk=new T.CylinderGeometry(.35,.45,2.4,5);crown.translate(0,5.2,0);trunk.translate(0,1.2,0);
 const crowns=new T.InstancedMesh(crown,new T.MeshStandardMaterial({color:'#3f6b3a',roughness:.9}),TREES),trunks=new T.InstancedMesh(trunk,new T.MeshStandardMaterial({color:'#6b4a2f'}),TREES);
 const m=new T.Matrix4(),q=new T.Quaternion(),v=new T.Vector3(),s=new T.Vector3();
 for(let i=0;i<TREES;i++){const x=(rnd()-.5)*580,z=(rnd()-.5)*580,k=.7+rnd()*.7;v.set(x,h(x,z),z);q.setFromAxisAngle(new T.Vector3(0,1,0),rnd()*6.3);s.set(k,k,k);m.compose(v,q,s);crowns.setMatrixAt(i,m);trunks.setMatrixAt(i,m);}
 for(const t of [crowns,trunks]){t.castShadow=true;t.receiveShadow=true;scene.add(t);}
 const walls=[new T.MeshStandardMaterial({color:'#b59a72'}),new T.MeshStandardMaterial({color:'#9c8466'}),new T.MeshStandardMaterial({color:'#c8b28a'})],roofMat=new T.MeshStandardMaterial({color:'#7a3b2a',roughness:.8});
 const box=new T.BoxGeometry(4,3,5),roof=new T.ConeGeometry(3.6,2.6,4);roof.rotateY(Math.PI/4);
 for(let i=0;i<500;i++){const x=(rnd()-.5)*500,z=(rnd()-.5)*500,y=h(x,z),r=rnd()*6.3;
  const wall=new T.Mesh(box,walls[i%3]);wall.position.set(x,y+1.5,z);wall.rotation.y=r;
  const top=new T.Mesh(roof,roofMat);top.position.set(x,y+4.3,z);top.rotation.y=r;
  for(const o of [wall,top]){o.castShadow=true;o.receiveShadow=true;scene.add(o);}}
 const camera=new T.PerspectiveCamera(45,width/height,1,2000);
 const update=t=>{const a=t*.35;camera.position.set(Math.cos(a)*330,210,Math.sin(a)*330);camera.lookAt(0,0,0);};
 update(0);return {scene,camera,update};
}
// Same loop in both runners: warm up, then render frames back to back and wait for the GPU each
// frame, so both measure "CPU work in three.js + GPU work" without vsync limits.
export async function runBench(renderer,device,{scene,camera,update},{frames=300,warmup=40,log=console.log}={}){
 const t0=performance.now();renderer.render(scene,camera);await device.queue.onSubmittedWorkDone();const first=performance.now()-t0;
 for(let i=0;i<warmup;i++){update(i/60);renderer.render(scene,camera);await device.queue.onSubmittedWorkDone();}
 const cpu=[],total=[];
 for(let i=0;i<frames;i++){update((warmup+i)/60);const a=performance.now();renderer.render(scene,camera);const b=performance.now();await device.queue.onSubmittedWorkDone();const e=performance.now();cpu.push(b-a);total.push(e-a);}
 renderer.info.autoReset=false;renderer.info.reset();renderer.render(scene,camera);await device.queue.onSubmittedWorkDone();const info={...renderer.info.render};renderer.info.autoReset=true;
 const med=x=>[...x].sort((p,q)=>p-q)[x.length>>1],avg=x=>x.reduce((p,q)=>p+q,0)/x.length;
 const r={firstFrameMs:+first.toFixed(0),frames,drawCalls:info.drawCalls,triangles:info.triangles,
  cpuMedianMs:+med(cpu).toFixed(2),frameMedianMs:+med(total).toFixed(2),frameAvgMs:+avg(total).toFixed(2),fps:+(1000/avg(total)).toFixed(1)};
 log(JSON.stringify(r,null,1));return r;
}
