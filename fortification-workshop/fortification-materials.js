import * as T from '../vendor/three.module.js';

export const assetUrl = path => globalThis.WORKSHOP_ASSETS?.[path] ?? new URL('../' + path, import.meta.url).href;
const sample = (i, j = 0) => T.MathUtils.euclideanModulo(Math.sin(i * 127.1 + j * 377.3) * 43758.5453123, 1);

export async function loadFortificationTextures() {
  const loader = new T.TextureLoader();
  const entries = [
    ['grass', 'grass-color.webp'],
    ['grassNormal', 'grass-normal.webp'],
    ['soil', 'soil-color.webp'],
    ['soilNormal', 'soil-normal.webp'],
    ['forest', 'forest-color.webp'],
  ];
  const result = await Promise.all(entries.map(async ([key, file]) => {
    const texture = await loader.loadAsync(assetUrl('textures-ground-v232/' + file));
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.anisotropy = 4;
    if (!key.endsWith('Normal')) texture.colorSpace = T.SRGBColorSpace;
    return [key, texture];
  }));
  return Object.fromEntries(result);
}

function stoneSurface(photo) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d');
  context.filter = 'grayscale(1) contrast(.7) brightness(1.35)';
  context.drawImage(photo.image, 0, 0, 512, 512);
  context.filter = 'none';
  context.fillStyle = 'rgba(225,219,202,.37)';
  context.fillRect(0, 0, 512, 512);
  const texture = new T.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

function timberSurface() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#b8a58f';
  context.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 205; i++) {
    const x = sample(i, 77) * 128;
    const bend = (sample(i, 24) - .5) * 20;
    context.strokeStyle = i % 3 ? '#554538' : '#f5dac2';
    context.globalAlpha = .03 + sample(i, 4) * .20;
    context.lineWidth = .5 + sample(i, 9) * 1.55;
    context.beginPath();
    context.moveTo(x, -5);
    context.bezierCurveTo(x + bend, 86, x - bend * .57, 164, x + bend * .14, 260);
    context.stroke();
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  return texture;
}

export function createFortificationMaterials(orig) {
  const stoneMap = stoneSurface(orig.soil);
  const woodMap = timberSurface();
  const basic = (color, params = {}) => new T.MeshStandardMaterial({ color, roughness: .92, ...params });
  const stone = (grout, tints) => ({
    mortar: basic(grout, { map: stoneMap, normalMap: orig.soilNormal, normalScale: new T.Vector2(.45,.45) }),
    stones: tints.map(color => basic(color, { map: stoneMap, normalMap: orig.soilNormal,
      normalScale: new T.Vector2(.60,.60) })),
  });
  const roof = (color, map) => basic(color, { map, vertexColors: true, side: T.DoubleSide });
  return {
    limestone: stone('#676051', ['#b3a790','#aba18e','#c7baa2','#928b7b','#bdb09a','#a89c82','#b7ad96']),
    fieldstone: stone('#504b3e', ['#8e8570','#9e8a73','#777a6e','#a19a80','#655f4f','#837b6b','#9a8c7c']),
    timber: stone('#514735', ['#796955','#82715b','#827561','#715d47','#857358']),
    wood: ['#886848','#684a35','#a07d56','#937355','#7a593c'].map(color => basic(color, { map: woodMap })),
    iron: basic('#3e403a', { metalness: .5, roughness: .66 }),
    dark: basic('#211c15'),
    roofs: { shingle: roof('#66564b', woodMap), tile: roof('#a25d47', stoneMap) },
    roofTrim: { shingle: basic('#594432', { map: woodMap }), tile: basic('#7f463c', { map: stoneMap }) },
  };
}
