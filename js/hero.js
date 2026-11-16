// Hero: a constellation of the ten chapters. Each chapter is a solid on a route in video order;
// clicking a solid (or its label) travels to that chapter.
import { THREE, CHAPTERS, stage, hueColor, color, onTheme, reduced, fmt, mat } from './core.js';

const host = document.getElementById('hero-stage');
const chapters = CHAPTERS.filter((c) => !c.sponsor);
const far = host.clientWidth < 520 ? 1.28 : 1; // phones: step back so the ring fits
const s = stage(host, { camera: [0, 3.2 * far, 9.6 * far], target: [0, 0.1, 0], fov: 38, autoRotate: true, hint: 'arraste para girar · clique para viajar' });

if (s) {
  const geos = {
    dodeca: new THREE.DodecahedronGeometry(0.46),
    cube: new THREE.BoxGeometry(0.66, 0.66, 0.66),
    octa: new THREE.OctahedronGeometry(0.55),
    tetra: new THREE.TetrahedronGeometry(0.6),
    torus: new THREE.TorusGeometry(0.36, 0.13, 18, 48),
    icosa: new THREE.IcosahedronGeometry(0.5),
    cone: new THREE.ConeGeometry(0.42, 0.8, 40),
    cylinder: new THREE.CylinderGeometry(0.4, 0.4, 0.62, 8), // an octagonal prism: a polygon on its way to a circle
    knot: new THREE.TorusKnotGeometry(0.3, 0.1, 96, 14),
    sphere: new THREE.SphereGeometry(0.44, 40, 20),
  };

  // route: a gentle helix, one turn and a bit, so the order of the video reads as a path
  const R = 3.3;
  const pos = chapters.map((c, i) => {
    const a = (i / chapters.length) * Math.PI * 2.2 - Math.PI * 0.55;
    return new THREE.Vector3(Math.cos(a) * R, 1.25 - i * 0.27, Math.sin(a) * R);
  });

  const nodes = chapters.map((c, i) => {
    const g = new THREE.Group();
    g.position.copy(pos[i]);
    const m = new THREE.Mesh(geos[c.solid], mat(hueColor(c.h), { roughness: 0.42 }));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geos[c.solid], 25), new THREE.LineBasicMaterial({ color: new THREE.Color(color('--ink')), transparent: true, opacity: 0.28 }));
    m.add(edges);
    m.userData.chapter = c;
    g.add(m);
    s.add(g);
    const lbl = s.label(`<span style="--h:${c.h}">${String(c.n).padStart(2, '0')}<em> · ${c.short || c.title}</em></span><small>${fmt(c.start)}</small>`, [0, -0.78, 0], {
      parent: g, cls: 'hero-lbl', onClick: () => go(c),
    });
    lbl.element.setAttribute('aria-label', `Ir para o capítulo ${c.n}: ${c.title} (começa em ${fmt(c.start)} no vídeo)`);
    return { c, g, m, edges, lbl, y: pos[i].y, spin: 0.25 + (i % 3) * 0.12, phase: i * 0.7 };
  });

  // the route itself, as a tube, plus a small traveller that runs along it
  const curve = new THREE.CatmullRomCurve3(pos, false, 'centripetal');
  const routeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color('--line')) });
  s.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 240, 0.018, 6, false), routeMat));
  const traveller = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(color('--accent')) }));
  s.add(traveller);

  // the core: a wireframe sphere for "matemática", with spokes to every region
  const coreMat = new THREE.LineBasicMaterial({ color: new THREE.Color(color('--muted')), transparent: true, opacity: 0.35 });
  const core = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.9, 1)), coreMat);
  s.add(core);
  const spokeGeo = new THREE.BufferGeometry().setFromPoints(pos.flatMap((p) => [new THREE.Vector3(0, 0, 0), p]));
  const spokeMat = new THREE.LineDashedMaterial({ color: new THREE.Color(color('--line')), dashSize: 0.12, gapSize: 0.1 });
  const spokes = new THREE.LineSegments(spokeGeo, spokeMat);
  spokes.computeLineDistances();
  s.add(spokes);
  s.label('Matemática', [0, 0, 0], { cls: 'hero-core' });

  // picking: click without dragging
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let down = null, hover = null;
  const pick = (e) => {
    const r = s.renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, s.camera);
    const hit = ray.intersectObjects(nodes.map((n) => n.m), false)[0];
    return hit ? nodes.find((n) => n.m === hit.object) : null;
  };
  const cv = s.renderer.domElement;
  cv.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  cv.addEventListener('pointerup', (e) => {
    if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) { const n = pick(e); if (n) go(n.c); }
    down = null;
  });
  cv.addEventListener('pointermove', (e) => {
    const n = pick(e);
    if (n !== hover) {
      hover?.lbl.element.classList.remove('on');
      hover = n;
      hover?.lbl.element.classList.add('on');
      cv.style.cursor = n ? 'pointer' : '';
    }
  });
  cv.addEventListener('pointerleave', () => { hover?.lbl.element.classList.remove('on'); hover = null; });

  function go(c) {
    document.getElementById(c.id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  let k = 0;
  s.onFrame((t, dt) => {
    if (reduced) return;
    k = (k + dt * 0.045) % 1;
    traveller.position.copy(curve.getPointAt(k));
    core.rotation.y += dt * 0.12;
    for (const n of nodes) {
      n.m.rotation.y += dt * n.spin;
      n.m.rotation.x += dt * n.spin * 0.4;
      n.g.position.y = n.y + Math.sin(t * 0.9 + n.phase) * 0.06;
      const target = n === hover ? 1.22 : 1;
      n.m.scale.setScalar(n.m.scale.x + (target - n.m.scale.x) * 0.15);
    }
  });
  if (reduced) traveller.position.copy(curve.getPointAt(0));

  onTheme(() => {
    for (const n of nodes) {
      n.m.material.color.set(hueColor(n.c.h));
      n.edges.material.color.set(color('--ink'));
    }
    routeMat.color.set(color('--line'));
    spokeMat.color.set(color('--line'));
    coreMat.color.set(color('--muted'));
    traveller.material.color.set(color('--accent'));
  });
}

const style = document.createElement('style');
style.textContent = `
.hero-lbl { display: grid; gap: 1px; text-align: center; font: 600 12px/1.2 var(--f-body); padding: 4px 8px; }
.hero-lbl span { color: var(--hue); font-weight: 700; }
.hero-lbl small { font: 500 11px/1 var(--f-mono); color: var(--muted); }
.hero-lbl.on span, .hero-lbl:hover span, .hero-lbl.on small, .hero-lbl:hover small { color: inherit; }
.hero-lbl:hover, .hero-lbl.on { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.hero-core { font: 700 13px/1 var(--f-display); letter-spacing: .02em; color: var(--muted); background: none; border: 0; }
.hero-lbl em { font-style: normal; }
@media (max-width: 560px) { .hero-lbl small, .hero-lbl em { display: none; } .hero-lbl { font-size: 11px; padding: 3px 6px; } }
`;
document.head.appendChild(style);
