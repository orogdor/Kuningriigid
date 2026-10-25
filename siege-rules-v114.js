// Game-scale profiles: height is the walk deck, not the top of the parapet.
export const WALL_PROFILES=Object.freeze({
 palisade:{name:'Puitvall',height:2.4,hp:420,cover:.55,material:'wood'},
 stonewall:{name:'Madal kivivall',height:3.8,hp:900,cover:.45,material:'stone'},
 reinforced_wall:{name:'Kõrge kivivall',height:6.4,hp:1800,cover:.35,material:'stone'},
 gatehouse:{name:'Kindlustatud värav',height:3.8,hp:700,cover:.45,material:'gate'},
 woodgate:{name:'Puidust külavärav',height:3.1,hp:320,cover:.2,material:'gate'}
});
export const wallProfile=type=>WALL_PROFILES[type];
// Once-only save migration preserves the fraction of damage, including ruins.
export function prepareWall(b){const p=wallProfile(b?.type);if(!p)return b;
 if(b.wallRulesVersion!==114){const old=b.damageMaxHp||b.hp||350,ratio=Math.max(0,Math.min(1,(b.hp??old)/old));b.hp=p.hp*ratio;b.damageMaxHp=p.hp;b.wallRulesVersion=114;}
 return b;
}
export function structuralMultiplier(kind,type){
 const material=wallProfile(type)?.material||'stone';
 if(kind==='siege_tower')return 0; // Access equipment is not a wall-breaking weapon.
 if(kind==='battering_ram')return material==='gate'?4:material==='wood'?2.5:.12;
 const artillery={bronze_catapult:.8,catapult:1.5,field_cannon:4,industrial_artillery:6}[kind];
 if(artillery)return artillery*(material==='wood'?1.5:1);
 if(material==='stone')return 0;
 if(/archer|bow|slinger|scout|chariot|cavalry|knight/.test(kind))return 0;
 return /axe|axeman/.test(kind)?.35:.07;
}
export function parapetCover(attacker,target,projectile){
 if(!target.u.guardPost)return 1;
 if(!projectile||projectile==='stone')return .85;
 if(projectile==='ballista')return .65;
 const ay=attacker.m.elevation??attacker.u.wallElevation??0,ty=target.m.elevation??target.u.wallElevation??3.8;
 return ay<ty-1?(wallProfile(target.u.wallType)?.cover??.45):.85;
}

// Straight small-arms shots cannot pass through an intact curtain wall.
// Wall-top shots and the high arc of stone artillery are treated separately.
export function wallBlocksShot(b,from,to,fromY=0,toY=0){
 const dx=to.x-from.x,dz=to.z-from.z,l2=dx*dx+dz*dz;if(!l2)return false;
 return (b.siegeSections||[]).some(w=>{if(w.hp<=0||w.breached)return false;
 const t=((w.x-from.x)*dx+(w.z-from.z)*dz)/l2;if(t<=.03||t>=.97)return false;
 const x=from.x+dx*t-w.x,z=from.z+dz*t-w.z;
 return Math.abs(x)<(w.wallAxis?1.5:3.6)&&Math.abs(z)<(w.wallAxis?3.6:1.5)&&fromY+(toY-fromY)*t+1.6<(w.height||3.8);
 });
}
