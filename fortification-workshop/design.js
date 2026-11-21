export const PARTS = ['wall', 'gate', 'tower'];

export const MATERIALS = {
  limestone: 'Paekivi',
  fieldstone: 'Maakivi',
  timber: 'Puit',
};

export const ROOFS = {
  none: 'Katuseta',
  shingle: 'Pilusindel',
  tile: 'Savikivi',
};

export const WALL_TOPS = {
  battlements: 'Sakid',
  parapet: 'Rinnatis',
  open: 'Avatud',
};

export const PRESETS = {
  limestone: {
    wall: { length: 10, height: 4.6, depth: 2.6, material: 'limestone', top: 'battlements', roof: 'none', stairs: true },
    gate: { width: 4.2, height: 6, depth: 4.6, material: 'limestone', shape: 'arch', roof: 'shingle', open: true },
    tower: { width: 6, height: 8.8, material: 'limestone', shape: 'square', roof: 'shingle' },
  },
  fieldstone: {
    wall: { length: 12, height: 5.1, depth: 3.1, material: 'fieldstone', top: 'parapet', roof: 'none', stairs: true },
    gate: { width: 4.8, height: 6.6, depth: 5.2, material: 'fieldstone', shape: 'arch', roof: 'none', open: true },
    tower: { width: 6.8, height: 9.6, material: 'fieldstone', shape: 'round', roof: 'none' },
  },
  timber: {
    wall: { length: 10, height: 3.7, depth: 2.3, material: 'timber', top: 'battlements', roof: 'none', stairs: true },
    gate: { width: 3.8, height: 5.3, depth: 4.8, material: 'timber', shape: 'square', roof: 'shingle', open: true },
    tower: { width: 5.4, height: 7.2, material: 'timber', shape: 'square', roof: 'shingle' },
  },
};

export const FIELDS = {
  wall: [
    ['length', 'Lõigu pikkus', 6, 16],
    ['height', 'Käigu kõrgus', 2.6, 7.5],
    ['depth', 'Müüri paksus', 1.6, 4.2],
    ['material', 'Materjal', MATERIALS],
    ['top', 'Müüri serv', WALL_TOPS],
    ['roof', 'Käigu katus', ROOFS],
    ['stairs', 'Trepp sisehoovis', true],
  ],
  gate: [
    ['width', 'Ava laius', 2.6, 6.2],
    ['height', 'Väravahoone kõrgus', 4.5, 9.5],
    ['depth', 'Läbikäigu sügavus', 3.2, 6.6],
    ['material', 'Materjal', MATERIALS],
    ['shape', 'Väravaava', { arch: 'Kaar', square: 'Sirge' }],
    ['roof', 'Väravahoone katus', ROOFS],
    ['open', 'Väravalehed lahti', true],
  ],
  tower: [
    ['width', 'Torni laius', 4.2, 9],
    ['height', 'Torni käigukorrus', 5, 13],
    ['material', 'Materjal', MATERIALS],
    ['shape', 'Torni põhiplaan', { square: 'Kandiline', round: 'Ümar' }],
    ['roof', 'Torni katus', ROOFS],
  ],
};

export const copyDesign = design => JSON.parse(JSON.stringify(design));

export function validateDesign(value) {
  if (!value || typeof value !== 'object') throw new Error('Failis puudub kaitserajatiste kujundus.');
  const result = {};
  for (const part of PARTS) {
    const source = value[part];
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      throw new Error('Kujundus peab sisaldama müüri, väravat ja torni.');
    }
    result[part] = {};
    for (const [key, label, rule, max] of FIELDS[part]) {
      const input = source[key];
      const accepted = typeof rule === 'number'
        ? typeof input === 'number' && Number.isFinite(input) && input >= rule && input <= max
        : rule === true ? typeof input === 'boolean' : typeof input === 'string' && Object.hasOwn(rule, input);
      if (!accepted) throw new Error('Sobimatu väärtus: ' + label + '.');
      result[part][key] = typeof rule === 'number' ? Math.round(input * 10) / 10 : input;
    }
  }
  return result;
}

export function gateDimensions(gate) {
  const pier = Math.max(1.4, gate.depth * .32);
  const radius = gate.shape === 'arch' ? gate.width * .36 : 0;
  const crown = gate.height - 1.05;
  return { pier, radius, crown, spring: crown - radius, total: gate.width + pier * 2 };
}

export function publishedDesign(design) {
  return {
    schema: 'kuningriigid.fortification-design',
    version: 1,
    parts: copyDesign(design),
  };
}

export function readPublishedDesign(value) {
  if (value?.schema !== 'kuningriigid.fortification-design' || value.version !== 1) {
    throw new Error('See fail ei ole Linnuse töökoja kujundus (versioon 1).');
  }
  return validateDesign(value.parts);
}
