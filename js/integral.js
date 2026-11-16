// Chapter 10 · Integral (26:00–26:53 of the video): a pool filled by a known inflow q(t) (3D, one input: time), the area under
// q(t) as a sum of n rectangles converging to the exact volume, and derivative ↔ integral as two views of the same pair V, q.
import { THREE, mount, el, css, vlink, vlinks, stage, slider, segmented, hueColor, onTheme, reduced, mat, tween, br, fmt } from './core.js';

const root = mount('integral');
const W = 195; // water hue

css(`
#integral .pick[hidden] { display: none; }
#integral .in-w { --hue: hsl(${W} var(--hue-s) var(--hue-l)); --hue-soft: hsl(${W} 55% var(--hue-soft-l)); }
#integral .in-svg { display: block; width: 100%; height: 100%; touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: crosshair; }
#integral .in-svg text { font: 500 13px/1 var(--f-body); fill: var(--ink); }
#integral .in-svg .math { font: italic 400 17px/1 var(--f-math); }
#integral .in-svg .big { font: italic 400 24px/1 var(--f-math); fill: var(--hue); }
#integral .in-svg .huge { font: italic 400 48px/1 var(--f-math); fill: var(--ink); opacity: .3; }
#integral .in-svg .sm { font-size: 12px; fill: var(--muted); }
#integral .in-svg .axis { stroke: var(--muted); stroke-width: 1.3; fill: none; }
#integral .in-svg .grid { stroke: var(--line); stroke-width: 1; fill: none; }
#integral .in-svg .curve { stroke: var(--ink); stroke-width: 2.6; fill: none; stroke-linejoin: round; }
#integral .in-svg .guide { stroke: var(--muted); stroke-width: 1.2; stroke-dasharray: 4 4; fill: none; }
#integral .in-svg .area { fill: var(--hue-soft); stroke: none; }
#integral .in-svg .bars rect { fill: color-mix(in srgb, var(--hue) 26%, transparent); stroke: var(--hue); }
#integral .in-svg .leg { stroke: var(--hue); stroke-width: 1.6; stroke-dasharray: 3 3; fill: none; }
#integral .in-svg .tan { stroke: var(--hue); stroke-width: 2.6; fill: none; stroke-linecap: round; }
#integral .in-svg .hue-f { fill: var(--hue); }
#integral .in-svg .hue-s { stroke: var(--hue); fill: none; stroke-width: 2.2; }
#integral .in-svg .hue-t { fill: var(--hue); font-weight: 600; }
#integral .in-svg .knob { fill: var(--surface); stroke: var(--ink); stroke-width: 2; }
#integral .in-svg .fade { transition: opacity .4s; }
/* charts scale down with the stage: keep their type readable on phones */
@media (max-width: 600px) {
  #integral .in-svg text { font-size: 19px; }
  #integral .in-svg .sm { font-size: 18px; }
  #integral .in-svg .math { font-size: 22px; }
}
`);

/* ------------------------------------------------------------ shared local helpers ---- */
const themed = [];
const tint = (m, fn) => { m.color.set(fn()); themed.push([m, fn]); return m; };
onTheme(() => themed.forEach(([m, fn]) => m.color.set(fn())));
const mix = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);
const NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  parent?.appendChild(n);
  return n;
}
const setA = (n, attrs) => { for (const k in attrs) n.setAttribute(k, attrs[k]); };
const text = (parent, attrs, s) => { const n = svg('text', attrs, parent); n.textContent = s; return n; };
const lin = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
const press = (b, on) => b.setAttribute('aria-pressed', String(on));
function picker(box, defs) {
  let on = null, key = null;
  const render = () => { const [h, p, seg, hint] = defs[key](); box.innerHTML = `<h4>${h}</h4><p>${p}</p>${vlink(seg, hint)}`; box.hidden = false; };
  return {
    show(btn, k) { on?.classList.remove('on'); on = btn || null; on?.classList.add('on'); key = k; render(); },
    refresh() { if (key) render(); },
  };
}
function flyTo(s, [pos, tgt], ms = 900) {
  const p0 = s.camera.position.clone(), t0 = s.controls.target.clone();
  const p1 = new THREE.Vector3(...pos), t1 = new THREE.Vector3(...tgt);
  tween(0, 1, ms, (k) => { s.camera.position.lerpVectors(p0, p1, k); s.controls.target.lerpVectors(t0, t1, k); s.controls.update(); });
}
function dragTime(S, x0, x1, T, fn) {
  const at = (e) => { const r = S.getBoundingClientRect(); fn((((e.clientX - r.left) / r.width) * 640 - x0) / (x1 - x0) * T); };
  S.addEventListener('pointerdown', (e) => { S.setPointerCapture(e.pointerId); at(e); });
  S.addEventListener('pointermove', (e) => { if (e.buttons) at(e); });
}

/* ------------------------------------------------------------- the one model --------- */
// Our example: pool 4 × 2,5 × 1,2 m = 12 000 L, inflow q(t) = A + B·sen(πt/T) L/s that fills it exactly in T = 1200 s.
const PL = 4, PW = 2.5, PD = 1.2, CAP = PL * PW * PD * 1000;
const T = 1200, B = 6, A = 10 - (2 * B) / Math.PI;
const q = (t) => A + B * Math.sin((Math.PI * t) / T);
const V = (t) => A * t + ((B * T) / Math.PI) * (1 - Math.cos((Math.PI * t) / T)); // V(t) = ∫₀ᵗ q(τ) dτ, in litres
const leftSum = (t, n) => { let s = 0; const d = t / n; for (let i = 0; i < n; i++) s += q(i * d) * d; return s; };
console.assert(Math.abs(V(T) - CAP) < 1e-6 && Math.abs(leftSum(T, 200) - CAP) < 1 && Math.abs(leftSum(T, 4) - CAP) > Math.abs(leftSum(T, 200) - CAP) &&
  [100, 500, 900].every((t) => Math.abs((V(t + 0.01) - V(t - 0.01)) / 0.02 - q(t)) < 1e-6), 'integral: V(T) = 12 000 L, a soma converge e V′ = q');
const level = (t) => V(t) / 1000 / (PL * PW); // metres of water
const nOf = (u) => Math.round(4 * 50 ** (u / 100)); // slider 0..100 → 4..200 rectangles, even in log scale
const st = { t: 480, n: 8, play: false };
const subs = [];
const redraw = () => { for (const f of subs) f(); };
const setT = (t) => { st.t = Math.max(0, Math.min(T, t)); redraw(); };
const tSliders = [];
const tSlider = (id) => { const s = slider({ id, label: 'Tempo <i>t</i>', min: 0, max: T, step: 1, value: st.t, format: fmt }); s.on(setT); tSliders.push(s); return s; };
subs.push(() => { for (const s of tSliders) { s.input.value = st.t; s.el.querySelector('output').textContent = fmt(st.t); } });

/* ========================================================== 1. A piscina (3D) ===== */
{
  const t = el(`
<article class="topic" id="in-t-piscina">
  <div class="stage-col">
    <div class="stage" id="in-pool"></div>
    <p class="stage-cap">Piscina de 4 × 2,5 × 1,2 m, 12.000 litros. O cano despeja a vazão <i>q</i>(<i>t</i>); a água guarda o volume <i>V</i>(<i>t</i>). Tempo acelerado 60 vezes. Clique nos rótulos.</p>
    <div class="controls"></div>
  </div>
  <div class="explain">
    <p class="kicker">Exemplo do vídeo · encher uma piscina</p>
    <h3>Da vazão ao volume</h3>
    <p>Vídeo longo, deu até fome. Há quem diga que integral só faz bem fora da matemática, no pão. Aqui o bicho pega, então vamos simplificar.</p>
    <p>Imagine que você mede a água que enche uma piscina. Se você conhece a função da <b>taxa de vazão</b>, isto é, quantos litros entram por segundo, a integral calcula o <b>volume total</b> que entrou durante um certo tempo.</p>
    <div class="stats">
      <div class="stat"><b id="in-st-t">0</b><span>tempo (min:s)</span></div>
      <div class="stat in-w"><b id="in-st-q">0</b><span>vazão q(t), L/s</span></div>
      <div class="stat in-w"><b id="in-st-v">0</b><span>volume V(t), litros</span></div>
      <div class="stat"><b id="in-st-h">0</b><span>nível da água, m</span></div>
    </div>
    <div class="formula"><i>q</i>(<i>t</i>) = ${br(A, 2)} + 6·sen(π<i>t</i>/1200) L/s<small>Exemplo nosso: a torneira abre mais no meio do enchimento. Em 1.200 s (20 min) entram exatamente 12.000 L.</small></div>
    <div class="pick" hidden></div>
    ${vlinks([[1560, 'Vídeo longo, deu até fome'], [1565, 'Integral só faz bem fora da matemática?'], [1571, 'Vamos simplificar: uma piscina enchendo'], [1577, 'Se você souber a taxa de vazão…'], [1584, '…a integral dá o volume total']])}
  </div>
</article>`);
  root.append(t);
  const $ = (sel) => t.querySelector(sel);
  const pick = picker($('.pick'), {
    q: () => ['Vazão q(t)', `Quanto entra por segundo. Agora: ${br(q(st.t), 2)} L/s. Começa em ${br(A, 2)}, sobe até ${br(A + B, 2)} no meio e volta a ${br(A, 2)}.`, 1577, 'A função da taxa de vazão'],
    v: () => ['Volume V(t)', `Tudo o que entrou até agora: ${br(V(st.t), 0)} L. Somar a vazão de cada instante, de 0 até t, é calcular a integral.`, 1584, 'A integral dá o volume total'],
    pool: () => ['A piscina', '4 m × 2,5 m × 1,2 m = 12 m³ = 12.000 litros. O nível é o volume dividido pela área do fundo: h = V ÷ 10 m², com V em metros cúbicos.', 1571, 'Uma piscina enchendo'],
  });
  const row = el(`<div class="btn-row"><button type="button" class="btn sm" aria-pressed="false">Abrir a torneira</button><button type="button" class="btn sm">Esvaziar</button><button type="button" class="btn sm">Encher até o fim</button></div>`);
  const [playB, emptyB, fillB] = row.querySelectorAll('button');
  const slT = tSlider('in-pool-t');
  const view = segmented({ label: 'Vista', options: [{ value: 'tq', label: '3/4' }, { value: 'cut', label: 'Em corte' }, { value: 'top', label: 'De cima' }], value: 'tq' });
  $('.controls').append(row, slT.el, view.el);

  let raf = 0, last = 0;
  const step = (ts) => {
    const dt = last ? Math.min(0.05, (ts - last) / 1000) * 60 : 0; // 60× real time: 20 min in 20 s
    last = ts;
    if (st.t + dt >= T) { setT(T); setPlay(false); return; }
    setT(st.t + dt);
    raf = requestAnimationFrame(step);
  };
  function setPlay(on) {
    cancelAnimationFrame(raf);
    st.play = on;
    press(playB, on);
    playB.textContent = on ? 'Fechar a torneira' : st.t >= T ? 'Encher de novo' : 'Abrir a torneira';
    if (on) { if (st.t >= T) setT(0); last = 0; raf = requestAnimationFrame(step); } else pick.refresh();
  }
  playB.addEventListener('click', () => setPlay(!st.play));
  emptyB.addEventListener('click', () => { setPlay(false); tween(st.t, 0, 800, setT, () => setPlay(false)); });
  fillB.addEventListener('click', () => { setPlay(false); tween(st.t, T, 1400, setT, () => setPlay(false)); });
  slT.input.addEventListener('input', () => { if (st.play) setPlay(false); });
  subs.push(() => {
    $('#in-st-t').textContent = fmt(st.t);
    $('#in-st-q').textContent = br(q(st.t), 2);
    $('#in-st-v').textContent = br(V(st.t), 0);
    $('#in-st-h').textContent = br(level(st.t), 2);
  });

  const VIEWS = { tq: [[5.3, 3.8, 5.7], [0.1, -0.6, 0]], cut: [[0.5, 0.55, 6.6], [0, -0.6, 0]], top: [[0.01, 8.2, 0.9], [0, -0.6, 0]] };
  const s = stage($('#in-pool'), { camera: VIEWS.tq[0], target: VIEWS.tq[1], label: 'Piscina retangular enchendo: um cano despeja água, o nível sobe e uma régua na parede marca a altura. No modo em corte, a parede da frente some e a água aparece de lado.' });
  if (s) {
    const ink = () => s.color('--ink'), surf = () => s.color('--surface');
    const water = () => hueColor(W);
    // tiles: one canvas tile (25 cm) repeated through the uv of each wall, recoloured with the theme
    const tc = document.createElement('canvas');
    tc.width = tc.height = 64;
    const tileTex = new THREE.CanvasTexture(tc);
    tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
    tileTex.colorSpace = THREE.SRGBColorSpace;
    tileTex.anisotropy = 4;
    const paintTiles = () => {
      const c = tc.getContext('2d');
      c.fillStyle = `#${mix(water(), surf(), 0.7).getHexString()}`;
      c.fillRect(0, 0, 64, 64);
      c.fillStyle = `#${mix(water(), surf(), 0.35).getHexString()}`;
      c.fillRect(0, 0, 64, 3);
      c.fillRect(0, 0, 3, 64);
      tileTex.needsUpdate = true;
    };
    paintTiles();
    onTheme(paintTiles);
    const mTile = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.5 });
    const tilePlane = (w, h) => {
      const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / 0.25, (uv.getY(i) * h) / 0.25);
      return new THREE.Mesh(g, mTile);
    };
    const mDeck = tint(mat('#888', { roughness: 0.85 }), () => mix(surf(), ink(), 0.1));
    const mCope = tint(mat('#888', { roughness: 0.6 }), () => mix(surf(), ink(), 0.22));
    const box = (w, h, d, x, y, z, m, parent) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; };
    const pool = new THREE.Group(), front = new THREE.Group();
    s.add(pool);
    pool.add(front);
    const RIM = 0.55, GH = PD + 0.18, OX = PL / 2 + RIM / 2, OZ = PW / 2 + RIM / 2;
    box(PL + 2 * RIM, GH, RIM, 0, -GH / 2, -OZ, mDeck, pool);
    box(PL + 2 * RIM, GH, RIM, 0, -GH / 2, OZ, mDeck, front);
    box(RIM, GH, PW, -OX, -GH / 2, 0, mDeck, pool);
    box(RIM, GH, PW, OX, -GH / 2, 0, mDeck, pool);
    box(PL, 0.18, PW, 0, -PD - 0.09, 0, mDeck, pool);
    box(PL + 0.32, 0.05, 0.16, 0, 0.025, -PW / 2 - 0.08, mCope, pool);
    box(PL + 0.32, 0.05, 0.16, 0, 0.025, PW / 2 + 0.08, mCope, front);
    box(0.16, 0.05, PW, -PL / 2 - 0.08, 0.025, 0, mCope, pool);
    box(0.16, 0.05, PW, PL / 2 + 0.08, 0.025, 0, mCope, pool);
    const back = tilePlane(PL, PD); back.position.set(0, -PD / 2, -PW / 2 + 0.002); pool.add(back);
    const fr = tilePlane(PL, PD); fr.rotation.y = Math.PI; fr.position.set(0, -PD / 2, PW / 2 - 0.002); front.add(fr);
    const lw = tilePlane(PW, PD); lw.rotation.y = Math.PI / 2; lw.position.set(-PL / 2 + 0.002, -PD / 2, 0); pool.add(lw);
    const rw = tilePlane(PW, PD); rw.rotation.y = -Math.PI / 2; rw.position.set(PL / 2 - 0.002, -PD / 2, 0); pool.add(rw);
    const fl = tilePlane(PL, PW); fl.rotation.x = -Math.PI / 2; fl.position.set(0, -PD + 0.002, 0); pool.add(fl);
    // depth ruler on the back wall (it faces the camera), a tick every 20 cm
    const mInk = tint(mat('#888'), ink), RX = 1.55, RZ = -PW / 2 + 0.01;
    box(0.03, PD, 0.015, RX, -PD / 2, RZ, mInk, pool);
    for (let k = 0; k <= 6; k++) box(k % 3 ? 0.08 : 0.14, 0.012, 0.015, RX, -PD + k * 0.2, RZ, mInk, pool);
    s.label('1,2 m', [RX, 0.16, RZ - 0.05], { cls: 'plain' });
    const lH = s.label('', [RX + 0.12, -PD, RZ + 0.05]);
    // water: a volume that rises and a rippling surface; the volume stops 4 mm below it so the two never z-fight
    const mWater = tint(new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.62, roughness: 0.12, metalness: 0.05, depthWrite: false }), water);
    const mSurf = tint(new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.72, roughness: 0.06, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide }), () => mix(water(), surf(), 0.05));
    const vol = new THREE.Mesh(new THREE.BoxGeometry(PL - 0.01, 1, PW - 0.01).translate(0, 0.5, 0), mWater);
    vol.position.y = -PD;
    const sg = new THREE.PlaneGeometry(PL - 0.01, PW - 0.01, 28, 18).rotateX(-Math.PI / 2);
    const sp = sg.attributes.position, base = Float32Array.from(sp.array);
    const surface = new THREE.Mesh(sg, mSurf);
    pool.add(vol, surface);
    // the pipe and its stream: the stream's thickness follows √q
    const OUT = [-1.1, 0.8, -0.9];
    const mPipe = tint(mat('#888', { roughness: 0.35, metalness: 0.55 }), () => mix(s.color('--muted'), surf(), 0.15));
    const pipe = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-1.1, -0.02, -1.66], [-1.1, 0.78, -1.66], [-1.1, 0.95, -1.5], [-1.1, 0.95, -1.08], [-1.1, 0.84, -0.93]].map((p) => new THREE.Vector3(...p))), 48, 0.065, 12, false), mPipe);
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 20), mPipe);
    flange.position.set(-1.1, 0.025, -1.66);
    const stc = document.createElement('canvas');
    stc.width = 4; stc.height = 64;
    { const c = stc.getContext('2d'); for (let y = 0; y < 64; y++) { const g = Math.round(255 * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin((2 * Math.PI * y) / 16)))); c.fillStyle = `rgb(${g},${g},${g})`; c.fillRect(0, y, 4, 1); } }
    const stripes = new THREE.CanvasTexture(stc);
    stripes.wrapT = THREE.RepeatWrapping;
    stripes.repeat.set(1, 2);
    const mStream = tint(new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.85, alphaMap: stripes, roughness: 0.1, depthWrite: false }), () => mix(water(), surf(), 0.1));
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16, 1, true).translate(0, -0.5, 0), mStream);
    stream.position.set(...OUT);
    const mFoam = tint(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.6, depthWrite: false }), () => mix(water(), '#fff', 0.55)); // foam is white in both themes
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.13, 28).rotateX(-Math.PI / 2), mFoam);
    ring.position.set(OUT[0], 0, OUT[2]);
    s.add(pipe, flange, stream, ring);
    // concept labels
    const hot = (html, pos, k, cls = '') => s.label(html, pos, { cls, onClick: (e) => pick.show(e.currentTarget, k) });
    hot('vazão <i>q</i>(<i>t</i>)', [-1.1, 1.24, -1.35], 'q');
    const lV = hot('', [-0.2, -PD, 0.6], 'v');
    hot('piscina 4 × 2,5 × 1,2 m', [-0.15, 0.14, -PW / 2 - 0.3], 'pool');
    let lastV = '', lastH = '';
    subs.push(() => {
      const h = level(st.t), y = -PD + h, flowing = st.t < T;
      vol.visible = surface.visible = h > 0.002;
      vol.scale.y = Math.max(0.001, h - 0.004);
      surface.position.y = y;
      stream.visible = ring.visible = flowing;
      const r = 0.03 + 0.04 * Math.sqrt(q(st.t) / (A + B));
      stream.scale.set(r, OUT[1] - y, r);
      ring.position.y = y + 0.006;
      lV.position.y = y + 0.2;
      const tv = `volume <i>V</i>(<i>t</i>) = ${br(V(st.t), 0)} L`, th = `h = ${br(h, 2)} m`;
      if (tv !== lastV) { lV.element.innerHTML = tv; lastV = tv; }
      if (th !== lastH) { lH.element.textContent = th; lastH = th; }
      lH.position.y = Math.max(-PD + 0.08, y);
    });
    // ambient life: ripples, a running stream and a foam ring (all off with reduced motion)
    if (!reduced) {
      s.onFrame((time) => {
        const flowing = st.t < T;
        for (let i = 0; i < sp.count; i++) {
          const x = base[i * 3], z = base[i * 3 + 2], d = Math.hypot(x - OUT[0], z - OUT[2]);
          sp.array[i * 3 + 1] = 0.006 * Math.sin(5 * x + 2.2 * time) + 0.005 * Math.sin(6 * z - 1.6 * time + x) + (flowing ? 0.014 * Math.sin(14 * d - 7 * time) * Math.exp(-2.5 * d) : 0);
        }
        sp.needsUpdate = true;
        sg.computeVertexNormals();
        stripes.offset.y = (time * 1.4) % 1;
        const k = (time * 1.3) % 1;
        ring.scale.setScalar(1 + k * 2.4);
        mFoam.opacity = 0.6 * (1 - k);
      });
    }
    view.on((k) => { front.visible = k !== 'cut'; flyTo(s, VIEWS[k]); });
  } else {
    view.el.querySelectorAll('button').forEach((b) => { b.disabled = true; });
  }
}

/* ===================================== 2. Área sob a curva: soma de retângulos ===== */
{
  const t = el(`
<article class="topic flip" id="in-t-soma">
  <div class="stage-col">
    <div class="stage short" id="in-soma"></div>
    <p class="stage-cap">Cada retângulo vale vazão × Δ<i>t</i>: os litros que entraram naquela fatia de tempo. Arraste no gráfico para mudar o instante <i>t</i>.</p>
    <div class="controls"></div>
  </div>
  <div class="explain">
    <p class="kicker">Área sob a curva</p>
    <h3>Integral quer dizer somatório</h3>
    <p>A integral é uma ferramenta para calcular a área sob uma curva num gráfico, por meio do somatório infinitesimal de cada ponto. No gráfico da vazão essa área é o volume: litros por segundo vezes segundos dá litros.</p>
    <p>Corte o tempo em <i>n</i> fatias de largura Δ<i>t</i>. Numa fatia fina a vazão quase não muda, então a água que entrou é um retângulo, <i>q</i>·Δ<i>t</i>. Somando os retângulos sai o volume aproximado. Com mais fatias, e mais finas, a soma encosta no valor exato.</p>
    <div class="stats">
      <div class="stat"><b id="in-sn">0</b><span>retângulos n</span></div>
      <div class="stat"><b id="in-sdt">0</b><span>largura Δt (s)</span></div>
      <div class="stat"><b id="in-ss">0</b><span>soma dos retângulos (L)</span></div>
      <div class="stat"><b id="in-sv">0</b><span>integral exata (L)</span></div>
      <div class="stat"><b id="in-se">0</b><span>diferença (L)</span></div>
    </div>
    <div class="formula"><i>V</i>(<i>t</i>) = ∫<sub>0</sub><sup><i>t</i></sup> <i>q</i>(τ) dτ ≈ Σ <i>q</i>(<i>t</i><sub><i>i</i></sub>)·Δ<i>t</i><small>A soma usa a vazão no começo de cada fatia. Quando n tende ao infinito e Δt a zero, a aproximação vira igualdade.</small></div>
    <p class="note fact"><span>O símbolo ∫ é um S alongado. Leibniz o escolheu em 1675 como inicial de <i>summa</i>, soma em latim.</span></p>
    ${vlinks([[1588, 'Uma ferramenta para a área sob uma curva'], [1594, 'Somatório infinitesimal: integral significa somatório']])}
  </div>
</article>`);
  root.append(t);
  const $ = (sel) => t.querySelector(sel);
  const slN = slider({ id: 'in-n', label: 'Retângulos <i>n</i>', min: 0, max: 100, step: 0.5, value: (100 * Math.log(st.n / 4)) / Math.log(50), format: (u) => String(nOf(u)) });
  const slT = tSlider('in-soma-t');
  const row = el(`<div class="btn-row"><button type="button" class="btn sm">n → ∞</button><button type="button" class="btn sm">4 retângulos</button><button type="button" class="btn sm">Até os 20 min</button></div>`);
  const [infB, fewB, endB] = row.querySelectorAll('button');
  $('.controls').append(slN.el, slT.el, row);
  slN.on((u) => { st.n = nOf(u); redraw(); });
  infB.addEventListener('click', () => { const from = slN.value > 99 ? 0 : slN.value; tween(from, 100, 2600 * (1 - from / 100) + 300, (u) => { slN.value = u; }); });
  fewB.addEventListener('click', () => { slN.value = 0; });
  endB.addEventListener('click', () => tween(st.t, T, 900, setT));

  const X = lin(0, T, 58, 618), Y = lin(0, 14, 318, 24);
  const S = svg('svg', { viewBox: '0 0 640 360', class: 'in-svg in-w', role: 'img', 'aria-label': 'Gráfico da vazão em função do tempo com retângulos sob a curva, de zero até o instante t; a soma dos retângulos aproxima a área.' }, $('#in-soma'));
  for (let k = 0; k <= T; k += 200) { svg('line', { x1: X(k), y1: Y(0), x2: X(k), y2: Y(14), class: 'grid' }, S); text(S, { x: X(k), y: Y(0) + 18, class: 'sm', 'text-anchor': 'middle' }, br(k, 0)); }
  for (let k = 2; k <= 14; k += 2) { svg('line', { x1: X(0), y1: Y(k), x2: X(T), y2: Y(k), class: 'grid' }, S); text(S, { x: X(0) - 8, y: Y(k) + 4, class: 'sm', 'text-anchor': 'end' }, String(k)); }
  text(S, { x: X(T) - 4, y: Y(0) - 8, class: 'sm', 'text-anchor': 'end' }, 't (s)');
  text(S, { x: X(0) + 6, y: 16, class: 'sm' }, 'vazão q (L/s)');
  const area = svg('path', { class: 'area' }, S);
  const bars = svg('g', { class: 'bars' }, S);
  const rects = [];
  for (let i = 0; i < 200; i++) rects.push(svg('rect', { display: 'none' }, bars));
  svg('line', { x1: X(0), y1: Y(0), x2: X(T), y2: Y(0), class: 'axis' }, S);
  svg('line', { x1: X(0), y1: Y(0), x2: X(0), y2: Y(14), class: 'axis' }, S);
  let d = '';
  for (let i = 0; i <= 200; i++) { const x = (i / 200) * T; d += `${i ? 'L' : 'M'} ${X(x).toFixed(1)} ${Y(q(x)).toFixed(1)} `; }
  svg('path', { d, class: 'curve' }, S);
  text(S, { x: X(930) + 8, y: Y(q(930)) - 8, class: 'math' }, 'q(t)');
  const cur = svg('line', { class: 'guide' }, S);
  const knob = svg('circle', { r: 7, class: 'knob' }, S);
  const curT = text(S, { class: 'sm' }, '');
  const big = text(S, { class: 'huge', 'text-anchor': 'middle' }, '');
  let shown = 0;
  subs.push(() => {
    const t0 = st.t, n = st.n, dt = t0 / n, cnt = t0 > 0 ? n : 0;
    for (let i = 0; i < cnt; i++) {
      const x0 = i * dt, h = q(x0);
      setA(rects[i], { display: 'inline', x: X(x0).toFixed(2), y: Y(h).toFixed(2), width: (X(x0 + dt) - X(x0)).toFixed(2), height: (Y(0) - Y(h)).toFixed(2) });
    }
    for (let i = cnt; i < shown; i++) rects[i].setAttribute('display', 'none');
    shown = cnt;
    bars.setAttribute('stroke-width', n > 60 ? 0 : n > 24 ? 0.6 : 1.2);
    let a = `M ${X(0)} ${Y(0)} `;
    for (let i = 0; i <= 100; i++) { const x = (i / 100) * t0; a += `L ${X(x).toFixed(1)} ${Y(q(x)).toFixed(1)} `; }
    setA(area, { d: `${a}L ${X(t0)} ${Y(0)} Z` });
    setA(cur, { x1: X(t0), y1: Y(0), x2: X(t0), y2: Y(14) });
    setA(knob, { cx: X(t0), cy: Y(0) });
    const flip = X(t0) > 520;
    setA(curT, { x: X(t0) + (flip ? -8 : 8), y: Y(14) + 14, 'text-anchor': flip ? 'end' : 'start' });
    curT.textContent = `t = ${fmt(t0)}`;
    setA(big, { x: X(t0 / 2), y: Y(3.4) });
    big.textContent = t0 > 120 ? '∫' : '';
    const S0 = leftSum(t0, n), E = V(t0);
    $('#in-sn').textContent = n;
    $('#in-sdt').textContent = br(dt, dt < 10 ? 2 : 1);
    $('#in-ss').textContent = br(S0, 0);
    $('#in-sv').textContent = br(E, 0);
    $('#in-se').textContent = br(E - S0, 1);
  });
  dragTime(S, 58, 618, T, setT);
}

/* ======================================= 3. O oposto da derivada: V ↔ q ===== */
{
  const t = el(`
<article class="topic" id="in-t-oposto">
  <div class="stage-col">
    <div class="stage" id="in-oposto"></div>
    <p class="stage-cap">Em cima, o volume <i>V</i>(<i>t</i>). Embaixo, a vazão <i>q</i>(<i>t</i>). A inclinação de cima é a altura de baixo; a área de baixo é a altura de cima.</p>
    <div class="controls"></div>
  </div>
  <div class="explain">
    <p class="kicker">O oposto da derivada</p>
    <h3>A derivada mede a mudança, a integral soma</h3>
    <p>A integral é o oposto da derivada. Na prática, a derivada mede como algo muda em um ponto, e a integral mede o somatório infinitesimal desses pontos.</p>
    <p>Na piscina dá para ver as duas ao mesmo tempo. A inclinação da curva do volume num instante é a vazão daquele instante: isso é derivar. A área sob a curva da vazão, de 0 até <i>t</i>, é o volume acumulado: isso é integrar. Um caminho desfaz o outro.</p>
    <div class="stats">
      <div class="stat in-w"><b id="in-ov">0</b><span>V(t) = área embaixo (L)</span></div>
      <div class="stat in-w"><b id="in-oq">0</b><span>q(t) = inclinação em cima (L/s)</span></div>
    </div>
    <div class="formula"><i>V</i> ′(<i>t</i>) = <i>q</i>(<i>t</i>) &nbsp;⇔&nbsp; <i>V</i>(<i>t</i>) = ∫<sub>0</sub><sup><i>t</i></sup> <i>q</i>(τ) dτ</div>
    <p class="note fact">Esse vaivém se chama teorema fundamental do cálculo. Newton e Leibniz chegaram a ele de forma independente, no século XVII.</p>
    <p class="note">E isso, avisa o vídeo, é só o resumo do resumo: uma tentativa de despertar o seu interesse pela matemática.</p>
    ${vlinks([[1600, 'É o oposto da derivada'], [1607, 'Derivada num ponto, integral soma os pontos: o resumo do resumo']])}
  </div>
</article>`);
  root.append(t);
  const $ = (sel) => t.querySelector(sel);
  const mode = segmented({ label: 'Ler como', options: [{ value: 'int', label: 'integral: q → V' }, { value: 'der', label: 'derivada: V → q' }], value: 'int' });
  const slT = tSlider('in-op-t');
  $('.controls').append(mode.el, slT.el);
  const X = lin(0, T, 58, 618), YV = lin(0, 12000, 214, 34), YQ = lin(0, 14, 434, 284);
  const S = svg('svg', { viewBox: '0 0 640 480', class: 'in-svg in-w', role: 'img', 'aria-label': 'Dois gráficos alinhados: em cima o volume acumulado com a reta tangente no instante t; embaixo a vazão com a área sombreada até t.' }, $('#in-oposto'));
  for (let k = 0; k <= T; k += 200) {
    svg('line', { x1: X(k), y1: YV(0), x2: X(k), y2: YV(12000), class: 'grid' }, S);
    svg('line', { x1: X(k), y1: YQ(0), x2: X(k), y2: YQ(14), class: 'grid' }, S);
    text(S, { x: X(k), y: YQ(0) + 18, class: 'sm', 'text-anchor': 'middle' }, br(k, 0));
  }
  for (const k of [4000, 8000, 12000]) { svg('line', { x1: X(0), y1: YV(k), x2: X(T), y2: YV(k), class: 'grid' }, S); text(S, { x: X(0) - 8, y: YV(k) + 4, class: 'sm', 'text-anchor': 'end' }, `${k / 1000} mil`); }
  for (const k of [4, 8, 12]) { svg('line', { x1: X(0), y1: YQ(k), x2: X(T), y2: YQ(k), class: 'grid' }, S); text(S, { x: X(0) - 8, y: YQ(k) + 4, class: 'sm', 'text-anchor': 'end' }, String(k)); }
  for (const [y0, y1] of [[YV(0), YV(12000)], [YQ(0), YQ(14)]]) { svg('line', { x1: X(0), y1: y0, x2: X(T), y2: y0, class: 'axis' }, S); svg('line', { x1: X(0), y1: y0, x2: X(0), y2: y1, class: 'axis' }, S); }
  text(S, { x: X(0) + 6, y: 24, class: 'sm' }, 'volume V (L)');
  text(S, { x: X(0) + 6, y: YQ(14) - 10, class: 'sm' }, 'vazão q (L/s)');
  text(S, { x: X(T) - 4, y: YQ(0) - 8, class: 'sm', 'text-anchor': 'end' }, 't (s)');
  const area = svg('path', { class: 'area fade' }, S);
  let dV = '', dQ = '';
  for (let i = 0; i <= 200; i++) { const x = (i / 200) * T; dV += `${i ? 'L' : 'M'} ${X(x).toFixed(1)} ${YV(V(x)).toFixed(1)} `; dQ += `${i ? 'L' : 'M'} ${X(x).toFixed(1)} ${YQ(q(x)).toFixed(1)} `; }
  svg('path', { d: dV, class: 'curve' }, S);
  svg('path', { d: dQ, class: 'curve' }, S);
  const cur = svg('line', { class: 'guide' }, S);
  svg('rect', { x: 58, y: 34, width: 560, height: 180 }, svg('clipPath', { id: 'in-op-clip' }, svg('defs', {}, S)));
  const tan = svg('line', { class: 'tan fade' }, svg('g', { 'clip-path': 'url(#in-op-clip)' }, S));
  const legs = svg('path', { class: 'leg fade' }, S), runT = text(S, { class: 'sm fade', 'text-anchor': 'middle' }, '200 s'), riseT = text(S, { class: 'sm fade' }, '');
  const pV = svg('circle', { r: 6, class: 'hue-f' }, S), pQ = svg('circle', { r: 6, class: 'hue-f' }, S);
  const tanT = text(S, { class: 'hue-t fade' }, ''), areaT = text(S, { class: 'hue-t fade', 'text-anchor': 'middle' }, '');
  const arrow = svg('path', { class: 'hue-s' }, S), head = svg('path', { class: 'hue-f' }, S), opT = text(S, { class: 'big', 'text-anchor': 'start' }, '');
  const draw = () => {
    const t0 = st.t, v0 = V(t0), q0 = q(t0), x = X(t0), integ = mode.value === 'int';
    setA(cur, { x1: x, y1: YV(12000), x2: x, y2: YQ(0) });
    const L = 170; // tangent drawn over ±170 s
    setA(tan, { x1: X(t0 - L), y1: YV(v0 - q0 * L), x2: X(t0 + L), y2: YV(v0 + q0 * L) });
    setA(pV, { cx: x, cy: YV(v0) });
    setA(pQ, { cx: x, cy: YQ(q0) });
    let a = `M ${X(0)} ${YQ(0)} `;
    for (let i = 0; i <= 100; i++) { const u = (i / 100) * t0; a += `L ${X(u).toFixed(1)} ${YQ(q(u)).toFixed(1)} `; }
    setA(area, { d: `${a}L ${x} ${YQ(0)} Z` });
    const lft = x > 230; // above-left of the point lies above the rising curve; the slope triangle sits below-right
    setA(tanT, { x: x + (lft ? -14 : 14), y: YV(v0) - 14, 'text-anchor': lft ? 'end' : 'start' });
    tanT.textContent = `inclinação = ${br(q0, 2)} L/s`;
    // slope triangle over 200 s: rise ÷ run = q(t)
    const run = t0 + 200 <= T ? 200 : -200, rx = X(t0 + run), ry = YV(v0 + q0 * run);
    setA(legs, { d: `M ${x} ${YV(v0)} L ${rx} ${YV(v0)} L ${rx} ${ry}` });
    setA(runT, { x: (x + rx) / 2, y: YV(v0) + (run > 0 ? 16 : -8) });
    setA(riseT, { x: rx + (run > 0 ? 6 : -6), y: (YV(v0) + ry) / 2 + 4, 'text-anchor': run > 0 ? 'start' : 'end' });
    riseT.textContent = `${br(Math.abs(q0 * run), 0)} L`;
    setA(areaT, { x: X(Math.max(t0, 240) / 2), y: YQ(2.2) });
    areaT.textContent = t0 > 60 ? `área = ${br(v0, 0)} L` : '';
    tan.style.opacity = tanT.style.opacity = legs.style.opacity = runT.style.opacity = riseT.style.opacity = integ ? 0.35 : 1;
    area.style.opacity = areaT.style.opacity = integ ? 1 : 0.35;
    // arrow in the gap between the charts: up for integral (area → V), down for derivative (slope → q)
    const top = YV(0) + 14, bot = YQ(14) - 22, ax = x + (x > 560 ? -18 : 18), [y0, y1] = integ ? [bot, top] : [top, bot], dir = integ ? -1 : 1;
    setA(arrow, { d: `M ${ax} ${y0} L ${ax} ${y1 - dir * 9}` });
    setA(head, { d: `M ${ax - 6} ${y1 - dir * 10} L ${ax + 6} ${y1 - dir * 10} L ${ax} ${y1} Z` });
    setA(opT, { x: ax + (x > 560 ? -40 : 10), y: (top + bot) / 2 + 8 });
    opT.textContent = integ ? '∫' : 'd/dt';
    $('#in-ov').textContent = br(v0, 0);
    $('#in-oq').textContent = br(q0, 2);
  };
  subs.push(draw);
  mode.on(draw);
  dragTime(S, 58, 618, T, setT);
}

redraw();
