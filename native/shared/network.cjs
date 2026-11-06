'use strict';
const REPO='orogdor/Kuningriigid',FEED=`https://github.com/${REPO}/releases/download/webapp-content/manifest.json`;
async function bytes(url,max,timeout=30000){const r=await fetch(url,{signal:AbortSignal.timeout(timeout),headers:{'User-Agent':'Kuningriigid-WebApp/0.1','Cache-Control':'no-cache'}});if(!r.ok)throw Error('HTTP '+r.status);const u=new URL(r.url);if(u.protocol!=='https:'||!['github.com','raw.githubusercontent.com','release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(u.hostname))throw Error('Unexpected update host');let n=0;const chunks=[];for await(const b of r.body){n+=b.length;if(n>max)throw Error('Update too large');chunks.push(b);}return Buffer.concat(chunks);}
async function check(){return JSON.parse((await bytes(FEED,4194304,10000)).toString('utf8'));}
async function download(f,m){const name=f.path.split('/').map(encodeURIComponent).join('/');return bytes(`https://raw.githubusercontent.com/${REPO}/${m.version}/${name}`,f.size,60000);}
module.exports={check,download,FEED};
