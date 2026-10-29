// V224: one table of real sizes for the Stone Age buildings (detail units, 1 unit ≈ 1.05 m;
// a person is 1.66 units ≈ 1.75 m). Every far and near model of a type is scaled to the SAME size,
// so models from different generators match each other, the people and the building plots.
// size = longest side of the footprint (kept inside the existing plot, navigation.js FOOTPRINTS),
// h = total height to the roof ridge / top. Height may differ from the model's own proportions
// by at most -20 % / +35 % so nothing gets visibly squashed or stretched.
import * as T from './vendor/three.module.js';

export const STONE_SIZES=Object.freeze({
 hall:    {size:10.0,h:5.4,note:'longhouse ~10.5 x 6 m, ridge 5.7 m'},
 house:   {size:7.0, h:4.9,note:'round house Ø 7.3 m, ridge 5.1 m, eaves ~1.7 m'},
 lumber:  {size:8.4, h:4.6,note:'woodcutter hut with log store'},
 quarry:  {size:9.0, h:2.9,note:'terraced rock face ~3 m'},
 well:    {size:3.0, h:2.7,note:'stone ring Ø ~2 m with frame'},
 farm:    {size:9.0, h:4.8,note:'farmstead'},
 barracks:{size:9.2, h:5.4,note:'warriors hall'},
 archery: {size:9.2, h:4.2,note:'archery ground with hut'},
 hunter:  {size:8.4, h:4.6,note:'hunter hut'},
 fisher:  {size:9.2, h:4.4,note:'fisher hut with racks'},
 study:   {size:8.6, h:5.0,note:'elders hut'}
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// extent: size of the UNSCALED geometry (Vector3). Returns per-axis scale.
export function stoneScale(type,extent,seed=0){
 const spec=STONE_SIZES[type];if(!spec||!extent)return null;
 const jitter=type==='house'?.95+((seed>>>3)%7)*.017:1;
 const s=spec.size/Math.max(extent.x,extent.z,1e-6)*jitter;
 const natural=extent.y*s,sy=s*clamp(spec.h*jitter/Math.max(natural,1e-6),.8,1.35);
 return new T.Vector3(s,sy,s);
}
export function applyStoneSize(mesh,type,extent,seed=0){
 const v=stoneScale(type,extent,seed);if(!v)return false;mesh.scale.copy(v);mesh.userData.stoneSizeV224=type;return true;
}
