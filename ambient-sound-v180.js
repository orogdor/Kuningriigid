// Optional procedural outdoor ambience. No downloads, autoplay or saved-game changes.
export function createAmbientSoundV180({AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext,random=Math.random}={}){
 let context,master,wind,filter,playing=false,volume=.24,nextBird=0,nextFoot=0,lastFoot=null;
 async function enable(){
  if(!AudioContextClass)return false;
  if(!context){
   context=new AudioContextClass();master=context.createGain();master.gain.value=volume;master.connect(context.destination);
   const buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),samples=buffer.getChannelData(0);
   for(let i=0;i<samples.length;i++)samples[i]=random()*2-1;
   wind=context.createBufferSource();wind.buffer=buffer;wind.loop=true;filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=340;
   const gain=context.createGain();gain.gain.value=.035;wind.connect(filter);filter.connect(gain);gain.connect(master);wind.start();
  }
  await context.resume();playing=context.state==='running';return playing;
 }
 async function setEnabled(value){if(value)return enable();playing=false;if(context&&context.state==='running')await context.suspend();return false;}
 function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));if(master)master.gain.value=volume;}
 function update({local=false,paused=false,walker=null}={}){
  if(!context||!master)return;
  master.gain.value=playing&&local&&!paused?volume:0;
  if(!playing||!local||paused||context.state!=='running')return;
  if(walker&&Number.isFinite(walker.x)&&Number.isFinite(walker.z)){
   if(!lastFoot)lastFoot={x:walker.x,z:walker.z};
   if(Math.hypot(walker.x-lastFoot.x,walker.z-lastFoot.z)>1.4&&context.currentTime>=nextFoot){
    const t=context.currentTime,step=context.createBufferSource(),stepFilter=context.createBiquadFilter(),stepGain=context.createGain();
    step.buffer=wind.buffer;stepFilter.type='lowpass';stepFilter.frequency.value=240;
    stepGain.gain.setValueAtTime(.0001,t);stepGain.gain.exponentialRampToValueAtTime(.045,t+.015);stepGain.gain.exponentialRampToValueAtTime(.0001,t+.13);
    step.connect(stepFilter);stepFilter.connect(stepGain);stepGain.connect(master);step.start(t,random());step.stop(t+.14);
    nextFoot=t+.23;lastFoot={x:walker.x,z:walker.z};
   }
  }else lastFoot=null;
  if(context.currentTime<nextBird)return;
  nextBird=context.currentTime+9+random()*15;
  const bird=context.createOscillator(),g=context.createGain(),t=context.currentTime;bird.type='sine';bird.frequency.setValueAtTime(1700+random()*500,t);bird.frequency.exponentialRampToValueAtTime(1100,t+.16);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.015,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+.2);bird.connect(g);g.connect(master);bird.start(t);bird.stop(t+.21);
 }
 return {setEnabled,setVolume,update,get enabled(){return playing},get volume(){return volume}};
}
