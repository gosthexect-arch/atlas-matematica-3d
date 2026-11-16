// Chapter 9 · Derivada (24:18–26:00 of the video): the four notations, then one model, the car's speed v(t), drives a 3D car,
// its speedometer, the v(t) chart where the secant over Δt shrinks into the tangent, and the acceleration chart a(t) = v′(t).
import { THREE, mount, el, css, vlink, vlinks, stage, slider, segmented, hueColor, onTheme, mat, tween, br } from './core.js';

const root = mount('derivada');
const C = { up: 150, down: 28, glass: 215, lamp: 355 }; // hues: speeding up, braking, glass tint, brake lamp

css(`
#derivada .pick[hidden] { display: none; }
#derivada .de-up { --hue: hsl(${C.up} var(--hue-s) var(--hue-l)); --hue-soft: hsl(${C.up} 55% var(--hue-soft-l)); }
#derivada .de-down { --hue: hsl(${C.down} var(--hue-s) var(--hue-l)); --hue-soft: hsl(${C.down} 55% var(--hue-soft-l)); }
#derivada .de-zero { --hue: var(--muted); --hue-soft: color-mix(in srgb, var(--muted) 18%, var(--surface)); }
#derivada .de-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; perspective: 900px; }
#derivada .de-card { position: relative; display: block; width: 100%; min-height: 176px; padding: 0; border: 0; background: none; color: var(--ink); cursor: pointer; font: inherit; transform-style: preserve-3d; transition: transform .7s cubic-bezier(.65, 0, .35, 1); }
#derivada .de-card[aria-pressed="true"] { transform: rotateY(180deg); }
#derivada .de-card:focus-visible { outline: none; }
#derivada .de-card:focus-visible .de-face { outline: 2px solid var(--accent); outline-offset: 2px; }
#derivada .de-face { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px; text-align: center; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface); box-shadow: var(--shadow); backface-visibility: hidden; -webkit-backface-visibility: hidden; }
#derivada .de-card:hover .de-face { border-color: var(--hue); }
#derivada .de-back { transform: rotateY(180deg); background: var(--hue-soft); border-color: var(--hue); font-size: 13px; line-height: 1.42; }
@media (max-width: 480px) { #derivada .de-cards { grid-template-columns: minmax(0, 1fr); } }
#derivada .de-back b { font-family: var(--f-math); font-style: italic; font-weight: 400; font-size: 15px; }
#derivada .de-sym { font: 400 2.5rem/1 var(--f-math); color: var(--hue); }
#derivada .de-who { font: 600 12px/1.2 var(--f-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
#derivada .de-hud { position: absolute; top: 8px; right: 8px; z-index: 3; width: clamp(84px, 23%, 132px); pointer-events: none; padding: 4px 6px 2px; border: 1px solid var(--line); border-radius: 8px; background: color-mix(in srgb, var(--surface) 86%, transparent); }
#derivada .de-hud svg { display: block; width: 100%; height: auto; }
#derivada .de-gauge .trk { stroke: var(--line); stroke-width: 7; fill: none; stroke-linecap: round; }
#derivada .de-gauge .val { stroke: var(--hue); stroke-width: 7; fill: none; stroke-linecap: round; }
#derivada .de-gauge .tk { stroke: var(--muted); stroke-width: 1.4; }
#derivada .de-gauge .ndl { stroke: var(--ink); stroke-width: 2.6; stroke-linecap: round; }
#derivada .de-gauge .hub { fill: var(--ink); }
#derivada .de-gauge .num { font: 700 19px/1 var(--f-mono); fill: var(--ink); }
#derivada .de-gauge .unit { font: 500 9px/1 var(--f-body); fill: var(--muted); }
#derivada .de-state { position: absolute; top: 8px; left: 8px; z-index: 3; pointer-events: none; max-width: 62%; font: 600 12px/1.2 var(--f-body); padding: 6px 10px; border-radius: 999px; background: var(--hue); color: var(--on-hue); }
#derivada .de-cap { position: absolute; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 3; width: max-content; max-width: 88%; pointer-events: none; font: 500 13px/1.35 var(--f-body); padding: 7px 11px; border-radius: 8px; background: var(--ink); color: var(--paper); text-align: center; }
#derivada .de-cap[hidden] { display: none; }
#derivada .de-svg { display: block; width: 100%; height: 100%; touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: crosshair; }
#derivada .de-svg text { font: 500 13px/1 var(--f-body); fill: var(--ink); }
#derivada .de-svg .math { font: italic 400 17px/1 var(--f-math); }
#derivada .de-svg .sm { font-size: 12px; fill: var(--muted); }
#derivada .de-svg .axis { stroke: var(--muted); stroke-width: 1.3; fill: none; }
#derivada .de-svg .grid { stroke: var(--line); stroke-width: 1; fill: none; }
#derivada .de-svg .curve { stroke: var(--ink); stroke-width: 2.6; fill: none; stroke-linejoin: round; }
#derivada .de-svg .guide { stroke: var(--muted); stroke-width: 1.2; stroke-dasharray: 4 4; fill: none; }
#derivada .de-svg .sec { stroke: var(--hue); stroke-width: 2.6; fill: none; stroke-linecap: round; }
#derivada .de-svg .leg { stroke: var(--hue); stroke-width: 1.6; stroke-dasharray: 3 3; fill: none; }
#derivada .de-svg .tan { stroke: var(--ink); stroke-width: 2; stroke-dasharray: 8 5; fill: none; }
#derivada .de-svg .hue-f { fill: var(--hue); }
#derivada .de-svg .hue-t { fill: var(--hue); font-weight: 600; }
#derivada .de-svg .q { fill: var(--surface); stroke: var(--hue); stroke-width: 2; }
#derivada .de-svg .ring { fill: var(--surface); stroke: var(--muted); stroke-width: 1.6; }
#derivada .de-svg .ring-t { font: 700 11px/1 var(--f-mono); fill: var(--ink); }
#derivada .de-svg .soft { fill: var(--hue-soft); stroke: none; }
/* charts scale down with the stage: keep their type readable on phones */
@media (max-width: 600px) {
  #derivada .de-svg text { font-size: 20px; }
  #derivada .de-svg .sm { font-size: 19px; }
  #derivada .de-svg .ring-t { font-size: 15px; }
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
const sgn = (v, d) => (v < -0.5 * 10 ** -d ? '−' : v > 0.5 * 10 ** -d ? '+' : '') + br(Math.abs(v), d);
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
/** Pointer down/drag on a chart → time t (plot spans x0..x1 of a 640-wide viewBox). */
function dragTime(S, x0, x1, T, fn) {
  const at = (e) => { const r = S.getBoundingClientRect(); fn((((e.clientX - r.left) / r.width) * 640 - x0) / (x1 - x0) * T); };
  S.addEventListener('pointerdown', (e) => { S.setPointerCapture(e.pointerId); at(e); });
  S.addEventListener('pointermove', (e) => { if (e.buttons) at(e); });
}

/* ------------------------------------------------------------- the one model --------- */
// Speed of the car (km/h) through knots [t s, v km/h, dv/dt km/h por s], cubic Hermite: smooth v, continuous v′.
// Shape from the video: rises slowly, then a sharp rise to a maximum, falls to a minimum, rises again.
const K = [[0, 20, 2], [3, 30, 5], [5.5, 66, 18], [8, 90, 0], [11.5, 48, 0], [14, 62, 9]];
const T = 14, P1 = 1.5, P2 = 5, TMAX = 8, TMIN = 11.5;
function herm(t, d) {
  t = Math.min(T, Math.max(0, t));
  let i = 0;
  while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const [t0, v0, m0] = K[i], [t1, v1, m1] = K[i + 1], h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
  if (!d) return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * h * m1;
  return ((6 * u2 - 6 * u) * v0 + (3 * u2 - 4 * u + 1) * h * m0 + (-6 * u2 + 6 * u) * v1 + (3 * u2 - 2 * u) * h * m1) / h;
}
const v = (t) => herm(t, 0);
const dv = (t) => herm(t, 1); // the derivative: acceleration in km/h per second
console.assert([0.7, 2, 4.2, 6.3, 9.1, 12.8].every((t) => Math.abs((v(t + 1e-4) - v(t - 1e-4)) / 2e-4 - dv(t)) < 1e-3) &&
  Math.abs(dv(TMAX)) < 1e-9 && Math.abs(dv(TMIN)) < 1e-9 && dv(P2) > 5 * dv(P1), 'derivada: v′(t) analítica confere com a numérica');
// distance driven (m), integrated once at load: it scrolls the road and spins the wheels
const DT = 0.01, XS = new Float32Array(Math.round(T / DT) + 1);
for (let i = 1; i < XS.length; i++) XS[i] = XS[i - 1] + ((v((i - 1) * DT) + v(i * DT)) / 2 / 3.6) * DT;
const xAt = (t) => { const f = Math.min(XS.length - 1.001, Math.max(0, t / DT)), i = Math.floor(f); return XS[i] + (XS[i + 1] - XS[i]) * (f - i); };
const dtOf = (u) => 3 * (0.01 / 3) ** (u / 100); // Δt slider 0..100 → 3 s .. 0,01 s, even in log scale
const STATES = {
  acc: ['acelerando', 'de-up'], more: ['acelerando mais', 'de-up'], less: ['acelerando cada vez menos', 'de-up'], stop: ['parou de acelerar', 'de-zero'],
  brake: ['freando: aceleração negativa', 'de-down'], brakeEnd: ['parou de frear', 'de-zero'], again: ['voltando a acelerar', 'de-up'],
};
function stateAt(t) {
  const a = dv(t);
  if (t < TMAX) return a < 2.5 && t > 6 ? 'stop' : a >= 9 ? 'more' : t > 5.5 ? 'less' : 'acc';
  if (t < TMIN) return a > -2.5 ? (t < 9.75 ? 'stop' : 'brakeEnd') : 'brake';
  return a < 2.5 ? 'brakeEnd' : 'again';
}
const st = { t: P1, u: 0, play: false, show: { sec: true, tan: true, arrow: true } };
const subs = [];
const redraw = () => { for (const f of subs) f(); };
const setT = (t) => { st.t = Math.max(0, Math.min(T, t)); redraw(); };
const setU = (u) => { st.u = Math.max(0, Math.min(100, u)); redraw(); };

/* ============================================================ 1. As notações ===== */
{
  const NOT = [
    { who: 'Newton', sym: 'ẏ', read: 'lê-se <b>y ponto</b>', body: 'Newton chamava as taxas de fluxões e marcava com um ponto em cima. A física ainda usa o ponto para derivadas em relação ao tempo.' },
    { who: 'Leibniz', sym: '<span class="frac"><span>d<i>y</i></span><span>d<i>x</i></span></span>', read: 'lê-se <b>dê y, dê x</b>', body: 'Leibniz pensou num pedacinho de y dividido por um pedacinho de x. Lembra o Δy/Δx encolhendo até quase nada.' },
    { who: 'Lagrange', sym: '<i>f</i> ′(<i>x</i>)', read: 'lê-se <b>f linha de x</b>', body: 'Lagrange pôs uma linha no nome da função. Compacta: f′ é a função derivada de f.' },
    { who: 'Legendre', sym: '<span class="frac"><span>∂<i>y</i></span><span>∂<i>x</i></span></span>', read: 'derivada parcial', body: 'O ∂ de Legendre ficou para as derivadas parciais, quando a função depende de várias variáveis e só uma delas muda.' },
  ];
  const t = el(`
<article class="topic" id="de-t-notacoes">
  <div class="stage-col">
    <div class="de-cards" role="group" aria-label="Quatro notações de derivada">
      ${NOT.map((n, i) => `<button type="button" class="de-card" data-i="${i}" aria-pressed="false" aria-label="Notação de ${n.who}">
        <span class="de-face"><span class="de-sym">${n.sym}</span><span class="de-who">${n.who}</span></span>
        <span class="de-face de-back"><span>${n.read}</span><span>${n.body}</span></span></button>`).join('')}
    </div>
    <p class="stage-cap">Clique num cartão para virá-lo. Os quatro símbolos medem a mesma coisa.</p>
  </div>
  <div class="explain">
    <p class="kicker">Por falar em deriva…</p>
    <h3>Quatro jeitos de escrever a mesma ideia</h3>
    <p>Por falar em deriva, chegamos à derivada. Ela vai muito além de fazer conta sem parar. As notações de Newton, Leibniz, Lagrange e Legendre são as mais comuns.</p>
    <p>Todas querem dizer a mesma coisa: a <b>taxa de variação</b> de uma função, ou seja, quanto ela muda a cada pedacinho que a variável anda. A definição formal vem do limite. O vídeo deixa essa parte de lado por ser técnica; o simulador logo abaixo mostra a ideia funcionando.</p>
    <div class="formula"><i>f</i> ′(<i>x</i>) = lim<sub>Δ<i>x</i>→0</sub> <span class="frac"><span><i>f</i>(<i>x</i> + Δ<i>x</i>) − <i>f</i>(<i>x</i>)</span><span>Δ<i>x</i></span></span><small>No carro do próximo tópico, as quatro notações dizem o mesmo: v̇ = dv/dt = v′(t) = a(t), a aceleração.</small></div>
    <div class="pick" hidden></div>
    ${vlinks([[1458, 'Por falar em deriva…'], [1462, 'Muito além de fazer conta: as notações'], [1468, 'Tudo quer dizer a mesma coisa'], [1473, 'Taxa de variação, definida pelo limite']])}
  </div>
</article>`);
  root.append(t);
  const box = t.querySelector('.pick');
  t.querySelector('.de-cards').addEventListener('click', (e) => {
    const b = e.target.closest('.de-card');
    if (!b) return;
    const n = NOT[+b.dataset.i], on = b.getAttribute('aria-pressed') !== 'true';
    press(b, on);
    box.innerHTML = `<h4>Notação de ${n.who}</h4><p>${n.body}</p>${vlink(1462, 'As notações de Newton, Leibniz, Lagrange e Legendre')}`;
    box.hidden = false;
  });
}

/* ================================ 2. O simulador: carro, v(t), secante e tangente ===== */
{
  const t = el(`
<article class="topic" id="de-t-carro">
  <div class="stage-col">
    <div class="stage short" id="de-car">
      <div class="de-state" aria-hidden="true"></div>
      <div class="de-hud" aria-hidden="true"><svg class="de-gauge" viewBox="0 0 120 82"></svg></div>
      <p class="de-cap" aria-hidden="true" hidden></p>
    </div>
    <div class="stage short" id="de-chart"></div>
    <p class="sr-only" aria-live="polite" id="de-cap-sr"></p>
    <p class="stage-cap">Um único modelo, a velocidade <i>v</i>(<i>t</i>), move o carro, o velocímetro e o gráfico. Arraste no gráfico para escolher o instante.</p>
    <div class="controls"></div>
  </div>
  <div class="explain">
    <p class="kicker">Exemplo do vídeo · velocidade de um carro</p>
    <h3>Encolha o Δt e a secante vira tangente</h3>
    <p>Imagine o gráfico da velocidade de um carro em função do tempo. A velocidade aumenta devagar, depois dá um aumento brusco até um máximo, começa a diminuir até um mínimo e volta a aumentar.</p>
    <p>Para medir a taxa de variação no ponto 1, pegue um pequeno intervalo Δ<i>t</i> e veja quanto a velocidade mudou, Δ<i>v</i>. A razão Δ<i>v</i>/Δ<i>t</i> é a inclinação da reta secante. Aplicando o limite com Δ<i>t</i> tendendo a zero, a secante gira até tocar a curva num ponto só: é a reta tangente, e a inclinação dela é a derivada.</p>
    <div class="stats">
      <div class="stat"><b id="de-st-t">0</b><span>tempo t (s)</span></div>
      <div class="stat"><b id="de-st-v">0</b><span>velocidade (km/h)</span></div>
      <div class="stat"><b id="de-st-sec">0</b><span>Δv/Δt, secante</span></div>
      <div class="stat"><b id="de-st-tan">0</b><span>v′(t), tangente</span></div>
      <div class="stat"><b id="de-st-a">0</b><span>aceleração (m/s²)</span></div>
    </div>
    <div class="formula" id="de-form"></div>
    <div class="pick" hidden></div>
    ${vlinks([[1478, 'Gráfico de velocidade de um automóvel'], [1483, 'Aumenta devagar, depois um aumento brusco'], [1490, 'Cai até um mínimo e volta a aumentar'], [1496, 'A taxa de variação no ponto 1'], [1502, 'Um Δv para um pequeno Δt'], [1509, 'O limite com Δt tendendo a zero'], [1516, 'A reta tangente que toca a curva']])}
  </div>
</article>`);
  root.append(t);
  const q = (sel) => t.querySelector(sel);
  const pick = picker(q('.pick'), {
    car: () => ['A velocidade v(t)', `Agora, em t = ${br(st.t, 2)} s, o carro anda a ${br(v(st.t), 1)} km/h. É o valor que o velocímetro mostra e a altura da curva no gráfico.`, 1478, 'Gráfico de velocidade em função do tempo'],
    acc: () => ['A aceleração é a derivada', `A seta mostra v′(t) = ${sgn(dv(st.t), 1)} km/h por segundo, ou ${sgn(dv(st.t) / 3.6, 2)} m/s². Para frente, o carro ganha velocidade; para trás, ele freia.`, 1544, 'A derivada dá a taxa em qualquer ponto'],
  });

  /* controls */
  const slT = slider({ id: 'de-t', label: 'Tempo <i>t</i>', min: 0, max: T, step: 0.01, value: st.t, format: (x) => `${br(x, 2)} s` });
  const fmtDt = (u) => `${br(dtOf(u), dtOf(u) < 0.095 ? 3 : 2)} s`;
  const slU = slider({ id: 'de-dt', label: 'Intervalo Δ<i>t</i>', min: 0, max: 100, step: 0.1, value: st.u, format: fmtDt });
  const row = el(`<div class="btn-row">
    <button type="button" class="btn sm" aria-pressed="false" data-k="play">Reproduzir</button>
    <button type="button" class="btn sm" data-k="p1">Ponto 1</button><button type="button" class="btn sm" data-k="p2">Ponto 2</button>
    <button type="button" class="btn sm" data-k="shrink">Δt → 0</button><button type="button" class="btn sm" aria-pressed="false" data-k="tour">Tour guiado</button></div>`);
  const cam = segmented({ label: 'Câmera', options: [{ value: 'tq', label: '3/4' }, { value: 'side', label: 'De lado' }, { value: 'chase', label: 'Atrás' }], value: 'tq' });
  const show = el(`<div class="seg" role="group" aria-label="Mostrar"><span class="seg-label">Mostrar</span><button type="button" class="btn sm" data-k="sec" aria-pressed="true">Secante</button><button type="button" class="btn sm" data-k="tan" aria-pressed="true">Tangente</button><button type="button" class="btn sm" data-k="arrow" aria-pressed="true">Seta da aceleração</button></div>`);
  q('.controls').append(row, slT.el, slU.el, cam.el, show);
  const btn = (k) => row.querySelector(`[data-k="${k}"]`);

  /* playback: its own rAF so it runs even when the 3D stage is scrolled away */
  let raf = 0, last = 0;
  const step = (ts) => {
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
    last = ts;
    if (st.t + dt >= T) { setT(T); setPlay(false); return; }
    setT(st.t + dt);
    raf = requestAnimationFrame(step);
  };
  function setPlay(on) {
    cancelAnimationFrame(raf);
    st.play = on;
    press(btn('play'), on);
    btn('play').textContent = on ? 'Pausar' : 'Reproduzir';
    if (on) { if (st.t >= T - 0.01) setT(0); last = 0; raf = requestAnimationFrame(step); }
  }
  btn('play').addEventListener('click', () => setPlay(!st.play));
  slT.on((x) => { setPlay(false); setT(x); });
  slU.on(setU);
  btn('p1').addEventListener('click', () => { setPlay(false); tween(st.t, P1, 700, setT); });
  btn('p2').addEventListener('click', () => { setPlay(false); tween(st.t, P2, 700, setT); });
  btn('shrink').addEventListener('click', () => { const from = st.u > 99 ? 0 : st.u; tween(from, 100, 2400 * (1 - from / 100) + 300, setU); });
  show.addEventListener('click', (e) => { const b = e.target.closest('button[data-k]'); if (!b) return; st.show[b.dataset.k] = !st.show[b.dataset.k]; press(b, st.show[b.dataset.k]); redraw(); });

  /* readouts */
  const pill = q('.de-state');
  subs.push(() => {
    const t0 = st.t, d = dtOf(st.u), tq = t0 + d <= T ? t0 + d : t0 - d, sec = (v(tq) - v(t0)) / (tq - t0), tg = dv(t0);
    q('#de-st-t').textContent = br(t0, 2);
    q('#de-st-v').textContent = br(v(t0), 1);
    q('#de-st-sec').textContent = br(sec, 2);
    q('#de-st-tan').textContent = br(tg, 2);
    q('#de-st-a').textContent = sgn(tg / 3.6, 2);
    q('#de-form').innerHTML = `<span class="frac"><span>Δ<i>v</i></span><span>Δ<i>t</i></span></span> = <span class="frac"><span>${br(v(tq) - v(t0), 2)} km/h</span><span>${br(tq - t0, 3)} s</span></span> = ${br(sec, 2)} &nbsp;→&nbsp; <i>v</i>′(<i>t</i>) = ${br(tg, 2)}<small>Diferença entre a secante e a tangente: ${br(Math.abs(sec - tg), 3)} km/h por segundo. Encolha o Δt e ela vai a zero.</small>`;
    const [name, cls] = STATES[stateAt(t0)];
    if (pill.textContent !== name) { pill.textContent = name; pill.className = `de-state ${cls}`; }
    slT.input.value = t0; slT.el.querySelector('output').textContent = `${br(t0, 2)} s`;
    slU.input.value = st.u; slU.el.querySelector('output').textContent = fmtDt(st.u);
  });

  /* speedometer */
  {
    const G = q('.de-gauge'), CX = 60, CY = 48, GR = 38, VMAX = 120;
    const gp = (deg, r = GR) => [CX + r * Math.cos((deg * Math.PI) / 180), CY - r * Math.sin((deg * Math.PI) / 180)];
    const ang = (x) => 210 - (240 * Math.min(VMAX, x)) / VMAX;
    const arc = (d0, d1) => { const [x0, y0] = gp(d0), [x1, y1] = gp(d1); return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${GR} ${GR} 0 ${d0 - d1 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; };
    svg('path', { d: arc(210, -30), class: 'trk' }, G);
    const val = svg('path', { class: 'val' }, G);
    for (let k = 0; k <= VMAX; k += 20) { const [a, b] = gp(ang(k), 28), [c, e] = gp(ang(k), 32); svg('line', { x1: a, y1: b, x2: c, y2: e, class: 'tk' }, G); }
    const ndl = svg('line', { x1: CX, y1: CY, class: 'ndl' }, G);
    svg('circle', { cx: CX, cy: CY, r: 3.5, class: 'hub' }, G);
    const num = text(G, { x: CX, y: 70, class: 'num', 'text-anchor': 'middle' }, '0');
    text(G, { x: CX, y: 80, class: 'unit', 'text-anchor': 'middle' }, 'km/h');
    let lastN = '';
    subs.push(() => {
      const x = v(st.t), [nx, ny] = gp(ang(x), 30);
      setA(val, { d: arc(210, ang(x)) });
      setA(ndl, { x2: nx, y2: ny });
      const s = String(Math.round(x));
      if (s !== lastN) { num.textContent = s; lastN = s; }
    });
  }

  /* the v(t) chart */
  {
    const X = lin(0, T, 58, 618), Y = lin(0, 100, 318, 24);
    const S = svg('svg', { viewBox: '0 0 640 360', class: 'de-svg', role: 'img', 'aria-label': 'Gráfico da velocidade em função do tempo com a reta secante entre t e t mais delta t e a reta tangente no instante t.' }, q('#de-chart'));
    svg('rect', { x: 58, y: 24, width: 560, height: 294 }, svg('clipPath', { id: 'de-clip' }, svg('defs', {}, S)));
    for (let k = 0; k <= T; k += 2) { svg('line', { x1: X(k), y1: Y(0), x2: X(k), y2: Y(100), class: 'grid' }, S); text(S, { x: X(k), y: Y(0) + 18, class: 'sm', 'text-anchor': 'middle' }, String(k)); }
    for (let k = 20; k <= 100; k += 20) { svg('line', { x1: X(0), y1: Y(k), x2: X(T), y2: Y(k), class: 'grid' }, S); text(S, { x: X(0) - 8, y: Y(k) + 4, class: 'sm', 'text-anchor': 'end' }, String(k)); }
    svg('line', { x1: X(0), y1: Y(0), x2: X(T), y2: Y(0), class: 'axis' }, S);
    svg('line', { x1: X(0), y1: Y(0), x2: X(0), y2: Y(100), class: 'axis' }, S);
    text(S, { x: X(T) - 4, y: Y(0) - 8, class: 'sm', 'text-anchor': 'end' }, 't (s)');
    text(S, { x: X(0) + 6, y: 16, class: 'sm' }, 'v (km/h)');
    let d = '';
    for (let i = 0; i <= 280; i++) { const x = (i / 280) * T; d += `${i ? 'L' : 'M'} ${X(x).toFixed(1)} ${Y(v(x)).toFixed(1)} `; }
    const cursor = svg('line', { class: 'guide' }, S);
    svg('path', { d, class: 'curve' }, S);
    for (const [p, n] of [[P1, '1'], [P2, '2']]) {
      const g = svg('g', {}, S);
      svg('circle', { cx: X(p) - 16, cy: Y(v(p)) - 14, r: 9, class: 'ring' }, g);
      text(g, { x: X(p) - 16, y: Y(v(p)) - 10, class: 'ring-t', 'text-anchor': 'middle' }, n);
    }
    const clip = svg('g', { 'clip-path': 'url(#de-clip)' }, S);
    const tanL = svg('line', { class: 'tan' }, clip);
    const secL = svg('line', { class: 'sec' }, clip);
    const legT = svg('line', { class: 'leg' }, S), legV = svg('line', { class: 'leg' }, S);
    const dtT = text(S, { class: 'hue-t', 'text-anchor': 'middle' }, ''), dvT = text(S, { class: 'hue-t' }, '');
    const Qd = svg('circle', { r: 4.5, class: 'q' }, S), Pd = svg('circle', { r: 6, class: 'hue-f' }, S);
    const tanT = text(S, { class: 'sm' }, 'tangente');
    subs.push(() => {
      const t0 = st.t, d0 = dtOf(st.u), tq = t0 + d0 <= T ? t0 + d0 : t0 - d0, v0 = v(t0), vq = v(tq), sec = (vq - v0) / (tq - t0), tg = dv(t0);
      const a = Math.min(t0, tq) - 1.4, b = Math.max(t0, tq) + 1.4;
      setA(secL, { x1: X(a), y1: Y(v0 + sec * (a - t0)), x2: X(b), y2: Y(v0 + sec * (b - t0)) });
      setA(tanL, { x1: X(t0 - 2.2), y1: Y(v0 - tg * 2.2), x2: X(t0 + 2.2), y2: Y(v0 + tg * 2.2) });
      setA(legT, { x1: X(t0), y1: Y(v0), x2: X(tq), y2: Y(v0) });
      setA(legV, { x1: X(tq), y1: Y(v0), x2: X(tq), y2: Y(vq) });
      const wide = Math.abs(X(tq) - X(t0)) > 30;
      setA(dtT, { x: (X(t0) + X(tq)) / 2, y: Y(v0) + (vq >= v0 ? 17 : -8) });
      dtT.textContent = wide ? 'Δt' : '';
      setA(dvT, { x: X(tq) + (tq > t0 ? 6 : -24), y: (Y(v0) + Y(vq)) / 2 + 4 });
      dvT.textContent = wide && Math.abs(Y(vq) - Y(v0)) > 16 ? 'Δv' : '';
      setA(Pd, { cx: X(t0), cy: Y(v0) });
      setA(Qd, { cx: X(tq), cy: Y(vq) });
      setA(cursor, { x1: X(t0), y1: Y(0), x2: X(t0), y2: Y(v0) });
      setA(tanT, { x: X(Math.min(T - 1.2, t0 + 1.2)), y: Y(v0 + tg * (Math.min(T - 1.2, t0 + 1.2) - t0)) - 10, 'text-anchor': 'middle' });
      for (const n of [secL, legT, legV, dtT, dvT, Qd]) n.style.display = st.show.sec ? '' : 'none';
      tanL.style.display = tanT.style.display = st.show.tan ? '' : 'none';
    });
    dragTime(S, 58, 618, T, (x) => { setPlay(false); setT(x); });
  }

  /* the 3D car */
  const VIEWS = { tq: [[4.5, 2.2, 5.3], [0.2, 0.65, 0]], side: [[0.2, 1.05, 7.4], [0, 0.7, 0]], chase: [[-7.4, 2.4, 2.3], [1.6, 0.7, 0]] };
  const s = stage(q('#de-car'), { camera: VIEWS.tq[0], target: VIEWS.tq[1], fov: 40, label: 'Carro em uma estrada. A estrada passa mais rápido quando a velocidade cresce, as luzes de freio acendem quando a aceleração é negativa e uma seta mostra a aceleração.', hint: 'arraste para girar a câmera' });
  if (s) {
    const ink = () => s.color('--ink'), surf = () => s.color('--surface');
    // road: one 8 m period of lane paint on a canvas, repeated, and scrolled by the distance the car has driven
    const ROAD_L = 96, PER = 8, LANE = -1.7;
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 128;
    const roadTex = new THREE.CanvasTexture(cv);
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.repeat.set(ROAD_L / PER, 1);
    roadTex.colorSpace = THREE.SRGBColorSpace;
    roadTex.anisotropy = 8;
    const paintRoad = () => {
      const c = cv.getContext('2d');
      c.fillStyle = `#${mix('#5d6470', surf(), 0.12).getHexString()}`; // mid-grey asphalt: contrasts with both themes and with white paint
      c.fillRect(0, 0, 256, 128);
      c.fillStyle = '#f2efe6'; // lane paint: near-white reads on mid-grey in both themes
      c.fillRect(0, 62, 96, 4);
      c.fillRect(0, 9, 256, 3);
      c.fillRect(0, 116, 256, 3);
      roadTex.needsUpdate = true;
    };
    paintRoad();
    onTheme(paintRoad);
    const fc = document.createElement('canvas');
    fc.width = 256; fc.height = 4;
    { const c = fc.getContext('2d'), g = c.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, '#000'); g.addColorStop(0.32, '#fff'); g.addColorStop(0.68, '#fff'); g.addColorStop(1, '#000'); c.fillStyle = g; c.fillRect(0, 0, 256, 4); }
    const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_L, 8).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: roadTex, alphaMap: new THREE.CanvasTexture(fc), transparent: true, depthWrite: false, roughness: 0.92 }));
    road.position.z = LANE;
    const sc = document.createElement('canvas');
    sc.width = sc.height = 64;
    { const c = sc.getContext('2d'), g = c.createRadialGradient(32, 32, 3, 32, 32, 32); g.addColorStop(0, '#fff'); g.addColorStop(1, '#000'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: new THREE.CanvasTexture(sc), transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    shadow.position.y = 0.01;
    shadow.renderOrder = 1;
    // roadside posts every 10 m, scrolled with the road
    const posts = new THREE.Group();
    const postGeo = new THREE.BoxGeometry(0.12, 0.9, 0.12).translate(0, 0.45, 0), capGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14).translate(0, 0.84, 0);
    const mPost = tint(mat('#888'), () => mix(surf(), ink(), 0.28)), mCap = tint(mat('#888'), () => s.hue());
    for (let i = -6; i <= 6; i++) {
      const p = new THREE.Mesh(postGeo, mPost), c = new THREE.Mesh(capGeo, mCap);
      p.position.set(i * 10, 0, LANE - 4.4);
      c.position.copy(p.position);
      posts.add(p, c);
    }
    s.add(road, shadow, posts);

    // low-poly car, 4,4 m long, built from an extruded side profile (front at +x)
    const car = new THREE.Group(), body = new THREE.Group();
    car.add(body);
    s.add(car);
    const mBody = tint(mat('#888', { roughness: 0.38, metalness: 0.2 }), () => s.hue());
    const mGlass = tint(mat('#888', { roughness: 0.18, metalness: 0.35 }), () => mix(hueColor(C.glass), '#0d1526', 0.62)); // tinted glass stays dark in both themes
    const mTire = tint(mat('#888', { roughness: 0.85 }), () => mix(s.color('--muted'), '#000', 0.55));
    const mRim = tint(mat('#888', { roughness: 0.3, metalness: 0.5 }), () => mix(surf(), ink(), 0.18));
    const mHead = new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffe7a8, emissiveIntensity: 0.55, roughness: 0.3 }); // lamp light, same in both themes
    const mTail = tint(mat('#888', { roughness: 0.3 }), () => hueColor(C.lamp));
    const sh = new THREE.Shape();
    sh.moveTo(-2.18, 0.36);
    sh.lineTo(-1.8, 0.36);
    sh.absarc(-1.35, 0.36, 0.45, Math.PI, 0, true); // rear wheel arch
    sh.lineTo(0.9, 0.36);
    sh.absarc(1.35, 0.36, 0.45, Math.PI, 0, true); // front wheel arch
    sh.lineTo(2.1, 0.36);
    sh.lineTo(2.2, 0.56);
    sh.lineTo(2.12, 0.78);
    sh.lineTo(1.05, 0.94); // hood
    sh.lineTo(-1.8, 0.98); // beltline
    sh.lineTo(-2.14, 0.92);
    sh.lineTo(-2.22, 0.6);
    sh.closePath();
    const cab = new THREE.Shape();
    cab.moveTo(1.0, 0.92);
    cab.lineTo(0.28, 1.36);
    cab.lineTo(-1.02, 1.38);
    cab.lineTo(-1.78, 0.96);
    cab.closePath();
    body.add(
      new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2, curveSegments: 10 }).translate(0, 0, -0.8), mBody),
      new THREE.Mesh(new THREE.ExtrudeGeometry(cab, { depth: 1.44, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 1 }).translate(0, 0, -0.72), mGlass),
    );
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.06, 1.56), mBody);
    roof.position.set(-0.37, 1.41, 0);
    body.add(roof);
    const headGeo = new THREE.BoxGeometry(0.06, 0.13, 0.36), tailGeo = new THREE.BoxGeometry(0.06, 0.12, 0.38);
    for (const z of [-0.52, 0.52]) {
      const hl = new THREE.Mesh(headGeo, mHead), tl = new THREE.Mesh(tailGeo, mTail);
      hl.position.set(2.21, 0.64, z);
      tl.position.set(-2.25, 0.74, z);
      body.add(hl, tl);
    }
    const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 28).rotateX(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.25, 18).rotateX(Math.PI / 2);
    const spokeGeo = new THREE.BoxGeometry(0.38, 0.055, 0.26);
    const wheels = [];
    for (const [x, z] of [[1.35, 0.79], [1.35, -0.79], [-1.35, 0.79], [-1.35, -0.79]]) {
      const w = new THREE.Group();
      w.position.set(x, 0.36, z);
      w.add(new THREE.Mesh(tireGeo, mTire), new THREE.Mesh(rimGeo, mRim));
      for (let i = 0; i < 3; i++) { const sp = new THREE.Mesh(spokeGeo, mTire); sp.rotation.z = (i * Math.PI) / 3; w.add(sp); }
      car.add(w);
      wheels.push(w);
    }
    // acceleration arrow above the roof: length ∝ |a|, green forward when speeding up, orange backward when braking
    const mUp = tint(mat('#888', { roughness: 0.4 }), () => hueColor(C.up)), mDown = tint(mat('#888', { roughness: 0.4 }), () => hueColor(C.down));
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 12).rotateZ(-Math.PI / 2).translate(0.5, 0, 0), mUp);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.38, 16).rotateZ(-Math.PI / 2).translate(0.19, 0, 0), mUp);
    const arrow = new THREE.Group();
    arrow.add(shaft, head);
    arrow.position.set(0, 2.0, 0);
    car.add(arrow);
    const lA = s.label('', [0, 2.42, 0], { onClick: (e) => pick.show(e.currentTarget, 'acc') });
    s.label('<i>v</i>(<i>t</i>)', [2.5, 1.15, 1.0], { cls: 'math', onClick: (e) => pick.show(e.currentTarget, 'car') });
    let lastTxt = '', lastSign = 0;
    subs.push(() => {
      const t0 = st.t, x = xAt(t0), a = dv(t0);
      roadTex.offset.x = (x / PER) % 1;
      posts.position.x = -(x % 10);
      for (const w of wheels) w.rotation.z = -x / 0.36;
      body.rotation.z = a * 0.0011; // squat when speeding up, dive when braking
      const L = 0.35 + (Math.abs(a) / 18) * 1.5, sign = a < 0 ? -1 : 1;
      arrow.visible = lA.visible = st.show.arrow && Math.abs(a) > 0.4;
      shaft.scale.x = L;
      head.position.x = L;
      arrow.rotation.y = sign < 0 ? Math.PI : 0;
      if (sign !== lastSign) { shaft.material = head.material = sign < 0 ? mDown : mUp; lastSign = sign; }
      mTail.emissive.copy(mTail.color);
      mTail.emissiveIntensity = a < -0.5 ? 0.25 + Math.min(1, -a / 10) * 0.75 : 0.04;
      lA.position.set(sign * L * 0.5, 2.42, 0);
      const txt = `a = ${sgn(a / 3.6, 1)} m/s²`;
      if (txt !== lastTxt) { lA.element.textContent = txt; lastTxt = txt; }
      if (!st.play) pick.refresh(); // never rebuild the card every frame: its link must stay clickable
    });
    cam.on((k) => flyTo(s, VIEWS[k]));
  } else {
    cam.el.querySelectorAll('button').forEach((b) => { b.disabled = true; });
  }

  /* guided tour: drives the same controls, and any input hands control back */
  const capEl = q('.de-cap'), capSr = q('#de-cap-sr');
  let tourId = 0;
  const caption = (msg) => { capEl.textContent = msg; capEl.hidden = !msg; capSr.textContent = msg; };
  const endTour = () => { tourId++; press(btn('tour'), false); caption(''); };
  async function tour() {
    const id = ++tourId, alive = () => id === tourId;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const anim = (a, b, ms, fn) => new Promise((r) => tween(a, b, ms, (x) => { if (alive()) fn(x); }, r));
    press(btn('tour'), true);
    setPlay(false);
    if (s) { cam.set('tq', false); flyTo(s, VIEWS.tq); }
    const steps = [
      async () => { caption('Ponto 1: a velocidade sobe devagar.'); await anim(st.u, 0, 400, setU); await anim(st.t, P1, 900, setT); await wait(1700); },
      async () => { caption('Δv dividido por Δt é a inclinação da secante.'); await wait(2200); },
      async () => { caption('Δt tendendo a zero: a secante gira até virar a tangente.'); await anim(0, 100, 2600, setU); await wait(1500); },
      async () => { caption('Ponto 2: mesmo Δt, variação de velocidade muito maior.'); await anim(100, 0, 500, setU); await anim(st.t, P2, 1000, setT); await wait(1800); },
      async () => { caption('A tangente do ponto 2 é bem mais inclinada: o carro acelera mais.'); await anim(0, 100, 2200, setU); await wait(1800); },
      async () => { caption('A derivada dá essa taxa em cada instante. Veja o carro andar.'); if (s) { cam.set('chase', false); flyTo(s, VIEWS.chase, 1200); } setT(0); setPlay(true); while (alive() && st.play) await wait(150); },
      async () => { caption('Sua vez: arraste o tempo ou encolha o Δt.'); if (s) { cam.set('tq', false); flyTo(s, VIEWS.tq); } await wait(2600); },
    ];
    for (const fn of steps) { if (!alive()) return; await fn(); }
    if (alive()) endTour();
  }
  btn('tour').addEventListener('click', () => { if (btn('tour').getAttribute('aria-pressed') === 'true') { endTour(); setPlay(false); } else tour(); });
  const col = q('.stage-col');
  const interrupt = (e) => { if (btn('tour').getAttribute('aria-pressed') === 'true' && !e.target.closest('[data-k="tour"]')) endTour(); };
  col.addEventListener('pointerdown', interrupt);
  col.addEventListener('keydown', interrupt);
  col.addEventListener('wheel', interrupt, { passive: true });
}

/* ================================== 3. a(t) = v′(t): a derivada em todo ponto ===== */
{
  const SPOTS = [
    ['acc', 'Acelera', P1, 1551], ['more', 'Acelera mais', P2, 1551], ['stop', 'Para de acelerar', TMAX, 1551],
    ['brake', 'Freia', 9.75, 1551], ['brakeEnd', 'Para de frear', TMIN, 1560], ['again', 'Volta a acelerar', 13.2, 1560],
  ];
  const t = el(`
<article class="topic flip" id="de-t-aceleracao">
  <div class="stage-col">
    <div class="stage short" id="de-acc"></div>
    <p class="stage-cap">A inclinação de <i>v</i>(<i>t</i>) em cada instante vira um novo gráfico. Acima do zero o carro acelera; abaixo, freia. O cursor segue o tempo do simulador.</p>
    <div class="controls"><div class="seg" role="group" aria-label="Trechos do movimento"><span class="seg-label">Ir para</span>${SPOTS.map(([k, name]) => `<button type="button" class="btn sm" data-k="${k}">${name}</button>`).join('')}</div></div>
  </div>
  <div class="explain">
    <p class="kicker">Ponto 1 × ponto 2 · a derivada em todo ponto</p>
    <h3>O carro acelera mais no trecho 2</h3>
    <p>Use a mesma ideia no ponto 2: para o mesmo Δ<i>t</i>, a velocidade varia bem mais do que no ponto 1. A reta tangente ali é mais inclinada e confirma: esse trecho cresce mais rápido, então o carro acelera mais no trecho 2 do que no trecho 1.</p>
    <p>É isso que uma derivada faz: dá a taxa de variação em qualquer ponto que você quiser. Juntando a inclinação de cada instante nasce outro gráfico, a aceleração <i>a</i>(<i>t</i>) = <i>v</i>′(<i>t</i>). Lido da esquerda para a direita: o carro acelera, acelera mais, para de acelerar, começa a frear, para de frear e volta a acelerar.</p>
    <div class="stats">
      <div class="stat"><b>${br(dv(P1), 1)}</b><span>inclinação no ponto 1 (km/h por s)</span></div>
      <div class="stat"><b>${br(dv(P2), 1)}</b><span>inclinação no ponto 2 (km/h por s)</span></div>
      <div class="stat"><b>${br(dv(P2) / dv(P1), 1)}×</b><span>quanto o ponto 2 é mais íngreme</span></div>
    </div>
    <div class="pick" hidden></div>
    <p class="note fact">No ponto mais alto e no mais baixo da velocidade, a tangente fica horizontal e a derivada vale zero. É assim que o cálculo encontra máximos e mínimos.</p>
    ${vlinks([[1516, 'A mesma ideia no ponto 2'], [1523, 'Maior variação de v para o mesmo Δt'], [1530, 'Verificado pela reta tangente'], [1537, 'O carro acelera mais no trecho 2'], [1544, 'A derivada dá a taxa em qualquer ponto'], [1551, 'Acelera, acelera mais, para de acelerar, freia'], [1560, 'Para de frear e volta a acelerar']])}
  </div>
</article>`);
  root.append(t);
  const q = (sel) => t.querySelector(sel);
  const BODY = {
    acc: () => `Em t = ${br(P1, 1)} s a aceleração é ${br(dv(P1), 1)} km/h por segundo: a velocidade sobe devagar.`,
    more: () => `Em t = ${br(P2, 0)} s a aceleração chega a ${br(dv(P2), 1)} km/h por segundo, cerca de ${br(dv(P2) / 3.6, 1)} m/s².`,
    stop: () => `Em t = ${br(TMAX, 0)} s a velocidade atinge o máximo, ${br(v(TMAX), 0)} km/h. A tangente fica horizontal: a = 0.`,
    brake: () => `Entre ${br(TMAX, 0)} s e ${br(TMIN, 1)} s a aceleração é negativa, até ${sgn(dv(9.75), 1)} km/h por segundo, e a curva de velocidade desce.`,
    brakeEnd: () => `Em t = ${br(TMIN, 1)} s a velocidade chega ao mínimo, ${br(v(TMIN), 0)} km/h, e a aceleração volta a zero.`,
    again: () => 'Depois do mínimo a aceleração fica positiva de novo e a velocidade torna a subir.',
  };
  const box = q('.pick');
  q('.controls').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]');
    if (!b) return;
    const [k, name, at, seg] = SPOTS.find((x) => x[0] === b.dataset.k);
    q('.controls').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    tween(st.t, at, 700, setT);
    box.innerHTML = `<h4>${name}</h4><p>${BODY[k]()}</p>${vlink(seg, seg === 1551 ? 'Acelera, acelera mais, para de acelerar, freia' : 'Para de frear e volta a acelerar')}`;
    box.hidden = false;
  });
  const X = lin(0, T, 58, 618), Y = lin(-20, 20, 318, 30);
  const S = svg('svg', { viewBox: '0 0 640 360', class: 'de-svg', role: 'img', 'aria-label': 'Gráfico da aceleração, a derivada da velocidade: positiva no começo com um pico, zero no máximo da velocidade, negativa na freada, zero no mínimo e positiva de novo.' }, q('#de-acc'));
  for (let k = 0; k <= T; k += 2) { svg('line', { x1: X(k), y1: Y(-20), x2: X(k), y2: Y(20), class: 'grid' }, S); text(S, { x: X(k), y: Y(-20) + 18, class: 'sm', 'text-anchor': 'middle' }, String(k)); }
  for (const k of [-20, -10, 10, 20]) { svg('line', { x1: X(0), y1: Y(k), x2: X(T), y2: Y(k), class: 'grid' }, S); text(S, { x: X(0) - 8, y: Y(k) + 4, class: 'sm', 'text-anchor': 'end' }, k < 0 ? `−${-k}` : String(k)); }
  text(S, { x: X(0) - 8, y: Y(0) + 4, class: 'sm', 'text-anchor': 'end' }, '0');
  text(S, { x: X(T) - 4, y: Y(-20) - 8, class: 'sm', 'text-anchor': 'end' }, 't (s)');
  text(S, { x: X(0) + 6, y: 20, class: 'sm' }, 'a = v′(t)  (km/h por s)');
  let pos = `M ${X(0)} ${Y(0)} `, neg = pos, curve = '';
  for (let i = 0; i <= 280; i++) {
    const x = (i / 280) * T, a = dv(x);
    pos += `L ${X(x).toFixed(1)} ${Y(Math.max(0, a)).toFixed(1)} `;
    neg += `L ${X(x).toFixed(1)} ${Y(Math.min(0, a)).toFixed(1)} `;
    curve += `${i ? 'L' : 'M'} ${X(x).toFixed(1)} ${Y(a).toFixed(1)} `;
  }
  svg('path', { d: `${pos}L ${X(T)} ${Y(0)} Z`, class: 'soft de-up' }, S);
  svg('path', { d: `${neg}L ${X(T)} ${Y(0)} Z`, class: 'soft de-down' }, S);
  svg('line', { x1: X(0), y1: Y(0), x2: X(T), y2: Y(0), class: 'axis' }, S);
  svg('line', { x1: X(0), y1: Y(-20), x2: X(0), y2: Y(20), class: 'axis' }, S);
  for (const [tt, lab] of [[TMAX, 'v máxima'], [TMIN, 'v mínima']]) {
    svg('line', { x1: X(tt), y1: Y(-20), x2: X(tt), y2: Y(20), class: 'guide' }, S);
    text(S, { x: X(tt), y: Y(20) - 6, class: 'sm', 'text-anchor': 'middle' }, lab);
  }
  text(S, { x: X(4.6), y: Y(9), class: 'hue-t de-up', 'text-anchor': 'middle' }, 'acelera');
  text(S, { x: X(9.75), y: Y(-8), class: 'hue-t de-down', 'text-anchor': 'middle' }, 'freia');
  svg('path', { d: curve, class: 'curve' }, S);
  for (const [p, n] of [[P1, '1'], [P2, '2']]) {
    svg('circle', { cx: X(p), cy: Y(dv(p)) - 18, r: 9, class: 'ring' }, S);
    text(S, { x: X(p), y: Y(dv(p)) - 14, class: 'ring-t', 'text-anchor': 'middle' }, n);
    svg('circle', { cx: X(p), cy: Y(dv(p)), r: 3.5, class: 'hue-f' }, S);
  }
  const cur = svg('line', { class: 'guide' }, S);
  const dot = svg('circle', { r: 6, class: 'hue-f' }, S);
  const lab = text(S, { class: 'hue-t' }, '');
  subs.push(() => {
    const a = dv(st.t), x = X(st.t), y = Y(a), right = x > 500;
    setA(cur, { x1: x, y1: Y(-20), x2: x, y2: Y(20) });
    setA(dot, { cx: x, cy: y });
    setA(lab, { x: x + (right ? -10 : 10), y: y + (a >= 0 ? 20 : -12), 'text-anchor': right ? 'end' : 'start' });
    lab.textContent = `${sgn(a, 1)} km/h por s`;
  });
  dragTime(S, 58, 618, T, setT);
}

redraw();
