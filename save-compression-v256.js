// Packed local saves are versioned; plain JSON from older versions remains readable.
import './vendor/pako.min.mjs';
const PREFIX='kingdoms-gzip-v1:';

export function packSave(json){
 if(typeof json!=='string'||json.startsWith(PREFIX))return json;
 const bytes=globalThis.pako.gzip(json),chunks=[];
 for(let i=0;i<bytes.length;i+=0x8000)chunks.push(String.fromCharCode(...bytes.subarray(i,i+0x8000)));
 const packed=PREFIX+btoa(chunks.join(''));
 return packed.length<json.length?packed:json;
}
export function unpackSave(raw){
 if(typeof raw!=='string'||!raw.startsWith(PREFIX))return raw;
 const binary=atob(raw.slice(PREFIX.length)),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return globalThis.pako.ungzip(bytes,{to:'string'});
}
