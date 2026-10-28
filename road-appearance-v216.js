// Deterministic V216 surfacing: traffic controls speed, period controls visual materials.
export function roadSurfaceLevelV216(heatLevel,age){
 const level=Math.max(0,Math.min(4,Math.floor(Number(heatLevel)||0)));
 const era=Math.max(0,Math.floor(Number(age)||0));
 if(!level)return 0;
 if(era===0)return 1; // Stone age: dirt only
 if(era===1)return level>=3?2:1; // Bronze age: dirt and crushed gravel
 if(era===2)return Math.min(level,2); // Iron age: gravel
 if(era===3)return Math.min(level,3); // Medieval: cobbles
 return level; // Later: laid stone roads possible
}
export function roadWidthRatioV216(level,age){
 const surface=roadSurfaceLevelV216(level,age);
 return surface<=1?.78:surface===2?.86:surface===3?.94:1;
}
export function roadEdgeVarianceV216(x,z){
 return .95+.055*Math.sin(x*.19+Math.sin(z*.15)*1.3)+.025*Math.sin(z*.39+x*.22);
}
