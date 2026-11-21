import * as T from '../vendor/three.module.js';
import { GRAPHICS_DEFAULTS_V226 } from '../graphics-settings-v226.js';
import { graphicsRuntimeV226 } from '../graphics-runtime-v226.js';
import { setupAtmosphere } from '../atmosphere-v158.js?v=161a';
import { createGroundCoverV156 } from '../ground-detail-v156.js';
import { createMedievalBuilding } from '../medieval-buildings-v80.js';
import { createFortificationPreview } from './fortification-models.js';

import { createFortificationMaterials, loadFortificationTextures } from './fortification-materials.js';

const sample = (i, j = 0) => T.MathUtils.euclideanModulo(Math.sin(i * 127.1 + j * 377.3) * 43758.5453123, 1);

function terrainHeight(x, z) {
  const outside = T.MathUtils.smoothstep(Math.hypot(x * .8, z), 25, 88);
  const rolling = (Math.sin(x * .038 - .8) * 4.5 + Math.cos(z * .043 + .2) * 3.4
    + Math.sin((x + z) * .062) * 2.6);
  return -.055 + outside * rolling;
}

function makeTerrain(scene, textures) {
  const groundGeo = new T.PlaneGeometry(750, 750, 144, 144).rotateX(-Math.PI / 2);
  const p = groundGeo.attributes.position, uv = groundGeo.attributes.uv;
  const colors = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, terrainHeight(x, z));
    uv.setXY(i, x / 9, z / 9);
    const gray = .85 + .12 * Math.sin(x * .106) * Math.cos(z * .079) + .035 * sample(i, 33);
    colors.push(gray, gray, gray * .95);
  }
  groundGeo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();
  const material = new T.MeshStandardMaterial({
    map: textures.grass, normalMap: textures.grassNormal, normalScale: new T.Vector2(.53,.53),
    roughness: 1, color: '#b5b88e', vertexColors: true,
  });
  const ground = new T.Mesh(groundGeo, material);
  ground.receiveShadow = true;
  scene.add(ground);
}

function roadAlpha() {
  const values = new Uint8Array(64 * 4);
  for (let x = 0; x < 64; x++) {
    const edge = T.MathUtils.smoothstep(Math.min(x,63-x), 0, 13);
    values.set([255, Math.round(edge * 255), 255, 255], x * 4);
  }
  const tex = new T.DataTexture(values, 64, 1);
  tex.magFilter = tex.minFilter = T.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function road(scene, textures) {
  const position = [], uv = [], normalUV = [], index = [];
  const pathX = z => z < 0 ? .077 * z : Math.sin(z * .054) * T.MathUtils.smoothstep(z, 6, 26) * 7;
  const across = 9;
  const sections = 88;
  for (let i = 0; i <= sections; i++) {
    const z = -59 + i * 1.6;
    const width = 3.05 + Math.sin(i * .44) * .24;
    for (let j = 0; j <= across; j++) {
      const u = j / across;
      const x = pathX(z) + (u - .5) * width * 2;
      position.push(x, terrainHeight(x,z) + .048, z);
      uv.push(x / 4.6, z / 4.6);
      normalUV.push(u, .5);
      if (i < sections && j < across) {
        const k = i * (across + 1) + j;
        index.push(k,k+across+1,k+1,k+1,k+across+1,k+across+2);
      }
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(position, 3));
  geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geo.setAttribute('uv1', new T.Float32BufferAttribute(normalUV, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const alphaMap = roadAlpha();
  alphaMap.channel = 1;
  const track = new T.Mesh(geo, new T.MeshStandardMaterial({
    map: textures.soil, normalMap: textures.soilNormal, normalScale: new T.Vector2(.44,.44),
    alphaMap, transparent:true, depthWrite:false, color:'#c8b8a0', roughness:1,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  }));
  track.receiveShadow = true;
  scene.add(track);
}

function vegetation(scene, textures) {
  const tile = { land: true, biome:'grassland', c:93, r:162 };
  scene.add(createGroundCoverV156(tile, terrainHeight, 'high', {
    rects: [[0,-2,26,11.5]],
    segments: [[0,-66,0,11,3.3],[0,11,6.5,38,3.7],[6.5,38,-1,60,4]],
  }, { fraction:.66 }));
  const paths = new T.Group();
  const trunk = new T.CylinderGeometry(.115,.33,1,7);
  const crowns = [new T.IcosahedronGeometry(1, 1), new T.ConeGeometry(1,1,10)];
  const bark = new T.MeshStandardMaterial({ color:'#584a37', roughness:1 });
  const foliage = new T.MeshStandardMaterial({ color:'#ffffff', map:textures.forest, roughness:1, flatShading:true });
  const n = 129;
  const trunks = new T.InstancedMesh(trunk, bark, n);
  const trees = crowns.map(geo => new T.InstancedMesh(geo, foliage, n * 4));
  for (const group of [trunks, ...trees]) {
    group.castShadow = group.receiveShadow = true;
    group.count = 0;
    paths.add(group);
  }
  const dummy = new T.Object3D(), color = new T.Color();
  for (let i = 0; i < n; i++) {
    const angle = 2.7 + sample(i, 4) * 4.15;
    const range = 46 + sample(i, 8) ** .85 * 111;
    let x = Math.sin(angle) * range, z = Math.cos(angle) * range;
    if (z > 21 && Math.abs(x) < 47) x += x < 0 ? -38 : 38;
    const y = terrainHeight(x, z), tall = 4.7 + sample(i, 16) ** .7 * 8.3;
    dummy.position.set(x, y + tall * .36, z);
    dummy.scale.set(tall*.28, tall*.74, tall*.27);
    dummy.rotation.set(0, sample(i, 12) * 6, 0);
    dummy.updateMatrix();
    trunks.setMatrixAt(trunks.count++, dummy.matrix);
    const type = sample(i, 32) > .58 ? 1 : 0;
    const tree = trees[type];
    const tilt = sample(i, 70) * 6;
    for (let j = 0; j < (type ? 4 : 3); j++) {
      const spread = type ? 0 : tall * .13;
      dummy.position.set(x + Math.cos(j*2.4+tilt) * spread, y + tall * (.62+j*.095), z + Math.sin(j*2.4+tilt) * spread);
      const radius = tall * (type ? .265 - j*.053 : .225 - j*.023);
      dummy.scale.set(radius, tall * (type ? .47 : .24), radius * (type ? 1 : .88));
      dummy.rotation.set(0, tilt + j * .27, 0);
      dummy.updateMatrix();
      tree.setMatrixAt(tree.count, dummy.matrix);
      color.set(type ? '#65794f' : '#7d8b58').multiplyScalar(.78 + sample(i, j + 42)*.42);
      tree.setColorAt(tree.count++, color);
    }
  }
  scene.add(paths);

  for (const [x,z,angle] of [[-24,-23,.3],[-15,-29,-.25],[-31,-29,-.23],[9,-32,.35]]) {
    const house = createMedievalBuilding('house');
    house.position.set(x, terrainHeight(x,z), z);
    house.scale.setScalar(.75);
    house.rotation.y = angle;
    scene.add(house);
  }
}

export async function createWorkshopScene(canvas) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene();
  const worldScene = new T.Scene();
  const camera = new T.PerspectiveCamera(37, 1, .12, 620);
  const atmosphere = setupAtmosphere({ renderer, worldScene, localScene: scene, quality:'high' });
  const graphics = graphicsRuntimeV226({
    settings:{ ...GRAPHICS_DEFAULTS_V226, daylight:'dynamic', lighting:'enhanced', shadowDistance:'near',
      fpsLimit:'60', particles:'off', resolution:100, clouds:false },
    renderer, atmosphere, worldScene, localScene:scene, getQuality:()=>'high',
  });
  const textures = await loadFortificationTextures();
  const materials = createFortificationMaterials(textures);
  makeTerrain(scene, textures);
  road(scene, textures);
  vegetation(scene, textures);
  graphics.apply();
  scene.fog.near = 101;
  scene.fog.far = 237;

  const focus = new T.Vector3();
  const bounds = new T.Box3();
  const size = new T.Vector3();
  const ray = new T.Raycaster();
  const pointer = new T.Vector2();
  let current;
  let yaw = .28, pitch = .47, distance = 61, framing = 61;
  let view = 'gate';
  let needsRender = false;
  const gameTime = 139;

  function resize() {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function fit(resetAngle = true) {
    if (!current) return;
    bounds.setFromObject(current.group);
    bounds.getSize(size);
    bounds.getCenter(focus);
    focus.y = size.y * .43;
    focus.z += 1.15;
    const horizontal = size.x + size.z * .40;
    const projectedY = size.y * .95 + size.z * .44;
    const fov = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    framing = Math.max(horizontal/(2*fov*camera.aspect*.76), projectedY/(2*fov*.64), 15);
    distance = framing;
    if (resetAngle) {
      yaw = .28;
      pitch = .51;
    }
    invalidate();
  }

  function draw(now) {
    needsRender = false;
    const y = Math.sin(pitch) * distance;
    const ellipse = Math.cos(pitch) * distance;
    camera.position.set(focus.x + Math.sin(yaw) * ellipse, focus.y + y, focus.z + Math.cos(yaw) * ellipse);
    camera.lookAt(focus);
    camera.updateMatrixWorld();
    atmosphere.update(scene, focus, distance, 0, gameTime);
    graphics.render(scene, camera, now);
  }

  function invalidate() {
    if (needsRender) return;
    needsRender = true;
    requestAnimationFrame(draw);
  }

  function setDesign(design, part, solo, reframe = false) {
    const nextView = solo ? part : 'assembly';
    current?.dispose();
    current = createFortificationPreview(design, materials, solo ? part : null);
    scene.add(current.group);
    if (nextView !== view || reframe) fit();
    else invalidate();
    view = nextView;
  }

  new ResizeObserver(() => { resize(); fit(false); }).observe(canvas);
  resize();

  function zoom(factor) {
    distance = T.MathUtils.clamp(distance * factor, Math.max(5, framing * .27), framing * 2.65);
    invalidate();
  }

  function hit(clientX, clientY) {
    if (!current) return null;
    const rect = canvas.getBoundingClientRect();
    pointer.set((clientX-rect.left)/rect.width*2-1, 1-(clientY-rect.top)/rect.height*2);
    ray.setFromCamera(pointer, camera);
    for (const intersection of ray.intersectObjects(current.entries, true)) {
      let object = intersection.object;
      // Batching retains the original Mesh nodes for object picking.
      while (object && object !== current.group) {
        if (object.userData.part) return object.userData.part;
        object = object.parent;
      }
    }
    return null;
  }

  return {
    setDesign, fit, zoom, hit,
    rotate(dx,dy) {
      yaw -= dx * .008;
      pitch = T.MathUtils.clamp(pitch + dy*.007, .13, 1.43);
      invalidate();
    },
    pan(dx,dy) {
      const unit = distance / Math.max(canvas.clientHeight,1) * .72;
      focus.x += (-dx*Math.cos(yaw) - dy*Math.sin(yaw)) * unit;
      focus.z += (dx*Math.sin(yaw) - dy*Math.cos(yaw)) * unit;
      invalidate();
    },
    stats: () => ({ triangles: renderer.info.render.triangles, revision: T.REVISION, parts: current?.entries.length ?? 0 }),
  };
}
