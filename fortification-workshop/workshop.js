import { FIELDS, PRESETS, copyDesign, gateDimensions, publishedDesign, readPublishedDesign } from './design.js';
import { assetUrl } from './fortification-materials.js';
import { createWorkshopScene } from './workshop-scene.js';

const KEY = 'kuningriigid-fortification-workshop-v1';
const $ = id => document.getElementById(id);
const stage = $('view');
const fields = $('part-fields');
const labels = {
  wall:['Müür','ui-art-v263/bld_stonewall.webp'],
  gate:['Värav','ui-art-v304/tech/stone_fortifications.webp'],
  tower:['Torn','ui-art-v263/bld_watchtower.webp'],
};
const fmt = value => new Intl.NumberFormat('et-EE', { maximumFractionDigits:1 }).format(value);
let scene;
let selected = 'gate';
let solo = false;
let design = copyDesign(PRESETS.limestone);
try {
  const saved = localStorage.getItem(KEY);
  if (saved) design = readPublishedDesign(JSON.parse(saved));
} catch (error) {
  console.info('Töökoja kujundus laaditi vaikeseadetega.', error.message);
}
const past = [];
const future = [];
let sliderStart = null;
let queued = 0;
let statusTimer;

for (const image of document.querySelectorAll('img[data-asset]')) image.src = assetUrl(image.dataset.asset);

function notify(message) {
  $('status').textContent = message;
  $('status').hidden = false;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { $('status').hidden = true; }, 3000);
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(publishedDesign(design))); } catch {}
}

function updateButtons() {
  $('undo').disabled = !past.length;
  $('redo').disabled = !future.length;
  $('assembly').setAttribute('aria-pressed', String(!solo));
  $('solo').setAttribute('aria-pressed', String(solo));
  for (const button of document.querySelectorAll('[data-part]')) {
    button.setAttribute('aria-pressed', String(button.dataset.part === selected));
  }
  for (const button of document.querySelectorAll('[data-preset]')) {
    const active = JSON.stringify(PRESETS[button.dataset.preset]) === JSON.stringify(design);
    button.setAttribute('aria-pressed', String(active));
  }
}

function summary() {
  const part = design[selected];
  const metres = value => fmt(value) + ' m';
  $('part-summary').textContent = selected === 'wall' ? metres(part.length) + ' pikk lõik'
    : selected === 'gate' ? metres(part.width) + ' lai ava · kõrgus ' + metres(gateDimensions(part).crown)
    : metres(part.height) + ' kõrgune käigukorrus';
}

function queueRender() {
  summary();
  if (queued || !scene) return;
  queued = requestAnimationFrame(() => {
    queued = 0;
    scene.setDesign(design, selected, solo);
  });
}

function remember(before) {
  if (JSON.stringify(before) === JSON.stringify(design)) return;
  past.push(before);
  if (past.length > 45) past.shift();
  future.length = 0;
  persist();
  updateButtons();
}

function commitSlider() {
  if (!sliderStart) return;
  remember(sliderStart);
  sliderStart = null;
}

function showFields() {
  const [name, art] = labels[selected];
  $('part-title').textContent = name;
  $('part-icon').src = assetUrl(art);
  fields.replaceChildren();
  summary();
  for (const [key, name, rule, max] of FIELDS[selected]) {
    const part = selected;
    const container = document.createElement('div');
    container.className = 'field';
    const label = document.createElement('label');
    label.htmlFor = 'field-' + key;
    label.textContent = name;
    const value = design[part][key];
    let control;
    if (typeof rule === 'number') {
      const head = document.createElement('div');
      head.className = 'slider-head';
      const out = document.createElement('output');
      out.setAttribute('for', label.htmlFor);
      out.textContent = fmt(value) + ' m';
      head.append(label, out);
      control = document.createElement('input');
      control.type = 'range';
      control.min = rule;
      control.max = max;
      control.step = .1;
      control.value = value;
      control.addEventListener('input', () => {
        if (!sliderStart) sliderStart = copyDesign(design);
        design[part][key] = Number(control.value);
        out.textContent = fmt(control.value) + ' m';
        control.setAttribute('aria-valuetext', out.textContent);
        queueRender();
      });
      control.setAttribute('aria-valuetext', out.textContent);
      control.addEventListener('change', commitSlider);
      control.addEventListener('blur', commitSlider);
      container.append(head, control);
    } else if (rule === true) {
      control = document.createElement('input');
      control.type = 'checkbox';
      control.checked = value;
      label.className = 'check-field';
      label.append(control);
      container.append(label);
    } else {
      control = document.createElement('select');
      for (const [id, title] of Object.entries(rule)) control.add(new Option(title, id, false, id === value));
      container.append(label, control);
    }
    control.id = label.htmlFor;
    if (typeof rule !== 'number') control.addEventListener('change', () => {
      const before = copyDesign(design);
      design[part][key] = rule === true ? control.checked : control.value;
      remember(before);
      queueRender();
    });
    fields.append(container);
  }
  updateButtons();
}

function selectPart(part) {
  if (selected === part) return;
  commitSlider();
  selected = part;
  showFields();
  if (solo) scene?.setDesign(design, selected, true);
}

function setView(next) {
  if (solo === next) return;
  solo = next;
  updateButtons();
  scene?.setDesign(design, selected, solo);
}

function replaceDesign(next) {
  commitSlider();
  const before = copyDesign(design);
  design = next;
  remember(before);
  showFields();
  scene?.setDesign(design, selected, solo, true);
}

function restore(backward) {
  commitSlider();
  const source = backward ? past : future;
  const destination = backward ? future : past;
  if (!source.length) return;
  destination.push(design);
  design = source.pop();
  persist();
  showFields();
  queueRender();
}

fields.addEventListener('submit', event => event.preventDefault());
for (const button of document.querySelectorAll('[data-part]')) button.onclick = () => selectPart(button.dataset.part);
for (const button of document.querySelectorAll('[data-preset]')) button.onclick = () => replaceDesign(copyDesign(PRESETS[button.dataset.preset]));
$('assembly').onclick = () => setView(false);
$('solo').onclick = () => setView(true);
$('reset-view').onclick = () => scene?.fit();
$('zoom-in').onclick = () => scene?.zoom(.83);
$('zoom-out').onclick = () => scene?.zoom(1.21);
$('undo').onclick = () => restore(true);
$('redo').onclick = () => restore(false);
$('read-file').onclick = () => $('file-input').click();
$('save-file').onclick = () => {
  commitSlider();
  const blob = new Blob([JSON.stringify(publishedDesign(design), null, 2) + '\n'], { type:'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = 'Kuningriigid-kaitserajatis.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  notify('Kujundus eksporditud.');
};
$('file-input').addEventListener('change', async event => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    if (file.size > 64000) throw new Error('Kujundusfail on liiga suur.');
    const next = readPublishedDesign(JSON.parse(await file.text()));
    replaceDesign(next);
    notify('Kujundus avatud.');
  } catch (error) {
    notify(error instanceof SyntaxError ? 'Fail ei sisalda loetavat JSON-i.' : error.message);
  }
});
document.addEventListener('keydown', event => {
  if ((!event.ctrlKey && !event.metaKey) || event.altKey) return;
  if (event.key.toLowerCase() === 'z' || event.key.toLowerCase() === 'y') {
    if (event.target instanceof HTMLInputElement && event.target.type !== 'range') return;
    event.preventDefault();
    restore(event.key.toLowerCase() === 'z' && !event.shiftKey);
  }
});

const points = new Map();
let moved = false;
stage.addEventListener('pointerdown', event => {
  if (![0,1,2].includes(event.button)) return;
  if (!points.size) moved = false;
  if (points.size) moved = true;
  points.set(event.pointerId, [event.clientX,event.clientY]);
  stage.setPointerCapture(event.pointerId);
});
stage.addEventListener('pointermove', event => {
  const before = points.get(event.pointerId);
  if (!before) return;
  const [x,y] = before;
  const dx = event.clientX-x, dy = event.clientY-y;
  if (points.size > 1) {
    const [otherX,otherY] = [...points].find(([id])=>id!==event.pointerId)[1];
    scene?.zoom(Math.hypot(x-otherX,y-otherY) / Math.max(1,Math.hypot(event.clientX-otherX,event.clientY-otherY)));
  } else if (Math.abs(dx)+Math.abs(dy) > 2 || moved) {
    moved = true;
    if ((event.buttons & 6) || event.shiftKey) scene?.pan(dx,dy);
    else scene?.rotate(dx,dy);
  } else {
    return;
  }
  points.set(event.pointerId,[event.clientX,event.clientY]);
});
stage.addEventListener('pointerup', event => {
  if (!points.delete(event.pointerId)) return;
  if (!points.size && !moved && event.button === 0) {
    const hit = scene?.hit(event.clientX,event.clientY);
    if (hit) selectPart(hit);
  }
});
for (const type of ['pointercancel','lostpointercapture']) stage.addEventListener(type, event => points.delete(event.pointerId));
stage.addEventListener('contextmenu', event => event.preventDefault());
stage.addEventListener('wheel', event => {
  event.preventDefault();
  scene?.zoom(Math.exp(Math.min(150,Math.max(-150,event.deltaY))*.0015));
}, { passive:false });

showFields();
try {
  scene = await createWorkshopScene(stage);
  scene.setDesign(design, selected, solo, true);
  stage.dataset.revision = scene.stats().revision;
  $('loading').hidden = true;
} catch (error) {
  console.error(error);
  $('loading').textContent = '3D-eelvaade vajab WebGL 2 tuge ja mängu tekstuure.';
}
