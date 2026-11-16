// Chapter 1 · Introdução (00:00–01:43): a dotted globe with the birthplaces of each idea, and the Nile land survey.
import { THREE, mount, el, css, vlink, vlinks, stage, slider, hueColor, color, onTheme, reduced, mat, tween, br } from './core.js';

const root = mount('introducao');

/* ---------------------------------------------------------------- land mask ---------- */
// Coarse coastlines as [lon, lat] rings. Precision ~2°, enough for a dot-matrix globe.
const LAND = [
  // Africa
  [-17, 21, -16, 28, -10, 30, -6, 35.8, 10, 37, 11, 33, 20, 32, 25, 31.5, 32, 31, 33, 27, 37, 20, 43, 12, 51, 12, 51, 10, 44, 2, 40, -3, 40, -11, 35, -20, 33, -26, 27, -34, 20, -35, 18, -32, 14, -23, 12, -14, 13, -6, 9, -1, 9, 4, 4, 6, -8, 4.5, -13, 8, -17, 14],
  // Eurasia
  [-9, 37, -9, 43, -2, 43.5, -4, 48, 2, 51, 5, 53, 8, 54, 8, 57, 5, 58, 5, 62, 12, 66, 16, 69, 25, 71, 30, 70, 40, 67, 44, 68, 60, 69, 70, 73, 80, 73, 100, 77, 112, 74, 130, 71, 140, 72, 160, 70, 180, 68, 180, 65, 170, 60, 163, 58, 156, 51, 156, 57, 142, 59, 136, 54, 140, 48, 132, 43, 129, 35, 126, 37, 122, 40, 121, 31, 117, 24, 110, 21, 108, 16, 109, 11, 105, 9, 103, 1.5, 100, 3, 98, 8, 98, 15, 94, 17, 91, 22, 87, 21, 80, 15, 77, 8, 73, 16, 73, 21, 67, 24, 62, 25, 57, 25, 56, 27, 50, 30, 48, 30, 51, 24, 56, 26, 59, 22, 55, 17, 52, 16, 45, 13, 43, 15, 39, 21, 35, 28, 34, 31, 34, 32, 36, 36, 30, 36, 27, 37, 26, 40, 23, 40, 22, 37, 20, 40, 19, 42, 15, 45, 13, 45.5, 16, 41, 18, 40, 16, 38, 12, 38, 10, 44, 7, 44, 3, 43, 0, 39, -2, 37, -5, 36],
  // North America
  [-168, 66, -162, 70, -156, 71, -141, 70, -128, 70, -115, 68, -95, 72, -82, 73, -80, 63, -94, 60, -93, 56, -82, 52, -79, 55, -77, 60, -70, 59, -64, 60, -56, 52, -60, 47, -66, 44, -70, 42, -74, 40, -76, 35, -81, 31, -80, 25.5, -82, 27, -84, 30, -89, 30, -94, 29.5, -97, 26, -97, 21, -94, 18, -90, 21, -87, 21, -88, 16, -83, 15, -83, 10, -79, 9, -77, 8, -80, 7, -85, 10, -92, 14, -96, 16, -105, 20, -110, 24, -112, 29, -117, 32, -121, 35, -124, 40, -124, 48, -130, 55, -138, 59, -148, 60, -154, 57, -165, 54, -158, 58, -165, 62],
  // South America
  [-80, 8, -72, 12, -62, 10.5, -52, 5, -50, 0, -44, -2, -35, -5, -39, -13, -41, -22, -48, -26, -53, -34, -58, -38, -62, -39, -65, -45, -68, -52, -70, -55, -74, -50, -74, -42, -72, -30, -71, -18, -76, -14, -81, -5, -80, 0, -78, 3, -77, 8],
  // Australia
  [114, -22, 114, -34, 118, -35, 124, -33, 131, -31.5, 138, -35, 141, -38, 147, -38, 150, -37, 153, -31, 153, -25, 146, -19, 142, -11, 141, -17, 136, -12, 131, -11, 126, -14, 122, -18],
  // Greenland, Britain, Japan, Madagascar, Borneo, Sumatra
  [-73, 78, -60, 82, -30, 83, -20, 80, -20, 70, -40, 65, -44, 60, -50, 62, -54, 67, -58, 75],
  [-5, 50, 1, 51, 2, 53, -1, 55, -2, 57.5, -5, 58.5, -6, 56, -4.5, 54, -3, 53.5, -5, 52],
  [130, 31, 132, 34, 135, 34, 140, 36, 141, 40, 141.5, 45, 143, 43, 140, 39, 137, 37, 133, 35.5],
  [44, -25, 47, -25, 50, -16, 49, -12, 44, -16],
  [109, 1, 110, -3, 116, -4, 119, 1, 117, 7, 115, 5],
  [95, 5, 98, 4, 104, -2, 106, -6, 101, -3, 96, 3],
];
const WATER = [
  [28, 41, 28, 46, 34, 46, 41, 42, 36, 41], // Black Sea
  [47, 37, 47, 47, 53, 47, 54, 37], // Caspian Sea
];
function inside(ring, lon, lat) {
  let c = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i], yi = ring[i + 1], xj = ring[j], yj = ring[j + 1];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const isLand = (lon, lat) => lat < -72 || (LAND.some((r) => inside(r, lon, lat)) && !WATER.some((r) => inside(r, lon, lat)));
console.assert(isLand(2.3, 48.9) && isLand(78, 22) && isLand(-47, -15) && !isLand(-30, 30) && !isLand(35, 43.5), 'land mask');

const R = 2;
const toXYZ = (lon, lat, r = R) => {
  const p = (lat * Math.PI) / 180, l = (lon * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l));
};

/* ---------------------------------------------------------------- events ------------- */
// h = chapter hue the idea leads to (aritmética 210, álgebra 268, geometria 152, cálculo 322, introdução 28)
const EVENTS = [
  { t: 8, lon: 29.6, lat: -0.1, h: 28, title: 'Dedos e pedras', where: 'Pré-história', text: 'As civilizações antigas já calculavam para registrar e cobrar impostos. A contagem começou nos dedos e nas pedras e evoluiu para sistemas mais complexos.', fact: 'O osso de Ishango, achado na atual R. D. do Congo e com cerca de 20 mil anos, tem riscos que muitos pesquisadores leem como contagem.' },
  { t: 17, lon: 78, lat: 21, h: 210, title: 'O zero', where: 'Índia', text: 'O zero como número, com regras próprias de cálculo, surgiu na Índia.', fact: 'Brahmagupta escreveu regras para somar, subtrair e multiplicar com o zero no ano 628.' },
  { t: 22, lon: 110, lat: 34, h: 210, title: 'Os números negativos', where: 'China', text: 'Os números negativos apareceram na China. Essas ideias se espalharam por outras culturas.', fact: 'O livro Nove Capítulos sobre a Arte Matemática (séculos II a.C. a I d.C.) usava varetas vermelhas para positivos e pretas para negativos.' },
  { t: 26, lon: 10.4, lat: 43.7, h: 210, title: 'A aritmética chega à Europa', where: 'Europa', text: 'Passando por outras culturas, os números chegaram à Europa e deram origem à aritmética como a conhecemos.', fact: 'Leonardo de Pisa, o Fibonacci, popularizou os algarismos indo-arábicos na Europa com o Liber Abaci, de 1202.' },
  { t: 29, lon: 44.4, lat: 32.5, h: 268, title: 'Equações na Babilônia', where: 'Mesopotâmia', text: 'Na antiga Mesopotâmia, os babilônios desenvolveram técnicas para resolver equações simples e quadráticas.', fact: 'Tábuas de argila de cerca de 1800 a.C. trazem problemas que hoje escreveríamos como equações do 2º grau.' },
  { t: 35, lon: 60.6, lat: 41.4, h: 268, title: 'Al-Khwarizmi e o al-jabr', where: 'Mundo islâmico medieval', text: 'A álgebra ganhou sua forma mais reconhecível com o persa Al-Khwarizmi. Ele escreveu “Al-Kitab al-Mukhtasar fi Hisab al-Jabr wal-Muqabala”, e o al-jabr do título virou a palavra álgebra.', fact: 'Nascido na Corásmia, trabalhou na Casa da Sabedoria, em Bagdá, por volta de 820. Do nome dele vem a palavra algoritmo.' },
  { t: 48, lon: 31.1, lat: 29.9, h: 152, title: 'Geometria para dividir terras', where: 'Suméria e Egito', text: 'Sumérios e egípcios usavam a geometria para dividir terras e delimitar territórios. Geo significa terra e metria, medida. Ela também foi fundamental na construção das pirâmides.', fact: 'As cheias do Nilo apagavam os marcos dos terrenos todo ano, e os agrimensores egípcios remediam tudo com cordas esticadas.' },
  { t: 64, lon: 3, lat: 50.5, h: 322, title: 'Renascimento e cálculo', where: 'Europa, séculos XVII', text: 'No Renascimento a matemática virou um braço de todas as ciências. Descartes, Newton e Leibniz avançaram a álgebra e a geometria e deram origem ao cálculo diferencial e integral.', fact: 'Newton e Leibniz criaram o cálculo de forma independente, nas décadas de 1660 e 1670. Descartes uniu álgebra e geometria com as coordenadas cartesianas em 1637.' },
];

/* ---------------------------------------------------------------- topic 1: globe ------ */
const t1 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage tall" id="in-globe"></div>
    <p class="stage-cap">Cada pino numerado é um momento da introdução, na ordem do vídeo. A cor do pino é a do capítulo que aquela ideia inaugura. Os arcos mostram os números viajando da Índia e da China, pelo mundo islâmico, até a Europa.</p>
  </div>
  <div class="explain">
    <p class="kicker">Origem da matemática · 00:08 – 01:26</p>
    <h3>Oito paradas, do osso riscado ao cálculo</h3>
    <ol class="gl-list" id="in-list"></ol>
    ${vlinks([[0, 'Abertura: um assunto gigante e diverso'], [80, 'O plano: passear por cada tópico']])}
  </div>
</article>`);
root.append(t1);

const list = t1.querySelector('#in-list');
EVENTS.forEach((e, i) => {
  list.append(el(`
  <li class="gl-item" style="--h:${e.h}" data-i="${i}">
    <button type="button" class="gl-head" aria-pressed="false" aria-controls="in-more-${i}">
      <span class="gl-n">${i + 1}</span>
      <span class="gl-tt"><b>${e.title}</b><small>${e.where}</small></span>
    </button>
    <p class="gl-text">${e.text}</p>
    <p class="note fact gl-more" id="in-more-${i}" hidden>${e.fact}</p>
    ${vlink(e.t, `${e.title}: o que o vídeo conta`)}
  </li>`));
});

const g = stage(t1.querySelector('#in-globe'), {
  camera: [0, 2.3, 6.5], fov: 36,
  label: 'Globo 3D pontilhado com oito pinos numerados: Congo, Índia, China, Itália, Babilônia, Corásmia, Egito e França.',
  hint: 'arraste para girar · clique num número',
});

let select = () => {};
if (g) {
  const globe = new THREE.Group();
  g.add(globe);

  const ocean = new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 64, 40), mat(color('--surface'), { roughness: 0.9 }));
  globe.add(ocean);

  // dot-matrix land, evenly spaced on the sphere
  const pts = [];
  const STEP = 2.2;
  for (let lat = -84; lat <= 84; lat += STEP) {
    const dl = STEP / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
    for (let lon = -180; lon < 180; lon += dl) if (isLand(lon, lat)) pts.push(toXYZ(lon, lat, R * 1.002));
  }
  const dot = document.createElement('canvas');
  dot.width = dot.height = 32;
  const dc = dot.getContext('2d');
  dc.fillStyle = '#fff';
  dc.beginPath(); dc.arc(16, 16, 14, 0, Math.PI * 2); dc.fill();
  const landMat = new THREE.PointsMaterial({ size: 0.05, map: new THREE.CanvasTexture(dot), transparent: true, alphaTest: 0.4, color: new THREE.Color(color('--muted')) });
  globe.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), landMat));

  // graticule every 30°
  const gratMat = new THREE.LineBasicMaterial({ color: new THREE.Color(color('--line')), transparent: true, opacity: 0.9 });
  for (let lat = -60; lat <= 60; lat += 30) {
    const ring = [];
    for (let lon = -180; lon <= 180; lon += 5) ring.push(toXYZ(lon, lat, R * 1.001));
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring), gratMat));
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const mer = [];
    for (let lat = -90; lat <= 90; lat += 5) mer.push(toXYZ(lon, lat, R * 1.001));
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(mer), gratMat));
  }

  // pins
  const up = new THREE.Vector3(0, 1, 0);
  const stick = new THREE.CylinderGeometry(0.009, 0.009, 0.2, 6).translate(0, 0.1, 0);
  const head = new THREE.SphereGeometry(0.05, 16, 10).translate(0, 0.22, 0);
  const pins = EVENTS.map((e, i) => {
    const p = new THREE.Group();
    const n = toXYZ(e.lon, e.lat, 1).normalize();
    p.position.copy(n.clone().multiplyScalar(R));
    p.quaternion.setFromUnitVectors(up, n);
    const m = mat(hueColor(e.h), { roughness: 0.35 });
    p.add(new THREE.Mesh(stick, m), new THREE.Mesh(head, m));
    globe.add(p);
    const lbl = g.label(`${i + 1}`, [0, 0.36, 0], { parent: p, cls: 'gl-pin', onClick: () => select(i, true) });
    lbl.element.style.setProperty('--h', e.h);
    lbl.element.setAttribute('aria-label', `${i + 1}. ${e.title} (${e.where})`);
    lbl.element.title = `${e.title} · ${e.where}`;
    return { p, m, lbl, e };
  });

  // arcs: the path of the numerals (Índia → Corásmia → Europa) and of the negatives (China → Corásmia)
  const arcs = [[1, 5], [2, 5], [5, 3]].map(([a, b]) => {
    const A = toXYZ(EVENTS[a].lon, EVENTS[a].lat, 1).normalize();
    const B = toXYZ(EVENTS[b].lon, EVENTS[b].lat, 1).normalize();
    const pts = [];
    for (let k = 0; k <= 48; k++) {
      const u = k / 48;
      const v = new THREE.Vector3().copy(A).lerp(B, u).normalize();
      pts.push(v.multiplyScalar(R * (1.01 + 0.22 * Math.sin(Math.PI * u))));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeMat = mat(hueColor(210), { transparent: true, opacity: 0.75 });
    globe.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.011, 6, false), tubeMat));
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), tubeMat);
    globe.add(bead);
    bead.position.copy(curve.getPointAt(0.5));
    return { curve, bead, tubeMat, off: Math.random() };
  });

  // face the Middle East first
  const az = () => Math.atan2(g.camera.position.x, g.camera.position.z);
  const facing = (lon) => az() - (lon * Math.PI) / 180;
  globe.rotation.y = facing(48);

  let touched = false;
  g.renderer.domElement.addEventListener('pointerdown', () => { touched = true; });

  select = (i, fromGlobe) => {
    touched = true;
    list.querySelectorAll('.gl-item').forEach((li, k) => {
      const on = k === i;
      li.classList.toggle('on', on);
      li.querySelector('.gl-head').setAttribute('aria-pressed', String(on));
      li.querySelector('.gl-more').hidden = !on;
    });
    pins.forEach((pn, k) => pn.lbl.element.classList.toggle('on', k === i));
    // shortest turn to bring the pin in front of the camera
    const from = globe.rotation.y;
    let to = facing(EVENTS[i].lon);
    to = from + Math.atan2(Math.sin(to - from), Math.cos(to - from));
    tween(from, to, 900, (v) => { globe.rotation.y = v; });
    if (fromGlobe) list.children[i].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
  };

  const wp = new THREE.Vector3(), cd = new THREE.Vector3();
  g.onFrame((t, dt) => {
    if (!reduced) {
      if (!touched) globe.rotation.y += dt * 0.06;
      for (const a of arcs) a.bead.position.copy(a.curve.getPointAt((t * 0.18 + a.off) % 1));
    }
    // hide numbers on the far side of the globe
    cd.copy(g.camera.position).normalize();
    for (const pn of pins) {
      pn.p.getWorldPosition(wp);
      pn.lbl.element.classList.toggle('behind', wp.normalize().dot(cd) < 0.12);
    }
  });

  onTheme(() => {
    ocean.material.color.set(color('--surface'));
    landMat.color.set(color('--muted'));
    gratMat.color.set(color('--line'));
    pins.forEach((pn) => pn.m.color.set(hueColor(pn.e.h)));
    arcs.forEach((a) => a.tubeMat.color.set(hueColor(210)));
  });
}
list.addEventListener('click', (ev) => {
  const b = ev.target.closest('.gl-head');
  if (b) select(+b.closest('.gl-item').dataset.i, false);
});
if (!g) {
  // without 3D the list still expands
  select = (i) => list.querySelectorAll('.gl-item').forEach((li, k) => { li.classList.toggle('on', k === i); li.querySelector('.gl-more').hidden = k !== i; li.querySelector('.gl-head').setAttribute('aria-pressed', String(k === i)); });
}

/* ---------------------------------------------------------------- topic 2: Nile survey */
const FIELD_W = 80, FIELD_D = 50; // metres
const t2 = el(`
<article class="topic flip">
  <div class="stage-col">
    <div class="stage" id="in-nilo"></div>
    <div class="controls" id="in-nilo-ctl"></div>
    <div class="btn-row">
      <button type="button" class="btn sm" id="in-cheia">Cheia do Nilo</button>
      <button type="button" class="btn sm" id="in-medir" disabled>Medir de novo</button>
    </div>
  </div>
  <div class="explain">
    <p class="kicker">Geo + metria</p>
    <h3>Medir a terra para dividir a terra</h3>
    <p>“O ser humano adora problemas”, e um dos primeiros foi decidir onde termina um terreno e começa o do vizinho. Sumérios e egípcios resolveram isso com geometria. A palavra conta a história: <b>geo</b> é terra e <b>metria</b> é medida.</p>
    <div class="formula">geometria = <i>geo</i> (terra) + <i>metria</i> (medida)</div>
    <p>Divida o campo de ${FIELD_W} m × ${FIELD_D} m em lotes iguais. Depois solte a cheia: a água apaga as cordas e é preciso medir tudo de novo.</p>
    <div class="stats">
      <div class="stat"><b id="in-area">—</b><span>área de cada lote</span></div>
      <div class="stat"><b id="in-larg">—</b><span>frente de cada lote</span></div>
      <div class="stat"><b id="in-corda">—</b><span>corda para as divisas</span></div>
    </div>
    ${vlinks([[48, 'Sumérios e egípcios dividindo terras'], [53, 'Geo é terra, metria é medida'], [60, 'Geometria nas pirâmides']])}
  </div>
</article>`);
root.append(t2);

const lotes = slider({ id: 'in-lotes', label: 'Lotes', min: 2, max: 10, step: 1, value: 4, format: (v) => `${v}` });
t2.querySelector('#in-nilo-ctl').append(lotes.el);
const outArea = t2.querySelector('#in-area'), outLarg = t2.querySelector('#in-larg'), outCorda = t2.querySelector('#in-corda');
const btnCheia = t2.querySelector('#in-cheia'), btnMedir = t2.querySelector('#in-medir');

const survey = (n) => ({ area: (FIELD_W * FIELD_D) / n, front: FIELD_W / n, rope: 2 * (FIELD_W + FIELD_D) + (n - 1) * FIELD_D });
console.assert(survey(4).area === 1000 && survey(4).rope === 410, 'survey');
const showNumbers = (n) => {
  const r = survey(n);
  outArea.textContent = `${br(r.area, r.area % 1 ? 1 : 0)} m²`;
  outLarg.textContent = `${br(r.front, r.front % 1 ? 1 : 0)} m`;
  outCorda.textContent = `${br(r.rope, 0)} m`;
};
showNumbers(lotes.value);

const n3 = stage(t2.querySelector('#in-nilo'), {
  camera: [7.4, 7.2, 9.6], target: [0, 0, 0.3], fov: 38,
  label: 'Campo à beira do Nilo dividido em lotes por cordas, com uma pirâmide ao fundo.',
});
if (n3) {
  const S = 0.1; // 1 unit = 10 m
  const W = FIELD_W * S, D = FIELD_D * S;
  const sand = mat(hueColor(36), { roughness: 0.95 });
  const ground = new THREE.Mesh(new THREE.BoxGeometry(W + 3, 0.2, D + 3.2), sand);
  ground.position.set(0, -0.1, -0.2);
  n3.add(ground);

  const river = new THREE.Mesh(new THREE.BoxGeometry(W + 3, 0.14, 1.2), mat(hueColor(205), { transparent: true, opacity: 0.85, roughness: 0.2 }));
  river.position.set(0, 0.0, D / 2 + 0.8);
  n3.add(river);
  const flood = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.06, D + 0.2), mat(hueColor(205), { transparent: true, opacity: 0, roughness: 0.2 }));
  flood.position.set(0, 0.03, 0);
  n3.add(flood);

  const pyr = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.5, 4), mat(hueColor(42), { roughness: 0.8, flatShading: true }));
  pyr.rotation.y = Math.PI / 4;
  pyr.position.set(-W / 2 - 0.2, 0.75, -D / 2 - 0.6);
  n3.add(pyr);

  const plotGroup = new THREE.Group();
  const ropeGroup = new THREE.Group();
  n3.add(plotGroup, ropeGroup);
  const plotGeo = new THREE.BoxGeometry(1, 0.04, D);
  const stakeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6).translate(0, 0.15, 0);
  const plotMats = [mat(hueColor(152), { roughness: 0.9 }), mat(hueColor(118), { roughness: 0.9 })];
  const ropeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(color('--ink')), transparent: true, opacity: 1 });
  const stakeMat = mat(color('--ink'));
  let ropeOpacity = 1;

  const build = (n) => {
    plotGroup.clear(); ropeGroup.clear();
    const w = W / n;
    for (let i = 0; i < n; i++) {
      const p = new THREE.Mesh(plotGeo, plotMats[i % 2]);
      p.scale.x = w * 0.985;
      p.position.set(-W / 2 + w * (i + 0.5), 0.02, 0);
      plotGroup.add(p);
    }
    for (let i = 0; i <= n; i++) {
      const x = -W / 2 + w * i;
      ropeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 0.24, -D / 2), new THREE.Vector3(x, 0.24, D / 2)]), ropeMat));
      for (const z of [-D / 2, D / 2]) { const st = new THREE.Mesh(stakeGeo, stakeMat); st.position.set(x, 0, z); ropeGroup.add(st); }
    }
    for (const z of [-D / 2, D / 2]) ropeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-W / 2, 0.24, z), new THREE.Vector3(W / 2, 0.24, z)]), ropeMat));
    ropeGroup.visible = ropeOpacity > 0.02;
  };
  build(lotes.value);
  lotes.on((v) => { build(v); showNumbers(v); });

  const labelN = n3.label(`${FIELD_W} m`, [0, 0.05, -D / 2 - 0.45], { cls: 'plain' });
  n3.label(`${FIELD_D} m`, [W / 2 + 0.5, 0.05, 0], { cls: 'plain' });
  n3.label('Nilo', [W / 2 + 0.3, 0.1, D / 2 + 0.8], { cls: 'plain' });
  labelN.element.style.color = 'var(--muted)';

  btnCheia.addEventListener('click', () => {
    btnCheia.disabled = true;
    tween(0, 1, 1400, (k) => {
      flood.material.opacity = 0.8 * k;
      flood.scale.y = 1 + k * 3;
      river.scale.z = 1 + k * 0.6;
      ropeOpacity = 1 - k;
      ropeMat.opacity = ropeOpacity;
      plotGroup.visible = k < 0.6;
      ropeGroup.visible = ropeOpacity > 0.02;
    }, () => { btnMedir.disabled = false; lotes.input.disabled = true; });
  });
  btnMedir.addEventListener('click', () => {
    btnMedir.disabled = true;
    tween(1, 0, 1200, (k) => {
      flood.material.opacity = 0.8 * k;
      flood.scale.y = 1 + k * 3;
      river.scale.z = 1 + k * 0.6;
      plotGroup.visible = k < 0.6;
      ropeOpacity = 1 - k;
      ropeMat.opacity = ropeOpacity;
      ropeGroup.visible = ropeOpacity > 0.02;
    }, () => { btnCheia.disabled = false; lotes.input.disabled = false; });
  });

  onTheme(() => {
    sand.color.set(hueColor(36)); pyr.material.color.set(hueColor(42));
    plotMats[0].color.set(hueColor(152)); plotMats[1].color.set(hueColor(118));
    river.material.color.set(hueColor(205)); flood.material.color.set(hueColor(205));
    ropeMat.color.set(color('--ink')); stakeMat.color.set(color('--ink'));
  });
} else {
  btnCheia.disabled = true;
}

css(`
#introducao .gl-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
#introducao .gl-item { display: grid; gap: 6px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
#introducao .gl-item.on { border-color: var(--hue); box-shadow: 0 0 0 1px var(--hue) inset; }
#introducao .gl-head { all: unset; cursor: pointer; display: flex; gap: 10px; align-items: center; border-radius: 6px; }
#introducao .gl-head:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
#introducao .gl-n { flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
  font: 700 13px/1 var(--f-mono); background: var(--hue); color: var(--on-hue); }
#introducao .gl-tt { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; }
#introducao .gl-tt b { font: 700 15px/1.25 var(--f-display); }
#introducao .gl-tt small { font: 500 12px/1.2 var(--f-mono); color: var(--muted); }
#introducao .gl-text { font-size: 14px; color: var(--muted); }
#introducao .gl-item .vlink { justify-self: start; }
#introducao .gl-pin { font: 700 12px/1 var(--f-mono); width: 24px; height: 24px; padding: 0; border-radius: 50%; display: grid; place-items: center;
  background: var(--surface); color: var(--hue); border: 2px solid var(--hue); transition: opacity .2s; }
#introducao .gl-pin.on, #introducao .gl-pin:hover { background: var(--hue); color: var(--on-hue); }
#introducao .gl-pin.behind { opacity: 0; pointer-events: none; }
`);
