// Page shell: chapter chips, video timeline, scroll-to-video-time sync, and isolated loading of each chapter module.
import { CHAPTERS, fmt, vurl, el } from './core.js';

const TOTAL = 1635;
const chips = document.getElementById('chapter-chips');
const timeline = document.getElementById('timeline');
const topbar = document.getElementById('topbar');
const nowLink = document.getElementById('now-link');
const nowTime = document.getElementById('now-time');
const nowTitle = document.getElementById('now-title');
const bar = document.getElementById('progress-bar');

for (const c of CHAPTERS) {
  if (!c.sponsor) {
    chips.append(el(`<a href="#${c.id}" style="--h:${c.h}" data-id="${c.id}">${c.n}. ${c.short || c.title}</a>`));
  }
  const li = el(`<li style="flex:${c.end - c.start} 1 0"></li>`);
  li.append(el(`<a href="#${c.id}" style="--h:${c.h}${c.sponsor ? ';--hue-s:8%' : ''}" title="${c.title} · ${fmt(c.start)} a ${fmt(c.end)}">` +
    `<span class="tl-t">${fmt(c.start)}</span><span class="tl-n">${c.sponsor ? 'Patrocínio' : c.short || c.title}</span></a>`));
  timeline.append(li);
}

// Map the reading position to a moment of the video: inside a chapter, the scrolled fraction of the
// section becomes a fraction of that chapter's time range. The top bar then links to that moment.
const sections = CHAPTERS.map((c) => ({ c, node: document.getElementById(c.id) })).filter((x) => x.node);
let current = null;
function sync() {
  const probe = window.innerHeight * 0.4;
  let hit = null;
  for (const s of sections) {
    const r = s.node.getBoundingClientRect();
    if (r.top <= probe && r.bottom > probe) { hit = { ...s, frac: (probe - r.top) / r.height }; break; }
  }
  if (!hit) {
    const first = sections[0].node.getBoundingClientRect();
    if (first.top > probe) { setNow(null, 0); return; }
    hit = { ...sections[sections.length - 1], frac: 1 };
  }
  const t = Math.round(hit.c.start + Math.min(1, Math.max(0, hit.frac)) * (hit.c.end - hit.c.start - 1));
  setNow(hit.c, t);
}
function setNow(c, t) {
  nowLink.href = vurl(t);
  nowTime.textContent = `▶ ${fmt(t)}`;
  nowTitle.textContent = c ? `${c.short || c.title} no vídeo` : 'Abrir o vídeo';
  nowLink.title = `Abrir o vídeo em ${fmt(t)}`;
  bar.style.width = `${(t / TOTAL) * 100}%`;
  if (c !== current) {
    current = c;
    topbar.setAttribute('style', `--h:${c ? c.h : 225}`); // attribute form so [style*="--h"] recomputes --hue
    chips.querySelectorAll('a').forEach((a) => {
      const on = !!c && a.dataset.id === c.id;
      a.setAttribute('aria-current', String(on));
      if (on) chips.scrollTo({ left: a.offsetLeft - chips.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
    });
  }
}
let queued = false;
addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; sync(); }); } }, { passive: true });
addEventListener('resize', sync);
sync();

// Each chapter lives in its own module; a failure in one never blocks the others.
const modules = ['hero', ...CHAPTERS.filter((c) => !c.sponsor).map((c) => c.id)];
for (const m of modules) {
  import(`./${m}.js`).catch((err) => {
    console.error(`[atlas] módulo ${m} falhou`, err);
    const host = document.querySelector(`#${m} [data-mount]`);
    if (host) host.append(el(`<p class="note">Este capítulo não carregou (${String(err.message || err)}). Os links do vídeo no cabeçalho continuam funcionando.</p>`));
  });
}
