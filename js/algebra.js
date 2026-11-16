// Chapter 3 · Álgebra (06:44–09:10). A two-pan lab balance that finds x, a carpenter's jig where the tiles of (a + b)²
// come apart into a², ab, ab and b², and a fence around a plot whose perimeter unfolds from x + y + x + y into
// 2x + 2y and 2(x + y). The isometric figures follow the anatomy craft: solid parts with tones by facing, painter's
// order (wrapping parts split into back and front), a framed card, and readouts driven by the same model as the parts.
import { THREE, mount, el, css, vlinks, stage, slider, segmented, hueColor, color, onTheme, reduced, tween, ease } from './core.js';

const root = mount('algebra');
const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const n1 = (v) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }); // 2,5 · 6,25 · 16

// self-checks: the identities the figures animate
for (const [a, b] of [[3, 2], [1.5, 4], [6, 5]]) console.assert(Math.abs((a + b) ** 2 - (a * a + 2 * a * b + b * b)) < 1e-9, '(a+b)² = a² + 2ab + b²');
for (const [x, y] of [[5, 3], [2.5, 7], [8, 1]]) console.assert(x + y + x + y === 2 * x + 2 * y && 2 * x + 2 * y === 2 * (x + y), 'x+y+x+y = 2x+2y = 2(x+y)');
const EQS = [[3, 7], [2, 8], [5, 6], [4, 9]]; // x + a = b
for (const [a, b] of EQS) console.assert(b - a + a === b && b - a >= 0, 'x = b − a equilibra');

css(`
#algebra .al-fig { position: relative; }
#algebra .al-c { position: absolute; z-index: 2; pointer-events: none; font: 600 11px/1.3 var(--f-mono); letter-spacing: .04em; color: var(--muted); max-width: 56%; }
#algebra .al-c.tl { left: 12px; top: 10px; } #algebra .al-c.tl b { color: var(--hue); }
#algebra .al-c.tr { right: 12px; top: 10px; text-align: right; }
#algebra .al-c.bl { left: 12px; bottom: 10px; }
#algebra .al-c.br { right: 12px; bottom: 10px; text-align: right; color: var(--ink); font-variant-numeric: tabular-nums; }
#algebra svg.al-iso path, #algebra svg.al-iso ellipse { stroke: color-mix(in srgb, var(--ink) 46%, transparent); stroke-width: .75; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
#algebra svg.al-iso .ln { fill: none; }
#algebra svg.al-iso .ln.lo { stroke: color-mix(in srgb, var(--ink) 32%, transparent); }
#algebra svg.al-iso .ln.hi { stroke: var(--ink); stroke-width: 1.2; }
#algebra svg.al-iso .ln.str { stroke: color-mix(in srgb, var(--ink) 55%, transparent); stroke-width: .9; }
#algebra svg.al-iso .ln.needle { stroke: var(--hue); stroke-width: 2; stroke-linecap: round; }
#algebra svg.al-iso .halo { fill: var(--ink); opacity: .15; stroke: none; }
#algebra svg.al-iso .dot { fill: color-mix(in srgb, var(--ink) 60%, transparent); stroke: none; }
#algebra svg.al-iso .eng { font-family: var(--f-math); font-style: italic; fill: color-mix(in srgb, var(--ink) 82%, transparent); stroke: none; }
#algebra svg.al-iso .eng.v { font-family: var(--f-mono); font-style: normal; font-weight: 600; fill: color-mix(in srgb, var(--ink) 60%, transparent); }
#algebra .m-base { --m: color-mix(in srgb, var(--ink) 13%, var(--surface)); }
#algebra .m-steel { --m: color-mix(in srgb, var(--ink) 27%, var(--surface)); }
#algebra .m-brass { --m: color-mix(in srgb, hsl(42 var(--hue-s) var(--hue-l)) 55%, var(--surface)); }
#algebra .m-x { --m: var(--hue); }
#algebra .m-unit { --m: color-mix(in srgb, var(--hue) 20%, var(--surface)); }
#algebra .m-a { --m: color-mix(in srgb, hsl(268 var(--hue-s) var(--hue-l)) 78%, var(--surface)); }
#algebra .m-ab { --m: color-mix(in srgb, hsl(198 var(--hue-s) var(--hue-l)) 70%, var(--surface)); }
#algebra .m-b { --m: color-mix(in srgb, hsl(322 var(--hue-s) var(--hue-l)) 70%, var(--surface)); }
#algebra .strip-a { fill: hsl(268 var(--hue-s) var(--hue-l)); }
#algebra .strip-b { fill: hsl(322 var(--hue-s) var(--hue-l)); }
#algebra .al-dim { opacity: .42; }
#algebra .al-lit path:not([style*="stroke:"]) { stroke: var(--ink); stroke-width: 1.15; }
#algebra .formula .on { color: var(--hue); font-weight: 600; }
#algebra .formula .al-line { display: block; transition: opacity .3s; }
#algebra .formula .al-line.off { opacity: .3; }
#algebra .al-chip { display: inline-flex; align-items: center; gap: 7px; padding: 3px 10px 3px 7px; border-radius: 999px; border: 1px solid var(--hue); font: 600 13px/1.3 var(--f-body); white-space: nowrap; }
#algebra .al-chip::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: var(--hue); }
#algebra .al-chips { display: flex; flex-wrap: wrap; gap: 8px; }
#algebra .al-tok { font: italic 600 17px/1 var(--f-math); padding: 2px 8px; }
#algebra .al-tok span { color: var(--hue); }
#algebra .al-tok.on { background: var(--hue); color: var(--on-hue); }
#algebra .al-tok.on span { color: inherit; }
#algebra .al-row { font: 600 15px/1 var(--f-math); color: var(--ink); }
#algebra .al-steplinks:empty { display: none; }
`);

/* ------------------------------------------------------------------ shared helpers ------ */
function pickCard(node, title, body, links) { node.innerHTML = `<h4>${title}</h4><p>${body}</p>${vlinks(links)}`; }
function corners(host, n, title, hint) {
  host.insertAdjacentHTML('beforeend',
    `<span class="al-c tl" aria-hidden="true">Fig. <b>3.${n}</b></span><span class="al-c tr" aria-hidden="true">${title}</span>` +
    `<span class="al-c bl" aria-hidden="true">${hint}</span><span class="al-c br" aria-hidden="true"></span>`);
  return host.querySelector('.al-c.br');
}

/* ------------------------------------------- isometric kit (true isometric, viewer toward +x +y +z) ------ */
const IC = Math.cos(Math.PI / 6);
const P = (x, y, z) => [(x - y) * IC, (x + y) / 2 - z];
const LV = [-0.35, 0.55, 1].map((v, _, a) => v / Math.hypot(...a));
const r2 = (v) => Math.round(v * 100) / 100;
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
const ID = Object.assign((p) => p, { n: (v) => v });
/** box given by two corners, through an optional rigid transform T (T.n turns normals) */
function cuboid(x0, y0, z0, x1, y1, z1, T = ID) {
  const c = [];
  for (let i = 0; i < 8; i++) c.push(T([i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0]));
  const F = [[[0, 2, 6, 4], [-1, 0, 0]], [[1, 3, 7, 5], [1, 0, 0]], [[0, 1, 5, 4], [0, -1, 0]], [[2, 3, 7, 6], [0, 1, 0]], [[0, 1, 3, 2], [0, 0, -1]], [[4, 5, 7, 6], [0, 0, 1]]];
  let s = '';
  for (const [ix, n] of F) s += face(ix.map((i) => c[i]), T.n(n));
  return s;
}
const box = (x, y, z, w, d, h, T) => cuboid(x, y, z, x + w, y + d, z + h, T);
/** rotation by th about the axis parallel to y through (px, ·, pz); positive th lowers the −x end */
function rotY(th, px, pz) {
  const c = Math.cos(th), s = Math.sin(th);
  const f = (p) => [px + (p[0] - px) * c - (p[2] - pz) * s, p[1], pz + (p[0] - px) * s + (p[2] - pz) * c];
  f.n = (n) => [n[0] * c - n[2] * s, n[1], n[0] * s + n[2] * c];
  return f;
}
/** vertical full cylinder with a smooth side and an inked silhouette */
function cyl(cx, cy, z, h, r) {
  const n = 48, lo = [], hi = [];
  for (let i = 0; i <= n; i++) { const a = (-45 + (360 * i) / n) * D2R, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); lo.push([x, y, z]); hi.push([x, y, z + h]); }
  let s = '', i1 = 0;
  for (let i = 0; i < n; i++) {
    const a = (-45 + (360 * (i + 0.5)) / n) * D2R, nn = [Math.cos(a), Math.sin(a), 0];
    if (!seen(nn)) continue;
    i1 = i;
    s += face([lo[i], lo[i + 1], hi[i + 1], hi[i]], nn, true);
  }
  return s + `<path class="ln" d="${d3([hi[0], ...lo.slice(0, i1 + 2), hi[i1 + 1]], false)}"/>` + face(hi.slice(0, n), [0, 0, 1]);
}
const lineSvg = (pts, cls = 'lo') => `<path class="ln ${cls}" d="${d3(pts, false)}"/>`;
const dot = (x, y, z, r = 0.16) => { const q = P(x, y, z); return `<ellipse class="dot" cx="${r2(q[0])}" cy="${r2(q[1])}" rx="${r2(r * 1.22)}" ry="${r2(r * 0.71)}"/>`; };
/** text engraved on a horizontal face: text x runs along world +x, text down along world +y */
const topText = (x, y, z, txt, size, cls = '') => {
  const q = P(x, y, z);
  return `<text class="eng ${cls}" transform="matrix(${r2(IC)} 0.5 ${r2(-IC)} 0.5 ${r2(q[0])} ${r2(q[1])})" font-size="${r2(size)}" text-anchor="middle" dominant-baseline="central">${txt}</text>`;
};
function fitView(pts, aspect, pad = 2, top = 3, bottom = 3) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { const q = P(p[0], p[1], p[2]); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
  x0 -= pad; x1 += pad; y0 -= pad + top; y1 += pad + bottom;
  let w = x1 - x0, h = y1 - y0;
  if (w / h > aspect) { const nh = w / aspect; y0 -= (nh - h) / 2; h = nh; } else { const nw = h * aspect; x0 -= (nw - w) / 2; w = nw; }
  return `${r2(x0)} ${r2(y0)} ${r2(w)} ${r2(h)}`;
}
const halo = (pts, filter) => `<path class="halo" d="${d3(pts)}" filter="url(#${filter})"/>`;
/** one spring-follow loop per figure, only while something moves and the figure is on screen */
function animator(host, step) {
  let on = false, last = 0, visible = true;
  const frame = (now) => {
    if (!visible) { on = false; return; }
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (step(dt)) requestAnimationFrame(frame); else { on = false; last = 0; }
  };
  const kick = () => { if (!on) { on = true; last = 0; requestAnimationFrame(frame); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { rootMargin: '80px' }).observe(host);
  return kick;
}

/* ========================================================== 1 · A balança do x (anatomy figure) ======== */
const t1 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage al-fig" id="al-bal"></div>
    <p class="stage-cap">Balança de dois pratos: a caixa <i>x</i> e os blocos de 1 de um lado, só blocos do outro. O ponteiro no mostrador indica para que lado ela pende.</p>
    <div class="controls" id="al-bal-ctl"></div>
  </div>
  <div class="explain">
    <p class="kicker">O que é álgebra</p>
    <h3>Letras no lugar dos números</h3>
    <p>Para quem acha que matemática só tem a ver com número: a álgebra usa letras e símbolos para representar números e operações. O clássico é descobrir o tal do <i>x</i> da equação.</p>
    <p>Escolha um valor para <i>x</i>. A balança só fica reta quando os dois lados pesam o mesmo. Depois tire os mesmos blocos dos dois pratos: o <i>x</i> fica sozinho e aparece um número, do nada.</p>
    <div class="formula" id="al-bal-f" aria-live="polite"></div>
    ${vlinks([[405, 'Bem-vindo ao mundo da álgebra'], [409, 'Letras e símbolos no lugar dos números'], [415, 'Descobrir o tal x da equação'], [420, 'Só letras, e no fim aparece um número']])}
  </div>
</article>`);
root.append(t1);
{
  const host = t1.querySelector('#al-bal');
  const ctl = t1.querySelector('#al-bal-ctl');
  const f = t1.querySelector('#al-bal-f');
  const PIV = [0, 0, 14.4], HOOK = 8.15, DROP = 6.0, PAN = 2.7;
  const UNIT = 1.0, CELL = 1.2, C0 = -2.35 + 0.6;
  const CELLS = [];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) CELLS.push([C0 + i * CELL, C0 + j * CELL]);
  CELLS.sort((p, q) => p[0] + p[1] - q[0] - q[1]); // back cells first
  const LEFT = CELLS.filter((p) => !(p[0] < 0 && p[1] < 0)), RIGHT = CELLS; // the left pan's back 2×2 corner holds the x box

  const vb = fitView([[-13.5, -5, 0], [13.5, -5, 0], [13.5, 5, 0], [-13.5, 5, 0], [-11, -3, 15.6], [11, 3, 15.6], [0, 0, 16.5]], 4 / 3, 1.2, 2.2, 1.6);
  host.innerHTML = `<svg class="al-iso" viewBox="${vb}" role="img" aria-label="Balança de dois pratos em perspectiva isométrica; a caixa x e blocos de 1 num prato, blocos de 1 no outro.">
    <defs><filter id="al-blur-bal" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.8"/></filter></defs>
    <g id="al-bal-static"></g><g id="al-bal-live"></g></svg>`;
  const live = corners(host, 1, 'Balança de dois pratos', 'escolha um valor para x');

  // static parts: feet, base plate with screws and a label plate, column with collars, the dial plate with ticks
  let st = halo([[-13, -4.5, 0], [13, -4.5, 0], [13, 4.5, 0], [-13, 4.5, 0]], 'al-blur-bal');
  st += '<g class="m-steel">';
  for (const [x, y] of [[-11.5, -3], [11.5, -3], [-11.5, 3], [11.5, 3]].sort((p, q) => p[0] + p[1] - q[0] - q[1])) st += cyl(x, y, 0, 1.2, 1.05);
  st += '</g><g class="m-base">' + box(-13, -4.5, 1.2, 26, 9, 1.2);
  st += lineSvg([[-12.4, -3.9, 2.4], [12.4, -3.9, 2.4], [12.4, 3.9, 2.4], [-12.4, 3.9, 2.4], [-12.4, -3.9, 2.4]]);
  for (const [x, y] of [[-12.3, -3.8], [12.3, -3.8], [-12.3, 3.8], [12.3, 3.8]]) st += dot(x, y, 2.4);
  st += '</g><g class="m-brass">' + box(-4.2, 2.2, 2.4, 3.4, 1.4, 0.2);
  st += lineSvg([[-3.8, 2.6, 2.6], [-1.6, 2.6, 2.6]], 'lo free') + lineSvg([[-3.8, 2.95, 2.6], [-2.2, 2.95, 2.6]], 'lo free') + lineSvg([[-3.8, 3.3, 2.6], [-1.2, 3.3, 2.6]], 'lo free');
  st += dot(-4.0, 2.4, 2.6, 0.12) + dot(-1.0, 3.4, 2.6, 0.12) + '</g>';
  st += '<g class="m-steel">' + box(-1.4, -1.4, 2.4, 2.8, 2.8, 0.8) + box(-0.9, -0.9, 3.2, 1.8, 1.8, 9.2) + box(-1.2, -1.2, 12.4, 2.4, 2.4, 0.8);
  st += lineSvg([[-0.9, 0.9, 7.8], [0.9, 0.9, 7.8], [0.9, -0.9, 7.8]], 'lo') + '</g>';
  st += '<g class="m-base">' + box(-2.6, 0.9, 9.4, 5.2, 0.2, 2.1);
  for (let k = -5; k <= 5; k++) { const x = k * 0.44, maj = k % 5 === 0; st += lineSvg([[x, 1.1, 11.5], [x, 1.1, 11.5 - (maj ? 0.75 : 0.42)]], k === 0 ? 'hi' : maj ? '' : 'lo'); }
  st += dot(-2.3, 1.1, 9.7, 0.11) + dot(2.3, 1.1, 9.7, 0.11) + '</g>';
  host.querySelector('#al-bal-static').innerHTML = st;
  const liveG = host.querySelector('#al-bal-live');

  let eq = 0, X = 2, th = 0, om = 0, rm = 0;
  const target = () => { const [a, b] = EQS[eq]; return clamp((X + a - b) * 2.6, -14, 14) * D2R; };
  const pan = (cx, cz, items, H) => {
    const z = cz, x0 = cx - PAN, y0 = -PAN;
    let s = '<g class="m-steel">' + box(x0, y0, z, 2 * PAN, 2 * PAN, 0.4) + box(x0, y0, z + 0.4, 2 * PAN, 0.25, 0.7) + box(x0, y0 + 0.25, z + 0.4, 0.25, 2 * PAN - 0.25, 0.7) + '</g>';
    const top = z + 1.1;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1]]) s += lineSvg([H, [cx + dx * (PAN - 0.12), dy * (PAN - 0.12), top]], 'str');
    items.sort((p, q) => p.d - q.d);
    for (const it of items) s += it.s;
    s += lineSvg([H, [cx + PAN - 0.12, PAN - 0.12, top]], 'str');
    s += '<g class="m-steel">' + box(x0 + 2 * PAN - 0.25, y0 + 0.25, z + 0.4, 0.25, 2 * PAN - 0.25, 0.7) + box(x0, y0 + 2 * PAN - 0.25, z + 0.4, 2 * PAN - 0.25, 0.25, 0.7) + '</g>';
    return s;
  };
  const units = (cx, cz, cells, count, gone) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const [ux, uy] = cells[i], k = gone(i), z = cz + 0.4 + k * 6;
      if (k >= 0.999) continue;
      out.push({ d: cx + ux + uy + z, s: `<g class="m-unit"${k > 0 ? ` opacity="${r2(1 - k)}"` : ''}>${box(cx + ux - UNIT / 2, uy - UNIT / 2, z, UNIT, UNIT, UNIT)}${topText(cx + ux, uy, z + UNIT, '1', 0.62, 'v')}</g>` });
    }
    return out;
  };
  const draw = () => {
    const [a, b] = EQS[eq], T = rotY(th, PIV[0], PIV[2]);
    const HL = T([-HOOK, 0, 13.4]), HR = T([HOOK, 0, 13.4]);
    const zl = HL[2] - DROP, zr = HR[2] - DROP;
    const lift = ease(clamp(rm, 0, 1));
    // left pan: the x box plus a units; right pan: b units. Removing takes the a nearest units from each side.
    const li = units(HL[0], zl, LEFT, a, (i) => lift);
    li.push({ d: HL[0] - 2.2 + zl, s: `<g class="m-x al-lit">${box(HL[0] - 2.25, -2.25, zl + 0.4, 2.2, 2.2, 2.2)}${topText(HL[0] - 1.15, -1.15, zl + 2.6, 'x', 1.7)}</g>` });
    const ri = units(HR[0], zr, RIGHT, b, (i) => (i >= b - a ? lift : 0)); // the a front-most blocks leave
    let s = pan(HL[0], zl, li, HL) + pan(HR[0], zr, ri, HR);
    s += '<g class="m-steel">' + cuboid(-0.7, -1.1, 13.2, 0.7, -0.45, 14.8) + '</g>'; // back prong of the fork
    s += '<g class="m-steel">' + cuboid(-HOOK - 0.3, -0.3, 13.4, -HOOK + 0.3, 0.3, 14.0, T) + cuboid(HOOK - 0.3, -0.3, 13.4, HOOK + 0.3, 0.3, 14.0, T) + '</g>';
    s += '<g class="m-brass">' + cuboid(-9.2, -0.45, 14.0, 9.2, 0.45, 14.8, T);
    for (let k = -8; k <= 8; k++) { const maj = k % 4 === 0; s += lineSvg([T([k, 0.45, 14.8]), T([k, 0.45 - (maj ? 0.5 : 0.28), 14.8])], k === 0 ? 'hi' : maj ? '' : 'lo'); }
    s += '</g><g class="m-steel">' + cuboid(-0.7, 0.45, 13.2, 0.7, 1.1, 14.8) + cuboid(-0.55, 1.1, 13.85, 0.55, 1.32, 14.95, T) + '</g>'; // front prong, then the hub
    s += lineSvg([T([0, 1.4, 14.4]), T([0, 1.4, 10.3])], 'needle') + dot(...T([0, 1.36, 14.4]), 0.2);
    liveG.innerHTML = s;
  };
  const kick = animator(host, (dt) => {
    const tg = target();
    if (reduced) { th = tg; om = 0; draw(); return false; }
    const k = 42, c = 2 * Math.sqrt(k) * 0.38; // underdamped: a short, calm wobble
    om += (-k * (th - tg) - c * om) * dt;
    th += om * dt;
    const still = Math.abs(th - tg) < 2e-4 && Math.abs(om) < 2e-4;
    if (still) th = tg;
    draw();
    return !still;
  });

  const sx = slider({ id: 'al-bal-x', label: 'Valor de <i>x</i>', min: 0, max: 10, step: 1, value: X });
  const btns = el(`<div class="btn-row"><button type="button" class="btn sm" data-a="solve">Isolar o <i>x</i></button><button type="button" class="btn sm" data-a="next">Outra equação</button></div>`);
  ctl.append(sx.el, btns);
  let phase = 0, runId = 0; // phase 0 testing, 1 removing, 2 solved; runId cancels a running solve
  const text = () => {
    const [a, b] = EQS[eq], L = X + a, R = b;
    const test = L === R ? `com <i>x</i> = ${X}: ${X} + ${a} = ${R}, equilibra` : `com <i>x</i> = ${X}: ${X} + ${a} = ${L}, ${L < R ? 'menos' : 'mais'} que ${R}`;
    f.innerHTML = `<span class="al-line"><i>x</i> + ${a} = ${b}</span>` +
      `<span class="al-line${phase ? ' off' : ''}"><small>${test}</small></span>` +
      `<span class="al-line${phase ? '' : ' off'}"><i>x</i> + ${a} − ${a} = ${b} − ${a}</span>` +
      `<span class="al-line${phase === 2 ? ' on' : ' off'}"><i>x</i> = ${b - a}</span>`;
    live.textContent = `esquerda ${L} · direita ${R}${L === R ? ' · equilibrou' : ''}`;
  };
  const undo = () => { runId++; if (phase) { phase = 0; const me = runId; tween(rm, 0, 400, (v) => { if (me === runId) { rm = v; kick(); } }); } };
  sx.on((v) => { X = v; undo(); text(); kick(); });
  btns.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-a]');
    if (!b) return;
    if (b.dataset.a === 'next') { runId++; eq = (eq + 1) % EQS.length; phase = 0; rm = 0; text(); kick(); draw(); return; }
    if (phase) return;
    phase = 1; text();
    const me = ++runId;
    tween(0, 1, 900, (v) => { if (me === runId) { rm = v; kick(); } }, () => {
      if (me !== runId) return;
      const goal = EQS[eq][1] - EQS[eq][0];
      tween(sx.value, goal, 600, (v) => { if (me !== runId) return; X = Math.round(v); sx.input.value = X; sx.el.querySelector('output').textContent = X; text(); kick(); }, () => { if (me !== runId) return; X = goal; phase = 2; text(); kick(); });
    });
  });
  th = target(); text(); draw();
  if (!reduced) { th = 0; kick(); } // the beam settles once from level when the figure first runs
}

/* ========================================================== 2 · (a + b)² (anatomy figure) ======== */
const SQ_STEPS = {
  todo: { label: 'Quadrado (a + b)²', on: [], links: [[438, 'Base × altura é a área'], [443, 'Um quadrado de lado a + b']] },
  a2: { label: 'a²', on: ['A'], links: [[450, 'Fechar o quadrado no tamanho de a']] },
  b2: { label: 'b²', on: ['B'], links: [[458, 'O quadradinho do tamanho de b']] },
  ab: { label: '2ab', on: ['X', 'Y'], links: [[464, 'Esse lado vezes esse lado: a·b'], [472, 'Tenho dois deles']] },
  soma: { label: 'Soma', on: ['A', 'X', 'Y', 'B'], links: [[472, 'A soma das áreas é a área toda'], [479, 'Por isso (a + b)² = a² + 2ab + b²']] },
};
const t2 = el(`
<article class="topic flip">
  <div class="stage-col">
    <div class="stage al-fig" id="al-quad"></div>
    <p class="stage-cap">Um gabarito de marceneiro: um esquadro com réguas e quatro ladrilhos encostados nele. Os lados medem <i>a</i> + <i>b</i> nas duas réguas.</p>
    <div class="controls" id="al-quad-ctl"></div>
  </div>
  <div class="explain">
    <p class="kicker">Produtos notáveis</p>
    <h3>(<i>a</i> + <i>b</i>)² nasce de quatro áreas</h3>
    <p>O quadrado da soma é o quadrado do primeiro, mais duas vezes o primeiro pelo segundo, mais o quadrado do segundo.</p>
    <p>De onde vem isso? A área de um retângulo é base × altura. Um quadrado de lado <i>a</i> + <i>b</i> tem área (<i>a</i> + <i>b</i>)·(<i>a</i> + <i>b</i>) = (<i>a</i> + <i>b</i>)². Feche nele um quadrado de lado <i>a</i> e um quadradinho de lado <i>b</i>. Sobram dois retângulos de <i>a</i> por <i>b</i>.</p>
    <div class="formula">(<i>a</i> + <i>b</i>)² = <i>a</i>² + 2<i>ab</i> + <i>b</i>²</div>
    <div class="formula" id="al-quad-f" aria-live="polite"></div>
    ${vlinks([[426, 'Produtos notáveis'], [432, 'O quadrado do primeiro, mais duas vezes…']])}
  </div>
</article>`);
root.append(t2);
{
  const host = t2.querySelector('#al-quad');
  const ctl = t2.querySelector('#al-quad-ctl');
  const f = t2.querySelector('#al-quad-f');
  const PZ = 1.6, TH = 0.7, FH = 1.2, MAX = 11;
  const vb = fitView([[-3.2, -3.2, 0], [14.4, -3.2, 0], [14.4, 14.4, 0], [-3.2, 14.4, 0], [-1.6, -1.6, PZ + FH], [12.6, 12.6, PZ + TH + 1.6]], 4 / 3, 3, 2.2, 1.4);
  host.innerHTML = `<svg class="al-iso" viewBox="${vb}" role="img" aria-label="Quadrado de lado a + b dividido em a², dois retângulos ab e b², em perspectiva isométrica.">
    <defs><filter id="al-blur-sq" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.8"/></filter></defs>
    <g id="al-quad-static"></g><g id="al-quad-live"></g></svg>`;
  const live = corners(host, 2, 'Gabarito do quadrado', 'mexa em a e b, depois separe');

  // base plate on feet, screws, a label plate on the free front margin, and the L-square fence
  let st = halo([[-3.2, -3.2, 0], [14.4, -3.2, 0], [14.4, 14.4, 0], [-3.2, 14.4, 0]], 'al-blur-sq') + '<g class="m-steel">';
  for (const [x, y] of [[-2, -2], [13.2, -2], [-2, 13.2], [13.2, 13.2]].sort((p, q) => p[0] + p[1] - q[0] - q[1])) st += cyl(x, y, 0, 0.45, 0.8);
  st += '</g><g class="m-base">' + box(-3.2, -3.2, 0.45, 17.6, 17.6, PZ - 0.45);
  st += lineSvg([[-2.7, 14.0, PZ], [14.0, 14.0, PZ], [14.0, -2.7, PZ]]);
  for (const [x, y] of [[-2.6, 13.8], [13.8, 13.8], [13.8, -2.6]]) st += dot(x, y, PZ, 0.13);
  st += '</g><g class="m-brass">' + box(9.4, 12.9, PZ, 3.6, 1.1, 0.15);
  st += lineSvg([[9.8, 13.2, PZ + 0.15], [12.2, 13.2, PZ + 0.15]], 'lo free') + lineSvg([[9.8, 13.6, PZ + 0.15], [11.4, 13.6, PZ + 0.15]], 'lo free') + '</g>';
  st += '<g class="m-steel">' + box(-1.6, -1.6, PZ, 1.4, 1.4, FH) + box(-0.2, -1.6, PZ, 13.2, 1.4, FH) + box(-1.6, -0.2, PZ, 1.4, 13.2, FH) + '</g>';
  host.querySelector('#al-quad-static').innerHTML = st;
  const liveG = host.querySelector('#al-quad-live');

  let A = 5, B = 3, sep = 0, step = 'todo', lift = { A: 0, X: 0, Y: 0, B: 0 };
  const ruler = (L) => { // ticks hang from the fences' inner top edges; the a and b spans are inlaid strips
    const z = PZ + FH;
    let s = `<path class="strip-a" d="${d3([[0, -1.25, z], [A, -1.25, z], [A, -0.75, z], [0, -0.75, z]])}"/><path class="strip-b" d="${d3([[A, -1.25, z], [A + B, -1.25, z], [A + B, -0.75, z], [A, -0.75, z]])}"/>`;
    s += `<path class="strip-a" d="${d3([[-1.25, 0, z], [-0.75, 0, z], [-0.75, A, z], [-1.25, A, z]])}"/><path class="strip-b" d="${d3([[-1.25, A, z], [-0.75, A, z], [-0.75, A + B, z], [-1.25, A + B, z]])}"/>`;
    for (let v = 0; v <= L + 1e-9; v += 0.5) {
      const maj = Math.abs(v - Math.round(v)) < 1e-9, len = maj ? 0.55 : 0.32;
      const cls = Math.abs(v - A) < 1e-9 || Math.abs(v - A - B) < 1e-9 || v === 0 ? 'hi' : maj ? '' : 'lo';
      s += lineSvg([[v, -0.2, z], [v, -0.2 - (cls === 'hi' ? 0.9 : len), z]], cls) + lineSvg([[-0.2, v, z], [-0.2 - (cls === 'hi' ? 0.9 : len), v, z]], cls);
    }
    return s;
  };
  const tile = (key, x, y, w, d, cls, txt, val) => {
    const z = PZ + lift[key], dim = SQ_STEPS[step].on.length && !SQ_STEPS[step].on.includes(key);
    const fs = clamp(Math.min(w, d) * 0.34, 0.55, 1.7);
    let s = `<g class="${cls}${dim ? ' al-dim' : ''}${SQ_STEPS[step].on.includes(key) && step !== 'soma' ? ' al-lit' : ''}">${box(x + 0.04, y + 0.04, z, w - 0.08, d - 0.08, TH)}`;
    s += topText(x + w / 2, y + d / 2 - fs * 0.32, z + TH, txt, fs) + topText(x + w / 2, y + d / 2 + fs * 0.62, z + TH, val, fs * 0.55, 'v') + '</g>';
    return s;
  };
  const draw = () => {
    const g = sep * 1.4;
    const area = (v) => n1(v);
    let s = `<g class="m-steel">${ruler(MAX + 1)}</g>`;
    s += tile('A', 0, 0, A, A, 'm-a', 'a²', area(A * A));
    s += tile('Y', 0, A + g, A, B, 'm-ab', 'ab', area(A * B));
    s += tile('X', A + g, 0, B, A, 'm-ab', 'ab', area(A * B));
    s += tile('B', A + g, A + g, B, B, 'm-b', 'b²', area(B * B));
    liveG.innerHTML = s;
  };
  const sync = () => {
    const S = A + B;
    f.innerHTML = `(${n1(A)} + ${n1(B)})² = ${n1(S)}² = <b>${n1(S * S)}</b><br>${n1(A)}² + 2·${n1(A)}·${n1(B)} + ${n1(B)}² = ${n1(A * A)} + ${n1(2 * A * B)} + ${n1(B * B)} = <b>${n1(A * A + 2 * A * B + B * B)}</b>`;
    live.textContent = `(${n1(A)} + ${n1(B)})² = ${n1(A * A)} + ${n1(2 * A * B)} + ${n1(B * B)} = ${n1(S * S)}`;
  };
  const sa = slider({ id: 'al-quad-a', label: 'Lado <i>a</i>', min: 1, max: 6, step: 0.5, value: A, format: n1 });
  const sb = slider({ id: 'al-quad-b', label: 'Lado <i>b</i>', min: 1, max: 5, step: 0.5, value: B, format: n1 });
  const seg = segmented({ label: 'Mostrar', options: Object.entries(SQ_STEPS).map(([k, v]) => ({ value: k, label: v.label })), value: 'todo' });
  const sepBtn = el(`<div class="btn-row"><button type="button" class="btn sm" aria-pressed="false">Separar as peças</button></div>`);
  const links = el('<div class="al-steplinks"></div>');
  ctl.append(sa.el, sb.el, seg.el, sepBtn, links);
  sa.on((v) => { A = v; sync(); draw(); });
  sb.on((v) => { B = v; sync(); draw(); });
  let goal = { A: 0, X: 0, Y: 0, B: 0 }, sepGoal = 0;
  const kick = animator(host, (dt) => {
    const k = reduced ? 1 : 1 - Math.exp(-dt * 8);
    let moving = false;
    for (const key in lift) { lift[key] += (goal[key] - lift[key]) * k; if (Math.abs(goal[key] - lift[key]) > 1e-3) moving = true; else lift[key] = goal[key]; }
    sep += (sepGoal - sep) * k;
    if (Math.abs(sepGoal - sep) > 1e-3) moving = true; else sep = sepGoal;
    draw();
    return moving;
  });
  const setStep = (k) => {
    step = k;
    for (const key in goal) goal[key] = SQ_STEPS[k].on.includes(key) && k !== 'soma' ? 1.1 : 0;
    links.innerHTML = vlinks(SQ_STEPS[k].links);
    if (k !== 'todo' && sepGoal === 0) { sepGoal = 1; sepBtn.firstElementChild.setAttribute('aria-pressed', 'true'); }
    if (k === 'soma') { sepGoal = 0; sepBtn.firstElementChild.setAttribute('aria-pressed', 'false'); } // the pieces close back into the big square
    kick();
  };
  seg.on(setStep);
  sepBtn.firstElementChild.addEventListener('click', (e) => {
    sepGoal = sepGoal ? 0 : 1;
    e.currentTarget.setAttribute('aria-pressed', String(!!sepGoal));
    kick();
  });
  links.innerHTML = vlinks(SQ_STEPS.todo.links);
  sync(); draw();
}

/* ========================================================== 3 · Perímetro: a cerca do terreno (3D) ======== */
const PER_STEPS = {
  soma: { links: [[488, 'Um retângulo de lados x e y'], [494, 'Perímetro: a soma de todos os lados'], [501, 'Esse lado é igual àquele'], [507, 'x + y + x + y']] },
  junta: { links: [[514, 'Não dá para somar x com y'], [519, 'Banana e maçã'], [525, 'Banana com banana: 2x + 2y']] },
  evid: { links: [[525, 'Colocar o 2 em evidência'], [533, 'Ainda mais simpática: 2(x + y)']] },
};
const t3 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage" id="al-per"></div>
    <p class="stage-cap">Um terreno cercado. Os lados <i>x</i> são as bananas e os lados <i>y</i> são as maçãs. Escolha a etapa e veja a cerca se desmontar em fileiras.</p>
    <div class="controls" id="al-per-ctl"></div>
  </div>
  <div class="explain">
    <p class="kicker">Expressões algébricas</p>
    <h3>O perímetro de qualquer retângulo</h3>
    <p>Álgebra é manipular letras com operações. Num retângulo de lados <i>x</i> e <i>y</i>, o perímetro é a soma de todos os lados. Os lados opostos são iguais, então ficamos com <i>x</i> + <i>y</i> + <i>x</i> + <i>y</i>.</p>
    <p>A ideia é sempre simplificar. Não dá para somar <i>x</i> com <i>y</i>, porque são variáveis distintas: é como banana e maçã. Só banana com banana e maçã com maçã. Daí vem 2<i>x</i> + 2<i>y</i>, e com o 2 em evidência, 2(<i>x</i> + <i>y</i>).</p>
    <div class="al-chips"><span class="al-chip" style="--h:48"><i>x</i> = banana</span><span class="al-chip" style="--h:4"><i>y</i> = maçã</span></div>
    <div class="formula" id="al-per-f" aria-live="polite"></div>
    <div class="stats" id="al-per-stats"></div>
    <div class="pick" id="al-per-pick" aria-live="polite"></div>
    <p class="note">Com a expressão na mão, escolha qualquer retângulo nos controles e o perímetro sai na hora. Isso já é a fronteira com a <a href="#geometria">geometria</a>, o próximo capítulo.</p>
    ${vlinks([[541, 'Escolha o retângulo que quiser'], [546, 'Fronteira com a geometria']])}
  </div>
</article>`);
root.append(t3);
{
  const ctl = t3.querySelector('#al-per-ctl');
  const f = t3.querySelector('#al-per-f'), stats = t3.querySelector('#al-per-stats'), pick = t3.querySelector('#al-per-pick');
  const sx = slider({ id: 'al-per-x', label: 'Lado <i>x</i>', min: 1, max: 8, step: 0.5, value: 5, format: n1 });
  const sy = slider({ id: 'al-per-y', label: 'Lado <i>y</i>', min: 1, max: 8, step: 0.5, value: 3, format: n1 });
  const seg = segmented({ label: 'Etapa', options: [{ value: 'soma', label: '1 · x + y + x + y' }, { value: 'junta', label: '2 · 2x + 2y' }, { value: 'evid', label: '3 · 2(x + y)' }], value: 'soma' });
  const links = el('<div class="al-steplinks"></div>');
  ctl.append(sx.el, sy.el, seg.el, links);
  let X = 5, Y = 3, step = 'soma', side = -1;
  const PICKS = {
    x: ['<i>x</i> é banana', 'Os dois lados horizontais medem <i>x</i>. Somar <i>x</i> com <i>x</i> dá 2<i>x</i>, como banana com banana. Já <i>x</i> + <i>y</i> não vira uma letra só: são variáveis distintas.', [[514, 'Variáveis distintas'], [519, 'Banana com maçã não se soma']]],
    y: ['<i>y</i> é maçã', 'Os dois lados verticais medem <i>y</i>. Maçã com maçã dá 2<i>y</i>. Com bananas e maçãs separadas, o perímetro fica 2<i>x</i> + 2<i>y</i>.', [[519, 'Banana e maçã'], [525, 'Daí vem 2x + 2y']]],
  };
  const text = () => {
    const p = 2 * X + 2 * Y, x = n1(X), y = n1(Y), on = (i, h) => `<span${side === i ? ' class="on"' : ''}>${h}</span>`;
    f.innerHTML = step === 'soma'
      ? `${on(0, '<i>x</i>')} + ${on(1, '<i>y</i>')} + ${on(2, '<i>x</i>')} + ${on(3, '<i>y</i>')} = ${x} + ${y} + ${x} + ${y} = <b>${n1(p)}</b>`
      : step === 'junta'
        ? `<i>x</i> + <i>x</i> + <i>y</i> + <i>y</i> = 2<i>x</i> + 2<i>y</i> = 2·${x} + 2·${y} = <b>${n1(p)}</b>`
        : `2<i>x</i> + 2<i>y</i> = 2(<i>x</i> + <i>y</i>) = 2·(${x} + ${y}) = <b>${n1(p)}</b>`;
    stats.innerHTML = `<div class="stat"><b>${x}</b><span>lado <i>x</i></span></div><div class="stat"><b>${y}</b><span>lado <i>y</i></span></div><div class="stat"><b>${n1(p)}</b><span>perímetro</span></div>`;
  };
  links.innerHTML = vlinks(PER_STEPS.soma.links);
  pickCard(pick, ...PICKS.x);
  text();

  const s3 = stage(t3.querySelector('#al-per'), {
    camera: [0.4, 4.5, 7.0], target: [0, 0.1, 1.1], fov: 40,
    label: 'Terreno retangular cercado. Os quatro trechos de cerca se desmontam em duas fileiras: primeiro bananas com bananas e maçãs com maçãs, depois duas fileiras de x + y.',
    hint: 'arraste para girar · clique em x ou y',
  });
  if (s3) {
    const U = 0.42, PZ = -1.0, RZ = [1.75, 2.75], GAP = 0.16;
    const grid = new THREE.GridHelper(12, 24, 0xffffff, 0xffffff); // white vertex colours, tinted by the material for both themes
    grid.material.color.set(color('--line')); grid.material.transparent = true; grid.material.opacity = 0.7;
    s3.add(grid);
    const plotMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(hueColor(120)), transparent: true, opacity: 0.22, roughness: 0.9 });
    const plot = new THREE.Mesh(new THREE.BoxGeometry(1, 0.04, 1), plotMat);
    plot.position.set(0, 0.02, PZ);
    s3.add(plot);
    const railGeo = new THREE.BoxGeometry(1, 0.085, 0.07).translate(0.5, 0, 0);
    const postGeo = new THREE.CylinderGeometry(0.05, 0.062, 0.74, 14).translate(0, 0.37, 0);
    const capGeo = new THREE.SphereGeometry(0.068, 14, 10);
    const postMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color('--muted')), roughness: 0.7 });
    const KIND = ['x', 'y', 'x', 'y'], HUE = { x: 48, y: 4 };
    const railMat = { x: new THREE.MeshStandardMaterial({ color: new THREE.Color(hueColor(48)), roughness: 0.5 }), y: new THREE.MeshStandardMaterial({ color: new THREE.Color(hueColor(4)), roughness: 0.5 }) };
    const glowMat = { x: railMat.x.clone(), y: railMat.y.clone() };
    for (const k of ['x', 'y']) { glowMat[k].emissive = new THREE.Color(hueColor(HUE[k])); glowMat[k].emissiveIntensity = 0.55; }
    const segs = KIND.map((kind, i) => {
      const g = new THREE.Group();
      const rails = [0.27, 0.52].map((y) => { const m = new THREE.Mesh(railGeo, railMat[kind]); m.position.y = y; g.add(m); return m; });
      const posts = [0, 1].map(() => { const p = new THREE.Mesh(postGeo, postMat); const c = new THREE.Mesh(capGeo, postMat); c.position.y = 0.76; p.add(c); g.add(p); return p; });
      const tok = s3.label(`<span style="--h:${HUE[kind]}">${kind}</span>`, [0, 1.05, 0], { cls: 'al-tok', parent: g, onClick: () => pickCard(pick, ...PICKS[kind]) });
      tok.element.setAttribute('aria-label', kind === 'x' ? 'Lado x: banana' : 'Lado y: maçã');
      s3.add(g);
      return { g, kind, rails, posts, tok, pos: new THREE.Vector3(), rot: 0, from: [0, 0, 0, 0], to: [0, 0, 0, 0] };
    });
    const rowLab = [0, 1].map((r) => { const o = s3.label('', [0, 0.45, RZ[r]], { cls: 'plain al-row' }); o.visible = false; return o; });
    const outline = new THREE.LineLoop(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)), new THREE.LineBasicMaterial({ color: new THREE.Color(color('--ink')), transparent: true, opacity: 0.45 }));
    s3.add(outline);
    const runner = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), new THREE.MeshStandardMaterial({ color: new THREE.Color(hueColor(268)), emissive: new THREE.Color(hueColor(268)), emissiveIntensity: 0.4 }));
    s3.add(runner);

    const len = (s) => (s.kind === 'x' ? X : Y) * U;
    const layout = (k) => { // [x, z, rotation] where each panel starts, panel runs along its local +x
      const W = X * U, H = Y * U;
      if (k === 'soma') return [[-W / 2, PZ + H / 2, 0], [W / 2, PZ + H / 2, Math.PI / 2], [W / 2, PZ - H / 2, Math.PI], [-W / 2, PZ - H / 2, -Math.PI / 2]];
      if (k === 'junta') { const a = -(2 * W + GAP) / 2, b = -(2 * H + GAP) / 2; return [[a, RZ[0], 0], [b, RZ[1], 0], [a + W + GAP, RZ[0], 0], [b + H + GAP, RZ[1], 0]]; }
      const a = -(W + H + GAP) / 2;
      return [[a, RZ[0], 0], [a + W + GAP, RZ[0], 0], [a, RZ[1], 0], [a + W + GAP, RZ[1], 0]];
    };
    const place = (s, x, z, r) => { s.g.position.set(x, 0, z); s.g.rotation.y = r; };
    const shape = () => {
      for (const s of segs) {
        const L = len(s);
        for (const r of s.rails) r.scale.x = L;
        s.posts[0].position.x = 0.06; s.posts[1].position.x = L - 0.06;
        s.tok.position.set(L / 2, 1.05, 0);
      }
      const W = X * U, H = Y * U;
      plot.scale.set(W + 0.5, 1, H + 0.5);
      const a = outline.geometry.attributes.position;
      [[-W / 2, PZ - H / 2], [W / 2, PZ - H / 2], [W / 2, PZ + H / 2], [-W / 2, PZ + H / 2]].forEach(([x, z], i) => a.setXYZ(i, x, 0.05, z));
      a.needsUpdate = true;
      const rows = step === 'junta' ? [2 * W + GAP, 2 * H + GAP] : [W + H + GAP, W + H + GAP];
      rowLab.forEach((o, r) => {
        o.position.set(-rows[r] / 2 - 0.55, 0.45, RZ[r]);
        o.visible = step !== 'soma';
        o.element.innerHTML = step === 'junta' ? (r ? '2<i>y</i> =' : '2<i>x</i> =') : '(<i>x</i> + <i>y</i>)';
      });
    };
    let anim = null;
    const snap = () => { const L = layout(step); segs.forEach((s, i) => place(s, ...L[i])); };
    shape(); snap();
    const go = (k) => {
      const prev = step;
      step = k;
      shape();
      text();
      links.innerHTML = vlinks(PER_STEPS[k].links);
      const L = layout(k);
      if (reduced || prev === k) { snap(); return; }
      segs.forEach((s, i) => { s.from = [s.g.position.x, s.g.position.z, s.g.rotation.y]; s.to = L[i]; });
      anim = { t0: performance.now() / 1000 };
    };
    seg.on(go);
    const onSize = () => { X = sx.value; Y = sy.value; shape(); if (!anim) snap(); else { const L = layout(step); segs.forEach((s, i) => { s.to = L[i]; }); } text(); };
    sx.on(onSize); sy.on(onSize);

    let run = 0;
    s3.onFrame((t, dt) => {
      if (anim) {
        const el0 = t - anim.t0;
        let done = true;
        segs.forEach((s, i) => {
          const k0 = (el0 - i * 0.12) / 0.9, k = k0 <= 0 ? 0 : k0 >= 1 ? 1 : ease(k0);
          if (k0 < 1) done = false;
          const [x0, z0, r0] = s.from, [x1, z1, r1] = s.to;
          place(s, x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, r0 + (r1 - r0) * k);
          s.g.position.y = Math.sin(Math.PI * k) * 0.5; // panels lift off the ground while they travel
        });
        if (done) { anim = null; snap(); }
      }
      // a runner walks the fence in step 1 and lights the side it is on
      const walking = step === 'soma' && !anim && !reduced;
      runner.visible = walking;
      let cur = -1;
      if (walking) {
        const W = X * U, H = Y * U, per = 2 * (W + H);
        run = (run + dt * 1.1) % per;
        let d = run;
        const L = layout('soma');
        for (let i = 0; i < 4; i++) {
          const sl = i % 2 ? H : W;
          if (d <= sl) { cur = i; const [x, z, r] = L[i]; runner.position.set(x + Math.cos(r) * d, 0.95, z - Math.sin(r) * d); break; }
          d -= sl;
        }
      }
      if (cur !== side) {
        side = cur;
        segs.forEach((s, i) => { for (const r of s.rails) r.material = i === side ? glowMat[s.kind] : railMat[s.kind]; s.tok.element.classList.toggle('on', i === side); });
        text();
      }
    });
    onTheme(() => {
      for (const k of ['x', 'y']) { railMat[k].color.set(hueColor(HUE[k])); glowMat[k].color.set(hueColor(HUE[k])); glowMat[k].emissive.set(hueColor(HUE[k])); }
      postMat.color.set(color('--muted'));
      plotMat.color.set(hueColor(120));
      outline.material.color.set(color('--ink'));
      grid.material.color.set(color('--line'));
      runner.material.color.set(hueColor(268)); runner.material.emissive.set(hueColor(268));
    });
  } else {
    seg.on((k) => { step = k; text(); links.innerHTML = vlinks(PER_STEPS[k].links); });
    const onSize = () => { X = sx.value; Y = sy.value; text(); };
    sx.on(onSize); sy.on(onSize);
  }
}
