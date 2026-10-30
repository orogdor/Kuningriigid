// V222: lightweight, game-ready procedural motion for the existing Stone Age rigs.
// No model conversion, GPU inference, external assets or third-party animation licence.
// Rotations are applied to the V221 17-bone skinned human and layered over V148 soldier clips.
const PI = Math.PI;
const clamp = (x, a=0, b=1) => Math.max(a, Math.min(b, x));
const ease = (a,b,t) => { const x=clamp((t-a)/(b-a)); return x*x*(3-2*x); };
const cycle = (t,seconds) => ((t/seconds)%1+1)%1;
const damp = (old,target,dt,speed=9) => old+(target-old)*(1-Math.exp(-clamp(dt,0,.12)*speed));
function point(B,name,x,y=0,z=0,w=1){
 const b=B[name];if(!b||w<=0)return;
 const v=b.rotation;v.x+=(x-v.x)*w;v.y+=(y-v.y)*w;v.z+=(z-v.z)*w;
}
function offset(B,name,x=0,y=0,z=0){
 const b=B[name];if(!b)return;b.rotation.x+=x;b.rotation.y+=y;b.rotation.z+=z;
}
const WALK_BONES=['hips','spine','chest','neck','head','upperArm_L','forearm_L','hand_L','upperArm_R','forearm_R','hand_R','thigh_L','shin_L','foot_L','thigh_R','shin_R','foot_R'];

export function animateStoneWorkerV222(root,time,moving=false,attack=false){
 const r=root?.userData?.rig;if(!r?.stoneHuman)return false;
 const B=r.bones;const t=time+r.phase;
 const action=attack&&typeof attack==='object'?attack.action:null;
 const dt=r.lastMotionTime==null?1/30:Math.max(0,Math.min(.12,time-r.lastMotionTime));
 r.lastMotionTime=time;
 r.workClock=(r.workClock??time)+dt*Math.max(0,Math.min(4,attack?.workRate??1));
 const workT=r.workClock+r.phase;
 if(r.motionMove==null)r.motionMove=moving?1:0;
 if(r.motionWork==null)r.motionWork=action&&!moving&&action!=='carry'?1:0;
 r.motionMove=damp(r.motionMove,moving?1:0,dt,11);
 r.motionWork=damp(r.motionWork,action&&!moving&&action!=='carry'?1:0,dt,9);
 const locomotion=r.motionMove,work=r.motionWork*(1-locomotion);
 for(const name of WALK_BONES)if(B[name])B[name].rotation.set(0,0,0);
 B.hips.position.y=.50;
 // Standing: subtle breathing, eye-line movement and body-weight transfer.
 const breath=Math.sin(t*1.65),balance=Math.sin(t*.55);
 point(B,'spine',.012*breath,0,.014*balance);
 point(B,'chest',.017*breath,.015*balance);
 point(B,'head',-.014*breath,.055*Math.sin(t*.43));
 point(B,'upperArm_L',-.11,0,.08);point(B,'upperArm_R',-.11,0,-.08);
 point(B,'forearm_L',-.23);point(B,'forearm_R',-.23);
 B.hips.position.y+=.004*breath;
 // Heel strike -> toe-off, alternating knee bends and opposite-arm swing.
 const stride=Math.sin(t*7.6),liftL=Math.max(0,Math.sin(t*7.6+1.05)),liftR=Math.max(0,Math.sin(t*7.6+1.05+PI));
 point(B,'thigh_L',-.56*stride,0,.027,locomotion);
 point(B,'thigh_R',.56*stride,0,-.027,locomotion);
 point(B,'shin_L',.66*liftL,0,0,locomotion);
 point(B,'shin_R',.66*liftR,0,0,locomotion);
 point(B,'foot_L',-.23*liftL+.12*Math.max(0,-stride),0,0,locomotion);
 point(B,'foot_R',-.23*liftR+.12*Math.max(0,stride),0,0,locomotion);
 point(B,'upperArm_L',.42*stride,0,.08,locomotion);
 point(B,'upperArm_R',-.42*stride,0,-.08,locomotion);
 point(B,'forearm_L',-.30-.12*liftL,0,0,locomotion);
 point(B,'forearm_R',-.30-.12*liftR,0,0,locomotion);
 point(B,'spine',.075,.045*stride,.028*stride,locomotion);
 point(B,'chest',.01,-.055*stride,0,locomotion);
 point(B,'head',-.03,-.025*stride,0,locomotion);
 B.hips.position.y+=locomotion*(.007+.012*(1-Math.cos(t*15.2))*.5);
 // Jobs have distinct cycles; strike/recovery is asymmetric instead of a sinusoidal arm sweep.
 if(work>.0001){
  const mining=action==='mine',chopping=action==='chop'||action==='forge',building=action==='build'||action==='work'||action==='saw'||action==='mill'||action==='train';
  if(mining||chopping||building){
   const duration=mining?1.85:chopping?1.45:1.12;
   const u=cycle(workT+(r.phase*.06),duration);
   const wind=ease(.04,.43,u)*(1-ease(.45,.62,u));
   const strike=ease(.44,.61,u)*(1-ease(.63,.90,u));
   const reach=mining?1.0:chopping?.9:.55;
   point(B,'upperArm_R',-.36-1.45*reach*wind+.72*strike,0,-.18,work);
   point(B,'forearm_R',-.62-.43*wind+.23*strike,0,0,work);
   point(B,'upperArm_L',-.24-(mining?1.32:chopping?.95:.25)*wind,0,.16,work);
   point(B,'forearm_L',-.42-.36*wind,0,0,work);
   point(B,'spine',.17+.24*strike,.16*wind-.13*strike,.05,work);
   point(B,'chest',-.04,.12*wind-.1*strike,0,work);
   point(B,'head',-.12,0,0,work);
   point(B,'thigh_L',-.18,0,.06,work);
   point(B,'thigh_R',.12,0,-.05,work);
   point(B,'shin_L',.18,0,0,work);
   B.hips.position.y-=.018*work*strike;
  }else if(['gather','plant','farm'].includes(action)){
   const u=cycle(workT,2.2),reach=ease(.12,.4,u)*(1-ease(.68,.93,u));
   point(B,'spine',.58+.13*reach,0,0,work);
   point(B,'chest',.16,0,0,work);point(B,'head',-.32,0,0,work);
   point(B,'upperArm_L',-.6-.4*reach,0,.10,work);
   point(B,'upperArm_R',-.65-.44*reach,0,-.10,work);
   point(B,'forearm_L',-.36-.18*reach,0,0,work);point(B,'forearm_R',-.36-.17*reach,0,0,work);
   point(B,'thigh_L',-.43,0,.06,work);point(B,'thigh_R',-.34,0,-.06,work);
   point(B,'shin_L',.62,0,0,work);point(B,'shin_R',.44,0,0,work);
   B.hips.position.y-=.035*work;
  }else if(action==='fishing'||action==='hunt'){
   const u=cycle(workT,3.1),cast=ease(.26,.55,u)*(1-ease(.63,.85,u));
   point(B,'upperArm_R',-1.10-.8*cast,0,-.1,work);
   point(B,'forearm_R',-.6+.26*cast,0,0,work);
   point(B,'upperArm_L',-.72,0,.1,work);
   point(B,'forearm_L',-.76,0,0,work);
   point(B,'spine',.10-.09*cast,.12*cast,0,work);
   point(B,'thigh_L',-.14,0,0,work);point(B,'thigh_R',.08,0,0,work);
  }else if(action==='water'){
   const s=Math.sin(workT*2.8);
   point(B,'upperArm_L',-.96+.16*s,0,.18,work);
   point(B,'upperArm_R',-.96-.16*s,0,-.18,work);
   point(B,'forearm_L',-.83,0,0,work);point(B,'forearm_R',-.83,0,0,work);
   point(B,'spine',.10,0,0,work);
  }else {
   const s=Math.sin(workT*3.2);
   point(B,'upperArm_L',-.54+.25*s,0,.06,work);
   point(B,'upperArm_R',-.54-.25*s,0,-.06,work);
   point(B,'forearm_L',-.55,0,0,work);point(B,'forearm_R',-.55,0,0,work);
   point(B,'spine',.12,0,0,work);
  }
 }
 // Carrying can be layered over walking, rather than freezing the legs.
 if(action==='carry'){
  const hold=.93;
  point(B,'upperArm_L',-.80,0,.12,hold);
  point(B,'upperArm_R',-.80,0,-.12,hold);
  point(B,'forearm_L',-1.07,0,0,hold);
  point(B,'forearm_R',-1.07,0,0,hold);
  point(B,'chest',-.04,0,0,.55);
 }
 const phase=attack&&typeof attack==='object'?(attack.phase??-1):(attack?.4:-1);
 if(phase>=0&&phase<=1){
  const wind=ease(0,.27,phase)*(1-ease(.31,.50,phase));
  const jab=ease(.31,.52,phase)*(1-ease(.66,.96,phase));
  point(B,'upperArm_R',-.55-1.35*wind+.35*jab,0,-.1,.94);
  point(B,'forearm_R',-.55+.42*jab,0,0,.94);
  point(B,'spine',.05,.20*wind-.18*jab,0,.83);
 }
 if(attack?.hit)offset(B,'spine',-.23,.09,.10);
 if(r.tool)r.tool.visible=action!=='carry';
 r.animationV222=true;
 return true;
}

const STONE_FIGHTERS=new Set(['slinger','spearman','axeman','archer','scout','militia']);
export function enhanceStoneWarriorV222(root,time,moving=false,attack=false){
 const r=root?.userData?.rig,kind=r?.unitKind;
 if(!r?.v148||!STONE_FIGHTERS.has(kind))return false;
 const B=r.bones,t=time+r.phase*.15,phase=attack&&typeof attack==='object'?(attack.phase??-1):(attack?.4:-1);
 const active=phase>=0&&phase<=1;
 const dt=r.lastStoneMotionAt==null?1/30:Math.max(0,Math.min(.12,time-r.lastStoneMotionAt));
 r.lastStoneMotionAt=time;
 if(r.stoneMotionMove==null)r.stoneMotionMove=moving?1:0;
 r.stoneMotionMove=damp(r.stoneMotionMove,moving?1:0,dt,10);
 const walk=r.stoneMotionMove,swing=Math.sin(t*8);
 // Overlay existing V148 walk/idle clips rather than replacing their authored poses.
 offset(B,'body',.018*Math.sin(t*1.6),.016*Math.sin(t*.7),.018*Math.sin(t*.5));
 if(B.body)B.body.position.y+=walk*(.008+.008*(1-Math.cos(t*16))*.5);
 offset(B,'chest',.018*walk,-.065*walk*swing,.025*walk*swing);
 offset(B,'head',-.018*walk,0,0);
 if(!active){
  // Guard poses and formation braces only apply while standing.
  const formed=attack&&typeof attack==='object'?clamp(((attack.formed??0)-.35)*2):0;
  if(!moving&&formed>0){
   if(attack.formation==='spear_wall'){
    offset(B,'upperArm_R',-.30*formed,0,-.12*formed);
    offset(B,'forearm_R',-.15*formed,0,0);
    offset(B,'chest',.08*formed,0,0);
   }else if(attack.formation==='shield_wall'){
    offset(B,'upperArm_L',-.24*formed,0,.18*formed);
    offset(B,'forearm_L',-.1*formed,0,0);
   }
  }
 }else{
  const wind=ease(.02,.30,phase)*(1-ease(.32,.51,phase));
  const strike=ease(.31,.50,phase)*(1-ease(.55,.86,phase));
  const recoil=ease(.62,.83,phase)*(1-ease(.87,1,phase));
  const role=kind==='scout'||kind==='militia'?'spearman':kind;
  if(role==='spearman'){
   // Draw spear back, step in, thrust forward, recover to guard.
   offset(B,'upperArm_R',-.67*wind+.39*strike,0,-.13*wind);
   offset(B,'forearm_R',-.28*wind+.24*strike,0,0);
   offset(B,'upperArm_L',-.24*wind,0,.12*strike);
   offset(B,'chest',.16*strike,-.17*wind+.18*strike,0);
   offset(B,'head',-.09*strike,0,0);
  }else if(role==='axeman'){
   // Two-stage overhead chop with torso follow-through.
   offset(B,'upperArm_R',-.74*wind+.68*strike,0,-.26*wind+.20*strike);
   offset(B,'forearm_R',-.27*wind+.33*strike,0,0);
   offset(B,'upperArm_L',-.31*wind,0,.08*wind);
   offset(B,'chest',.22*strike,.31*wind-.34*strike,0);
   offset(B,'head',-.12*strike,0,0);
  }else if(role==='slinger'){
   // Circular wind-up, release at the end of the forward sweep.
   const circle=wind*Math.sin(phase*PI*5);
   offset(B,'upperArm_R',-.43*wind+.36*strike,0,.48*circle);
   offset(B,'forearm_R',-.27*wind+.30*strike,0,.22*circle);
   offset(B,'chest',.11*strike,-.28*wind+.35*strike,0);
  }else if(role==='archer'){
   // Aim, draw and release; the bow stays bound to the existing weapon bone.
   offset(B,'upperArm_L',-.24*wind,0,.08*wind);
   offset(B,'upperArm_R',-.15*wind+.24*strike,0,-.29*wind);
   offset(B,'forearm_R',-.37*wind+.3*strike,0,0);
   offset(B,'chest',-.06*wind,-.13*wind+.1*strike,0);
   offset(B,'head',-.07*wind,0,0);
  }
  offset(B,'body',.08*strike-.05*recoil,0,0);
 }
 if(attack?.hit){offset(B,'body',-.18,.08,.07);offset(B,'head',.10,0,0);}
 r.animationV222=true;
 return true;
}
