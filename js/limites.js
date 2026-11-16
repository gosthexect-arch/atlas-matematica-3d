// Chapter 8 · Limites (21:51–24:18 of the video): the tendency of f(x) near a, the circle of radius 2 filled by inscribed
// polygons (3D, driven by one input: the side count n), the limit n → ∞ (or side → 0), and tan x at π/2 from each side.
import { THREE, mount, el, css, vlink, vlinks, stage, slider, segmented, hueColor, onTheme, mat, tween, br } from './core.js';

const root = mount('limites');
const SIDE = { L: 238, R: 28 }; // hues: "pela esquerda" (the chapter's) and "pela direita" / leftover area

css(`
#limites .pick[hidden] { display: none; }
#limites .li-L { --hue: hsl(${SIDE.L} var(--hue-s) var(--hue-l)); --hue-soft: hsl(${SIDE.L} 55% var(--hue-soft-l)); }
#limites .li-R { --hue: hsl(${SIDE.R} var(--hue-s) var(--hue-l)); --hue-soft: hsl(${SIDE.R} 55% var(--hue-soft-l)); }
#limites .li-svg { display: block; width: 100%; height: 100%; touch-action: pan-y; user-select: none; -webkit-user-select: none; }
#limites .li-svg text { font: 500 13px/1 var(--f-body); fill: var(--ink); }
#limites .li-svg .math { font: italic 400 17px/1 var(--f-math); }
#limites .li-svg .sm { font-size: 12px; fill: var(--muted); }
#limites .li-svg .axis { stroke: var(--muted); stroke-width: 1.3; fill: none; }
#limites .li-svg .grid { stroke: var(--line); stroke-width: 1; fill: none; }
#limites .li-svg .curve { stroke: var(--ink); stroke-width: 2.6; fill: none; stroke-linecap: round; stroke-linejoin: round; }
#limites .li-svg .guide { stroke: var(--muted); stroke-width: 1.2; stroke-dasharray: 4 4; fill: none; }
#limites .li-svg .drop { stroke: var(--hue); stroke-width: 1.6; stroke-dasharray: 3 4; fill: none; }
#limites .li-svg .hue-f { fill: var(--hue); }
#limites .li-svg .hue-t { fill: var(--hue); font-weight: 600; }
#limites .li-svg .hole { fill: var(--surface); stroke: var(--ink); stroke-width: 2.4; }
#limites .li-svg .lens { fill: var(--surface); stroke: var(--line); stroke-width: 1.5; }
#limites .li-svg .pt { fill: var(--muted); opacity: .5; }
#limites .li-svg .goal { fill: var(--surface); stroke: var(--hue); stroke-width: 2; }
#limites .li-svg .hit { fill: transparent; cursor: crosshair; }
#limites .li-tw { overflow-x: auto; }
#limites .li-table { width: 100%; border-collapse: collapse; font: 500 13px/1.4 var(--f-mono); font-variant-numeric: tabular-nums; }
#limites .li-table th, #limites .li-table td { padding: 5px 8px; border-bottom: 1px solid var(--line); text-align: right; white-space: nowrap; }
#limites .li-table th { font: 600 12px/1.3 var(--f-body); color: var(--muted); }
#limites .li-table td.li-L, #limites .li-table td.li-R { color: var(--hue); }
#limites .li-table tr.on td { background: color-mix(in srgb, var(--ink) 7%, transparent); }
#limites .li-no b { color: var(--mark); }
/* charts scale down with the stage: keep their type readable on phones */
@media (max-width: 600px) {
  #limites .li-svg text { font-size: 17px; }
  #limites .li-svg .sm { font-size: 16px; }
  #limites .li-svg .math { font-size: 20px; }
  #limites #li-conv text { font-size: 20px; }
  #limites #li-conv .sm { font-size: 19px; }
}
`);

/* ------------------------------------------------------------ shared local helpers ---- */
const themed = [];
/** Color a material from a token function now and again on every theme change (or toggle). */
const tint = (m, fn) => { m.color.set(fn()); themed.push([m, fn]); return m; };
const retint = () => themed.forEach(([m, fn]) => m.color.set(fn()));
onTheme(retint);
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
const sgn = (v, d) => (v < 0 ? '−' : '+') + br(Math.abs(v), d);
const press = (b, on) => b.setAttribute('aria-pressed', String(on));
/** .pick card of a topic. defs[key]() → [title, body, second, hint]; refresh() re-renders after the model changes. */
function picker(box, defs) {
  let on = null, key = null;
  const render = () => { const [h, p, seg, hint] = defs[key](); box.innerHTML = `<h4>${h}</h4><p>${p}</p>${vlink(seg, hint)}`; box.hidden = false; };
  return {
    show(btn, k) { on?.classList.remove('on'); on = btn || null; on?.classList.add('on'); key = k; render(); },
    refresh() { if (key) render(); },
  };
}
/** Camera move with the state-to-state ease; the orbit target travels too. */
function flyTo(s, [pos, tgt], ms = 900) {
  const p0 = s.camera.position.clone(), t0 = s.controls.target.clone();
  const p1 = new THREE.Vector3(...pos), t1 = new THREE.Vector3(...tgt);
  tween(0, 1, ms, (k) => { s.camera.position.lerpVectors(p0, p1, k); s.controls.target.lerpVectors(t0, t1, k); s.controls.update(); });
}

/* ================================================ 1. A tendência (x → a, x ≠ a) ===== */
{
  const f = (x) => (x * x - 1) / (x - 1); // our example: 0/0 at x = 1, tends to 2
  console.assert(Math.abs(f(0.999) - 1.999) < 1e-9 && Math.abs(f(1.001) - 2.001) < 1e-9 && Number.isNaN(f(1)), 'limites: (x²−1)/(x−1) tende a 2 e não existe em 1');
  const ROWS = [0.5, 0.1, 0.01, 0.001];
  const t = el(`
<article class="topic" id="li-t-tendencia">
  <div class="stage-col">
    <div class="stage" id="li-tend"></div>
    <p class="stage-cap">Exemplo nosso: <span class="math"><i>f</i>(<i>x</i>) = (<i>x</i>² − 1)/(<i>x</i> − 1)</span>. Em <span class="math"><i>x</i> = 1</span> a conta vira 0/0, por isso o gráfico tem um buraco. Os pontos chegam tão perto quanto você quiser, sem nunca pisar nele.</p>
    <div class="controls"></div>
  </div>
  <div class="explain">
    <p class="kicker">Cálculo · o que é um limite</p>
    <h3>O que importa é a tendência</h3>
    <p>Já se falou demais de função, e paciência tem limite. Por falar em limite, aqui começa o cálculo diferencial e integral, a parte em que, nas palavras do vídeo, se separam os homens dos meninos.</p>
    <p>Limite, além de ser aquilo que se coloca nas crianças, é o comportamento de <i>f</i>(<i>x</i>) quando <i>x</i> fica bem próximo de um valor <i>a</i>, com <i>x</i> ≠ <i>a</i>. A função nem precisa existir em <i>a</i>. Importa para onde ela caminha.</p>
    <div class="stats">
      <div class="stat li-L"><b id="li-xL">0</b><span>x pela esquerda</span></div>
      <div class="stat li-L"><b id="li-fL">0</b><span>f(x) pela esquerda</span></div>
      <div class="stat li-R"><b id="li-xR">0</b><span>x pela direita</span></div>
      <div class="stat li-R"><b id="li-fR">0</b><span>f(x) pela direita</span></div>
    </div>
    <div class="formula">lim<sub><i>x</i>→1</sub> <span class="frac"><span><i>x</i>² − 1</span><span><i>x</i> − 1</span></span> = lim<sub><i>x</i>→1</sub> (<i>x</i> + 1) = 2<small>Com x ≠ 1 dá para cancelar o fator (x − 1). Sobra x + 1, que tende a 2.</small></div>
    <div class="li-tw"><table class="li-table">
      <caption class="sr-only">Valores de f(x) chegando a 2 pelos dois lados de x = 1</caption>
      <thead><tr><th scope="col">distância</th><th scope="col">x (esq.)</th><th scope="col">f(x)</th><th scope="col">x (dir.)</th><th scope="col">f(x)</th></tr></thead>
      <tbody>${ROWS.map((h) => `<tr><td>${br(h, 3)}</td><td class="li-L">${br(1 - h, 3)}</td><td class="li-L">${br(f(1 - h), 3)}</td><td class="li-R">${br(1 + h, 3)}</td><td class="li-R">${br(f(1 + h), 3)}</td></tr>`).join('')}</tbody>
    </table></div>
    ${vlinks([[1311, 'Paciência tem limite'], [1317, 'Cálculo diferencial e integral: “separa os homens dos meninos”'], [1324, 'Limite, além de pôr nas crianças…'], [1330, 'f(x) para x bem perto de a, com x ≠ a'], [1337, 'Exemplo de uma função qualquer'], [1343, 'O que importa é a tendência']])}
  </div>
</article>`);
  root.append(t);
  const q = (sel) => t.querySelector(sel);
  const X = lin(-0.4, 2.4, 56, 456), Y = lin(-0.3, 3.6, 326, 26);
  const S = svg('svg', { viewBox: '0 0 480 360', class: 'li-svg', role: 'img', 'aria-label': 'Gráfico de f(x) = (x² − 1)/(x − 1): uma reta com um buraco no ponto (1, 2). Um ponto se aproxima do buraco pela esquerda e outro pela direita; uma lupa mostra que o buraco continua lá.' }, q('#li-tend'));
  for (const gx of [0.5, 1, 1.5, 2]) svg('line', { x1: X(gx), y1: Y(-0.3), x2: X(gx), y2: Y(3.6), class: 'grid' }, S);
  for (const gy of [1, 2, 3]) svg('line', { x1: X(-0.4), y1: Y(gy), x2: X(2.4), y2: Y(gy), class: 'grid' }, S);
  svg('line', { x1: X(-0.4), y1: Y(0), x2: X(2.4), y2: Y(0), class: 'axis' }, S);
  svg('line', { x1: X(0), y1: Y(-0.3), x2: X(0), y2: Y(3.6), class: 'axis' }, S);
  text(S, { x: X(2.4) - 4, y: Y(0) - 8, class: 'math', 'text-anchor': 'end' }, 'x');
  text(S, { x: X(0) + 8, y: Y(3.6) + 14, class: 'math' }, 'y');
  text(S, { x: X(2), y: Y(0) + 18, class: 'sm', 'text-anchor': 'middle' }, '2');
  for (const gy of [1, 3]) text(S, { x: X(0) - 8, y: Y(gy) + 4, class: 'sm', 'text-anchor': 'end' }, String(gy));
  text(S, { x: X(1), y: Y(0) + 19, class: 'math', 'text-anchor': 'middle' }, 'a = 1');
  text(S, { x: X(0) - 8, y: Y(2) + 5, class: 'math', 'text-anchor': 'end' }, '2');
  svg('line', { x1: X(1), y1: Y(0), x2: X(1), y2: Y(2), class: 'guide' }, S);
  svg('line', { x1: X(0), y1: Y(2), x2: X(1), y2: Y(2), class: 'guide' }, S);
  svg('path', { d: `M ${X(-0.4)} ${Y(0.6)} L ${X(2.4)} ${Y(3.4)}`, class: 'curve' }, S);
  text(S, { x: X(1.62), y: Y(3.15), class: 'math', 'text-anchor': 'end' }, 'f(x)');
  const G = {};
  for (const k of ['L', 'R']) {
    const g = svg('g', { class: `li-${k}` }, S);
    G[k] = { g, v: svg('line', { class: 'drop' }, g), hz: svg('line', { class: 'drop' }, g), dot: svg('circle', { r: 6, class: 'hue-f' }, g), lab: text(g, { class: 'hue-t' }, '') };
  }
  svg('circle', { cx: X(1), cy: Y(2), r: 6.5, class: 'hole' }, S); // the truth on top: no point at x = 1
  // the lens: at any zoom the picture is the same, a line, a hole, and a point on each side
  const LC = [395, 228], LR = 58, hx = X(1), hy = Y(2), dl = Math.hypot(LC[0] - hx, LC[1] - hy);
  const lens = svg('g', {}, S);
  svg('line', { x1: hx + ((LC[0] - hx) / dl) * 9, y1: hy + ((LC[1] - hy) / dl) * 9, x2: LC[0] - ((LC[0] - hx) / dl) * LR, y2: LC[1] - ((LC[1] - hy) / dl) * LR, class: 'guide' }, lens);
  svg('circle', { cx: LC[0], cy: LC[1], r: LR, class: 'lens' }, lens);
  const d45 = (LR * 0.86) / Math.SQRT2;
  svg('line', { x1: LC[0] - d45, y1: LC[1] + d45, x2: LC[0] + d45, y2: LC[1] - d45, class: 'curve' }, lens);
  const lensDot = {
    L: svg('circle', { cx: LC[0] - LR * 0.3, cy: LC[1] + LR * 0.3, r: 5.5, class: 'hue-f li-L' }, lens),
    R: svg('circle', { cx: LC[0] + LR * 0.3, cy: LC[1] - LR * 0.3, r: 5.5, class: 'hue-f li-R' }, lens),
  };
  svg('circle', { cx: LC[0], cy: LC[1], r: 6, class: 'hole' }, lens);
  const lensT = text(lens, { x: LC[0], y: LC[1] - LR - 9, class: 'sm', 'text-anchor': 'middle' }, '');

  const dec = (h) => (h < 0.0095 ? 4 : 3);
  const sl = slider({ id: 'li-tend-h', label: 'Distância de <i>x</i> até <i>a</i>', min: 0, max: 3, step: 0.01, value: 0.3, format: (u) => br(10 ** -u, dec(10 ** -u)) });
  const side = segmented({ label: 'Chegar', options: [{ value: 'both', label: 'pelos dois lados' }, { value: 'L', label: 'pela esquerda' }, { value: 'R', label: 'pela direita' }], value: 'both' });
  const row = el(`<div class="btn-row"><button type="button" class="btn sm">Aproximar de a</button><button type="button" class="btn sm">Afastar</button></div>`);
  q('.controls').append(sl.el, side.el, row);
  const rows = [...t.querySelectorAll('tbody tr')];
  const draw = () => {
    const h = 10 ** -sl.value, d = dec(h), near = h < 0.2;
    for (const k of ['L', 'R']) {
      const x = k === 'L' ? 1 - h : 1 + h, y = f(x), on = side.value === 'both' || side.value === k, g = G[k];
      g.g.style.display = on ? '' : 'none';
      lensDot[k].style.display = on ? '' : 'none';
      setA(g.dot, { cx: X(x), cy: Y(y) });
      setA(g.v, { x1: X(x), y1: Y(0), x2: X(x), y2: Y(y) });
      setA(g.hz, { x1: X(0), y1: Y(y), x2: X(x), y2: Y(y) });
      // left label below the rising line, right label above it, so they never cross
      setA(g.lab, k === 'L' ? { x: X(x) + 10, y: Y(y) + 20, 'text-anchor': 'start' } : { x: X(x) - 10, y: Y(y) - 12, 'text-anchor': 'end' });
      g.lab.textContent = `f = ${br(y, d)}`;
      g.lab.style.display = near ? 'none' : '';
      q(`#li-x${k}`).textContent = on ? br(x, d) : '–';
      q(`#li-f${k}`).textContent = on ? br(y, d) : '–';
    }
    lens.style.display = near ? '' : 'none';
    lensT.textContent = `lupa ×${br(Math.round(1 / h), 0)}`;
    let best = 0;
    ROWS.forEach((r, i) => { if (Math.abs(Math.log10(h / r)) < Math.abs(Math.log10(h / ROWS[best]))) best = i; });
    rows.forEach((tr, i) => tr.classList.toggle('on', i === best && Math.abs(Math.log10(h / ROWS[best])) < 0.5));
  };
  sl.on(draw);
  side.on(draw);
  const [goB, backB] = row.querySelectorAll('button');
  goB.addEventListener('click', () => {
    const from = sl.value >= 2.95 ? 0 : sl.value;
    tween(from, 3, 2800 * (1 - from / 3) + 400, (u) => { sl.value = u; });
  });
  backB.addEventListener('click', () => tween(sl.value, 0, 700, (u) => { sl.value = u; }));
  draw();
}

/* ============================== 2 + 3. Círculo de raio 2 e polígonos inscritos ===== */
const R = 2, CIRC = Math.PI * R * R;
const area = (n) => (n / 2) * R * R * Math.sin((2 * Math.PI) / n); // n triangles of ½·r²·sen(2π/n)
const sideLen = (n) => 2 * R * Math.sin(Math.PI / n);
{
  let ok = true;
  for (let n = 3; n < 96; n++) ok = ok && area(n) < area(n + 1) && area(n + 1) < CIRC && sideLen(n + 1) < sideLen(n);
  console.assert(ok && Math.abs(area(6) - 6 * Math.sqrt(3)) < 1e-9 && Math.abs(area(12) - 12) < 1e-9 && CIRC - area(96) < 0.01, 'limites: áreas dos polígonos crescem até 4π');
}
/** One input drives the 3D model, its readouts and the convergence chart: the number of sides. */
const N = { n: 5, fns: [], set(v) { v = Math.max(3, Math.min(96, Math.round(v))); if (v === this.n) return; this.n = v; for (const fn of this.fns) fn(v); } };

{
  const t = el(`
<article class="topic" id="li-t-poligonos">
  <div class="stage-col">
    <div class="stage" id="li-poly"></div>
    <p class="stage-cap">Círculo de raio 2 com um polígono regular inscrito. Cada fatia é um triângulo que sai do centro; o laranja é o espaço que sobra. Clique nos rótulos.</p>
    <div class="controls"></div>
  </div>
  <div class="explain">
    <p class="kicker">Exemplo do vídeo · círculo de raio 2</p>
    <h3>Encher o círculo com triângulos</h3>
    <p>Uma circunferência de raio 2 tem área π<i>r</i>² = 4π, perto de 12,56. Agora suponha que você não saiba essa fórmula. Dá para estimar a área com figuras mais simples: um polígono de 5 lados é, na verdade, 5 triângulos iguais.</p>
    <p>Com 5 lados ainda sobra muito espaço, e a área fica longe de 12,56. Troque por um hexágono, depois 8, 10, 12 e 16 lados. Quanto mais lados, menor cada lado e menos espaço sobrando. A área do polígono chega cada vez mais perto da área do círculo.</p>
    <div class="stats">
      <div class="stat"><b id="li-pn">5</b><span>lados (e triângulos)</span></div>
      <div class="stat"><b id="li-pa">0</b><span>área do polígono</span></div>
      <div class="stat"><b>${br(CIRC, 3)}</b><span>área do círculo, 4π</span></div>
      <div class="stat li-R"><b id="li-pf">0</b><span>espaço que sobra</span></div>
    </div>
    <div class="formula" id="li-pform"></div>
    <div class="pick" hidden></div>
    <p class="note">O vídeo usa π ≈ 3,14 e chega a 12,56. Com mais casas, 4π = 12,566…, que arredonda para 12,57.</p>
    ${vlinks([[1351, 'Circunferência de raio 2'], [1357, 'Área π r², em torno de 12,56'], [1364, 'Sem a fórmula: figuras mais simples'], [1371, '5 lados são 5 triângulos, longe de 12,56'], [1378, 'Hexágono, 8, 10, 12 e 16 lados'], [1387, 'Mais lados: lados menores, menos sobra'], [1394, 'A área se aproxima de 12,56']])}
  </div>
</article>`);
  root.append(t);
  const q = (sel) => t.querySelector(sel);
  const pick = picker(q('.pick'), {
    r: () => ['Raio 2', 'Do centro até a borda são 2 unidades. Todo vértice do polígono inscrito toca a circunferência, então os dois lados iguais de cada triângulo medem exatamente r = 2.', 1351, 'Circunferência de raio 2'],
    circ: () => ['Área do círculo', `π·r² = π·2² = 4π = ${br(CIRC, 4)}. É o alvo: o polígono chega perto sem nunca passar.`, 1357, 'Área π r² ≈ 12,56'],
    tri: () => [`1 de ${N.n} triângulos`, `Dois lados medem r = 2 e o ângulo entre eles é 360° ÷ ${N.n} = ${br(360 / N.n, 1)}°. A área de cada um é ½·r²·sen(360°/${N.n}) = ${br(area(N.n) / N.n, 4)}. Vezes ${N.n}, dá ${br(area(N.n), 3)}.`, 1371, 'O polígono são triângulos'],
    sobra: () => ['O espaço que sobra', `Entre o polígono e o círculo ficam ${N.n} pedacinhos que somam ${br(CIRC - area(N.n), 3)}, isto é, ${br(100 * (1 - area(N.n) / CIRC), 2)}% do círculo. Mais lados, lados menores e menos sobra.`, 1387, 'Mais lados, menos espaço sobrando'],
  });
  const sl = slider({ id: 'li-n', label: 'Lados do polígono', min: 3, max: 96, step: 1, value: N.n, format: (v) => String(v) });
  const PRE = [5, 6, 8, 10, 12, 16, 96];
  const presets = el(`<div class="seg" role="group" aria-label="Polígonos do vídeo"><span class="seg-label">Do vídeo</span>${PRE.map((n) => `<button type="button" class="btn sm" data-n="${n}" aria-pressed="false">${n}</button>`).join('')}</div>`);
  const view = segmented({ label: 'Vista', options: [{ value: 'persp', label: 'Perspectiva' }, { value: 'top', label: 'De cima' }], value: 'persp' });
  const show = el(`<div class="seg" role="group" aria-label="Mostrar"><span class="seg-label">Mostrar</span><button type="button" class="btn sm" aria-pressed="true">Triângulos</button><button type="button" class="btn sm" aria-pressed="true">Sobra</button><button type="button" class="btn sm" aria-pressed="false">Sequência do vídeo</button></div>`);
  const [triB, sobraB, tourB] = show.querySelectorAll('button');
  q('.controls').append(sl.el, presets, view.el, show);

  const report = (n) => {
    const A = area(n);
    q('#li-pn').textContent = n;
    q('#li-pa').textContent = br(A, 3);
    q('#li-pf').textContent = br(CIRC - A, 3);
    q('#li-pform').innerHTML = `<i>A</i><sub>${n}</sub> = <span class="frac"><span>${n}</span><span>2</span></span>· 2² · sen(360°/${n}) = ${br(A, 3)}<small>Área de n triângulos de lados r, r e ângulo 360°/n no centro: A = (n/2)·r²·sen(360°/n).</small>`;
    sl.input.value = n; sl.el.querySelector('output').textContent = n;
    presets.querySelectorAll('button').forEach((b) => press(b, +b.dataset.n === n));
    pick.refresh();
  };
  N.fns.push(report);

  const VIEWS = { persp: [[0, 4.3, 4.7], [0, 0, 0.15]], top: [[0, 7.6, 0.01], [0, 0, 0]] };
  const s = stage(q('#li-poly'), { camera: VIEWS.persp[0], target: VIEWS.persp[1], label: 'Disco de raio 2 com um polígono regular inscrito em relevo, dividido em triângulos que saem do centro. O espaço entre o polígono e a circunferência aparece em laranja.' });
  const opt = { tri: true, sobra: true };
  if (s) {
    const TOP = 0.26, BASE = 0.04;
    const surf = () => s.color('--surface'), ink = () => s.color('--ink');
    const mHot = tint(mat('#888', { roughness: 0.42 }), () => s.hue());
    const mA = tint(mat('#888'), () => mix(s.hue(), surf(), 0.22));
    const mB = tint(mat('#888'), () => mix(s.hue(), surf(), opt.tri ? 0.5 : 0.22));
    const mDisk = tint(mat('#888', { roughness: 0.8 }), () => (opt.sobra ? hueColor(SIDE.R) : mix(ink(), surf(), 0.82)));
    const mInk = tint(mat('#888', { roughness: 0.5 }), ink);
    const lineMat = tint(new THREE.LineBasicMaterial({ transparent: true, opacity: 0.6 }), ink);
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(R, R, BASE, 128), mDisk);
    disk.position.y = BASE / 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.028, 8, 160), mInk);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = BASE;
    const poly = new THREE.Mesh(new THREE.BufferGeometry(), [mHot, mA, mB]);
    const spokes = new THREE.LineSegments(new THREE.BufferGeometry(), lineMat);
    const outline = new THREE.LineSegments(new THREE.BufferGeometry(), lineMat);
    const wedge = new THREE.Group();
    wedge.add(poly, spokes, outline);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, R, 10).rotateZ(-Math.PI / 2).translate(R / 2, 0, 0), mInk);
    rod.position.y = TOP + 0.03;
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), mInk);
    hub.position.y = TOP + 0.03;
    s.add(disk, rim, wedge, rod, hub);

    const hot = (html, k, cls = '') => s.label(html, [0, 0, 0], { cls, onClick: (e) => pick.show(e.currentTarget, k) });
    const lR = hot('<i>r</i> = 2', 'r', 'math');
    const lC = hot('círculo: π<i>r</i>² ≈ 12,57', 'circ');
    const lT = hot('triângulo', 'tri');
    const lS = hot('sobra', 'sobra');
    lC.position.set(R * 1.08 * Math.cos(2.3), 0.1, -R * 1.08 * Math.sin(2.3));

    const ang = (i, n) => (i * 2 * Math.PI) / n; // vertex i at (r cos θ, ·, −r sin θ): counter-clockwise seen from above
    let lastBuild = 0;
    const build = (n) => {
      const order = [0];
      for (let i = 2; i < n; i += 2) order.push(i);
      for (let i = 1; i < n; i += 2) order.push(i);
      const P = new Float32Array(n * 27);
      let o = 0;
      const put = (x, y, z) => { P[o++] = x; P[o++] = y; P[o++] = z; };
      for (const i of order) {
        const ax = R * Math.cos(ang(i, n)), az = -R * Math.sin(ang(i, n)), bx = R * Math.cos(ang(i + 1, n)), bz = -R * Math.sin(ang(i + 1, n));
        put(0, TOP, 0); put(ax, TOP, az); put(bx, TOP, bz); // top face, normal +y
        put(ax, BASE, az); put(bx, BASE, bz); put(bx, TOP, bz); // outer wall, normal outward
        put(ax, BASE, az); put(bx, TOP, bz); put(ax, TOP, az);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3));
      g.computeVertexNormals();
      const ev = Math.floor((n - 1) / 2), od = Math.floor(n / 2);
      g.addGroup(0, 9, 0); g.addGroup(9, 9 * ev, 1); g.addGroup(9 * (1 + ev), 9 * od, 2);
      poly.geometry.dispose(); poly.geometry = g;
      const sp = [], ou = [], y = TOP + 0.003;
      for (let i = 0; i < n; i++) {
        const a = new THREE.Vector3(R * Math.cos(ang(i, n)), y, -R * Math.sin(ang(i, n))), b = new THREE.Vector3(R * Math.cos(ang(i + 1, n)), y, -R * Math.sin(ang(i + 1, n)));
        sp.push(new THREE.Vector3(0, y, 0), a);
        ou.push(a, b);
      }
      spokes.geometry.dispose(); spokes.geometry = new THREE.BufferGeometry().setFromPoints(sp);
      outline.geometry.dispose(); outline.geometry = new THREE.BufferGeometry().setFromPoints(ou);
      // labels: the highlighted wedge 0, the radius to the front-most vertex, a leftover sliver on the left
      const a1 = ang(1, n);
      lT.position.set((R + R * Math.cos(a1)) / 3, TOP + 0.02, (-R * Math.sin(a1)) / 3);
      const kr = Math.round(0.75 * n) % n, ar = ang(kr, n);
      rod.rotation.y = ar;
      lR.position.set(0.55 * R * Math.cos(ar) + 0.24 * Math.sin(ar), TOP + 0.05, -0.55 * R * Math.sin(ar) + 0.24 * Math.cos(ar));
      const am = ang(Math.round((200 / 360) * n - 0.5) + 0.5, n), rm = (R + R * Math.cos(Math.PI / n)) / 2;
      lS.position.set(rm * Math.cos(am), BASE + 0.02, -rm * Math.sin(am));
      const now = performance.now();
      if (now - lastBuild > 300) tween(0.3, 1, 420, (k) => { wedge.scale.y = k; }); // pop only on discrete steps, not during a sweep
      lastBuild = now;
    };
    N.fns.push(build);
    build(N.n);
    view.on((v) => flyTo(s, VIEWS[v]));
    triB.addEventListener('click', () => { opt.tri = !opt.tri; press(triB, opt.tri); spokes.visible = opt.tri; retint(); });
    sobraB.addEventListener('click', () => { opt.sobra = !opt.sobra; press(sobraB, opt.sobra); lS.visible = opt.sobra; retint(); });
  } else {
    [triB, sobraB].forEach((b) => { b.disabled = true; });
  }

  // the sequence the video draws, then onward to Archimedes' 96 sides
  const SEQ = [[5, 1300], [6, 1100], [8, 1100], [10, 1100], [12, 1100], [16, 1300], [24, 500], [32, 500], [48, 500], [64, 500], [96, 900]];
  let timer = 0;
  const stopTour = () => { clearTimeout(timer); timer = 0; press(tourB, false); };
  const runTour = (i) => {
    if (i >= SEQ.length) { stopTour(); return; }
    N.set(SEQ[i][0]);
    timer = setTimeout(() => runTour(i + 1), SEQ[i][1]);
  };
  tourB.addEventListener('click', () => { if (timer) stopTour(); else { press(tourB, true); runTour(0); } });
  sl.on((v) => { stopTour(); N.set(v); });
  presets.addEventListener('click', (e) => { const b = e.target.closest('button[data-n]'); if (b) { stopTour(); N.set(+b.dataset.n); } });
  report(N.n);
}

/* ======================================== 3. Quando n tende ao infinito (gráfico) ===== */
{
  const t = el(`
<article class="topic flip" id="li-t-infinito">
  <div class="stage-col">
    <div class="stage short" id="li-conv"></div>
    <p class="stage-cap">Cada ponto é um polígono. Clique ou arraste no gráfico para escolher o número de lados; o modelo 3D acima acompanha.</p>
    <div class="controls"></div>
  </div>
  <div class="explain">
    <p class="kicker">A definição de limite</p>
    <h3>Infinitos lados, área 12,56</h3>
    <p>Quando a quantidade de lados tende ao infinito, a área tende a 12,56. É isso que um limite descreve: o valor de que <i>f</i>(<i>x</i>) se aproxima quando <i>x</i> tende a um determinado valor.</p>
    <p>Aqui o <i>x</i> é o número de lados, que tende ao infinito. Dá para olhar do outro jeito: o tamanho de cada lado tende a zero. Nos dois casos a área tende a 4π. E repare que não é preciso saber o número exato de lados para enxergar a tendência.</p>
    <div class="stats">
      <div class="stat"><b id="li-cn">5</b><span>lados <i>n</i></span></div>
      <div class="stat"><b id="li-cs">0</b><span>tamanho do lado <i>s</i></span></div>
      <div class="stat"><b id="li-ca">0</b><span>área <i>A</i>(<i>n</i>)</span></div>
    </div>
    <div class="formula">lim<sub><i>n</i>→∞</sub> <span class="frac"><span><i>n</i></span><span>2</span></span>·<i>r</i>²·sen<span class="frac"><span>2π</span><span><i>n</i></span></span> = π<i>r</i>² = 4π<small>Ao mesmo tempo, o lado s = 2r·sen(π/n) tende a 0.</small></div>
    <p class="note fact">Arquimedes usou essa ideia por volta de 250 a.C. Com polígonos de 96 lados, por dentro e por fora do círculo, mostrou que π fica entre 3 10/71 e 3 1/7.</p>
    ${vlinks([[1401, 'Lados tendendo ao infinito, área tendendo a 12,56'], [1409, 'Limite: o valor de f(x) quando x tende a um valor'], [1416, 'Infinitos lados, ou lado tendendo a zero'], [1425, 'Não precisa saber o número exato de lados']])}
  </div>
</article>`);
  root.append(t);
  const q = (sel) => t.querySelector(sel);
  const axis = segmented({ label: 'Eixo horizontal', options: [{ value: 'n', label: 'número de lados → ∞' }, { value: 's', label: 'tamanho do lado → 0' }], value: 'n' });
  const row = el(`<div class="btn-row"><button type="button" class="btn sm">Tender ao infinito</button><button type="button" class="btn sm">Voltar a 5 lados</button></div>`);
  q('.controls').append(axis.el, row);
  const XN = lin(3, 96, 64, 612), XS = lin(0, 3.6, 64, 612), Y = lin(5, 13, 312, 26);
  const S = svg('svg', { viewBox: '0 0 640 360', class: 'li-svg', role: 'img', 'aria-label': 'Gráfico da área do polígono em função do número de lados: os pontos sobem e encostam na linha de 4π. No outro modo, o eixo é o tamanho do lado e os pontos chegam a 4π quando o lado vai a zero.' }, q('#li-conv'));
  for (const gy of [6, 8, 10, 12]) { svg('line', { x1: 64, y1: Y(gy), x2: 612, y2: Y(gy), class: 'grid' }, S); text(S, { x: 56, y: Y(gy) + 4, class: 'sm', 'text-anchor': 'end' }, String(gy)); }
  svg('line', { x1: 64, y1: Y(5), x2: 612, y2: Y(5), class: 'axis' }, S);
  svg('line', { x1: 64, y1: Y(5), x2: 64, y2: Y(13), class: 'axis' }, S);
  text(S, { x: 70, y: 18, class: 'sm' }, 'área do polígono');
  const g4 = svg('g', { class: 'li-R' }, S);
  svg('line', { x1: 64, y1: Y(CIRC), x2: 612, y2: Y(CIRC), class: 'drop' }, g4);
  text(g4, { x: 608, y: Y(CIRC) - 8, class: 'hue-t', 'text-anchor': 'end' }, `4π ≈ ${br(CIRC, 3)}`);
  const ticks = { n: svg('g', {}, S), s: svg('g', {}, S) };
  for (const n of [3, 16, 32, 48, 64, 80, 96]) text(ticks.n, { x: XN(n), y: Y(5) + 18, class: 'sm', 'text-anchor': 'middle' }, String(n));
  for (const v of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]) text(ticks.s, { x: XS(v), y: Y(5) + 18, class: 'sm', 'text-anchor': 'middle' }, br(v, v % 1 ? 1 : 0));
  const title = text(S, { x: 608, y: Y(5) - 8, class: 'sm', 'text-anchor': 'end' }, '');
  const goal = svg('circle', { cx: XS(0), cy: Y(CIRC), r: 6, class: 'goal' }, S);
  const pts = [];
  for (let n = 3; n <= 96; n++) pts.push(svg('circle', { r: 2.6, class: 'pt' }, S));
  const cur = svg('g', {}, S);
  const curV = svg('line', { class: 'guide' }, cur);
  const curDot = svg('circle', { r: 7, class: 'hue-f' }, cur);
  const curT = text(cur, { class: 'hue-t' }, '');
  svg('rect', { x: 0, y: 0, width: 640, height: 360, class: 'hit' }, S);
  let k = 0; // 0 = horizontal axis is n, 1 = horizontal axis is s (eased in between)
  const px = (n) => XN(n) + (XS(sideLen(n)) - XN(n)) * k;
  const draw = () => {
    for (let n = 3; n <= 96; n++) setA(pts[n - 3], { cx: px(n), cy: Y(area(n)) });
    ticks.n.style.opacity = 1 - k; ticks.s.style.opacity = k; goal.style.opacity = k;
    title.textContent = k < 0.5 ? 'número de lados n →' : '← tamanho do lado s';
    const n = N.n, x = px(n), y = Y(area(n));
    setA(curV, { x1: x, y1: Y(5), x2: x, y2: y });
    setA(curDot, { cx: x, cy: y });
    // the label goes below the point on the side where the dots are lower: right of it for n, left of it for s
    const left = k >= 0.5 ? x > 230 : x > 470;
    setA(curT, { x: x + (left ? -12 : 12), y: y + 22, 'text-anchor': left ? 'end' : 'start' });
    curT.textContent = `n = ${n} · A = ${br(area(n), 3)}`;
    q('#li-cn').textContent = n;
    q('#li-cs').textContent = br(sideLen(n), 3);
    q('#li-ca').textContent = br(area(n), 3);
  };
  N.fns.push(draw);
  axis.on((v) => tween(k, v === 's' ? 1 : 0, 800, (u) => { k = u; draw(); }));
  // pointer: the nearest polygon to the pointer's x becomes the model's n
  const pickAt = (e) => {
    const r = S.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * 640;
    let best = 3;
    for (let n = 3; n <= 96; n++) if (Math.abs(px(n) - x) < Math.abs(px(best) - x)) best = n;
    N.set(best);
  };
  S.addEventListener('pointerdown', (e) => { S.setPointerCapture(e.pointerId); pickAt(e); });
  S.addEventListener('pointermove', (e) => { if (e.buttons) pickAt(e); });
  const [infB, backB] = row.querySelectorAll('button');
  infB.addEventListener('click', () => tween(0, 1, 3200, (u) => N.set(3 * 32 ** u))); // 3 → 96 sides, evenly in log scale
  backB.addEventListener('click', () => N.set(5));
  draw();
}

/* =================================== 4. Limites laterais: a tangente em π/2 ======== */
{
  const t = el(`
<article class="topic" id="li-t-laterais">
  <div class="stage-col">
    <div class="stage" id="li-tan"></div>
    <p class="stage-cap">Gráfico de tan <i>x</i> entre 0 e π. A linha tracejada em π/2 é onde a tangente não existe. Aproxime os pontos dela.</p>
    <div class="controls"></div>
  </div>
  <div class="explain">
    <p class="kicker">Limites laterais</p>
    <h3>Pela esquerda +∞, pela direita −∞</h3>
    <p>Um limite só existe se os limites laterais forem iguais: a tendência tem de ser a mesma chegando por um lado e pelo outro. No exemplo do começo do capítulo os dois lados chegavam a 2, e aquele limite existe.</p>
    <p>É por isso que o limite da tangente em π/2 não existe. Chegando pela esquerda, ela tende a mais infinito. Chegando pela direita, vai para menos infinito. Fica indefinida: sem rumo, à deriva.</p>
    <div class="stats">
      <div class="stat li-L"><b id="li-tL">0</b><span>tan(π/2 − <i>h</i>)</span></div>
      <div class="stat li-R"><b id="li-tR">0</b><span>tan(π/2 + <i>h</i>)</span></div>
      <div class="stat li-no"><b>não existe</b><span>lim tan <i>x</i> em π/2</span></div>
    </div>
    <div class="formula">lim<sub><i>x</i>→π/2<sup>−</sup></sub> tan <i>x</i> = +∞ &nbsp;·&nbsp; lim<sub><i>x</i>→π/2<sup>+</sup></sub> tan <i>x</i> = −∞<small>Os limites laterais são diferentes, então o limite em π/2 não existe.</small></div>
    <p class="note fact"><span>tan <i>x</i> = sen <i>x</i> ÷ cos <i>x</i>. Perto de π/2 o seno vale quase 1 e o cosseno quase 0, positivo antes de π/2 e negativo depois. Dividir por um número minúsculo dá um valor enorme, com o sinal do cosseno.</span></p>
    ${vlinks([[1431, 'Limites só existem se os laterais forem iguais'], [1438, 'Por isso o limite da tangente de π/2 não existe'], [1446, 'Pela esquerda, +∞'], [1451, 'Pela direita, −∞: sem rumo, à deriva']])}
  </div>
</article>`);
  root.append(t);
  const q = (sel) => t.querySelector(sel);
  const X = lin(0, Math.PI, 50, 450), Y = lin(-6, 6, 330, 30), H2 = Math.PI / 2;
  const S = svg('svg', { viewBox: '0 0 480 360', class: 'li-svg', role: 'img', 'aria-label': 'Gráfico da tangente entre 0 e pi, com uma assíntota em pi sobre 2. O ponto da esquerda dispara para mais infinito e o da direita para menos infinito.' }, q('#li-tan'));
  const defs = svg('defs', {}, S);
  svg('rect', { x: 50, y: 22, width: 400, height: 316 }, svg('clipPath', { id: 'li-tan-clip' }, defs));
  for (const gy of [-4, -2, 2, 4]) { svg('line', { x1: X(0), y1: Y(gy), x2: X(Math.PI), y2: Y(gy), class: 'grid' }, S); text(S, { x: 44, y: Y(gy) + 4, class: 'sm', 'text-anchor': 'end' }, gy < 0 ? `−${-gy}` : String(gy)); }
  svg('line', { x1: X(0), y1: Y(0), x2: X(Math.PI), y2: Y(0), class: 'axis' }, S);
  svg('line', { x1: X(0), y1: Y(-6), x2: X(0), y2: Y(6), class: 'axis' }, S);
  svg('line', { x1: X(H2), y1: Y(-6.3), x2: X(H2), y2: Y(6.3), class: 'guide' }, S);
  [[Math.PI / 4, 'π/4'], [H2, 'π/2'], [(3 * Math.PI) / 4, '3π/4'], [Math.PI, 'π']].forEach(([v, s]) => text(S, { x: X(v) + (v === H2 ? 16 : 0), y: Y(0) + 18, class: 'math', 'text-anchor': 'middle' }, s));
  const branch = (a, b) => { let d = ''; for (let i = 0; i <= 90; i++) { const x = a + ((b - a) * i) / 90; d += `${i ? 'L' : 'M'} ${X(x).toFixed(1)} ${Y(Math.tan(x)).toFixed(1)} `; } return d; };
  const clipG = svg('g', { 'clip-path': 'url(#li-tan-clip)' }, S);
  svg('path', { d: branch(0, Math.atan(6.6)), class: 'curve' }, clipG);
  svg('path', { d: branch(Math.PI - Math.atan(6.6), Math.PI), class: 'curve' }, clipG);
  text(S, { x: X(1.2), y: Y(4.4), class: 'math', 'text-anchor': 'end' }, 'tan x');
  const G = {};
  for (const k of ['L', 'R']) {
    const g = svg('g', { class: `li-${k}` }, S);
    G[k] = { g, v: svg('line', { class: 'drop' }, g), dot: svg('circle', { r: 6, class: 'hue-f' }, g), arrow: svg('path', { class: 'hue-f' }, g), lab: text(g, { class: 'hue-t' }, '') };
  }
  const sl = slider({ id: 'li-tan-h', label: 'Distância <i>h</i> até π/2', min: 0, max: 3, step: 0.01, value: 0.15, format: (u) => br(10 ** -u, 10 ** -u < 0.0095 ? 4 : 3) });
  const side = segmented({ label: 'Chegar', options: [{ value: 'both', label: 'pelos dois lados' }, { value: 'L', label: 'pela esquerda' }, { value: 'R', label: 'pela direita' }], value: 'both' });
  const row = el(`<div class="btn-row"><button type="button" class="btn sm">Aproximar de π/2</button><button type="button" class="btn sm">Afastar</button></div>`);
  q('.controls').append(sl.el, side.el, row);
  const big = (v) => sgn(v, Math.abs(v) >= 100 ? 0 : 2);
  const draw = () => {
    const h = 10 ** -sl.value;
    for (const k of ['L', 'R']) {
      const x = k === 'L' ? H2 - h : H2 + h, y = Math.tan(x), on = side.value === 'both' || side.value === k, g = G[k];
      const off = Math.abs(y) > 6, yc = Math.max(-6, Math.min(6, y)), dir = y > 0 ? -1 : 1; // dir: screen direction of "towards infinity"
      g.g.style.display = on ? '' : 'none';
      setA(g.dot, { cx: X(x), cy: Y(yc) });
      setA(g.v, { x1: X(x), y1: Y(0), x2: X(x), y2: Y(yc) });
      const ax = X(x), ay = Y(yc) + dir * 10;
      setA(g.arrow, { d: `M ${ax - 6} ${ay} L ${ax + 6} ${ay} L ${ax} ${ay + dir * 10} Z` });
      g.arrow.style.display = off ? '' : 'none';
      // on the chart: label on the empty side of the curve; clamped at the edge: across the asymptote, where no branch runs
      const L = k === 'L', right = L === off;
      setA(g.lab, { x: X(x) + (right ? 12 : -12), y: Y(yc) + (L ? (off ? 18 : -10) : (off ? -8 : 20)), 'text-anchor': right ? 'start' : 'end' });
      g.lab.textContent = big(y);
      q(`#li-t${k}`).textContent = on ? big(y) : '–';
    }
  };
  sl.on(draw);
  side.on(draw);
  const [goB, backB] = row.querySelectorAll('button');
  goB.addEventListener('click', () => { const from = sl.value >= 2.95 ? 0 : sl.value; tween(from, 3, 2800 * (1 - from / 3) + 400, (u) => { sl.value = u; }); });
  backB.addEventListener('click', () => tween(sl.value, 0.15, 700, (u) => { sl.value = u; }));
  console.assert(Math.tan(H2 - 0.001) > 999 && Math.tan(H2 + 0.001) < -999, 'limites: laterais da tangente em π/2 com sinais opostos');
  draw();
}
