import {DETAIL_HALF_X,DETAIL_HALF_Z} from './detail-scale-v123.js';
export const FIELD_MIN=8,FIELD_MAX=64, AI_FIELD_WIDTH=48, AI_FIELD_DEPTH=32; // 6 x old 16×16 area
export function fieldRect(a,b){
 const width=Math.round(Math.abs(a.x-b.x)/2)*2,depth=Math.round(Math.abs(a.z-b.z)/2)*2;
 return {x:Math.round((a.x+b.x)/4)*2,z:Math.round((a.z+b.z)/4)*2,width,depth};
}
export const fieldSize=b=>({width:b.width??AI_FIELD_WIDTH,depth:b.depth??AI_FIELD_DEPTH});
export function fieldContains(field,p,margin=0){const {width,depth}=fieldSize(field),angle=field.freeRotationV243?(field.buildingRotationV228||0):0,c=Math.cos(angle),s=Math.sin(angle),dx=p.x-field.x,dz=p.z-field.z;return Math.abs(dx*c-dz*s)<width/2+margin&&Math.abs(dx*s+dz*c)<depth/2+margin;}
export function farmingProfile(age,known=[],powered=false){
 const has=id=>known.includes(id);
 if(age>=6&&has('combustion')&&powered)return {id:'tractor',name:'Traktor ja kombain',speed:5,areaPerWorker:768,output:2.8};
 if(age>=5&&has('mechanical_reaper'))return {id:'reaper',name:'Hoburakendiga niiduk',speed:3.2,areaPerWorker:384,output:1.9};
 if(age>=3&&has('heavy_plough'))return {id:'heavy_plough',name:'Hoburakend ja hõlmader',speed:2.7,areaPerWorker:224,output:1.5};
 if(age>=2&&has('iron_ploughshare')&&has('animal_husbandry'))return {id:'iron_plough',name:'Härjarakend ja raudader',speed:2.3,areaPerWorker:160,output:1.25};
 if(age>=1&&has('animal_husbandry'))return {id:'ox_plough',name:'Härjarakend ja puuader',speed:2,areaPerWorker:112,output:1};
 return {id:'hand',name:'Kõblas ja käsikülv',speed:1.6,areaPerWorker:64,output:.8};
}
export function fieldsForFarm(ctx,farm){
 const farms=ctx.economy.buildings.filter(b=>b.type==='farm'&&b.ready&&b.hp>0&&!b.disabled);
 return ctx.economy.buildings.filter(b=>b.type==='field'&&b.ready&&b.hp>0&&!b.disabled&&
  [...farms].sort((a,c)=>Math.hypot(a.x-b.x,a.z-b.z)-Math.hypot(c.x-b.x,c.z-b.z)||ctx.economy.buildings.indexOf(a)-ctx.economy.buildings.indexOf(c))[0]===farm);
}
export function farmWork(game,ctx,farm,dt){
 const fields=fieldsForFarm(ctx,farm),world=ctx.world;world.workers??={};
 const index=ctx.economy.buildings.indexOf(farm),prefix='farm:'+index+':';
 for(const [id,w]of Object.entries(world.workers))if(id.startsWith(prefix)){w.working=false;w.moving=false;w.visible=false;}
 if(!fields.length){farm.status='Ootab eraldi rajatud põldu samal ruudul';return 0;}
 const stock=ctx.economy.realms[ctx.team].resources,known=game.s.research[ctx.team].known,age=game.s.ages[ctx.team];
 const canMotor=age>=6&&known.includes('combustion')&&(stock.fuel||0)>0;
 if(canMotor&&!farm.tractorOwned&&(stock.machines||0)>=1){stock.machines-=1;farm.tractorOwned=true;}
 const powered=canMotor&&farm.tractorOwned&&(stock.fuel||0)>=dt*.002;
 const profile=farmingProfile(age,known,powered),assigned=Math.min(4,Math.max(0,farm.assigned||0));
 const area=fields.reduce((n,b)=>{const d=fieldSize(b);return n+d.width*d.depth},0);
 farm.farming={tool:profile.name,area,capacity:assigned*profile.areaPerWorker,fields:fields.length};
 if(dt<=0||assigned<=0)return 0;
 const nav=game.nav(ctx);let work=0;
 for(let i=0;i<Math.ceil(assigned);i++){
  const id=prefix+i,field=fields[i%fields.length],size=fieldSize(field);
  const w=world.workers[id]??={x:farm.x,z:farm.z+6,team:ctx.team,kind:'farm',building:index,row:i,pass:0};
  w.visible=true;w.equipment=profile.id;
  const rows=Math.max(1,Math.floor((size.depth-4)/3)),row=(w.row||0)%rows;
  const x=(w.pass%2?1:-1)*(size.width/2-2),z=-size.depth/2+2+row*3,angle=field.freeRotationV243?(field.buildingRotationV228||0):0,c=Math.cos(angle),s=Math.sin(angle);
  const target={x:field.x+x*c+z*s,z:field.z-x*s+z*c};
  const point=nav.nearest(target,4);if(!point)continue;
  const movingDistance=Math.hypot(w.x-point.x,w.z-point.z);
  if(!nav.moveCitizen(w,point,dt,profile.speed)){w.working=fieldContains(field,w);w.action=w.working?'farm':null;}
  else{w.working=true;w.action='farm';w.pass++;w.row=(row+1)%rows;}
  // Walking from the farmhouse produces no grain; traversal inside the field is work.
  if(w.working)work+=Math.min(1,assigned-i);
  w.heading=Math.atan2(point.x-w.x,point.z-w.z);w.moving=movingDistance>.2;
 }
 if(powered&&work>0)stock.fuel=Math.max(0,stock.fuel-dt*.002);
 const coverage=Math.min(1,area/Math.max(1,assigned*profile.areaPerWorker));
 farm.status=work?profile.name+' · '+Math.round(area)+' põlluühikut':'Põllutöölised liiguvad põllule';
 return dt*work/assigned*coverage*profile.output;
}
export function validateField(ctx,p,passable){
 const {width,depth}=fieldSize(p);
 if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||!Number.isFinite(width)||!Number.isFinite(depth)||width<FIELD_MIN||depth<FIELD_MIN||width>FIELD_MAX||depth>FIELD_MAX)return 'Põllu küljed peavad olema 8–64 ühikut. Lohista väiksem ristkülik.';
 const angle=p.freeRotationV243?(p.buildingRotationV228||0):0,c=Math.cos(angle),s=Math.sin(angle),rx=Math.abs(c)*width/2+Math.abs(s)*depth/2,rz=Math.abs(s)*width/2+Math.abs(c)*depth/2;
 if(Math.abs(p.x)+rx>DETAIL_HALF_X-4||Math.abs(p.z)+rz>DETAIL_HALF_Z-4)return 'Põld peab mahtuma ühele detailkaardile.';
 for(let x=-width/2;x<=width/2;x+=2)for(let z=-depth/2;z<=depth/2;z+=2)if(!passable(p.x+x*c+z*s,p.z-x*s+z*c))return 'Kogu põld peab olema kuival ja ligipääsetaval maal.';
 for(const b of ctx.economy.buildings.filter(b=>!b.virtual&&b.hp>0)){
  const d=b.type==='field'?fieldSize(b):b.type==='market'?{width:24,depth:23}:{width:12,depth:12};
  const ba=b.freeRotationV243?(b.buildingRotationV228||0):0,bc=Math.abs(Math.cos(ba)),bs=Math.abs(Math.sin(ba)),brx=(d.width*bc+d.depth*bs)/2,brz=(d.width*bs+d.depth*bc)/2;
  if(Math.abs(b.x-p.x)<rx+brx+1&&Math.abs(b.z-p.z)<rz+brz+1)return 'Põld kattub teise põllu või hoonega.';
 }
 if(ctx.world.resources.some(r=>r.depositSite&&!r.removed&&fieldContains(p,r,3)))return 'Maardla peale ei saa põldu rajada.';
 return '';
}
export function migrateLegacyFarms(ctx,passable,county=false){
 for(const farm of ctx.economy.buildings.filter(b=>b.type==='farm'&&b.hp>0&&!b.fieldSystemV127)){
  farm.fieldSystemV127=true;
  if(ctx.world.workers)delete ctx.world.workers['job:'+ctx.economy.buildings.indexOf(farm)];
  if(ctx.economy.buildings.some(b=>b.type==='field'&&b.hp>0))continue;
  if(county&&ctx.economy.buildings.filter(b=>!b.virtual&&b.hp>0).length>=3)continue;
  let placed=false;
  for(let x=-72;x<=72&&!placed;x+=16)for(let z=-56;z<=56&&!placed;z+=16){
   const p={x,z,width:16,depth:16};if(validateField(ctx,p,passable))continue;
   ctx.economy.buildings.push({...p,type:'field',team:ctx.team,hp:350,ready:farm.ready,progress:0,timer:0,parent:0,legacyField:true});
   for(const r of ctx.world.resources)if(['tree','berry','game'].includes(r.kind)&&fieldContains(p,r)){r.removed=true;r.amount=0;}
   ctx.world.revision=(ctx.world.revision||0)+1;placed=true;
  }
 }
}
