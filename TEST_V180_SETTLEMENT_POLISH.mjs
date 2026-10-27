import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {createBronzeCityModel} from './bronze-city-v111.js';
import {wallHasTowerV180,cutWallAtTowerV180} from './wall-tower-visual-v180.js';
import {streetConnections} from './town-streets-v80.js';
const wall={type:'palisade',x:0,z:0,hp:100,ready:true,drawnWallV175:true,palisadeSpanV167:7};
const tower={type:'watchtower',x:0,z:0,hp:100,ready:true};
assert.equal(wallHasTowerV180(wall,[wall,tower]),true);
assert.equal(wallHasTowerV180(wall,[wall,{...tower,ready:false}]),false);
const model=cutWallAtTowerV180(createBronzeCityModel('palisade',0,0),wall);model.updateMatrixWorld(true);
const [left,right]=model.children.map(p=>new T.Box3().setFromObject(p));
assert.ok(left.max.x<0&&right.min.x>0,'wall does not render through the centre of the tower');
assert.ok(left.max.x<2.575&&right.min.x<2.575,'both ends overlap the tower footprint');
const hall={type:'hall',x:0,z:0,ready:true,hp:100},gate={type:'woodgate',x:30,z:0,ready:true,hp:100},house={type:'house',x:5,z:15,ready:true,hp:100};
assert.ok(streetConnections([hall,gate,house]).some(l=>l.kind==='gate-approach'&&(l.from===gate||l.to===gate)));
console.log('V180 WALL-TOWER GEOMETRY AND GATE ROUTING PASS');
const {createAmbientSoundV180}=await import('./ambient-sound-v180.js');
const unsupported=createAmbientSoundV180({AudioContextClass:null});assert.equal(await unsupported.setEnabled(true),false);unsupported.setVolume(2);assert.equal(unsupported.volume,1);
const fs=await import('node:fs');const {Civilization}=await import('./civilization-core.js');const {createVillageLife}=await import('./village-life-v76.js');
const game=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-mountain-v176.json')));game.seen=()=>true;const city=game.s.cities[0];
const life=createVillageLife(game,()=>0,{quality:()=> 'low'}),scene=new T.Group();life.show(game.cell(city),scene);
for(let time=1;time<=90;time++)life.update(time,.1);
assert.ok(life.stats().some(s=>s.actorCount>0));scene.traverse(o=>{assert.ok(Number.isFinite(o.position.x)&&Number.isFinite(o.position.y)&&Number.isFinite(o.position.z),'actors retain valid positions');});
console.log('V180 CITY LIFE NAVIGATION PASS');
class FakeParam { constructor(){this.value=0}setValueAtTime(){}exponentialRampToValueAtTime(){} }
class FakeNode { constructor(){this.gain=new FakeParam();this.frequency=new FakeParam()}connect(){}start(){FakeAudio.started++}stop(){} }
class FakeAudio { static started=0;constructor(){this.sampleRate=8000;this.currentTime=0;this.state='suspended';this.destination={}}createGain(){return new FakeNode()}createBuffer(){return {getChannelData:()=>new Float32Array(16000)}}createBufferSource(){return new FakeNode()}createBiquadFilter(){return new FakeNode()}createOscillator(){return new FakeNode()}async resume(){this.state='running'}async suspend(){this.state='suspended'}}
const audio=createAmbientSoundV180({AudioContextClass:FakeAudio,random:()=>.5});assert.equal(FakeAudio.started,0,'no sound before user gesture');assert.equal(await audio.setEnabled(true),true);audio.update({local:true,paused:false,walker:{x:0,z:0}});const beforeStep=FakeAudio.started;audio.update({local:true,paused:false,walker:{x:2,z:0}});assert.ok(FakeAudio.started>beforeStep,'movement creates a footstep');assert.equal(await audio.setEnabled(false),false);assert.equal(audio.enabled,false);console.log('V180 OPTIONAL AMBIENT AUDIO PASS');
