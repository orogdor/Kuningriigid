// V342: a shared time slice for incremental (generator) builders. The detail
// stream starts a slice before each step; long loops additionally yield once
// the slice is used up, so no single step blocks a frame for long. Yielding
// only splits the work - results are identical to the uninterrupted build.
export const SLICE_MS_V342=4;
let sliceStart=0;
const now=()=>typeof performance!=='undefined'?performance.now():Date.now();
export function beginSliceV342(){sliceStart=now();}
export function sliceDueV342(){return now()-sliceStart>=SLICE_MS_V342;}
