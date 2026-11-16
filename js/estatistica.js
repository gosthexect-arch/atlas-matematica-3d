// Chapter 6 · Estatística e probabilidade (14:40–18:14). The channel audience as a waffle, a 3D seesaw lab where the
// mean is the balance point (mode and median marked, ±1σ band on the floor), the mode of a stock chart, the squares
// behind the standard deviation, a 3D coin and jar whose frequencies converge on a live chart, and a log ladder from
// a coin toss to quantum tunnelling. Charts follow the dataviz method: validated series steps per theme (see tokens),
// thin marks, hairline grids, text in ink tokens, legends, hover/focus tooltips and a table view for each chart.
import { THREE, mount, el, css, vlink, vlinks, stage, slider, segmented, onTheme, reduced, tween, br } from './core.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const root = mount('estatistica');
const S = '#estatistica';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (v, d = 2) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: d });
const int = (v) => Math.round(v).toLocaleString('pt-BR');
const money = (v) => `R$ ${br(v, 2)}`;

/* ------------------------------------------------------------------ statistics + self-checks ------ */
const sum = (a) => a.reduce((s, v) => s + v, 0);
const mean = (a) => sum(a) / a.length;
const sorted = (a) => [...a].sort((x, y) => x - y);
function median(a) {
  const s = sorted(a), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
/** population standard deviation (divides by n), as in the video's grade example */
function sd(a) {
  const m = mean(a);
  return Math.sqrt(sum(a.map((v) => (v - m) ** 2)) / a.length);
}
/** every value with the top frequency; [] when all distinct values tie (no mode) */
function modes(a) {
  const c = new Map();
  a.forEach((v) => c.set(v, (c.get(v) || 0) + 1));
  const max = Math.max(...c.values());
  const ms = [...c].filter(([, k]) => k === max).map(([v]) => v).sort((x, y) => x - y);
  return ms.length === c.size && c.size > 1 ? [] : ms;
}
function comb(n, k) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}
const COMBOS = comb(60, 6);
const MEGA = 1 / COMBOS;
/** k different simple bets cover k of the combinations */
const megaK = (k) => Math.min(1, k * MEGA);

const NOTAS = [4, 4, 5, 8];
console.assert(mean(NOTAS) === 5.25 && sum(NOTAS) === 21, 'média das notas = 21 ÷ 4 = 5,25');
console.assert(median(NOTAS) === 4.5 && modes(NOTAS).join() === '4', 'notas: mediana 4,5 e moda 4');
console.assert(Math.abs(sd(NOTAS) - 1.63936) < 1e-5, 'σ populacional das notas ≈ 1,64');
console.assert(median([7, 2, 9, 4, 6]) === 6 && median([7, 2, 9, 4, 6, 3]) === 5, 'mediana ímpar e par');
console.assert(modes([1, 2, 3]).length === 0 && modes([4, 4, 5, 5]).length === 0 && modes([4, 4, 5, 5, 6]).join() === '4,5', 'amodal (todos empatam) e bimodal');
console.assert(COMBOS === 50063860 && Math.abs(megaK(1) - MEGA) < 1e-20 && megaK(COMBOS) === 1, 'Mega-Sena: 1 em 50.063.860');
console.assert(Math.abs(Math.log2(1 / MEGA) - 25.577) < 1e-3, 'Mega-Sena ≈ 25,6 caras seguidas');

/* ------------------------------------------------------------------ styles ------ */
css(`
${S} { --es-s1: hsl(2 62% 40%); --es-s2: hsl(210 62% 40%); --es-gray: color-mix(in srgb, var(--muted) 30%, var(--surface)); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) ${S} { --es-s1: hsl(2 72% 62%); --es-s2: hsl(210 72% 58%); } }
:root[data-theme="dark"] ${S} { --es-s1: hsl(2 72% 62%); --es-s2: hsl(210 72% 58%); }
${S} [hidden] { display: none !important; }
${S} .explain h4 { font: 700 1.02rem/1.2 var(--f-display); margin-top: 4px; }
${S} .es-svg text { font: 500 11px/1 var(--f-mono); fill: var(--muted); }
${S} .es-svg .ink { fill: var(--ink); }
${S} .es-svg .t13 { font: 500 13px/1.2 var(--f-body); }
${S} .es-svg .t12 { font: 500 12px/1.2 var(--f-body); }
${S} .es-svg .big { font: 700 42px/1 var(--f-body); fill: var(--ink); }
${S} .es-svg .mid { font: 700 20px/1 var(--f-body); fill: var(--ink); }
${S} .es-svg .grid { stroke: var(--line); stroke-width: 1; }
${S} .es-svg .axis { stroke: color-mix(in srgb, var(--ink) 40%, transparent); stroke-width: 1; }
${S} .es-svg .ref { stroke: var(--muted); stroke-width: 1; stroke-dasharray: 4 4; fill: none; }
${S} .es-svg .cross { stroke: var(--muted); stroke-width: 1; }
${S} .es-svg .f1 { fill: var(--es-s1); }
${S} .es-svg .f2 { fill: var(--es-s2); }
${S} .es-svg .fg { fill: var(--es-gray); }
${S} .es-svg .wash1 { fill: var(--es-s1); opacity: .13; }
${S} .es-svg .l1 { fill: none; stroke: var(--es-s1); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
${S} .es-svg .l2 { fill: none; stroke: var(--es-s2); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
${S} .es-svg .lk { fill: none; stroke: var(--ink); stroke-width: 1.5; }
${S} .es-svg .ring { stroke: var(--surface); stroke-width: 2; }
${S} .es-svg .hit { fill: transparent; }
${S} .es-svg .bar { transition: fill .25s; }
${S} .es-svg .hot .bar, ${S} .es-svg .bar.hot { stroke: var(--ink); stroke-width: 1.5; }
${S} .es-svg [tabindex]:focus { outline: none; }
${S} .es-svg g[tabindex]:focus-visible .bar { stroke: var(--accent); stroke-width: 2.5; }
${S} svg.es-svg:focus-visible { outline: 2px solid var(--accent); outline-offset: -3px; }
${S} .es-cell { transition: fill .55s cubic-bezier(.4, 0, .2, 1); transition-delay: var(--d, 0ms); }
${S} .es-tip { position: absolute; z-index: 4; pointer-events: none; display: grid; gap: 2px; padding: 6px 10px; border-radius: 8px;
  border: 1px solid var(--line); background: var(--surface); box-shadow: var(--shadow); font-size: 12px; color: var(--muted);
  white-space: nowrap; transform: translate(-50%, calc(-100% - 12px)); }
${S} .es-tip b { font: 600 14px/1.25 var(--f-body); color: var(--ink); }
${S} .es-tip .k { display: inline-block; width: 12px; height: 2px; border-radius: 1px; margin-right: 6px; vertical-align: 4px; }
${S} .k1 { background: var(--es-s1); } ${S} .k2 { background: var(--es-s2); } ${S} .kg { background: var(--es-gray); }
${S} .kink { background: var(--ink); } ${S} .kwash { background: color-mix(in srgb, var(--ink) 18%, transparent); }
${S} .es-leg { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 13px; color: var(--ink); }
${S} .es-leg span { display: inline-flex; align-items: center; gap: 7px; }
${S} .es-leg i { width: 10px; height: 10px; border-radius: 2px; flex: none; }
${S} .es-leg i.ln { width: 16px; height: 2px; border-radius: 1px; }
${S} .es-leg i.dash { width: 16px; height: 0; border-radius: 0; background: none; border-top: 1px dashed var(--muted); }
${S} details.es-tv summary { cursor: pointer; font-size: 13px; color: var(--muted); width: fit-content; }
${S} details.es-tv[open] summary { margin-bottom: 8px; }
${S} details.es-tv > div { overflow-x: auto; max-width: 100%; }
${S} table.es-t { width: 100%; border-collapse: collapse; font-size: 13px; }
${S} table.es-t caption { text-align: left; font-size: 12px; color: var(--muted); padding-bottom: 4px; }
${S} table.es-t th, ${S} table.es-t td { text-align: left; padding: 5px 8px; border-bottom: 1px solid var(--line); }
${S} table.es-t th { font-weight: 600; color: var(--muted); font-size: 12px; }
${S} table.es-t .n { text-align: right; font: 500 13px/1.3 var(--f-mono); font-variant-numeric: tabular-nums; }
${S} table.es-t tfoot td { font-weight: 600; border-bottom: 0; }
${S} table.es-t tr.on td { background: var(--hue-soft); }
${S} .es-add { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
${S} .es-add .btn.sm { min-width: 34px; justify-content: center; padding-inline: 8px; font-family: var(--f-mono); }
${S} .es-rol { display: grid; gap: 6px; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface); }
${S} .es-rol-row { display: grid; grid-template-columns: 5.6em minmax(0, 1fr); gap: 8px; align-items: center; font-size: 13px; }
${S} .es-rol-k { color: var(--muted); }
${S} .es-chips { display: flex; flex-wrap: wrap; gap: 4px; }
${S} .es-chips b { min-width: 24px; padding: 3px 5px; text-align: center; border: 1px solid var(--line); border-radius: 5px;
  font: 600 12px/1 var(--f-mono); font-variant-numeric: tabular-nums; }
${S} .es-chips b.mid { background: var(--es-s2); border-color: var(--es-s2); color: var(--surface); }
${S} .es-chips b.mo { box-shadow: inset 0 -3px 0 var(--es-s1); }
${S} .es-chips .muted { font-size: 12px; }
${S} .lbl.es-num { background: none; border: 0; padding: 0; color: var(--muted); font-size: 11px; }
${S} .lbl.es-res { font: 700 13px/1 var(--f-body); letter-spacing: .06em; }
${S} .lbl.es-res:empty { display: none; }
${S} .es-picks { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
${S} .es-picks .seg-label { font-size: 13px; color: var(--muted); }
${S} .es-gauge { display: grid; gap: 4px; }
`);

/* ------------------------------------------------------------------ shared helpers ------ */
/** pointer/focus tooltip inside a positioned host. rows: [[value, label, keyClass?]] (text only, via textContent) */
function makeTip(host) {
  const tip = document.createElement('div');
  tip.className = 'es-tip';
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
const centerOf = (node) => { const r = node.getBoundingClientRect(); return [r.left + r.width / 2, r.top]; };
/** horizontal bar path: square at the baseline (left), 4px rounded data-end (right) */
function hbar(x, y, w, h, r = 4) {
  if (w <= 0) return '';
  r = Math.min(r, h / 2, w);
  return `M${x} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x}Z`;
}
function pickInto(node, title, body, links) {
  node.hidden = false;
  node.innerHTML = `<h4>${title}</h4><p>${body}</p>${vlinks(links)}`;
}
/** themed materials for one stage: colors re-read on every light/dark switch */
function themer(s) {
  const list = [];
  const c = (tok) => new THREE.Color(s.color(tok));
  const mix = (a, b, t) => c(a).lerp(c(b), t);
  const tm = (fn, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, ...extra });
    m.color.copy(fn());
    list.push([m, fn]);
    return m;
  };
  onTheme(() => list.forEach(([m, fn]) => m.color.copy(fn())));
  return { c, mix, tm };
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
function hotGroup() {
  const items = [];
  return {
    add(o) { items.push(o); return o; },
    on(o) { items.forEach((x) => x.element.classList.toggle('on', x === o)); },
  };
}

/* ================================================================== 1 · dados que ajudam a decidir ====== */
const t1 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage" id="es-publico"></div>
    <p class="stage-cap" id="es-pub-cap"></p>
    <div class="es-leg" id="es-pub-leg"></div>
    <div class="controls" id="es-pub-ctl"></div>
    <details class="es-tv"><summary>Ver como tabela</summary><div id="es-pub-table"></div></details>
  </div>
  <div class="explain">
    <p class="kicker">O que é estatística · 14:40 – 15:19</p>
    <h3>Dados que ajudam a decidir</h3>
    <p>O vídeo abre com uma provocação: a estatística é aquilo que te faz votar em candidatos que não prestam, em sua maioria.</p>
    ${vlink(880, 'A piada de abertura sobre candidatos')}
    <p>A definição séria vem em seguida. Estatística é o ramo da matemática que usa teorias probabilísticas para auxiliar a tomada de decisão.</p>
    <div class="formula"><small>o caminho da estatística</small>dados → interpretação → decisão</div>
    <p>Primeiro exemplo: cerca de 90% do público do canal é masculino, e a maior parte está entre 18 e 24 anos. Com esse dado, o autor escolhe uma linguagem mais apropriada para esse público.</p>
    <p>Segundo exemplo: no período eleitoral, as pesquisas de intenção de voto influenciam milhares de pessoas a votar nos candidatos com mais chance de ganhar. As decisões são influenciadas por dados estatísticos.</p>
    ${vlinks([[885, 'Definição: teorias probabilísticas para decidir'], [891, 'O público do canal: cerca de 90% masculino, 18 a 24 anos'], [904, 'Pesquisas de intenção de voto influenciam eleitores'], [914, 'Decisões influenciadas por dados estatísticos']])}
  </div>
</article>`);
root.append(t1);

{
  const host = t1.querySelector('#es-publico');
  const AX = (a) => 20 + (a - 10) * (370 / 60);
  let cells = '';
  for (let i = 0; i < 100; i++) {
    cells += `<rect class="es-cell fg" data-c="fg" data-i="${i}" x="${20 + (i % 10) * 20}" y="${40 + Math.floor(i / 10) * 20}" width="17" height="17" rx="3"/>`;
  }
  let ticks = '';
  for (let a = 10; a <= 70; a += 10) {
    ticks += `<line class="axis" x1="${AX(a)}" x2="${AX(a)}" y1="270" y2="274"/><text x="${AX(a)}" y="288" text-anchor="middle">${a}</text>`;
  }
  host.innerHTML = `
  <svg class="es-svg" viewBox="0 0 400 300" role="img" aria-labelledby="es-pub-title">
    <title id="es-pub-title">Gráfico de 100 quadrados com o público do canal ou uma ilustração de eleitores</title>
    <text x="20" y="26" id="es-pub-unit">1 quadrado = 1% do público</text>
    <g id="es-cells">${cells}</g>
    <g id="es-side-canal">
      <text class="big" x="234" y="100">≈ 90%</text>
      <text class="t13 ink" x="234" y="124">do público do canal</text>
      <text class="t13 ink" x="234" y="142">é masculino</text>
      <text class="t12" x="234" y="178">Dado citado no vídeo,</text>
      <text class="t12" x="234" y="194">sem mais detalhes.</text>
    </g>
    <g id="es-side-voto" style="display:none">
      <text class="t13 ink" x="234" y="58">Cada quadrado é um</text>
      <text class="t13 ink" x="234" y="76">eleitor imaginário.</text>
      <text class="mid" x="234" y="118" id="es-voto-when">Antes da pesquisa</text>
      <text class="t12" x="234" y="150" id="es-voto-l1">Indecisos ainda</text>
      <text class="t12" x="234" y="166" id="es-voto-l2">não escolheram.</text>
      <text class="t12" x="234" y="226">Ilustração, sem dados reais.</text>
    </g>
    <g id="es-age">
      <rect class="f1" x="${AX(18)}" y="256" width="${AX(24) - AX(18)}" height="14" rx="2" opacity=".26"/>
      <rect class="f1" x="${AX(18)}" y="267" width="${AX(24) - AX(18)}" height="3"/>
      <line class="axis" x1="20" x2="390" y1="270" y2="270"/>
      ${ticks}
      <text class="t13 ink" x="${AX(18)}" y="249">a maior parte: 18 a 24 anos</text>
      <text x="390" y="249" text-anchor="end">idade, em anos</text>
    </g>
  </svg>`;
  const svg = host.querySelector('svg');
  const cellEls = [...svg.querySelectorAll('.es-cell')];
  const tip = makeTip(host);
  const cap = t1.querySelector('#es-pub-cap');
  const leg = t1.querySelector('#es-pub-leg');
  const table = t1.querySelector('#es-pub-table');

  const CANAL = (i) => (i < 90 ? 'f1' : 'fg');
  // gray cells are the undecided; after the poll most of them join the leader, a few the other candidate
  const VOTO = [(i) => (i < 38 ? 'f1' : i < 70 ? 'fg' : 'f2'), (i) => (i < 60 ? 'f1' : i < 64 ? 'fg' : 'f2')];
  const NAMES = {
    canal: { f1: ['≈ 90% do público', 'masculino'], fg: ['≈ 10% do público', 'outros'] },
    voto: { f1: ['Lidera a pesquisa', 'eleitor imaginário'], f2: ['Outro candidato', 'eleitor imaginário'], fg: ['Indeciso', 'eleitor imaginário'] },
  };
  let mode = 'canal', after = false, shown = false;
  const want = (i) => (mode === 'canal' ? CANAL(i) : VOTO[after ? 1 : 0](i));
  function paint(stagger) {
    let k = 0;
    cellEls.forEach((c, i) => {
      const w = want(i);
      if (c.dataset.c === w) return;
      c.style.setProperty('--d', `${stagger && !reduced ? k++ * 16 : 0}ms`);
      c.classList.remove('f1', 'f2', 'fg');
      c.classList.add(w);
      c.dataset.c = w;
    });
  }
  const count = (fn) => { const o = { f1: 0, f2: 0, fg: 0 }; for (let i = 0; i < 100; i++) o[fn(i)]++; return o; };
  const b4 = count(VOTO[0]), af = count(VOTO[1]);
  console.assert(b4.f1 + b4.f2 + b4.fg === 100 && af.fg < b4.fg && af.f1 > b4.f1 && af.f2 > b4.f2, 'eleitores: só indecisos mudam');

  const ctl = t1.querySelector('#es-pub-ctl');
  const segEx = segmented({ label: 'Exemplo', options: [{ value: 'canal', label: 'O público do canal' }, { value: 'voto', label: 'A pesquisa eleitoral' }], value: 'canal' });
  const pub = el('<button type="button" class="btn sm" aria-pressed="false" hidden>Publicar a pesquisa</button>');
  ctl.append(segEx.el, pub);

  function setMode() {
    const canal = mode === 'canal';
    svg.querySelector('#es-side-canal').style.display = canal ? '' : 'none';
    svg.querySelector('#es-age').style.display = canal ? '' : 'none';
    svg.querySelector('#es-side-voto').style.display = canal ? 'none' : '';
    svg.querySelector('#es-pub-unit').textContent = canal ? '1 quadrado = 1% do público' : '100 eleitores imaginários';
    svg.querySelector('#es-voto-when').textContent = after ? 'Depois da pesquisa' : 'Antes da pesquisa';
    svg.querySelector('#es-voto-l1').textContent = after ? 'Indecisos migram para' : 'Indecisos ainda';
    svg.querySelector('#es-voto-l2').textContent = after ? 'quem parece que vai ganhar.' : 'não escolheram.';
    pub.hidden = canal;
    pub.textContent = after ? 'Voltar para antes' : 'Publicar a pesquisa';
    pub.setAttribute('aria-pressed', String(after));
    cap.textContent = canal
      ? 'Cada quadrado vale 1% do público. O vídeo dá dois dados: cerca de 90% masculino e a maior parte entre 18 e 24 anos. A régua marca a faixa sem inventar a distribuição.'
      : 'Ilustração com 100 eleitores imaginários. Ao publicar a pesquisa, parte dos indecisos passa a votar em quem aparece na frente.';
    leg.innerHTML = canal
      ? '<span><i class="k1"></i>Masculino</span><span><i class="kg"></i>Outros</span>'
      : '<span><i class="k1"></i>Candidato que lidera</span><span><i class="k2"></i>Outro candidato</span><span><i class="kg"></i>Indecisos</span>';
    table.innerHTML = canal
      ? `<table class="es-t"><caption>Público do canal, segundo o vídeo</caption><thead><tr><th>Grupo</th><th class="n">Parcela</th></tr></thead>
         <tbody><tr><td>Masculino</td><td class="n">≈ 90%</td></tr><tr><td>Outros</td><td class="n">≈ 10%</td></tr>
         <tr><td>Faixa etária com mais público</td><td class="n">18 a 24 anos</td></tr></tbody></table>`
      : `<table class="es-t"><caption>Ilustração: 100 eleitores imaginários</caption><thead><tr><th>Grupo</th><th class="n">Antes</th><th class="n">Depois</th></tr></thead>
         <tbody><tr><td>Candidato que lidera</td><td class="n">${b4.f1}</td><td class="n">${af.f1}</td></tr>
         <tr><td>Outro candidato</td><td class="n">${b4.f2}</td><td class="n">${af.f2}</td></tr>
         <tr><td>Indecisos</td><td class="n">${b4.fg}</td><td class="n">${af.fg}</td></tr></tbody></table>`;
    if (shown) paint(true);
  }
  segEx.on((v) => { mode = v; after = false; setMode(); });
  pub.addEventListener('click', () => { after = !after; setMode(); });
  setMode();

  svg.addEventListener('pointermove', (e) => {
    const c = e.target.closest('.es-cell');
    if (!c) { tip.hide(); return; }
    const [v, l] = NAMES[mode][c.dataset.c] || NAMES.voto.fg;
    tip.show(e.clientX, e.clientY, [[v, l, { f1: 'k1', f2: 'k2', fg: 'kg' }[c.dataset.c]]]);
  });
  svg.addEventListener('pointerleave', () => tip.hide());
  // the waffle fills in as a wave the first time it scrolls into view
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    shown = true;
    paint(true);
    io.disconnect();
  }, { threshold: 0.3 }).observe(host);
}

/* ================================================================== 2 · laboratório: moda, média, mediana (3D) ====== */
const PRESETS = [
  { value: 'notas', label: 'Notas 4 · 4 · 5 · 8', data: [4, 4, 5, 8] },
  { value: 'm2', label: 'Moda 2', data: [2, 5, 1, 2, 3, 2, 6] },
  { value: 'm4', label: 'Moda 4', data: [4, 7, 2, 4, 6, 3, 4] },
  { value: 'm5', label: 'Moda 5', data: [5, 8, 3, 5, 9, 5, 7, 5] },
  { value: 'impar', label: 'Rol ímpar', data: [7, 2, 9, 4, 6] },
  { value: 'par', label: 'Rol par', data: [7, 2, 9, 4, 6, 3] },
];
console.assert(modes(PRESETS[1].data).join() === '2' && modes(PRESETS[2].data).join() === '4' && modes(PRESETS[3].data).join() === '5', 'presets de moda');

const t2 = el(`
<article class="topic flip">
  <div class="stage-col">
    <div class="stage" id="es-lab"></div>
    <p class="stage-cap">Cada cubo é uma observação, empilhada sobre o seu valor. O apoio <span class="math">x̄</span> corre até a média e a gangorra se equilibra. <b>Mo</b> marca a moda, <b>Md</b> a mediana, e a faixa no chão cobre a média ± 1 desvio padrão.</p>
    <div class="es-leg"><span><i class="k1"></i>Moda (Mo)</span><span><i class="kg"></i>Demais valores</span><span><i class="kink"></i>Apoio na média (x̄)</span><span><i class="k2"></i>Mediana (Md)</span><span><i class="kwash"></i>Média ± σ</span></div>
    <div class="controls" id="es-lab-ctl">
      <div class="es-add" role="group" aria-label="Adicionar uma observação"><span class="seg-label">Adicionar</span></div>
      <div class="btn-row"><button type="button" class="btn sm" id="es-lab-pop">Remover o último</button><button type="button" class="btn sm" id="es-lab-clear">Limpar</button></div>
      <p class="readout muted" id="es-lab-msg" aria-live="polite"></p>
    </div>
    <div class="stats" aria-live="polite">
      <div class="stat"><b id="es-st-n">4</b><span>observações (n)</span></div>
      <div class="stat"><b id="es-st-mo">4</b><span>moda (Mo)</span></div>
      <div class="stat"><b id="es-st-me">5,25</b><span>média (x̄)</span></div>
      <div class="stat"><b id="es-st-md">4,5</b><span>mediana (Md)</span></div>
      <div class="stat"><b id="es-st-sd">1,64</b><span>desvio padrão (σ)</span></div>
    </div>
    <div class="es-rol">
      <div class="es-rol-row"><span class="es-rol-k">chegada</span><span class="es-chips" id="es-rol-in"></span></div>
      <div class="es-rol-row"><span class="es-rol-k">rol</span><span class="es-chips" id="es-rol-out"></span></div>
      <p class="readout" id="es-rol-calc"></p>
      <p class="readout" id="es-mean-calc"></p>
    </div>
  </div>
  <div class="explain">
    <p class="kicker">Medidas de posição · 15:14 – 16:31</p>
    <h3>Moda, média e mediana numa gangorra</h3>
    <p>Uma das primeiras coisas que se aprende em estatística são as medidas de posição. Empilhe valores de 1 a 10 e veja as três mudarem ao vivo.</p>
    ${vlink(914, 'Medidas de posição: moda, média e mediana')}
    <h4>Moda</h4>
    <p>É o elemento mais frequente de um conjunto de dados. Use os botões “Moda 2”, “Moda 4” e “Moda 5” para repetir os exemplos. Um conjunto pode ter duas modas, ou nenhuma, quando todos os valores aparecem o mesmo número de vezes.</p>
    ${vlinks([[922, 'Moda: aqui o 2 é o que mais aparece'], [929, 'Agora a moda é 4, depois 5']])}
    <h4>Média</h4>
    <p>É a razão entre a soma dos elementos e o número total de observações. Notas 4 em aritmética, 4 em álgebra, 5 em geometria e 8 em estatística somam 21. Dividindo por 4 disciplinas, a média geral é 5,25.</p>
    <div class="formula"><i>x̄</i> = <span class="frac"><span><i>x</i><sub>1</sub> + <i>x</i><sub>2</sub> + … + <i>x<sub>n</sub></i></span><span><i>n</i></span></span> = <span class="frac"><span>4 + 4 + 5 + 8</span><span>4</span></span> = <span class="frac"><span>21</span><span>4</span></span> = 5,25</div>
    ${vlinks([[953, 'Média: soma dividida pelo total de observações'], [955, 'Notas 4, 4, 5 e 8: média 5,25']])}
    <h4>Mediana</h4>
    <p>É o elemento central. Primeiro coloque tudo em ordem crescente, o rol. Com quantidade ímpar, a mediana é o elemento que divide o rol em duas partes iguais. Com quantidade par, some os dois centrais e divida por 2.</p>
    ${vlinks([[968, 'Mediana: o elemento central'], [974, 'Ponha em ordem crescente para não se perder'], [986, 'Quantidade par: média dos dois centrais']])}
    <p class="note fact">A gangorra só equilibra na média porque as distâncias até ela somam zero: Σ(<i>x<sub>i</sub></i> − <i>x̄</i>) = 0. Os cubos à esquerda puxam exatamente tanto quanto os da direita.</p>
    <div class="es-picks" role="group" aria-label="Detalhar uma medida"><span class="seg-label">Detalhar</span>
      <button type="button" class="btn sm" data-k="moda">Mo</button><button type="button" class="btn sm" data-k="media">x̄</button>
      <button type="button" class="btn sm" data-k="mediana">Md</button><button type="button" class="btn sm" data-k="sigma">σ</button></div>
    <div class="pick" id="es-lab-pick" aria-live="polite" hidden></div>
  </div>
</article>`);
root.append(t2);

{
  const MAXC = 7, STEP = 0.52, CUBE = 0.44, GAP = 0.465;
  const X = (v) => (v - 5.5) * STEP;
  const yC = (i) => 0.12 + CUBE / 2 + i * GAP;
  let data = PRESETS[0].data.slice();
  const $ = (id) => t2.querySelector(id);
  const pickEl = $('#es-lab-pick');
  const msg = $('#es-lab-msg');

  const segP = segmented({ label: 'Exemplos', options: PRESETS.map(({ value, label }) => ({ value, label })), value: 'notas' });
  $('#es-lab-ctl').prepend(segP.el);
  const addRow = $('.es-add');
  for (let v = 1; v <= 10; v++) addRow.append(el(`<button type="button" class="btn sm" data-v="${v}" aria-label="Adicionar o valor ${v}">${v}</button>`));

  const modeText = (ms) => (ms.length === 0 ? 'não há' : ms.map((v) => num(v)).join(' e '));
  const PICKS = {
    moda: () => {
      const ms = data.length ? modes(data) : [];
      return ['Moda (Mo)', `O valor que mais aparece. ${!data.length ? 'Sem dados ainda.' : ms.length === 0 ? 'Aqui todos aparecem o mesmo número de vezes, então não há moda.' : ms.length > 1 ? `Aqui há empate: ${modeText(ms)} (conjunto bimodal ou multimodal).` : `Aqui é ${modeText(ms)}.`}`,
        [[922, 'Moda: aqui o 2 é o que mais aparece'], [929, 'Agora a moda é 4, depois 5']]];
    },
    media: () => ['Média (x̄)', data.length ? `Soma ÷ quantidade: ${num(sum(data))} ÷ ${data.length} = ${num(mean(data), 3)}. É o ponto de equilíbrio da gangorra.` : 'Sem dados ainda.',
      [[953, 'Média: soma dividida pelo total de observações'], [955, 'Notas 4, 4, 5 e 8: média 5,25']]],
    mediana: () => ['Mediana (Md)', data.length ? `No rol de ${data.length} valores, ${data.length % 2 ? 'o elemento do meio' : 'a média dos dois centrais'} dá ${num(median(data))}.` : 'Sem dados ainda.',
      [[968, 'Mediana: o elemento central'], [974, 'Ordem crescente primeiro'], [986, 'Quantidade par: média dos dois centrais']]],
    sigma: () => ['Desvio padrão (σ)', data.length > 1 ? `A faixa no chão vai de x̄ − σ a x̄ + σ: de ${num(mean(data) - sd(data))} a ${num(mean(data) + sd(data))}. Quanto mais espalhados os cubos, mais larga ela fica.` : 'Com uma observação só, não há o que espalhar: σ = 0.',
      [[991, 'Desvio padrão: o quanto os valores fogem da média']]],
  };
  let pickKey = null, view = null;
  function pick(k) {
    pickKey = k;
    const [title, body, links] = PICKS[k]();
    pickInto(pickEl, title, body, links);
    t2.querySelectorAll('.es-picks button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
    if (view) view.hot(k);
  }
  t2.querySelector('.es-picks').addEventListener('click', (e) => { const b = e.target.closest('button[data-k]'); if (b) pick(b.dataset.k); });

  function stats() {
    const n = data.length;
    const ms = n ? modes(data) : [];
    $('#es-st-n').textContent = n;
    $('#es-st-mo').textContent = n ? modeText(ms) : '—';
    $('#es-st-me').textContent = n ? num(mean(data)) : '—';
    $('#es-st-md').textContent = n ? num(median(data)) : '—';
    $('#es-st-sd').textContent = n ? num(sd(data)) : '—';
    const srt = sorted(data);
    const mid = n % 2 ? [n >> 1] : [n / 2 - 1, n / 2];
    $('#es-rol-in').innerHTML = n ? data.map((v) => `<b${ms.includes(v) ? ' class="mo"' : ''}>${v}</b>`).join('') : '<span class="muted">vazio: adicione valores</span>';
    $('#es-rol-out').innerHTML = n ? srt.map((v, i) => `<b class="${mid.includes(i) ? 'mid' : ''}${ms.includes(v) ? ' mo' : ''}">${v}</b>`).join('') : '<span class="muted">—</span>';
    $('#es-rol-calc').textContent = !n ? '' : n % 2
      ? `n = ${n} é ímpar: a mediana é o ${(n >> 1) + 1}º elemento do rol, ${num(median(data))}.`
      : `n = ${n} é par: mediana = (${srt[n / 2 - 1]} + ${srt[n / 2]}) ÷ 2 = ${num(median(data))}.`;
    $('#es-mean-calc').textContent = !n ? '' : n <= 12
      ? `Média = (${data.join(' + ')}) ÷ ${n} = ${num(sum(data))} ÷ ${n} = ${num(mean(data), 3)}`
      : `Média = soma ÷ n = ${num(sum(data))} ÷ ${n} = ${num(mean(data), 3)}`;
    if (pickKey) pick(pickKey);
  }
  function changed(kind) {
    msg.textContent = '';
    stats();
    if (view) view.sync(kind);
  }
  segP.on((v) => { data = PRESETS.find((p) => p.value === v).data.slice(); changed('reset'); });
  addRow.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    const v = +b.dataset.v;
    if (data.filter((x) => x === v).length >= MAXC) { msg.textContent = `A pilha do ${v} já tem ${MAXC} cubos, o máximo deste modelo.`; return; }
    data.push(v);
    segP.set(null, false);
    changed('add');
  });
  $('#es-lab-pop').addEventListener('click', () => { if (!data.length) return; data.pop(); segP.set(null, false); changed('pop'); });
  $('#es-lab-clear').addEventListener('click', () => { data = []; segP.set(null, false); changed('reset'); });

  lazyStage($('#es-lab'), {
    camera: [0.6, 3.1, 8.4], target: [0, 1.6, 0], fov: 34,
    label: 'Gangorra 3D com pilhas de cubos sobre os valores de 1 a 10, um apoio triangular na média, um pino na mediana e uma faixa de um desvio padrão no chão.',
    hint: 'arraste para girar · clique em Mo, x̄, Md ou σ',
  }, (s) => {
    s.controls.maxPolarAngle = Math.PI * 0.49;
    const { c, mix, tm } = themer(s);
    const baseMat = tm(() => mix('--surface', '--muted', 0.34), { roughness: 0.62 });
    const modeMat = tm(() => c('--es-s1'), { roughness: 0.45 });
    const inkMat = tm(() => c('--ink'), { roughness: 0.5 });
    const mdMat = tm(() => c('--es-s2'), { roughness: 0.45 });
    const beamMat = tm(() => mix('--ink', '--surface', 0.55), { roughness: 0.7 });
    const plateMat = tm(() => mix('--surface', '--ink', 0.07), { roughness: 0.9 });
    const bandMat = tm(() => c('--ink'), { transparent: true, opacity: 0.13, depthWrite: false });

    const plate = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.05, 1.9), plateMat);
    plate.position.y = -0.026;
    s.add(plate);

    const tri = new THREE.Shape();
    tri.moveTo(-0.34, 0); tri.lineTo(0.34, 0); tri.lineTo(0, 0.62); tri.closePath();
    const fulcrum = new THREE.Group();
    const fm = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.7, bevelEnabled: false }).translate(0, 0, -0.35), inkMat);
    fulcrum.add(fm);
    s.add(fulcrum);

    const pivot = new THREE.Group();
    pivot.position.y = 0.62;
    s.add(pivot);
    const inner = new THREE.Group();
    pivot.add(inner);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(10 * STEP + 0.3, 0.12, 0.95), beamMat);
    beam.position.y = 0.06;
    inner.add(beam);
    // value ticks on the beam's front edge
    const tickG = new THREE.BoxGeometry(0.02, 0.122, 0.01);
    for (let v = 1; v <= 10; v++) {
      const tk = new THREE.Mesh(tickG, inkMat);
      tk.position.set(X(v), 0.06, 0.476);
      inner.add(tk);
      s.label(String(v), [X(v), -0.02, 0.56], { parent: inner, cls: 'es-num' });
    }

    const hots = hotGroup();
    const cubeG = new RoundedBoxGeometry(CUBE, CUBE, CUBE, 2, 0.06);
    const cubes = [], moLbl = [];
    for (let v = 1; v <= 10; v++) {
      cubes[v] = [];
      for (let i = 0; i < MAXC; i++) {
        const m = new THREE.Mesh(cubeG, baseMat);
        m.position.set(X(v), yC(i), 0);
        m.visible = false;
        m.userData.tok = 0;
        inner.add(m);
        cubes[v].push(m);
      }
      moLbl[v] = hots.add(s.label('Mo', [X(v), 1, 0], { parent: inner, onClick: () => pick('moda') }));
      moLbl[v].visible = false;
    }

    const mdG = new THREE.Group();
    mdG.position.z = 0.4;
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.92, 10), mdMat);
    pin.position.y = 0.12 + 0.46;
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, 0.016), mdMat);
    flag.position.set(0.12, 0.12 + 0.84, 0);
    mdG.add(pin, flag);
    inner.add(mdG);
    const mdLbl = hots.add(s.label('Md', [0, 1.3, 0], { parent: mdG, onClick: () => pick('mediana') }));
    const meanLbl = hots.add(s.label('x̄', [0, -0.08, 0.62], { parent: fulcrum, cls: 'math', onClick: () => pick('media') }));

    const band = new THREE.Mesh(new THREE.BoxGeometry(1, 0.012, 1.5), bandMat);
    band.position.y = 0.008;
    band.renderOrder = 2;
    s.add(band);
    const sLbl = hots.add(s.label('±σ', [0.5, 0.02, 0.82], { parent: band, onClick: () => pick('sigma') }));

    let pShown = 5.5, wShown = 0, mdShown = 5.5, tilt = 0, tok = 0, curMean = 5.5;
    function drop(m, y, delay) {
      const my = ++m.userData.tok;
      m.visible = false;
      const go = () => {
        if (my !== m.userData.tok) return;
        m.position.y = y + 2.4;
        m.visible = true;
        tween(y + 2.4, y, 560, (v) => { if (my === m.userData.tok) m.position.y = v; });
      };
      if (delay && !reduced) setTimeout(go, delay); else go();
    }
    function sync(kind) {
      const n = data.length;
      const cnt = Array(11).fill(0);
      data.forEach((v) => cnt[v]++);
      const ms = n ? modes(data) : [];
      let k = 0;
      for (let v = 1; v <= 10; v++) {
        for (let i = 0; i < MAXC; i++) {
          const m = cubes[v][i];
          m.material = ms.includes(v) ? modeMat : baseMat;
          if (i < cnt[v]) {
            if (!m.visible || kind === 'reset') drop(m, yC(i), kind === 'reset' ? k++ * 45 : 0);
          } else { m.userData.tok++; m.visible = false; }
        }
        moLbl[v].visible = ms.includes(v);
        moLbl[v].position.y = yC(Math.max(0, cnt[v] - 1)) + 0.46;
      }
      curMean = n ? mean(data) : 5.5;
      const m1 = curMean, w1 = n ? sd(data) : 0, md1 = n ? median(data) : 5.5;
      const p0 = pShown, w0 = wShown, md0 = mdShown, my = ++tok;
      tween(0, 1, 950, (e) => {
        if (my !== tok) return;
        pShown = p0 + (m1 - p0) * e;
        wShown = w0 + (w1 - w0) * e;
        mdShown = md0 + (md1 - md0) * e;
      });
      meanLbl.element.textContent = n ? `x̄ = ${num(m1)}` : 'x̄';
      mdG.visible = mdLbl.visible = n > 0;
      band.visible = sLbl.visible = n > 1;
    }
    s.onFrame((t, dt) => {
      fulcrum.position.x = X(pShown);
      pivot.position.x = X(pShown);
      inner.position.x = -X(pShown);
      // torque per unit mass about the support: the beam leans toward the heavier side until the support reaches x̄
      const target = data.length ? clamp(-(curMean - pShown) * 0.16, -0.2, 0.2) : 0;
      tilt = reduced ? target : tilt + (target - tilt) * Math.min(1, dt * 6);
      pivot.rotation.z = tilt;
      band.position.x = X(pShown);
      band.scale.x = Math.max(0.001, 2 * wShown * STEP);
      mdG.position.x = X(mdShown);
    });
    view = {
      sync,
      hot(k) { hots.on({ moda: moLbl.find((l, v) => v && l.visible), media: meanLbl, mediana: mdLbl, sigma: sLbl }[k] || null); },
    };
    sync('reset');
    if (pickKey) view.hot(pickKey);
  });
  stats();
}

/* ================================================================== 3 · a moda na bolsa ====== */
function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// fictional daily closes: a climb, a long sideways stretch near R$ 24, a spike and a return
const PRICES = (() => {
  const r = rng(11), out = [];
  let p = 20.4;
  for (let d = 0; d < 120; d++) {
    const tg = d < 22 ? 20.4 + d * 0.17 : d < 80 ? 24.2 : d < 94 ? 27.4 : 24.7;
    p += 0.3 * (tg - p) + (r() - 0.5) * 0.8;
    out.push(Math.round(p * 10) / 10);
  }
  return out;
})();

const t3 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage" id="es-bolsa"></div>
    <p class="stage-cap">Série fictícia de 120 pregões, criada para o exemplo. À direita, quantos dias o preço fechou em cada faixa. A faixa mais frequente, a moda, aparece também sobre o gráfico. Passe o mouse ou use as setas do teclado no gráfico.</p>
    <div class="controls" id="es-bolsa-ctl"></div>
    <details class="es-tv"><summary>Ver como tabela</summary><div id="es-bolsa-table"></div></details>
  </div>
  <div class="explain">
    <p class="kicker">Moda na prática · 15:38 – 15:49</p>
    <h3>A moda num gráfico da bolsa</h3>
    <p>Imagine o gráfico de uma ação na bolsa de valores. O ponto em que o preço mais vezes esteve é a moda desse gráfico. Para o investidor, vale entender o que está acontecendo ali: é o patamar onde a ação passou mais tempo.</p>
    ${vlinks([[938, 'Gráfico de uma ação: esse ponto é a moda'], [944, 'Vale a pena o investidor entender o que acontece ali'], [949, 'A importância da moda (não a outra)']])}
    <div class="stats" aria-live="polite">
      <div class="stat"><b id="es-bo-mo">—</b><span>faixa modal</span></div>
      <div class="stat"><b id="es-bo-days">—</b><span>dias nessa faixa</span></div>
    </div>
    <p class="note fact">Preços variam em centavos, então quase nenhum valor exato se repete. Por isso os preços são agrupados em faixas. A faixa mais frequente se chama classe modal. Mude a largura e veja que ela continua perto de R$ 24.</p>
  </div>
</article>`);
root.append(t3);

{
  const host = t3.querySelector('#es-bolsa');
  const L = 54, R = 336, T = 30, B = 318, HL = 350, HR = 468;
  const lo = Math.floor(Math.min(...PRICES) / 2) * 2, hi = Math.ceil(Math.max(...PRICES) / 2) * 2;
  const px = (d) => L + (d / (PRICES.length - 1)) * (R - L);
  const py = (v) => B - ((v - lo) / (hi - lo)) * (B - T);
  let grid = '';
  for (let v = lo; v <= hi; v += 2) grid += `<line class="grid" x1="${L}" x2="${HR}" y1="${py(v)}" y2="${py(v)}"/><text x="${L - 6}" y="${py(v) + 4}" text-anchor="end">${v}</text>`;
  for (const d of [0, 30, 60, 90]) grid += `<line class="axis" x1="${px(d)}" x2="${px(d)}" y1="${B}" y2="${B + 4}"/><text x="${px(d)}" y="${B + 16}" text-anchor="middle">${d}</text>`;
  const linePath = PRICES.map((v, d) => `${d ? 'L' : 'M'}${px(d).toFixed(1)} ${py(v).toFixed(1)}`).join('');
  host.innerHTML = `
  <svg class="es-svg" viewBox="0 0 480 360" role="img" aria-labelledby="es-bo-title" tabindex="0">
    <title id="es-bo-title">Preço fictício de uma ação em 120 dias, com histograma lateral e a faixa modal destacada</title>
    <text x="${L - 6}" y="16" text-anchor="end">R$</text>
    <text x="${R}" y="${B + 32}" text-anchor="end">dia do pregão</text>
    <text x="${HL}" y="16">dias por faixa</text>
    ${grid}
    <line class="axis" x1="${L}" x2="${R}" y1="${B}" y2="${B}"/>
    <line class="axis" x1="${HL}" x2="${HL}" y1="${T}" y2="${B}"/>
    <rect class="wash1" id="es-bo-band" x="${L}" width="${R - L}" y="0" height="0"/>
    <text class="ink" id="es-bo-bandlbl" x="${L + 6}" y="0">faixa modal</text>
    <path class="l1" d="${linePath}"/>
    <g id="es-bo-hist"></g>
    <g id="es-bo-cross" style="display:none">
      <line class="cross" id="es-bo-vl" y1="${T}" y2="${B}"/>
      <circle class="f1 ring" id="es-bo-dot" r="4.5"/>
    </g>
    <rect class="hit" id="es-bo-hit" x="${L}" y="${T}" width="${R - L}" height="${B - T}"/>
  </svg>`;
  const svg = host.querySelector('svg');
  const tip = makeTip(host);
  const hist = svg.querySelector('#es-bo-hist');
  const band = svg.querySelector('#es-bo-band');
  const bandLbl = svg.querySelector('#es-bo-bandlbl');
  const cross = svg.querySelector('#es-bo-cross');
  let bins = [], w = 0.5, b0 = lo, cur = PRICES.length - 1;
  const binOf = (v) => clamp(Math.floor((v - b0) / w + 1e-9), 0, bins.length - 1);
  const range = (k) => `${money(b0 + k * w)} a ${money(b0 + (k + 1) * w)}`;

  function build() {
    const nb = Math.round((hi - lo) / w);
    bins = Array(nb).fill(0);
    b0 = lo;
    PRICES.forEach((v) => bins[binOf(v)]++);
    const max = Math.max(...bins);
    const top = bins.indexOf(max);
    const len = HR - HL - 30;
    hist.innerHTML = bins.map((c, k) => {
      const y1 = py(b0 + (k + 1) * w), y0 = py(b0 + k * w);
      const isMode = c === max;
      return `<g data-k="${k}"><rect class="hit" x="${HL}" y="${y1}" width="${HR - HL}" height="${y0 - y1}"/>` +
        `<path class="bar ${isMode ? 'f1' : 'fg'}" d="${hbar(HL, y1 + 1, (c / max) * len, Math.max(1, y0 - y1 - 2))}"/>` +
        (isMode ? `<text class="ink" x="${HL + (c / max) * len + 5}" y="${(y0 + y1) / 2 + 4}">${c}</text>` : '') + '</g>';
    }).join('');
    band.setAttribute('y', py(b0 + (top + 1) * w));
    band.setAttribute('height', py(b0 + top * w) - py(b0 + (top + 1) * w));
    bandLbl.setAttribute('y', py(b0 + (top + 1) * w) - 5);
    t3.querySelector('#es-bo-mo').textContent = `R$ ${num(b0 + top * w)}–${num(b0 + (top + 1) * w)}`;
    t3.querySelector('#es-bo-days').textContent = max;
    t3.querySelector('#es-bolsa-table').innerHTML = `<table class="es-t"><caption>Dias de fechamento por faixa de preço (série fictícia)</caption>
      <thead><tr><th>Faixa</th><th class="n">Dias</th></tr></thead><tbody>${bins.map((c, k) => (c ? `<tr${c === max ? ' class="on"' : ''}><td>${range(k)}${c === max ? ' · moda' : ''}</td><td class="n">${c}</td></tr>` : '')).join('')}</tbody></table>`;
  }
  function showDay(d, cx, cy) {
    cur = clamp(d, 0, PRICES.length - 1);
    const v = PRICES[cur];
    cross.style.display = '';
    const x = px(cur), y = py(v);
    svg.querySelector('#es-bo-vl').setAttribute('x1', x);
    svg.querySelector('#es-bo-vl').setAttribute('x2', x);
    svg.querySelector('#es-bo-dot').setAttribute('cx', x);
    svg.querySelector('#es-bo-dot').setAttribute('cy', y);
    const k = binOf(v);
    hist.querySelectorAll('.bar').forEach((b, i) => b.classList.toggle('hot', i === k));
    if (cx === undefined) {
      const p = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM());
      cx = p.x; cy = p.y;
    }
    tip.show(cx, cy, [[money(v), `dia ${cur}`, 'k1'], [`${bins[k]} dias`, `na faixa ${range(k)}`]]);
  }
  function hideDay() {
    cross.style.display = 'none';
    hist.querySelectorAll('.bar').forEach((b) => b.classList.remove('hot'));
    tip.hide();
  }
  svg.querySelector('#es-bo-hit').addEventListener('pointermove', (e) => {
    const p = svgPt(svg, e);
    showDay(Math.round(((p.x - L) / (R - L)) * (PRICES.length - 1)), e.clientX, e.clientY);
  });
  svg.querySelector('#es-bo-hit').addEventListener('pointerleave', hideDay);
  hist.addEventListener('pointermove', (e) => {
    const g = e.target.closest('g[data-k]');
    if (!g) return;
    const k = +g.dataset.k;
    hist.querySelectorAll('.bar').forEach((b, i) => b.classList.toggle('hot', i === k));
    tip.show(e.clientX, e.clientY, [[`${bins[k]} dias`, range(k), bins[k] === Math.max(...bins) ? 'k1' : 'kg']]);
  });
  hist.addEventListener('pointerleave', hideDay);
  svg.addEventListener('focus', () => showDay(cur));
  svg.addEventListener('blur', hideDay);
  svg.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, PageDown: -10, PageUp: 10, Home: -999, End: 999 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    showDay(cur + step);
  });
  const segW = segmented({ label: 'Largura da faixa', options: [{ value: 0.5, label: 'R$ 0,50' }, { value: 1, label: 'R$ 1,00' }, { value: 2, label: 'R$ 2,00' }], value: 0.5 });
  t3.querySelector('#es-bolsa-ctl').append(segW.el);
  segW.on((v) => { w = v; build(); hideDay(); });
  build();
}

/* ================================================================== 4 · desvio padrão das notas ====== */
const SUBJ = [
  { n: 'Aritmética', s: 'Arit.', v: 4, h: 210 },
  { n: 'Álgebra', s: 'Álg.', v: 4, h: 268 },
  { n: 'Geometria', s: 'Geom.', v: 5, h: 152 },
  { n: 'Estatística', s: 'Estat.', v: 8, h: 2 },
];
const t4 = el(`
<article class="topic flip">
  <div class="stage-col">
    <div class="stage" id="es-desvio"></div>
    <p class="stage-cap">Em cima, cada nota e a sua distância até a média. Embaixo, essas distâncias viram quadrados: a área de cada um é o desvio ao quadrado. O desvio padrão é o lado do quadrado médio.</p>
    <div class="controls" id="es-dv-ctl"></div>
  </div>
  <div class="explain">
    <p class="kicker">Desvio padrão · 16:31 – 17:02</p>
    <h3>O quanto as notas fogem da média</h3>
    <p>O desvio padrão mede o quanto os valores estão distantes da média, ou seja, o quanto eles fogem do padrão. Nas notas do vídeo, a de estatística (8) é a que mais se distancia da média 5,25. A de geometria (5) é a que fica mais pertinho.</p>
    ${vlinks([[991, 'Desvio padrão: distância dos valores até a média'], [1004, 'A nota de estatística é a que mais se distancia'], [1010, 'Geometria fica pertinho da média']])}
    <div class="formula"><small>a fórmula original, “boa sorte com isso”</small><i>σ</i> = √<span class="frac"><span>Σ (<i>x<sub>i</sub></i> − <i>x̄</i>)²</span><span><i>n</i></span></span></div>
    ${vlink(1017, 'A fórmula do desvio padrão: boa sorte com isso')}
    <div id="es-dv-table"></div>
    <p class="readout" id="es-dv-calc" aria-live="polite"></p>
    <p class="note">Um detalhe: o desvio padrão é um número só, do conjunto inteiro. Cada nota tem o seu desvio em relação à média, <i>x<sub>i</sub></i> − <i>x̄</i>. A nota de estatística é a que mais pesa no resultado.</p>
    <p class="note fact">Aqui a soma é dividida por <i>n</i> = 4, o desvio padrão populacional: ≈ 1,64. Quando os dados são uma amostra de algo maior, costuma-se dividir por <i>n</i> − 1, o que daria ≈ 1,89.</p>
  </div>
</article>`);
root.append(t4);

{
  const host = t4.querySelector('#es-desvio');
  const AX0 = 128, AX1 = 462, ROW = [56, 92, 128, 164], AXY = 186;
  const ax = (v) => AX0 + (v / 10) * (AX1 - AX0);
  let g = '';
  for (let v = 0; v <= 10; v++) g += `<line class="grid" x1="${ax(v)}" x2="${ax(v)}" y1="38" y2="${AXY}"/><text x="${ax(v)}" y="${AXY + 15}" text-anchor="middle">${v}</text>`;
  host.innerHTML = `
  <svg class="es-svg" viewBox="0 0 480 360" role="img" aria-labelledby="es-dv-title">
    <title id="es-dv-title">Notas de quatro disciplinas, a média e os quadrados dos desvios</title>
    ${g}
    <line class="axis" x1="${AX0}" x2="${AX1}" y1="${AXY}" y2="${AXY}"/>
    <line class="lk" id="es-dv-mean" y1="34" y2="${AXY}"/>
    <text class="ink" id="es-dv-meanlbl" y="26" text-anchor="middle"></text>
    ${SUBJ.map((x, i) => `<text class="t12 ink" x="12" y="${ROW[i] + 4}">${x.n}</text><g data-i="${i}" class="es-dv-row">
      <line class="l1" id="es-dv-seg${i}" y1="${ROW[i]}" y2="${ROW[i]}"/><circle class="hit" id="es-dv-hit${i}" cy="${ROW[i]}" r="13"/>
      <circle class="f1 ring" id="es-dv-dot${i}" cy="${ROW[i]}" r="6"/><text class="ink" id="es-dv-txt${i}" y="${ROW[i] - 9}"></text></g>`).join('')}
    <text class="t12" x="12" y="232">Quadrados dos desvios · área = (<tspan font-style="italic">x</tspan> − x̄)²</text>
    <g id="es-dv-sq"></g>
  </svg>`;
  const svg = host.querySelector('svg');
  const tip = makeTip(host);
  const ctl = t4.querySelector('#es-dv-ctl');
  const sliders = SUBJ.map((x, i) => {
    const sl = slider({ id: `es-dv-${i}`, label: x.n, min: 0, max: 10, step: 0.5, value: x.v, format: (v) => num(v, 1) });
    ctl.append(sl.el);
    sl.on((v) => { SUBJ[i].v = v; draw(); });
    return sl;
  });
  const reset = el('<div class="btn-row"><button type="button" class="btn sm">Voltar às notas do vídeo: 4, 4, 5 e 8</button></div>');
  reset.querySelector('button').addEventListener('click', () => { [4, 4, 5, 8].forEach((v, i) => { sliders[i].value = v; }); });
  ctl.append(reset);

  function draw() {
    const vals = SUBJ.map((x) => x.v);
    const m = mean(vals), sig = sd(vals);
    const dev = vals.map((v) => v - m);
    const ad = dev.map(Math.abs);
    const far = ad.indexOf(Math.max(...ad)), near = ad.indexOf(Math.min(...ad));
    const spread = Math.max(...ad) > 1e-9;
    svg.querySelector('#es-dv-mean').setAttribute('x1', ax(m));
    svg.querySelector('#es-dv-mean').setAttribute('x2', ax(m));
    const ml = svg.querySelector('#es-dv-meanlbl');
    ml.setAttribute('x', clamp(ax(m), AX0 + 30, AX1 - 30));
    ml.textContent = `x̄ = ${num(m)}`;
    SUBJ.forEach((x, i) => {
      const xv = ax(x.v);
      const seg = svg.querySelector(`#es-dv-seg${i}`);
      seg.setAttribute('x1', ax(m)); seg.setAttribute('x2', xv);
      svg.querySelector(`#es-dv-dot${i}`).setAttribute('cx', xv);
      svg.querySelector(`#es-dv-dot${i}`).setAttribute('r', spread && i === far ? 7.5 : 6);
      svg.querySelector(`#es-dv-hit${i}`).setAttribute('cx', xv);
      const tx = svg.querySelector(`#es-dv-txt${i}`);
      const tag = spread && i === far ? ' · mais longe' : spread && i === near ? ' · mais perto' : '';
      tx.textContent = `${dev[i] >= 0 ? '+' : '−'}${num(Math.abs(dev[i]))}${tag}`;
      const right = dev[i] >= 0;
      tx.setAttribute('x', clamp(xv + (right ? 8 : -8), 132, 458));
      tx.setAttribute('text-anchor', right ? (xv > 380 ? 'end' : 'start') : (xv < 210 ? 'start' : 'end'));
    });
    // squares share one scale so their areas compare honestly
    const k = Math.min(24, 64 / Math.max(1e-9, ...ad));
    let x = 16, out = '';
    const BASE = 322;
    SUBJ.forEach((s, i) => {
      const side = Math.max(ad[i] * k, 0.75);
      out += `<rect class="f1" x="${x}" y="${BASE - side}" width="${side}" height="${side}" opacity="${i === far && spread ? 0.55 : 0.28}"/>` +
        `<text x="${x}" y="${BASE + 14}">${s.s}</text><text class="ink" x="${x}" y="${BASE + 27}">${num(dev[i] ** 2, 2)}</text>`;
      x += Math.max(side, 40) + 12;
    });
    const sideS = Math.max(sig * k, 0.75);
    out += `<text class="t13 ink" x="${x + 2}" y="${BASE - 4}">→</text>`;
    x += 22;
    out += `<rect class="f2" x="${x}" y="${BASE - sideS}" width="${sideS}" height="${sideS}" opacity=".55"/>` +
      `<text x="${x}" y="${BASE + 14}">média σ²</text><text class="ink" x="${x}" y="${BASE + 27}">${num(sig * sig, 4)}</text>` +
      `<text class="ink" x="${x + sideS + 6}" y="${BASE - sideS / 2 + 4}">lado σ = ${num(sig)}</text>`;
    svg.querySelector('#es-dv-sq').innerHTML = out;
    const sq = dev.map((d) => d * d);
    t4.querySelector('#es-dv-table').innerHTML = `<table class="es-t"><caption>A conta, passo a passo</caption>
      <thead><tr><th>Disciplina</th><th class="n"><i>x<sub>i</sub></i></th><th class="n"><i>x<sub>i</sub></i> − <i>x̄</i></th><th class="n">(<i>x<sub>i</sub></i> − <i>x̄</i>)²</th></tr></thead>
      <tbody>${SUBJ.map((s, i) => `<tr${spread && i === far ? ' class="on"' : ''}><td>${s.n}</td><td class="n">${num(s.v, 1)}</td><td class="n">${dev[i] >= 0 ? '+' : '−'}${num(Math.abs(dev[i]))}</td><td class="n">${num(sq[i], 4)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Soma</td><td class="n">${num(sum(vals), 1)}</td><td class="n">0</td><td class="n">${num(sum(sq), 4)}</td></tr></tfoot></table>`;
    t4.querySelector('#es-dv-calc').textContent = `x̄ = ${num(sum(vals), 1)} ÷ 4 = ${num(m, 4)} · σ = √(${num(sum(sq), 4)} ÷ 4) = √${num(sum(sq) / 4, 4)} ≈ ${num(sig)}`;
  }
  svg.addEventListener('pointermove', (e) => {
    const r = e.target.closest('.es-dv-row');
    if (!r) { tip.hide(); return; }
    const i = +r.dataset.i, vals = SUBJ.map((x) => x.v), d = SUBJ[i].v - mean(vals);
    tip.show(e.clientX, e.clientY, [[`nota ${num(SUBJ[i].v, 1)}`, SUBJ[i].n, 'k1'], [`${d >= 0 ? '+' : '−'}${num(Math.abs(d))}`, `desvio · ao quadrado ${num(d * d, 4)}`]]);
  });
  svg.addEventListener('pointerleave', () => tip.hide());
  draw();
}

/* ================================================================== 5 · probabilidade: moeda e pote (3D) ====== */
const CAP = 10000;
const coinS = { n: 0, k: 0, cum: new Int32Array(CAP) };
const jarS = { n: 0, k: 0, cum: new Int32Array(CAP), blue: 2, other: 3 };
const push = (o, hit) => { if (o.n >= CAP) return false; o.k += hit; o.cum[o.n++] = o.k; return true; };
const isBlueSlot = (i, k, n) => Math.floor(((i + 1) * k) / n) > Math.floor((i * k) / n); // spreads k blues over n slots
console.assert([0, 1, 2, 3, 4].filter((i) => isBlueSlot(i, 2, 5)).length === 2, '2 azuis em 5');

const t5 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage" id="es-prob"></div>
    <p class="stage-cap">A moeda gira e cai; o pote sorteia uma bola e a devolve antes do próximo sorteio. Cada resultado entra no gráfico de frequência logo abaixo.</p>
    <div class="controls" id="es-prob-ctl">
      <div class="btn-row" role="group" aria-label="Moeda"><span class="seg-label">Moeda</span>
        <button type="button" class="btn sm" id="es-c1">Lançar 1×</button><button type="button" class="btn sm" id="es-c100">Lançar 100×</button></div>
      <div class="btn-row" role="group" aria-label="Pote"><span class="seg-label">Pote</span>
        <button type="button" class="btn sm" id="es-j1">Sortear 1×</button><button type="button" class="btn sm" id="es-j100">Sortear 100×</button></div>
      <div id="es-jar-sl"></div>
      <div class="btn-row"><button type="button" class="btn sm" id="es-zero">Zerar contagens</button></div>
    </div>
    <div class="stats" aria-live="polite">
      <div class="stat"><b id="es-pc">—</b><span id="es-pc-l">cara em 0 lançamentos</span></div>
      <div class="stat"><b>50%</b><span>teórico: 1 em 2</span></div>
      <div class="stat"><b id="es-pj">—</b><span id="es-pj-l">azul em 0 sorteios</span></div>
      <div class="stat"><b id="es-pj-t">40%</b><span id="es-pj-tl">teórico: 2 em 5</span></div>
    </div>
    <div class="es-leg"><span><i class="ln k1"></i>Cara (moeda)</span><span><i class="ln k2"></i>Bola azul (pote)</span><span><i class="dash"></i>Probabilidade teórica</span></div>
    <div class="stage short" id="es-conv"></div>
    <details class="es-tv"><summary>Ver como tabela</summary><div id="es-conv-table"></div></details>
  </div>
  <div class="explain">
    <p class="kicker">Probabilidade · 17:02 – 17:50</p>
    <h3>Casos favoráveis sobre o total</h3>
    <p>A probabilidade estuda a chance de um evento ocorrer. Para calculá-la, basta dividir os casos favoráveis pelo total de possibilidades.</p>
    <div class="formula"><i>P</i> = <span class="frac"><span>casos favoráveis</span><span>total de possibilidades</span></span></div>
    ${vlinks([[1022, 'Assim chegamos à probabilidade'], [1035, 'A chance de um evento: favoráveis ÷ total']])}
    <h4>A moeda</h4>
    <p>Jogada para o alto, ela pode cair cara ou coroa. A probabilidade de dar cara é uma em duas: ½, ou 50% de chance.</p>
    <div class="formula"><i>P</i>(cara) = <span class="frac"><span>1</span><span>2</span></span> = 50%</div>
    ${vlinks([[1041, 'A moeda: cara ou coroa'], [1047, 'Uma em duas: 50% de chance']])}
    <h4>O pote</h4>
    <p>Qual a chance de tirar uma bola azul? Casos favoráveis, duas bolas azuis. Total de possibilidades, cinco. São 2 em 5, 40% de chance. Mude a quantidade de bolas e a conta muda junto.</p>
    <div class="formula" id="es-jar-f"></div>
    ${vlinks([[1055, 'Olhando para o pote: qual a chance da azul?'], [1061, '2 em 5: 40% de chance']])}
    <p class="note fact">Poucas jogadas oscilam muito. Com centenas delas, a frequência observada se aproxima da probabilidade teórica. Essa é a lei dos grandes números.</p>
    <div class="pick" id="es-prob-pick" aria-live="polite" hidden></div>
  </div>
</article>`);
root.append(t5);

{
  const $ = (id) => t5.querySelector(id);
  const pickEl = $('#es-prob-pick');
  const slB = slider({ id: 'es-jar-b', label: 'Bolas azuis', min: 0, max: 6, step: 1, value: 2 });
  const slO = slider({ id: 'es-jar-o', label: 'Outras cores', min: 1, max: 6, step: 1, value: 3 });
  $('#es-jar-sl').append(slB.el, slO.el);
  const jarFrac = () => `${jarS.blue} em ${jarS.blue + jarS.other}`;
  const pJar = () => jarS.blue / (jarS.blue + jarS.other);

  /* ---- convergence chart ---- */
  const conv = $('#es-conv');
  const L = 44, R = 404, T = 14, B = 196;
  conv.innerHTML = `<svg class="es-svg" viewBox="0 0 480 228" role="img" aria-labelledby="es-cv-title" tabindex="0">
    <title id="es-cv-title">Frequência acumulada de cara e de bola azul conforme o número de jogadas</title>
    <g id="es-cv-grid"></g>
    <line class="ref" id="es-cv-r1" x1="${L}" x2="${R}"/><line class="ref" id="es-cv-r2" x1="${L}" x2="${R}"/>
    <text id="es-cv-r1t" x="${L + 4}"></text><text id="es-cv-r2t" x="${L + 4}"></text>
    <path class="l1" id="es-cv-p1"/><path class="l2" id="es-cv-p2"/>
    <text class="ink" id="es-cv-e1"></text><text class="ink" id="es-cv-e2"></text>
    <line class="cross" id="es-cv-x" y1="${T}" y2="${B}" style="display:none"/>
    <rect class="hit" id="es-cv-hit" x="${L}" y="${T}" width="${R - L}" height="${B - T}"/>
  </svg>`;
  const svg = conv.querySelector('svg');
  const tip = makeTip(conv);
  const yv = (f) => B - f * (B - T);
  const NICE = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  let N = 10, xv = (n) => L + (n / N) * (R - L);
  function path(o) {
    if (!o.n) return '';
    const step = Math.max(1, Math.floor(o.n / 300));
    let d = '';
    for (let i = 1; i <= o.n; i += step) d += `${d ? 'L' : 'M'}${xv(i).toFixed(1)} ${yv(o.cum[i - 1] / i).toFixed(1)}`;
    if ((o.n - 1) % step) d += `L${xv(o.n).toFixed(1)} ${yv(o.k / o.n).toFixed(1)}`;
    return d;
  }
  function draw() {
    N = NICE.find((v) => v >= Math.max(coinS.n, jarS.n)) || CAP;
    xv = (n) => L + (n / N) * (R - L);
    let g = '';
    for (const f of [0, 0.25, 0.5, 0.75, 1]) g += `<line class="grid" x1="${L}" x2="${R}" y1="${yv(f)}" y2="${yv(f)}"/><text x="${L - 6}" y="${yv(f) + 4}" text-anchor="end">${f * 100}%</text>`;
    for (let i = 0; i <= 5; i++) { const n = (N / 5) * i; g += `<text x="${xv(n)}" y="${B + 15}" text-anchor="middle">${int(n)}</text>`; }
    g += `<line class="axis" x1="${L}" x2="${R}" y1="${B}" y2="${B}"/><text x="${R}" y="${B + 29}" text-anchor="end">número de jogadas</text>`;
    svg.querySelector('#es-cv-grid').innerHTML = g;
    const pj = pJar();
    [['r1', 0.5, '½ teórico'], ['r2', pj, `${jarS.blue}/${jarS.blue + jarS.other} teórico`]].forEach(([id, p, t], i) => {
      svg.querySelector(`#es-cv-${id}`).setAttribute('y1', yv(p));
      svg.querySelector(`#es-cv-${id}`).setAttribute('y2', yv(p));
      const tt = svg.querySelector(`#es-cv-${id}t`);
      const clash = i === 1 && Math.abs(yv(p) - yv(0.5)) < 13;
      tt.setAttribute('y', yv(p) + (clash ? 13 : -4));
      tt.textContent = t;
    });
    svg.querySelector('#es-cv-p1').setAttribute('d', path(coinS));
    svg.querySelector('#es-cv-p2').setAttribute('d', path(jarS));
    // end labels: values lead, nudged apart only when they would overlap
    const e = [[coinS, '#es-cv-e1', 'Cara'], [jarS, '#es-cv-e2', 'Azul']].map(([o, id, name]) => ({ o, node: svg.querySelector(id), name, y: o.n ? yv(o.k / o.n) : 0 }));
    if (coinS.n && jarS.n && Math.abs(e[0].y - e[1].y) < 13) { const mid = (e[0].y + e[1].y) / 2, up = e[0].y <= e[1].y ? 0 : 1; e[up].y = mid - 6.5; e[1 - up].y = mid + 6.5; }
    e.forEach(({ o, node, name, y }) => {
      node.textContent = o.n ? `${name} ${br((o.k / o.n) * 100, 1)}%` : '';
      node.setAttribute('x', xv(o.n) + 6 > R ? R + 6 : xv(o.n) + 6);
      node.setAttribute('y', y + 4);
    });
    $('#es-pc').textContent = coinS.n ? `${br((coinS.k / coinS.n) * 100, 1)}%` : '—';
    $('#es-pc-l').textContent = `cara em ${int(coinS.n)} lançamento${coinS.n === 1 ? '' : 's'}`;
    $('#es-pj').textContent = jarS.n ? `${br((jarS.k / jarS.n) * 100, 1)}%` : '—';
    $('#es-pj-l').textContent = `azul em ${int(jarS.n)} sorteio${jarS.n === 1 ? '' : 's'}`;
    $('#es-pj-t').textContent = `${br(pj * 100, pj * 100 % 1 ? 1 : 0)}%`;
    $('#es-pj-tl').textContent = `teórico: ${jarFrac()}`;
    $('#es-jar-f').innerHTML = `<i>P</i>(azul) = <span class="frac"><span>${jarS.blue}</span><span>${jarS.blue + jarS.other}</span></span> = ${br(pj * 100, pj * 100 % 1 ? 1 : 0)}%`;
    $('#es-conv-table').innerHTML = `<table class="es-t"><thead><tr><th>Experimento</th><th class="n">Jogadas</th><th class="n">Sucessos</th><th class="n">Frequência</th><th class="n">Teórico</th></tr></thead><tbody>
      <tr><td>Moeda: cara</td><td class="n">${int(coinS.n)}</td><td class="n">${int(coinS.k)}</td><td class="n">${coinS.n ? br((coinS.k / coinS.n) * 100, 1) + '%' : '—'}</td><td class="n">50%</td></tr>
      <tr><td>Pote: bola azul (${jarFrac()})</td><td class="n">${int(jarS.n)}</td><td class="n">${int(jarS.k)}</td><td class="n">${jarS.n ? br((jarS.k / jarS.n) * 100, 1) + '%' : '—'}</td><td class="n">${br(pj * 100, 1)}%</td></tr></tbody></table>`;
    ['#es-c1', '#es-c100'].forEach((id) => { if (coinS.n >= CAP) $(id).disabled = true; });
    ['#es-j1', '#es-j100'].forEach((id) => { if (jarS.n >= CAP) $(id).disabled = true; });
  }
  const freqAt = (o, n) => (n >= 1 && n <= o.n ? `${br((o.cum[n - 1] / n) * 100, 1)}%` : null);
  function hover(n, cx, cy) {
    n = clamp(Math.round(n), 1, Math.max(1, coinS.n, jarS.n));
    const rows = [];
    const a = freqAt(coinS, n), b = freqAt(jarS, n);
    if (a) rows.push([a, `cara após ${int(n)}`, 'k1']);
    if (b) rows.push([b, `azul após ${int(n)}`, 'k2']);
    if (!rows.length) { tip.hide(); return; }
    const xl = svg.querySelector('#es-cv-x');
    xl.style.display = '';
    xl.setAttribute('x1', xv(n)); xl.setAttribute('x2', xv(n));
    tip.show(cx, cy, rows);
  }
  let hn = 1;
  svg.querySelector('#es-cv-hit').addEventListener('pointermove', (e) => { const p = svgPt(svg, e); hn = ((p.x - L) / (R - L)) * N; hover(hn, e.clientX, e.clientY); });
  const out = () => { tip.hide(); svg.querySelector('#es-cv-x').style.display = 'none'; };
  svg.querySelector('#es-cv-hit').addEventListener('pointerleave', out);
  svg.addEventListener('blur', out);
  svg.addEventListener('focus', () => { hn = Math.max(coinS.n, jarS.n); const [cx, cy] = centerOf(svg); hover(hn, cx, cy + 40); });
  svg.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, PageDown: -N / 10, PageUp: N / 10 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    hn = clamp(Math.round(hn) + step, 1, Math.max(1, coinS.n, jarS.n));
    const p = new DOMPoint(xv(hn), T + 20).matrixTransform(svg.getScreenCTM());
    hover(hn, p.x, p.y);
  });

  /* ---- 3D: coin and jar ---- */
  const probOpts = {
    camera: [0, 4.1, 5.6], target: [0, 0.5, 0], fov: 36,
    label: 'Moeda dourada à esquerda e pote de vidro com bolas azuis e de outra cor à direita.',
    hint: 'arraste para girar · clique nos rótulos',
  };
  let view = null;
  const PICKS = {
    moeda: () => ['Moeda', 'Dois resultados possíveis, cara e coroa, e um favorável. P(cara) = 1 ÷ 2 = 50%.', [[1041, 'A moeda: cara ou coroa'], [1047, 'Uma em duas: 50%']]],
    pote: () => ['Pote', `${jarS.blue} bola${jarS.blue === 1 ? '' : 's'} azu${jarS.blue === 1 ? 'l' : 'is'} entre ${jarS.blue + jarS.other}. P(azul) = ${jarS.blue} ÷ ${jarS.blue + jarS.other} = ${br(pJar() * 100, 1)}%. No vídeo são 2 em 5.`, [[1055, 'Olhando para o pote'], [1061, '2 em 5: 40% de chance']]],
  };
  const pick = (k) => { const [a, b, c] = PICKS[k](); pickInto(pickEl, a, b, c); if (view) view.hot(k); };

  lazyStage($('#es-prob'), probOpts, (s) => {
    s.controls.maxPolarAngle = Math.PI * 0.46;
    const { c, mix, tm } = themer(s);
    const hots = hotGroup();
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12, depthWrite: false });
    const disc = new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2);

    // coin: gold is a physical material, readable on both themes
    function coinTex(word) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 256;
      const g = cv.getContext('2d');
      const gr = g.createRadialGradient(96, 88, 10, 128, 128, 130);
      gr.addColorStop(0, '#f8e3a0'); gr.addColorStop(0.55, '#e0b45a'); gr.addColorStop(1, '#a87a26');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      g.strokeStyle = 'rgba(92,60,8,.6)';
      g.lineWidth = 7; g.beginPath(); g.arc(128, 128, 116, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 2; g.beginPath(); g.arc(128, 128, 100, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; g.beginPath(); g.arc(128 + 108 * Math.cos(a), 128 + 108 * Math.sin(a), 2, 0, Math.PI * 2); g.fillStyle = 'rgba(92,60,8,.45)'; g.fill(); }
      g.fillStyle = 'rgba(80,52,6,.85)';
      g.font = '800 44px "Segoe UI", system-ui, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(word, 128, 134);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    }
    const gold = { roughness: 0.38, metalness: 0.15 };
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.09, 64), [
      new THREE.MeshStandardMaterial({ color: 0xc89a3e, ...gold }),
      new THREE.MeshStandardMaterial({ map: coinTex('CARA'), ...gold }),
      new THREE.MeshStandardMaterial({ map: coinTex('COROA'), ...gold }),
    ]);
    // cap UVs run along local x/z; a quarter turn makes the words read upright from the front camera
    coin.rotation.y = Math.PI / 2;
    const coinG = new THREE.Group();
    coinG.position.set(-1.5, 0, 0.15);
    coin.position.y = 0.045;
    const coinSh = new THREE.Mesh(disc, shadowMat);
    coinSh.scale.setScalar(0.66);
    coinSh.position.y = 0.002;
    coinG.add(coin, coinSh);
    s.add(coinG);
    const coinRes = s.label('', [0, 0.55, 0], { parent: coinG, cls: 'es-res' });
    const coinHot = hots.add(s.label('Moeda · ½', [0, -0.05, 0.95], { parent: coinG, onClick: () => pick('moeda') }));

    // jar
    const jarG = new THREE.Group();
    jarG.position.set(1.45, 0, -0.05);
    s.add(jarG);
    const glassMat = tm(() => mix('--ink', '--surface', 0.35), { transparent: true, opacity: 0.16, roughness: 0.12, side: THREE.DoubleSide, depthWrite: false });
    const rimMat = tm(() => mix('--ink', '--surface', 0.45), { roughness: 0.3 });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.3, 48, 1, true), glassMat);
    glass.position.y = 0.65;
    glass.renderOrder = 3;
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.8, 48).rotateX(-Math.PI / 2), glassMat);
    bottom.position.y = 0.004;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.03, 8, 56).rotateX(Math.PI / 2), rimMat);
    rim.position.y = 1.3;
    const jarSh = new THREE.Mesh(disc, shadowMat);
    jarSh.scale.setScalar(0.88);
    jarSh.position.y = 0.002;
    jarG.add(glass, bottom, rim, jarSh);
    const blueMat = tm(() => c('--es-s2'), { roughness: 0.3 });
    const otherMat = tm(() => mix('--muted', '--surface', 0.35), { roughness: 0.35 });
    const SLOTS = [];
    [[0.21, 0], [0.57, Math.PI / 4], [0.93, 0]].forEach(([y, rot]) => {
      SLOTS.push(new THREE.Vector3(0, y, 0));
      for (let i = 0; i < 4; i++) { const a = rot + (i * Math.PI) / 2; SLOTS.push(new THREE.Vector3(0.42 * Math.cos(a), y, 0.42 * Math.sin(a))); }
    });
    const ballG = new THREE.SphereGeometry(0.19, 28, 18);
    const balls = SLOTS.slice(0, 12).map((p) => { const b = new THREE.Mesh(ballG, otherMat); b.position.copy(p); jarG.add(b); return b; });
    const jarRes = s.label('', [0, 2.35, 0], { parent: jarG, cls: 'es-res' });
    const jarHot = hots.add(s.label('Pote · 2/5', [0, -0.05, 1.05], { parent: jarG, onClick: () => pick('pote') }));
    function layout() {
      const n = jarS.blue + jarS.other;
      balls.forEach((b, i) => {
        b.visible = i < n;
        b.material = isBlueSlot(i, jarS.blue, n) ? blueMat : otherMat;
        b.position.copy(SLOTS[i]);
      });
      jarHot.element.textContent = `Pote · ${jarS.blue}/${n}`;
    }
    layout();

    let coinBusy = false, jarBusy = false;
    const tmpV = new THREE.Vector3();
    function toss(face, done) {
      coinBusy = true;
      coinRes.element.textContent = '';
      const r0 = coin.rotation.x;
      const r1 = r0 - (r0 % (Math.PI * 2)) + 12 * Math.PI + (face ? 0 : Math.PI);
      const finish = () => { coin.rotation.x = face ? 0 : Math.PI; coin.position.y = 0.045; coinRes.element.textContent = face ? 'CARA' : 'COROA'; coinBusy = false; done(); };
      if (reduced) { finish(); return; }
      const t0 = performance.now(), D = 1150;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / D);
        coin.position.y = 0.045 + 2.0 * 4 * k * (1 - k);
        coin.rotation.x = r0 + (r1 - r0) * (1 - (1 - k) ** 2);
        coinSh.scale.setScalar(0.66 * (1 - 0.45 * 4 * k * (1 - k)));
        if (k < 1) requestAnimationFrame(step); else finish();
      };
      requestAnimationFrame(step);
    }
    function draw1(slot, blue, done) {
      jarBusy = true;
      jarRes.element.textContent = '';
      const b = balls[slot];
      const home = SLOTS[slot].clone();
      const top = new THREE.Vector3(0, 2.0, 0.25);
      const via = new THREE.Vector3(home.x * 0.3, 1.45, home.z * 0.3);
      const curve = new THREE.QuadraticBezierCurve3(home, via, top);
      const finish = () => { b.position.copy(home); jarBusy = false; done(); };
      if (reduced) { jarRes.element.textContent = blue ? 'AZUL' : 'OUTRA COR'; finish(); return; }
      tween(0, 1, 650, (u) => b.position.copy(curve.getPoint(u, tmpV)), () => {
        jarRes.element.textContent = blue ? 'AZUL' : 'OUTRA COR';
        setTimeout(() => tween(1, 0, 520, (u) => b.position.copy(curve.getPoint(u, tmpV)), finish), 380);
      });
    }
    view = {
      toss, draw1, layout,
      get coinBusy() { return coinBusy; }, get jarBusy() { return jarBusy; },
      hot(k) { hots.on(k === 'moeda' ? coinHot : jarHot); },
      reset() { coinRes.element.textContent = ''; jarRes.element.textContent = ''; },
    };
    // a gentle idle wobble on the resting coin, off for reduced motion
    s.onFrame((t) => { if (!reduced && !coinBusy) coinG.rotation.y = Math.sin(t * 0.6) * 0.12; });
  });

  const busy = (on, ids) => ids.forEach((id) => { $(id).disabled = on || (id.startsWith('#es-c') ? coinS.n >= CAP : jarS.n >= CAP); });
  function coinRun(times) {
    if (view && view.coinBusy) return;
    for (let i = 0; i < times - 1; i++) push(coinS, Math.random() < 0.5 ? 1 : 0);
    const last = Math.random() < 0.5 ? 1 : 0;
    if (times > 1) draw();
    if (!view) { push(coinS, last); draw(); return; }
    busy(true, ['#es-c1', '#es-c100']);
    view.toss(last, () => { push(coinS, last); draw(); busy(false, ['#es-c1', '#es-c100']); });
  }
  function jarRun(times) {
    if (view && view.jarBusy) return;
    const n = jarS.blue + jarS.other;
    const draws = Array.from({ length: times }, () => Math.floor(Math.random() * n));
    draws.slice(0, -1).forEach((j) => push(jarS, isBlueSlot(j, jarS.blue, n) ? 1 : 0));
    const j = draws[draws.length - 1], blue = isBlueSlot(j, jarS.blue, n) ? 1 : 0;
    if (times > 1) draw();
    if (!view) { push(jarS, blue); draw(); return; }
    busy(true, ['#es-j1', '#es-j100']);
    view.draw1(j, blue, () => { push(jarS, blue); draw(); busy(false, ['#es-j1', '#es-j100']); });
  }
  $('#es-c1').addEventListener('click', () => coinRun(1));
  $('#es-c100').addEventListener('click', () => coinRun(100));
  $('#es-j1').addEventListener('click', () => jarRun(1));
  $('#es-j100').addEventListener('click', () => jarRun(100));
  const resetJar = () => { jarS.n = 0; jarS.k = 0; ['#es-j1', '#es-j100'].forEach((id) => { $(id).disabled = false; }); };
  $('#es-zero').addEventListener('click', () => {
    coinS.n = 0; coinS.k = 0; resetJar();
    ['#es-c1', '#es-c100'].forEach((id) => { $(id).disabled = false; });
    if (view) view.reset();
    draw();
  });
  const recount = () => { jarS.blue = slB.value; jarS.other = slO.value; resetJar(); if (view) view.layout(); draw(); if (!pickEl.hidden) pick('pote'); };
  slB.on(recount);
  slO.on(recount);
  draw();
}

/* ================================================================== 6 · escada da improbabilidade ====== */
const t6 = el(`
<article class="topic flip">
  <div class="stage-col">
    <div class="stage" id="es-escada"></div>
    <p class="stage-cap">Escala logarítmica: cada marca do eixo vale dez zeros a mais depois da vírgula. Quanto mais longa a barra, mais improvável o evento. Clique numa barra para detalhar.</p>
    <div class="controls" id="es-esc-ctl"></div>
    <p class="readout" id="es-esc-read" aria-live="polite"></p>
    <details class="es-tv"><summary>Ver como tabela</summary><div id="es-esc-table"></div></details>
  </div>
  <div class="explain">
    <p class="kicker">Do provável ao quase impossível · 17:09 – 18:14</p>
    <h3>Mega-Sena, moedas e átomos que atravessam paredes</h3>
    <p>Probabilidade é o ramo da matemática que te mostra que jogar na Mega-Sena não é boa ideia. Na escada ao lado, a moeda e o pote mal saem do lugar. A Mega-Sena já fica bem longe.</p>
    ${vlink(1029, 'Por que jogar na Mega-Sena não é boa ideia')}
    <p class="note fact">Na Mega-Sena saem 6 dezenas entre 60. Há 50.063.860 combinações possíveis de 6 números, então uma aposta simples acerta a sena com chance de 1 em 50.063.860. É como tirar cara cerca de 25 a 26 vezes seguidas.</p>
    <p>Mais difícil ainda é seus átomos atravessarem uma parede por tunelamento. Pela equação de Gamow, a chance fica na ordem de 10<sup>−40</sup>. Isso quer dizer que não é impossível. Só é muito pouco provável você ver alguém atravessando paredes por aí.</p>
    ${vlinks([[1070, 'Átomos atravessando paredes por tunelamento'], [1076, 'Equação de Gamow: ordem de 10⁻⁴⁰'], [1082, 'Possível, mas muito pouco provável']])}
    <p class="note fact">Na física quântica, uma partícula pode atravessar uma barreira que a física clássica diria intransponível. A chance cai exponencialmente com a largura <i>L</i> da barreira, algo como <span class="math">e<sup>−2κ<i>L</i></sup></span>. George Gamow usou essa ideia em 1928 para explicar o decaimento alfa. Para um corpo humano, cerca de 7 × 10<sup>27</sup> átomos precisariam atravessar juntos, e a chance fica incomparavelmente menor.</p>
    <p><b>Resumo da ópera:</b> probabilidade é um jeito racional de interpretar a chance de um evento ocorrer.</p>
    ${vlink(1088, 'Resumo: um jeito racional de interpretar a chance')}
    <div class="pick" id="es-esc-pick" aria-live="polite" hidden></div>
  </div>
</article>`);
root.append(t6);

{
  const host = t6.querySelector('#es-escada');
  const pickEl = t6.querySelector('#es-esc-pick');
  const XL = 16, XR = 396, PXD = (XR - XL) / 40;
  const ROWY = [56, 116, 176, 236];
  let bets = 1;
  const heads = (p) => Math.log2(1 / p);
  const oneIn = (p) => (1 / p < 100 ? num(1 / p, 1) : int(1 / p));
  const pctTxt = (p) => `${(p * 100).toLocaleString('pt-BR', { maximumSignificantDigits: 2 })}%`;
  const ROWS = [
    { name: () => 'Moeda: cair cara', p: () => 0.5, tag: () => '½ = 50%', links: [[1041, 'A moeda: cara ou coroa'], [1047, 'Uma em duas: 50%']], body: () => 'Um caso favorável em dois possíveis.' },
    { name: () => 'Pote: tirar uma bola azul', p: () => 0.4, tag: () => '⅖ = 40%', links: [[1055, 'O pote'], [1061, '2 em 5: 40%']], body: () => 'Duas bolas azuis num total de cinco.' },
    { name: () => `Mega-Sena: ${bets === 1 ? '1 aposta simples' : `${int(bets)} apostas simples`}`, p: () => megaK(bets), tag: () => `1 em ${oneIn(megaK(bets))}`, links: [[1029, 'Jogar na Mega-Sena não é boa ideia']], body: () => (bets === 1 ? 'Uma aposta de 6 dezenas cobre 1 das 50.063.860 combinações.' : `Com ${int(bets)} apostas diferentes, a chance de pelo menos uma acertar sobe para ${pctTxt(megaK(bets))}.`) },
    { name: () => 'Tunelamento: atravessar a parede', p: () => 1e-40, tag: () => '≈ 10⁻⁴⁰', links: [[1070, 'Átomos atravessando paredes'], [1076, 'Equação de Gamow: ordem de 10⁻⁴⁰'], [1082, 'Possível, mas muito pouco provável']], body: () => 'A ordem de grandeza citada no vídeo para a equação de Gamow.' },
  ];
  let ticks = '';
  for (let d = 0; d <= 40; d += 10) ticks += `<line class="grid" x1="${XL + d * PXD}" x2="${XL + d * PXD}" y1="30" y2="262"/><text x="${XL + d * PXD}" y="22" text-anchor="${d ? 'middle' : 'start'}">${d ? `10⁻${String(d).split('').map((ch) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[ch]).join('')}` : '1 (certeza)'}</text>`;
  host.innerHTML = `
  <svg class="es-svg" viewBox="0 0 480 280" role="group" aria-labelledby="es-esc-title">
    <title id="es-esc-title">Escada logarítmica de probabilidades: moeda, pote, Mega-Sena e tunelamento</title>
    ${ticks}
    <line class="axis" x1="${XL}" x2="${XL}" y1="30" y2="262"/>
    ${ROWS.map((r, i) => `<g class="es-esc-row" data-i="${i}" tabindex="0" role="button" aria-pressed="false">
      <text class="t12 ink" id="es-esc-n${i}" x="${XL + 2}" y="${ROWY[i] - 6}"></text>
      <rect class="hit" x="${XL}" y="${ROWY[i] - 20}" width="${480 - XL}" height="46"/>
      <path class="bar fg" id="es-esc-b${i}"/>
      <text class="ink" id="es-esc-t${i}" y="${ROWY[i] + 12}"></text></g>`).join('')}
    <line class="lk" id="es-esc-ghost" y1="${ROWY[2] - 1}" y2="${ROWY[2] + 17}" style="display:none"/>
  </svg>`;
  const svg = host.querySelector('svg');
  const tip = makeTip(host);
  let sel = 2;
  const len = (p) => Math.max(3, -Math.log10(p) * PXD);
  function draw() {
    ROWS.forEach((r, i) => {
      const p = r.p(), w = len(p);
      svg.querySelector(`#es-esc-n${i}`).textContent = r.name();
      const b = svg.querySelector(`#es-esc-b${i}`);
      b.setAttribute('d', hbar(XL, ROWY[i], w, 16));
      b.setAttribute('class', `bar ${i === sel ? 'f1' : 'fg'}`);
      const t = svg.querySelector(`#es-esc-t${i}`);
      t.textContent = r.tag();
      t.setAttribute('x', XL + w + 6);
      svg.querySelector(`.es-esc-row[data-i="${i}"]`).setAttribute('aria-pressed', String(i === sel));
      svg.querySelector(`.es-esc-row[data-i="${i}"]`).setAttribute('aria-label', `${r.name()}: ${r.tag()}`);
    });
    const gh = svg.querySelector('#es-esc-ghost');
    gh.style.display = bets > 1 ? '' : 'none';
    gh.setAttribute('x1', XL + len(MEGA)); gh.setAttribute('x2', XL + len(MEGA));
    const pk = megaK(bets);
    t6.querySelector('#es-esc-read').textContent = pk >= 1
      ? `Com ${int(bets)} apostas diferentes você cobre todas as combinações: o acerto é garantido.`
      : `Com ${int(bets)} aposta${bets === 1 ? '' : 's diferentes'}: chance de 1 em ${oneIn(pk)} (${pctTxt(pk)}). É como tirar cara ${num(heads(pk), 1)} vezes seguidas.`;
    t6.querySelector('#es-esc-table').innerHTML = `<table class="es-t"><thead><tr><th>Evento</th><th class="n">Probabilidade</th><th class="n">Caras seguidas equivalentes</th></tr></thead><tbody>
      ${ROWS.map((r) => `<tr><td>${r.name()}</td><td class="n">${r.tag()}</td><td class="n">${num(heads(r.p()), 1)}</td></tr>`).join('')}</tbody></table>`;
  }
  function choose(i) {
    sel = i;
    draw();
    const r = ROWS[i];
    pickInto(pickEl, r.name(), `${r.body()} Probabilidade: ${r.tag()}. Equivale a tirar cara ${num(heads(r.p()), 1)} ${heads(r.p()) < 1.5 ? 'vez' : 'vezes seguidas'}.`, r.links);
  }
  svg.addEventListener('click', (e) => { const g = e.target.closest('.es-esc-row'); if (g) choose(+g.dataset.i); });
  svg.addEventListener('keydown', (e) => {
    const g = e.target.closest('.es-esc-row');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); choose(+g.dataset.i); }
  });
  svg.addEventListener('pointermove', (e) => {
    const g = e.target.closest('.es-esc-row');
    if (!g) { tip.hide(); return; }
    const r = ROWS[+g.dataset.i];
    tip.show(e.clientX, e.clientY, [[r.tag(), r.name(), 'k1'], [`${num(heads(r.p()), 1)}`, 'caras seguidas equivalentes']]);
  });
  svg.addEventListener('pointerleave', () => tip.hide());
  const betsOf = (e) => Math.min(COMBOS, Math.round(10 ** e));
  const sl = slider({ id: 'es-esc-k', label: 'Apostas diferentes', min: 0, max: 7.7, step: 0.1, value: 0, format: (e) => int(betsOf(e)) });
  sl.on((e) => { bets = betsOf(e); if (sel === 2) choose(2); else draw(); });
  t6.querySelector('#es-esc-ctl').append(sl.el);
  draw();
}
