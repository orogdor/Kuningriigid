// V355: builds house-builder-v355.js from the house designer (majaehitaja/index.html).
// The designer stays the one source of the buildings; this script copies the
// parts that make a building (catalog, sample designs, plan geometry and the 3D
// builder) into an ES module that uses the game's own three.js. No UI, no
// WebGL renderer and no iframe: the game (and NativeThreeBridge) call it directly.
//
// Run after every change to majaehitaja/index.html:
//   node tools/house-builder-v355/build.mjs
// Needs acorn and eslint-scope (npm i --no-save acorn eslint-scope, or set
// HOUSE_BUILDER_NODE_MODULES to a node_modules folder that has them).
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const require=createRequire(import.meta.url);
const need=name=>{
 const tries=[process.env.HOUSE_BUILDER_NODE_MODULES&&path.join(process.env.HOUSE_BUILDER_NODE_MODULES,name),name,'/opt/npm-tools/node_modules/'+name,'/opt/node-tools/node_modules/'+name].filter(Boolean);
 for(const t of tries){try{return require(t);}catch{}}
 throw new Error(name+' is missing: npm i --no-save acorn eslint-scope');
};
const acorn=need('acorn'),eslintScope=need('eslint-scope');

const htmlPath=path.join(root,'majaehitaja/index.html');
const html=readFileSync(htmlPath,'utf8');
const sha=createHash('sha256').update(html).digest('hex');
const lines=html.split('\n');

// ---- the two designer scripts
const s1Start=lines.findIndex(l=>l.startsWith("<script>'use strict';"));
const s1End=lines.findIndex((l,i)=>i>s1Start&&l.startsWith('</script><script>(()=>{'));
if(s1Start<0||s1End<0)throw new Error('designer scripts not found');
const s1=lines.slice(s1Start,s1End).join('\n').replace("<script>'use strict';","'use strict';");
const hutStart=lines.findIndex(l=>l.startsWith('function createHutView('));
const hookLine=lines.findIndex(l=>l.startsWith('window.hutWebGL = canvas => createHutView('));
if(hutStart<0||hookLine<0)throw new Error('createHutView not found');
const hut=lines.slice(hutStart,hookLine).join('\n').trimEnd();

// ---- the three images the designer passes to createHutView (data URLs)
const hook=lines[hookLine];
const images=[...hook.matchAll(/"(data:image\/[a-z]+;base64,[^"]*)"/g)].map(m=>m[1]);
if(images.length!==3)throw new Error('expected 3 designer images, found '+images.length);
const threeNames=[...hook.slice(0,hook.indexOf('}, canvas')).matchAll(/([A-Za-z0-9]+):(?:core\.)?([A-Za-z0-9]+)/g)].map(m=>[m[1],m[2]]);

// ---- pick the statements of script 1 that make a building
const ast=acorn.parse(s1,{ecmaVersion:2024,sourceType:'script',ranges:true,locations:true});
const sm=eslintScope.analyze(ast,{ecmaVersion:2022});
const g=sm.globalScope,gnames=new Set(g.variables.map(v=>v.name));
const stmts=ast.body.map((s,i)=>({i,s,decl:new Set(),refs:new Set(),line:s.loc.start.line,src:s1.slice(...s.range)}));
const topOf=node=>stmts.find(st=>node.range[0]>=st.s.range[0]&&node.range[1]<=st.s.range[1]);
for(const v of g.variables)for(const d of v.defs){const st=topOf(d.node);if(st)st.decl.add(v.name);}
for(const ref of sm.scopes.flatMap(s=>s.references)){
 const n=ref.identifier.name;if(ref.resolved&&ref.resolved.scope!==g)continue;if(!gnames.has(n))continue;
 const st=topOf(ref.identifier);if(st)st.refs.add(n);
}
const declIn=new Map();for(const st of stmts)for(const n of st.decl)declIn.set(n,st);
// The page's UI begins with its element handles; before that is the catalog data.
const uiStart=stmts.find(st=>st.decl.has('mainEl'))?.line;
if(!uiStart)throw new Error('UI start (mainEl) not found');
const UI_NAMES=new Set(['$','canvas','ctx','DPR','surface3D','status','catButtons','tips','swatchFor']);
const DOM=/\bdocument\b|\$\(|localStorage|addEventListener|\bwindow\./;
const pick=new Set();
const add=name=>{const q=[name];while(q.length){const x=q.pop();const st=declIn.get(x);if(!st||pick.has(st))continue;
 if(UI_NAMES.has(x))throw new Error('the builder needs the UI name '+x);pick.add(st);for(const r of st.refs)q.push(r);}};
for(const st of stmts){
 if(st.line>=uiStart)break;
 if([...st.decl].some(n=>UI_NAMES.has(n)))continue;
 if(!st.decl.size&&(DOM.test(st.src)||/\bcanvas\.|\bview===/.test(st.src)))continue;
 if(st.s.type==='ExpressionStatement'&&st.s.expression.type==='Literal')continue; // 'use strict'
 pick.add(st);for(const r of st.refs)add(r);
}
// what the 3D builder and the request handler use from script 1
const hutAst=acorn.parse(hut,{ecmaVersion:2024,sourceType:'script',ranges:true});
const hutScope=eslintScope.analyze(hutAst,{ecmaVersion:2022});
const hutFree=new Set(hutScope.globalScope.through.map(r=>r.identifier.name));
for(const n of hutFree)if(declIn.has(n))add(n);
for(const n of ['seed','cleanState','catalog','useProject','geometry','PX_PER_M','P','state','lowerFloor','projectCache'])add(n);
const chosen=[...pick].sort((a,b)=>a.i-b.i);
const bad=chosen.filter(st=>DOM.test(st.src));
if(bad.length)throw new Error('picked statements use the page: '+bad.map(st=>st.line).join(','));

// ---- small changes to the builder so it runs without a page
let builder=hut;
const replace=(from,to,count=1)=>{const n=builder.split(from).length-1;if(n!==count)throw new Error(`expected ${count}× ${from.slice(0,60)}, found ${n}`);builder=builder.split(from).join(to);};
// files are next to the designer page, not next to this module
replace("'./textures/","DESIGNER_BASE+'textures/",4);
// canvas textures become cropped canvases, not ImageBitmaps (NativeThreeBridge
// has no cropping createImageBitmap); the game turns either into a texture
replace("jobs.push(createImageBitmap(source,sx,sy,sw,sh,{imageOrientation:entry.flipY?'flipY':'none'}).then(bitmap=>{entry.bitmap=bitmap;}).catch(()=>{}));",
 "jobs.push(cropImageV355(source,sx,sy,sw,sh,entry.flipY).then(bitmap=>{entry.bitmap=bitmap;}).catch(()=>{}));");

const out=`// GENERATED by tools/house-builder-v355/build.mjs from majaehitaja/index.html – do not edit.
// source-sha256: ${sha}
// V355: the house designer's building code as a module of the game. The game
// builds every Stone–Iron Age building here, with its own three.js, instead of
// in a hidden designer page (iframe). NativeThreeBridge can run it too.
import * as core from './vendor/three.module.js';

const DESIGNER_BASE=new URL('./majaehitaja/',import.meta.url).href;
// The builder never draws: a renderer that only answers questions.
class WebGLRenderer{
 constructor(){this.capabilities={getMaxAnisotropy:()=>8};this.shadowMap={enabled:false,type:0};this.toneMapping=0;this.toneMappingExposure=1;}
 setPixelRatio(){} getPixelRatio(){return 1;} setSize(){} render(){} dispose(){}
}
const T={WebGLRenderer,${threeNames.filter(([k])=>k!=='WebGLRenderer').map(([k,v])=>k+':core.'+v).join(',')}};
// Card pictures of the designer page (not used for building).
const ART={buildings:{}};
const surface={hidden:true,clientWidth:0,clientHeight:0,width:0,height:0,dispatchEvent(){return true;},toDataURL(){return '';}};
// The builder's page globals: no screen, low texture files (only their names are used).
const location={search:'?textures=low',protocol:'http:'};
class ResizeObserver{observe(){} disconnect(){}}
const requestAnimationFrame=()=>0;
function cropImageV355(source,sx,sy,sw,sh,flipY){
 const canvas=document.createElement('canvas');canvas.width=sw;canvas.height=sh;
 const g=canvas.getContext('2d');
 if(flipY){g.translate(0,sh);g.scale(1,-1);}
 g.drawImage(source,sx,sy,sw,sh,0,0,sw,sh);
 return Promise.resolve(canvas);
}
const IMAGES=${JSON.stringify(images)};

// ---------------------------------------------------------------- designer data (majaehitaja script 1)
${chosen.map(st=>st.src).join('\n')}

// ---------------------------------------------------------------- 3D builder (majaehitaja createHutView)
${builder}

// ---------------------------------------------------------------- requests
let view3d=null,queue=Promise.resolve();
// Builds one building. id: designer id (catalog key); design: a saved design of
// that building (or null for the sample); segment: {length,kind} for a straight
// wall piece. Resolves to the same packet the designer page used to send.
export function buildHouseModelV355({id,design=null,segment=null}){
 const job=queue.then(async()=>{
  const saved={state,lowerFloor,projectCache};
  try{
   view3d??=createHutView(T,surface,...IMAGES);
   const project=design?cleanState(design):Object.hasOwn(catalog,id)?seed(id):null;
   if(!project)throw new Error('Unknown building '+id);
   if(segment&&project.fences?.length){
    const f=project.fences[0],cx=(f.a.x+f.b.x)/2,cy=(f.a.y+f.b.y)/2,half=segment.length*PX_PER_M/2;
    project.fences=[{kind:segment.kind??f.kind,a:P(cx-half,cy),b:P(cx+half,cy)}];project.items=[];project.yard=null;
   }
   useProject(project);
   return await view3d.exportModel(state,geometry(state));
  }finally{state=saved.state;lowerFloor=saved.lowerFloor;projectCache=saved.projectCache;}
 });
 queue=job.catch(()=>{});
 return job;
}
export const HOUSE_BUILDER_SOURCE_V355='${sha}';
`;
writeFileSync(path.join(root,'house-builder-v355.js'),out);
console.log('house-builder-v355.js',(out.length/1e6).toFixed(2),'MB,',chosen.length,'designer statements,',builder.split('\n').length,'builder lines');
