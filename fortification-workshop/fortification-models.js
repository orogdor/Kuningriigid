import * as T from '../vendor/three.module.js';
import { batchStaticMeshParts } from '../static-mesh-batches-v346e.js';
import { gateDimensions } from './design.js';

const UNIT_BOX = new T.BoxGeometry();
const UNIT_POST = new T.CylinderGeometry(.5, .53, 1, 9);
const UNIT_POINT = new T.ConeGeometry(.55, 1, 9);
const TORUS = new T.TorusGeometry(.10, .025, 5, 12);
const makeStone = () => {
  const c = .427;
  const contour = new T.Shape()
    .moveTo(-c, -c + .07).lineTo(-c + .09, -c).lineTo(c - .09, -c)
    .lineTo(c, -c + .09).lineTo(c, c - .07).lineTo(c - .07, c)
    .lineTo(-c + .08, c).lineTo(-c, c - .08).closePath();
  const geometry = new T.ExtrudeGeometry(contour, {
    steps: 1, depth: .84, bevelEnabled: true, bevelSize: .055, bevelThickness: .065, bevelSegments: 1,
  });
  geometry.translate(0, 0, -.42);
  return geometry;
};
const UNIT_STONE = makeStone();
const shared = new Set([UNIT_BOX, UNIT_POST, UNIT_POINT, TORUS, UNIT_STONE]);
const hash = (a, b = 0) => ((Math.sin(a * 127.1 + b * 41.37) * 43758.5453) % 1 + 1) % 1;

function mesh(parent, geo, mat, x = 0, y = 0, z = 0) {
  const item = new T.Mesh(geo, mat);
  item.position.set(x, y, z);
  item.castShadow = item.receiveShadow = true;
  parent.add(item);
  return item;
}

function block(parent, mat, x, y, z, w, h, d, geometry = UNIT_BOX) {
  const item = mesh(parent, geometry, mat, x, y, z);
  item.scale.set(w, h, d);
  return item;
}

function stone(parent, style, x, y, z, w, h, d, seed = 0, rotation = 0) {
  const tint = style.stones[Math.floor(hash(seed, 3) * style.stones.length)];
  const item = block(parent, tint, x, y, z, w, h, d, UNIT_STONE);
  item.rotation.y = rotation;
  return item;
}

function faceCourse(parent, style, { width, height, x = 0, y = 0, z = 0, sides = false, depth = .16, seed = 0, skip }) {
  const rows = Math.max(1, Math.round(height / .48));
  const rise = height / rows;
  for (let row = 0; row < rows; row++) {
    let left = -width / 2;
    for (let i = 0; left < width / 2 - .02; i++) {
      const span = i === 0 && row % 2 ? .50 : .84 + hash(i + seed, row) * .44;
      const right = Math.min(width / 2, left + span);
      const w = right - left;
      const cx = (left + right) / 2;
      const cy = (row + .5) * rise;
      if (w > .065 && !skip?.(cx, cy, w, rise)) {
        const push = depth * (.82 + .38 * hash(i + 93, row));
        for (const sign of sides ? [-1, 1] : [1]) {
          stone(parent, style, x + cx, y + cy, z * sign, w - .029, rise - .035, push, seed + row * 97 + i + sign * 53);
        }
      }
      left = right;
    }
  }
}

function rectangularCourses(parent, style, w, h, d, y = 0) {
  faceCourse(parent, style, { width: w, height: h, y, z: d / 2, sides: true });
  const sides = new T.Group();
  sides.rotation.y = Math.PI / 2;
  parent.add(sides);
  faceCourse(sides, style, { width: d - .11, height: h, y, z: w / 2, sides: true, seed: 47 });
}

function circularCourses(parent, style, radius, height) {
  const rows = Math.max(1, Math.round(height / .47));
  const count = Math.max(15, Math.round(radius * 2 * Math.PI / .91));
  const rowHeight = height / rows;
  for (let row = 0; row < rows; row++) {
    for (let i = 0; i < count; i++) {
      const angle = (i + row % 2 * .5) * 2 * Math.PI / count;
      stone(parent, style, Math.sin(angle) * radius, (row + .5) * rowHeight, Math.cos(angle) * radius,
        radius * 6.283 / count - .04, rowHeight - .033, .26, i + row * count, angle);
    }
  }
}

function cylinder(parent, material, top, bottom, height, y) {
  return mesh(parent, new T.CylinderGeometry(top, bottom, height, 44), material, 0, y);
}

function roofPiece(parent, mat, profiles, ridge, beams) {
  const positions = [], uv = [], colors = [];
  function quad(a, b, c, d, tint) {
    for (const [p, u, v] of [[a,0,0],[b,1,0],[d,0,1],[b,1,0],[c,1,1],[d,0,1]]) {
      positions.push(...p.toArray()); uv.push(u, v); colors.push(tint, tint, tint);
    }
  }
  profiles.forEach(([A, B, C, D], side) => {
    const a = new T.Vector3(...A), b = new T.Vector3(...B);
    const c = new T.Vector3(...C), d = new T.Vector3(...D);
    const rows = Math.max(4, Math.ceil(a.distanceTo(d) / .32));
    const at = (v, u, lift) => {
      const point = a.clone().lerp(d, v).lerp(b.clone().lerp(c, v), u);
      point.y += lift;
      return point;
    };
    for (let row = 0; row < rows; row++) {
      const start = row / rows;
      const end = Math.min(1, (row + 1.07) / rows);
      const span = at(start, 0, 0).distanceTo(at(start, 1, 0));
      const count = Math.max(1, Math.ceil(span / .31));
      for (let i = 0; i < count; i++) {
        const l = i / count, r = (i + .985) / count;
        const tint = .74 + hash(row * 73 + i, side) * .26;
        const jitter = hash(side * 101 + i, row) * .036;
        const p = at(start, l, .06 + jitter);
        const q = at(start, r, .06 + jitter);
        const s = at(end, r, .012);
        const t = at(end, l, .012);
        quad(p, q, s, t, tint);
      }
    }
  });
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  mesh(parent, geo, mat);
  for (const [a, b] of beams) {
    const start = new T.Vector3(...a), end = new T.Vector3(...b);
    const middle = start.clone().lerp(end, .5);
    const plank = block(parent, ridge, middle.x, middle.y, middle.z, .135, start.distanceTo(end), .135);
    plank.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), end.sub(start).normalize());
  }
}

function hipRoof(parent, mat, trim, w, d, y, rise) {
  const a = [-w / 2,y,-d / 2], b = [w / 2,y,-d / 2], c = [w / 2,y,d / 2], e = [-w / 2,y,d / 2];
  const ridge = Math.max(0, (w - d * .74) / 2);
  const l = [-ridge,y+rise,0], r = [ridge,y+rise,0];
  roofPiece(parent, mat, [[b,a,l,r],[c,b,r,r],[e,c,r,l],[a,e,l,l]], trim,
    [[a,b],[b,c],[c,e],[e,a],[a,l],[e,l],[b,r],[c,r],...(ridge > .04 ? [[l,r]] : [])]);
}

function roundRoof(parent, mat, trim, radius, y, rise) {
  const apex = [0,y+rise,0];
  const ring = Array.from({ length: 36 }, (_, i) => {
    const angle = i * Math.PI / 18;
    return [Math.sin(angle) * radius, y, Math.cos(angle) * radius];
  });
  roofPiece(parent, mat, ring.map((p, i) => [p, ring[(i + 1) % ring.length], apex, apex]), trim,
    ring.map((p, i) => [p, ring[(i + 1) % ring.length]]));
  block(parent, trim, 0, y + rise + .20, 0, .14, .43, .14, UNIT_POST);
}

function merlons(parent, style, x, y, z, span, rotation = 0) {
  const rail = new T.Group();
  rail.position.set(x, y, z);
  rail.rotation.y = rotation;
  parent.add(rail);
  stone(rail, style, 0, .18, 0, span, .36, .40, 12);
  const count = Math.max(2, Math.round(span / 1.30));
  for (let i = 0; i < count; i++) {
    const cx = (i + .5) * span / count - span / 2;
    stone(rail, style, cx, .65, 0, .74, .68, .43, i);
    stone(rail, style, cx, 1.02, 0, .80, .13, .49, i + 6);
  }
}

function boards(parent, material, length, y, depth) {
  const count = Math.ceil(length / .29);
  const width = length / count;
  for (let i = 0; i < count; i++) {
    const x = (i + .5) * width - length / 2;
    block(parent, material[i % material.length], x, y, 0, width - .016, .16, depth);
  }
}

function timberWall(parent, config, m, stairs) {
  const { length, height, depth, top, roof } = config;
  const front = depth / 2;
  const count = Math.ceil(length / .37);
  const w = length / count;
  const extra = top === 'open' ? .21 : top === 'parapet' ? .8 : 1.03;
  for (let i = 0; i < count; i++) {
    const x = (i + .5) * w - length / 2;
    const h = height + extra + hash(i) * .19;
    const log = m.wood[i % m.wood.length];
    block(parent, log, x, (h - .3) / 2, front - .20, w + .045, h - .3, .44, UNIT_POST);
    block(parent, log, x, h - .15, front - .20, w + .05, .42, .44, UNIT_POINT);
  }
  for (const y of [height * .36, height * .73]) block(parent, m.wood[1], 0, y, front - .37, length, .29, .23);
  const posts = Math.max(2, Math.round(length / 2.7));
  for (let i = 0; i <= posts; i++) {
    const x = i * (length - .27) / posts - (length - .27) / 2;
    block(parent, m.wood[1], x, height / 2, -front + .18, .25, height, .26);
    block(parent, m.wood[0], x, height -.32, 0, .24, .30, depth);
  }
  boards(parent, m.wood, length, height, depth);
  if (top !== 'open' && roof === 'none') {
    const gap = stairs ? 1.59 : 0;
    const z = -front + .13;
    for (const side of [-1,1]) block(parent, m.wood[1], side * (length + gap) / 4, height + .8, z, (length - gap) / 2, .16, .17);
    for (let i = 0; i <= posts; i++) {
      const x = i * (length - .26) / posts - (length - .26) / 2;
      if (!stairs || Math.abs(x) > .86) block(parent, m.wood[0], x, height + .41, z, .18, .82, .18);
    }
  }
}

function wallTop(parent, config, style, m, stairs) {
  const { length, height, depth, top, roof } = config;
  const timber = config.material === 'timber';
  if (roof !== 'none') {
    const pairs = Math.max(2, Math.round(length / 3));
    for (let i = 0; i <= pairs; i++) {
      const x = (i / pairs - .5) * (length - .35);
      for (const z of [-1,1]) block(parent, m.wood[1], x, height + 1.02, z * (depth / 2 - .15), .23, 2.04, .23);
      block(parent, m.wood[1], x, height + 2.01, 0, .22, .22, depth);
    }
    hipRoof(parent, m.roofs[roof], m.roofTrim[roof], length + .32, depth + .54, height + 2.1, .94);
  } else if (!timber && top === 'battlements') {
    merlons(parent, style, 0, height, depth / 2 - .19, length);
    const gap = stairs ? 1.65 : 0;
    for (const side of [-1,1]) merlons(parent, style, side * (length + gap) / 4, height, -depth / 2 + .19, (length - gap) / 2);
  } else if (!timber && top === 'parapet') {
    for (const z of [-1,1]) {
      const side = z * (depth / 2 - .19);
      const gap = stairs && z < 0 ? 1.65 : 0;
      for (const direction of [-1,1]) {
        const x = direction * (length + gap) / 4;
        const span = (length - gap) / 2;
        block(parent, style.mortar, x, height + .37, side, span, .74, .37);
        stone(parent, style, x, height + .79, side, span, .14, .49, 41);
      }
    }
  }
}

function wallStairs(parent, config, style, m) {
  const { height, depth } = config;
  const timber = config.material === 'timber';
  const steps = Math.ceil(height / .29);
  const run = .32;
  const width = 1.48;
  const landing = -depth / 2 + .06;
  for (let i = 0; i < steps; i++) {
    const y = (i + 1) * height / steps;
    const z = landing - (steps - i - .5) * run;
    if (timber) {
      block(parent, m.wood[i % m.wood.length], 0, y - .08, z, width, .16, .35);
      if (i % 4 === 0 || i === steps - 1) for (const x of [-.55,.55]) block(parent, m.wood[1], x, y / 2, z, .15, y, .15);
    } else {
      block(parent, style.mortar, 0, y / 2, z, width - .11, y, run + .025);
      stone(parent, style, 0, y - .085, z, width, .17, run + .06, i);
    }
  }
}

function wallModel(config, m, stairs = config.stairs) {
  const g = new T.Group();
  const style = m[config.material];
  const { length, height, depth } = config;
  if (config.material === 'timber') {
    timberWall(g, config, m, stairs);
  } else {
    block(g, style.mortar, 0, height / 2, 0, length, height, depth);
    rectangularCourses(g, style, length, height, depth);
    stone(g, style, 0, .18, 0, length + .08, .36, depth + .26, 2);
    const coping = Math.ceil(length / 1.12);
    for (let i = 0; i < coping; i++) {
      const x = (i + .5) / coping * length - length / 2;
      stone(g, style, x, height, 0, length / coping + .025, .18, depth + .20, i);
    }
  }
  wallTop(g, config, style, m, stairs);
  if (stairs) wallStairs(g, config, style, m);
  return g;
}

const archY = (x, half, dimensions) => dimensions.spring
  + dimensions.radius * Math.sqrt(Math.max(0, 1 - (x / half) ** 2));

function gateOutline(gate, dimensions) {
  const half = gate.width / 2, edge = dimensions.total / 2;
  const outline = new T.Shape().moveTo(-edge, 0).lineTo(-half, 0);
  if (gate.shape === 'arch') {
    for (let i = 0; i <= 28; i++) {
      const theta = Math.PI * (1 - i / 28);
      outline.lineTo(half * Math.cos(theta), dimensions.spring + dimensions.radius * Math.sin(theta));
    }
  } else outline.lineTo(-half, dimensions.crown).lineTo(half, dimensions.crown);
  outline.lineTo(half, 0).lineTo(edge, 0).lineTo(edge, gate.height).lineTo(-edge, gate.height).closePath();
  return outline;
}

function extrude(shape, depth, bevel = false) {
  return new T.ExtrudeGeometry(shape, {
    depth, steps: 1, bevelEnabled: bevel, bevelThickness: .025, bevelSize: .026, bevelSegments: 1, curveSegments: 10,
  });
}

function archRing(parent, gate, dimensions, style) {
  const half = gate.width / 2;
  const count = 17;
  const radial = .44;
  for (let i = 0; i < count; i++) {
    const a = Math.PI * (i + .018) / count;
    const b = Math.PI * (i + .982) / count;
    const r = i === 8 ? radial + .13 : radial;
    const points = [
      [half * Math.cos(a), dimensions.spring + dimensions.radius * Math.sin(a)],
      [(half + r) * Math.cos(a), dimensions.spring + (dimensions.radius + r) * Math.sin(a)],
      [(half + r) * Math.cos(b), dimensions.spring + (dimensions.radius + r) * Math.sin(b)],
      [half * Math.cos(b), dimensions.spring + dimensions.radius * Math.sin(b)],
    ];
    const shape = new T.Shape(points.map(p => new T.Vector2(...p)));
    for (const z of [-gate.depth / 2 - .20, gate.depth / 2 - .06]) {
      mesh(parent, extrude(shape, .26, true), style.stones[i % style.stones.length], 0, 0, z);
    }
  }
}

function gateDoors(parent, gate, dimensions, m) {
  const half = gate.width / 2;
  for (const side of [-1,1]) {
    const pivot = new T.Group();
    pivot.position.set(side * (half - .043), .027, .14);
    parent.add(pivot);
    const count = Math.max(5, Math.ceil(half / .29));
    const width = (half - .07) / count;
    for (let i = 0; i < count; i++) {
      const start = -side * i * width, end = -side * ((i + 1) * width - .018);
      const height = at => archY(side * (half - .043) + at, half, dimensions) - .092;
      const shape = new T.Shape().moveTo(start,0).lineTo(end,0).lineTo(end,height(end))
        .lineTo(start,height(start)).closePath();
      mesh(pivot, extrude(shape, .16), m.wood[i % m.wood.length], 0, 0, -.08);
    }
    for (const y of [.7, Math.max(1.08, dimensions.spring - .27)]) {
      block(pivot, m.wood[1], -side * half * .49, y, -.13, half * .92, .25, .13);
      block(pivot, m.iron, -side * half * .29, y, .107, half * .48, .11, .078);
      for (const k of [.10,.22,.40]) block(pivot, m.iron, -side * half * k, y, .155, .065, .065, .051, UNIT_STONE);
    }
    mesh(pivot, TORUS, m.iron, -side * (half - .33), Math.min(1.25, dimensions.spring * .82), .16);
    pivot.rotation.y = gate.open ? -side * Math.PI * .489 : 0;
  }
}

function gateModel(config, m) {
  const g = new T.Group(), d = gateDimensions(config), style = m[config.material];
  const half = config.width / 2, depth = config.depth;
  const timber = config.material === 'timber';
  mesh(g, extrude(gateOutline(config, d), depth), timber ? m.wood[1] : style.mortar, 0, 0, -depth / 2);
  if (!timber) {
    const skip = (x, y, w, h) => {
      const inner = Math.max(0, Math.abs(x) - w / 2);
      return inner < half + .26 && y - h / 2 < archY(Math.min(inner, half), half, d) + .37;
    };
    faceCourse(g, style, { width: d.total, height: config.height, z: depth / 2, sides: true, skip });
    const sides = new T.Group();
    sides.rotation.y = Math.PI / 2;
    g.add(sides);
    faceCourse(sides, style, { width: depth, height: config.height, z: d.total / 2, sides: true, seed: 67 });
    if (config.shape === 'arch') archRing(g, config, d, style);
  }
  for (const sign of [-1,1]) {
    const z = sign * depth / 2;
    for (const side of [-1,1]) {
      const x = side * (half + d.pier * .5);
      if (timber) {
        for (let i = -2; i <= 2; i++) block(g, m.wood[(i+2)%m.wood.length], x + i * d.pier / 5, config.height / 2, z, d.pier / 5 + .02, config.height, .18);
        block(g, m.wood[0], side * (half + .12), d.spring / 2, z + sign * .09, .26, d.spring, .24);
      } else {
        const levels = Math.ceil(d.spring / .41);
        for (let i = 0; i < levels; i++) {
          stone(g, style, side * (half + .16), (i + .5) * d.spring / levels, z,
            .33 + i % 2 * .12, d.spring / levels - .02, .36, i);
        }
        stone(g, style, x, .19, 0, d.pier + .03, .38, depth + .40, 25);
      }
    }
    if (config.shape === 'square') block(g, timber ? m.wood[0] : style.stones[2], 0, d.crown + .24, z,
      config.width + .61, .46, .36);
  }
  gateDoors(g, config, d, m);
  if (config.roof !== 'none') {
    block(g, timber ? m.wood[0] : style.stones[1], 0, config.height, 0, d.total + .22, .22, depth + .23);
    hipRoof(g, m.roofs[config.roof], m.roofTrim[config.roof], d.total + .63, depth + .63, config.height + .13, 1.65);
  } else {
    merlons(g, style, 0, config.height, depth / 2 - .20, d.total);
    merlons(g, style, 0, config.height, -depth / 2 + .20, d.total);
  }
  return g;
}

function towerModel(config, m, wallHeight) {
  const g = new T.Group(), style = m[config.material];
  const { width, height, shape, roof } = config;
  const timber = config.material === 'timber';
  const radius = width / 2;
  if (shape === 'round') {
    cylinder(g, timber ? m.wood[1] : style.mortar, radius - .05, radius, height, height / 2);
    if (timber) {
      const logs = Math.ceil(width * Math.PI / .31);
      for (let i = 0; i < logs; i++) {
        const angle = i * Math.PI * 2 / logs;
        block(g, m.wood[i % m.wood.length], Math.sin(angle)*radius, height / 2, Math.cos(angle)*radius, .35, height, .28, UNIT_POST);
      }
    } else circularCourses(g, style, radius, height);
    cylinder(g, timber ? m.wood[1] : style.stones[1], radius + .12, radius + .25, .42, .21);
    cylinder(g, timber ? m.wood[0] : style.stones[2], radius + .22, radius + .10, .38, height - .14);
    if (roof === 'none') {
      const n = Math.max(10, Math.ceil(width * Math.PI / 1.4));
      for (let i = 0; i < n; i++) {
        const angle = i * Math.PI * 2 / n;
        const x = Math.sin(angle) * radius, z = Math.cos(angle) * radius;
        stone(g, style, x, height + .15, z, width * Math.PI / n + .10, .39, .39, i, angle);
        stone(g, style, x, height + .61, z, .72, .64, .42, i + 50, angle);
      }
    } else roundRoof(g, m.roofs[roof], m.roofTrim[roof], radius + .50, height + .04, width * .47);
  } else {
    block(g, timber ? m.wood[1] : style.mortar, 0, height / 2, 0, width, height, width);
    if (timber) {
      const n = Math.ceil(width / .30);
      for (let i = 0; i < n; i++) {
        const x = ((i + .5) / n - .5) * width;
        for (const sign of [-1,1]) {
          const material = m.wood[i % m.wood.length];
          block(g, material, x, height / 2, sign * radius, width / n, height, .16);
          block(g, material, sign * radius, height / 2, x, .16, height, width / n);
        }
      }
      for (const x of [-radius,radius]) for (const z of [-radius,radius]) block(g, m.wood[1], x, height / 2, z, .29, height, .29);
    } else rectangularCourses(g, style, width, height, width);
    for (const y of [.20,height-.12]) stone(g, style, 0, y, 0, width + .29, .38, width + .29, y);
    if (roof === 'none') {
      for (const sign of [-1,1]) {
        merlons(g, style, 0, height, sign * radius, width);
        merlons(g, style, sign * radius, height, 0, width - .48, Math.PI / 2);
      }
    } else hipRoof(g, m.roofs[roof], m.roofTrim[roof], width + .74, width + .74, height + .08, width * .43);
  }
  for (let i = 0; i < 4; i++) {
    const face = new T.Group();
    face.rotation.y = i * Math.PI / 2;
    g.add(face);
    const y = height * .73;
    block(face, m.dark, 0, y, radius + .11, .31, 1.08, .06);
    for (const side of [-1,1]) block(face, style.stones[1], side * .23, y, radius + .16, .14, 1.23, .16);
    block(face, style.stones[2], 0, y - .57, radius + .17, .63, .14, .23);
  }
  const door = new T.Group();
  door.rotation.y = -Math.PI / 2;
  g.add(door);
  const sill = Math.min(wallHeight, height - 2.38);
  block(door, m.wood[1], 0, sill + .93, radius + .16, 1.23, 1.86, .11);
  for (const x of [-.65,.65]) block(door, style.stones[2], x, sill + .96, radius + .19, .15, 1.92, .17);
  block(door, style.stones[2], 0, sill + 1.95, radius + .21, 1.47, .21, .24);
  mesh(door, TORUS, m.iron, .33, sill + .92, radius + .25);
  return g;
}

export function createFortificationPart(part, specification, materials, { wallHeight = 4.6, stairs } = {}) {
  const model = part === 'wall' ? wallModel(specification, materials, stairs)
    : part === 'gate' ? gateModel(specification, materials)
    : towerModel(specification, materials, wallHeight);
  model.name = part;
  model.userData.part = part;
  return model;
}

export function createFortificationPreview(design, materials, soloPart = null) {
  const group = new T.Group();
  const entries = [];
  const make = (part, spec = design[part], options = {}) => {
    const item = createFortificationPart(part, spec, materials, { wallHeight: design.wall.height, ...options });
    entries.push(item);
    group.add(item);
    return item;
  };
  if (soloPart) {
    make(soloPart);
  } else {
    const { length, depth, material } = design.wall;
    const gate = gateDimensions(design.gate);
    const edge = gate.total / 2;
    make('gate');
    make('wall').position.x = -edge - length / 2;
    const right = make('wall', design.wall, { stairs: false });
    const towerRadius = design.tower.width / 2;
    const towerJoin = design.tower.shape === 'round'
      ? Math.sqrt(Math.max(0, towerRadius ** 2 - (depth / 2) ** 2))
      : towerRadius;
    const extension = towerRadius - towerJoin;
    right.position.x = edge + length / 2 - extension / 2;
    right.scale.x = 1 - extension / length;
    const tower = make('tower');
    tower.position.x = edge + length + towerJoin - extension - .055;
    const cornerX = -edge - length - depth / 2;
    const corner = make('wall', { ...design.wall, length: depth, roof: 'none', top: design.wall.top }, { stairs: false });
    corner.position.x = cornerX;
    const wing = make('wall', { ...design.wall, length: length * .78 }, { stairs: false });
    wing.rotation.y = -Math.PI / 2;
    wing.position.set(cornerX, 0, -depth / 2 - length * .39 + .025);
    const rear = make('wall', { ...design.wall, length: length * .72 }, { stairs: false });
    rear.rotation.y = -Math.PI / 2;
    const joinZ = design.tower.shape === 'round' ? towerJoin : towerRadius;
    rear.position.set(tower.position.x, 0, -joinZ - length * .36 + .045);

    // A stone threshold keeps the portal visibly open without invading the adjoining curtain walls.
    if (material !== 'timber') {
      const g = entries[0], style = materials[design.gate.material];
      const n = Math.ceil(design.gate.width / .74);
      for (let i = 0; i < n; i++) {
        const x = ((i + .5) / n - .5) * design.gate.width;
        stone(g, style, x, -.052, 0, design.gate.width / n, .14, design.gate.depth + .30, i);
      }
    }
  }
  const batching = batchStaticMeshParts(group, entries, { name: 'Fortification workshop batches' });
  return {
    group,
    entries,
    dispose() {
      batching.dispose();
      const transient = new Set();
      group.traverse(item => {
        if (item.geometry && !shared.has(item.geometry)) transient.add(item.geometry);
      });
      for (const geometry of transient) geometry.dispose();
      group.removeFromParent();
    },
  };
}
