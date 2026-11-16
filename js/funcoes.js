// Chapter 7 · Funções (19:57–21:51). Three models of the world, each a 3D scene driven by the same function as its chart:
// gas pressure at fixed volume (affine), a car's price over the years (quadratic) and dividing bacteria (exponential).
// Then the function machine with domain and codomain, and the line y = a·x + b. Charts follow the dataviz method:
// a validated two-series palette per theme (--fu-s1 / --fu-s2), hairline grid, ink text, legends, pointer and keyboard
// tooltips and a table view. WebGL stages are created near the viewport and release their context when far away.
import { THREE, mount, el, css, vlink, vlinks, stage, slider, onTheme, reduced, tween, ease, br } from './core.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const root = mount('funcoes');
const S = '#funcoes';
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (v, d = 2) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: d });
const int = (v) => Math.round(v).toLocaleString('pt-BR');
/** signed number with a typographic minus, rounded first so −0 never shows */
const sg = (v, d = 2) => { const r = Number(Number(v).toFixed(d)); return `${r < 0 ? '−' : ''}${num(Math.abs(r), d)}`; };

/* ------------------------------------------------------------------ models + self-checks ------ */
const T0 = 300, K0 = 273.15;
/** gas at fixed volume (Gay-Lussac): P = k·T with T in kelvin, 1 atm at 300 K */
const pGas = (T) => T / T0;
/** illustrative car price in thousands of reais: V(t) = a·(t − h)² + k */
const CA = 0.4, CH = 15, CK = 30;
const price = (t) => CA * (t - CH) ** 2 + CK;
/** bacteria: one generation every 20 min (E. coli in ideal lab conditions), N = 2^g */
const DUP = 20, MAXG = 6, SP = 0.22;
/** the machine from the video */
const f = (x) => x + 3;
const CANDS = [
  { id: 'x3', f: (x) => x + 3, txt: 'x + 3', html: '<i>x</i> + 3' },
  { id: '2x2', f: (x) => 2 * x + 2, txt: '2x + 2', html: '2<i>x</i> + 2' },
  { id: '3x1', f: (x) => 3 * x + 1, txt: '3x + 1', html: '3<i>x</i> + 1' },
  { id: '4x', f: (x) => 4 * x, txt: '4x', html: '4<i>x</i>' },
];
/** colony layout: split k of cell i is bit (g − k); odd splits run along x, even along z, so a child sits beside its parent */
function cellPos(g, i, out) {
  let xi = 0, zi = 0;
  for (let k = 1; k <= g; k++) {
    const bit = (i >> (g - k)) & 1;
    if (k % 2) xi = xi * 2 + bit; else zi = zi * 2 + bit;
  }
  out[0] = (xi - (2 ** Math.ceil(g / 2) - 1) / 2) * SP;
  out[1] = (zi - (2 ** (g >> 1) - 1) / 2) * SP;
  return out;
}

console.assert(pGas(600) === 2 * pGas(300) && pGas(900) === 3 * pGas(300), 'gás: dobrar e triplicar T (K) dobra e triplica P');
console.assert(Math.abs(pGas(40 + K0) / pGas(20 + K0) - 1.0682) < 1e-3, 'gás: de 20 para 40 °C a pressão sobe só ≈ 6,8%');
console.assert(Math.abs(pGas(K0) - 0.9105) < 1e-4, 'gás: em °C a reta corta o eixo vertical em b ≈ 0,91 atm');
console.assert([0, 15, 30].map(price).every((v, i) => Math.abs(v - [120, 30, 120][i]) < 1e-9) && Math.abs(price(8) - 49.6) < 1e-9, 'preço do carro: 120 → 30 → 120');
console.assert([1, 2, 3].map(f).join() === '4,5,6', 'f(x) = x + 3 leva 1, 2, 3 em 4, 5, 6');
console.assert(CANDS.every((c) => c.f(1) === 4) && CANDS.filter((c) => c.f(2) === 5).length === 1, 'com um par só, as quatro regras empatam');
{
  const seen = new Set(), p = [0, 0], q = [0, 0];
  for (let i = 0; i < 64; i++) { cellPos(6, i, p); seen.add(p.join()); console.assert(Math.hypot(p[0], p[1]) < 1.15, 'colônia cabe na placa'); }
  cellPos(5, 13, q); cellPos(6, 26, p);
  console.assert(seen.size === 64 && Math.abs(p[1] - 2 * q[1]) < 1e-9 + SP, 'colônia: 64 lugares distintos; filha perto da mãe');
}

/* ------------------------------------------------------------------ styles ------ */
css(`
${S} { --fu-s1: hsl(36 62% 40%); --fu-s2: hsl(210 62% 40%); --fu-gray: color-mix(in srgb, var(--muted) 32%, var(--surface)); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) ${S} { --fu-s1: hsl(30 80% 46%); --fu-s2: hsl(210 72% 58%); } }
:root[data-theme="dark"] ${S} { --fu-s1: hsl(30 80% 46%); --fu-s2: hsl(210 72% 58%); }
${S} [hidden] { display: none !important; }
${S} .explain h4 { font: 700 1.02rem/1.2 var(--f-display); margin-top: 4px; }
${S} .fu-svg text { font: 500 11px/1 var(--f-mono); fill: var(--muted); }
${S} .fu-svg .ink { fill: var(--ink); }
${S} .fu-svg .t12 { font: 500 12px/1.2 var(--f-body); }
${S} .fu-svg .t13 { font: 600 13px/1.2 var(--f-body); }
${S} .fu-svg .halo { paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
${S} .fu-svg .grid { stroke: var(--line); stroke-width: 1; }
${S} .fu-svg .axis { stroke: color-mix(in srgb, var(--ink) 45%, transparent); stroke-width: 1; }
${S} .fu-svg .ref { fill: none; stroke: var(--fu-s1); stroke-width: 2; stroke-dasharray: 5 5; stroke-linecap: round; }
${S} .fu-svg .cross { stroke: var(--muted); stroke-width: 1; }
${S} .fu-svg .f1 { fill: var(--fu-s1); }
${S} .fu-svg .f2 { fill: var(--fu-s2); }
${S} .fu-svg .fg { fill: var(--fu-gray); }
${S} .fu-svg .fm { fill: var(--muted); }
${S} .fu-svg .wash1 { fill: var(--fu-s1); opacity: .12; }
${S} .fu-svg .l1 { fill: none; stroke: var(--fu-s1); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
${S} .fu-svg .l2 { fill: none; stroke: var(--fu-s2); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
${S} .fu-svg .lk { fill: none; stroke: var(--ink); stroke-width: 1.5; stroke-linecap: round; }
${S} .fu-svg .faint { fill: none; stroke: var(--muted); stroke-width: 1.2; opacity: .75; }
${S} .fu-svg .ring { stroke: var(--surface); stroke-width: 2; }
${S} .fu-svg .hollow { fill: var(--surface); stroke: var(--ink); stroke-width: 1.5; }
${S} .fu-svg .hit { fill: transparent; }
${S} .fu-svg .set { fill: color-mix(in srgb, var(--ink) 4%, var(--surface)); stroke: var(--line); stroke-width: 1; }
${S} .fu-svg .dot { fill: var(--surface); stroke: var(--muted); stroke-width: 1.2; transition: fill .3s, stroke .3s; }
${S} .fu-svg .dot.on1 { fill: var(--fu-s1); stroke: var(--fu-s1); }
${S} .fu-svg .dot.on2 { fill: var(--fu-s2); stroke: var(--fu-s2); }
${S} .fu-svg .dn { font: 600 12px/1 var(--f-mono); fill: var(--muted); pointer-events: none; }
${S} .fu-svg .dn.on { fill: var(--on-hue); }
${S} .fu-svg .head { fill: var(--muted); }
${S} .fu-svg .head.new { fill: var(--fu-s1); opacity: 0; animation: fu-fade .2s .6s forwards; }
${S} .fu-svg .arrow.new { stroke: var(--fu-s1); stroke-width: 2; opacity: 1; stroke-dasharray: 1; stroke-dashoffset: 1; animation: fu-draw .7s cubic-bezier(.4, 0, .2, 1) forwards; }
@keyframes fu-draw { to { stroke-dashoffset: 0; } }
@keyframes fu-fade { to { opacity: 1; } }
${S} .fu-svg [data-k] { cursor: pointer; }
${S} svg.fu-svg:focus { outline: none; }
${S} svg.fu-svg:focus-visible { outline: 2px solid var(--accent); outline-offset: -3px; }
${S} .fu-tip { position: absolute; z-index: 4; pointer-events: none; display: grid; gap: 2px; padding: 6px 10px; border-radius: 8px;
  border: 1px solid var(--line); background: var(--surface); box-shadow: var(--shadow); font-size: 12px; color: var(--muted);
  white-space: nowrap; transform: translate(-50%, calc(-100% - 12px)); }
${S} .fu-tip b { font: 600 14px/1.25 var(--f-body); color: var(--ink); }
${S} .fu-tip .k { display: inline-block; width: 12px; height: 2px; border-radius: 1px; margin-right: 6px; vertical-align: 4px; }
${S} .k1 { background: var(--fu-s1); } ${S} .k2 { background: var(--fu-s2); } ${S} .kg { background: var(--fu-gray); } ${S} .km { background: var(--muted); }
${S} .fu-leg { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 13px; color: var(--ink); }
${S} .fu-leg span { display: inline-flex; align-items: center; gap: 7px; }
${S} .fu-leg i { width: 10px; height: 10px; border-radius: 2px; flex: none; }
${S} .fu-leg i.ln { width: 16px; height: 2px; border-radius: 1px; }
${S} .fu-leg i.dash { width: 16px; height: 0; border-radius: 0; background: none; border-top: 2px dashed var(--fu-s1); }
${S} .fu-leg i.rd { width: 9px; height: 9px; border-radius: 50%; }
${S} .fu-leg i.hol { width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid var(--ink); background: var(--surface); }
${S} .fu-leg i.hol.m { border-color: var(--muted); }
${S} details.fu-tv summary { cursor: pointer; font-size: 13px; color: var(--muted); width: fit-content; }
${S} details.fu-tv[open] summary { margin-bottom: 8px; }
${S} table.fu-t { width: 100%; border-collapse: collapse; font-size: 13px; }
${S} table.fu-t caption { text-align: left; font-size: 12px; color: var(--muted); padding-bottom: 4px; }
${S} table.fu-t th, ${S} table.fu-t td { text-align: left; padding: 5px 8px; border-bottom: 1px solid var(--line); }
${S} table.fu-t th { font-weight: 600; color: var(--muted); font-size: 12px; }
${S} table.fu-t .n { text-align: right; font: 500 13px/1.3 var(--f-mono); font-variant-numeric: tabular-nums; }
${S} table.fu-t tr.on td { background: var(--hue-soft); }
${S} .fu-picks, ${S} .fu-guess { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
${S} .fu-picks .seg-label, ${S} .fu-guess .seg-label, ${S} .controls .seg-label { font-size: 13px; color: var(--muted); }
${S} .fu-guess .btn { font-family: var(--f-math); font-size: 15px; }
${S} .lbl.fu-num { background: none; border: 0; padding: 0; color: var(--muted); font-size: 11px; }
${S} .lbl.fu-ball { font: 700 13px/1 var(--f-mono); padding: 3px 7px; }
${S} .lbl.fu-sign { font: italic 400 17px/1.1 var(--f-math); padding: 3px 9px; }
${S} .lbl.fu-val { font-weight: 700; }
`);

/* ------------------------------------------------------------------ shared helpers ------ */
/** pointer/focus tooltip inside a positioned host. rows: [[value, label, keyClass?]] (text only, via textContent) */
function makeTip(host) {
  const tip = document.createElement('div');
  tip.className = 'fu-tip';
  tip.hidden = true;
  tip.setAttribute('aria-hidden', 'true');
  host.append(tip);
  return {
    show(cx, cy, rows) {
      tip.replaceChildren(...rows.map(([v, l, k]) => {
        const d = document.createElement('div');
        if (k) { const i = document.createElement('i'); i.className = `k ${k}`; d.append(i); }
        const b = document.createElement('b');
        b.textContent = v;
        const s = document.createElement('span');
        s.textContent = l ? ` ${l}` : '';
        d.append(b, s);
        return d;
      }));
      tip.hidden = false;
      const r = host.getBoundingClientRect();
      const half = tip.offsetWidth / 2 + 6;
      tip.style.left = `${clamp(cx - r.left, half, Math.max(half, r.width - half))}px`;
      tip.style.top = `${Math.max(cy - r.top, tip.offsetHeight + 16)}px`;
    },
    hide() { tip.hidden = true; },
  };
}
const svgPt = (svg, e) => new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
const toScreen = (svg, x, y) => new DOMPoint(x, y).matrixTransform(svg.getScreenCTM());
const table = (caption, head, rows, on = -1) => `<table class="fu-t"><caption>${caption}</caption><thead><tr>${head.map((h, i) => `<th${i ? ' class="n"' : ''}>${h}</th>`).join('')}</tr></thead>` +
  `<tbody>${rows.map((r, j) => `<tr${j === on ? ' class="on"' : ''}>${r.map((c, i) => `<td${i ? ' class="n"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const pickRow = (items) => `<div class="fu-picks" role="group" aria-label="Detalhar uma peça do modelo"><span class="seg-label">Detalhar</span>` +
  items.map(([k, l]) => `<button type="button" class="btn sm" data-k="${k}" aria-pressed="false">${l}</button>`).join('') + '</div>';

/** detail card (.pick) of a topic, opened by its "Detalhar" buttons or by the clickable 3D/SVG labels in `hot` */
function picker(t, defs) {
  const node = t.querySelector('.pick'), row = t.querySelector('.fu-picks'), hot = {};
  let cur = null;
  function pick(k) {
    cur = k;
    const [title, body, links] = defs[k]();
    node.hidden = false;
    node.innerHTML = `<h4>${title}</h4><p>${body}</p>${vlinks(links)}`;
    if (row) row.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
    for (const [kk, o] of Object.entries(hot)) o.element.classList.toggle('on', kk === k);
  }
  if (row) row.addEventListener('click', (e) => { const b = e.target.closest('button[data-k]'); if (b) pick(b.dataset.k); });
  return { pick, hot, refresh() { if (cur) pick(cur); } };
}

/** themed materials: colors re-read on every light/dark switch */
const themed = [];
onTheme(() => themed.forEach(([m, fn, key]) => m[key].copy(fn())));
function themer(s) {
  const c = (tok) => new THREE.Color(s.color(tok));
  const mix = (a, b, t) => c(a).lerp(c(b), t);
  const track = (m, fn, key = 'color') => { m[key].copy(fn()); themed.push([m, fn, key]); return m; };
  const tm = (fn, extra = {}) => track(new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, ...extra }), fn);
  return { c, mix, track, tm };
}

/**
 * Browsers keep only ~16 live WebGL contexts per page and drop the oldest past that. So the stage is built the first
 * time its topic comes within a screen of the viewport, and its context is released while it is farther away.
 */
function lazyStage(container, opts, build) {
  let s;
  new IntersectionObserver(([e]) => {
    if (s === undefined) {
      if (!e.isIntersecting) return;
      s = stage(container, opts);
      if (s) build(s);
      return;
    }
    if (!s) return;
    const lost = s.renderer.getContext().isContextLost();
    if (e.isIntersecting && lost) s.renderer.forceContextRestore();
    else if (!e.isIntersecting && !lost) s.renderer.forceContextLoss();
  }, { rootMargin: '100% 0px' }).observe(container);
}
function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ================================================================== 1 · gás: função afim ====== */
const t1 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage" id="fu-gas"></div>
    <p class="stage-cap">Gás preso num cilindro de vidro. Quatro tirantes seguram a tampa, então o volume não muda. A resistência no fundo aquece o gás, as partículas se agitam e o ponteiro do manômetro sobe.</p>
    <div class="controls" id="fu-gas-ctl"></div>
    <div class="stats" aria-live="polite">
      <div class="stat"><b id="fu-gas-t">300 K</b><span id="fu-gas-tc">temperatura</span></div>
      <div class="stat"><b id="fu-gas-p">1,00 atm</b><span>pressão</span></div>
      <div class="stat"><b id="fu-gas-r">×1,00</b><span>T e P, comparados à base</span></div>
    </div>
    <div class="fu-leg"><span><i class="ln k1"></i>P = k · T, na faixa do controle</span><span><i class="dash"></i>Prolongamento até 0 K</span><span><i class="hol"></i>Base: 300 K e 1 atm</span></div>
    <div class="stage short" id="fu-gas-chart"></div>
    <details class="fu-tv"><summary>Ver como tabela</summary><div id="fu-gas-table"></div></details>
  </div>
  <div class="explain">
    <p class="kicker">Modelo 1 · função afim · 19:57 – 20:11</p>
    <h3>Mais calor, mais pressão</h3>
    <p>Sabe quando você aumenta a temperatura de um sistema e a pressão aumenta, num volume fixo? A experiência mostra que, ao dobrar a temperatura, a pressão também dobra. Triplicou a temperatura, a pressão triplica.</p>
    ${vlinks([[1197, 'Volume fixo: sobe a temperatura, sobe a pressão'], [1201, 'Dobrou a temperatura, dobrou a pressão']])}
    <p>Esse comportamento pode ser modelado por uma função linear, também chamada de função afim. No gráfico ela vira uma reta, e cada ponto da reta é uma leitura do manômetro. Clique no gráfico para escolher uma temperatura.</p>
    <div class="formula"><i>P</i>(<i>T</i>) = <i>k</i> · <i>T</i>, &nbsp;com&nbsp; <i>k</i> = <span class="frac"><span>1 atm</span><span>300 K</span></span></div>
    ${vlink(1206, 'Triplicou, triplicou: função linear, ou afim')}
    <p class="note fact">A proporção vale para a temperatura absoluta, em kelvin. É a lei de Gay-Lussac: com o volume fixo, <i>P</i> ÷ <i>T</i> fica constante. Em graus Celsius a conta engana: aquecer de 20 °C para 40 °C aumenta a pressão só uns 7%. Mude a escala do gráfico e veja o eixo vertical andar até 0 °C. Ali a reta corta o eixo em <i>b</i> ≈ 0,91 atm e a função fica <i>P</i> = <i>a</i>·<i>t</i> + <i>b</i>. Toda reta assim é afim; linear é o nome do caso <i>b</i> = 0.</p>
    ${pickRow([['trava', 'Volume fixo'], ['gas', 'Partículas'], ['termo', 'Termômetro'], ['mano', 'Manômetro']])}
    <div class="pick" aria-live="polite" hidden></div>
  </div>
</article>`);
root.append(t1);

{
  const $ = (id) => t1.querySelector(id);
  const ctl = $('#fu-gas-ctl');
  const slT = slider({ id: 'fu-gas-T', label: 'Temperatura', min: 100, max: 900, step: 5, value: 300, format: (v) => `${v} K` });
  const pre = el(`<div class="btn-row" role="group" aria-label="Exemplos do vídeo"><button type="button" class="btn sm" data-t="300">Base: 300 K</button>` +
    `<button type="button" class="btn sm" data-t="600">Dobrar: 600 K</button><button type="button" class="btn sm" data-t="900">Triplicar: 900 K</button></div>`);
  const unitRow = el(`<div class="seg" role="group" aria-label="Escala do gráfico"><span class="seg-label">Escala do gráfico</span>` +
    `<button type="button" class="btn sm" data-u="K" aria-pressed="true">kelvin</button><button type="button" class="btn sm" data-u="C" aria-pressed="false">graus Celsius</button></div>`);
  ctl.append(slT.el, pre, unitRow);
  let tok = 0;
  pre.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-t]');
    if (!b) return;
    const my = ++tok;
    tween(slT.value, +b.dataset.t, 900, (v) => { if (my === tok) slT.value = Math.round(v / 5) * 5; });
  });
  slT.input.addEventListener('input', () => { tok++; });

  const P = picker(t1, {
    trava: () => ['Volume fixo', 'Os quatro tirantes prendem a tampa ao fundo, então o gás não consegue se expandir. É a condição do exemplo do vídeo: só a temperatura muda.', [[1197, 'Volume fixo: sobe a temperatura, sobe a pressão']]],
    gas: () => ['Partículas do gás', `A velocidade média cresce com √<i>T</i>: a ${int(slT.value)} K ela vale ${num(Math.sqrt(slT.value / T0), 2)} × a da base, 300 K. Mais rápidas, as partículas batem nas paredes com mais força e com mais frequência, e a pressão sobe.`, [[1197, 'Mais temperatura, mais pressão']]],
    termo: () => ['Termômetro', `Marca ${int(slT.value)} K, que são ${sg(slT.value - K0, 2)} °C. A escala kelvin começa no zero absoluto, −273,15 °C, por isso dobrar em kelvin é dobrar de verdade.`, [[1197, 'Aumentar a temperatura do sistema'], [1201, 'Dobrar a temperatura']]],
    mano: () => ['Manômetro', `Marca ${br(pGas(slT.value), 2)} atm. Dividindo pela temperatura dá sempre o mesmo número: <i>P</i> ÷ <i>T</i> = 1 ÷ 300 ≈ 0,00333 atm por kelvin.`, [[1201, 'Dobrou a temperatura, dobrou a pressão'], [1206, 'Triplicou, triplicou: função afim']]],
  });

  /* ---- chart: P × T ---- */
  const host = $('#fu-gas-chart');
  const L = 50, R = 440, TT = 18, B = 222, KM = 930, PM = 3.2;
  const gx = (k) => L + (k / KM) * (R - L), gy = (p) => B - (p / PM) * (B - TT);
  let yg = '';
  for (const p of [0, 1, 2, 3]) yg += `<line class="grid" x1="${L}" x2="${R}" y1="${gy(p)}" y2="${gy(p)}"/><text x="${L - 8}" y="${gy(p) + 4}" text-anchor="end">${p}</text>`;
  host.innerHTML = `<svg class="fu-svg" viewBox="0 0 480 270" role="img" aria-labelledby="fu-gas-ti" tabindex="0">
    <title id="fu-gas-ti">Pressão do gás, em atm, em função da temperatura: uma reta que nasce no zero absoluto</title>
    ${yg}
    <text x="${L - 8}" y="${TT - 6}" text-anchor="end">atm</text>
    <g id="fu-gas-xt"></g>
    <line class="axis" x1="${L}" x2="${R}" y1="${B}" y2="${B}"/>
    <line class="axis" id="fu-gas-yax" y1="${TT}" y2="${B}"/>
    <path class="ref" d="M${gx(0)} ${gy(0)}L${gx(100)} ${gy(pGas(100))}"/>
    <path class="l1" d="M${gx(100)} ${gy(pGas(100))}L${gx(900)} ${gy(pGas(900))}"/>
    <circle class="hollow" cx="${gx(T0)}" cy="${gy(1)}" r="4"/>
    <g id="fu-gas-b" style="display:none"><circle class="f2 ring" cx="${gx(K0)}" cy="${gy(pGas(K0))}" r="4.5"/>
      <text class="ink halo" x="${gx(K0) + 9}" y="${gy(pGas(K0)) + 15}">b ≈ 0,91 atm</text></g>
    <line class="cross" id="fu-gas-x" y1="${TT}" y2="${B}" style="display:none"/>
    <circle class="f1 ring" id="fu-gas-dot" r="5"/>
    <text class="ink halo" id="fu-gas-dl" text-anchor="end"></text>
    <rect class="hit" id="fu-gas-hit" x="${L}" y="${TT}" width="${R - L}" height="${B - TT}"/>
  </svg>`;
  const svg = host.querySelector('svg');
  const tip = makeTip(host);
  const q = (id) => svg.querySelector(id);
  let unit = 'K', axK = 0, axTok = 0;
  function axisTicks() {
    const ticks = unit === 'K' ? [0, 150, 300, 450, 600, 750, 900].map((k) => [k, String(k)]) : [[0, '−273'], ...[0, 200, 400, 600].map((c) => [c + K0, String(c)])];
    q('#fu-gas-xt').innerHTML = ticks.map(([k, l]) => `<line class="axis" x1="${gx(k)}" x2="${gx(k)}" y1="${B}" y2="${B + 4}"/><text x="${gx(k)}" y="${B + 16}" text-anchor="middle">${l}</text>`).join('') +
      `<text x="${R}" y="${B + 34}" text-anchor="end">${unit === 'K' ? 'temperatura T, em kelvin · 0 K é o zero absoluto' : 'temperatura t, em °C · zero absoluto = −273,15 °C'}</text>`;
    q('#fu-gas-b').style.display = unit === 'C' ? '' : 'none';
  }
  const placeAxis = (k) => { q('#fu-gas-yax').setAttribute('x1', gx(k)); q('#fu-gas-yax').setAttribute('x2', gx(k)); };
  unitRow.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-u]');
    if (!b || b.dataset.u === unit) return;
    unit = b.dataset.u;
    unitRow.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    axisTicks();
    const my = ++axTok, from = axK, to = unit === 'C' ? K0 : 0;
    tween(from, to, 700, (v) => { if (my === axTok) { axK = v; placeAxis(v); } });
    update();
  });
  const tLabel = (k) => (unit === 'K' ? `${int(k)} K` : `${sg(k - K0, 2)} °C`);

  function update() {
    const T = slT.value, p = pGas(T);
    $('#fu-gas-t').textContent = unit === 'K' ? `${int(T)} K` : `${sg(T - K0, 1)} °C`;
    $('#fu-gas-tc').textContent = unit === 'K' ? `temperatura · ${sg(T - K0, 2)} °C` : `temperatura · ${int(T)} K`;
    $('#fu-gas-p').textContent = `${br(p, 2)} atm`;
    $('#fu-gas-r').textContent = `×${br(T / T0, 2)}`;
    const x = gx(T), y = gy(p);
    q('#fu-gas-dot').setAttribute('cx', x);
    q('#fu-gas-dot').setAttribute('cy', y);
    const dl = q('#fu-gas-dl');
    dl.setAttribute('x', Math.max(L + 64, x - 10));
    dl.setAttribute('y', y - 10);
    dl.textContent = `${br(p, 2)} atm`;
    P.refresh();
  }
  slT.on(update);
  function hover(k, cx, cy) {
    k = clamp(Math.round(k / 5) * 5, 0, 900);
    const xl = q('#fu-gas-x');
    xl.style.display = '';
    xl.setAttribute('x1', gx(k)); xl.setAttribute('x2', gx(k));
    tip.show(cx, cy, [[`${br(pGas(k), 2)} atm`, 'pressão', 'k1'], [tLabel(k), unit === 'K' ? `= ${sg(k - K0, 2)} °C` : `= ${int(k)} K`]]);
    return k;
  }
  const out = () => { tip.hide(); q('#fu-gas-x').style.display = 'none'; };
  const hit = q('#fu-gas-hit');
  const kAt = (e) => ((svgPt(svg, e).x - L) / (R - L)) * KM;
  hit.addEventListener('pointermove', (e) => hover(kAt(e), e.clientX, e.clientY));
  hit.addEventListener('pointerleave', out);
  hit.addEventListener('click', (e) => { tok++; slT.value = clamp(Math.round(kAt(e) / 5) * 5, 100, 900); });
  const showCur = () => { const p = toScreen(svg, gx(slT.value), gy(pGas(slT.value))); hover(slT.value, p.x, p.y); };
  svg.addEventListener('focus', showCur);
  svg.addEventListener('blur', out);
  svg.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -5, ArrowRight: 5, ArrowDown: -5, ArrowUp: 5, PageDown: -50, PageUp: 50 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    tok++;
    slT.value = clamp(slT.value + step, 100, 900);
    showCur();
  });
  $('#fu-gas-table').innerHTML = table('Pressão a volume fixo, modelo P = T ÷ 300 (atm)', ['T (K)', 't (°C)', 'P (atm)'],
    [100, 200, 300, 400, 500, 600, 700, 800, 900].map((k) => [k, sg(k - K0, 2), br(pGas(k), 2)]));
  axisTicks();
  placeAxis(0);
  update();

  /* ---- 3D: cylinder, heater, gauge, thermometer ---- */
  lazyStage($('#fu-gas'), {
    camera: [3.3, 2.7, 6.3], target: [0.35, 1.6, 0], fov: 36,
    label: 'Cilindro de vidro com partículas de gás, tampa presa por tirantes, resistência no fundo, manômetro em cima e termômetro ao lado.',
    hint: 'arraste para girar · clique nos rótulos',
  }, (s) => {
    s.controls.maxPolarAngle = Math.PI * 0.5;
    const { c, mix, track, tm } = themer(s);
    const RR = 0.82, H = 1.7, Y0 = 0.25, TOP = Y0 + H, GY = TOP + 0.95;
    const steel = tm(() => mix('--surface', '--ink', 0.42), { metalness: 0.45, roughness: 0.35 });
    const dark = tm(() => mix('--surface', '--ink', 0.72), { metalness: 0.3, roughness: 0.5 });
    const glass = tm(() => mix('--ink', '--surface', 0.4), { transparent: true, opacity: 0.13, roughness: 0.08, side: THREE.DoubleSide, depthWrite: false });
    const gasM = tm(() => c('--fu-s2'), { roughness: 0.3 });
    const heatM = track(tm(() => mix('--surface', '--ink', 0.55), { roughness: 0.4 }), () => c('--fu-s1'), 'emissive');
    const faceM = tm(() => c('--surface'), { roughness: 0.9 });
    const inkM = tm(() => c('--ink'), { roughness: 0.5 });
    const hotM = tm(() => c('--fu-s1'), { roughness: 0.35 });

    const plate = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.04, 2.4), tm(() => mix('--surface', '--ink', 0.07), { roughness: 0.9 }));
    plate.position.set(0.4, -0.02, 0);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(RR + 0.12, RR + 0.18, Y0, 56), dark);
    base.position.y = Y0 / 2;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(RR, RR, H, 56, 1, true), glass);
    tube.position.y = Y0 + H / 2;
    tube.renderOrder = 3;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(RR + 0.1, RR + 0.1, 0.16, 56), steel);
    lid.position.y = TOP + 0.08;
    s.add(plate, base, tube, lid);
    const rodG = new THREE.CylinderGeometry(0.028, 0.028, H + 0.36, 12), nutG = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 6);
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2, x = Math.cos(a) * (RR + 0.06), z = Math.sin(a) * (RR + 0.06);
      const rod = new THREE.Mesh(rodG, steel);
      rod.position.set(x, Y0 + H / 2 + 0.06, z);
      const nut = new THREE.Mesh(nutG, dark);
      nut.position.set(x, TOP + 0.19, z);
      s.add(rod, nut);
    }
    // flat spiral heater on the bottom: it glows with the temperature
    const sp = [];
    for (let i = 0; i <= 90; i++) { const th = (i / 90) * 5 * Math.PI, r = 0.12 + (0.55 * th) / (5 * Math.PI); sp.push(new THREE.Vector3(r * Math.cos(th), Y0 + 0.05, r * Math.sin(th))); }
    s.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 160, 0.022, 6), heatM));

    // gauge: 0 to 4 atm over a 270° sweep
    const ang = (p) => ((135 - (p / 4) * 270) * Math.PI) / 180;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 12), steel);
    pipe.position.y = TOP + 0.36;
    const gauge = new THREE.Group();
    gauge.position.y = GY;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.14, 48).rotateX(Math.PI / 2), steel);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.39, 48), faceM);
    face.position.z = 0.071;
    gauge.add(body, face);
    const major = new THREE.BoxGeometry(0.014, 0.075, 0.004), minor = new THREE.BoxGeometry(0.008, 0.04, 0.004);
    for (let v = 0; v <= 4; v += 0.5) {
      const a = ang(v), isMajor = v % 1 === 0, r = isMajor ? 0.3 : 0.315;
      const tk = new THREE.Mesh(isMajor ? major : minor, inkM);
      tk.position.set(-Math.sin(a) * r, Math.cos(a) * r, 0.075);
      tk.rotation.z = a;
      gauge.add(tk);
      if (isMajor) s.label(String(v), [-Math.sin(a) * 0.2, Math.cos(a) * 0.2, 0.08], { parent: gauge, cls: 'fu-num' });
    }
    s.label('atm', [0, -0.2, 0.08], { parent: gauge, cls: 'fu-num' });
    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.31, 0.01).translate(0, 0.115, 0), hotM);
    needle.position.z = 0.082;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16).rotateX(Math.PI / 2), inkM);
    cap.position.z = 0.09;
    gauge.add(needle, cap);
    s.add(pipe, gauge);

    // thermometer
    const TX = RR + 0.62, TZ = 0.25, FB = 0.28;
    const th = (T) => 0.1 + (1.5 * (T - 100)) / 800;
    const ttube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.75, 20, 1, true), glass);
    ttube.position.set(TX, 0.3 + 0.875, TZ);
    ttube.renderOrder = 3;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), hotM);
    bulb.position.set(TX, 0.2, TZ);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.06, 24), dark);
    stand.position.set(TX, 0.03, TZ);
    const fluid = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 12), hotM);
    fluid.position.set(TX, FB, TZ);
    s.add(ttube, bulb, stand, fluid);
    const tickG = new THREE.BoxGeometry(0.07, 0.01, 0.01);
    for (const T of [100, 300, 500, 700, 900]) {
      const tk = new THREE.Mesh(tickG, inkM);
      tk.position.set(TX + 0.1, FB + th(T), TZ);
      s.add(tk);
      if (T % 400 === 100) s.label(`${T} K`, [TX + 0.34, FB + th(T), TZ], { cls: 'fu-num' });
    }

    // gas particles: velocity grows with √T
    const NP = 42, rmax = RR - 0.07, ymin = Y0 + 0.14, ymax = TOP - 0.07;
    const parts = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 12, 8), gasM, NP);
    parts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const pos = new Float32Array(NP * 3), vel = new Float32Array(NP * 3), M = new THREE.Matrix4(), rnd = rng(7);
    for (let i = 0; i < NP; i++) {
      const r = Math.sqrt(rnd()) * rmax, a = rnd() * TAU, u = rnd() * 2 - 1, ph = rnd() * TAU, sq = Math.sqrt(1 - u * u);
      pos.set([r * Math.cos(a), ymin + rnd() * (ymax - ymin), r * Math.sin(a)], i * 3);
      vel.set([sq * Math.cos(ph), u, sq * Math.sin(ph)], i * 3);
      parts.setMatrixAt(i, M.makeTranslation(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));
    }
    s.add(parts);

    const H1 = P.hot;
    H1.trava = s.label('tirantes · volume fixo', [0.72, TOP + 0.36, 0.62], { onClick: () => P.pick('trava') });
    H1.gas = s.label('partículas do gás', [-0.5, Y0 + 0.45, RR + 0.12], { onClick: () => P.pick('gas') });
    H1.termo = s.label('', [TX, 2.3, TZ], { onClick: () => P.pick('termo') });
    H1.mano = s.label('', [-0.78, GY + 0.36, 0], { onClick: () => P.pick('mano') });
    let shownT = slT.value, lastT = -1;
    s.onFrame((t, dt) => {
      const T = slT.value;
      shownT = reduced ? T : shownT + (T - shownT) * Math.min(1, dt * 5);
      needle.rotation.z = ang(pGas(shownT));
      const h = th(shownT);
      fluid.scale.y = h;
      fluid.position.y = FB + h / 2;
      heatM.emissiveIntensity = 0.08 + (1.2 * (shownT - 100)) / 800;
      if (T !== lastT) {
        lastT = T;
        H1.termo.element.textContent = `termômetro · ${int(T)} K`;
        H1.mano.element.textContent = `manômetro · ${br(pGas(T), 2)} atm`;
      }
      if (reduced) return;
      const step = 0.8 * Math.sqrt(shownT / T0) * dt;
      for (let i = 0; i < NP; i++) {
        const k = i * 3;
        let x = pos[k] + vel[k] * step, y = pos[k + 1] + vel[k + 1] * step, z = pos[k + 2] + vel[k + 2] * step;
        const r = Math.hypot(x, z);
        if (r > rmax) {
          const nx = x / r, nz = z / r, vn = vel[k] * nx + vel[k + 2] * nz;
          if (vn > 0) { vel[k] -= 2 * vn * nx; vel[k + 2] -= 2 * vn * nz; }
          x = nx * rmax; z = nz * rmax;
        }
        if (y < ymin) { y = ymin; vel[k + 1] = Math.abs(vel[k + 1]); } else if (y > ymax) { y = ymax; vel[k + 1] = -Math.abs(vel[k + 1]); }
        pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
        parts.setMatrixAt(i, M.makeTranslation(x, y, z));
      }
      parts.instanceMatrix.needsUpdate = true;
    });
  });
}

/* ================================================================== 2 · o preço do carro: função quadrática ====== */
const t2 = el(`
<article class="topic flip">
  <div class="stage-col">
    <div class="stage" id="fu-carro"></div>
    <p class="stage-cap">A estrada tem o formato do gráfico: na horizontal, a idade do carro; na vertical, o preço. O carro anda pela própria curva de preço. Valores ilustrativos.</p>
    <div class="controls" id="fu-car-ctl"></div>
    <div class="stats" aria-live="polite">
      <div class="stat"><b id="fu-car-a">0 anos</b><span>idade do carro</span></div>
      <div class="stat"><b id="fu-car-v">R$ 120 mil</b><span>preço no exemplo</span></div>
      <div class="stat"><b id="fu-car-d">↓ caindo</b><span id="fu-car-dl">tendência</span></div>
    </div>
    <details class="fu-tv"><summary>Ver como tabela</summary><div id="fu-car-table"></div></details>
  </div>
  <div class="explain">
    <p class="kicker">Modelo 2 · função quadrática · 20:11 – 20:25</p>
    <h3>O preço do carro desce, para e sobe</h3>
    <p>Alguns automóveis saem da loja com um valor altíssimo. Com o passar do tempo o preço cai, atinge um limite inferior e depois começa a subir com a valorização. Esse caminho é uma função quadrática, e o gráfico dela é uma parábola.</p>
    ${vlinks([[1211, 'O carro sai da loja caro e o preço cai'], [1218, 'Atinge um mínimo e volta a subir: quadrática']])}
    <div class="formula" id="fu-car-f"></div>
    <p class="note">Exemplo ilustrativo, com valores escolhidos para mostrar a forma da curva: o carro nasce a R$ 120 mil, chega ao mínimo de R$ 30 mil aos 15 anos e volta a R$ 120 mil aos 30.</p>
    <p class="note fact">O ponto mais baixo da parábola se chama vértice. Na forma <i>V</i>(<i>t</i>) = <i>a</i>(<i>t</i> − <i>h</i>)² + <i>k</i>, ele fica em <i>t</i> = <i>h</i>, com valor <i>k</i>. Com <i>a</i> &gt; 0, a parábola abre para cima.</p>
    ${pickRow([['novo', 'Zero km'], ['min', 'Mínimo'], ['sobe', 'Valorização']])}
    <div class="pick" aria-live="polite" hidden></div>
  </div>
</article>`);
root.append(t2);

{
  const $ = (id) => t2.querySelector(id);
  const slA = slider({ id: 'fu-car-age', label: 'Idade do carro', min: 0, max: 30, step: 0.5, value: 0, format: (v) => `${num(v, 1)} anos` });
  const play = el('<div class="btn-row"><button type="button" class="btn sm" aria-pressed="false">▶ Passar os anos</button></div>');
  $('#fu-car-ctl').append(slA.el, play);
  const btn = play.querySelector('button');
  let playTok = 0;
  const stop = () => { playTok++; btn.textContent = '▶ Passar os anos'; btn.setAttribute('aria-pressed', 'false'); };
  btn.addEventListener('click', () => {
    if (btn.getAttribute('aria-pressed') === 'true') { stop(); return; }
    if (slA.value >= 30) slA.value = 0;
    if (reduced) { slA.value = 30; return; }
    const my = ++playTok, a0 = slA.value, t0 = performance.now();
    btn.textContent = 'Pausar';
    btn.setAttribute('aria-pressed', 'true');
    const step = (now) => {
      if (my !== playTok) return;
      const a = Math.min(30, a0 + ((now - t0) / 7000) * 30);
      slA.value = a;
      if (a < 30) requestAnimationFrame(step); else stop();
    };
    requestAnimationFrame(step);
  });
  slA.input.addEventListener('input', stop);

  const P = picker(t2, {
    novo: () => ['Zero km', 'Recém-saído da loja, o carro vale o máximo do exemplo, R$ 120 mil. Logo nos primeiros anos ele perde valor depressa: a curva começa bem inclinada.', [[1211, 'O carro sai da loja num valor altíssimo']]],
    min: () => ['Mínimo (vértice)', `Aos ${CH} anos o preço chega ao limite inferior, R$ ${CK} mil. Antes dele a curva desce, depois sobe. É o vértice da parábola.`, [[1218, 'Atinge um limite inferior e começa a subir']]],
    sobe: () => ['Valorização', 'Depois do mínimo, o carro antigo passa a se valorizar e o preço sobe de novo. A parábola é simétrica: aos 30 anos volta aos R$ 120 mil do exemplo.', [[1218, 'Volta a subir: isso é uma função quadrática']]],
  });

  function update() {
    const a = slA.value, v = price(a), d = 2 * CA * (a - CH);
    $('#fu-car-a').textContent = `${num(a, 1)} ano${a === 1 ? '' : 's'}`;
    $('#fu-car-v').textContent = `R$ ${num(v, 1)} mil`;
    $('#fu-car-d').textContent = Math.abs(d) < 1e-9 ? '• no mínimo' : d < 0 ? '↓ caindo' : '↑ subindo';
    $('#fu-car-dl').textContent = Math.abs(d) < 1e-9 ? 'ritmo agora: zero, é o vértice' : `ritmo agora: ${num(Math.abs(d), 1)} mil por ano`;
    $('#fu-car-f').innerHTML = `<i>V</i>(<i>t</i>) = 0,4 · (<i>t</i> − 15)² + 30<small>com <i>t</i> = ${num(a, 1)}: 0,4 · (${num(a, 1)} − 15)² + 30 = ${num(v, 1)} mil reais</small>`;
  }
  slA.on(update);
  $('#fu-car-table').innerHTML = table('Preço no exemplo, em mil reais', ['Idade (anos)', 'V(t)'], [0, 5, 10, 15, 20, 25, 30].map((t) => [t, num(price(t), 1)]), 3);
  update();

  lazyStage($('#fu-carro'), {
    camera: [0.6, 2.0, 7.0], target: [0, 0.9, 0], fov: 36,
    label: 'Estrada em forma de parábola: a altura é o preço do carro e a posição é a idade. Um carrinho anda sobre ela.',
    hint: 'arraste para girar · clique nos rótulos',
  }, (s) => {
    s.controls.maxPolarAngle = Math.PI * 0.5;
    const { c, mix, track, tm } = themer(s);
    const CX = (t) => (t - CH) * 0.17, CY = (v) => v * 0.014, WZ = -0.47;
    const shape = new THREE.Shape();
    shape.moveTo(CX(0), 0);
    for (let i = 0; i <= 60; i++) { const t = i / 2; shape.lineTo(CX(t), CY(price(t))); }
    shape.lineTo(CX(30), 0);
    shape.closePath();
    const capM = tm(() => mix('--surface', '--fu-s1', 0.3), { roughness: 0.8 });
    const roadM = tm(() => mix('--ink', '--surface', 0.3), { roughness: 0.75 });
    const slab = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.9, bevelEnabled: false }).translate(0, 0, -0.45), [capM, roadM]);
    s.add(slab);
    // grid wall: price every R$ 30 mil, age every 5 years
    const gp = [];
    for (const v of [0, 30, 60, 90, 120]) gp.push(CX(0), CY(v), WZ, CX(30), CY(v), WZ);
    for (let t = 0; t <= 30; t += 5) gp.push(CX(t), 0, WZ, CX(t), CY(120), WZ);
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
    s.add(new THREE.LineSegments(gg, track(new THREE.LineBasicMaterial(), () => c('--line'))));
    for (const v of [0, 30, 60, 90, 120]) s.label(String(v), [CX(0) - 0.25, CY(v), WZ], { cls: 'fu-num' });
    s.label('mil R$', [CX(0) - 0.25, CY(120) + 0.22, WZ], { cls: 'fu-num' });
    for (let t = 0; t <= 30; t += 5) s.label(String(t), [CX(t), -0.13, 0.5], { cls: 'fu-num' });
    s.label('anos', [CX(30) + 0.35, -0.13, 0.5], { cls: 'fu-num' });
    const inkM = tm(() => c('--ink'), { roughness: 0.5 });
    const drop = new THREE.Mesh(new THREE.BoxGeometry(0.012, CY(CK), 0.012), inkM);
    drop.position.set(CX(CH), CY(CK) / 2, 0.46);
    const vtx = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), inkM);
    vtx.position.set(CX(CH), CY(CK), 0.46);
    s.add(drop, vtx);

    const car = new THREE.Group();
    const bodyM = tm(() => c('--fu-s2'), { roughness: 0.35, metalness: 0.2 });
    const winM = tm(() => mix('--surface', '--ink', 0.25), { roughness: 0.15, metalness: 0.1 });
    const tireM = tm(() => mix('--ink', '--surface', 0.12), { roughness: 0.8 });
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.52, 0.15, 0.32, 2, 0.045), bodyM);
    body.position.y = 0.155;
    const cabin = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.13, 0.28, 2, 0.045), winM);
    cabin.position.set(-0.04, 0.27, 0);
    car.add(body, cabin);
    const wheelG = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 18).rotateX(Math.PI / 2);
    const wheels = [[0.17, 0.165], [0.17, -0.165], [-0.17, 0.165], [-0.17, -0.165]].map(([x, z]) => {
      const w = new THREE.Mesh(wheelG, tireM);
      w.position.set(x, 0.07, z);
      car.add(w);
      return w;
    });
    s.add(car);
    const tag = s.label('', [0, 0, 0], { cls: 'fu-val' });

    P.hot.novo = s.label('zero km · R$ 120 mil', [CX(0) + 0.2, CY(120) + 0.42, 0], { onClick: () => P.pick('novo') });
    P.hot.min = s.label('mínimo · 15 anos', [CX(CH), CY(CK) * 0.45, 0.5], { onClick: () => P.pick('min') });
    P.hot.sobe = s.label('valorização', [CX(26), CY(price(26)) + 0.4, 0], { onClick: () => P.pick('sobe') });

    let shown = slA.value, px = null, dist = 0, lastTxt = '';
    s.onFrame((t, dt) => {
      const a = slA.value;
      shown = reduced ? a : shown + (a - shown) * Math.min(1, dt * 6);
      const x = CX(shown), y = CY(price(shown));
      car.position.set(x, y, 0);
      car.rotation.z = Math.atan((0.014 * 2 * CA * (shown - CH)) / 0.17);
      if (px !== null) dist += Math.sign(x - px) * Math.hypot(x - px, y - car.userData.py);
      px = x;
      car.userData.py = y;
      for (const w of wheels) w.rotation.z = -dist / 0.07;
      tag.position.set(x, y + 0.62, 0);
      const txt = `R$ ${num(price(shown), 1)} mil`;
      if (txt !== lastTxt) { lastTxt = txt; tag.element.textContent = txt; }
    });
  });
}

/* ================================================================== 3 · bactérias: função exponencial ====== */
const t3 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage" id="fu-bact"></div>
    <p class="stage-cap">Uma placa de cultura. Cada bactéria se alonga e se divide em duas. Seis gerações levam 1 bactéria a 64.</p>
    <div class="controls" id="fu-bact-ctl"></div>
    <div class="stats" aria-live="polite">
      <div class="stat"><b id="fu-bc-g">0</b><span>geração</span></div>
      <div class="stat"><b id="fu-bc-t">0 min</b><span>tempo, 20 min por geração</span></div>
      <div class="stat"><b id="fu-bc-n">1</b><span>bactérias</span></div>
    </div>
    <div class="fu-leg"><span><i class="ln k1"></i>Dobra a cada geração: 2<sup>g</sup></span><span><i class="ln k2"></i>Para comparar: ganha 1 por geração</span></div>
    <div class="stage short" id="fu-bact-chart"></div>
    <details class="fu-tv"><summary>Ver como tabela</summary><div id="fu-bact-table"></div></details>
  </div>
  <div class="explain">
    <p class="kicker">Modelo 3 · função exponencial · 20:25 – 20:48</p>
    <h3>Bactérias que dobram</h3>
    <p>O crescimento de bactérias obedece a padrões de funções exponenciais. Cada bactéria se divide em duas, então a população dobra a cada geração: 1, 2, 4, 8, 16…</p>
    ${vlink(1225, 'Crescimento de bactérias: função exponencial')}
    <div class="formula"><i>N</i>(<i>g</i>) = <i>N</i><sub>0</sub> · 2<sup><i>g</i></sup><small>com <i>N</i><sub>0</sub> = 1 bactéria e <i>g</i> gerações</small></div>
    <p>No gráfico, a linha que ganha 1 por geração quase não sai do chão. A exponencial multiplica, e por isso dispara.</p>
    <p class="note fact">Em condições ideais de laboratório, a bactéria <i>E. coli</i> pode se dividir a cada 20 minutos, mais ou menos. Na vida real o alimento e o espaço acabam, e o crescimento desacelera.</p>
    <h4>Para que serve uma função?</h4>
    <ul>
      <li>Afim: a pressão sobe na mesma proporção da temperatura.</li>
      <li>Quadrática: o preço desce, para no vértice e volta a subir.</li>
      <li>Exponencial: a população se multiplica por 2 a cada geração.</li>
    </ul>
    <p>Ou seja, função serve, entre outras coisas, para descrever e modelar fenômenos. E não só para encher o seu saco na escola.</p>
    ${vlinks([[1231, 'Função serve para descrever e modelar fenômenos'], [1242, 'E não só para encher o saco na escola']])}
    ${pickRow([['colonia', 'Colônia'], ['dup', 'Divisão']])}
    <div class="pick" aria-live="polite" hidden></div>
  </div>
</article>`);
root.append(t3);

{
  const $ = (id) => t3.querySelector(id);
  const slG = slider({ id: 'fu-bact-g', label: 'Gerações', min: 0, max: MAXG, step: 1, value: 0 });
  const row = el('<div class="btn-row"><button type="button" class="btn sm" id="fu-bc-div">Dividir: +1 geração</button><button type="button" class="btn sm" id="fu-bc-zero">Recomeçar</button></div>');
  $('#fu-bact-ctl').append(slG.el, row);
  let gen = 0, viaBtn = false, view = null;

  const P = picker(t3, {
    colonia: () => ['Colônia', `Geração ${gen}: 2<sup>${gen}</sup> = ${2 ** gen} bactéria${gen ? 's' : ''}. A cada passo o número é multiplicado por 2, e não somado com um valor fixo.`, [[1225, 'Bactérias: padrão exponencial']]],
    dup: () => ['Divisão', `Uma geração por 20 minutos: depois de ${gen * DUP} minutos já são ${2 ** gen}. Em ${MAXG * DUP} minutos, ${2 ** MAXG}.`, [[1225, 'Crescimento de bactérias'], [1231, 'Função descreve e modela fenômenos']]],
  });

  /* ---- chart: N × g ---- */
  const host = $('#fu-bact-chart');
  const L = 40, R = 396, TT = 16, B = 222;
  const bx = (g) => L + (g / MAXG) * (R - L), by = (n) => B - (n / 64) * (B - TT);
  let g0 = '';
  for (const n of [0, 16, 32, 48, 64]) g0 += `<line class="grid" x1="${L}" x2="${R}" y1="${by(n)}" y2="${by(n)}"/><text x="${L - 8}" y="${by(n) + 4}" text-anchor="end">${n}</text>`;
  for (let g = 0; g <= MAXG; g++) g0 += `<line class="axis" x1="${bx(g)}" x2="${bx(g)}" y1="${B}" y2="${B + 4}"/><text x="${bx(g)}" y="${B + 16}" text-anchor="middle">${g}</text>`;
  let ep = '';
  for (let i = 0; i <= 60; i++) { const g = i / 10; ep += `${i ? 'L' : 'M'}${bx(g).toFixed(1)} ${by(2 ** g).toFixed(1)}`; }
  host.innerHTML = `<svg class="fu-svg" viewBox="0 0 480 270" role="img" aria-labelledby="fu-bc-ti" tabindex="0">
    <title id="fu-bc-ti">Número de bactérias por geração: a exponencial dobra e chega a 64, a comparação linear chega a 7</title>
    ${g0}
    <line class="axis" x1="${L}" x2="${R}" y1="${B}" y2="${B}"/>
    <text x="${L - 8}" y="${TT - 6}" text-anchor="end">bactérias</text>
    <text x="${R}" y="${B + 34}" text-anchor="end">geração (20 min cada)</text>
    <line class="cross" id="fu-bc-x" y1="${TT}" y2="${B}"/>
    <path class="l2" d="M${bx(0)} ${by(1)}L${bx(MAXG)} ${by(1 + MAXG)}"/>
    <path class="l1" d="${ep}"/>
    ${Array.from({ length: MAXG + 1 }, (_, g) => `<circle class="f2 ring" id="fu-bc-l${g}" cx="${bx(g)}" cy="${by(1 + g)}" r="4"/><circle class="f1 ring" id="fu-bc-e${g}" cx="${bx(g)}" cy="${by(2 ** g)}" r="4"/>`).join('')}
    <text class="ink" x="${bx(MAXG) + 9}" y="${by(64) + 4}">2⁶ = 64</text>
    <text class="ink" x="${bx(MAXG) + 9}" y="${by(7) + 4}">1 + 6 = 7</text>
    <rect class="hit" id="fu-bc-hit" x="${L - 10}" y="${TT}" width="${R - L + 20}" height="${B - TT}"/>
  </svg>`;
  const svg = host.querySelector('svg');
  const tip = makeTip(host);
  const cross = (g) => { svg.querySelector('#fu-bc-x').setAttribute('x1', bx(g)); svg.querySelector('#fu-bc-x').setAttribute('x2', bx(g)); };
  const rows = (g) => [[`${2 ** g}`, 'bactérias, dobrando', 'k1'], [`${1 + g}`, 'ganhando 1 por geração', 'k2'], [`geração ${g}`, `${g * DUP} min`]];
  const gAt = (e) => clamp(Math.round(((svgPt(svg, e).x - L) / (R - L)) * MAXG), 0, MAXG);
  const hitB = svg.querySelector('#fu-bc-hit');
  hitB.addEventListener('pointermove', (e) => { const g = gAt(e); cross(g); tip.show(e.clientX, e.clientY, rows(g)); });
  hitB.addEventListener('pointerleave', () => { tip.hide(); cross(gen); });
  hitB.addEventListener('click', (e) => { slG.value = gAt(e); });
  const showCur = () => { const p = toScreen(svg, bx(gen), by(2 ** gen)); tip.show(p.x, p.y, rows(gen)); };
  svg.addEventListener('focus', showCur);
  svg.addEventListener('blur', () => tip.hide());
  svg.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    slG.value = clamp(gen + step, 0, MAXG);
    showCur();
  });
  $('#fu-bact-table').innerHTML = table('Bactérias por geração', ['Geração', 'Tempo (min)', 'Dobrando: 2ᵍ', 'Comparação: 1 + g'],
    Array.from({ length: MAXG + 1 }, (_, g) => [g, g * DUP, 2 ** g, 1 + g]));

  function setGen(g, animate) {
    const prev = gen;
    gen = g;
    $('#fu-bc-g').textContent = g;
    $('#fu-bc-t').textContent = `${g * DUP} min`;
    $('#fu-bc-n').textContent = 2 ** g;
    for (let k = 0; k <= MAXG; k++) {
      svg.querySelector(`#fu-bc-e${k}`).setAttribute('r', k === g ? 6.5 : 4);
      svg.querySelector(`#fu-bc-l${k}`).setAttribute('r', k === g ? 6 : 4);
    }
    cross(g);
    $('#fu-bc-div').disabled = g >= MAXG;
    if (view) view.show(g, animate && g === prev + 1);
    P.refresh();
  }
  slG.on((v) => setGen(v, viaBtn));
  $('#fu-bc-div').addEventListener('click', () => { if (gen >= MAXG) return; viaBtn = true; slG.value = gen + 1; viaBtn = false; });
  $('#fu-bc-zero').addEventListener('click', () => { slG.value = 0; });
  setGen(0, false);

  lazyStage($('#fu-bact'), {
    camera: [0, 3.0, 3.3], target: [0, 0, 0.1], fov: 38,
    label: 'Placa de cultura com uma colônia de bactérias em forma de cápsula que se dividem em duas a cada geração.',
    hint: 'arraste para girar · clique nos rótulos',
  }, (s) => {
    s.controls.maxPolarAngle = Math.PI * 0.45;
    const { c, mix, tm } = themer(s);
    const glass = tm(() => mix('--ink', '--surface', 0.4), { transparent: true, opacity: 0.16, roughness: 0.08, side: THREE.DoubleSide, depthWrite: false });
    const agarM = tm(() => mix('--surface', '--ink', 0.1), { roughness: 0.95 });
    const bactM = tm(() => c('--fu-s1'), { roughness: 0.4 });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.16, 64, 1, true), glass);
    wall.position.y = 0.08;
    wall.renderOrder = 3;
    const agar = new THREE.Mesh(new THREE.CylinderGeometry(1.27, 1.27, 0.06, 64), agarM);
    agar.position.y = 0.03;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.012, 6, 72).rotateX(Math.PI / 2), glass);
    rim.position.y = 0.16;
    s.add(wall, agar, rim);

    const mesh = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.045, 0.1, 4, 10).rotateZ(Math.PI / 2), bactM, 2 ** MAXG);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    s.add(mesh);
    const M4 = new THREE.Matrix4(), V = new THREE.Vector3(), Q = new THREE.Quaternion(), SC = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
    const pa = [0, 0], pb = [0, 0], Y = 0.06 + 0.048;
    // small fixed tilt per cell so the colony looks alive; the cell lies along the axis of its next split
    const jit = (g, i) => ((((i + 1) * 2654435761) ^ (g * 40503)) >>> 0) % 1000 / 1000 * 0.36 - 0.18;
    const ang = (g, i) => (g % 2 ? Math.PI / 2 : 0) + jit(g, i);
    function put(i, x, z, a, sx) {
      V.set(x, Y, z);
      Q.setFromAxisAngle(UP, a);
      SC.set(sx, 1, 1);
      mesh.setMatrixAt(i, M4.compose(V, Q, SC));
    }
    /** state of the division from generation g − 1 to g at progress u (1 = finished) */
    function render(g, u) {
      if (u >= 1 || g === 0) {
        const n = 2 ** g;
        for (let i = 0; i < n; i++) { cellPos(g, i, pa); put(i, pa[0], pa[1], ang(g, i), 1); }
        mesh.count = n;
      } else if (u < 0.45) {
        const e = ease(u / 0.45), n = 2 ** (g - 1);
        for (let i = 0; i < n; i++) { cellPos(g - 1, i, pa); put(i, pa[0], pa[1], ang(g - 1, i), 1 + 0.8 * e); }
        mesh.count = n;
      } else {
        const e = ease((u - 0.45) / 0.55), n = 2 ** g, alongX = g % 2 === 1;
        for (let k = 0; k < n; k++) {
          cellPos(g - 1, k >> 1, pa);
          cellPos(g, k, pb);
          const off = (k & 1 ? 1 : -1) * SP * 0.4, a0 = ang(g - 1, k >> 1);
          const x0 = pa[0] + (alongX ? off : 0), z0 = pa[1] + (alongX ? 0 : off);
          put(k, x0 + (pb[0] - x0) * e, z0 + (pb[1] - z0) * e, a0 + (ang(g, k) - a0) * e, 0.9 + 0.1 * e);
        }
        mesh.count = n;
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    P.hot.colonia = s.label('', [0, 0.5, 0], { onClick: () => P.pick('colonia') });
    P.hot.dup = s.label('', [0, 0.12, 1.45], { onClick: () => P.pick('dup') });
    let anim = null;
    const labels = (g) => { P.hot.colonia.element.textContent = `N = 2${'⁰¹²³⁴⁵⁶'[g]} = ${2 ** g}`; P.hot.dup.element.textContent = `t = ${g * DUP} min`; };
    view = {
      show(g, animate) {
        labels(g);
        if (animate && !reduced) { anim = { g, t0: performance.now() / 1000 }; render(g, 0); } else { anim = null; render(g, 1); }
      },
    };
    s.onFrame((t) => {
      if (!anim) return;
      const u = Math.min(1, (t - anim.t0) / 1.1);
      render(anim.g, u);
      if (u >= 1) anim = null;
    });
    view.show(gen, false);
  });
}

/* ================================================================== 4 · a máquina de funções (3D) ====== */
const t4 = el(`
<article class="topic flip">
  <div class="stage-col">
    <div class="stage" id="fu-maq"></div>
    <p class="stage-cap">O número entra pelo funil, as engrenagens fazem a operação e o resultado sai pela rampa. A regra fica escondida até você descobrir qual é.</p>
    <div class="controls">
      <div class="btn-row" role="group" aria-label="Colocar um número na máquina" id="fu-maq-x"><span class="seg-label">Colocar x =</span>
        ${[0, 1, 2, 3, 4, 5, 6].map((x) => `<button type="button" class="btn sm" data-x="${x}" aria-label="Colocar o número ${x} na máquina">${x}</button>`).join('')}</div>
      <div class="btn-row"><button type="button" class="btn sm" id="fu-maq-demo">Exemplo do vídeo: 1, 2 e 3</button><button type="button" class="btn sm" id="fu-maq-clear">Limpar</button></div>
    </div>
    <div class="fu-leg"><span><i class="rd k2"></i>x escolhido (domínio)</span><span><i class="rd k1"></i>valor que saiu (imagem)</span><span><i class="hol m"></i>ainda vazio</span></div>
    <div class="stage short" id="fu-maq-map"></div>
    <div id="fu-maq-table"></div>
  </div>
  <div class="explain">
    <p class="kicker">A máquina de funções · 20:42 – 21:25</p>
    <h3>Entra um número, sai outro</h3>
    <p>Função é um tipo específico de relação entre números. É como uma máquina que recebe números de entrada, faz uma operação e cospe um número de saída.</p>
    ${vlinks([[1242, 'Função: uma relação específica entre números'], [1248, 'A máquina: entrada, operação, saída']])}
    <p>O conjunto de onde vêm as entradas se chama domínio. O conjunto onde caem as saídas se chama contradomínio.</p>
    ${vlink(1252, 'Domínio e contradomínio')}
    <h4>Qual função faz isso?</h4>
    <p>Coloque números na máquina e veja o que sai. Depois escolha a regra. Cuidado: com um par só, várias regras parecem certas.</p>
    <div class="fu-guess" role="group" aria-label="Qual é a regra da máquina?"><span class="seg-label"><i>f</i>(<i>x</i>) =</span>
      ${CANDS.map((k) => `<button type="button" class="btn sm" data-c="${k.id}">${k.html}</button>`).join('')}</div>
    <p class="readout" id="fu-maq-msg" aria-live="polite">Nenhum número entrou ainda.</p>
    <div class="formula" id="fu-maq-rule"><i>f</i>(<i>x</i>) = ?</div>
    ${vlinks([[1259, 'Qual é a função que faz essa operação?'], [1267, 'A resposta do vídeo, testada com 1, 2 e 3']])}
    <p>Se alguma coisa na natureza obedece a esse padrão de comportamento, você pode usar a função como modelo.</p>
    ${vlink(1279, 'Se a natureza segue o padrão, use como modelo')}
    <p class="note fact">Um detalhe de nomes: os valores que realmente saem formam a imagem da função. A imagem fica dentro do contradomínio, que pode ter números que nunca saem, como 0, 1 e 2 no diagrama.</p>
    ${pickRow([['dom', 'Domínio'], ['maq', 'Máquina'], ['contra', 'Contradomínio'], ['regra', 'Regra']])}
    <div class="pick" aria-live="polite" hidden></div>
  </div>
</article>`);
root.append(t4);

{
  const $ = (id) => t4.querySelector(id);
  const pairs = new Map();
  const queue = [];
  let busy = false, revealed = false, last = null, view = null;
  const imgs = () => [...pairs.values()].sort((a, b) => a - b);

  const P = picker(t4, {
    dom: () => ['Domínio', `As entradas possíveis desta máquina: 0, 1, 2, 3, 4, 5 e 6. ${pairs.size ? `Você já colocou ${[...pairs.keys()].sort((a, b) => a - b).join(', ')}.` : 'Escolha um número para começar.'}`, [[1252, 'Domínio: os números de entrada']]],
    maq: () => ['A máquina', 'Recebe um número, faz sempre a mesma operação e cospe um único número de saída. Mesma entrada, mesma saída: é isso que faz dela uma função.', [[1248, 'A máquina que recebe e cospe números']]],
    contra: () => ['Contradomínio', `Onde as saídas caem: aqui, de 0 a 9. ${pairs.size ? `Já saíram ${imgs().join(', ')}, e esses valores formam a imagem.` : 'Nada saiu ainda.'}`, [[1252, 'Contradomínio: os números de saída']]],
    regra: () => ['A regra', revealed ? '<i>f</i>(<i>x</i>) = <i>x</i> + 3. Para <i>x</i> = 1 sai 4, para 2 sai 5, para 3 sai 6. A regra bate com todos os pares.' : 'Ainda escondida. Coloque números e teste uma das regras ao lado.', [[1259, 'Qual função faz isso?'], [1267, 'Para x = 1, y = 4; x = 2, y = 5; x = 3, y = 6'], [1279, 'Use como modelo']]],
  });

  /* ---- arrow diagram: domain → codomain ---- */
  const host = $('#fu-maq-map');
  const DX = 110, CX2 = 370, MY = 147;
  const dy = (x) => MY + (x - 3) * 30, cy = (y) => MY + (y - 4.5) * 22;
  host.innerHTML = `<svg class="fu-svg" viewBox="0 0 480 270" role="img" aria-labelledby="fu-mp-ti">
    <title id="fu-mp-ti">Diagrama de flechas do domínio, 0 a 6, para o contradomínio, 0 a 9</title>
    <text class="t13 ink" x="${DX}" y="20" text-anchor="middle">Domínio</text>
    <text class="t13 ink" x="${CX2}" y="20" text-anchor="middle">Contradomínio</text>
    <ellipse class="set" cx="${DX}" cy="${MY}" rx="56" ry="112"/>
    <ellipse class="set" cx="${CX2}" cy="${MY}" rx="56" ry="114"/>
    <g id="fu-mp-arrows"></g>
    ${[0, 1, 2, 3, 4, 5, 6].map((x) => `<g data-d="${x}"><circle class="dot" cx="${DX}" cy="${dy(x)}" r="11"/><text class="dn" x="${DX}" y="${dy(x) + 4}" text-anchor="middle">${x}</text></g>`).join('')}
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((y) => `<g data-c="${y}"><circle class="dot" cx="${CX2}" cy="${cy(y)}" r="9.5"/><text class="dn" x="${CX2}" y="${cy(y) + 4}" text-anchor="middle">${y}</text></g>`).join('')}
    <text class="t12 ink" x="240" y="20" text-anchor="middle" id="fu-mp-f">f</text>
  </svg>`;
  const svg = host.querySelector('svg');
  const tip = makeTip(host);
  function renderMap() {
    const im = new Set(pairs.values());
    svg.querySelectorAll('g[data-d]').forEach((g) => {
      const on = pairs.has(+g.dataset.d);
      g.querySelector('circle').classList.toggle('on2', on);
      g.querySelector('text').classList.toggle('on', on);
    });
    svg.querySelectorAll('g[data-c]').forEach((g) => {
      const on = im.has(+g.dataset.c);
      g.querySelector('circle').classList.toggle('on1', on);
      g.querySelector('text').classList.toggle('on', on);
    });
    svg.querySelector('#fu-mp-arrows').innerHTML = [...pairs].map(([x, y]) => {
      const x1 = DX + 13, y1 = dy(x), x2 = CX2 - 12, y2 = cy(y), isNew = x === last;
      return `<path class="${isNew ? 'arrow new' : 'faint'}" pathLength="1" d="M${x1} ${y1}C${x1 + 90} ${y1} ${x2 - 90} ${y2} ${x2 - 6} ${y2}"/>` +
        `<path class="head${isNew ? ' new' : ''}" d="M${x2} ${y2}l-8 -4.5v9z"/>`;
    }).join('');
    svg.querySelector('#fu-mp-f').textContent = revealed ? 'f(x) = x + 3' : 'f(x) = ?';
  }
  svg.addEventListener('pointermove', (e) => {
    const d = e.target.closest('g[data-d]'), c = e.target.closest('g[data-c]');
    if (d) {
      const x = +d.dataset.d;
      tip.show(e.clientX, e.clientY, pairs.has(x) ? [[`f(${x}) = ${pairs.get(x)}`, 'já testado', 'k2']] : [[`x = ${x}`, 'ainda não entrou na máquina', 'k2']]);
    } else if (c) {
      const y = +c.dataset.c, from = [...pairs].find(([, v]) => v === y);
      tip.show(e.clientX, e.clientY, from ? [[`${y} = f(${from[0]})`, 'faz parte da imagem', 'k1']] : [[`${y}`, y < 3 ? 'nenhum x de 0 a 6 leva até aqui' : 'ainda não saiu', 'kg']]);
    } else tip.hide();
  });
  svg.addEventListener('pointerleave', () => tip.hide());

  function renderTable() {
    const xs = [...pairs.keys()].sort((a, b) => a - b);
    $('#fu-maq-table').innerHTML = xs.length
      ? table('Pares que saíram da máquina', ['Domínio: x', 'operação', 'Contradomínio: f(x)'], xs.map((x) => [x, revealed ? `${x} + 3` : '?', pairs.get(x)]), xs.indexOf(last))
      : '<p class="muted" style="font-size:13px">A tabela de pares aparece aqui.</p>';
  }
  function record(x) {
    pairs.set(x, f(x));
    last = x;
    renderMap();
    renderTable();
    if (!revealed) $('#fu-maq-msg').textContent = `Entrou ${x}, saiu ${f(x)}. Já dá para chutar a regra?`;
    P.refresh();
  }
  function next() {
    const x = queue.shift();
    if (x === undefined) { busy = false; return; }
    busy = true;
    if (!view) { record(x); next(); return; }
    view.run(x, () => { record(x); next(); });
  }
  const feed = (...xs) => { queue.push(...xs); if (!busy) next(); };
  $('#fu-maq-x').addEventListener('click', (e) => { const b = e.target.closest('button[data-x]'); if (b) feed(+b.dataset.x); });
  $('#fu-maq-demo').addEventListener('click', () => feed(1, 2, 3));
  function reveal(on) {
    revealed = on;
    $('#fu-maq-rule').innerHTML = on ? '<i>f</i>(<i>x</i>) = <i>x</i> + 3' : '<i>f</i>(<i>x</i>) = ?';
    if (view) view.sign(on);
    renderMap();
    renderTable();
    P.refresh();
  }
  $('#fu-maq-clear').addEventListener('click', () => {
    queue.length = 0;
    pairs.clear();
    last = null;
    $('#fu-maq-msg').textContent = 'Nenhum número entrou ainda.';
    reveal(false);
  });
  t4.querySelector('.fu-guess').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-c]');
    if (!b) return;
    const cand = CANDS.find((k) => k.id === b.dataset.c), ps = [...pairs].sort((p, q) => p[0] - q[0]);
    const msg = $('#fu-maq-msg');
    if (!ps.length) { msg.textContent = 'Coloque pelo menos um número na máquina primeiro.'; return; }
    const bad = ps.find(([x, y]) => cand.f(x) !== y);
    if (bad) { msg.textContent = `Não é ${cand.txt}: para x = ${bad[0]} daria ${cand.f(bad[0])}, e a máquina deu ${bad[1]}.`; return; }
    const rivals = CANDS.filter((k) => k !== cand && ps.every(([x, y]) => k.f(x) === y));
    if (rivals.length) {
      msg.textContent = `${cand.txt} funciona para ${ps.map(([x, y]) => `${x} → ${y}`).join(', ')}. Só que ${rivals.map((k) => k.txt).join(', ')} também ${rivals.length > 1 ? 'funcionam' : 'funciona'}. Teste outro número para desempatar.`;
      return;
    }
    msg.textContent = `Isso! ${cand.txt} bate com todos os pares. A máquina faz f(x) = x + 3.`;
    reveal(true);
  });
  renderMap();
  renderTable();

  lazyStage($('#fu-maq'), {
    camera: [1.2, 2.3, 5.8], target: [0.55, 1.05, 0], fov: 36,
    label: 'Máquina com um funil de entrada em cima, três engrenagens na frente e uma rampa de saída à direita. Bolinhas numeradas entram e saem.',
    hint: 'arraste para girar · clique nos rótulos',
  }, (s) => {
    s.controls.maxPolarAngle = Math.PI * 0.5;
    const { c, mix, tm } = themer(s);
    const bodyM = tm(() => mix('--surface', '--ink', 0.16), { roughness: 0.6 });
    const steel = tm(() => mix('--surface', '--ink', 0.45), { metalness: 0.5, roughness: 0.32 });
    const darkM = tm(() => mix('--surface', '--ink', 0.75), { roughness: 0.6 });
    const inM = tm(() => c('--fu-s2'), { roughness: 0.35, metalness: 0.15 });
    const outM = tm(() => c('--fu-s1'), { roughness: 0.35, metalness: 0.15 });
    const plateM = tm(() => mix('--surface', '--ink', 0.07), { roughness: 0.9 });

    const plate = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.04, 1.8), plateM);
    plate.position.set(0.6, -0.02, 0);
    const body = new THREE.Mesh(new RoundedBoxGeometry(1.8, 1.4, 0.9, 3, 0.08), bodyM);
    body.position.y = 0.8;
    s.add(plate, body);

    // gears with equal tooth size (module 0.05): pitch radius = 0.025 · teeth
    function gear(teeth) {
      const pitch = 0.025 * teeth, ro = pitch + 0.05, ri = pitch - 0.058, st = TAU / teeth, sh = new THREE.Shape();
      for (let i = 0; i < teeth; i++) {
        const a = i * st;
        [[ri, a], [ro, a + st * 0.18], [ro, a + st * 0.42], [ri, a + st * 0.6]].forEach(([r, b], j) => {
          if (i === 0 && j === 0) sh.moveTo(r * Math.cos(b), r * Math.sin(b)); else sh.lineTo(r * Math.cos(b), r * Math.sin(b));
        });
      }
      sh.closePath();
      const hole = new THREE.Path();
      hole.absarc(0, 0, pitch * 0.3, 0, TAU, true);
      sh.holes.push(hole);
      return new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 1, curveSegments: 10 });
    }
    const st12 = TAU / 12, st8 = TAU / 8, st10 = TAU / 10, A0 = -0.3 * st12, CA2 = (-2 * Math.PI) / 3;
    const gears = [
      { m: new THREE.Mesh(gear(12), steel), x: -0.3, y: 0.95, k: 1, ph: A0 },
      { m: new THREE.Mesh(gear(8), outM), x: 0.2, y: 0.95, k: -12 / 8, ph: Math.PI - 0.8 * st8 },
      { m: new THREE.Mesh(gear(10), steel), x: -0.3 + 0.55 * Math.cos(CA2), y: 0.95 + 0.55 * Math.sin(CA2), k: -12 / 10, ph: CA2 + Math.PI - 0.8 * st10 },
    ];
    const axleG = new THREE.CylinderGeometry(0.035, 0.035, 0.16, 16).rotateX(Math.PI / 2);
    for (const g of gears) {
      g.m.position.set(g.x, g.y, 0.455);
      const ax = new THREE.Mesh(axleG, darkM);
      ax.position.set(g.x, g.y, 0.5);
      s.add(g.m, ax);
    }
    // input funnel on top, output slot and chute on the right
    const FX = -0.5;
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.14, 0.55, 40, 1, true), tm(() => c('--fu-s2'), { roughness: 0.45, metalness: 0.2, side: THREE.DoubleSide }));
    funnel.position.set(FX, 1.5 + 0.1 + 0.275, 0);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 24, 1, true), steel);
    neck.position.set(FX, 1.56, 0);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.022, 8, 48).rotateX(Math.PI / 2), steel);
    lip.position.set(FX, 2.15, 0);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.36, 0.44), darkM);
    slot.position.set(0.905, 0.6, 0);
    s.add(funnel, neck, lip, slot);
    const LC = 1.25, TH = -0.3, S0 = new THREE.Vector3(0.9, 0.42, 0);
    const D = new THREE.Vector3(Math.cos(TH), Math.sin(TH), 0), N = new THREE.Vector3(-D.y, D.x, 0);
    const chute = new THREE.Group();
    chute.position.copy(S0).addScaledVector(D, LC / 2);
    chute.rotation.z = TH;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(LC, 0.04, 0.4), outM);
    const railG = new THREE.BoxGeometry(LC, 0.07, 0.025);
    const r1 = new THREE.Mesh(railG, steel), r2 = new THREE.Mesh(railG, steel);
    r1.position.set(0, 0.05, 0.2);
    r2.position.set(0, 0.05, -0.2);
    chute.add(plank, r1, r2);
    s.add(chute);
    const legG = new THREE.CylinderGeometry(0.025, 0.025, 1, 10);
    const end = S0.clone().addScaledVector(D, LC - 0.1);
    for (const z of [0.17, -0.17]) {
      const leg = new THREE.Mesh(legG, steel);
      leg.scale.y = Math.max(0.02, end.y);
      leg.position.set(end.x, end.y / 2, z);
      s.add(leg);
    }

    const BR = 0.13, ballG = new THREE.SphereGeometry(BR, 28, 18);
    const inBall = new THREE.Mesh(ballG, inM), outBall = new THREE.Mesh(ballG, outM);
    inBall.visible = outBall.visible = false;
    s.add(inBall, outBall);
    const inLbl = s.label('', [0, 0.27, 0], { parent: inBall, cls: 'fu-ball' });
    const outLbl = s.label('', [0, 0.27, 0], { parent: outBall, cls: 'fu-ball' });
    inLbl.visible = outLbl.visible = false;
    const along = (u, out) => out.copy(S0).addScaledVector(D, 0.16 + u * (LC - 0.32)).addScaledVector(N, 0.02 + BR);

    P.hot.dom = s.label('domínio · entrada', [FX - 0.72, 2.2, 0], { onClick: () => P.pick('dom') });
    P.hot.maq = s.label('a máquina', [0.55, 1.62, 0.35], { onClick: () => P.pick('maq') });
    P.hot.contra = s.label('contradomínio · saída', [2.3, 0.18, 0.35], { onClick: () => P.pick('contra') });
    P.hot.regra = s.label('f(x) = ?', [0.42, 0.4, 0.5], { cls: 'fu-sign', onClick: () => P.pick('regra') });

    let spin = 0, spinV = 0, rot = 0;
    view = {
      sign(on) { P.hot.regra.element.textContent = on ? 'f(x) = x + 3' : 'f(x) = ?'; },
      run(x, done) {
        inLbl.element.textContent = String(x);
        outLbl.element.textContent = String(f(x));
        inBall.visible = inLbl.visible = true;
        outBall.visible = outLbl.visible = false;
        inBall.scale.setScalar(1);
        tween(0, 1, 700, (u) => {
          inBall.position.set(FX, 2.85 - u * 1.3, 0);
          inBall.scale.setScalar(1 - 0.3 * Math.max(0, (u - 0.75) / 0.25));
          inLbl.visible = u < 0.7;
        }, () => {
          inBall.visible = inLbl.visible = false;
          spin = 1;
          setTimeout(() => {
            spin = 0;
            outBall.visible = outLbl.visible = true;
            tween(0, 1, 850, (u) => { along(u, outBall.position); outBall.rotation.z = (-u * (LC - 0.32)) / BR; }, done);
          }, reduced ? 0 : 800);
        });
      },
    };
    view.sign(revealed);
    s.onFrame((t, dt) => {
      spinV = reduced ? 0 : spinV + (spin * 5 - spinV) * Math.min(1, dt * 4);
      rot += spinV * dt;
      for (const g of gears) g.m.rotation.z = g.ph + rot * g.k;
      body.position.y = 0.8 + Math.sin(t * 47) * 0.003 * (spinV / 5);
    });
  });
}

/* ================================================================== 5 · coeficientes da reta ====== */
const t5 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage tall" id="fu-reta"></div>
    <p class="stage-cap">Mesma escala nos dois eixos, então o ângulo que você vê é o ângulo de verdade. Passe o mouse para ler f(x); clique no ponto <i>b</i> ou no triângulo para detalhar.</p>
    <div class="controls" id="fu-reta-ctl"></div>
    <div class="stats" aria-live="polite">
      <div class="stat"><b id="fu-rt-a">1</b><span>coeficiente angular a</span></div>
      <div class="stat"><b id="fu-rt-b">3</b><span>coeficiente linear b</span></div>
      <div class="stat"><b id="fu-rt-t">45°</b><span>ângulo com o eixo x</span></div>
    </div>
    <div class="fu-leg"><span><i class="ln k1"></i>f(x) = ax + b</span><span><i class="rd k2"></i>b: onde corta o eixo y</span><span><i class="rd km"></i>Pares da máquina: (1, 4), (2, 5), (3, 6)</span></div>
    <details class="fu-tv"><summary>Ver como tabela</summary><div id="fu-rt-table"></div></details>
  </div>
  <div class="explain">
    <p class="kicker">Coeficientes da reta · 21:25 – 21:51</p>
    <h3>Quem sobe e quem inclina</h3>
    <p>Na função afim, cada letra tem um papel no gráfico. Mexa nos controles e veja a reta responder.</p>
    <div class="formula" id="fu-rt-f"></div>
    <h4>Coeficiente linear, <i>b</i></h4>
    <p>Diz se a reta está mais para cima ou mais para baixo. É o ponto em que ela corta o eixo y, onde x = 0.</p>
    ${vlink(1285, 'Coeficiente linear: mais para cima ou para baixo')}
    <h4>Coeficiente angular, <i>a</i></h4>
    <p>Mede a inclinação. Quanto maior o coeficiente angular, mais inclinada a reta. Andando 1 para a direita, a reta sobe <i>a</i>.</p>
    ${vlinks([[1293, 'Coeficiente angular: mede a inclinação'], [1298, 'Quanto maior, mais inclinada']])}
    <p>Se o coeficiente angular for nulo, sobra <i>f</i>(<i>x</i>) = <i>b</i>: uma reta paralela ao eixo x.</p>
    ${vlink(1305, 'Coeficiente angular nulo: paralela ao eixo x')}
    <p class="note fact">O coeficiente angular é a tangente do ângulo que a reta faz com o eixo x: <i>a</i> = tg <i>θ</i>. Com <i>a</i> negativo, a reta desce.</p>
    ${pickRow([['b', 'b'], ['a', 'a'], ['zero', 'a = 0']])}
    <div class="pick" aria-live="polite" hidden></div>
    <p>Já falei demais de função. Paciência tem limite.</p>
    <div class="btn-row">${vlink(1311, 'Paciência tem limite. E por falar em limite…')}<a class="btn sm" href="#limites">Ir para Limites</a></div>
  </div>
</article>`);
root.append(t5);

{
  const $ = (id) => t5.querySelector(id);
  const slA = slider({ id: 'fu-rt-sa', label: 'a (angular)', min: -3, max: 3, step: 0.25, value: 1, format: (v) => sg(v, 2) });
  const slB = slider({ id: 'fu-rt-sb', label: 'b (linear)', min: -3, max: 6, step: 0.5, value: 3, format: (v) => sg(v, 1) });
  const PRE = [['f(x) = x + 3', 1, 3], ['a = 3: mais inclinada', 3, 3], ['a = 0: paralela ao eixo x', 0, 3], ['a = −1: descendo', -1, 3]];
  const pre = el(`<div class="btn-row" role="group" aria-label="Exemplos">${PRE.map(([l], i) => `<button type="button" class="btn sm" data-i="${i}">${l}</button>`).join('')}</div>`);
  $('#fu-reta-ctl').append(slA.el, slB.el, pre);
  let tok = 0;
  pre.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    const [, a1, b1] = PRE[+b.dataset.i], a0 = slA.value, b0 = slB.value, my = ++tok;
    tween(0, 1, 700, (u) => { if (my === tok) { slA.value = a0 + (a1 - a0) * u; slB.value = b0 + (b1 - b0) * u; } });
  });
  [slA, slB].forEach((x) => x.input.addEventListener('input', () => { tok++; }));
  const lineTxt = (a, b, html) => {
    const X = html ? '<i>x</i>' : 'x';
    let s = a === 0 ? '' : `${a === 1 ? '' : a === -1 ? '−' : sg(a, 2)}${X}`;
    if (b !== 0 || a === 0) s += s ? ` ${b < 0 ? '−' : '+'} ${num(Math.abs(b), 2)}` : sg(b, 2);
    return s;
  };
  console.assert(lineTxt(1, 3) === 'x + 3' && lineTxt(0, 3) === '3' && lineTxt(-1, -2) === '−x − 2' && lineTxt(1.5, 0) === '1,5x', 'texto da reta');

  const P = picker(t5, {
    b: () => ['Coeficiente linear (b)', `Agora <i>b</i> = ${sg(slB.value, 1)}: a reta corta o eixo y no ponto (0, ${sg(slB.value, 1)}). Aumentar <i>b</i> sobe a reta inteira sem mudar a inclinação.`, [[1285, 'Coeficiente linear: mais para cima ou para baixo']]],
    a: () => ['Coeficiente angular (a)', `Agora <i>a</i> = ${sg(slA.value, 2)}: a cada 1 passo para a direita, a reta ${slA.value > 0 ? 'sobe' : slA.value < 0 ? 'desce' : 'não sobe nem desce'}${slA.value ? ` ${num(Math.abs(slA.value), 2)}` : ''}. Quanto maior <i>a</i>, mais inclinada.`, [[1293, 'Coeficiente angular: mede a inclinação'], [1298, 'Quanto maior, mais inclinada']]],
    zero: () => ['Coeficiente angular nulo', 'Com <i>a</i> = 0, a função fica <i>f</i>(<i>x</i>) = <i>b</i>: todo <i>x</i> dá o mesmo valor, e a reta é paralela ao eixo x.', [[1305, 'Coeficiente angular nulo: paralela ao eixo x']]],
  });

  const host = $('#fu-reta');
  const L = 34, R = 386, TT = 14, B = 366, X0 = -5, X1 = 6, Y0 = -3, Y1 = 8;
  const sx = (x) => L + ((x - X0) / (X1 - X0)) * (R - L), sy = (y) => B - ((y - Y0) / (Y1 - Y0)) * (B - TT);
  let g = '';
  for (let x = X0; x <= X1; x++) g += `<line class="grid" x1="${sx(x)}" x2="${sx(x)}" y1="${TT}" y2="${B}"/>`;
  for (let y = Y0; y <= Y1; y++) g += `<line class="grid" x1="${L}" x2="${R}" y1="${sy(y)}" y2="${sy(y)}"/>`;
  for (let x = X0; x <= X1; x++) if (x) g += `<text class="halo" x="${sx(x)}" y="${sy(0) + 15}" text-anchor="middle">${x < 0 ? '−' : ''}${Math.abs(x)}</text>`;
  for (let y = Y0; y <= Y1; y++) if (y) g += `<text class="halo" x="${sx(0) - 6}" y="${sy(y) + 4}" text-anchor="end">${y < 0 ? '−' : ''}${Math.abs(y)}</text>`;
  host.innerHTML = `<svg class="fu-svg" viewBox="0 0 400 400" role="img" aria-labelledby="fu-rt-ti" tabindex="0">
    <title id="fu-rt-ti">Gráfico da reta f(x) = ax + b, com o ponto b no eixo y e o triângulo da inclinação</title>
    <defs><clipPath id="fu-rt-clip"><rect x="${L}" y="${TT}" width="${R - L}" height="${B - TT}"/></clipPath></defs>
    ${g}
    <line class="axis" x1="${L}" x2="${R}" y1="${sy(0)}" y2="${sy(0)}"/><line class="axis" x1="${sx(0)}" x2="${sx(0)}" y1="${TT}" y2="${B}"/>
    <text class="ink halo" x="${R - 4}" y="${sy(0) - 7}" text-anchor="end">x</text><text class="ink halo" x="${sx(0) + 7}" y="${TT + 12}">y</text>
    <text class="halo" x="${sx(0) - 6}" y="${sy(0) + 15}" text-anchor="end">0</text>
    <g clip-path="url(#fu-rt-clip)">
      <path class="l1" id="fu-rt-line" style="stroke-width:2.5"/>
      ${[[1, 4], [2, 5], [3, 6]].map(([x, y]) => `<circle class="fm ring" cx="${sx(x)}" cy="${sy(y)}" r="4.5"/>`).join('')}
      <line class="cross" id="fu-rt-x" y1="${TT}" y2="${B}" style="display:none"/>
      <circle class="f1 ring" id="fu-rt-hd" r="4.5" style="display:none"/>
    </g>
    <rect class="hit" id="fu-rt-hit" x="${L}" y="${TT}" width="${R - L}" height="${B - TT}"/>
    <g clip-path="url(#fu-rt-clip)"><g data-k="a"><path class="wash1" id="fu-rt-tri"/><path class="lk" id="fu-rt-legs"/></g></g>
    <g data-k="a"><text class="ink halo" id="fu-rt-l1"></text><text class="ink halo" id="fu-rt-la"></text></g>
    <g data-k="b"><circle class="hit" id="fu-rt-bh" r="13"/><circle class="f2 ring" id="fu-rt-bd" r="5.5"/><text class="ink halo" id="fu-rt-bl"></text></g>
  </svg>`;
  const svg = host.querySelector('svg');
  const tip = makeTip(host);
  const q = (id) => svg.querySelector(id);
  const set = (node, attrs) => { for (const k in attrs) node.setAttribute(k, attrs[k]); };
  let hx = 1;
  function draw() {
    const a = slA.value, b = slB.value, fx = (x) => a * x + b;
    q('#fu-rt-line').setAttribute('d', `M${sx(X0)} ${sy(fx(X0))}L${sx(X1)} ${sy(fx(X1))}`);
    // b marker, label on the side the line leaves free
    set(q('#fu-rt-bd'), { cx: sx(0), cy: sy(b) });
    set(q('#fu-rt-bh'), { cx: sx(0), cy: sy(b) });
    set(q('#fu-rt-bl'), { x: a >= 0 ? sx(0) - 10 : sx(0) + 10, y: sy(b) - 9, 'text-anchor': a >= 0 ? 'end' : 'start' });
    q('#fu-rt-bl').textContent = `b = ${sg(b, 1)}`;
    // slope triangle: run 1, rise a, at the first spot where it fits
    const x0 = [1, 2, 0, -1, -2, 3, 4, -3].find((x) => [fx(x), fx(x + 1)].every((y) => y >= Y0 + 0.4 && y <= Y1 - 0.4)) ?? 1;
    const y0 = fx(x0), up = a >= 0;
    q('#fu-rt-tri').setAttribute('d', a ? `M${sx(x0)} ${sy(y0)}H${sx(x0 + 1)}V${sy(y0 + a)}Z` : '');
    q('#fu-rt-legs').setAttribute('d', a ? `M${sx(x0)} ${sy(y0)}H${sx(x0 + 1)}V${sy(y0 + a)}` : '');
    set(q('#fu-rt-l1'), { x: sx(x0 + 0.5), y: up ? sy(y0) + 15 : sy(y0) - 7, 'text-anchor': 'middle' });
    q('#fu-rt-l1').textContent = a ? '1' : '';
    set(q('#fu-rt-la'), { x: sx(x0 + 1) + 7, y: sy(y0 + a / 2) + 4, 'text-anchor': 'start' });
    q('#fu-rt-la').textContent = a ? `a = ${sg(a, 2)}` : '';
    if (!a) { set(q('#fu-rt-la'), { x: sx(x0 + 0.5), y: sy(b) - 9, 'text-anchor': 'middle' }); q('#fu-rt-la').textContent = 'a = 0: paralela ao eixo x'; }
    const deg = (Math.atan(a) * 180) / Math.PI;
    $('#fu-rt-a').textContent = sg(a, 2);
    $('#fu-rt-b').textContent = sg(b, 1);
    $('#fu-rt-t').textContent = `${sg(deg, 1)}°`;
    const onMachine = a === 1 && b === 3;
    $('#fu-rt-f').innerHTML = `<i>f</i>(<i>x</i>) = ${lineTxt(a, b, true)}<small>${onMachine ? 'é a regra da máquina: a reta passa pelos três pares (1, 4), (2, 5) e (3, 6)' : a === 0 ? 'coeficiente angular nulo: reta paralela ao eixo x' : `a cada 1 para a direita, a reta ${a > 0 ? 'sobe' : 'desce'} ${num(Math.abs(a), 2)}`}</small>`;
    $('#fu-rt-table').innerHTML = table(`Valores de f(x) = ${lineTxt(a, b)}`, ['x', 'f(x)'], Array.from({ length: 11 }, (_, i) => [sg(i - 5, 0), sg(fx(i - 5), 2)]), 5);
    P.refresh();
  }
  slA.on(draw);
  slB.on(draw);
  function hover(x, cx, cy) {
    hx = clamp(Math.round(x * 2) / 2, X0, X1);
    const y = slA.value * hx + slB.value;
    set(q('#fu-rt-x'), { x1: sx(hx), x2: sx(hx) });
    q('#fu-rt-x').style.display = '';
    set(q('#fu-rt-hd'), { cx: sx(hx), cy: sy(y) });
    q('#fu-rt-hd').style.display = y >= Y0 && y <= Y1 ? '' : 'none';
    if (cx === undefined) { const p = toScreen(svg, sx(hx), sy(clamp(y, Y0, Y1))); cx = p.x; cy = p.y; }
    const xs = hx < 0 ? `(${sg(hx, 1)})` : sg(hx, 1), bb = slB.value;
    tip.show(cx, cy, [[`f(${sg(hx, 1)}) = ${sg(y, 2)}`, `= ${sg(slA.value, 2)} · ${xs} ${bb < 0 ? '−' : '+'} ${num(Math.abs(bb), 1)}`, 'k1']]);
  }
  const out = () => { tip.hide(); q('#fu-rt-x').style.display = 'none'; q('#fu-rt-hd').style.display = 'none'; };
  q('#fu-rt-hit').addEventListener('pointermove', (e) => hover(X0 + ((svgPt(svg, e).x - L) / (R - L)) * (X1 - X0), e.clientX, e.clientY));
  q('#fu-rt-hit').addEventListener('pointerleave', out);
  svg.addEventListener('click', (e) => { const k = e.target.closest('[data-k]'); if (k) P.pick(k.dataset.k); });
  svg.addEventListener('focus', () => hover(hx));
  svg.addEventListener('blur', out);
  svg.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -0.5, ArrowRight: 0.5 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    hover(hx + step);
  });
  draw();
}
