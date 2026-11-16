// Chapter 4 · Geometria (09:06–12:20 of the video): flat vs. solid, kinds of triangle, the 180° sum, area,
// Pythagoras (tanks and the (a+b)² proof) and the law of cosines. Every model is driven by the same numbers it prints.
import { THREE, mount, el, css, vlink, vlinks, stage, slider, segmented, hueColor, onTheme, reduced, mat, tween, ease, br, floorGrid } from './core.js';

const root = mount('geometria');
const H = { a: 210, b: 28, c: 152, g: 330, w: 205 }; // hues: side a, side b, side c / chapter, third angle, water

css(`
#geometria .pick[hidden] { display: none; }
#geometria .ge-row { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; }
#geometria .ge-tag { font: 600 12px/1 var(--f-mono); padding: 4px 7px; border-radius: 5px; background: var(--hue-soft); color: var(--hue); }
#geometria .ge-a { --hue: hsl(${H.a} var(--hue-s) var(--hue-l)); --hue-soft: hsl(${H.a} 55% var(--hue-soft-l)); }
#geometria .ge-b { --hue: hsl(${H.b} var(--hue-s) var(--hue-l)); --hue-soft: hsl(${H.b} 55% var(--hue-soft-l)); }
#geometria .ge-g { --hue: hsl(${H.g} var(--hue-s) var(--hue-l)); --hue-soft: hsl(${H.g} 55% var(--hue-soft-l)); }
#geometria .lbl .ge-a, #geometria .lbl .ge-b, #geometria .lbl .ge-g, #geometria .lbl .ge-c { color: var(--hue); }
#geometria .lbl.hot:hover span, #geometria .lbl.hot.on span { color: inherit; }
#geometria .ge-svg { touch-action: pan-y; }
#geometria .ge-svg text { font: 500 13px/1 var(--f-body); fill: var(--ink); }
#geometria .ge-svg .math { font: italic 400 16px/1 var(--f-math); }
#geometria .ge-svg .ink { stroke: var(--ink); fill: none; }
#geometria .ge-svg .faint { stroke: var(--muted); fill: none; stroke-dasharray: 4 4; }
#geometria .ge-svg .fill-soft { fill: var(--hue-soft); stroke: var(--hue); stroke-width: 1.5; }
#geometria .ge-svg .hue-s { stroke: var(--hue); fill: none; }
#geometria .ge-svg .hue-f { fill: var(--hue); }
#geometria .ge-svg .muted-t { fill: var(--muted); }
#geometria .formula output { font: inherit; }
#geometria .ge-zero { color: var(--mark); font-weight: 600; }
#geometria .btn:disabled { opacity: .45; cursor: not-allowed; }
`);

/* ------------------------------------------------------------ shared local helpers ---- */
const themed = [];
/** Color a material from a token function now and on every theme change. */
const tint = (m, fn) => { m.color.set(fn()); themed.push([m, fn]); return m; };
onTheme(() => themed.forEach(([m, fn]) => m.color.set(fn())));
const hc = (h) => () => hueColor(h);
const deg = (r) => (r * 180) / Math.PI;
const rad = (d) => (d * Math.PI) / 180;

/** The .pick card of a topic: show(button, title, body, second, hint). */
function picker(art) {
  const box = art.querySelector('.pick');
  let on = null;
  return (btn, title, body, seg, hint) => {
    on?.classList.remove('on');
    on = btn || null;
    on?.classList.add('on');
    box.innerHTML = `<h4>${title}</h4><p>${body}</p>${vlink(seg, hint)}`;
    box.hidden = false;
  };
}

/** Sides (a = BC, b = CA, c = AB) and angles (degrees) of a triangle given as [[x,z]×3]. */
function measure(P) {
  const d = (i, j) => Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]);
  const a = d(1, 2), b = d(2, 0), c = d(0, 1);
  const ang = (o, p, q) => deg(Math.acos(Math.max(-1, Math.min(1, (p * p + q * q - o * o) / (2 * p * q)))));
  return { s: [a, b, c], A: [ang(a, b, c), ang(b, c, a), ang(c, a, b)] };
}
const triArea = (P) => Math.abs((P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1])) / 2;
const centroid = (P) => [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3];
/** Names by sides and by angles, with a small tolerance so a hand-dragged triangle can still be "right". */
function kind(m) {
  const [a, b, c] = m.s;
  const eq = (x, y) => Math.abs(x - y) / Math.max(x, y) < 0.025;
  const bySide = eq(a, b) && eq(b, c) ? 'equilátero' : eq(a, b) || eq(b, c) || eq(a, c) ? 'isósceles' : 'escaleno';
  const big = Math.max(...m.A);
  const byAngle = Math.abs(big - 90) < 1.2 ? 'retângulo' : big > 90 ? 'obtusângulo' : 'acutângulo';
  return { bySide, byAngle };
}
console.assert(Math.abs(measure([[0, 0], [3, 0], [0, 4]]).s[0] - 5) < 1e-9, 'geometria: 3-4-5');
console.assert(Math.abs(measure([[0, 0], [3, 0], [0, 4]]).A.reduce((x, y) => x + y) - 180) < 1e-9, 'geometria: soma 180');

// Solid over a triangle on the XZ plane: bottom face, top face pulled toward the centroid by k (k = 1 gives a
// tetrahedron), and three walls. Positions are rewritten in place, so morphing allocates nothing.
const FACES = [0, 2, 1, 3, 4, 5, 0, 1, 4, 0, 4, 3, 1, 2, 5, 1, 5, 4, 2, 0, 3, 2, 3, 5];
const EDGES = [0, 1, 1, 2, 2, 0, 3, 4, 4, 5, 5, 3, 0, 3, 1, 4, 2, 5];
function solid(s, hue, { opacity = 1, fill = hc(hue) } = {}) {
  const g = new THREE.BufferGeometry();
  const pa = new THREE.BufferAttribute(new Float32Array(FACES.length * 3), 3);
  g.setAttribute('position', pa);
  const eg = new THREE.BufferGeometry();
  const ea = new THREE.BufferAttribute(new Float32Array(EDGES.length * 3), 3);
  eg.setAttribute('position', ea);
  const m = new THREE.Mesh(g, tint(mat('#888', { side: THREE.DoubleSide, transparent: opacity < 1, opacity, roughness: 0.6 }), fill));
  const e = new THREE.LineSegments(eg, tint(new THREE.LineBasicMaterial({ transparent: true, opacity: 0.6 }), () => s.color('--ink')));
  m.add(e);
  m.frustumCulled = e.frustumCulled = false;
  const v = new Float32Array(18);
  m.userData.set = (P, h, k = 0) => {
    const [cx, cz] = centroid(P);
    for (let i = 0; i < 3; i++) {
      v[i * 3] = P[i][0]; v[i * 3 + 1] = 0; v[i * 3 + 2] = P[i][1];
      v[9 + i * 3] = P[i][0] + (cx - P[i][0]) * k; v[9 + i * 3 + 1] = h; v[9 + i * 3 + 2] = P[i][1] + (cz - P[i][1]) * k;
    }
    FACES.forEach((f, j) => pa.setXYZ(j, v[f * 3], v[f * 3 + 1], v[f * 3 + 2]));
    EDGES.forEach((f, j) => ea.setXYZ(j, v[f * 3], v[f * 3 + 1], v[f * 3 + 2]));
    pa.needsUpdate = ea.needsUpdate = true;
    g.computeVertexNormals();
  };
  return m;
}
/** Second mesh that shares geometry and materials with a solid (congruent copies). */
function twin(m) {
  const c = new THREE.Mesh(m.geometry, m.material);
  const e = new THREE.LineSegments(m.children[0].geometry, m.children[0].material);
  c.add(e);
  c.frustumCulled = e.frustumCulled = false;
  return c;
}
/** Polyline whose points are rewritten in place. */
function poly(n, fn, opacity = 1) {
  const g = new THREE.BufferGeometry();
  const a = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
  g.setAttribute('position', a);
  const l = new THREE.Line(g, tint(new THREE.LineBasicMaterial({ transparent: opacity < 1, opacity }), fn));
  l.frustumCulled = false;
  l.userData.set = (pts) => { pts.forEach((p, i) => a.setXYZ(i, p[0], p[1], p[2])); a.needsUpdate = true; };
  return l;
}
/** Small SVG helper: create an element with attributes. */
const NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  parent?.appendChild(n);
  return n;
}
const setA = (n, attrs) => { for (const k in attrs) n.setAttribute(k, attrs[k]); };

/* ===================================================== 1. Plana x espacial ========== */
{
  const t = el(`
<article class="topic" id="ge-t-terra">
  <div class="stage-col">
    <div class="stage" id="ge-terra"></div>
    <p class="stage-cap">Um lote triangular. Passe de plana para espacial e veja a terceira dimensão crescer. Toque nos rótulos.</p>
    <div class="controls"></div>
    <div class="pick" hidden aria-live="polite"></div>
  </div>
  <div class="explain">
    <p class="kicker">Geometria · terra e medida</p>
    <h3>Formas, tamanhos e posições</h3>
    <p>Lembra das brigas por terra? Medir e dividir lotes é a origem do nome: <b>geo</b> é terra, <b>metria</b> é medida. Onde tem matemática, tem problema.</p>
    <p>A geometria estuda formas, tamanhos, posições e também figuras muito esquisitas. Ela pode ser <b>plana</b>, com comprimento e largura, ou <b>espacial</b>, quando entra a altura e a área vira volume.</p>
    <div class="stats">
      <div class="stat"><b id="ge-terra-dim">2</b><span>dimensões</span></div>
      <div class="stat"><b id="ge-terra-area">0</b><span>área da base (u²)</span></div>
      <div class="stat"><b id="ge-terra-vol">—</b><span>volume (u³)</span></div>
    </div>
    ${vlinks([[546, 'De volta às brigas por terra'], [555, 'O que a geometria estuda'], [560, 'Ela pode ser plana ou espacial']])}
  </div>
</article>`);
  root.append(t);
  const show = picker(t);
  const P = [[-1.9, 1.1], [2.0, 0.8], [-0.3, -1.7]];
  const area = triArea(P);
  console.assert(Math.abs(area - 5.22) < 1e-9, 'geometria: área do lote');
  const MODES = { plana: { h: 0.02, k: 0 }, prisma: { h: 1.4, k: 0 }, tetra: { h: 1.9, k: 1 } };
  const seg = segmented({ label: 'Geometria', value: 'plana', options: [{ value: 'plana', label: 'Plana' }, { value: 'prisma', label: 'Espacial: prisma' }, { value: 'tetra', label: 'Espacial: tetraedro' }] });
  t.querySelector('.controls').append(seg.el, el(`<div>${vlink(560, 'Plana ou espacial')}</div>`));
  const $ = (id) => t.querySelector(id);
  $('#ge-terra-area').textContent = br(area);
  const stats = (m) => {
    const { h } = MODES[m];
    $('#ge-terra-dim').textContent = m === 'plana' ? '2' : '3';
    $('#ge-terra-vol').textContent = m === 'plana' ? '—' : br(m === 'tetra' ? (area * h) / 3 : area * h);
  };
  seg.on(stats);

  const s = stage($('#ge-terra'), { camera: [4.6, 4.4, 5.8], target: [0, 0.55, 0], label: 'Lote triangular em 3D que pode ganhar altura e virar prisma ou tetraedro.' });
  if (s) {
    let grid = s.add(floorGrid(8, 16, s.el));
    onTheme(() => { s.scene.remove(grid); grid.geometry.dispose(); grid = s.add(floorGrid(8, 16, s.el)); });
    const sol = s.add(solid(s, H.c));
    const st = { ...MODES.plana };
    sol.userData.set(P, st.h, st.k);
    const [cx, cz] = centroid(P);
    const hot = (txt, pos, title, body, sec, hint) => s.label(txt, pos, { onClick: (e) => show(e.currentTarget, title, body(), sec, hint) });
    hot('terra dividida', [cx, 0.05, cz], 'Brigas por terra', () => 'Dividir e cobrar impostos sobre lotes exigia medir. Medir terra é, literalmente, geo + metria.', 546, 'Brigas por terra');
    hot('forma', [P[2][0], 0.05, P[2][1] - 0.25], 'Forma', () => 'Aqui a forma é um triângulo: três lados e três ângulos. A geometria plana estuda essencialmente essa figura.', 555, 'Formas, tamanhos, posições');
    hot('tamanho', [(P[0][0] + P[1][0]) / 2, 0.05, (P[0][1] + P[1][1]) / 2 + 0.3], 'Tamanho', () => `A base deste lote mede ${br(area)} u². No modo espacial o tamanho também é volume.`, 555, 'Formas, tamanhos, posições');
    hot('posição', [P[0][0] - 0.3, 0.05, P[0][1] + 0.1], 'Posição', () => 'Onde a figura está e como está virada. Gire a cena: a posição muda para você, a forma e o tamanho continuam iguais.', 555, 'Formas, tamanhos, posições');
    const top = hot('altura', [cx, st.h + 0.2, cz], 'Altura: a terceira dimensão', () => 'Na geometria espacial o triângulo ganha altura. Prisma: volume = área da base × altura. Tetraedro: um terço disso.', 560, 'Plana ou espacial');
    top.visible = false;
    seg.on((m) => {
      const a = { ...st }, b = MODES[m];
      tween(0, 1, 900, (k) => {
        st.h = a.h + (b.h - a.h) * k; st.k = a.k + (b.k - a.k) * k;
        sol.userData.set(P, st.h, st.k);
        top.position.y = st.h + 0.2;
        top.visible = st.h > 0.3;
      });
    });
  }
  stats('plana');
}

/* ================================================ 2. Tipos de triângulo ========== */
{
  const t = el(`
<article class="topic flip" id="ge-t-tipos">
  <div class="stage-col">
    <div class="stage" id="ge-tipos"></div>
    <p class="stage-cap">Escolha o tipo. No isósceles, corte pela altura e dobre uma metade sobre a outra.</p>
    <div class="controls"></div>
    <div class="pick" hidden aria-live="polite"></div>
  </div>
  <div class="explain">
    <p class="kicker">Geometria plana · triângulos</p>
    <h3>Retângulo, isósceles e escaleno</h3>
    <p>A geometria plana estuda essencialmente os triângulos. O <b>triângulo retângulo</b>, com um ângulo de 90°, é uma das classes mais importantes. É dele o famoso teorema de Pitágoras: a soma dos quadrados dos catetos é igual ao quadrado da hipotenusa.</p>
    <p>O <b>isósceles</b> tem dois lados iguais. O <b>escaleno</b> tem todos os lados diferentes. Corte o isósceles ao meio pela altura e saem dois triângulos retângulos idênticos e simétricos. Essa altura é bissetriz: divide o ângulo do topo em dois ângulos iguais.</p>
    <p class="readout" id="ge-tipos-out" aria-live="polite"></p>
    ${vlinks([[566, 'A geometria plana estuda triângulos'], [576, 'Soma dos quadrados dos catetos'], [587, 'Isósceles e escaleno'], [592, 'Cortar o isósceles ao meio'], [597, 'A altura é bissetriz']])}
  </div>
</article>`);
  root.append(t);
  const show = picker(t);
  const TYPES = {
    ret: { name: 'Retângulo', P: [[-1.5, 1.0], [1.5, 1.0], [-1.5, -1.25]] }, // legs 3 and 2,25, hypotenuse 3,75 (3-4-5)
    iso: { name: 'Isósceles', P: [[-1.4, 1.0], [1.4, 1.0], [0, -1.6]] },
    esc: { name: 'Escaleno', P: [[-1.7, 1.0], [1.6, 1.0], [0.7, -1.4]] },
  };
  console.assert(Math.abs(measure(TYPES.ret.P).s[0] - 3.75) < 1e-9 && Math.abs(measure(TYPES.ret.P).A[0] - 90) < 1e-9, 'geometria: retângulo 3,75');
  const typeSeg = segmented({ label: 'Tipo', value: 'ret', options: [{ value: 'ret', label: 'Retângulo' }, { value: 'iso', label: 'Isósceles' }, { value: 'esc', label: 'Escaleno' }] });
  const cutSeg = segmented({ label: 'Isósceles', value: 'inteiro', options: [{ value: 'inteiro', label: 'Inteiro' }, { value: 'cortado', label: 'Cortar ao meio' }, { value: 'dobrado', label: 'Dobrar sobre a altura' }] });
  t.querySelector('.controls').append(typeSeg.el, cutSeg.el);
  const out = t.querySelector('#ge-tipos-out');
  const cur = TYPES.ret.P.map((p) => [...p]);
  let type = 'ret';
  const role = (i) => (type === 'ret' ? (i === 0 ? 'hipotenusa' : 'cateto') : type === 'iso' ? (i === 2 ? 'base' : 'lado igual') : 'lado');
  const report = () => {
    const m = measure(cur);
    const k = kind(m);
    out.textContent = `${TYPES[type].name}: lados ${m.s.map((x) => br(x)).join(' · ')} · ângulos ${m.A.map((x) => br(x, 1) + '°').join(' + ')} = ${br(m.A[0] + m.A[1] + m.A[2], 0)}° (${k.bySide}, ${k.byAngle})`;
  };
  const lockCut = () => cutSeg.el.querySelectorAll('button').forEach((b) => { b.disabled = type !== 'iso'; });
  lockCut();
  report();

  const s = stage(t.querySelector('#ge-tipos'), { camera: [0, 5.4, 4.6], target: [0, 0, -0.2], label: 'Triângulo 3D que muda entre retângulo, isósceles e escaleno; o isósceles pode ser cortado pela altura.' });
  let setCut = () => {};
  if (s) {
    const full = s.add(solid(s, H.c));
    const sides = [0, 1, 2].map((i) => s.label('', [0, 0, 0], { onClick: (e) => sidePick(e.currentTarget, i) }));
    const angs = [0, 1, 2].map(() => s.label('', [0, 0, 0], { cls: 'plain' }));
    const right = poly(3, () => s.color('--ink'));
    s.add(right);
    function place(P) {
      full.userData.set(P, 0.08);
      const m = measure(P);
      const [cx, cz] = centroid(P);
      for (let i = 0; i < 3; i++) {
        const p = P[(i + 1) % 3], q = P[(i + 2) % 3];
        const mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2, L = Math.hypot(mx - cx, mz - cz) || 1;
        sides[i].position.set(mx + ((mx - cx) / L) * 0.42, 0.1, mz + ((mz - cz) / L) * 0.42);
        sides[i].element.innerHTML = `<span class="ge-${'abc'[i]}"><i>${'abc'[i]}</i> = ${br(m.s[i])}</span> · ${role(i)}`;
        const V = P[i], D = Math.hypot(cx - V[0], cz - V[1]) || 1;
        angs[i].position.set(V[0] + ((cx - V[0]) / D) * 0.62, 0.12, V[1] + ((cz - V[1]) / D) * 0.62);
        angs[i].element.textContent = `${br(m.A[i], 1)}°`;
      }
      // right-angle mark at A while the triangle is (nearly) right
      const A = P[0], u = [P[1][0] - A[0], P[1][1] - A[1]], w = [P[2][0] - A[0], P[2][1] - A[1]];
      const lu = Math.hypot(...u), lw = Math.hypot(...w), r = 0.28;
      right.userData.set([[A[0] + (u[0] / lu) * r, 0.09, A[1] + (u[1] / lu) * r], [A[0] + (u[0] / lu + w[0] / lw) * r, 0.09, A[1] + (u[1] / lu + w[1] / lw) * r], [A[0] + (w[0] / lw) * r, 0.09, A[1] + (w[1] / lw) * r]]);
      right.visible = Math.abs(m.A[0] - 90) < 0.5;
    }
    function sidePick(btn, i) {
      const m = measure(cur), [a, b, c] = m.s, L = m.s[i];
      if (type === 'ret' && i === 0) show(btn, 'Hipotenusa', `O maior lado, oposto ao ângulo de 90°. Pitágoras: ${br(a)}² = ${br(b)}² + ${br(c)}², ou seja, ${br(a * a)} = ${br(b * b)} + ${br(c * c)}.`, 576, 'Teorema de Pitágoras');
      else if (type === 'ret') show(btn, 'Cateto', `Os catetos são os dois lados que formam o ângulo reto. Este mede ${br(L)}.`, 566, 'Triângulo retângulo');
      else if (type === 'iso' && i < 2) show(btn, 'Lado igual', `No isósceles dois lados são iguais: ${br(a)} e ${br(b)}. Os ângulos da base também são iguais: ${br(m.A[0], 1)}° e ${br(m.A[1], 1)}°.`, 587, 'Isósceles: dois lados iguais');
      else if (type === 'iso') show(btn, 'Base', `O lado diferente, com ${br(c)}. A altura cai exatamente no meio dela. Use "Cortar ao meio".`, 592, 'Cortar ao meio');
      else show(btn, 'Escaleno', `Todos os lados diferentes: ${br(a)}, ${br(b)} e ${br(c)}. Os três ângulos também são diferentes.`, 587, 'Escaleno: todos diferentes');
    }
    place(cur);

    // the two halves of the isosceles: left [A, M, C]; right [M, B, C] inside a pivot on the altitude (x = 0)
    const Pi = TYPES.iso.P, M = [0, 1.0];
    const left = solid(s, H.c), rightHalf = solid(s, H.a);
    left.userData.set([Pi[0], M, Pi[2]], 0.08);
    rightHalf.userData.set([M, Pi[1], Pi[2]], 0.08);
    const pivot = new THREE.Group();
    pivot.position.y = 0.085; // hinge on the top face, so the folded half lands on top of the other
    rightHalf.position.y = -0.085;
    pivot.add(rightHalf);
    s.add(left, pivot);
    const half = deg(Math.atan(1.4 / 2.6));
    const mk = (parent, sx) => {
      const r = poly(3, () => s.color('--ink'));
      r.userData.set([[sx * 0.24, 0.09, 1.0], [sx * 0.24, 0.09, 0.76], [0, 0.09, 0.76]]);
      parent.add(r);
      return [s.label(`${br(half, 1)}°`, [sx * 0.2, 0.12, -0.95], { cls: 'plain', parent }), s.label('90°', [sx * 0.45, 0.12, 0.62], { cls: 'plain', parent })];
    };
    // CSS2D labels ignore their parents' visibility, so each label is shown/hidden explicitly
    const lLbls = mk(left, -1);
    const rLbls = mk(rightHalf, 1);
    const alt = s.label('altura = bissetriz', [0, 0.1, -0.1], { parent: left, onClick: (e) => show(e.currentTarget, 'A altura é bissetriz', `No isósceles a altura sai do topo, cai no meio da base em 90° e divide o ângulo de ${br(2 * half, 1)}° em dois de ${br(half, 1)}°. As duas metades são triângulos retângulos idênticos e simétricos: dobre uma sobre a outra.`, 597, 'A altura é bissetriz') });
    const cutSt = { sep: 0, fold: 0 };
    const CUT = { inteiro: { sep: 0, fold: 0 }, cortado: { sep: 0.45, fold: 0 }, dobrado: { sep: 0, fold: Math.PI } };
    const pose = () => {
      left.position.x = -cutSt.sep;
      rightHalf.position.x = cutSt.sep;
      pivot.rotation.z = cutSt.fold;
      rLbls.forEach((l) => { l.visible = left.visible && cutSt.fold < Math.PI / 2; });
    };
    const showHalves = (on) => {
      left.visible = pivot.visible = on;
      full.visible = !on;
      sides.forEach((l) => { l.visible = !on; });
      angs.forEach((l) => { l.visible = !on; });
      alt.visible = on;
      lLbls.forEach((l) => { l.visible = on; });
      pose();
    };
    showHalves(false);
    pose();
    setCut = (v, animate = true) => {
      const a = { ...cutSt }, b = CUT[v];
      if (v !== 'inteiro') showHalves(true);
      tween(0, 1, animate ? 1000 : 0, (k) => { cutSt.sep = a.sep + (b.sep - a.sep) * k; cutSt.fold = a.fold + (b.fold - a.fold) * k; pose(); },
        () => { if (cutSeg.value === 'inteiro') showHalves(false); });
    };
    typeSeg.on((v) => {
      if (cutSeg.value !== 'inteiro') { cutSeg.set('inteiro', false); setCut('inteiro', false); }
      const from = cur.map((p) => [...p]), to = TYPES[v].P;
      type = v;
      lockCut();
      tween(0, 1, 800, (k) => {
        for (let i = 0; i < 3; i++) { cur[i][0] = from[i][0] + (to[i][0] - from[i][0]) * k; cur[i][1] = from[i][1] + (to[i][1] - from[i][1]) * k; }
        place(cur);
      }, report);
    });
  } else {
    typeSeg.on((v) => { type = v; TYPES[v].P.forEach((p, i) => { cur[i] = [...p]; }); lockCut(); report(); });
  }
  cutSeg.on((v) => {
    setCut(v);
    if (v !== 'inteiro') show(null, v === 'cortado' ? 'Dois triângulos retângulos' : 'Idênticos e simétricos', v === 'cortado' ? 'A altura corta o isósceles em duas metades. Cada uma tem um ângulo de 90° no pé da altura.' : 'Dobrada sobre a altura, uma metade cobre a outra por inteiro: são congruentes e espelhadas.', 592, 'Cortar o isósceles ao meio');
  });
}

/* ============================================ 3. Soma dos ângulos = 180° ========== */
{
  const t = el(`
<article class="topic" id="ge-t-soma">
  <div class="stage-col">
    <div class="stage" id="ge-soma"></div>
    <p class="stage-cap">Arraste as bolinhas dos vértices. Depois junte as três cunhas de ângulo numa reta.</p>
    <div class="controls">
      <div class="btn-row">
        <button type="button" class="btn sm" id="ge-soma-join" aria-pressed="false">Juntar os ângulos</button>
        <button type="button" class="btn sm" id="ge-soma-rand">Sortear outro triângulo</button>
      </div>
    </div>
    <div class="pick" hidden aria-live="polite"></div>
  </div>
  <div class="explain">
    <p class="kicker">Vale para qualquer triângulo</p>
    <h3>Os ângulos internos somam 180°</h3>
    <p>O mais legal é o que vale para <b>qualquer</b> triângulo, como o escaleno: a soma dos seus ângulos internos dá 180°. Deforme o triângulo como quiser e veja os três números mudarem enquanto a soma fica parada.</p>
    <p>Junte as cunhas: os três ângulos se encaixam lado a lado e formam uma linha reta. Meia volta, 180°.</p>
    <div class="stats">
      <div class="stat ge-a"><b id="ge-soma-0">0</b><span>ângulo em A</span></div>
      <div class="stat ge-b"><b id="ge-soma-1">0</b><span>ângulo em B</span></div>
      <div class="stat ge-g"><b id="ge-soma-2">0</b><span>ângulo em C</span></div>
      <div class="stat"><b id="ge-soma-s">180°</b><span>soma</span></div>
    </div>
    <p class="readout" id="ge-soma-k" aria-live="polite"></p>
    <p class="note fact">Por que dá sempre 180°: trace pelo vértice de cima uma reta paralela à base. Os dois ângulos que aparecem nas pontas são iguais aos ângulos da base (alternos internos), e os três juntos formam a reta.</p>
    ${vlinks([[604, 'Coisas que valem para qualquer triângulo'], [610, 'No escaleno, a soma dá 180°']])}
  </div>
</article>`);
  root.append(t);
  const show = picker(t);
  const $ = (id) => t.querySelector(id);
  const P = [[-1.8, 1.1], [1.9, 0.9], [0.4, -1.5]];
  const joinBtn = $('#ge-soma-join');
  const report = () => {
    const m = measure(P), k = kind(m);
    m.A.forEach((a, i) => { $(`#ge-soma-${i}`).textContent = `${br(a, 1)}°`; });
    $('#ge-soma-s').textContent = `${br(m.A[0] + m.A[1] + m.A[2], 1)}°`;
    $('#ge-soma-k').textContent = `Este triângulo é ${k.bySide} e ${k.byAngle}.`;
  };
  report();
  const HUES = [H.a, H.b, H.g];
  const s = stage($('#ge-soma'), { camera: [0, 6.6, 4.4], target: [0, 0, 0.25], label: 'Triângulo com vértices arrastáveis; as cunhas dos três ângulos podem se juntar numa linha reta de 180 graus.', hint: 'arraste os vértices · fundo gira' });
  let join = () => {}, randomize = () => {};
  if (s) {
    const tri = s.add(solid(s, H.c));
    const N = 32, R = 0.5;
    const wedges = HUES.map((h, i) => {
      const g = new THREE.BufferGeometry();
      const a = new THREE.BufferAttribute(new Float32Array((N + 2) * 3), 3);
      g.setAttribute('position', a);
      const idx = [];
      for (let j = 1; j <= N; j++) idx.push(0, j, j + 1);
      g.setIndex(idx);
      const m = new THREE.Mesh(g, tint(new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.9 }), hc(h)));
      m.frustumCulled = false;
      m.position.y = 0.06;
      const grp = new THREE.Group();
      grp.add(m);
      s.add(grp);
      const lbl = s.label('', [0, 0.1, 0], { parent: grp, onClick: (e) => show(e.currentTarget, `Ângulo em ${'ABC'[i]}`, `Mede ${br(measure(P).A[i], 1)}°. Somado aos outros dois, sempre dá 180°, para qualquer triângulo.`, 610, 'Soma dos ângulos internos') });
      return { grp, a, lbl, start: 0, len: 0 };
    });
    // circle parameter t points along (cos t, -sin t) on XZ, so rotation.y = φ adds φ to t
    const dirT = (dx, dz) => Math.atan2(-dz, dx);
    const wrap = (x) => Math.atan2(Math.sin(x), Math.cos(x));
    const handles = HUES.map((h) => s.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), tint(mat('#888', { roughness: 0.35 }), hc(h)))));
    const Q = new THREE.Vector3(0, 0, 2.1);
    const base = s.add(poly(2, () => s.color('--ink')));
    base.userData.set([[-1.25, 0.03, Q.z], [1.25, 0.03, Q.z]]);
    const flat = s.label('180°: uma linha reta', [0, 0.1, Q.z + 0.32], { cls: 'plain' });
    let k = 0; // 0 = wedges at the vertices, 1 = lined up at Q
    function update() {
      tri.userData.set(P, 0.04);
      const m = measure(P);
      wedges.forEach((w, i) => {
        const V = P[i], A = P[(i + 1) % 3], B = P[(i + 2) % 3];
        const t1 = dirT(A[0] - V[0], A[1] - V[1]), t2 = dirT(B[0] - V[0], B[1] - V[1]);
        let len = wrap(t2 - t1);
        w.start = len < 0 ? t2 : t1;
        w.len = Math.abs(len);
        w.a.setXYZ(0, 0, 0, 0);
        for (let j = 0; j <= N; j++) { const a = w.start + (w.len * j) / N; w.a.setXYZ(j + 1, Math.cos(a) * R, 0, -Math.sin(a) * R); }
        w.a.needsUpdate = true;
        const mid = w.start + w.len / 2;
        w.lbl.position.set(Math.cos(mid) * (R + 0.32), 0.1, -Math.sin(mid) * (R + 0.32));
        w.lbl.element.innerHTML = `<span class="ge-${'abg'[i]}">${br(m.A[i], 1)}°</span>`;
        handles[i].position.set(V[0], 0.08, V[1]);
      });
      pose();
    }
    function pose() {
      let acc = 0;
      const e = ease(k);
      wedges.forEach((w, i) => {
        const target = acc; // lined up from t = 0 (pointing +x) to t = π
        acc += w.len;
        const phi = wrap(target - w.start);
        const ki = Math.min(1, Math.max(0, e * 1.3 - i * 0.15)); // small stagger
        w.grp.position.set(P[i][0] + (Q.x - P[i][0]) * ki, Math.sin(Math.PI * ki) * 0.7, P[i][1] + (Q.z - P[i][1]) * ki);
        w.grp.rotation.y = phi * ki;
      });
      base.visible = flat.visible = k > 0.98;
    }
    update();
    let anim = null;
    join = (on) => {
      joinBtn.setAttribute('aria-pressed', String(on));
      joinBtn.textContent = on ? 'Voltar aos vértices' : 'Juntar os ângulos';
      const from = k, to = on ? 1 : 0;
      if (reduced) { k = to; pose(); return; }
      const t0 = performance.now(), ms = 1400;
      anim = (now) => { const x = Math.min(1, (now - t0) / ms); k = from + (to - from) * x; pose(); return x < 1; };
    };
    s.onFrame(() => { if (anim && !anim(performance.now())) anim = null; });
    randomize = () => {
      const from = P.map((p) => [...p]);
      let to;
      do { to = [0, 1, 2].map(() => [-2.4 + Math.random() * 4.8, -1.6 + Math.random() * 2.9]); } while (triArea(to) < 1.6 || Math.min(...measure(to).A) < 12);
      if (k) join(false);
      tween(0, 1, 700, (x) => { for (let i = 0; i < 3; i++) { P[i][0] = from[i][0] + (to[i][0] - from[i][0]) * x; P[i][1] = from[i][1] + (to[i][1] - from[i][1]) * x; } update(); }, report);
    };

    // dragging: capture-phase listener on the stage runs before OrbitControls, so it can switch rotation off
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), hit = new THREE.Vector3();
    const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const cv = s.renderer.domElement;
    const aim = (e) => {
      const r = cv.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, s.camera);
    };
    let drag = -1;
    s.el.addEventListener('pointerdown', (e) => {
      if (e.target !== cv) return;
      aim(e);
      const h = ray.intersectObjects(handles, false)[0];
      if (!h) return;
      drag = handles.indexOf(h.object);
      s.controls.enabled = false;
      cv.setPointerCapture(e.pointerId);
      if (k) { anim = null; k = 0; join(false); pose(); }
    }, { capture: true });
    cv.addEventListener('pointermove', (e) => {
      aim(e);
      if (drag < 0) { cv.style.cursor = ray.intersectObjects(handles, false).length ? 'grab' : ''; return; }
      if (!ray.ray.intersectPlane(floor, hit)) return;
      const old = [...P[drag]];
      P[drag][0] = Math.max(-2.8, Math.min(2.8, hit.x));
      P[drag][1] = Math.max(-1.9, Math.min(1.6, hit.z));
      if (triArea(P) < 0.2) { P[drag][0] = old[0]; P[drag][1] = old[1]; return; } // keep it a real triangle
      cv.style.cursor = 'grabbing';
      update();
      report();
    });
    const end = () => { if (drag >= 0) { drag = -1; s.controls.enabled = true; cv.style.cursor = ''; } };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
  }
  joinBtn.addEventListener('click', () => { join(joinBtn.getAttribute('aria-pressed') !== 'true'); show(joinBtn, 'Uma linha reta', 'As três cunhas cobrem exatamente meia volta, sem sobrar nem faltar: 180°.', 610, 'Soma dos ângulos internos'); });
  $('#ge-soma-rand').addEventListener('click', () => randomize());
  if (!s) joinBtn.disabled = $('#ge-soma-rand').disabled = true;
}

/* ===================================================== 4. Área (SVG) ============== */
{
  const t = el(`
<article class="topic flip" id="ge-t-area">
  <div class="stage-col">
    <div class="stage" id="ge-area"></div>
    <p class="stage-cap">Escolha qual lado é a base: o triângulo gira até ela ficar no chão. A altura desce do vértice oposto, em 90°.</p>
    <div class="controls"></div>
  </div>
  <div class="explain">
    <p class="kicker">Área do triângulo</p>
    <h3>Base vezes altura dividido por 2</h3>
    <p>Você pode escolher <b>qualquer lado</b> para ser a base. Escolhida a base, a altura tem que sair do <b>vértice oposto</b> e cair perpendicular a ela. Quando o triângulo é obtuso, ela cai no prolongamento da base (linha pontilhada).</p>
    <p>As três escolhas dão a mesma área. Em muitos casos você descobre a altura com Pitágoras: o lado, o pedaço da base até o pé da altura e a própria altura formam um triângulo retângulo.</p>
    <div class="formula" id="ge-area-f" aria-live="polite"></div>
    <div class="formula" id="ge-area-p"></div>
    <div class="stats" id="ge-area-all"></div>
    ${vlinks([[615, 'Área = base × altura ÷ 2'], [622, 'Qualquer lado pode ser a base'], [627, 'A altura sai do vértice oposto'], [632, 'A altura muitas vezes sai de Pitágoras']])}
  </div>
</article>`);
  root.append(t);
  const $ = (id) => t.querySelector(id);
  const host = $('#ge-area');
  host.classList.add('stage');
  const S = svg('svg', { viewBox: '0 0 400 300', class: 'ge-svg', role: 'img', 'aria-label': 'Triângulo que gira para apoiar o lado escolhido como base, com a altura perpendicular saindo do vértice oposto.' }, host);
  const fillTri = svg('polygon', { class: 'fill-soft' }, S);
  const ext = svg('line', { class: 'faint', 'stroke-width': 1.5 }, S);
  const sideEls = [H.a, H.b, H.c].map((h) => svg('line', { class: 'hue-s', style: `--h:${h}`, 'stroke-linecap': 'round' }, S));
  const altEl = svg('line', { class: 'ink', 'stroke-width': 1.6, 'stroke-dasharray': '6 4' }, S);
  const sq = svg('polyline', { class: 'ink', 'stroke-width': 1.3 }, S);
  const foot = svg('circle', { r: 3.5, class: 'hue-f' }, S);
  const vtx = 'ABC'.split('').map((n) => svg('text', { class: 'math', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, S));
  vtx.forEach((n, i) => { n.textContent = 'ABC'[i]; });
  const sideTx = [0, 1, 2].map(() => svg('text', { 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, S));
  const hTx = svg('text', { 'dominant-baseline': 'middle' }, S);

  const pts = [[0, 0], [6, 0], [4, 3.2]];
  const BASES = { a: [1, 2, 0], b: [2, 0, 1], c: [0, 1, 2] }; // [P, Q, opposite vertex]
  const st = { rho: 0, base: 'c' };
  const seg = segmented({ label: 'Base', value: 'c', options: [{ value: 'a', label: 'lado <i>a</i>' }, { value: 'b', label: 'lado <i>b</i>' }, { value: 'c', label: 'lado <i>c</i>' }] });
  const cx = slider({ label: 'Vértice C', min: -2, max: 8, step: 0.1, value: 4, format: (v) => br(v, 1) });
  $('.controls').append(seg.el, cx.el);

  /** Base length, height and the Pythagoras pieces for a base choice. */
  function geom(key, Pt = pts) {
    const [p, q, r] = BASES[key].map((i) => Pt[i]);
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const ux = (q[0] - p[0]) / L, uy = (q[1] - p[1]) / L;
    const d = (r[0] - p[0]) * ux + (r[1] - p[1]) * uy; // signed distance from P to the foot along the base
    const f = [p[0] + ux * d, p[1] + uy * d];
    const side = Math.hypot(r[0] - p[0], r[1] - p[1]);
    return { p, q, r, L, f, d, side, h: Math.sqrt(Math.max(0, side * side - d * d)) };
  }
  [-2, 0, 3, 6, 8].forEach((x) => {
    const P2 = [[0, 0], [6, 0], [x, 3.2]], A = triArea(P2);
    for (const k of 'abc') { const g = geom(k, P2); console.assert(Math.abs((g.L * g.h) / 2 - A) < 1e-9, 'geometria: área por base', k, x); }
  });
  function targetRho(key) {
    const { p, q, r } = geom(key);
    let rho = -Math.atan2(q[1] - p[1], q[0] - p[0]);
    const cr = (x, y) => Math.sin(rho) * x + Math.cos(rho) * y; // rotated y
    if (cr(r[0] - p[0], r[1] - p[1]) < 0) rho += Math.PI;
    return rho;
  }
  function draw() {
    const G = centroid(pts);
    const maxR = Math.max(...pts.map((p) => Math.hypot(p[0] - G[0], p[1] - G[1])));
    const sc = 112 / maxR, c = Math.cos(st.rho), sn = Math.sin(st.rho);
    const X = (p) => [200 + ((p[0] - G[0]) * c - (p[1] - G[1]) * sn) * sc, 150 - ((p[0] - G[0]) * sn + (p[1] - G[1]) * c) * sc];
    const V = pts.map(X);
    setA(fillTri, { points: V.map((v) => v.join(',')).join(' ') });
    const g = geom(st.base);
    const [bi, bj] = BASES[st.base];
    [[1, 2], [2, 0], [0, 1]].forEach(([i, j], k) => {
      const on = (i === bi && j === bj);
      setA(sideEls[k], { x1: V[i][0], y1: V[i][1], x2: V[j][0], y2: V[j][1], 'stroke-width': on ? 6 : 2.2 });
      const mx = (V[i][0] + V[j][0]) / 2, my = (V[i][1] + V[j][1]) / 2, Gc = X(G);
      const dx = mx - Gc[0], dy = my - Gc[1], D = Math.hypot(dx, dy) || 1;
      setA(sideTx[k], { x: mx + (dx / D) * 20, y: my + (dy / D) * 20, 'font-weight': on ? 700 : 500 });
      sideTx[k].textContent = `${'abc'[k]} = ${br(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]))}`;
    });
    V.forEach((v, i) => { const Gc = X(G), dx = v[0] - Gc[0], dy = v[1] - Gc[1], D = Math.hypot(dx, dy) || 1; setA(vtx[i], { x: v[0] + (dx / D) * 16, y: v[1] + (dy / D) * 16 }); });
    const R = X(g.r), F = X(g.f), Pp = X(g.p), Qp = X(g.q);
    setA(altEl, { x1: R[0], y1: R[1], x2: F[0], y2: F[1] });
    setA(foot, { cx: F[0], cy: F[1] });
    const out = g.d < 0 || g.d > g.L; // foot outside the base: draw the extension
    const near = g.d < 0 ? Pp : Qp;
    setA(ext, { x1: near[0], y1: near[1], x2: F[0], y2: F[1], visibility: out ? 'visible' : 'hidden' });
    const ux = (Qp[0] - Pp[0]) / Math.hypot(Qp[0] - Pp[0], Qp[1] - Pp[1]), uy = (Qp[1] - Pp[1]) / Math.hypot(Qp[0] - Pp[0], Qp[1] - Pp[1]);
    const hx = (R[0] - F[0]) / (Math.hypot(R[0] - F[0], R[1] - F[1]) || 1), hy = (R[1] - F[1]) / (Math.hypot(R[0] - F[0], R[1] - F[1]) || 1);
    const sgn = g.d > g.L / 2 ? -1 : 1, z = 10; // right-angle mark on the inner side
    setA(sq, { points: `${F[0] + ux * z * sgn},${F[1] + uy * z * sgn} ${F[0] + (ux * sgn + hx) * z},${F[1] + (uy * sgn + hy) * z} ${F[0] + hx * z},${F[1] + hy * z}` });
    const side = g.d > g.L / 2 ? -1 : 1; // put "h" on the roomier side of the altitude
    setA(hTx, { x: F[0] + (R[0] - F[0]) * 0.3 + ux * side * 9, y: F[1] + (R[1] - F[1]) * 0.3 + uy * side * 9, 'text-anchor': ux * side >= 0 ? 'start' : 'end' });
    hTx.textContent = `h = ${br(g.h)}`;
  }
  function report() {
    const g = geom(st.base), A = (g.L * g.h) / 2;
    const side = { a: 'c', b: 'a', c: 'b' }[st.base]; // the side from P to the opposite vertex
    $('#ge-area-f').innerHTML = `<i>A</i> = <span class="frac"><span><i>base</i> × <i>altura</i></span><span>2</span></span> = <span class="frac"><span>${br(g.L)} × ${br(g.h)}</span><span>2</span></span> = <b>${br(A)}</b>`;
    $('#ge-area-p').innerHTML = `<small>Altura por Pitágoras, no triângulo retângulo formado pelo lado ${side}, pela altura e pelo pedaço da base até o pé:</small><i>h</i> = √(${br(g.side)}² − ${br(Math.abs(g.d))}²) = ${br(g.h)}`;
    $('#ge-area-all').innerHTML = 'abc'.split('').map((k) => { const q = geom(k); return `<div class="stat"><b>${br((q.L * q.h) / 2)}</b><span>base ${k}: ${br(q.L)} × ${br(q.h)} ÷ 2</span></div>`; }).join('');
  }
  seg.on((v) => {
    st.base = v;
    const from = st.rho, d = Math.atan2(Math.sin(targetRho(v) - from), Math.cos(targetRho(v) - from));
    tween(0, 1, 850, (k) => { st.rho = from + d * k; draw(); });
    draw();
    report();
  });
  cx.on((v) => { pts[2][0] = v; st.rho = targetRho(st.base); draw(); report(); });
  st.rho = targetRho('c');
  draw();
  report();
}

/* ============================================ 5. Pitágoras: tanques ============== */
{
  const t = el(`
<article class="topic" id="ge-t-tanques">
  <div class="stage-col">
    <div class="stage" id="ge-tanques"></div>
    <p class="stage-cap">Um tanque quadrado sobre cada lado, todos com a mesma profundidade. Escoe a água do tanque da hipotenusa.</p>
    <div class="controls">
      <div class="btn-row"><button type="button" class="btn sm" id="ge-tq-go" aria-pressed="false">Escoar para os catetos</button></div>
    </div>
    <div class="pick" hidden aria-live="polite"></div>
  </div>
  <div class="explain">
    <p class="kicker">Teorema de Pitágoras</p>
    <h3>A área do maior quadrado é a soma das outras duas</h3>
    <p>O teorema diz que a área projetada sobre o maior lado do triângulo retângulo, a hipotenusa, é igual à soma das áreas projetadas sobre os dois lados menores, os catetos. Isso é igual àquilo.</p>
    <p>Aqui cada área virou um tanque com a mesma profundidade. Como volume = área × profundidade, a água do tanque <b>c²</b> enche exatamente os tanques <b>a²</b> e <b>b²</b>, sem sobrar nem faltar, para qualquer par de catetos.</p>
    <div class="stats">
      <div class="stat ge-a"><b id="ge-tq-a">0</b><span>a² (cateto)</span></div>
      <div class="stat ge-b"><b id="ge-tq-b">0</b><span>b² (cateto)</span></div>
      <div class="stat"><b id="ge-tq-c">0</b><span>c² (hipotenusa)</span></div>
    </div>
    <p class="readout" id="ge-tq-v" aria-live="polite"></p>
    ${vlinks([[638, 'A área do maior lado = soma das outras duas'], [644, 'Isso é igual àquilo: projetar as áreas']])}
  </div>
</article>`);
  root.append(t);
  const show = picker(t);
  const $ = (id) => t.querySelector(id);
  const D = 0.55; // tank depth
  const st = { a: 1.5, b: 2, f: 0 };
  const sa = slider({ label: 'Cateto a', min: 1, max: 2.2, step: 0.05, value: st.a, format: (v) => br(v) });
  const sb = slider({ label: 'Cateto b', min: 1, max: 2.2, step: 0.05, value: st.b, format: (v) => br(v) });
  $('.controls').prepend(sa.el, sb.el);
  const goBtn = $('#ge-tq-go');
  const c = () => Math.hypot(st.a, st.b);
  const report = () => {
    const A = st.a ** 2, B = st.b ** 2, C = A + B;
    $('#ge-tq-a').textContent = br(A); $('#ge-tq-b').textContent = br(B); $('#ge-tq-c').textContent = br(C);
    const vc = C * D * (1 - st.f), vab = (A + B) * D * st.f;
    $('#ge-tq-v').textContent = `Volume: ${br(vc)} no tanque c² + ${br(vab)} nos tanques a² e b² = ${br(vc + vab)} (sempre ${br(C * D)})`;
  };
  report();
  const s = stage($('#ge-tanques'), { camera: [6.2, 7.6, 8.2], target: [0, 0, 0], label: 'Triângulo retângulo com tanques quadrados sobre os três lados; a água do maior enche os dois menores.' });
  let layout = () => {}, flow = () => {}, busy = false;
  if (s) {
    const board = new THREE.Group();
    s.add(board);
    const tri = solid(s, H.c);
    board.add(tri);
    const unit = new THREE.BoxGeometry(1, 1, 1), edges = new THREE.EdgesGeometry(unit), plane = new THREE.PlaneGeometry(1, 1);
    const glassM = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.1, depthWrite: false, roughness: 0.1 });
    tint(glassM, () => s.color('--ink'));
    const waterM = tint(new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.78, roughness: 0.15, metalness: 0.05 }), hc(H.w));
    const tanks = ['a', 'b', 'c'].map((k) => {
      const h = H[k];
      const g = new THREE.Group();
      const glass = new THREE.Mesh(unit, glassM);
      const rim = new THREE.LineSegments(edges, tint(new THREE.LineBasicMaterial(), hc(h)));
      const tile = new THREE.Mesh(plane, tint(mat('#888', { side: THREE.DoubleSide }), hc(h)));
      tile.rotation.x = -Math.PI / 2;
      tile.position.y = 0.004;
      const water = new THREE.Mesh(unit, waterM);
      g.add(tile, water, glass, rim);
      board.add(g);
      const lbl = s.label(`<span class="ge-${k}">${k}²</span>`, [0, D + 0.35, 0], { cls: 'math', parent: g, onClick: (e) => tankPick(e.currentTarget, k) });
      return { k, g, glass, rim, tile, water, lbl, L: 1 };
    });
    function tankPick(btn, k) {
      const A = st.a ** 2, B = st.b ** 2;
      if (k === 'c') show(btn, 'Quadrado da hipotenusa', `Área c² = ${br(A + B)}. É a área projetada sobre o maior lado. Escoe e veja: ela cabe exatamente em a² + b².`, 638, 'Área projetada do maior lado');
      else show(btn, `Quadrado do cateto ${k}`, `Área ${k}² = ${br(k === 'a' ? A : B)}. Junto com o outro cateto: ${br(A)} + ${br(B)} = ${br(A + B)} = c².`, 644, 'Isso é igual àquilo');
    }
    // square on segment U→W, on the side away from the right angle O
    const put = (tk, U, W, G) => {
      const dx = W[0] - U[0], dz = W[1] - U[1], L = Math.hypot(dx, dz);
      let nx = dz / L, nz = -dx / L;
      const mx = (U[0] + W[0]) / 2, mz = (U[1] + W[1]) / 2;
      if (nx * (G[0] - mx) + nz * (G[1] - mz) > 0) { nx = -nx; nz = -nz; } // point away from the triangle
      tk.g.position.set(mx + (nx * L) / 2, 0, mz + (nz * L) / 2);
      tk.g.rotation.y = Math.atan2(-dz, dx);
      tk.L = L;
      tk.tile.scale.set(L, L, 1);
      tk.glass.scale.set(L, D, L); tk.glass.position.y = D / 2;
      tk.rim.scale.copy(tk.glass.scale); tk.rim.position.y = D / 2;
    };
    const levels = () => {
      tanks.forEach((tk) => {
        const lv = tk.k === 'c' ? D * (1 - st.f) : D * st.f;
        tk.water.visible = lv > 0.003;
        tk.water.scale.set(tk.L * 0.97, Math.max(lv, 0.001), tk.L * 0.97);
        tk.water.position.y = lv / 2;
      });
    };
    layout = () => {
      const O = [0, 0], A = [st.a, 0], B = [0, -st.b];
      tri.userData.set([O, A, B], 0.05);
      const G = centroid([O, A, B]);
      put(tanks[0], O, A, G); put(tanks[1], B, O, G); put(tanks[2], A, B, G);
      board.position.set(-st.a / 2, 0, st.b / 2); // bbox: x in [-b, a+b], z in [-(a+b), a]
      levels();
    };
    layout();
    flow = (on) => {
      busy = true;
      const from = st.f, to = on ? 1 : 0;
      tween(0, 1, 2200, (k) => { st.f = from + (to - from) * k; levels(); report(); }, () => { busy = false; });
    };
  }
  goBtn.addEventListener('click', () => {
    if (busy) return;
    const on = goBtn.getAttribute('aria-pressed') !== 'true';
    goBtn.setAttribute('aria-pressed', String(on));
    goBtn.textContent = on ? 'Devolver para a hipotenusa' : 'Escoar para os catetos';
    if (s) flow(on); else { st.f = on ? 1 : 0; report(); }
  });
  const onSize = () => { st.a = sa.value; st.b = sb.value; layout(); report(); };
  sa.on(onSize); sb.on(onSize);
  console.assert(Math.abs(c() - 2.5) < 1e-9, 'geometria: 1,5-2-2,5');
}

/* ========================================== 6. A prova com 4 triângulos ========== */
{
  const t = el(`
<article class="topic flip" id="ge-t-prova">
  <div class="stage-col">
    <div class="stage" id="ge-prova"></div>
    <p class="stage-cap">Quatro cópias do triângulo de lados <i>a</i>, <i>b</i>, <i>c</i> dentro de um quadrado de lado <i>a</i> + <i>b</i>. O buraco do meio é c². Reorganize e o buraco vira a² + b².</p>
    <div class="controls"></div>
    <div class="pick" hidden aria-live="polite"></div>
  </div>
  <div class="explain">
    <p class="kicker">Prova do teorema</p>
    <h3>Quatro triângulos e um quadrado de lado c</h3>
    <p>Projete mais quatro triângulos iguais ao de lados <i>a</i>, <i>b</i> e <i>c</i>: eles formam um quadrado central de lado <i>c</i>. Essa área interna é a área do quadrado maior menos as áreas dos quatro triângulos.</p>
    <div class="formula" id="ge-pv-f" aria-live="polite"></div>
    <p>Como a área de cada triângulo é base vezes altura dividido por 2, os quatro somam 2<i>ab</i>. O −2<i>ab</i> cancela com o +2<i>ab</i> e, tcharam: a hipotenusa ao quadrado é igual à soma dos quadrados dos catetos.</p>
    <p class="note fact">O botão "Rearranjo" mostra outra leitura da mesma figura: os mesmos quatro triângulos, só deslizados, deixam livres dois quadrados, a² e b². A área livre não mudou, então c² = a² + b².</p>
    <p class="note">O vídeo diz que Pitágoras fez isso há quase 3 mil anos. Pitágoras viveu por volta de 570 a 495 a.C., cerca de 2.500 anos atrás. E tábuas babilônicas, como a Plimpton 322 (por volta de 1800 a.C.), já listavam ternos como 3, 4 e 5.</p>
    ${vlinks([[650, 'Mais quatro triângulos formam o quadrado central'], [656, 'Área interna = área maior − 4 triângulos'], [669, '(a + b)² = a² + 2ab + b²'], [676, 'Área do triângulo: base × altura ÷ 2'], [683, 'O −2ab cancela com o +2ab'], [689, 'Pitágoras, sem recursos visuais']])}
  </div>
</article>`);
  root.append(t);
  const show = picker(t);
  const $ = (id) => t.querySelector(id);
  const st = { a: 1.4, b: 2.2, k: 0 };
  const seg = segmented({ label: 'Arranjo', value: 0, options: [{ value: 0, label: 'Do vídeo: buraco c²' }, { value: 1, label: 'Rearranjo: a² + b²' }] });
  const sa = slider({ label: 'Lado a', min: 0.8, max: 2.4, step: 0.05, value: st.a, format: (v) => br(v) });
  const sb = slider({ label: 'Lado b', min: 0.8, max: 2.4, step: 0.05, value: st.b, format: (v) => br(v) });
  $('.controls').append(seg.el, sa.el, sb.el);
  const report = () => {
    const { a, b } = st, S = (a + b) ** 2, T4 = 4 * (a * b) / 2, C2 = S - T4;
    console.assert(Math.abs(C2 - (a * a + b * b)) < 1e-9, 'geometria: prova de Pitágoras');
    $('#ge-pv-f').innerHTML = `<i>c</i>² = (<i>a</i> + <i>b</i>)² − 4 · <span class="frac"><span><i>a</i> · <i>b</i></span><span>2</span></span> = (<i>a</i>² + 2<i>ab</i> + <i>b</i>²) − 2<i>ab</i> = <i>a</i>² + <i>b</i>²` +
      `<small>Com a = ${br(a)} e b = ${br(b)}: ${br(S)} − ${br(T4)} = ${br(C2)} = ${br(a * a)} + ${br(b * b)}, então c = ${br(Math.sqrt(C2))}.</small>`;
  };
  report();
  const s = stage($('#ge-prova'), { camera: [0, 6.8, 5.2], target: [0, 0, 0.15], label: 'Quadrado de lado a mais b com quatro triângulos retângulos; o buraco central é o quadrado da hipotenusa.' });
  let rebuild = () => {}, arrange = () => {};
  if (s) {
    const board = new THREE.Group();
    s.add(board);
    const first = solid(s, 0, { fill: () => s.color('--muted') });
    const tris = [first, twin(first), twin(first), twin(first)];
    board.add(...tris);
    const quad = (h) => {
      const g = new THREE.BufferGeometry();
      const a = new THREE.BufferAttribute(new Float32Array(12), 3);
      g.setAttribute('position', a);
      g.setIndex([0, 1, 2, 0, 2, 3]);
      const m = new THREE.Mesh(g, tint(new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, depthWrite: false }), hc(h)));
      m.frustumCulled = false;
      m.userData.set = (pts) => { pts.forEach((p, i) => a.setXYZ(i, p[0], 0.006, p[1])); a.needsUpdate = true; };
      board.add(m);
      return m;
    };
    const holes = { c: quad(H.c), a: quad(H.a), b: quad(H.b) };
    const outline = poly(5, () => s.color('--ink'));
    board.add(outline);
    const lbls = {
      c: s.label('<span class="ge-c">c²</span>', [0, 0.2, 0], { cls: 'math', parent: board, onClick: (e) => show(e.currentTarget, 'Quadrado central c²', `Área interna = área maior − 4 triângulos = ${br((st.a + st.b) ** 2)} − ${br(2 * st.a * st.b)} = ${br(st.a ** 2 + st.b ** 2)}.`, 656, 'Área interna') }),
      a: s.label('<span class="ge-a">a²</span>', [0, 0.2, 0], { cls: 'math', parent: board, onClick: (e) => show(e.currentTarget, 'Quadrado a²', `Lado a, área ${br(st.a ** 2)}. Com os triângulos deslizados, ele aparece livre num canto.`, 689, 'Hipotenusa² = soma dos quadrados dos catetos') }),
      b: s.label('<span class="ge-b">b²</span>', [0, 0.2, 0], { cls: 'math', parent: board, onClick: (e) => show(e.currentTarget, 'Quadrado b²', `Lado b, área ${br(st.b ** 2)}. Somado a a²: ${br(st.a ** 2 + st.b ** 2)}, a mesma área de c².`, 689, 'Hipotenusa² = soma dos quadrados dos catetos') }),
    };
    const sideA = s.label('<i>a</i>', [0, 0.05, 0], { cls: 'math plain', parent: board });
    const sideB = s.label('<i>b</i>', [0, 0.05, 0], { cls: 'math plain', parent: board });
    const tlbl = s.label('<i>ab</i>/2', [0, 0.3, 0], { cls: 'math', parent: tris[0], onClick: (e) => show(e.currentTarget, 'Cada triângulo', `Área = base × altura ÷ 2 = ${br(st.a)} × ${br(st.b)} ÷ 2 = ${br((st.a * st.b) / 2)}. Os quatro juntos: 2ab = ${br(2 * st.a * st.b)}.`, 676, 'Área do triângulo') });
    let P1 = [], P2 = [];
    const ROT = [0, -Math.PI / 2, Math.PI, Math.PI / 2];
    function pose() {
      const e = ease(st.k);
      tris.forEach((m, i) => {
        const ki = Math.min(1, Math.max(0, e * 1.45 - i * 0.15));
        const lift = P1[i][0] !== P2[i][0] || P1[i][1] !== P2[i][1] ? Math.sin(Math.PI * ki) * 0.5 : 0;
        m.position.set(P1[i][0] + (P2[i][0] - P1[i][0]) * ki, lift, P1[i][1] + (P2[i][1] - P1[i][1]) * ki);
        m.rotation.y = ROT[i];
      });
      holes.c.material.opacity = 1 - e;
      holes.a.material.opacity = holes.b.material.opacity = e;
      lbls.c.visible = e < 0.5;
      lbls.a.visible = lbls.b.visible = e >= 0.5;
    }
    rebuild = () => {
      const { a, b } = st, S = a + b;
      first.userData.set([[0, 0], [a, 0], [0, b]], 0.12);
      P1 = [[0, 0], [S, 0], [S, S], [0, S]];
      P2 = [[0, a], [S, 0], [a, S], [a, a]];
      holes.c.userData.set([[a, 0], [S, a], [b, S], [0, b]]);
      holes.a.userData.set([[0, 0], [a, 0], [a, a], [0, a]]);
      holes.b.userData.set([[a, a], [S, a], [S, S], [a, S]]);
      outline.userData.set([[0, 0.003, 0], [S, 0.003, 0], [S, 0.003, S], [0, 0.003, S], [0, 0.003, 0]]);
      board.position.set(-S / 2, 0, -S / 2);
      lbls.c.position.set(S / 2, 0.2, S / 2);
      lbls.a.position.set(a / 2, 0.2, a / 2);
      lbls.b.position.set(a + b / 2, 0.2, a + b / 2);
      sideA.position.set(a / 2, 0.05, -0.28);
      sideB.position.set(a + b / 2, 0.05, -0.28);
      tlbl.position.set(a / 3, 0.3, b / 3);
      pose();
    };
    rebuild();
    arrange = (v) => { const from = st.k; tween(0, 1, 1500, (x) => { st.k = from + (v - from) * x; pose(); }); };
  }
  seg.on((v) => {
    arrange(v);
    show(null, v ? 'Rearranjo' : 'Arranjo do vídeo', v ? 'Os quatro triângulos só deslizaram. A área livre continua a mesma e agora aparece como dois quadrados: a² + b².' : 'Os quatro triângulos nos cantos deixam livre um quadrado inclinado de lado c.', v ? 689 : 650, v ? 'Hipotenusa² = soma dos quadrados dos catetos' : 'Projetar mais quatro triângulos');
  });
  const onSize = () => { st.a = sa.value; st.b = sb.value; rebuild(); report(); };
  sa.on(onSize); sb.on(onSize);
}

/* ================================================= 7. Lei dos cossenos (SVG) ====== */
{
  const t = el(`
<article class="topic" id="ge-t-cossenos">
  <div class="stage-col">
    <div class="stage" id="ge-cos"></div>
    <p class="stage-cap">Dois lados conhecidos e o ângulo θ entre eles. As barras mostram a conta: a² + b², o termo −2ab·cos θ e o resultado c².</p>
    <div class="controls"></div>
  </div>
  <div class="explain">
    <p class="kicker">Lei dos cossenos</p>
    <h3>Pitágoras é um caso particular</h3>
    <p>Se você conhece dois lados de um triângulo qualquer e o ângulo entre eles, a lei dos cossenos dá o terceiro lado: o lado desconhecido ao quadrado é a soma dos quadrados dos outros dois, menos duas vezes o produto deles vezes o cosseno do ângulo entre eles.</p>
    <div class="formula" id="ge-cos-f" aria-live="polite"></div>
    <p>Como cos 90° = 0, em 90° esse termo some e sobra o teorema de Pitágoras. Abaixo de 90° o termo encolhe c; acima, ele aumenta.</p>
    ${vlinks([[704, 'Pitágoras é caso particular da lei dos cossenos'], [710, 'Dois lados e o ângulo entre eles'], [714, 'O lado desconhecido ao quadrado'], [727, 'cos 90° = 0: sobra Pitágoras']])}
  </div>
</article>`);
  root.append(t);
  const $ = (id) => t.querySelector(id);
  const S = svg('svg', { viewBox: '0 0 400 300', class: 'ge-svg', role: 'img', 'aria-label': 'Triângulo com lados a e b e ângulo theta entre eles; barras comparam a² + b², o termo menos 2ab cosseno de theta e c².' }, $('#ge-cos'));
  const fillTri = svg('polygon', { class: 'fill-soft' }, S);
  const sA = svg('line', { class: 'hue-s', style: `--h:${H.a}`, 'stroke-width': 4, 'stroke-linecap': 'round' }, S);
  const sB = svg('line', { class: 'hue-s', style: `--h:${H.b}`, 'stroke-width': 4, 'stroke-linecap': 'round' }, S);
  const sC = svg('line', { class: 'hue-s', 'stroke-width': 4, 'stroke-linecap': 'round' }, S);
  const arc = svg('path', { class: 'ink', 'stroke-width': 1.5 }, S);
  const rightMk = svg('polyline', { class: 'ink', 'stroke-width': 1.5 }, S);
  const tA = svg('text', { class: 'math', 'text-anchor': 'middle' }, S);
  const tB = svg('text', { class: 'math', 'text-anchor': 'middle' }, S);
  const tC = svg('text', { class: 'math', 'text-anchor': 'middle' }, S);
  const tT = svg('text', { class: 'math' }, S);
  const X0 = 74, W = 300;
  const rows = [['a² + b²', 222], ['−2ab·cos θ', 250], ['c²', 278]];
  rows.forEach(([txt, y]) => { const n = svg('text', { x: X0 - 8, y: y + 4, 'text-anchor': 'end', class: 'muted-t', style: 'font-size:12px' }, S); n.textContent = txt; });
  svg('line', { x1: X0, y1: 206, x2: X0, y2: 290, class: 'ink', 'stroke-width': 1 }, S);
  const rA2 = svg('rect', { y: 214, height: 16, class: 'hue-f', style: `--h:${H.a}` }, S);
  const rB2 = svg('rect', { y: 214, height: 16, class: 'hue-f', style: `--h:${H.b}` }, S);
  const rK = svg('rect', { y: 242, height: 16, class: 'hue-f', style: `--h:${H.g}` }, S);
  const rC2 = svg('rect', { y: 270, height: 16, class: 'hue-f' }, S);
  const guide = svg('line', { y1: 208, y2: 290, class: 'faint', 'stroke-width': 1.2 }, S);
  const zeroT = svg('text', { y: 254, class: 'muted-t', style: 'font-size:12px' }, S);

  const st = { a: 3, b: 2, th: 60 };
  const sa = slider({ label: 'Lado a', min: 1, max: 4, step: 0.1, value: st.a, format: (v) => br(v, 1) });
  const sb = slider({ label: 'Lado b', min: 1, max: 4, step: 0.1, value: st.b, format: (v) => br(v, 1) });
  const sth = slider({ label: 'Ângulo θ', min: 10, max: 170, step: 1, value: st.th, format: (v) => `${v}°` });
  const go90 = el(`<div class="btn-row"><button type="button" class="btn sm">Levar θ a 90°</button></div>`);
  $('.controls').append(sa.el, sb.el, sth.el, go90);
  go90.querySelector('button').addEventListener('click', () => { const from = sth.value; tween(from, 90, 900, (v) => { sth.value = Math.round(v); }); });

  const law = (a, b, th) => Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(rad(th)));
  [[3, 4, 90, 5], [1, 1, 60, 1], [2, 2, 180, 4]].forEach(([a, b, th, c]) => console.assert(Math.abs(law(a, b, th) - c) < 1e-9, 'geometria: lei dos cossenos', a, b, th));

  function draw() {
    const { a, b, th } = st, r = rad(th);
    const A = [b * Math.cos(r), b * Math.sin(r)], B = [a, 0];
    const c = law(a, b, th);
    console.assert(Math.abs(Math.hypot(A[0] - B[0], A[1] - B[1]) - c) < 1e-9, 'geometria: c pela lei = c medido');
    const minx = Math.min(0, A[0]), maxx = Math.max(a, A[0]);
    const sc = Math.min(330 / (maxx - minx), 150 / Math.max(A[1], 0.5), 62);
    const P = (p) => [200 + (p[0] - (minx + maxx) / 2) * sc, 182 - p[1] * sc];
    const C0 = P([0, 0]), Ap = P(A), Bp = P(B);
    setA(fillTri, { points: `${C0} ${Ap} ${Bp}` });
    setA(sA, { x1: C0[0], y1: C0[1], x2: Bp[0], y2: Bp[1] });
    setA(sB, { x1: C0[0], y1: C0[1], x2: Ap[0], y2: Ap[1] });
    setA(sC, { x1: Ap[0], y1: Ap[1], x2: Bp[0], y2: Bp[1] });
    const R = 26;
    setA(arc, { d: `M ${C0[0] + R} ${C0[1]} A ${R} ${R} 0 0 0 ${C0[0] + R * Math.cos(r)} ${C0[1] - R * Math.sin(r)}` });
    const right = th === 90;
    setA(rightMk, { points: `${C0[0] + 14},${C0[1]} ${C0[0] + 14},${C0[1] - 14} ${C0[0]},${C0[1] - 14}`, visibility: right ? 'visible' : 'hidden' });
    arc.setAttribute('visibility', right ? 'hidden' : 'visible');
    setA(tA, { x: (C0[0] + Bp[0]) / 2, y: C0[1] + 20 });
    tA.textContent = `a = ${br(a, 1)}`;
    const nb = [-Math.sin(r), Math.cos(r)]; // outward normal of side b (left of C→A)
    setA(tB, { x: (C0[0] + Ap[0]) / 2 + nb[0] * 12, y: (C0[1] + Ap[1]) / 2 - nb[1] * 12 + 5, 'text-anchor': 'end' });
    tB.textContent = `b = ${br(b, 1)}`;
    const mx = (Ap[0] + Bp[0]) / 2, my = (Ap[1] + Bp[1]) / 2, cx = (C0[0] + Ap[0] + Bp[0]) / 3, cy = (C0[1] + Ap[1] + Bp[1]) / 3;
    const dl = Math.hypot(mx - cx, my - cy) || 1;
    setA(tC, { x: mx + ((mx - cx) / dl) * 12, y: my + ((my - cy) / dl) * 12 + 5, 'font-weight': 600, 'text-anchor': mx >= cx ? 'start' : 'end' });
    tC.textContent = `c = ${br(c)}`;
    setA(tT, { x: C0[0] + R * 1.25 * Math.cos(r / 2) + 4, y: C0[1] - R * 1.25 * Math.sin(r / 2) + 4 });
    tT.textContent = `θ = ${th}°`;
    // bars: one px scale for the whole (a + b)² range so moving θ never rescales
    const u = W / (a + b) ** 2, k = -2 * a * b * Math.cos(r);
    setA(rA2, { x: X0, width: a * a * u });
    setA(rB2, { x: X0 + a * a * u, width: b * b * u });
    const end = X0 + (a * a + b * b) * u;
    setA(rK, { x: end + Math.min(0, k * u), width: Math.abs(k * u) });
    setA(rC2, { x: X0, width: c * c * u });
    setA(guide, { x1: X0 + c * c * u, x2: X0 + c * c * u });
    setA(zeroT, { x: end + Math.max(0, k * u) + 6 });
    zeroT.textContent = right ? '= 0' : k < 0 ? `${br(k)} (encolhe)` : `+${br(k)} (aumenta)`;
    if (end + Math.max(0, k * u) + 6 > 330) setA(zeroT, { x: end + Math.min(0, k * u) - 6, 'text-anchor': 'end' }); else zeroT.setAttribute('text-anchor', 'start');
    const cs = Math.cos(r);
    $('#ge-cos-f').innerHTML = `<i>c</i>² = <i>a</i>² + <i>b</i>² − 2<i>ab</i>·cos <i>θ</i>` +
      `<small>${br(a * a)} + ${br(b * b)} − 2 · ${br(a, 1)} · ${br(b, 1)} · cos ${th}° (${br(cs, 3)}) = ${br(c * c)}, então c = ${br(c)}</small>` +
      (right ? `<small class="ge-zero">cos 90° = 0: o termo −2ab·cos θ some e sobra Pitágoras, c² = a² + b².</small>` : '');
  }
  const sync = () => { st.a = sa.value; st.b = sb.value; st.th = sth.value; draw(); };
  [sa, sb, sth].forEach((x) => x.on(sync));
  draw();
}
