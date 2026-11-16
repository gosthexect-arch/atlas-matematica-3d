// Shared toolkit for every chapter module: video links, DOM helpers, themed colors, UI controls and 3D stages.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export { THREE, CSS2DObject };

export const VIDEO_ID = 'obKEn1KkMUI';
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const CHAPTERS = [
  { id: 'introducao', n: 1, title: 'Introdução', start: 0, end: 103, h: 28, solid: 'dodeca' },
  { id: 'aritmetica', n: 2, title: 'Aritmética', start: 103, end: 404, h: 210, solid: 'cube' },
  { id: 'algebra', n: 3, title: 'Álgebra', start: 404, end: 550, h: 268, solid: 'octa' },
  { id: 'geometria', n: 4, title: 'Geometria', start: 550, end: 753, h: 152, solid: 'tetra' },
  { id: 'trigonometria', n: 5, title: 'Trigonometria', start: 753, end: 879, h: 188, solid: 'torus' },
  { id: 'estatistica', n: 6, title: 'Estatística e probabilidade', short: 'Estatística', start: 879, end: 1095, h: 2, solid: 'icosa' },
  { id: 'patrocinio', n: 0, title: 'Patrocínio', start: 1095, end: 1186, h: 220, sponsor: true },
  { id: 'funcoes', n: 7, title: 'Funções', start: 1186, end: 1317, h: 36, solid: 'cone' },
  { id: 'limites', n: 8, title: 'Limites', start: 1317, end: 1462, h: 238, solid: 'cylinder' },
  { id: 'derivada', n: 9, title: 'Derivada', start: 1462, end: 1566, h: 322, solid: 'knot' },
  { id: 'integral', n: 10, title: 'Integral', start: 1566, end: 1635, h: 98, solid: 'sphere' },
];

/** 125 -> "02:05" */
export const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
/** YouTube URL that starts at second s */
export const vurl = (s) => `https://youtu.be/${VIDEO_ID}?t=${Math.floor(s)}`;

/**
 * Video marker chip. `hint` says what is explained at that moment (may contain inline HTML such as <i>x</i>).
 * Returns an HTML string; use it inside html`` templates or innerHTML.
 */
export function vlink(s, hint, { big = false } = {}) {
  return `<a class="vlink${big ? ' big' : ''}" href="${vurl(s)}" target="_blank" rel="noopener" title="Abrir o vídeo em ${fmt(s)}">` +
    `<span class="vlink-t" aria-hidden="true">▶ ${fmt(s)}</span><span class="vlink-h">${hint}</span>` +
    `<span class="sr-only"> (abre o vídeo em ${fmt(s)})</span></a>`;
}
/** List of markers: vlinks([[125,'Os irracionais'], [150,'Complexos']]) */
export const vlinks = (items) => `<div class="vlinks">${items.map(([s, h]) => vlink(s, h)).join('')}</div>`;

/** Parse an HTML string into a single element (the first element child). */
export function el(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** The empty container of a chapter: <section id> ... [data-mount] */
export function mount(id) {
  const m = document.querySelector(`#${id} [data-mount]`);
  if (!m) throw new Error(`chapter #${id} not found`);
  return m;
}

/** Inject chapter-scoped CSS once. Scope every rule under the chapter id (e.g. "#aritmetica .foo"). */
export function css(text) {
  const s = document.createElement('style');
  s.textContent = text;
  document.head.appendChild(s);
}

/**
 * Resolve a CSS color token to "rgb(...)" so three.js can read it.
 * scope: element whose --h applies (pass the chapter section to get its --hue).
 */
export function color(token = '--hue', scope = document.body) {
  const probe = document.createElement('span');
  probe.style.color = token.startsWith('--') ? `var(${token})` : token;
  probe.style.display = 'none';
  scope.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
}
/** Hue of an arbitrary angle in the current theme, e.g. hueColor(152) */
export function hueColor(h, scope = document.body) {
  const probe = document.createElement('span');
  probe.setAttribute('style', `--h:${h};display:none;color:var(--hue)`);
  scope.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
}

/** Run fn whenever the light/dark theme changes (OS setting or data-theme toggle). */
export function onTheme(fn) {
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', fn);
  new MutationObserver(fn).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

let uid = 0;
/**
 * Labeled range slider. Returns { el, input, value, on(fn) }.
 * format(v) renders the output text.
 */
export function slider({ id = `s${++uid}`, label, min = 0, max = 1, step = 0.01, value = min, format = (v) => v }) {
  const node = el(`<div class="ctl"><label for="${id}">${label}</label>` +
    `<input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}">` +
    `<output for="${id}"></output></div>`);
  const input = node.querySelector('input');
  const out = node.querySelector('output');
  const fns = [];
  const sync = () => { out.textContent = format(+input.value); fns.forEach((f) => f(+input.value)); };
  input.addEventListener('input', sync);
  out.textContent = format(+input.value);
  return {
    el: node, input,
    get value() { return +input.value; },
    set value(v) { input.value = v; sync(); },
    on(fn) { fns.push(fn); return this; },
  };
}

/**
 * Group of toggle buttons (single choice). options: [{value, label}]. Returns { el, value, on(fn), set(v) }.
 */
export function segmented({ label = '', options, value = options[0].value }) {
  const node = el(`<div class="seg" role="group"${label ? ` aria-label="${label}"` : ''}>` +
    (label ? `<span class="seg-label">${label}</span>` : '') +
    options.map((o) => `<button type="button" class="btn sm" data-v="${o.value}" aria-pressed="${o.value === value}">${o.label}</button>`).join('') +
    `</div>`);
  const fns = [];
  let cur = value;
  const set = (v, fire = true) => {
    cur = v;
    node.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
    if (fire) fns.forEach((f) => f(v));
  };
  node.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    const o = options.find((x) => String(x.value) === b.dataset.v);
    set(o.value);
  });
  return { el: node, get value() { return cur; }, set, on(fn) { fns.push(fn); return this; } };
}

/* ------------------------------------------------------------------ 3D stage ---------- */
// Browsers keep ~16 live WebGL contexts per page, and this page has ~30 stages. So there is exactly one
// WebGLRenderer, never attached to the DOM; every stage renders through it and copies the pixels to its own 2D canvas.
const DPR = Math.min(devicePixelRatio || 1, 2);
let shared;
function sharedGL() {
  if (shared !== undefined) return shared;
  try {
    shared = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    shared.setPixelRatio(DPR);
    shared.outputColorSpace = THREE.SRGBColorSpace;
    shared.setClearColor(0x000000, 0);
    shared.setScissorTest(true);
    shared.setSize(640, 480, false);
  } catch (e) {
    shared = null;
  }
  return shared;
}
const stages = new Set();
let looping = false;
function loop(now) {
  requestAnimationFrame(loop);
  if (document.hidden) return;
  for (const s of stages) if (s.visible) s.tick(now);
}

/**
 * Create a three.js scene inside a container (it gets the .stage drafting-table look).
 * opts: camera [x,y,z], target [x,y,z], fov, ortho (number = view height), zoom (wheel zoom, default false),
 *       pan (default false), controls (default true), autoRotate (ignored when reduced motion),
 *       label (accessible description), hint (small text in the corner, default "arraste para girar").
 * Returns null if WebGL is unavailable (a fallback message is shown).
 * API: { THREE, scene, camera, renderer, controls, el, onFrame(fn(t, dt)), label(html, [x,y,z], {cls, parent, onClick}),
 *        add(...objs), color(token), hue(), render(), dispose() }
 */
export function stage(container, opts = {}) {
  const {
    camera: camPos = [5, 4, 7], target = [0, 0, 0], fov = 40, ortho = 0,
    zoom = false, pan = false, controls = true, autoRotate = false,
    label = '', hint = 'arraste para girar',
  } = opts;
  container.classList.add('stage');
  if (label) { container.setAttribute('role', 'img'); container.setAttribute('aria-label', label); }

  const gl = sharedGL();
  if (!gl) {
    container.appendChild(el(`<p class="stage-fallback">Este navegador não conseguiu abrir o modo 3D. As explicações, os controles e os links ao lado continuam funcionando.</p>`));
    return null;
  }
  // Each stage shows a 2D canvas; the single shared WebGL renderer draws into it (see sharedGL).
  const view = document.createElement('canvas');
  const ctx2d = view.getContext('2d');
  container.appendChild(view);
  // Same surface the modules expect from a renderer (domElement for events); context management is global.
  const renderer = {
    domElement: view,
    getContext: () => gl.getContext(),
    forceContextLoss() {}, forceContextRestore() {},
    setPixelRatio() {}, setClearColor() {}, setSize() {},
  };

  const labels = new CSS2DRenderer();
  labels.domElement.className = 'stage-labels';
  container.appendChild(labels.domElement);

  if (hint) container.appendChild(el(`<span class="stage-hint" aria-hidden="true">${hint}</span>`));

  const scene = new THREE.Scene();
  let camera;
  if (ortho) {
    camera = new THREE.OrthographicCamera(-ortho, ortho, ortho, -ortho, 0.1, 500);
  } else {
    camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 500);
  }
  camera.position.set(...camPos);
  camera.lookAt(...target);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8890a8, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(5, 9, 6);
  scene.add(sun);

  let ctr = null;
  if (controls) {
    ctr = new OrbitControls(camera, renderer.domElement);
    ctr.target.set(...target);
    ctr.enableDamping = true;
    ctr.dampingFactor = 0.08;
    ctr.enableZoom = zoom;
    ctr.enablePan = pan;
    ctr.autoRotate = autoRotate && !reduced;
    ctr.autoRotateSpeed = 0.8;
    ctr.update();
    // horizontal drag rotates, vertical swipe still scrolls the page on phones
    view.style.touchAction = 'pan-y';
  }

  const frameFns = [];
  const labelObjs = [];
  let last = 0;
  let w = 0, h = 0, pw = 0, ph = 0;
  const resize = () => {
    const r = container.getBoundingClientRect();
    if (!r.width || !r.height) return;
    w = r.width; h = r.height;
    pw = Math.max(1, Math.round(w * DPR)); ph = Math.max(1, Math.round(h * DPR));
    view.width = pw; view.height = ph;
    labels.setSize(w, h);
    if (ortho) {
      const a = w / h;
      camera.left = -ortho * a; camera.right = ortho * a; camera.top = ortho; camera.bottom = -ortho;
    } else {
      camera.aspect = w / h;
    }
    camera.updateProjectionMatrix();
    api.render();
  };

  const api = {
    THREE, scene, camera, renderer, controls: ctr, el: container, visible: false,
    get width() { return w; }, get height() { return h; },
    onFrame(fn) { frameFns.push(fn); return api; },
    add(...objs) { scene.add(...objs); return objs[0]; },
    /** HTML label pinned to a 3D point. cls: 'math' | 'plain' | 'hot'. onClick makes it a button. */
    label(markup, pos = [0, 0, 0], { cls = '', parent = scene, onClick = null } = {}) {
      const d = document.createElement(onClick ? 'button' : 'div');
      d.className = `lbl ${cls}${onClick ? ' hot' : ''}`;
      if (onClick) { d.type = 'button'; d.addEventListener('click', onClick); }
      d.innerHTML = markup;
      const o = new CSS2DObject(d);
      o.position.set(...pos);
      parent.add(o);
      labelObjs.push(o);
      return o;
    },
    color: (token = '--hue') => color(token, container),
    hue: () => color('--hue', container),
    render() {
      if (!w) return;
      // draw in the bottom-left corner of the shared canvas, then copy that block into this stage's canvas
      const c = gl.domElement;
      if (c.width < pw || c.height < ph) gl.setSize(Math.ceil(Math.max(c.width, pw) / DPR) + 1, Math.ceil(Math.max(c.height, ph) / DPR) + 1, false);
      gl.setViewport(0, 0, pw / DPR, ph / DPR);
      gl.setScissor(0, 0, pw / DPR, ph / DPR);
      gl.render(scene, camera);
      ctx2d.clearRect(0, 0, pw, ph);
      ctx2d.drawImage(c, 0, c.height - ph, pw, ph, 0, 0, pw, ph);
      // CSS2DRenderer only checks a label's own .visible; hide labels whose ancestors are hidden
      const own = labelObjs.map((o) => o.visible);
      for (const o of labelObjs) {
        for (let p = o.parent; p; p = p.parent) if (!p.visible) { o.visible = false; break; }
      }
      labels.render(scene, camera);
      labelObjs.forEach((o, i) => { o.visible = own[i]; });
    },
    tick(now) {
      const t = now / 1000;
      const dt = Math.min(0.05, last ? t - last : 0.016);
      last = t;
      for (const f of frameFns) f(t, dt);
      if (ctr) ctr.update();
      api.render();
    },
    dispose() { stages.delete(api); },
  };

  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(([e]) => { api.visible = e.isIntersecting; if (!api.visible) last = 0; }, { rootMargin: '120px' }).observe(container);
  stages.add(api);
  if (!looping) { looping = true; requestAnimationFrame(loop); }
  resize();
  return api;
}

/* -------------------------------------------------------------- small 3D helpers ------ */

/** Flat line through points [[x,y,z],...] */
export function line(points, colorStr, { opacity = 1 } = {}) {
  const g = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p)));
  const m = new THREE.LineBasicMaterial({ color: new THREE.Color(colorStr), transparent: opacity < 1, opacity });
  return new THREE.Line(g, m);
}
/** Thick tube along points (reads better than 1px lines). */
export function tube(points, colorStr, radius = 0.03) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal', 0);
  const g = new THREE.TubeGeometry(curve, Math.max(8, points.length * 4), radius, 8, false);
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: new THREE.Color(colorStr), roughness: 0.5 }));
}
/** Standard matte material in a CSS color. */
export const mat = (colorStr, extra = {}) => new THREE.MeshStandardMaterial({ color: new THREE.Color(colorStr), roughness: 0.55, metalness: 0.05, ...extra });
/** Floor grid on the XZ plane, themed. */
export function floorGrid(size = 10, divisions = 10, scope = document.body) {
  // white vertex colors, tinted by material.color, so a theme change can recolor it with material.color.set()
  const g = new THREE.GridHelper(size, divisions, 0xffffff, 0xffffff);
  g.material.color.set(color('--line', scope));
  g.material.transparent = true;
  g.material.opacity = 0.7;
  return g;
}
/** Easing used for all scripted camera/object moves. */
export const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** Animate a value from a to b over ms; calls fn(v) every frame. Instant when reduced motion. Returns cancel(). */
export function tween(a, b, ms, fn, done) {
  let stopped = false;
  if (reduced || ms <= 0) { fn(b); done && done(); return () => {}; }
  const t0 = performance.now();
  const step = (now) => {
    if (stopped) return;
    const k = Math.min(1, (now - t0) / ms);
    fn(a + (b - a) * ease(k));
    if (k < 1) requestAnimationFrame(step); else done && done();
  };
  requestAnimationFrame(step);
  return () => { stopped = true; };
}
/** Number formatting in pt-BR: br(5.25, 2) -> "5,25" */
export const br = (v, d = 2) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
