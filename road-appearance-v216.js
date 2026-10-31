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
// V251: era-appropriate surface for a road of traffic level 1..4 (see roadMaterial in landscape-v149.js).
// 1 footpath  2 cart track  3 gravel  4 cobbles  5 dressed setts  6 macadam  7 asphalt.
// Stone Age has no wheels (footpaths only); wheel ruts come with the Bronze Age; built gravel roads with
// the Iron Age; cobbles in the Middle Ages; dressed setts in the Renaissance; macadam with industry;
// asphalt in the modern era. Minor roads keep the simpler surface of their time.
const ROAD_SURFACES_V251=[
 [1,1,1,1],  // Stone Age
 [1,2,2,2],  // Bronze Age
 [2,3,3,3],  // Iron Age
 [2,3,4,4],  // Middle Ages
 [2,3,4,5],  // Renaissance
 [3,6,6,5],  // Industrial
 [3,6,7,7]   // Modern
];
export function roadSurfaceV251(heatLevel,age){
 const level=Math.max(0,Math.min(4,Math.floor(Number(heatLevel)||0)));if(!level)return 0;
 const era=Math.max(0,Math.min(6,Math.floor(Number(age)||0)));
 return ROAD_SURFACES_V251[era][level-1];
}
export function roadWidthRatioV216(level,age){
 const surface=roadSurfaceLevelV216(level,age);
 return surface<=1?.78:surface===2?.86:surface===3?.94:1;
}
export function roadEdgeVarianceV216(x,z){
 return .95+.055*Math.sin(x*.19+Math.sin(z*.15)*1.3)+.025*Math.sin(z*.39+x*.22);
}
