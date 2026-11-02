// V222: lightweight, game-ready procedural motion for the existing Stone Age rigs.
// No model conversion, GPU inference, external assets or third-party animation licence.
// Rotations are applied to the V221 17-bone skinned human and layered over V148 soldier clips.
const PI = Math.PI;
const clamp = (x, a=0, b=1) => Math.max(a, Math.min(b, x));
const ease = (a,b,t) => { const x=clamp((t-a)/(b-a)); return x*x*(3-2*x); };
const cycle = (t,seconds) => ((t/seconds)%1+1)%1;
// V253 hip drops that keep the feet / knee / seat on the ground (rig hips stand at .50)
const KNEEL_DROP=.235,SIT_DROP=.40;
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
  }else if(action==='dig'){ // V252 clay pit: two-handed digging stick, thrust down and lever up
   const u=cycle(workT,1.7),lift=ease(.05,.40,u)*(1-ease(.42,.58,u)),push=ease(.42,.58,u)*(1-ease(.70,.95,u));
   point(B,'upperArm_R',-.95-.75*lift+.45*push,0,-.12,work);point(B,'forearm_R',-.70-.30*lift,0,0,work);
   point(B,'upperArm_L',-.70-.65*lift+.40*push,0,.12,work);point(B,'forearm_L',-.85-.25*lift,0,0,work);
   point(B,'spine',.30+.25*push,0,0,work);point(B,'chest',.08,0,0,work);point(B,'head',-.18,0,0,work);
   point(B,'thigh_L',-.30-.15*push,0,.06,work);point(B,'thigh_R',.10,0,-.05,work);point(B,'shin_L',.35+.2*push,0,0,work);
   B.hips.position.y-=.03*work*push;
  }else if(action==='pottery'){ // V252 potter: crouched, hands shaping a coil pot in slow circles
   const a=workT*1.6;
   point(B,'thigh_L',-1.5,0,.12,work);point(B,'shin_L',1.5,0,0,work);point(B,'thigh_R',.05,0,-.1,work);point(B,'shin_R',1.55,0,0,work); // V253 kneel: feet stay on the ground
   point(B,'spine',.42,0,0,work);point(B,'chest',.12,0,0,work);point(B,'head',-.35,.06*Math.sin(a*.5),0,work);
   point(B,'upperArm_L',-.55+.10*Math.sin(a),0,.22+.10*Math.cos(a),work);point(B,'upperArm_R',-.55+.10*Math.sin(a+PI),0,-.22-.10*Math.cos(a+PI),work);
   point(B,'forearm_L',-1.05+.15*Math.cos(a),0,0,work);point(B,'forearm_R',-1.05+.15*Math.cos(a+PI),0,0,work);
   B.hips.position.y-=KNEEL_DROP*work;
  }else if(action==='chisel'){ // V252 stoneworker: kneeling, left hand holds the chisel, right hand taps with a hammer stone
   const u=cycle(workT,.62),up=ease(.0,.55,u)*(1-ease(.58,.72,u)),hit=ease(.58,.70,u)*(1-ease(.72,1,u));
   point(B,'thigh_L',-1.5,0,.10,work);point(B,'shin_L',1.5,0,0,work);point(B,'thigh_R',.05,0,-.12,work);point(B,'shin_R',1.55,0,0,work); // V253 kneel
   point(B,'spine',.45,0,0,work);point(B,'head',-.30,0,0,work);
   point(B,'upperArm_L',-.70,0,.18,work);point(B,'forearm_L',-.90,0,0,work);
   point(B,'upperArm_R',-.80-.75*up+.25*hit,0,-.15,work);point(B,'forearm_R',-.85-.35*up,0,0,work);
   B.hips.position.y-=KNEEL_DROP*work;
  }else if(action==='study'){ // V252 elder/teacher: draws signs on the ground with a stick, pauses to explain
   const u=cycle(workT,5.0),draw=ease(.0,.15,u)*(1-ease(.55,.65,u)),talk=ease(.62,.7,u)*(1-ease(.92,1,u));
   point(B,'spine',.25*draw+.05,.10*talk,0,work);point(B,'head',-.30*draw+.05*talk,.15*talk*Math.sin(workT*2),0,work);
   point(B,'upperArm_R',-.60-.25*draw+(-.6)*talk,.15*Math.sin(workT*3)*draw,-.10,work);point(B,'forearm_R',-.40-.5*talk,0,0,work);
   point(B,'upperArm_L',-.20-.3*talk,0,.12,work);point(B,'forearm_L',-.45-.4*talk*Math.max(0,Math.sin(workT*2.4)),0,0,work);
  }else if(action==='herd'){ // V252 herder: leans on a staff, looks over the flock, raises the staff now and then
   const u=cycle(workT,6.0),wave=ease(.70,.78,u)*(1-ease(.85,.95,u));
   point(B,'upperArm_R',-.85-.9*wave,0,-.18,work);point(B,'forearm_R',-.65+.3*wave,0,0,work);
   point(B,'upperArm_L',-.25,0,.10,work);point(B,'forearm_L',-.40,0,0,work);
   point(B,'spine',.06,.25*Math.sin(workT*.4),0,work);point(B,'head',0,.45*Math.sin(workT*.33),0,work);
   point(B,'thigh_L',-.06,0,.05,work);
  }else if(action==='sit'||action==='eat'){ // V253 villagers resting on the ground; eating brings food to the mouth
   const u=cycle(workT,3.2),bite=action==='eat'?ease(.1,.3,u)*(1-ease(.45,.6,u)):0;
   point(B,'thigh_L',-1.5,0,.22,work);point(B,'thigh_R',-1.5,0,-.22,work);point(B,'shin_L',.08,0,0,work);point(B,'shin_R',.16,0,0,work); // V253 seated on the ground, legs forward
   point(B,'spine',.12,0,0,work);point(B,'head',-.06+.04*Math.sin(workT*.6),.2*Math.sin(workT*.4),0,work);
   point(B,'upperArm_L',-.45,0,.18,work);point(B,'forearm_L',-.6,0,0,work);
   point(B,'upperArm_R',-.45-.75*bite,0,-.18,work);point(B,'forearm_R',-.6-1.25*bite,0,0,work);
   B.hips.position.y-=SIT_DROP*work;
  }else if(action==='play'){ // V253 children hop and wave
   const hop=Math.max(0,Math.sin(workT*5.2));
   point(B,'upperArm_L',-1.6-.4*hop,0,.4,work);point(B,'upperArm_R',-1.5-.5*hop,0,-.4,work);
   point(B,'forearm_L',-.3,0,0,work);point(B,'forearm_R',-.3,0,0,work);
   point(B,'thigh_L',-.35*hop,0,.05,work);point(B,'thigh_R',-.35*hop,0,-.05,work);point(B,'shin_L',.6*hop,0,0,work);point(B,'shin_R',.6*hop,0,0,work);
   B.hips.position.y+=.10*work*hop;
  }else if(action==='guard'){ // V253 guard: weight on one leg, spear arm raised, scanning the surroundings
   point(B,'upperArm_R',-1.05,0,-.22,work);point(B,'forearm_R',-.85,0,0,work);
   point(B,'upperArm_L',-.15,0,.12,work);point(B,'forearm_L',-.3,0,0,work);
   point(B,'thigh_L',-.08,0,.08,work);point(B,'thigh_R',.06,0,-.04,work);
   point(B,'spine',.02,.30*Math.sin(workT*.35),0,work);point(B,'head',0,.55*Math.sin(workT*.27+1),0,work);
  }else if(action==='talk'){ // V252 conversation: hand gestures, nods, weight shifts
   const g1=Math.max(0,Math.sin(workT*1.9)),g2=Math.max(0,Math.sin(workT*1.3+2.1));
   point(B,'upperArm_R',-.30-.55*g1,0,-.12-.15*g1,work);point(B,'forearm_R',-.55-.75*g1,0,0,work);
   point(B,'upperArm_L',-.20-.35*g2,0,.10+.1*g2,work);point(B,'forearm_L',-.45-.55*g2,0,0,work);
   point(B,'head',-.06+.08*Math.sin(workT*2.7),.18*Math.sin(workT*.7),0,work);point(B,'spine',.03,.08*Math.sin(workT*.5),0,work);
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
 // V255 stalking hunter: creeps forward bent low, spear held ready, eyes on the game
 if(action==='stalk'){
  const k=.9;
  point(B,'spine',.55,0,0,k);point(B,'chest',.12,0,0,k);point(B,'head',-.38,0,0,k);
  point(B,'upperArm_R',-1.0,0,-.18,k);point(B,'forearm_R',-.85,0,0,k);
  point(B,'upperArm_L',-.65,0,.15,k);point(B,'forearm_L',-.7,0,0,k);
  B.hips.position.y-=.09*k;
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
 if(r.tool)r.tool.visible=action!=='carry'||r.kind==='stone_watercarrier'; // V283: the water carrier brings the jug back full
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
