// V161: smooth detail-tile changes. three.js frees a shader program as soon as the last material
// using it is disposed, so rebuilding the 3x3 detail area used to dispose every landscape material
// and then compile the same shaders again (the long freeze when walking onto the next tile).
// Materials here only carry uniforms; we free their textures but keep the material (and with it
// the compiled program) alive. The set of programs is fixed, so nothing grows over time.
const TEX=['map','alphaMap','aoMap','bumpMap','normalMap','roughnessMap','metalnessMap','emissiveMap','lightMap','displacementMap','envMap','specularMap'];
export function releaseMaterial(material){
 if(!material)return;
 for(const m of Array.isArray(material)?material:[material]){
  if(!m||m.userData?.sharedLandscape)continue;
  for(const k of TEX)if(m[k]?.isTexture&&!m[k].userData?.shared)m[k].dispose();
 }
}
