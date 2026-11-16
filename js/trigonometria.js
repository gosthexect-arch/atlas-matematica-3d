// Chapter 5 · Trigonometria (12:20–14:39 of the video): the right triangle's names, sine and cosine on the
// circle of radius 1, the tangent line and secant, similar triangles, and sen²θ + cos²θ = 1 (with the author's erratum).
import { THREE, mount, el, css, vlink, vlinks, stage, slider, segmented, hueColor, onTheme, reduced, mat, tween, br } from './core.js';

const root = mount('trigonometria');
const T = { sin: 350, cos: 220, tan: 40, hip: 188 }; // hues: seno, cosseno, tangente, hipotenusa/raio (chapter)

css(`
#trigonometria .pick[hidden] { display: none; }
#trigonometria .tr-sin { --hue: hsl(${T.sin} var(--hue-s) var(--hue-l)); --hue-soft: hsl(${T.sin} 55% var(--hue-soft-l)); }
#trigonometria .tr-cos { --hue: hsl(${T.cos} var(--hue-s) var(--hue-l)); --hue-soft: hsl(${T.cos} 55% var(--hue-soft-l)); }
#trigonometria .tr-tan { --hue: hsl(${T.tan} var(--hue-s) var(--hue-l)); --hue-soft: hsl(${T.tan} 55% var(--hue-soft-l)); }
#trigonometria .lbl .tr-sin, #trigonometria .lbl .tr-cos, #trigonometria .lbl .tr-tan, #trigonometria .lbl .tr-hip,
#trigonometria .formula .tr-sin, #trigonometria .formula .tr-cos, #trigonometria .formula .tr-tan { color: var(--hue); }
#trigonometria .lbl.hot:hover span, #trigonometria .lbl.hot.on span { color: inherit; }
#trigonometria .tr-svg text { font: 500 13px/1 var(--f-body); fill: var(--ink); }
#trigonometria .tr-svg .math { font: italic 400 16px/1 var(--f-math); }
#trigonometria .tr-svg .small { font-size: 12px; }
#trigonometria .tr-svg .ink { stroke: var(--ink); fill: none; }
#trigonometria .tr-svg .axis { stroke: var(--muted); fill: none; stroke-width: 1; opacity: .6; }
#trigonometria .tr-svg .faint { stroke: var(--muted); fill: none; stroke-dasharray: 4 4; }
#trigonometria .tr-svg .hue-s { stroke: var(--hue); fill: none; }
#trigonometria .tr-svg .hue-f { fill: var(--hue); }
#trigonometria .tr-svg .soft { fill: var(--hue-soft); stroke: none; }
#trigonometria .tr-svg .hue-t { fill: var(--hue); }
#trigonometria .tr-svg .muted-t { fill: var(--muted); }
#trigonometria .tr-svg .dot { fill: var(--ink); }
#trigonometria .tr-svg .fade { opacity: .18; }
#trigonometria #tr-tan text { font-size: 16px; }
#trigonometria #tr-tan .math { font-size: 18px; }
#trigonometria .tr-etym { display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; font: 700 1.5rem/1.2 var(--f-display); }
#trigonometria .tr-etym span { color: var(--hue); }
#trigonometria .tr-etym small { font: 500 13px/1 var(--f-body); color: var(--muted); margin-right: 10px; }
`);

/* ------------------------------------------------------------ shared local helpers ---- */
const themed = [];
const tint = (m, fn) => { m.color.set(fn()); themed.push([m, fn]); return m; };
onTheme(() => themed.forEach(([m, fn]) => m.color.set(fn())));
const hc = (h) => () => hueColor(h);
const rad = (d) => (d * Math.PI) / 180;
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
const NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  parent?.appendChild(n);
  return n;
}
const setA = (n, attrs) => { for (const k in attrs) n.setAttribute(k, attrs[k]); };
/** Arc path around (cx, cy) from angle a0 to a1 (math angles, radians, y up on screen). */
function arcPath(cx, cy, r, a0, a1) {
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0, sweep = a1 > a0 ? 0 : 1;
  return `M ${cx + r * Math.cos(a0)} ${cy - r * Math.sin(a0)} A ${r} ${r} 0 ${large} ${sweep} ${cx + r * Math.cos(a1)} ${cy - r * Math.sin(a1)}`;
}
/** Rod (thin cylinder) between two points, updated in place. */
const UP = new THREE.Vector3(0, 1, 0), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();
const rodGeo = new THREE.CylinderGeometry(1, 1, 1, 10);
function rod(colorFn, r = 0.022) {
  const m = new THREE.Mesh(rodGeo, tint(mat('#888', { roughness: 0.4 }), colorFn));
  m.userData.set = (p, q) => {
    _a.set(...p); _b.set(...q);
    _d.subVectors(_b, _a);
    const L = _d.length();
    m.visible = L > 1e-4;
    if (!m.visible) return;
    m.position.addVectors(_a, _b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, _d.divideScalar(L));
    m.scale.set(r, L, r);
  };
  return m;
}
console.assert(Math.abs(Math.sin(rad(30)) - 0.5) < 1e-12 && Math.abs(Math.cos(rad(60)) - 0.5) < 1e-12, 'trigonometria: sen 30 = cos 60');

/* ====================================== 1. Tri-gono-metria: os nomes dos lados ===== */
{
  const t = el(`
<article class="topic" id="tr-t-nomes">
  <div class="stage-col">
    <div class="stage" id="tr-nomes"></div>
    <p class="stage-cap">Mude o ângulo θ de vértice: hipotenusa fica, oposto e adjacente trocam de lugar.</p>
    <div class="controls"></div>
  </div>
  <div class="explain">
    <p class="kicker">Trigonometria · o estudo dos triângulos</p>
    <h3>Três, ângulos e medidas</h3>
    <p>Seu cérebro já está fritando em formato triangular, mas triângulo é importante demais para mudar de assunto. O estudo mais específico da geometria dos triângulos se chama trigonometria:</p>
    <p class="tr-etym" aria-label="tri: três; gono: ângulos; metria: medidas"><span>tri</span><small>três</small><span>gono</span><small>ângulos</small><span>metria</span><small>medidas</small></p>
    <p>Num triângulo retângulo de lados <i>a</i>, <i>b</i>, <i>c</i> e ângulo <i>θ</i>, a <b>hipotenusa</b> é o lado oposto ao ângulo de 90°. Escolhido um ângulo, há um <b>cateto oposto</b> a ele e um <b>cateto adjacente</b>, que encosta nele.</p>
    <div class="formula" id="tr-nomes-f" aria-live="polite"></div>
    ${vlinks([[740, 'Cérebro fritando em formato triangular'], [749, 'Trigonometria: tri, gono, metria'], [755, 'Triângulo retângulo de lados a, b, c e ângulo θ'], [762, 'Hipotenusa: oposta ao ângulo de 90°'], [768, 'Cateto oposto, adjacente e o seno'], [775, 'Cosseno: adjacente ÷ hipotenusa']])}
  </div>
</article>`);
  root.append(t);
  const $ = (id) => t.querySelector(id);
  const S = svg('svg', { viewBox: '0 0 400 300', class: 'tr-svg', role: 'img', 'aria-label': 'Triângulo retângulo com a hipotenusa, o cateto oposto e o cateto adjacente ao ângulo theta rotulados.' }, $('#tr-nomes'));
  const fill = svg('polygon', { class: 'soft' }, S);
  // sides by letter: a = hypotenuse (left→top), b = vertical (right corner→top), c = bottom (left→right corner)
  const side = { a: svg('line', { 'stroke-width': 5, 'stroke-linecap': 'round', class: 'hue-s' }, S), b: svg('line', { 'stroke-width': 5, 'stroke-linecap': 'round', class: 'hue-s' }, S), c: svg('line', { 'stroke-width': 5, 'stroke-linecap': 'round', class: 'hue-s' }, S) };
  const mark = svg('polyline', { class: 'ink', 'stroke-width': 1.5 }, S);
  const arc = svg('path', { class: 'ink', 'stroke-width': 1.6 }, S);
  const thT = svg('text', { class: 'math', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, S);
  const ninety = svg('text', { class: 'small muted-t', 'text-anchor': 'middle' }, S);
  const lbl = { a: svg('text', { class: 'math', 'text-anchor': 'middle' }, S), b: svg('text', { class: 'math', 'text-anchor': 'start' }, S), c: svg('text', { class: 'math', 'text-anchor': 'middle' }, S) };
  for (const k in lbl) lbl[k].textContent = k;
  const tag = { a: svg('text', { class: 'small hue-t', 'text-anchor': 'middle' }, S), b: svg('text', { class: 'small hue-t', 'text-anchor': 'start' }, S), c: svg('text', { class: 'small hue-t', 'text-anchor': 'middle' }, S) };

  const st = { th: 30, at: 'left' };
  const seg = segmented({ label: 'θ no vértice', value: 'left', options: [{ value: 'left', label: 'da esquerda' }, { value: 'top', label: 'de cima' }] });
  const sl = slider({ label: 'Ângulo da esquerda', min: 15, max: 75, step: 1, value: 30, format: (v) => `${v}°` });
  $('.controls').append(seg.el, sl.el);
  const ROLE = { hip: ['hipotenusa', T.hip], op: ['cateto oposto', T.sin], adj: ['cateto adjacente', T.cos] };
  function draw() {
    const r = rad(st.th), L = 250, c = L * Math.cos(r), b = L * Math.sin(r);
    const x0 = (400 - c) / 2 - 60, y0 = Math.min(262, 172 + b / 2); // room on the right for the leg's name; centered vertically
    const B = [x0, y0], R = [x0 + c, y0], Tp = [x0 + c, y0 - b];
    setA(fill, { points: `${B} ${R} ${Tp}` });
    const roles = st.at === 'left' ? { a: 'hip', b: 'op', c: 'adj' } : { a: 'hip', b: 'adj', c: 'op' };
    const seg2 = { a: [B, Tp], b: [R, Tp], c: [B, R] };
    for (const k of 'abc') {
      const [p, q] = seg2[k], [name, h] = ROLE[roles[k]];
      setA(side[k], { x1: p[0], y1: p[1], x2: q[0], y2: q[1], style: `--h:${h}` });
      setA(tag[k], { style: `--h:${h}` });
      tag[k].textContent = name;
    }
    setA(lbl.a, { x: (B[0] + Tp[0]) / 2 - 22 * Math.sin(r), y: (B[1] + Tp[1]) / 2 - 22 * Math.cos(r) });
    setA(tag.a, { x: (B[0] + Tp[0]) / 2 - 40 * Math.sin(r), y: (B[1] + Tp[1]) / 2 - 40 * Math.cos(r) });
    setA(lbl.b, { x: R[0] + 12, y: (R[1] + Tp[1]) / 2 });
    setA(tag.b, { x: R[0] + 12, y: (R[1] + Tp[1]) / 2 + 18 });
    setA(lbl.c, { x: (B[0] + R[0]) / 2, y: y0 + 20 });
    setA(tag.c, { x: (B[0] + R[0]) / 2, y: y0 + 34 });
    setA(mark, { points: `${R[0] - 16},${R[1]} ${R[0] - 16},${R[1] - 16} ${R[0]},${R[1] - 16}` });
    setA(ninety, { x: R[0] - 28, y: R[1] - 22 });
    ninety.textContent = '90°';
    const deg = st.at === 'left' ? st.th : 90 - st.th;
    if (st.at === 'left') {
      setA(arc, { d: arcPath(B[0], B[1], 42, 0, r) });
      setA(thT, { x: B[0] + 58 * Math.cos(r / 2), y: B[1] - 58 * Math.sin(r / 2) });
    } else {
      // at the top vertex the angle opens from the hypotenuse (direction to B is r − π) to straight down (−π/2)
      const a0 = r - Math.PI, a1 = -Math.PI / 2;
      setA(arc, { d: arcPath(Tp[0], Tp[1], 42, a0, a1) });
      const mid = (a0 + a1) / 2;
      setA(thT, { x: Tp[0] + 58 * Math.cos(mid), y: Tp[1] - 58 * Math.sin(mid) });
    }
    thT.textContent = 'θ';
    const op = roles.b === 'op' ? 'b' : 'c', adj = op === 'b' ? 'c' : 'b';
    const sv = Math.sin(rad(deg)), cv = Math.cos(rad(deg));
    $('#tr-nomes-f').innerHTML = `sen <i>θ</i> = <span class="frac"><span class="tr-sin">cateto oposto</span><span>hipotenusa</span></span> = <span class="frac"><span><i>${op}</i></span><span><i>a</i></span></span> = ${br(sv, 3)}` +
      `<br>cos <i>θ</i> = <span class="frac"><span class="tr-cos">cateto adjacente</span><span>hipotenusa</span></span> = <span class="frac"><span><i>${adj}</i></span><span><i>a</i></span></span> = ${br(cv, 3)}` +
      `<small>θ = ${deg}° · com a hipotenusa valendo 1: ${op} = ${br(sv, 3)} e ${adj} = ${br(cv, 3)}</small>`;
  }
  seg.on((v) => { st.at = v; draw(); });
  sl.on((v) => { st.th = v; draw(); });
  draw();
}

/* ================================ 2. Círculo de raio 1, hélice e as duas ondas ===== */
{
  const t = el(`
<article class="topic flip" id="tr-t-circulo">
  <div class="stage-col">
    <div class="stage" id="tr-circulo"></div>
    <p class="stage-cap">O ponto gira no círculo de raio 1 enquanto o círculo anda no tempo. Na parede fica a sombra da altura (seno); no chão, a da largura (cosseno).</p>
    <div class="controls"></div>
    <div class="pick" hidden aria-live="polite"></div>
  </div>
  <div class="explain">
    <p class="kicker">Seno e cosseno no círculo</p>
    <h3>A altura e a largura de um ponto que gira</h3>
    <p>O <b>seno</b> de θ é a razão entre o cateto oposto e a hipotenusa. O <b>cosseno</b> é a razão entre o cateto adjacente e a hipotenusa. No círculo de raio 1 a hipotenusa é o próprio raio, que vale 1: o seno vira a altura do ponto e o cosseno, a distância na horizontal.</p>
    <div class="stats">
      <div class="stat"><b id="tr-ci-th">0</b><span>ângulo θ</span></div>
      <div class="stat tr-sin"><b id="tr-ci-s">0</b><span>sen θ = oposto ÷ 1</span></div>
      <div class="stat tr-cos"><b id="tr-ci-c">0</b><span>cos θ = adjacente ÷ 1</span></div>
    </div>
    <p class="note fact">Andando no tempo, o ponto descreve uma hélice. Vista de lado ela é a onda do seno; vista de cima, a do cosseno. Por isso as duas ondas têm a mesma forma, deslocadas de 90°.</p>
    ${vlinks([[768, 'Seno: cateto oposto ÷ hipotenusa'], [775, 'Cosseno: cateto adjacente ÷ hipotenusa'], [783, 'Um círculo de raio 1']])}
  </div>
</article>`);
  root.append(t);
  const show = picker(t);
  const $ = (id) => t.querySelector(id);
  const K = 0.3, TMAX = 4 * Math.PI, SEG = 360; // depth per radian, two full turns
  const st = { deg: 40, play: false };
  const sl = slider({ label: 'Ângulo θ', min: 0, max: 720, step: 1, value: st.deg, format: (v) => `${v}°` });
  const playBtn = el(`<div class="btn-row"><button type="button" class="btn sm" aria-pressed="false">Girar</button></div>`);
  $('.controls').append(sl.el, playBtn);
  const report = () => {
    const r = rad(st.deg);
    $('#tr-ci-th').textContent = `${Math.round(st.deg)}°`;
    $('#tr-ci-s').textContent = br(Math.sin(r), 3);
    $('#tr-ci-c').textContent = br(Math.cos(r), 3);
  };
  const s = stage($('#tr-circulo'), { camera: [3.9, 2.3, 5.0], target: [-0.35, -0.3, -1.75], label: 'Círculo de raio 1 com um ponto girando; o seno e o cosseno aparecem como ondas projetadas numa parede e no chão.' });
  let upd = report;
  if (s) {
    const WX = -1.6, FY = -1.6, LEN = TMAX * K;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(LEN + 1, 2.7), tint(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }), hc(T.sin)));
    wall.rotation.y = Math.PI / 2;
    wall.position.set(WX, 0, -LEN / 2);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(2.7, LEN + 1), tint(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }), hc(T.cos)));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, FY, -LEN / 2);
    s.add(wall, floor);
    const curveMesh = (fn, colorFn, r, opacity = 1) => {
      const pts = [];
      for (let i = 0; i <= SEG; i++) pts.push(fn((i / SEG) * TMAX));
      const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), SEG, r, 6, false);
      const m = new THREE.Mesh(g, tint(new THREE.MeshStandardMaterial({ roughness: 0.5, transparent: opacity < 1, opacity }), colorFn));
      return s.add(m);
    };
    curveMesh((u) => new THREE.Vector3(WX + 0.01, Math.sin(u), -K * u), hc(T.sin), 0.016);
    curveMesh((u) => new THREE.Vector3(Math.cos(u), FY + 0.01, -K * u), hc(T.cos), 0.016);
    const traced = curveMesh((u) => new THREE.Vector3(Math.cos(u), Math.sin(u), -K * u), () => s.hue(), 0.02);
    s.label('<span class="tr-sin">onda do seno</span>', [WX, 1.4, -LEN + 0.2], { onClick: (e) => show(e.currentTarget, 'A onda do seno', 'Cada ponto da parede guarda a altura do ponto, isto é, o seno, num instante. Em uma volta inteira o seno sobe até 1, desce até −1 e volta.', 768, 'Definição de seno') });
    s.label('<span class="tr-cos">onda do cosseno</span>', [1.45, FY, -LEN + 0.2], { onClick: (e) => show(e.currentTarget, 'A onda do cosseno', 'No chão fica a distância horizontal do ponto ao centro, isto é, o cosseno. É a mesma onda do seno, adiantada 90°.', 775, 'Definição de cosseno') });

    const disk = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.014, 8, 120), tint(mat('#888'), () => s.color('--ink')));
    const axGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.3, 0, 0), new THREE.Vector3(1.3, 0, 0), new THREE.Vector3(0, -1.3, 0), new THREE.Vector3(0, 1.3, 0)]);
    const axes = new THREE.LineSegments(axGeo, tint(new THREE.LineBasicMaterial({ transparent: true, opacity: 0.5 }), () => s.color('--muted')));
    disk.add(ring, axes);
    s.add(disk);
    const rR = s.add(rod(() => s.hue(), 0.024)), rC = s.add(rod(hc(T.cos), 0.03)), rS = s.add(rod(hc(T.sin), 0.03));
    const projS = s.add(rod(hc(T.sin), 0.008)), projC = s.add(rod(hc(T.cos), 0.008));
    const ball = (fn, r) => s.add(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), tint(mat('#888', { roughness: 0.3 }), fn)));
    const P = ball(() => s.color('--ink'), 0.06), dS = ball(hc(T.sin), 0.05), dC = ball(hc(T.cos), 0.05);
    const triG = new THREE.BufferGeometry();
    const triA = new THREE.BufferAttribute(new Float32Array(9), 3);
    triG.setAttribute('position', triA);
    const tri = s.add(new THREE.Mesh(triG, tint(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }), () => s.hue())));
    tri.frustumCulled = false;
    const hot = (pos, fn) => s.label('', pos, { onClick: (e) => fn(e.currentTarget) });
    const lS = hot([0, 0, 0], (b) => show(b, 'Seno de θ', `Cateto oposto ÷ hipotenusa. Como a hipotenusa é o raio 1, sen θ é a altura do ponto: ${br(Math.sin(rad(st.deg)), 3)}.`, 768, 'Definição de seno'));
    const lC = hot([0, 0, 0], (b) => show(b, 'Cosseno de θ', `Cateto adjacente ÷ hipotenusa. Com raio 1, cos θ é a distância horizontal do centro até a sombra do ponto: ${br(Math.cos(rad(st.deg)), 3)}.`, 775, 'Definição de cosseno'));
    const lR = hot([0, 0, 0], (b) => show(b, 'Raio 1', 'A hipotenusa do triângulo é o raio do círculo. Valendo 1, as razões viram comprimentos: dá para ver o seno e o cosseno.', 783, 'Círculo de raio 1'));
    lR.element.innerHTML = '<span class="tr-hip">raio 1</span>';
    upd = () => {
      const r = rad(st.deg), c = Math.cos(r), sn = Math.sin(r), z = -K * r;
      disk.position.z = z;
      rR.userData.set([0, 0, z], [c, sn, z]);
      rC.userData.set([0, 0, z], [c, 0, z]);
      rS.userData.set([c, 0, z], [c, sn, z]);
      projS.userData.set([c, sn, z], [WX, sn, z]);
      projC.userData.set([c, sn, z], [c, FY, z]);
      P.position.set(c, sn, z); dS.position.set(WX, sn, z); dC.position.set(c, FY, z);
      triA.setXYZ(0, 0, 0, z); triA.setXYZ(1, c, 0, z); triA.setXYZ(2, c, sn, z); triA.needsUpdate = true;
      traced.geometry.setDrawRange(0, Math.floor((r / TMAX) * SEG) * 6 * 6);
      lS.position.set(c + (c >= 0 ? 0.34 : -0.34), sn / 2, z);
      lS.element.innerHTML = `<span class="tr-sin">sen θ = ${br(sn, 2)}</span>`;
      lC.position.set(c / 2, sn >= 0 ? -0.16 : 0.16, z);
      lC.element.innerHTML = `<span class="tr-cos">cos θ = ${br(c, 2)}</span>`;
      lR.position.set(c * 0.4 - sn * 0.22, sn * 0.4 + c * 0.22, z); // inner side of the radius, away from the sine label
      report();
    };
    s.onFrame((tt, dt) => {
      if (!st.play) return;
      st.deg = (st.deg + dt * 45) % 720;
      sl.value = st.deg;
      upd();
    });
  }
  const setPlay = (on) => {
    st.play = on && !!s;
    const b = playBtn.querySelector('button');
    b.setAttribute('aria-pressed', String(st.play));
    b.textContent = st.play ? 'Pausar' : 'Girar';
  };
  playBtn.querySelector('button').addEventListener('click', () => setPlay(!st.play));
  sl.input.addEventListener('input', () => { setPlay(false); st.deg = sl.value; upd(); });
  if (!s) playBtn.querySelector('button').disabled = true;
  upd();
}

/* =========================== 3. Tangente, secante e triângulos semelhantes (SVG) ===== */
{
  const t = el(`
<article class="topic" id="tr-t-tangente">
  <div class="stage-col">
    <div class="stage short" id="tr-tan"></div>
    <p class="stage-cap">À esquerda, o círculo de raio 1 com a reta tangente em x = 1 e a secante saindo do centro. À direita, o valor de tan θ para cada ângulo.</p>
    <div class="controls"></div>
  </div>
  <div class="explain">
    <p class="kicker">Tangente e secante</p>
    <h3>Dois triângulos semelhantes e tan θ = sen θ ÷ cos θ</h3>
    <p>Desenhe um círculo de raio 1 e uma reta que o tangencia: é a <b>reta tangente</b>. A altura em que o raio prolongado a corta é o valor da tangente de θ. Ele vai para +∞ quando θ vai para 90° e para −∞ quando vai para o lado oposto. A reta que sai do centro e corta o círculo é a <b>secante</b>.</p>
    <p>Os dois triângulos têm o mesmo ângulo θ e um ângulo reto, então são <b>semelhantes</b>: seus lados mantêm a proporção. <i>c</i> está para <i>b</i> assim como <i>d</i> está para <i>e</i>. Como <i>d</i> = 1 e <i>e</i> = tan θ, rearranjando sai tan θ = <i>b</i>/<i>c</i>, que é justamente o seno sobre o cosseno. Daí vêm as principais relações trigonométricas.</p>
    <div class="formula" id="tr-tan-f" aria-live="polite"></div>
    ${vlinks([[783, 'Raio 1 e a reta tangente'], [791, 'A tangente vai para o infinito em 90°'], [797, '−∞ do outro lado'], [804, 'A secante, e o raio vale 1'], [812, 'Ângulos iguais: triângulos semelhantes'], [818, 'c está para b assim como d está para e'], [832, 'tan θ = b/c'], [840, 'tan θ = sen θ ÷ cos θ'], [847, 'Daí vêm as relações trigonométricas']])}
  </div>
</article>`);
  root.append(t);
  const $ = (id) => t.querySelector(id);
  const S = svg('svg', { viewBox: '0 0 560 315', class: 'tr-svg', role: 'img', 'aria-label': 'Círculo de raio 1 com a reta tangente, a secante e dois triângulos semelhantes; ao lado, o gráfico da tangente com assíntotas em mais e menos 90 graus.' }, $('#tr-tan'));
  const defs = svg('defs', {}, S);
  const cl = svg('clipPath', { id: 'tr-tan-clipL' }, defs); svg('rect', { x: 0, y: 6, width: 314, height: 303 }, cl);
  const cr = svg('clipPath', { id: 'tr-tan-clipR' }, defs); svg('rect', { x: 318, y: 6, width: 236, height: 303 }, cr);
  const L = svg('g', { 'clip-path': 'url(#tr-tan-clipL)' }, S);
  const O = [135, 160], R = 92, E = [O[0] + R, O[1]];
  svg('line', { x1: 25, y1: O[1], x2: 300, y2: O[1], class: 'axis' }, L);
  svg('line', { x1: O[0], y1: 10, x2: O[0], y2: 305, class: 'axis' }, L);
  const big = svg('polygon', { class: 'soft tr-tan' }, L);
  const small = svg('polygon', { class: 'soft tr-cos' }, L);
  svg('circle', { cx: O[0], cy: O[1], r: R, class: 'ink', 'stroke-width': 1.6 }, L);
  svg('line', { x1: E[0], y1: 0, x2: E[0], y2: 315, class: 'hue-s tr-tan', 'stroke-width': 2 }, L);
  const sec = svg('line', { class: 'ink', 'stroke-width': 2.2 }, L);
  const legC = svg('line', { class: 'hue-s tr-cos', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, L);
  const legS = svg('line', { class: 'hue-s tr-sin', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, L);
  const legT = svg('line', { class: 'hue-s tr-tan', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, L);
  const arc = svg('path', { class: 'ink', 'stroke-width': 1.5 }, L);
  const dotP = svg('circle', { r: 4, class: 'dot' }, L), dotT = svg('circle', { r: 4.5, class: 'hue-f tr-tan' }, L);
  const txt = (attrs, s0 = '') => { const n = svg('text', attrs, L); n.textContent = s0; return n; };
  const tC = txt({ class: 'math tr-cos hue-t', 'text-anchor': 'middle' }, 'c');
  const tS = txt({ class: 'math tr-sin hue-t' }, 'b');
  const tE = txt({ class: 'math tr-tan hue-t' }, 'e');
  txt({ x: E[0] + 6, y: O[1] + 18, class: 'math' }, 'd = 1');
  txt({ x: E[0] - 6, y: 22, class: 'small hue-t tr-tan', 'text-anchor': 'end' }, 'reta tangente');
  const tSec = txt({ class: 'small', 'text-anchor': 'end' }, 'secante');
  const tTh = txt({ class: 'math small' }, 'θ');
  const inf = txt({ x: E[0] - 8, class: 'small hue-t tr-tan', 'text-anchor': 'end' });
  // right: graph of tan θ for θ in (−90°, 90°)
  const G = svg('g', {}, S);
  const GX = (d) => 436 + (d / 90) * 106, GY = (v) => 157.5 - v * 30;
  svg('line', { x1: 322, y1: GY(0), x2: 552, y2: GY(0), class: 'axis' }, G);
  svg('line', { x1: GX(0), y1: 8, x2: GX(0), y2: 308, class: 'axis' }, G);
  svg('line', { x1: GX(90), y1: 8, x2: GX(90), y2: 308, class: 'faint' }, G);
  svg('line', { x1: GX(-90), y1: 8, x2: GX(-90), y2: 308, class: 'faint' }, G);
  const gp = svg('g', { 'clip-path': 'url(#tr-tan-clipR)' }, G);
  let d = '';
  for (let x = -89.4; x <= 89.4; x += 0.6) d += `${d ? 'L' : 'M'} ${GX(x).toFixed(1)} ${Math.max(-60, Math.min(380, GY(Math.tan(rad(x))))).toFixed(1)} `;
  svg('path', { d, class: 'hue-s tr-tan', 'stroke-width': 2.2 }, gp);
  const gdot = svg('circle', { r: 5, class: 'hue-f tr-tan' }, gp);
  const gt = (x, y, s0, cls = 'small muted-t', anchor = 'middle') => { const n = svg('text', { x, y, class: cls, 'text-anchor': anchor }, G); n.textContent = s0; return n; };
  gt(GX(90) - 4, 22, '+∞', 'small hue-t tr-tan', 'end'); gt(GX(-90) + 4, 300, '−∞', 'small hue-t tr-tan', 'start');
  gt(GX(90), GY(0) + 16, '90°'); gt(GX(-90), GY(0) + 16, '−90°'); gt(GX(0) + 16, 20, 'tan θ', 'math', 'start');

  const st = { th: 35, hl: 'ambos' };
  const sl = slider({ label: 'Ângulo θ', min: -89.5, max: 89.5, step: 0.5, value: st.th, format: (v) => `${br(v, 1)}°` });
  const seg = segmented({ label: 'Destacar', value: 'ambos', options: [{ value: 'pequeno', label: 'Triângulo pequeno' }, { value: 'grande', label: 'Triângulo grande' }, { value: 'ambos', label: 'Os dois' }] });
  $('.controls').append(sl.el, seg.el);
  [10, 35, 60, -40].forEach((x) => { const r = rad(x); console.assert(Math.abs((1 * Math.sin(r)) / Math.cos(r) - Math.tan(r)) < 1e-12, 'trigonometria: e = d·b/c = tan'); });
  const fmtBig = (v) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('pt-BR') : br(v, 3));
  function draw() {
    const r = rad(st.th), c = Math.cos(r), sn = Math.sin(r), tn = Math.tan(r);
    const P = [O[0] + R * c, O[1] - R * sn], H = [O[0] + R * c, O[1]], Tt = [E[0], O[1] - R * tn];
    setA(big, { points: `${O} ${E} ${Tt}` });
    setA(small, { points: `${O} ${H} ${P}` });
    setA(sec, { x1: O[0], y1: O[1], x2: Tt[0] + (Tt[0] - O[0]) * 0.12, y2: Tt[1] + (Tt[1] - O[1]) * 0.12 });
    setA(legC, { x1: O[0], y1: O[1], x2: H[0], y2: H[1] });
    setA(legS, { x1: H[0], y1: H[1], x2: P[0], y2: P[1] });
    setA(legT, { x1: E[0], y1: E[1], x2: Tt[0], y2: Tt[1] });
    setA(arc, { d: arcPath(O[0], O[1], 24, 0, r) });
    setA(tTh, { x: O[0] + 34 * Math.cos(r / 2), y: O[1] - 34 * Math.sin(r / 2) + 4 });
    setA(dotP, { cx: P[0], cy: P[1] }); setA(dotT, { cx: Tt[0], cy: Tt[1] });
    setA(tC, { x: (O[0] + H[0]) / 2, y: O[1] + (sn >= 0 ? 18 : -8) });
    setA(tS, { x: H[0] - 16, y: (H[1] + P[1]) / 2 + 5 });
    setA(tE, { x: E[0] + 8, y: Math.max(40, Math.min(296, (E[1] + Tt[1]) / 2)) });
    tE.textContent = 'e = tan θ';
    // along the secant, on the side away from the small triangle
    setA(tSec, { x: O[0] + 0.62 * R * c - 10 * sn - 4, y: O[1] - 0.62 * R * sn - 10 * c });
    const off = Tt[1] < 6 || Tt[1] > 309;
    setA(inf, { y: tn > 0 ? 44 : 292, visibility: off ? 'visible' : 'hidden' });
    inf.textContent = tn > 0 ? 'rumo a +∞ ↑' : 'rumo a −∞ ↓';
    setA(gdot, { cx: GX(st.th), cy: GY(tn) });
    small.classList.toggle('fade', st.hl === 'grande');
    big.classList.toggle('fade', st.hl === 'pequeno');
    [legC, legS].forEach((n) => n.classList.toggle('fade', st.hl === 'grande'));
    legT.classList.toggle('fade', st.hl === 'pequeno');
    const cb = Math.abs(sn) < 1e-9 ? '∞' : br(c / sn, 3);
    $('#tr-tan-f').innerHTML = `<span class="frac"><span class="tr-cos"><i>c</i></span><span class="tr-sin"><i>b</i></span></span> = <span class="frac"><span><i>d</i></span><span class="tr-tan"><i>e</i></span></span> ⇒ <span class="tr-tan">tan <i>θ</i></span> = <span class="frac"><span class="tr-sin"><i>b</i></span><span class="tr-cos"><i>c</i></span></span> = <span class="frac"><span>sen <i>θ</i></span><span>cos <i>θ</i></span></span>` +
      `<small>θ = ${br(st.th, 1)}°: c/b = ${br(c, 3)} ÷ ${br(sn, 3)} = ${cb} e d/e = 1 ÷ ${fmtBig(tn)} = ${Math.abs(tn) < 1e-9 ? '∞' : br(1 / tn, 3)}. Logo tan θ = ${br(sn, 3)} ÷ ${br(c, 3)} = ${fmtBig(tn)}.</small>`;
  }
  sl.on((v) => { st.th = v; draw(); });
  seg.on((v) => { st.hl = v; draw(); });
  draw();
}

/* ================================== 4. Identidade fundamental: sen² + cos² = 1 ===== */
{
  const t = el(`
<article class="topic" id="tr-t-identidade">
  <div class="stage-col">
    <div class="stage" id="tr-ident"></div>
    <p class="stage-cap">Quadrados sobre os catetos R·cos θ e R·sen θ e sobre o raio R. A coluna mostra as duas parcelas divididas por R²: sempre empilham até 1.</p>
    <div class="controls"></div>
    <div class="pick" hidden aria-live="polite"></div>
  </div>
  <div class="explain">
    <p class="kicker">Identidade trigonométrica fundamental</p>
    <h3>sen²θ + cos²θ = 1, para qualquer ângulo</h3>
    <p>Use Pitágoras numa circunferência qualquer de raio <i>R</i>. Os catetos são as projeções do raio nos eixos, <i>R</i>·cos θ e <i>R</i>·sen θ, e a hipotenusa é o próprio <i>R</i>. Daí sai uma das expressões mais famosas da trigonometria.</p>
    <div class="formula" id="tr-id-f" aria-live="polite"></div>
    <p>Gire o ângulo e mude o raio: os quadrados mudam de tamanho, mas as duas parcelas divididas por <i>R</i>² sempre somam 1.</p>
    <p class="note errata">No vídeo aparece sen²θ + cos²θ = R². O próprio autor corrigiu na descrição: as projeções do raio R são R·cos θ e R·sen θ, então (R·cos θ)² + (R·sen θ)² = R², e dividindo por R² fica sen²θ + cos²θ = 1. Com R = 1, como no desenho do vídeo, as duas formas coincidem.</p>
    ${vlinks([[853, 'Pitágoras numa circunferência de raio r'], [859, 'Uma das expressões mais famosas'], [864, 'Identidade trigonométrica fundamental'], [870, 'Com raio 1: sen² + cos² = 1']])}
  </div>
</article>`);
  root.append(t);
  const show = picker(t);
  const $ = (id) => t.querySelector(id);
  const st = { deg: 35, R: 1.4, play: false };
  const sth = slider({ label: 'Ângulo θ', min: 0, max: 360, step: 1, value: st.deg, format: (v) => `${Math.round(v)}°` });
  const sR = slider({ label: 'Raio R', min: 0.6, max: 1.6, step: 0.05, value: st.R, format: (v) => br(v) });
  const playBtn = el(`<div class="btn-row"><button type="button" class="btn sm" aria-pressed="false">Girar</button></div>`);
  $('.controls').append(sth.el, sR.el, playBtn);
  for (let i = 0; i < 12; i++) { const r = Math.random() * 7; console.assert(Math.abs(Math.sin(r) ** 2 + Math.cos(r) ** 2 - 1) < 1e-12, 'trigonometria: identidade fundamental'); }
  const report = () => {
    const r = rad(st.deg), c = Math.cos(r), sn = Math.sin(r), R = st.R;
    $('#tr-id-f').innerHTML = `(<i>R</i>·<span class="tr-cos">cos <i>θ</i></span>)² + (<i>R</i>·<span class="tr-sin">sen <i>θ</i></span>)² = <i>R</i>²` +
      `<small>${br((R * c) ** 2, 3)} + ${br((R * sn) ** 2, 3)} = ${br(R * R, 3)} (R = ${br(R)}, θ = ${Math.round(st.deg)}°)</small>` +
      `÷ <i>R</i>²: <span class="tr-cos">cos²<i>θ</i></span> + <span class="tr-sin">sen²<i>θ</i></span> = 1` +
      `<small>${br(c * c, 3)} + ${br(sn * sn, 3)} = ${br(c * c + sn * sn, 3)}</small>`;
  };
  const s = stage($('#tr-ident'), { camera: [2.3, 4.3, 4.9], target: [-0.35, 0.3, -0.55], label: 'Triângulo dentro de um círculo de raio R com quadrados sobre os três lados e uma coluna que soma cosseno ao quadrado e seno ao quadrado igual a 1.' });
  let upd = report;
  if (s) {
    const unit = new THREE.BoxGeometry(1, 1, 1), edges = new THREE.EdgesGeometry(unit);
    const inkM = tint(new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 }), () => s.color('--ink'));
    const tile = (colorFn) => {
      const g = new THREE.Group();
      const m = new THREE.Mesh(unit, tint(mat('#888', { transparent: true, opacity: 0.85 }), colorFn));
      const e = new THREE.LineSegments(edges, inkM);
      m.scale.y = e.scale.y = 0.04;
      m.position.y = e.position.y = 0.02;
      g.add(m, e);
      g.userData.flip = false;
      return s.add(g);
    };
    const sqC = tile(hc(T.cos)), sqS = tile(hc(T.sin)), sqR = tile(() => s.hue());
    const ring = s.add(new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 8, 120), tint(mat('#888'), () => s.color('--muted'))));
    ring.rotation.x = -Math.PI / 2;
    const rC = s.add(rod(hc(T.cos), 0.03)), rS = s.add(rod(hc(T.sin), 0.03)), rR = s.add(rod(() => s.hue(), 0.03));
    const P = s.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), tint(mat('#888', { roughness: 0.3 }), () => s.color('--ink'))));
    // the normalized column: cos² below, sin² on top, total height HC means "1"
    const HC = 1.6, CX = -2.1, CZ = -1.3;
    const colC = s.add(new THREE.Mesh(unit, tint(mat('#888'), hc(T.cos))));
    const colS = s.add(new THREE.Mesh(unit, tint(mat('#888'), hc(T.sin))));
    const cap = s.add(new THREE.Mesh(unit, tint(new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.35 }), () => s.color('--ink'))));
    cap.scale.set(0.62, 0.015, 0.62);
    cap.position.set(CX, HC + 0.008, CZ);
    const hot = (html, fn) => { const l = s.label(html, [0, 0, 0], { onClick: (e) => fn(e.currentTarget) }); return l; };
    const lC = hot('', (b) => show(b, 'Quadrado do cateto R·cos θ', `Lado ${br(st.R * Math.abs(Math.cos(rad(st.deg))), 3)}, área ${br((st.R * Math.cos(rad(st.deg))) ** 2, 3)}. É a projeção do raio no eixo horizontal, ao quadrado.`, 853, 'Pitágoras numa circunferência'));
    const lS = hot('', (b) => show(b, 'Quadrado do cateto R·sen θ', `Lado ${br(st.R * Math.abs(Math.sin(rad(st.deg))), 3)}, área ${br((st.R * Math.sin(rad(st.deg))) ** 2, 3)}. É a projeção do raio no eixo vertical, ao quadrado.`, 853, 'Pitágoras numa circunferência'));
    const lR = hot('<span class="tr-hip">R²</span>', (b) => show(b, 'Quadrado do raio', `Área R² = ${br(st.R ** 2, 3)}. Pela errata do autor, é a soma dos outros dois quadrados: (R·cos θ)² + (R·sen θ)² = R².`, 864, 'Identidade trigonométrica fundamental'));
    const l1 = hot('= 1', (b) => show(b, 'Sempre 1', `Dividindo tudo por R²: cos²θ + sen²θ = ${br(Math.cos(rad(st.deg)) ** 2, 3)} + ${br(Math.sin(rad(st.deg)) ** 2, 3)} = 1. A coluna nunca passa nem fica abaixo da marca.`, 870, 'Com raio 1, sen² + cos² = 1'));
    l1.position.set(CX, HC + 0.25, CZ);
    const lcC = s.label('<span class="tr-cos">cos²θ</span>', [CX + 0.5, 0, CZ]);
    const lcS = s.label('<span class="tr-sin">sen²θ</span>', [CX + 0.5, 0, CZ]);
    const place = (g, lbl, U, W, G) => {
      const dx = W[0] - U[0], dz = W[1] - U[1], L = Math.hypot(dx, dz);
      g.visible = lbl.visible = L > 0.02;
      if (!g.visible) return;
      const mx = (U[0] + W[0]) / 2, mz = (U[1] + W[1]) / 2;
      let nx = dz / L, nz = -dx / L;
      const dot = nx * (G[0] - mx) + nz * (G[1] - mz);
      if (Math.abs(dot) > 1e-6) g.userData.flip = dot > 0; // degenerate triangle: keep the last side
      if (g.userData.flip) { nx = -nx; nz = -nz; }
      g.position.set(mx + (nx * L) / 2, 0, mz + (nz * L) / 2);
      g.rotation.y = Math.atan2(-dz, dx);
      g.scale.set(L, 1, L);
      lbl.position.set(g.position.x, 0.2, g.position.z);
    };
    upd = () => {
      const r = rad(st.deg), c = Math.cos(r), sn = Math.sin(r), R = st.R;
      // math (x, y) maps to scene (x, −z) so the angle opens away from the viewer
      const O = [0, 0], H = [R * c, 0], Pp = [R * c, -R * sn];
      const G = [(O[0] + H[0] + Pp[0]) / 3, (O[1] + H[1] + Pp[1]) / 3];
      place(sqC, lC, O, H, G); place(sqS, lS, H, Pp, G); place(sqR, lR, O, Pp, G);
      lC.element.innerHTML = `<span class="tr-cos">(R·cos θ)² = ${br((R * c) ** 2, 2)}</span>`;
      lS.element.innerHTML = `<span class="tr-sin">(R·sen θ)² = ${br((R * sn) ** 2, 2)}</span>`;
      ring.scale.set(R, R, R);
      rC.userData.set([0, 0.05, 0], [H[0], 0.05, H[1]]);
      rS.userData.set([H[0], 0.05, H[1]], [Pp[0], 0.05, Pp[1]]);
      rR.userData.set([0, 0.05, 0], [Pp[0], 0.05, Pp[1]]);
      P.position.set(Pp[0], 0.06, Pp[1]);
      const hc2 = HC * c * c, hs2 = HC * sn * sn;
      colC.scale.set(0.4, Math.max(hc2, 0.001), 0.4); colC.position.set(CX, hc2 / 2, CZ); colC.visible = hc2 > 0.002;
      colS.scale.set(0.4, Math.max(hs2, 0.001), 0.4); colS.position.set(CX, hc2 + hs2 / 2, CZ); colS.visible = hs2 > 0.002;
      lcC.position.set(CX + 0.55, hc2 / 2, CZ); lcC.visible = hc2 > 0.15;
      lcS.position.set(CX + 0.55, hc2 + hs2 / 2, CZ); lcS.visible = hs2 > 0.15;
      report();
    };
    s.onFrame((tt, dt) => {
      if (!st.play) return;
      st.deg = (st.deg + dt * 30) % 360;
      sth.value = st.deg;
      upd();
    });
  }
  const setPlay = (on) => {
    st.play = on && !!s;
    const b = playBtn.querySelector('button');
    b.setAttribute('aria-pressed', String(st.play));
    b.textContent = st.play ? 'Pausar' : 'Girar';
  };
  playBtn.querySelector('button').addEventListener('click', () => setPlay(!st.play));
  sth.input.addEventListener('input', () => { setPlay(false); st.deg = sth.value; upd(); });
  sR.on((v) => { st.R = v; upd(); });
  if (!s) playBtn.querySelector('button').disabled = true;
  upd();
}
