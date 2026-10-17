// Compact, immutable detail layouts are baked for the whole world before play.
export function bakeDetails(cells,sample,seed){
 const random=(a,b)=>{const n=Math.sin(a*127.1+b*311.7+seed*.017)*43758.5453;return n-Math.floor(n)};
 for(const cell of cells){
  const heights=[];for(let j=0;j<=8;j++)for(let i=0;i<=8;i++)heights.push(Math.round((sample(cell.x+(i/8-.5)*50,cell.z+(j/8-.5)*50)-.7)*30)/100);
  const city=cell.c===10&&cell.r===11?0:cell.c===17&&cell.r===9?1:null;
  cell.detail={heights,city,feature:city!==null?'city':Math.min(...heights)<0&&Math.max(...heights)>0?'coast':cell.biome,resources:[]};
  const count=cell.biome==='forest'?110:cell.biome==='hills'?65:45;
  for(let i=0;i<count;i++){const x=Math.round((random(cell.c*200+i,cell.r+91)*140-70)*10)/10,z=Math.round((random(cell.c*200+i,cell.r+779)*120-60)*10)/10;
   if(detailHeight(cell,x,z)>.4&&Math.abs(z)>16)cell.detail.resources.push([i%5===0?1:0,x,z]);
  }
 }
 return cells;
}
export function detailHeight(cell,x,z){
 const h=cell.detail?.heights;if(!h)return .3;
 const fx=Math.max(0,Math.min(8,(x/150+.5)*8)),fz=Math.max(0,Math.min(8,(z/130+.5)*8)),i=Math.min(7,Math.floor(fx)),j=Math.min(7,Math.floor(fz)),u=fx-i,v=fz-j;
 return (h[j*9+i]*(1-u)+h[j*9+i+1]*u)*(1-v)+(h[(j+1)*9+i]*(1-u)+h[(j+1)*9+i+1]*u)*v;
}
export const featureNames={city:'Linn',coast:'Mererand',river:'Jõgi',sea:'Avameri',forest:'Mets',hills:'Mägismaa',plains:'Tasandik'};
