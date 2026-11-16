// Chapter 2 · Aritmética (01:43–06:44). Number sets as a cut-open onion, complex roots that leave the real line,
// candies and egg trays, "only + and ×" on a number line and a pizza, cube towers from sums to powers, and
// percentages on a cake and on a hundred-grid. The isometric figures follow the anatomy craft: solid parts shaded
// in tones by facing, painter's order, a framed card whose live readout comes from the same numbers that move the parts.
import { THREE, mount, el, css, vlinks, stage, slider, segmented, hueColor, color, onTheme, reduced, tube, tween, ease, br } from './core.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const root = mount('aritmetica');
const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a / gcd(a, b)) * b;
const num = (v, d = 3) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: d });
const money = (v) => `R$ ${br(v, 2)}`;

// self-checks of every number the chapter shows
console.assert(lcm(30, 20) === 60, 'MMC(30, 20) = 60');
console.assert(Math.abs(16.98 * 2 - 33.96) < 1e-9 && Math.abs(8.69 * 3 - 26.07) < 1e-9, 'ovos: ×2 e ×3');
console.assert(Math.abs(33.96 - 26.07 - 7.89) < 1e-9, 'ovos: diferença real de R$ 7,89');
console.assert([2, 2, 2, 2, 3, 3, 3, 4].reduce((a, b) => a + b) === 21 && 4 * 2 + 3 * 3 + 1 * 4 === 21, 'soma → multiplicação');
console.assert([2, 2, 2, 2, 3, 3, 3, 4].reduce((a, b) => a * b) === 1728 && 2 ** 4 * 3 ** 3 * 4 ** 1 === 1728 && 12 ** 3 === 1728, 'multiplicação → potência');
console.assert((16 * 50) / 100 === 8 && (50 * 16) / 100 === 8, '16% de 50 = 50% de 16');
console.assert(Math.floor(10 / 2 + 1e-9) === 5, 'doces: 10 ÷ 2');

css(`
#aritmetica .ar-fig { position: relative; }
#aritmetica .ar-c { position: absolute; z-index: 2; pointer-events: none; font: 600 11px/1.3 var(--f-mono); letter-spacing: .04em; color: var(--muted); max-width: 54%; }
#aritmetica .ar-c.tl { left: 12px; top: 10px; }
#aritmetica .ar-c.tl b { color: var(--hue); }
#aritmetica .ar-c.tr { right: 12px; top: 10px; text-align: right; }
#aritmetica .ar-c.bl { left: 12px; bottom: 10px; }
#aritmetica .ar-c.br { right: 12px; bottom: 10px; text-align: right; color: var(--ink); font-variant-numeric: tabular-nums; }
#aritmetica svg.ar-iso path, #aritmetica svg.ar-iso ellipse { stroke: color-mix(in srgb, var(--ink) 46%, transparent); stroke-width: .75; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
#aritmetica svg.ar-iso .ln { fill: none; }
#aritmetica svg.ar-iso .halo { fill: var(--ink); opacity: .15; stroke: none; }
#aritmetica svg .tag { font-family: var(--f-mono); font-weight: 600; fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: .4; stroke-linejoin: round; }
#aritmetica svg .tag.win { fill: var(--hue); }
#aritmetica .m-pulp { --m: color-mix(in srgb, var(--ink) 12%, var(--surface)); }
#aritmetica .m-wood { --m: color-mix(in srgb, hsl(30 var(--hue-s) var(--hue-l)) 42%, var(--surface)); }
#aritmetica .m-dough { --m: color-mix(in srgb, hsl(38 var(--hue-s) var(--hue-l)) 62%, var(--surface)); }
#aritmetica .m-cheese { --m: color-mix(in srgb, hsl(46 var(--hue-s) var(--hue-l)) 52%, white); }
#aritmetica .m-sponge { --m: color-mix(in srgb, hsl(32 var(--hue-s) var(--hue-l)) 58%, var(--surface)); }
#aritmetica .m-cream { --m: color-mix(in srgb, hsl(44 var(--hue-s) var(--hue-l)) 22%, white); }
#aritmetica .m-frost { --m: color-mix(in srgb, hsl(338 var(--hue-s) var(--hue-l)) 48%, white); }
#aritmetica .m-plate { --m: color-mix(in srgb, var(--ink) 7%, var(--surface)); }
#aritmetica .m-steel { --m: color-mix(in srgb, var(--ink) 24%, var(--surface)); }
#aritmetica .pep { fill: hsl(6 var(--hue-s) var(--hue-l)); }
#aritmetica .pep-in { fill: color-mix(in srgb, hsl(6 var(--hue-s) var(--hue-l)) 70%, black); stroke: none !important; }
#aritmetica .rose { fill: color-mix(in srgb, hsl(338 var(--hue-s) var(--hue-l)) 62%, white); }
#aritmetica .cup { fill: color-mix(in srgb, var(--m) 76%, black); }
#aritmetica .ar-egg { fill: url(#ar-egg-g); }
#aritmetica .ar-lit path:not([style*="stroke:"]) { stroke: var(--ink); stroke-width: 1.1; }

/* conjuntos */
#aritmetica .ar-set { font-size: 18px; min-width: 30px; text-align: center; }
#aritmetica .ar-ex { transition: opacity .3s; }
#aritmetica .ar-ex.dim { opacity: .28; }
#aritmetica .ar-axis { font: 500 12px/1 var(--f-body); color: var(--muted); }

/* doces, reta, porcentagem (flat SVG) */
#aritmetica svg.ar-flat text { font-family: var(--f-mono); fill: var(--muted); }
#aritmetica svg.ar-flat .ink { fill: var(--ink); }
#aritmetica svg.ar-flat .tick { stroke: var(--muted); stroke-width: 1.2; }
#aritmetica svg.ar-flat .tick.maj { stroke: var(--ink); stroke-width: 1.6; }
#aritmetica svg.ar-flat .axis { stroke: var(--ink); stroke-width: 2; }
#aritmetica .seg-r { fill: color-mix(in srgb, var(--hue) 22%, var(--surface)); stroke: var(--hue); stroke-width: 1.5; }
#aritmetica .troco { fill: color-mix(in srgb, var(--mark) 14%, var(--surface)); stroke: var(--mark); stroke-width: 1.5; stroke-dasharray: 5 4; }
#aritmetica .wallet { fill: none; stroke: var(--line); stroke-width: 1.5; }
#aritmetica .candy { transform-box: fill-box; transform-origin: center; }
#aritmetica .candy.new { animation: ar-pop .45s cubic-bezier(.2, 1.4, .4, 1) both; }
#aritmetica .candy .body { fill: var(--hue); stroke: color-mix(in srgb, var(--ink) 40%, transparent); stroke-width: 1; }
#aritmetica .candy .wrap { fill: color-mix(in srgb, var(--hue) 55%, white); stroke: color-mix(in srgb, var(--ink) 35%, transparent); stroke-width: 1; }
#aritmetica .candy .shine { fill: white; opacity: .6; }
@keyframes ar-pop { from { transform: scale(0); opacity: 0; } }
#aritmetica .arc1 { fill: none; stroke: var(--hue); stroke-width: 3.5; stroke-linecap: round; }
#aritmetica .arc2 { fill: none; stroke: var(--mark); stroke-width: 3.5; stroke-linecap: round; }
#aritmetica .head1 { fill: var(--hue); } #aritmetica .head2 { fill: var(--mark); }
#aritmetica .dot0 { fill: var(--ink); } #aritmetica .dot2 { fill: var(--mark); stroke: var(--surface); stroke-width: 2; }
#aritmetica .lab1 { fill: var(--hue) !important; font-weight: 600; } #aritmetica .lab2 { fill: var(--mark) !important; font-weight: 600; }
#aritmetica .t-hue { color: var(--hue); } #aritmetica .t-mark { color: var(--mark); }
#aritmetica .grid-l { stroke: var(--line); stroke-width: 1; }
#aritmetica .grid-b { stroke: color-mix(in srgb, var(--ink) 30%, transparent); stroke-width: 1.2; fill: none; }
#aritmetica .pct-r { fill: color-mix(in srgb, var(--hue) 26%, transparent); stroke: var(--hue); stroke-width: 2.5; }
#aritmetica .ar-mmc { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font: 600 13px/1 var(--f-mono); }
#aritmetica .ar-mmc span { color: var(--muted); min-width: 4.5em; }
#aritmetica .ar-mmc b { padding: 6px 8px; border: 1px solid var(--line); border-radius: 6px; font-variant-numeric: tabular-nums; transition: background .3s, color .3s; }
#aritmetica .ar-mmc b.hit { background: var(--hue); color: var(--on-hue); border-color: var(--hue); }
#aritmetica .ar-steplinks:empty { display: none; }
#aritmetica .formula .on { color: var(--hue); font-weight: 600; }
`);

/* ------------------------------------------------------------------ small shared helpers ------ */
function pickCard(node, title, body, links, extra = '') {
  node.innerHTML = `<h4>${title}</h4><p>${body}</p>${extra}${vlinks(links)}`;
}
/** anatomy card corners on a figure: Fig n, title, hint and a live readout (returned) */
function corners(host, n, title, hint) {
  host.insertAdjacentHTML('beforeend',
    `<span class="ar-c tl" aria-hidden="true">Fig. <b>2.${n}</b></span><span class="ar-c tr" aria-hidden="true">${title}</span>` +
    `<span class="ar-c bl" aria-hidden="true">${hint}</span><span class="ar-c br" aria-hidden="true"></span>`);
  return host.querySelector('.ar-c.br');
}

/* ------------------------------------------- isometric kit (true isometric, viewer toward +x +y +z) ------ */
const IC = Math.cos(Math.PI / 6);
const P = (x, y, z) => [(x - y) * IC, (x + y) / 2 - z];
const LV = [-0.35, 0.55, 1].map((v, _, a) => v / Math.hypot(...a)); // light from the upper left of the screen
const r2 = (v) => Math.round(v * 100) / 100;
/** four-ish tones from facing: lit faces mix toward white, faces away from the light toward black (both themes) */
function tone(n) {
  const d = n[0] * LV[0] + n[1] * LV[1] + n[2] * LV[2];
  return d > 0.2
    ? `color-mix(in srgb,var(--m) ${100 - Math.round((d - 0.2) * 46)}%,white)`
    : `color-mix(in srgb,var(--m) ${100 - Math.round((0.2 - d) * 30)}%,black)`;
}
function d3(pts, close = true) {
  let s = '';
  for (let i = 0; i < pts.length; i++) { const q = P(pts[i][0], pts[i][1], pts[i][2]); s += (i ? 'L' : 'M') + r2(q[0]) + ' ' + r2(q[1]); }
  return close ? s + 'Z' : s;
}
const seen = (n) => n[0] + n[1] + n[2] > 1e-6;
function face(pts, n, seam = false) {
  if (!seen(n)) return '';
  const f = tone(n);
  return `<path d="${d3(pts)}" style="fill:${f}${seam ? `;stroke:${f}` : ''}"/>`;
}
/** axis-aligned box: only the three faces the camera sees */
function box(x, y, z, w, d, h) {
  const X = x + w, Y = y + d, Z = z + h;
  return face([[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]], [0, 1, 0]) +
    face([[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]], [1, 0, 0]) +
    face([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]], [0, 0, 1]);
}
/** convex cylinder sector (a1 - a0 <= 180°, or a full cylinder), angles in degrees. Smooth side, inked silhouette. */
function sector(cx, cy, z, h, r, a0, a1) {
  const full = a1 - a0 >= 359.99;
  if (full) { a0 = -45; a1 = 315; } // start at the silhouette so the visible side is one run
  const n = Math.max(3, Math.ceil((a1 - a0) / 5));
  const lo = [], hi = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * D2R, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    lo.push([x, y, z]); hi.push([x, y, z + h]);
  }
  let s = '';
  if (!full) {
    const A0 = a0 * D2R, A1 = a1 * D2R, c0 = [cx, cy, z], c1 = [cx, cy, z + h];
    s += face([c0, lo[0], hi[0], c1], [Math.sin(A0), -Math.cos(A0), 0]);
    s += face([c0, lo[n], hi[n], c1], [-Math.sin(A1), Math.cos(A1), 0]);
  }
  let i0 = -1, i1 = -1;
  for (let i = 0; i < n; i++) {
    const a = (a0 + ((a1 - a0) * (i + 0.5)) / n) * D2R, nn = [Math.cos(a), Math.sin(a), 0];
    if (!seen(nn)) continue;
    if (i0 < 0) i0 = i;
    i1 = i;
    s += face([lo[i], lo[i + 1], hi[i + 1], hi[i]], nn, true);
  }
  if (i0 >= 0) s += `<path class="ln" d="${d3([hi[i0], ...lo.slice(i0, i1 + 2), hi[i1 + 1]], false)}"/>`;
  return s + face(full ? hi.slice(0, n) : [[cx, cy, z + h], ...hi], [0, 0, 1]);
}
/** circle lying on a horizontal plane (pepperoni, rosettes, cups) */
const flatDisc = (x, y, z, r, cls) => { const q = P(x, y, z); return `<ellipse class="${cls}" cx="${r2(q[0])}" cy="${r2(q[1])}" rx="${r2(1.2247 * r)}" ry="${r2(0.7071 * r)}"/>`; };
/** viewBox around world points, padded and grown to the card's aspect ratio */
function fitView(pts, aspect, pad = 2, top = 3, bottom = 3) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { const q = P(p[0], p[1], p[2]); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
  x0 -= pad; x1 += pad; y0 -= pad + top; y1 += pad + bottom;
  let w = x1 - x0, h = y1 - y0;
  if (w / h > aspect) { const nh = w / aspect; y0 -= (nh - h) / 2; h = nh; } else { const nw = h * aspect; x0 -= (nw - w) / 2; w = nw; }
  return `${r2(x0)} ${r2(y0)} ${r2(w)} ${r2(h)}`;
}
const halo = (pts, filter) => `<path class="halo" d="${d3(pts)}" filter="url(#${filter})"/>`;

/* ========================================================== 1 · Conjuntos numéricos ======== */
const SETS = [
  { sym: 'ℕ', name: 'Naturais', h: 205, r: 1.0, ex: [['1, 2, 3', 4, 64]],
    body: 'Os números de contar: 1, 2, 3, … O vídeo os chama de positivos. Muitos livros brasileiros também colocam o 0 aqui.',
    links: [[103, 'De dentro pra fora: os naturais'], [107, 'Naturais: os positivos']] },
  { sym: 'ℤ', name: 'Inteiros', h: 172, r: 1.65, ex: [['−2', 84, -8], ['0', 48, -40], ['−7', 4, 4]],
    body: 'Os naturais mais o zero e os negativos: …, −2, −1, 0, 1, 2, … Todo natural também é inteiro.',
    links: [[107, 'Inteiros incluem os negativos']] },
  { sym: 'ℚ', name: 'Racionais', h: 140, r: 2.3, ex: [['½', 4, 64], ['0,5', 84, 64], ['−¾', 84, -36]],
    body: 'Tudo o que pode ser escrito como fração <i>a</i>/<i>b</i>, com <i>b</i> ≠ 0. Decimais que vêm de fração também entram: 0,5 = ½ e 0,333… = ⅓.',
    links: [[112, 'Racionais: números que viram fração'], [117, '0,5 é igual a ½']] },
  { sym: 'ℝ', name: 'Reais', h: 36, r: 2.95, ex: [['π', 4, 36], ['e', 4, 12], ['φ', 44, -40], ['√2', 80, 28]],
    body: 'Os racionais mais os irracionais: dízimas infinitas sem padrão de repetição, como π, o número de Euler <i>e</i>, o número de ouro φ e √2. São números à deriva, sem rumo.',
    extra: '<div class="formula">π = 3,14159 26535 89793…<br><i>e</i> = 2,71828…&nbsp; φ = 1,61803…&nbsp; √2 = 1,41421…</div>',
    links: [[125, 'Irracionais: dízimas sem padrão'], [131, 'π, o inimigo do fim'], [140, 'Números à deriva: e, φ e √2'], [144, 'Tudo isso forma os reais']] },
  { sym: 'ℂ', name: 'Complexos', h: 285, r: 3.6, ex: [['i', 76, -40], ['2 + 3i', 4, 64]],
    body: 'A camada de fora. Junta os reais e os números com parte imaginária, da forma <i>a</i> + <i>bi</i>, com <i>i</i>² = −1. Eles aparecem quando surge a raiz de um número negativo.',
    links: [[150, 'Complexos vêm de uma raiz negativa']] },
];

const t1 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage tall" id="ar-conj"></div>
    <p class="stage-cap">Uma cebola de números cortada em cunha: cada casca guarda todas as de dentro. Clique numa camada, no seu símbolo ou nos botões.</p>
    <div class="controls" id="ar-conj-ctl"></div>
  </div>
  <div class="explain">
    <p class="kicker">Conjuntos numéricos</p>
    <h3>Dos naturais aos complexos, de dentro para fora</h3>
    <p>Aritmética nada mais é do que trabalhar com números. O vídeo arruma esses números em camadas: cada camada nova guarda todas as anteriores e acrescenta um tipo novo de número.</p>
    <div class="formula">ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ ⊂ ℂ</div>
    <div class="pick" id="ar-conj-pick" aria-live="polite"></div>
    ${vlinks([[103, 'Aritmética: trabalhar com números'], [112, 'Os racionais entram no bolo'], [125, 'Depois vêm os irracionais'], [144, 'Tudo isso faz parte dos reais']])}
  </div>
</article>`);
root.append(t1);

const conjPick = t1.querySelector('#ar-conj-pick');
const conjSeg = segmented({ label: 'Camada', options: SETS.map((S, i) => ({ value: i, label: `${S.sym} ${S.name}` })), value: -1 });
t1.querySelector('#ar-conj-ctl').append(conjSeg.el);
pickCard(conjPick, 'Cinco camadas, uma dentro da outra',
  'Comece pelo miolo: os naturais. Cada casca para fora acrescenta números novos e continua guardando os de dentro. Escolha uma camada para ver o que ela traz.',
  [[107, 'Naturais e inteiros'], [150, 'Até os complexos']]);

let conjSel = 4;
const conjDims = [];
function selectSet(i) {
  conjSel = i;
  conjSeg.set(i, false);
  const S = SETS[i];
  pickCard(conjPick, `<span class="math">${S.sym}</span> · ${S.name}`, S.body, S.links, S.extra || '');
  conjDims.forEach(([node, k]) => node.classList.toggle('dim', k > i));
}
conjSeg.on((v) => selectSet(+v));

const s1 = stage(t1.querySelector('#ar-conj'), {
  camera: [7.4, 4.9, 8.6], target: [0, 0.1, 0], fov: 38,
  label: 'Cinco cascas esféricas aninhadas: ℕ dentro de ℤ, dentro de ℚ, dentro de ℝ, dentro de ℂ, com uma cunha recortada para mostrar o interior e números de exemplo em cada camada.',
  hint: 'arraste para girar · clique numa camada',
});
if (s1) {
  const ink = () => color('--ink');
  const rimMat = new THREE.LineBasicMaterial({ color: new THREE.Color(ink()), transparent: true, opacity: 0.4 });
  const arc = (r, plane) => {
    const pts = [];
    for (let k = 0; k <= 48; k++) { const t = (-90 + (180 * k) / 48) * D2R; pts.push(plane ? new THREE.Vector3(0, r * Math.sin(t), r * Math.cos(t)) : new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), 0)); }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), rimMat);
  };
  const shells = SETS.map((S, i) => {
    const c = new THREE.Color(hueColor(S.h));
    // three.js sphere: phi from π to 2.5π leaves out the quadrant x > 0, z > 0, which faces the camera
    const geo = new THREE.SphereGeometry(S.r, 72, 36, Math.PI, Math.PI * 1.5);
    const mk = (side, order, op) => {
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: op, side, depthWrite: false, roughness: 0.4 }));
      m.renderOrder = order; m.userData.i = i; s1.add(m); return m;
    };
    const back = mk(THREE.BackSide, 4 - i, 0.2); // outer backs first, inner fronts before outer fronts
    const front = mk(THREE.FrontSide, 6 + i, 0.3);
    const rin = i ? SETS[i - 1].r : 0;
    const rg = new THREE.RingGeometry(rin, S.r, 72, 1, -Math.PI / 2, Math.PI);
    const rm = new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, transparent: true, opacity: 0.92, roughness: 0.75 });
    const ca = new THREE.Mesh(rg, rm), cb = new THREE.Mesh(rg, rm);
    cb.rotation.y = -Math.PI / 2; // second cut face: the plane x = 0
    ca.renderOrder = cb.renderOrder = 5;
    ca.userData.i = cb.userData.i = i;
    s1.add(ca, cb, arc(S.r, 0), arc(S.r, 1));
    // set symbol on the z = 0 cut face, below the equator; examples float in the open wedge of their band
    const mid = (rin + S.r) / 2, a = -34 * D2R;
    const sym = s1.label(S.sym, [mid * Math.cos(a), mid * Math.sin(a), 0.03], { cls: 'math ar-set', onClick: () => selectSet(i) });
    sym.element.setAttribute('aria-label', `Camada dos ${S.name.toLowerCase()}`);
    for (const [txt, al, be] of S.ex) {
      const rho = rin + (S.r - rin) * 0.55;
      const lb = s1.label(txt, [rho * Math.cos(be * D2R) * Math.cos(al * D2R), rho * Math.sin(be * D2R), rho * Math.cos(be * D2R) * Math.sin(al * D2R)], { cls: 'math ar-ex' });
      conjDims.push([lb.element, i]);
    }
    return { i, h: S.h, back, front, rm };
  });
  s1.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -3.6, 0), new THREE.Vector3(0, 3.6, 0)]), rimMat));

  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), cv = s1.renderer.domElement;
  const targets = shells.flatMap((o) => [o.front, ...s1.scene.children.filter((m) => m.isMesh && m.userData.i === o.i && m.geometry.type === 'RingGeometry')]);
  let down = null;
  cv.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  cv.addEventListener('pointerup', (e) => {
    const ok = down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6;
    down = null;
    if (!ok) return;
    const r = cv.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, s1.camera);
    const hit = ray.intersectObjects(targets, false)[0];
    if (hit) selectSet(hit.object.userData.i);
  });

  s1.onFrame((t, dt) => {
    const k = reduced ? 1 : 1 - Math.exp(-dt * 7);
    for (const o of shells) {
      const inside = o.i <= conjSel;
      const tf = o.i === conjSel ? 0.42 : inside ? 0.2 : 0.06;
      const tc = inside ? 0.94 : 0.2;
      o.front.material.opacity += (tf - o.front.material.opacity) * k;
      o.back.material.opacity += (tf * 0.6 - o.back.material.opacity) * k;
      o.rm.opacity += (tc - o.rm.opacity) * k;
    }
  });
  onTheme(() => {
    for (const o of shells) { const c = hueColor(o.h); o.front.material.color.set(c); o.back.material.color.set(c); o.rm.color.set(c); }
    rimMat.color.set(ink());
  });
}

/* ========================================================== 2 · Complexos ======== */
const t2 = el(`
<article class="topic flip">
  <div class="stage-col">
    <div class="stage tall" id="ar-cx"></div>
    <p class="stage-cap">O piso é o plano complexo: o eixo real (x) e, perpendicular a ele, o eixo imaginário (i). Mexa em c e veja as raízes saírem do eixo real.</p>
    <div class="controls" id="ar-cx-ctl"></div>
  </div>
  <div class="explain">
    <p class="kicker">Números complexos</p>
    <h3>Quando a parábola não toca o eixo x</h3>
    <p>A equação <span class="math"><i>x</i>² + <i>c</i> = 0</span> tem solução real onde a parábola <span class="math"><i>y</i> = <i>x</i>² + <i>c</i></span> toca o eixo x. Se toca, tem solução e dá para resolver. Se não toca, aparece a raiz de um número negativo, e os reais não bastam.</p>
    <p>Para lidar com isso, os matemáticos inventaram os números imaginários, com <span class="math"><i>i</i>² = −1</span>. A equação ganha solução não real: <span class="math"><i>x</i> = ±<i>i</i>√<i>c</i></span>.</p>
    <div class="formula" id="ar-cx-f" aria-live="polite"></div>
    <div class="stats" id="ar-cx-stats"></div>
    <div class="pick" id="ar-cx-pick" aria-live="polite"></div>
    <div class="note fact">A parábola fantasma, perpendicular, é <span class="math"><i>y</i> = <i>c</i> − <i>t</i>²</span>: os valores de <span class="math"><i>x</i>² + <i>c</i></span> quando <span class="math"><i>x</i> = <i>t</i>·<i>i</i></span> anda pelo eixo imaginário. Ela cruza o piso exatamente nas raízes ±<i>i</i>√<i>c</i>.</div>
    ${vlinks([[150, 'Complexos vêm de uma raiz negativa'], [155, 'A parábola que erra o eixo x'], [161, 'Se toca, tem solução'], [173, 'Inventaram os números imaginários']])}
  </div>
</article>`);
root.append(t2);

const cxCtl = t2.querySelector('#ar-cx-ctl');
const cxSlider = slider({ id: 'ar-cx-c', label: 'Altura <i>c</i>', min: -1.2, max: 1.2, step: 0.05, value: 1, format: (v) => br(v, 2) });
cxCtl.append(cxSlider.el);
cxCtl.append(el(`<div class="btn-row">
  <button type="button" class="btn sm" data-c="-1"><i>c</i> = −1 · toca</button>
  <button type="button" class="btn sm" data-c="0"><i>c</i> = 0 · encosta</button>
  <button type="button" class="btn sm" data-c="1"><i>c</i> = 1 · não toca</button>
  <button type="button" class="btn sm" id="ar-cx-ghost" aria-pressed="true">Parábola fantasma</button>
</div>`));
const cxPick = t2.querySelector('#ar-cx-pick');
const cxF = t2.querySelector('#ar-cx-f');
const cxStats = t2.querySelector('#ar-cx-stats');
let cxC = 1;
function cxText(c) {
  const r = br(Math.sqrt(Math.abs(c)), 2);
  const eq = c === 0 ? '<i>x</i>² = 0' : `<i>x</i>² ${c > 0 ? '+' : '−'} ${br(Math.abs(c), 2)} = 0`;
  const sol = c < 0 ? `<i>x</i> = ±√${br(-c, 2)} = ±${r}` : c === 0 ? '<i>x</i> = 0 (raiz dupla)' : `<i>x</i> = ±√(−${br(c, 2)}) = ±${r}<i>i</i>`;
  cxF.innerHTML = `${eq} &nbsp;⇒&nbsp; ${sol}`;
  const touch = c < 0 ? 'sim, em 2 pontos' : c === 0 ? 'sim, em 1 ponto' : 'não';
  const kind = c < 0 ? 'reais' : c === 0 ? 'real (dupla)' : 'não reais';
  cxStats.innerHTML = `<div class="stat"><b>${touch}</b><span>toca o eixo x?</span></div><div class="stat"><b>${kind}</b><span>soluções</span></div><div class="stat"><b>${br(-4 * c, 2)}</b><span>Δ = −4<i>c</i></span></div>`;
}
const cxPicks = {
  curve: () => ['A parábola <span class="math"><i>y</i> = <i>x</i>² + <i>c</i></span>', 'Mexer em <i>c</i> sobe ou desce a parábola inteira. As soluções de <i>x</i>² + <i>c</i> = 0 são os pontos onde ela toca o eixo x.', [[155, 'Não toca o eixo x nem a pau'], [161, 'Se toca, tem solução']]],
  roots: () => (cxC <= 0
    ? ['Soluções reais', `Com <i>c</i> ≤ 0 a parábola toca o eixo x, e <i>x</i> = ±√(−<i>c</i>) é um número real. Se toca, tem solução; se tem solução, dá para resolver.`, [[161, 'Se toca, tem solução'], [168, 'Se não toca, não tem solução real']]]
    : ['Soluções imaginárias', `Sem toque no eixo x não existe solução real. Com <i>i</i>² = −1, <i>x</i> = ±<i>i</i>√<i>c</i> resolve: (<i>i</i>√<i>c</i>)² + <i>c</i> = −<i>c</i> + <i>c</i> = 0. As raízes moram no eixo imaginário.`, [[173, 'Os números imaginários'], [178, 'Solução não real, fruto da imaginação']]]),
  imag: () => ['O eixo imaginário', 'Fica perpendicular ao eixo real. Cada ponto dele é um múltiplo de <i>i</i>, a raiz de −1. Os dois eixos juntos formam o plano complexo, onde moram os números <i>a</i> + <i>bi</i>.', [[150, 'Complexos: fora dos reais'], [173, 'Os números imaginários']]],
  ghost: () => ['A parábola fantasma', 'Troque <i>x</i> por <i>t</i>·<i>i</i>: (<i>ti</i>)² + <i>c</i> = <i>c</i> − <i>t</i>². É a mesma conta vista ao longo do eixo imaginário. Essa curva desce e cruza o piso nas raízes imaginárias.', [[173, 'Solução não real'], [155, 'A parábola original']]],
};
const cxShow = (k) => pickCard(cxPick, ...cxPicks[k]());
cxShow('curve');
cxText(cxC);
cxSlider.on((v) => { cxC = Math.round(v * 100) / 100; cxText(cxC); });
cxCtl.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => {
  tween(cxSlider.value, +b.dataset.c, 700, (v) => { cxSlider.value = v; });
}));

const s2 = stage(t2.querySelector('#ar-cx'), {
  camera: [6.2, 3.8, 7.6], target: [0, 0.35, 0], fov: 44,
  label: 'Parábola y = x² + c sobre o plano complexo. Quando ela deixa de tocar o eixo real, as duas raízes passam para o eixo imaginário, perpendicular.',
  hint: 'arraste para girar',
});
if (s2) {
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 4.8), new THREE.MeshBasicMaterial({ color: new THREE.Color(hueColor(285)), transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
  plane.rotation.x = -Math.PI / 2;
  const grid = new THREE.GridHelper(4.8, 12, 0xffffff, 0xffffff); // white vertex colours, tinted by the material so a theme switch is one set()
  grid.material.color.set(color('--line')); grid.material.transparent = true; grid.material.opacity = 0.8;
  s2.add(plane, grid);
  const cone = (pos, rot, c) => { const m = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 18), new THREE.MeshStandardMaterial({ color: new THREE.Color(c) })); m.position.set(...pos); m.rotation.set(...rot); s2.add(m); return m; };
  const realAx = tube([[-2.5, 0, 0], [2.5, 0, 0]], color('--ink'), 0.02);
  const imagAx = tube([[0, 0, -2.5], [0, 0, 2.5]], hueColor(285), 0.024);
  const yAx = tube([[0, -2.9, 0], [0, 4.0, 0]], color('--muted'), 0.013);
  s2.add(realAx, imagAx, yAx);
  const cones = [cone([2.6, 0, 0], [0, 0, -Math.PI / 2], color('--ink')), cone([0, 0, 2.6], [Math.PI / 2, 0, 0], hueColor(285)), cone([0, 4.1, 0], [0, 0, 0], color('--muted'))];
  s2.label('eixo real <i>x</i>', [2.95, 0, 0], { cls: 'plain ar-axis' });
  s2.label('<i>y</i>', [0.18, 4.15, 0], { cls: 'plain ar-axis' });
  const il = s2.label('eixo imaginário <i>i</i>', [0, 0, 3.0], { cls: '', onClick: () => cxShow('imag') });
  il.element.setAttribute('aria-label', 'Explicar o eixo imaginário');

  const X = 1.8, pa = [], pg = [];
  for (let k = 0; k <= 48; k++) { const x = -X + (2 * X * k) / 48; pa.push([x, x * x, 0]); }
  for (let k = 0; k <= 40; k++) { const t = -1.55 + (3.1 * k) / 40; pg.push([0, -t * t, t]); }
  const para = tube(pa, hueColor(210), 0.042);
  const ghost = tube(pg, hueColor(285), 0.03);
  ghost.material.transparent = true; ghost.material.opacity = 0.62;
  s2.add(para, ghost);
  const cl = s2.label('<i>y</i> = <i>x</i>² + <i>c</i>', [X, X * X + 0.25, 0], { cls: 'math', parent: para, onClick: () => cxShow('curve') });
  cl.element.setAttribute('aria-label', 'Explicar a parábola');
  const gl = s2.label('fantasma', [0, -2.4 - 0.25, 1.55], { cls: '', parent: ghost, onClick: () => cxShow('ghost') });
  gl.element.setAttribute('aria-label', 'Explicar a parábola fantasma');

  const rootMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(hueColor(38)), emissive: new THREE.Color(hueColor(38)), emissiveIntensity: 0.25, roughness: 0.3 });
  const rootGeo = new THREE.SphereGeometry(0.095, 28, 18);
  const roots = [0, 1].map(() => { const m = new THREE.Mesh(rootGeo, rootMat); s2.add(m); return m; });
  const rl = roots.map((m) => { const l = s2.label('', [0, 0.32, 0], { cls: 'math', parent: m, onClick: () => cxShow('roots') }); l.element.setAttribute('aria-label', 'Explicar as raízes'); return l; });
  const ghostBtn = cxCtl.querySelector('#ar-cx-ghost');
  ghostBtn.addEventListener('click', () => {
    const on = ghostBtn.getAttribute('aria-pressed') !== 'true';
    ghostBtn.setAttribute('aria-pressed', String(on));
    ghost.visible = gl.visible = on; // a CSS2D label does not follow its parent's visibility
  });

  let cs = null, lastTxt = '';
  const apply = (c) => {
    para.position.y = c; ghost.position.y = c;
    const r = Math.sqrt(Math.abs(c));
    if (c <= 0) { roots[0].position.set(-r, 0, 0); roots[1].position.set(r, 0, 0); } else { roots[0].position.set(0, 0, -r); roots[1].position.set(0, 0, r); }
    const v = br(r, 2), txt = c <= 0 ? `−${v}|${v}` : `−${v}i|${v}i`;
    if (txt !== lastTxt) {
      lastTxt = txt;
      const [a, b] = txt.split('|');
      rl[0].element.innerHTML = Math.abs(c) < 0.005 ? '<i>x</i> = 0' : `<i>x</i> = ${a.replace('i', '<i>i</i>')}`;
      rl[1].element.innerHTML = `<i>x</i> = ${b.replace('i', '<i>i</i>')}`;
      rl[1].visible = Math.abs(c) >= 0.005; // a double root wears one label
      const real = c <= 0;
      rootMat.color.set(hueColor(real ? 38 : 285)); rootMat.emissive.set(hueColor(real ? 38 : 285));
    }
  };
  s2.onFrame((t, dt) => {
    if (cs === null || reduced) { if (cs !== cxC) { cs = cxC; apply(cs); } return; }
    if (Math.abs(cxC - cs) < 1e-4) return;
    cs += (cxC - cs) * (1 - Math.exp(-dt * 9));
    if (Math.abs(cxC - cs) < 1e-4) cs = cxC;
    apply(cs);
  });
  apply(cxC); cs = cxC;
  onTheme(() => {
    plane.material.color.set(hueColor(285));
    grid.material.color.set(color('--line'));
    realAx.material.color.set(color('--ink')); imagAx.material.color.set(hueColor(285)); yAx.material.color.set(color('--muted'));
    cones[0].material.color.set(color('--ink')); cones[1].material.color.set(hueColor(285)); cones[2].material.color.set(color('--muted'));
    para.material.color.set(hueColor(210)); ghost.material.color.set(hueColor(285));
    lastTxt = ''; apply(cs);
  });
}

/* ========================================================== 3 · Doces ======== */
const t3 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage short ar-fig" id="ar-doces"></div>
    <p class="stage-cap">A barra é o seu dinheiro sobre uma régua de reais. Cada pedaço do tamanho do preço vira um doce. O que sobra é troco.</p>
    <div class="controls" id="ar-doces-ctl"></div>
  </div>
  <div class="explain">
    <p class="kicker">Aritmética no dia a dia</p>
    <h3>Quantos doces cabem em 10 reais?</h3>
    <p>Na loja, cada doce custa R$ 2 e você tem R$ 10. Cinco, acertou. Você acabou de dividir todo o seu dinheiro pelo valor de cada doce.</p>
    <div class="formula" id="ar-doces-f" aria-live="polite"></div>
    ${vlinks([[186, 'Aritmética no cotidiano: a loja de doces'], [190, '10 reais, doces de 2 reais'], [198, 'Você dividiu todo o dinheiro por 2']])}
  </div>
</article>`);
root.append(t3);
{
  const host = t3.querySelector('#ar-doces');
  const X0 = 20, K = 30, BY = 196, BH = 40;
  let ruler = '';
  for (let v = 0; v <= 20; v++) {
    const x = X0 + K * v, maj = v % 5 === 0;
    ruler += `<line class="tick${maj ? ' maj' : ''}" x1="${x}" y1="${BY + BH + 4}" x2="${x}" y2="${BY + BH + (maj ? 16 : 10)}"/>`;
    if (maj) ruler += `<text x="${x}" y="${BY + BH + 36}" text-anchor="middle" font-size="15">R$ ${v}</text>`;
  }
  host.innerHTML = `<svg class="ar-flat" viewBox="0 0 640 360" role="img" aria-label="Barra de dinheiro dividida em pedaços do tamanho do preço; cada pedaço vira um doce.">
    <line class="axis" x1="${X0}" y1="${BY + BH + 4}" x2="${X0 + 20 * K}" y2="${BY + BH + 4}"/>${ruler}
    <g id="ar-doces-bar"></g><g id="ar-doces-candy"></g></svg>`;
  const live = corners(host, 3, 'Dinheiro ÷ preço', 'mexa nos controles');
  const bar = host.querySelector('#ar-doces-bar'), candyG = host.querySelector('#ar-doces-candy');
  const f = t3.querySelector('#ar-doces-f');
  const ctl = t3.querySelector('#ar-doces-ctl');
  const sm = slider({ id: 'ar-doces-m', label: 'Dinheiro', min: 1, max: 20, step: 1, value: 10, format: (v) => money(v) });
  const sp = slider({ id: 'ar-doces-p', label: 'Preço do doce', min: 0.5, max: 5, step: 0.5, value: 2, format: (v) => money(v) });
  ctl.append(sm.el, sp.el);
  let shown = 0;
  const draw = () => {
    const m = sm.value, p = sp.value, n = Math.floor(m / p + 1e-9), troco = m - n * p, w = p * K;
    let b = `<rect class="wallet" x="${X0}" y="${BY}" width="${m * K}" height="${BH}" rx="6"/>`;
    for (let i = 0; i < n; i++) {
      b += `<rect class="seg-r" x="${X0 + i * w + 1.5}" y="${BY + 1.5}" width="${w - 3}" height="${BH - 3}" rx="5"/>`;
      if (w >= 46) b += `<text class="ink" x="${X0 + i * w + w / 2}" y="${BY + BH / 2 + 5}" text-anchor="middle" font-size="14">R$ ${br(p, p % 1 ? 2 : 0)}</text>`;
    }
    if (troco > 1e-9) {
      b += `<rect class="troco" x="${X0 + n * w + 1.5}" y="${BY + 1.5}" width="${troco * K - 3}" height="${BH - 3}" rx="5"/>`;
      if (troco * K >= 52) b += `<text x="${X0 + n * w + (troco * K) / 2}" y="${BY + BH / 2 + 5}" text-anchor="middle" font-size="13">troco</text>`;
    }
    bar.innerHTML = b;
    const sz = clamp(w * 0.17, 3.4, 11);
    let c = '';
    for (let i = 0; i < n; i++) {
      const cx = X0 + i * w + w / 2, cy = 116 - (i % 2) * (w < 30 ? 22 : 0);
      c += `<g transform="translate(${r2(cx)} ${cy})"><g class="candy${i >= shown ? ' new' : ''}" style="--h:${(i * 53 + 330) % 360};animation-delay:${Math.max(0, i - shown) * 40}ms">` +
        `<path class="wrap" d="M${-1.95 * sz} ${-0.75 * sz}L${-0.95 * sz} 0L${-1.95 * sz} ${0.75 * sz}Z M${1.95 * sz} ${-0.75 * sz}L${0.95 * sz} 0L${1.95 * sz} ${0.75 * sz}Z"/>` +
        `<ellipse class="body" rx="${1.12 * sz}" ry="${0.82 * sz}"/><ellipse class="shine" cx="${-0.38 * sz}" cy="${-0.32 * sz}" rx="${0.36 * sz}" ry="${0.18 * sz}"/></g></g>`;
    }
    candyG.innerHTML = c;
    shown = n;
    f.innerHTML = `${money(m)} ÷ ${money(p)} = <b>${n} doce${n === 1 ? '' : 's'}</b>${troco > 1e-9 ? ` <small>e sobram ${money(troco)} de troco</small>` : ''}`;
    live.textContent = `${n} doce${n === 1 ? '' : 's'} · troco ${money(troco)}`;
  };
  sm.on(draw); sp.on(draw);
  draw();
}

/* ========================================================== 4 · Ovos e MMC (anatomy figure) ======== */
const t4 = el(`
<article class="topic flip">
  <div class="stage-col">
    <div class="stage ar-fig" id="ar-ovos"></div>
    <p class="stage-cap">Bandejas de 30 e de 20 ovos. O MMC leva as duas à mesma quantidade, 60 ovos, para comparar o preço de forma justa.</p>
    <div class="controls" id="ar-ovos-ctl"></div>
  </div>
  <div class="explain">
    <p class="kicker">Aritmética contra a enrolação</p>
    <h3>30 ovos ou 20 ovos?</h3>
    <p>Se liga nos preços: 30 ovos por R$ 16,98 e 20 ovos por R$ 8,69. Qual você levaria? Para comparar, use o tal do MMC, o mínimo múltiplo comum.</p>
    <p>60 é o menor múltiplo comum de 30 e 20. Multiplique a primeira bandeja por 2 e a segunda por 3: os mesmos 60 ovos custam R$ 33,96 contra R$ 26,07. Leve a bandeja de 20.</p>
    <div class="stats" id="ar-ovos-stats"></div>
    <p class="note"><span>O vídeo fala em quase 10 reais de diferença. A conta exata dá <b>R$ 33,96 − R$ 26,07 = R$ 7,89</b>. A escolha continua a mesma.</span></p>
    <p class="note fact"><span>Outra saída é o preço por ovo: R$ 16,98 ÷ 30 ≈ R$ 0,57 e R$ 8,69 ÷ 20 ≈ R$ 0,43.</span></p>
    ${vlinks([[209, 'Se liga nos preços dos ovos'], [218, 'O tal do MMC'], [225, '60 é o menor múltiplo comum'], [232, '×2 aqui, ×3 ali: os mesmos 60 ovos']])}
  </div>
</article>`);
root.append(t4);
{
  const host = t4.querySelector('#ar-ovos');
  const ctl = t4.querySelector('#ar-ovos-ctl');
  const stats = t4.querySelector('#ar-ovos-stats');
  const S = 2, ER = 0.82, EH = 2.25, TH = 0.7, STACK = TH + EH - 0.6;
  const PILES = [
    { cols: 6, rows: 5, x: -15, y: -1, n: 30, price: 16.98, mult: 2 },
    { cols: 5, rows: 4, x: 2.5, y: -10, n: 20, price: 8.69, mult: 3 },
  ];
  for (const p of PILES) { p.W = p.cols * S + 0.8; p.D = p.rows * S + 0.8; p.top = (p.mult - 1) * STACK + TH + EH; }
  const egg = (x, y, z) => {
    const q = P(x, y, z + EH * 0.45), rx = 1.2247 * ER, ry = Math.sqrt(0.5 * ER * ER + (EH / 2) ** 2);
    return `<path class="ar-egg" d="M${r2(q[0] - rx)} ${r2(q[1])}A${r2(rx)} ${r2(ry * 1.08)} 0 0 1 ${r2(q[0] + rx)} ${r2(q[1])}A${r2(rx)} ${r2(ry * 0.92)} 0 0 1 ${r2(q[0] - rx)} ${r2(q[1])}Z"/>`;
  };
  const tray = (p, z, op) => {
    let s = `<g class="m-pulp"${op < 1 ? ` opacity="${r2(op)}"` : ''}>` + box(p.x, p.y, z, p.W, p.D, TH);
    // a rim groove and two corner rivets: the flat is pressed pulp with a lip
    s += `<path class="ln" d="${d3([[p.x + 0.25, p.y + 0.25, z + TH], [p.x + p.W - 0.25, p.y + 0.25, z + TH], [p.x + p.W - 0.25, p.y + p.D - 0.25, z + TH], [p.x + 0.25, p.y + p.D - 0.25, z + TH]])}" style="opacity:.5"/>`;
    const cells = [];
    for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) cells.push([p.x + 0.4 + S * (c + 0.5), p.y + 0.4 + S * (r + 0.5)]);
    cells.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
    for (const [x, y] of cells) s += flatDisc(x, y, z + TH, 0.92, 'cup'); // all cups first: a dimple never covers an egg
    for (const [x, y] of cells) s += egg(x, y, z + TH);
    return s + '</g>';
  };
  const pts = [];
  for (const p of PILES) for (const z of [0, p.top + 3.4]) pts.push([p.x, p.y, z], [p.x + p.W, p.y, z], [p.x, p.y + p.D, z], [p.x + p.W, p.y + p.D, z]);
  const vb = fitView(pts, 4 / 3, 3.6, 1.5, 2.5);
  host.innerHTML = `<svg class="ar-iso" viewBox="${vb}" role="img" aria-label="Duas pilhas de bandejas de ovos em perspectiva isométrica.">
    <defs><filter id="ar-blur-ovos" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.7"/></filter>
    <radialGradient id="ar-egg-g" cx=".36" cy=".3" r=".78">
      <stop offset="0" style="stop-color:color-mix(in srgb,hsl(28 var(--hue-s) var(--hue-l)) 22%,white)"/>
      <stop offset=".55" style="stop-color:color-mix(in srgb,hsl(28 var(--hue-s) var(--hue-l)) 62%,white)"/>
      <stop offset="1" style="stop-color:color-mix(in srgb,hsl(28 var(--hue-s) var(--hue-l)) 88%,black)"/>
    </radialGradient></defs><g id="ar-ovos-g"></g></svg>`;
  const live = corners(host, 4, 'Bandejas e MMC', 'siga os três passos');
  const g = host.querySelector('#ar-ovos-g');
  const seg = segmented({ label: 'Passo', options: [{ value: 1, label: '1 · Preços' }, { value: 2, label: '2 · MMC' }, { value: 3, label: '3 · 60 ovos' }], value: 1 });
  const mmc = el(`<div style="display:grid;gap:8px">
    <div class="ar-mmc" aria-label="Múltiplos de 30"><span>× de 30</span><b>30</b><b data-hit>60</b><b>90</b><b>120</b></div>
    <div class="ar-mmc" aria-label="Múltiplos de 20"><span>× de 20</span><b>20</b><b>40</b><b data-hit>60</b><b>80</b></div></div>`);
  ctl.append(seg.el, mmc);
  let step = 1, k = 1;
  const draw = () => {
    let s = '';
    PILES.forEach((p, pi) => {
      const pl = [[p.x - 0.8, p.y - 0.8, 0], [p.x + p.W + 0.8, p.y - 0.8, 0], [p.x + p.W + 0.8, p.y + p.D + 0.8, 0], [p.x - 0.8, p.y + p.D + 0.8, 0]];
      s += halo(pl, 'ar-blur-ovos');
      s += tray(p, 0, 1);
      for (let j = 1; j < p.mult; j++) {
        if (step === 2) s += tray(p, j * STACK, 0.2);
        if (step === 3) { const kj = ease(clamp(k * (p.mult === 3 ? 1.5 : 1.25) - (j - 1) * 0.5, 0, 1)); if (kj > 0) s += tray(p, j * STACK + (1 - kj) * 7, kj); }
      }
      const q = P(p.x + p.W / 2, p.y + p.D / 2, p.top + 2.6);
      const txt = step === 1 ? `${p.n} ovos · ${money(p.price)}` : step === 2 ? `${p.n} × ${p.mult} = 60 ovos` : `60 ovos · ${money(p.price * p.mult)}`;
      s += `<text class="tag${step === 3 && pi === 1 ? ' win' : ''}" x="${r2(q[0])}" y="${r2(q[1])}" text-anchor="middle" font-size="1.45">${txt}</text>`;
    });
    g.innerHTML = s;
  };
  const sync = () => {
    mmc.querySelectorAll('[data-hit]').forEach((b) => b.classList.toggle('hit', step >= 2));
    const a = step === 3 ? 33.96 : 16.98, b = step === 3 ? 26.07 : 8.69;
    stats.innerHTML = step === 1
      ? `<div class="stat"><b>${money(16.98)}</b><span>30 ovos</span></div><div class="stat"><b>${money(8.69)}</b><span>20 ovos</span></div><div class="stat"><b>?</b><span>quantidades diferentes</span></div>`
      : step === 2
        ? `<div class="stat"><b>60</b><span>MMC(30, 20)</span></div><div class="stat"><b>× 2</b><span>bandeja de 30</span></div><div class="stat"><b>× 3</b><span>bandeja de 20</span></div>`
        : `<div class="stat"><b>${money(a)}</b><span>60 ovos (2 × 30)</span></div><div class="stat"><b>${money(b)}</b><span>60 ovos (3 × 20)</span></div><div class="stat"><b>${money(a - b)}</b><span>diferença exata</span></div>`;
    live.textContent = step === 1 ? '30 por R$ 16,98 · 20 por R$ 8,69' : step === 2 ? 'MMC(30, 20) = 60' : `diferença ${money(33.96 - 26.07)}`;
  };
  seg.on((v) => {
    const prev = step;
    step = +v;
    sync();
    if (step === 3 && prev !== 3) tween(0, 1, 1100, (x) => { k = x; draw(); }); else { k = 1; draw(); }
  });
  draw(); sync();
}

/* ========================================================== 5 · Subtrair = somar negativo ======== */
const t5 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage short ar-fig" id="ar-reta"></div>
    <p class="stage-cap">Primeiro um salto até <i>a</i>. Depois somar −<i>b</i> é saltar <i>b</i> casas para a esquerda: exatamente o que a subtração faz.</p>
    <div class="controls" id="ar-reta-ctl"></div>
  </div>
  <div class="explain">
    <p class="kicker">Só existem soma e multiplicação?</p>
    <h3>Subtrair é somar um número negativo</h3>
    <p>Alguns matemáticos defendem a tese de que só existem soma e multiplicação. A subtração seria somar um número negativo. A divisão seria multiplicar por uma fração.</p>
    <div class="formula" id="ar-reta-f" aria-live="polite"></div>
    <div class="formula"><i>a</i> − <i>b</i> = <i>a</i> + (−<i>b</i>) &nbsp;&nbsp;&nbsp; <i>a</i> ÷ <i>b</i> = <i>a</i> × <span class="frac"><span>1</span><span><i>b</i></span></span></div>
    ${vlinks([[240, 'A tese: só existem soma e multiplicação'], [245, 'Subtrair é somar um negativo'], [252, 'Dividir é multiplicar por fração']])}
  </div>
</article>`);
root.append(t5);
{
  const host = t5.querySelector('#ar-reta');
  const Y = 238, xv = (v) => 320 + 27 * v;
  let ticks = '';
  for (let v = -10; v <= 10; v++) {
    const maj = v % 2 === 0;
    ticks += `<line class="tick${v === 0 ? ' maj' : ''}" x1="${xv(v)}" y1="${Y - (maj ? 8 : 5)}" x2="${xv(v)}" y2="${Y + (maj ? 8 : 5)}"/>`;
    if (maj) ticks += `<text${v === 0 ? ' class="ink"' : ''} x="${xv(v)}" y="${Y + 30}" text-anchor="middle" font-size="16">${v < 0 ? '−' + -v : v}</text>`;
  }
  host.innerHTML = `<svg class="ar-flat" viewBox="0 0 640 360" role="img" aria-label="Reta numérica de −10 a 10 com dois saltos: até a e depois b casas para a esquerda.">
    <line class="axis" x1="${xv(-10) - 14}" y1="${Y}" x2="${xv(10) + 14}" y2="${Y}"/>${ticks}
    <path class="arc1" id="ar-arc1" pathLength="1"/><path class="head1" id="ar-h1"/><text class="lab1" id="ar-l1" text-anchor="middle" font-size="16"></text>
    <path class="arc2" id="ar-arc2" pathLength="1"/><path class="head2" id="ar-h2"/><text class="lab2" id="ar-l2" text-anchor="middle" font-size="16"></text>
    <circle class="dot0" cx="${xv(0)}" cy="${Y}" r="5"/><circle class="dot2" id="ar-dot" cy="${Y}" r="7"/></svg>`;
  const live = corners(host, 5, 'Reta numérica', 'mexa em a e b');
  const $ = (id) => host.querySelector(id);
  const ctl = t5.querySelector('#ar-reta-ctl');
  const sa = slider({ id: 'ar-reta-a', label: 'Número <i>a</i>', min: -4, max: 9, step: 1, value: 7, format: (v) => (v < 0 ? '−' + -v : v) });
  const sb = slider({ id: 'ar-reta-b', label: 'Tirar <i>b</i>', min: 0, max: 9, step: 1, value: 3 });
  const play = el(`<div class="btn-row"><button type="button" class="btn sm">Mostrar passo a passo</button></div>`);
  ctl.append(sa.el, sb.el, play);
  const f = t5.querySelector('#ar-reta-f');
  const neg = (v) => (v < 0 ? `−${-v}` : `${v}`);
  const hop = (x0, x1, h) => `M${x0} ${Y}Q${(x0 + x1) / 2} ${Y - 2 * h} ${x1} ${Y}`;
  const head = (x0, x1, h) => { // arrowhead along the end tangent of the quadratic hop
    const tx = x1 - (x0 + x1) / 2, ty = 2 * h, L = Math.hypot(tx, ty) || 1, ux = tx / L, uy = ty / L, s = 11;
    return `M${x1} ${Y}L${r2(x1 - ux * s - uy * s * 0.5)} ${r2(Y - uy * s + ux * s * 0.5)}L${r2(x1 - ux * s + uy * s * 0.5)} ${r2(Y - uy * s - ux * s * 0.5)}Z`;
  };
  const draw = () => {
    const a = sa.value, b = sb.value, r = a - b, h1 = 22 + 4 * Math.abs(a), h2 = h1 + 26 + 3 * b;
    $('#ar-arc1').setAttribute('d', a ? hop(xv(0), xv(a), h1) : '');
    $('#ar-h1').setAttribute('d', a ? head(xv(0), xv(a), h1) : '');
    $('#ar-l1').textContent = a ? `+${neg(a)}` : '';
    $('#ar-l1').setAttribute('x', (xv(0) + xv(a)) / 2);
    $('#ar-l1').setAttribute('y', Y - h1 - 8);
    $('#ar-arc2').setAttribute('d', b ? hop(xv(a), xv(r), h2) : '');
    $('#ar-h2').setAttribute('d', b ? head(xv(a), xv(r), h2) : '');
    $('#ar-l2').textContent = b ? `+(−${b})` : '';
    $('#ar-l2').setAttribute('x', (xv(a) + xv(r)) / 2);
    $('#ar-l2').setAttribute('y', Y - h2 - 8);
    $('#ar-dot').setAttribute('cx', xv(r));
    f.innerHTML = `<span class="t-hue">${neg(a)}</span> − ${b} = <span class="t-hue">${neg(a)}</span> + <span class="t-mark">(−${b})</span> = <b>${neg(r)}</b>`;
    live.textContent = `${neg(a)} − ${b} = ${neg(r)}`;
  };
  sa.on(draw); sb.on(draw);
  draw();
  play.querySelector('button').addEventListener('click', () => {
    const a1 = $('#ar-arc1'), a2 = $('#ar-arc2');
    a1.style.strokeDasharray = a2.style.strokeDasharray = '1 1';
    a1.style.strokeDashoffset = a2.style.strokeDashoffset = '1';
    tween(1, 0, 900, (v) => { a1.style.strokeDashoffset = v; }, () => tween(1, 0, 900, (v) => { a2.style.strokeDashoffset = v; }));
  });
}

/* ========================================================== 6 · Pizza ÷ 4 = × ¼ (anatomy figure) ======== */
const t6 = el(`
<article class="topic flip">
  <div class="stage-col">
    <div class="stage ar-fig" id="ar-pizza"></div>
    <p class="stage-cap">Uma pizza numa pá de madeira. Dividir por <i>n</i> corta <i>n</i> fatias iguais, e a sua fatia é a pizza vezes 1/<i>n</i>.</p>
    <div class="controls" id="ar-pizza-ctl"></div>
  </div>
  <div class="explain">
    <p class="kicker">Dividir é multiplicar por fração</p>
    <h3>A pizza ÷ 4 é a pizza × ¼</h3>
    <p>Quando você divide a pizza por 4, cada pedaço vale ¼ da pizza, ou 0,25. Na verdade você multiplicou a pizza por uma fração. Resumindo: você nunca dividiu nada, seu pão-duro.</p>
    <div class="formula" id="ar-pizza-f" aria-live="polite"></div>
    ${vlinks([[252, 'Dividir é multiplicar por uma fração'], [257, 'A pizza dividida por 4'], [263, 'Você nunca dividiu nada']])}
  </div>
</article>`);
root.append(t6);
{
  const host = t6.querySelector('#ar-pizza');
  const R = 10, DH = 1.05, CH = 0.32;
  const PEP = [[6.4, 12], [3.4, 62], [6.6, 98], [2.2, 150], [6.2, 168], [4.6, 215], [6.8, 250], [3.6, 290], [6.3, 322], [1.0, 20], [4.4, 120], [4.2, 350]];
  const vb = fitView([[-17, -12, 0], [12.5, -12.5, 0], [12.5, 12.5, 0], [-12.5, 12.5, 0], [14, 14, 0], [-12, -12, 4], [12, 12, 4]], 4 / 3, 1.5, 2, 2);
  host.innerHTML = `<svg class="ar-iso" viewBox="${vb}" role="img" aria-label="Pizza em perspectiva isométrica cortada em fatias iguais; uma fatia sai levantada.">
    <defs><filter id="ar-blur-pz" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.8"/></filter></defs><g id="ar-pizza-g"></g></svg>`;
  const live = corners(host, 6, 'Pizza ÷ n', 'escolha em quantas partes cortar');
  const g = host.querySelector('#ar-pizza-g');
  const ctl = t6.querySelector('#ar-pizza-ctl');
  const sn = slider({ id: 'ar-pizza-n', label: 'Dividir por', min: 1, max: 8, step: 1, value: 4 });
  ctl.append(sn.el);
  const f = t6.querySelector('#ar-pizza-f');
  const ends = (n) => { while (n % 2 === 0) n /= 2; while (n % 5 === 0) n /= 5; return n === 1; };
  // the board: a round peel with a handle, both on the floor
  const board = () => {
    let s = halo([[-13, -13, 0], [13, -13, 0], [13, 13, 0], [-13, 13, 0]].map(([x, y]) => [x * 0.95, y * 0.95, 0]), 'ar-blur-pz');
    s += `<g class="m-wood">${box(-17.5, -1.3, 0, 6.5, 2.6, 0.7)}${sector(0, 0, 0, 0.7, 12, 0, 360)}`;
    s += `<path class="ln" d="${d3(Array.from({ length: 49 }, (_, i) => { const a = i * 7.5 * D2R; return [11.2 * Math.cos(a), 11.2 * Math.sin(a), 0.7]; }), false)}" style="opacity:.45"/>`;
    s += flatDisc(-16.2, 0, 0.7, 0.55, 'cup') + '</g>';
    return s;
  };
  const BOARD = board();
  let e = 1;
  const draw = () => {
    const n = sn.value, span = 360 / n, parts = [];
    for (let i = 0; i < n; i++) {
      const a0 = 45 - span / 2 + i * span, a1 = a0 + span, am = ((a0 + a1) / 2) * D2R;
      const off = n > 1 ? e * (i === 0 ? 2.6 : 0.7) : 0, lift = i === 0 && n > 1 ? e * 1.4 : 0;
      const ox = Math.cos(am) * off, oy = Math.sin(am) * off, z = 0.7 + lift;
      let s = i === 0 && n > 1 && lift > 0.05 ? `<ellipse class="halo" cx="${r2(P(ox + Math.cos(am) * 5, oy + Math.sin(am) * 5, 0.7)[0])}" cy="${r2(P(ox + Math.cos(am) * 5, oy + Math.sin(am) * 5, 0.7)[1])}" rx="${r2(5 * e)}" ry="${r2(2.6 * e)}" filter="url(#ar-blur-pz)"/>` : '';
      s += `<g class="m-dough${i === 0 && n > 1 ? ' ar-lit' : ''}">${sector(ox, oy, z, DH, R, a0, a1)}</g><g class="m-cheese">${sector(ox, oy, z + DH, CH, R - 1.15, a0, a1)}</g>`;
      for (const [rr, deg] of PEP) {
        let d = deg; while (d < a0) d += 360; while (d >= a0 + 360) d -= 360;
        if (n > 1 && (d > a1 || Math.min(d - a0, a1 - d) * D2R * rr < 1.3)) continue;
        const px = ox + rr * Math.cos(deg * D2R), py = oy + rr * Math.sin(deg * D2R);
        s += flatDisc(px, py, z + DH + CH + 0.04, 1.1, 'pep') + flatDisc(px + 0.25, py - 0.2, z + DH + CH + 0.06, 0.28, 'pep-in');
      }
      parts.push({ d: ox + oy + (Math.cos(am) + Math.sin(am)) * R * 0.45, s });
    }
    parts.sort((a, b) => a.d - b.d);
    g.innerHTML = BOARD + parts.map((p) => p.s).join('');
  };
  const sync = () => {
    const n = sn.value, dec = num(1 / n) + (ends(n) ? '' : '…');
    f.innerHTML = n === 1
      ? 'pizza ÷ 1 = pizza × 1 <small>sem cortar, a pizza inteira é sua</small>'
      : `pizza ÷ ${n} = pizza × <span class="frac"><span>1</span><span>${n}</span></span> = pizza × ${dec}`;
    live.textContent = n === 1 ? '÷ 1 = × 1' : `1 fatia = × 1/${n} = ${dec}`;
  };
  let run = 0; // one cut animation at a time while the slider is dragged
  sn.on(() => { sync(); const me = ++run; tween(0, 1, 650, (v) => { if (me === run) { e = v; draw(); } }); });
  sync(); draw();
}

/* ========================================================== 7 · Soma → multiplicação → potência ======== */
const CUBE_STEPS = {
  soma: { f: '2 + 2 + 2 + 2 + 3 + 3 + 3 + 4 = <b>21</b>', n: 21, r: '21', links: [[269, 'A multiplicação facilita somas grandes'], [279, 'O 2 aparece 4 vezes, o 3 aparece 3']] },
  mult: { f: '4 × 2 + 3 × 3 + 1 × 4 = 8 + 9 + 4 = <b>21</b>', n: 21, r: '21', links: [[279, '4 vezes o 2, mais 3 vezes o 3'], [288, 'Mais o 4, que só aparece 1 vez: 21']] },
  pot: { f: '2 · 2 · 2 · 2 · 3 · 3 · 3 · 4 = 2<sup>4</sup> · 3<sup>3</sup> · 4<sup>1</sup> = 16 · 27 · 4 = <b>1728</b>', n: 47, r: '1728', links: [[301, 'Também dá para facilitar multiplicações'], [306, 'É isso que a potenciação faz'], [312, 'Troque + por ×: 1728'], [318, 'A repetição vira expoente'], [327, '4 elevado a 1'], [331, 'Também são equivalentes']] },
};
const t7 = el(`
<article class="topic wide">
  <div class="stage-col">
    <div class="stage short" id="ar-cubos"></div>
    <p class="stage-cap">Cada cubinho vale uma unidade do seu número. Azul é 2, laranja é 3, verde é 4. Escolha a etapa e veja as torres se reorganizarem.</p>
    <div class="controls" id="ar-cubos-ctl"></div>
  </div>
  <div class="explain">
    <p class="kicker">Somas, produtos e potências</p>
    <h3>A multiplicação resume somas, a potência resume multiplicações</h3>
    <p>Na soma 2 + 2 + 2 + 2 + 3 + 3 + 3 + 4, o 2 aparece 4 vezes, o 3 aparece 3 vezes e o 4 só uma. Por isso ela vale 4 × 2 + 3 × 3 + 1 × 4: as duas expressões são equivalentes e dão 21.</p>
    <p>Agora troque cada + por ×. O produto 2 · 2 · 2 · 2 · 3 · 3 · 3 · 4 dá 1728, e o número de repetições vira expoente: 2<sup>4</sup> · 3<sup>3</sup> · 4<sup>1</sup>. O 3 · 3 · 3 cabe certinho num cubo de lado 3.</p>
    <div class="formula" id="ar-cubos-f" aria-live="polite"></div>
    <div class="stats" id="ar-cubos-stats"></div>
    <p class="note fact"><span>1728 é 12<sup>3</sup>: 2<sup>4</sup> · 3<sup>3</sup> · 4 = 2<sup>6</sup> · 3<sup>3</sup> = (2<sup>2</sup> · 3)<sup>3</sup>. Daria para montar um cubo de 12 × 12 × 12 com 1728 cubinhos.</span></p>
  </div>
</article>`);
root.append(t7);
{
  const ctl = t7.querySelector('#ar-cubos-ctl');
  const seg = segmented({ label: 'Etapa', options: [{ value: 'soma', label: '1 · Soma' }, { value: 'mult', label: '2 · Multiplicação' }, { value: 'pot', label: '3 · Potenciação' }], value: 'soma' });
  const links = el('<div class="ar-steplinks"></div>');
  ctl.append(seg.el, links);
  const f = t7.querySelector('#ar-cubos-f'), stats = t7.querySelector('#ar-cubos-stats');
  const text = (k) => {
    const st = CUBE_STEPS[k];
    f.innerHTML = st.f;
    stats.innerHTML = `<div class="stat"><b>${st.n}</b><span>cubinhos na mesa</span></div><div class="stat"><b>${st.r}</b><span>resultado</span></div>`;
    links.innerHTML = vlinks(st.links);
  };
  text('soma');

  const s7 = stage(t7.querySelector('#ar-cubos'), {
    camera: [3.2, 5.6, 12.2], target: [0, 1.3, 0], fov: 38,
    label: 'Torres de cubos: oito colunas (2, 2, 2, 2, 3, 3, 3, 4) que se juntam em blocos 4 × 2, 3 × 3 e 1 × 4, e depois em potências: dois cubos 2 × 2 × 2, um cubo 3 × 3 × 3 e uma coluna de 4.',
    hint: 'arraste para girar',
  });
  if (s7) {
    const N = 47, G = 0.92, Y0 = 0.43;
    const VAL = Array.from({ length: N }, (_, i) => (i < 8 ? 2 : i < 17 ? 3 : i < 21 ? 4 : i < 29 ? 2 : 3));
    const HUES = { 2: 210, 3: 28, 4: 150 };
    const im = new THREE.InstancedMesh(new RoundedBoxGeometry(0.86, 0.86, 0.86, 2, 0.09), new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.02 }), N);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const paint = () => {
      const cs = { 2: new THREE.Color(hueColor(HUES[2])), 3: new THREE.Color(hueColor(HUES[3])), 4: new THREE.Color(hueColor(HUES[4])) };
      for (let i = 0; i < N; i++) im.setColorAt(i, cs[VAL[i]]);
      im.instanceColor.needsUpdate = true;
    };
    paint();
    const plate = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.1, 3.8), new THREE.MeshStandardMaterial({ color: new THREE.Color(color('--line')), roughness: 0.8 }));
    plate.position.y = -0.05;
    s7.add(plate, im);

    // three layouts: [x, y, z, scale] per cube; ids keep their value so every cube travels to a cube of its own number
    const L = { soma: [], mult: [], pot: [] };
    let id = 0;
    [2, 2, 2, 2, 3, 3, 3, 4].forEach((h, c) => { for (let j = 0; j < h; j++) L.soma[id++] = [(c - 3.5) * 1.3, j * G + Y0, 0, 1]; });
    let cur = -(8 * G + 2 * 1.1) / 2;
    const multCenters = [];
    for (const [cols, rows, first] of [[4, 2, 0], [3, 3, 8], [1, 4, 17]]) {
      for (let c = 0; c < cols; c++) for (let j = 0; j < rows; j++) L.mult[first + c * rows + j] = [cur + G / 2 + c * G, j * G + Y0, 0, 1];
      multCenters.push([cur + (cols * G) / 2, rows]);
      cur += cols * G + 1.1;
    }
    const cube = (ids, x0, n) => { let k = 0; for (let j = 0; j < n; j++) for (let zz = 0; zz < n; zz++) for (let xx = 0; xx < n; xx++) L.pot[ids[k++]] = [x0 + G / 2 + xx * G, j * G + Y0, (zz - (n - 1) / 2) * G, 1]; };
    const rng = (a, b) => Array.from({ length: b - a }, (_, i) => a + i);
    cur = -(2 * G * 2 + 0.35 + 3 * G + G + 2 * 1.1) / 2;
    const potCenters = [];
    cube(rng(0, 8), cur, 2); cube(rng(21, 29), cur + 2 * G + 0.35, 2);
    potCenters.push([cur + (4 * G + 0.35) / 2, 2]); cur += 4 * G + 0.35 + 1.1;
    cube([...rng(8, 17), ...rng(29, 47)], cur, 3);
    potCenters.push([cur + 1.5 * G, 3]); cur += 3 * G + 1.1;
    for (let j = 0; j < 4; j++) L.pot[17 + j] = [cur + G / 2, j * G + Y0, 0, 1];
    potCenters.push([cur + G / 2, 4]);
    for (let i = 21; i < N; i++) { L.soma[i] = [...L.pot[i].slice(0, 3), 0]; L.mult[i] = [...L.pot[i].slice(0, 3), 0]; }

    // labels under and above the blocks, one set per layout
    const lab = (html, pos, cls = 'math') => { const o = s7.label(html, pos, { cls }); o.visible = false; return o; };
    const LB = { soma: [], mult: [], pot: [] };
    const sx = (c) => (c - 3.5) * 1.3;
    [2, 2, 2, 2, 3, 3, 3, 4].forEach((v, c) => {
      LB.soma.push(lab(String(v), [sx(c), -0.45, 1.0], 'plain ar-cl'));
      if (c < 7) LB.soma.push(lab('+', [(sx(c) + sx(c + 1)) / 2, -0.45, 1.0], 'plain ar-cl'));
    });
    LB.soma.push(lab('= 21', [sx(7) + 1.15, -0.45, 1.0], 'plain ar-cl'));
    ['4 × 2', '3 × 3', '1 × 4'].forEach((t, i) => {
      LB.mult.push(lab(t, [multCenters[i][0], -0.45, 1.0], 'ar-cl'));
      LB.mult.push(lab(['8', '9', '4'][i], [multCenters[i][0], multCenters[i][1] * G + 0.45, 0], 'plain ar-cl'));
    });
    ['2<sup>4</sup>', '3<sup>3</sup>', '4<sup>1</sup>'].forEach((t, i) => {
      LB.pot.push(lab(t, [potCenters[i][0], -0.45, 1.6], 'ar-cl'));
      LB.pot.push(lab(['16', '27', '4'][i], [potCenters[i][0], potCenters[i][1] * G + 0.45, 0], 'plain ar-cl'));
    });
    const showLabels = (k) => { for (const key in LB) for (const o of LB[key]) o.visible = key === k; };

    const now = L.soma.map((p) => p.slice()), from = now.map((p) => p.slice());
    const dummy = new THREE.Object3D();
    const write = (i, lift) => {
      const p = now[i];
      dummy.position.set(p[0], p[1] + lift, p[2]);
      dummy.scale.setScalar(Math.max(1e-4, p[3]));
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    };
    for (let i = 0; i < N; i++) write(i, 0);
    im.instanceMatrix.needsUpdate = true;
    showLabels('soma');
    let anim = null;
    seg.on((k) => {
      text(k);
      showLabels(k);
      const to = L[k];
      if (reduced) { for (let i = 0; i < N; i++) { now[i] = to[i].slice(); write(i, 0); } im.instanceMatrix.needsUpdate = true; return; }
      for (let i = 0; i < N; i++) from[i] = now[i].slice();
      anim = { t0: performance.now() / 1000, to };
    });
    s7.onFrame((t) => {
      if (!anim) return;
      const el0 = t - anim.t0;
      let done = true;
      for (let i = 0; i < N; i++) {
        const k0 = (el0 - i * 0.012) / 0.8, k = k0 <= 0 ? 0 : k0 >= 1 ? 1 : ease(k0);
        if (k0 < 1) done = false;
        const a = from[i], b = anim.to[i];
        for (let c = 0; c < 4; c++) now[i][c] = a[c] + (b[c] - a[c]) * k;
        const dist = Math.abs(b[0] - a[0]) + Math.abs(b[2] - a[2]);
        write(i, Math.sin(Math.PI * k) * Math.min(0.9, dist * 0.35)); // a small hop over the neighbours
      }
      im.instanceMatrix.needsUpdate = true;
      if (done) anim = null;
    });
    onTheme(() => { paint(); plate.material.color.set(color('--line')); });
  }
  css(`#aritmetica .ar-cl { font: 600 15px/1 var(--f-math); } #aritmetica .ar-cl.plain { color: var(--muted); } #aritmetica .ar-cl sup { font-size: .7em; }
  #aritmetica .ar-cl { animation: ar-fade .5s ease both; } @keyframes ar-fade { from { opacity: 0; } }`);
}

/* ========================================================== 8 · Porcentagem: o bolo (anatomy figure) ======== */
const t8 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage ar-fig" id="ar-bolo"></div>
    <p class="stage-cap">Um bolo de duas massas e recheio numa boleira. O controle corta a fatia que será vendida: a porcentagem é a parte do todo.</p>
    <div class="controls" id="ar-bolo-ctl"></div>
  </div>
  <div class="explain">
    <p class="kicker">Porcentagem</p>
    <h3>A parte de um todo</h3>
    <p>Porcentagem é a linguagem dos lucros, dos descontos e das taxas, aquelas coisas que no final sempre deixam alguém endividado. Ela representa a parte de um todo, e o todo vale 100.</p>
    <p>Vender 50% do bolo é vender 50 sobre 100 do todo, ou seja, a metade.</p>
    <div class="formula" id="ar-bolo-f" aria-live="polite"></div>
    ${vlinks([[338, 'O mais legal: porcentagens'], [342, 'Lucros, descontos e taxas'], [348, 'A parte de um todo: o bolo'], [354, '50 sobre 100 é a metade']])}
  </div>
</article>`);
root.append(t8);
{
  const host = t8.querySelector('#ar-bolo');
  const R = 8, Z0 = 4.3, LAYERS = [[2.1, 'm-sponge', 0], [0.5, 'm-cream', 0.25], [2.1, 'm-sponge', 0], [0.75, 'm-frost', 0]];
  const TOP = Z0 + LAYERS.reduce((a, l) => a + l[0], 0);
  const vb = fitView([[7.8, -7.8, 0], [-7.8, 7.8, 0], [7.8, 7.8, 0], [-5.7, -5.7, TOP + 0.8], [7.7, 7.7, Z0]], 4 / 3, 2, 2.5, 2); // a round object: fit its silhouette, not its square
  host.innerHTML = `<svg class="ar-iso" viewBox="${vb}" role="img" aria-label="Bolo redondo em perspectiva isométrica com uma fatia proporcional à porcentagem escolhida.">
    <defs><filter id="ar-blur-bl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.8"/></filter></defs><g id="ar-bolo-g"></g></svg>`;
  const live = corners(host, 8, 'Porcentagem do bolo', 'escolha a porcentagem');
  const g = host.querySelector('#ar-bolo-g');
  const sp = slider({ id: 'ar-bolo-p', label: 'Vender', min: 0, max: 100, step: 1, value: 50, format: (v) => `${v}%` });
  const presets = el(`<div class="btn-row">${[25, 50, 75, 100].map((v) => `<button type="button" class="btn sm" data-p="${v}">${v}%</button>`).join('')}</div>`);
  t8.querySelector('#ar-bolo-ctl').append(sp.el, presets);
  presets.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => tween(sp.value, +b.dataset.p, 600, (v) => { sp.value = Math.round(v); })));
  const f = t8.querySelector('#ar-bolo-f');
  const STAND = halo([[-9, -9, 0], [9, -9, 0], [9, 9, 0], [-9, 9, 0]].map(([x, y]) => [x * 0.5, y * 0.5, 0]), 'ar-blur-bl') +
    `<g class="m-plate">${sector(0, 0, 0, 0.6, 4.2, 0, 360)}${sector(0, 0, 0.6, 3.2, 1.1, 0, 360)}${sector(0, 0, 3.8, 0.5, 10, 0, 360)}</g>`;
  // one column of cake between two angles, layers bottom to top, with piped rosettes along the rim
  const column = (a0, a1, ox, oy, lit) => {
    let z = Z0, s = '';
    for (const [h, cls, inset] of LAYERS) { s += `<g class="${cls}${lit ? ' ar-lit' : ''}">${sector(ox, oy, z, h, R - inset, a0, a1)}</g>`; z += h; }
    const ros = [];
    for (let d = 7.5; d < 360; d += 15) {
      let a = d; while (a < a0) a += 360; while (a >= a0 + 360) a -= 360;
      if (a > a1 || (a1 - a0 < 359.9 && Math.min(a - a0, a1 - a) < 4)) continue;
      ros.push([ox + (R - 0.95) * Math.cos(a * D2R), oy + (R - 0.95) * Math.sin(a * D2R)]);
    }
    ros.sort((p, q) => p[0] + p[1] - q[0] - q[1]);
    for (const [x, y] of ros) s += flatDisc(x, y, TOP + 0.05, 0.7, 'rose');
    return s;
  };
  const pieces = (a0, a1, ox, oy, lit, out) => {
    if (a1 - a0 > 180.01 && a1 - a0 < 359.99) { const m = (a0 + a1) / 2; pieces(a0, m, ox, oy, lit, out); pieces(m, a1, ox, oy, lit, out); return; }
    const am = ((a0 + a1) / 2) * D2R, rr = a1 - a0 >= 359.99 ? 0 : R * 0.5;
    out.push({ d: ox + oy + rr * (Math.cos(am) + Math.sin(am)), s: column(a0, a1, ox, oy, lit) });
  };
  let shownP = 50, e = 1, run = 0;
  const draw = () => {
    const p = shownP, span = 3.6 * p, out = [];
    if (p > 0 && p < 100) {
      const off = 2.8 * e;
      pieces(45 + span / 2, 405 - span / 2, 0, 0, false, out);
      pieces(45 - span / 2, 45 + span / 2, off * Math.SQRT1_2, off * Math.SQRT1_2, true, out);
    } else pieces(0, 360, 0, 0, p === 100, out);
    out.sort((a, b) => a.d - b.d);
    g.innerHTML = STAND + out.map((o) => o.s).join('');
  };
  const NAMES = { '1/2': 'a metade', '1/4': 'um quarto', '3/4': 'três quartos', '1/5': 'um quinto', '1/10': 'um décimo', '1/1': 'o bolo todo', '0/1': 'nada' };
  const sync = (p) => {
    const gg = gcd(p, 100) || 1, fr = `${p / gg}/${100 / gg}`;
    const name = NAMES[fr] ? ` = ${NAMES[fr]}` : '';
    f.innerHTML = `${p}% = <span class="frac"><span>${p}</span><span>100</span></span>${100 / gg !== 100 ? ` = <span class="frac"><span>${p / gg}</span><span>${100 / gg}</span></span>` : ''} = ${num(p / 100, 2)}${name}`;
    live.textContent = `${p}% = ${fr}${NAMES[fr] ? ' · ' + NAMES[fr] : ''}`;
  };
  sp.on((v) => {
    const was = shownP;
    shownP = v; sync(v);
    if ((was === 0 || was === 100) && v > 0 && v < 100) { const me = ++run; tween(0, 1, 500, (x) => { if (me === run) { e = x; draw(); } }); } else draw();
  });
  sync(50); draw();
}

/* ========================================================== 9 · 16% de 50 = 50% de 16 ======== */
const t9 = el(`
<article class="topic flip">
  <div class="stage-col">
    <div class="stage tall ar-fig" id="ar-pct"></div>
    <p class="stage-cap">Grade de 100 × 100. O retângulo tem lados <i>p</i> e <i>n</i>: sua área dividida por 100 é <i>p</i>% de <i>n</i>. Cada bloco de 10 × 10 vale 1.</p>
    <div class="controls" id="ar-pct-ctl"></div>
  </div>
  <div class="explain">
    <p class="kicker">Comutatividade</p>
    <h3>16% de 50 é o mesmo que 50% de 16</h3>
    <p>Calcular 16% de 50 de cabeça não é tão fácil. Já 50% de 16 todo mundo sabe: 50% é a metade do todo, e a metade de 16 é 8. E não por acaso 16% de 50 também é 8.</p>
    <p>As duas contas são o mesmo produto, 16 × 50 ÷ 100. Elas obedecem ao princípio da comutatividade: na multiplicação, a ordem dos fatores não altera o produto. Girar o retângulo não muda a sua área.</p>
    <div class="formula" id="ar-pct-f" aria-live="polite"></div>
    <div class="stats" id="ar-pct-stats"></div>
    ${vlinks([[362, 'Calcular 16% de 50'], [369, '50% de 16 eu já sei fazer'], [377, 'Metade de 16 é 8, e 16% de 50 também'], [389, 'Isso aqui é igual àquilo ali'], [395, 'A ordem dos fatores não altera o produto']])}
  </div>
</article>`);
root.append(t9);
{
  const host = t9.querySelector('#ar-pct');
  const O = 52, S = 3.6, B = O + 100 * S;
  let gridL = '';
  for (let v = 0; v <= 100; v += 10) {
    gridL += `<line class="grid-l" x1="${O + v * S}" y1="${O - 30}" x2="${O + v * S}" y2="${B - 30}"/><line class="grid-l" x1="${O}" y1="${O - 30 + v * S}" x2="${B}" y2="${O - 30 + v * S}"/>`;
    if (v % 20 === 0) gridL += `<text x="${O + v * S}" y="${B - 8}" text-anchor="middle" font-size="13">${v}</text><text x="${O - 8}" y="${B - 30 - v * S + 4}" text-anchor="end" font-size="13">${v}</text>`;
  }
  host.innerHTML = `<svg class="ar-flat" viewBox="0 0 440 440" role="img" aria-label="Grade de 100 por 100 com um retângulo de lados p e n; girar o retângulo mantém a área.">
    ${gridL}<rect class="grid-b" x="${O}" y="${O - 30}" width="${100 * S}" height="${100 * S}"/>
    <rect class="pct-r" id="ar-pct-r" x="${O}"/><text class="ink" id="ar-pct-w" text-anchor="middle" font-size="14"></text><text class="ink" id="ar-pct-h" text-anchor="middle" font-size="14"></text></svg>`;
  const ctl = t9.querySelector('#ar-pct-ctl');
  const sp = slider({ id: 'ar-pct-p', label: 'Porcentagem <i>p</i>', min: 0, max: 100, step: 1, value: 16, format: (v) => `${v}%` });
  const sn = slider({ id: 'ar-pct-n', label: 'De <i>n</i>', min: 0, max: 100, step: 1, value: 50 });
  const swap = el(`<div class="btn-row"><button type="button" class="btn sm">Trocar a ordem: <i>n</i>% de <i>p</i></button></div>`);
  ctl.append(sp.el, sn.el, swap);
  const rect = host.querySelector('#ar-pct-r'), tw = host.querySelector('#ar-pct-w'), th = host.querySelector('#ar-pct-h');
  const f = t9.querySelector('#ar-pct-f'), stats = t9.querySelector('#ar-pct-stats');
  const base = B - 30;
  const draw = (w, h) => { // w = width in cells (the whole), h = height in cells (the percentage)
    rect.setAttribute('y', r2(base - h * S)); rect.setAttribute('width', r2(w * S)); rect.setAttribute('height', r2(h * S));
    tw.setAttribute('x', r2(O + (w * S) / 2)); tw.setAttribute('y', r2(base - h * S - 8)); tw.textContent = w >= 6 ? String(Math.round(w)) : '';
    th.setAttribute('x', r2(O + w * S + 18)); th.setAttribute('y', r2(base - (h * S) / 2 + 5)); th.textContent = h >= 6 ? String(Math.round(h)) : '';
  };
  const sync = () => {
    const p = sp.value, n = sn.value, r = (p * n) / 100;
    f.innerHTML = `${p}% de ${n} = <span class="frac"><span>${p} × ${n}</span><span>100</span></span> = <b>${num(r, 2)}</b> = ${n}% de ${p}`;
    stats.innerHTML = `<div class="stat"><b>${num(r, 2)}</b><span>${p}% de ${n}</span></div><div class="stat"><b>${num(r, 2)}</b><span>${n}% de ${p}</span></div><div class="stat"><b>${num(p * n, 0)}</b><span>quadradinhos de área</span></div>`;
  };
  let W = 50, H = 16;
  const onInput = () => { W = sn.value; H = sp.value; draw(W, H); sync(); };
  sp.on(onInput); sn.on(onInput);
  swap.querySelector('button').addEventListener('click', () => {
    const p = sp.value, n = sn.value, w0 = W, h0 = H;
    tween(0, 1, 800, (k) => draw(w0 + (p - w0) * k, h0 + (n - h0) * k), () => {
      sp.input.value = n; sn.input.value = p; // both sliders swap; the input event keeps their outputs in sync
      sp.input.dispatchEvent(new Event('input')); sn.input.dispatchEvent(new Event('input'));
    });
  });
  draw(W, H); sync();
}
