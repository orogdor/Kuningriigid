// Draws the technology tree as an SVG (arrows point to what a discovery leads to).
//   node tools/techtree-image.mjs 0 out.svg   (ages comma separated, 0 = Stone Age)
const {TECHS,ERA_NAMES}=await import(new URL('../research.js',import.meta.url));
const ages=process.argv[2].split(',').map(Number),out=process.argv[3];
const ids=Object.keys(TECHS).filter(k=>ages.includes(TECHS[k].age));
const inSet=new Set(ids);
const prereq=k=>[...(TECHS[k].requires||[]).map(r=>[r,'req']),...(TECHS[k].oneOf||[]).map(r=>[r,'one'])];
const level={};const lv=k=>{if(level[k]!=null)return level[k];level[k]=0;let m=0;for(const [r] of prereq(k))if(inSet.has(r))m=Math.max(m,lv(r)+1);return level[k]=m;};
ids.forEach(lv);
// external prereqs (earlier era) shown as small grey tags
const cols={};for(const k of ids)(cols[level[k]]??=[]).push(k);
// order inside a column by average parent position (2 passes)
const pos={};const nL=Object.keys(cols).length;
for(let pass=0;pass<4;pass++)for(let c=0;c<nL;c++){const list=cols[c];list.forEach((k,i)=>pos[k]??=i);if(c>0)list.sort((a,b)=>{const av=k=>{const ps=prereq(k).filter(([r])=>inSet.has(r)).map(([r])=>pos[r]);return ps.length?ps.reduce((x,y)=>x+y,0)/ps.length:99};return av(a)-av(b)});list.forEach((k,i)=>pos[k]=i);}
const W=260,H=64,GX=90,GY=22,PAD=40;
const maxRows=Math.max(...Object.values(cols).map(l=>l.length));
const width=PAD*2+nL*W+(nL-1)*GX,height=PAD*2+60+maxRows*(H+GY);
const xy={};for(const [c,l] of Object.entries(cols)){const off=(maxRows-l.length)*(H+GY)/2;l.forEach((k,i)=>xy[k]={x:PAD+c*(W+GX),y:PAD+60+off+i*(H+GY)});}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const ageCol=['#c98a4a','#d9b04a','#9aa3ad','#8a6fb0','#5b9a6e','#b55a4a','#4a86b5'];
let edges='',nodes='';
for(const k of ids)for(const [r,t] of prereq(k)){
 if(!inSet.has(r))continue;const a=xy[r],b=xy[k];const x1=a.x+W,y1=a.y+H/2,x2=b.x-6,y2=b.y+H/2,mx=(x1+x2)/2;
 edges+=`<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" fill="none" stroke="${t==='req'?'#e8c47c':'#9fb7d8'}" stroke-width="${t==='req'?2:1.6}" ${t==='one'?'stroke-dasharray="6 5"':''} marker-end="url(#${t})" opacity=".9"/>`;}
for(const k of ids){const t=TECHS[k],{x,y}=xy[k];const ext=prereq(k).filter(([r])=>!inSet.has(r)).map(([r])=>TECHS[r]?.name||r);
 const un=String(t.unlocks||'').split(';')[0];
 nodes+=`<g><rect x="${x}" y="${y}" width="${W}" height="${H}" rx="9" fill="#2b1d10" stroke="${ageCol[t.age]}" stroke-width="2"/>
 <text x="${x+10}" y="${y+20}" font-size="13.5" font-weight="700" fill="#fff">${esc(t.name.length>27?t.name.slice(0,26)+'…':t.name)}</text>
 <text x="${x+W-8}" y="${y+20}" font-size="11" fill="#d9b673" text-anchor="end">${t.turns??''} k</text>
 <text x="${x+10}" y="${y+38}" font-size="10.5" fill="#d8c7a4">${esc(un.length>40?un.slice(0,39)+'…':un)}</text>
 ${ext.length?`<text x="${x+10}" y="${y+55}" font-size="9.5" fill="#9aa3ad">← ${esc(ext.join(', ').slice(0,44))}</text>`:''}</g>`;}
const title=ages.map(a=>ERA_NAMES[a]).join(' + ');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" font-family="Inter,Arial,sans-serif">
<defs><marker id="req" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#e8c47c"/></marker>
<marker id="one" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9fb7d8"/></marker></defs>
<rect width="100%" height="100%" fill="#16100a"/>
<text x="${PAD}" y="${PAD+8}" font-size="26" font-weight="700" fill="#f0d39c" font-family="Georgia,serif">Kuningriigid · avastuste puu · ${esc(title)}</text>
<text x="${PAD}" y="${PAD+32}" font-size="12.5" fill="#d8c7a4">Nool näitab, kuhu avastus viib. Kuldne pidev nool = vajalik eeldus. Sinine katkendlik = üks neist piisab. „← …“ = eeldus eelmisest ajastust. k = käike.</text>
${edges}${nodes}</svg>`;
(await import('fs')).writeFileSync(out,svg);console.log(ids.length,'nodes',width,'x',height);
