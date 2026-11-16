# Contrato dos módulos de capítulo — Atlas da Matemática 3D

Site estático em pt-BR que cobre TODO o conteúdo do vídeo “TODA A MATEMÁTICA Explicada em 25 minutos”
(canal Ciência Mapeada, https://youtu.be/obKEn1KkMUI). Cada elemento sugere o link do vídeo no segundo
exato com uma explicação curta.

## Arquivos
- `index.html` — já contém o cabeçalho de cada capítulo: `<section class="chapter" id="<id>" style="--h:<matiz>">`
  com `<div class="ch-body" data-mount></div>` vazio. **Seu módulo preenche esse `data-mount`.**
- `style.css` — tokens e componentes prontos (abaixo). Não editar.
- `js/core.js` — kit compartilhado. Não editar. Se precisar de algo nele, descreva no retorno.
- `js/app.js` — carrega cada módulo com `import('./<id>.js')`, isolado (um erro não derruba os outros).
- `js/<id>.js` — **um arquivo por capítulo, módulo ES**. Ids: introducao, aritmetica, algebra, geometria,
  trigonometria, estatistica, funcoes, limites, derivada, integral.
- `ref/transcricao.txt` — transcrição com `[mm:ss|Ns]` em cada linha. `ref/descricao.txt` — descrição + errata.

## Esqueleto de um módulo
```js
import { THREE, mount, el, css, vlink, vlinks, stage, slider, segmented, hueColor, onTheme,
         reduced, mat, line, tube, floorGrid, tween, ease, br, fmt } from './core.js';
const root = mount('aritmetica');            // o [data-mount] do capítulo
css(`#aritmetica .minha-classe { ... }`);    // TODO seletor prefixado com #<id>

const t1 = el(`
<article class="topic">
  <div class="stage-col">
    <div class="stage" id="ar-conjuntos"></div>
    <p class="stage-cap">Legenda curta do modelo.</p>
    <div class="controls"></div>
  </div>
  <div class="explain">
    <p class="kicker">Conjuntos numéricos</p>
    <h3>Dos naturais aos complexos</h3>
    <p>Texto…</p>
    <div class="formula">ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ ⊂ ℂ</div>
    ${vlinks([[103, 'O que é aritmética'], [125, 'Irracionais: π não tem padrão']])}
  </div>
</article>`);
root.append(t1);
const s = stage(t1.querySelector('#ar-conjuntos'), { camera: [4, 3, 6], label: 'Esferas aninhadas…' });
if (s) { /* s.scene, s.camera, s.add(mesh), s.onFrame((t, dt) => …), s.label('ℕ', [0,1,0], {cls:'math'}) */ }
```

## API de `core.js`
- `vlink(seg, dica, {big})` → HTML de um marcador “▶ mm:ss + dica” que abre o vídeo no segundo `seg`.
- `vlinks([[seg, dica], …])` → lista vertical de marcadores.
- `el(html)` cria elemento; `$`, `$$`; `mount(id)`; `css(texto)` injeta CSS.
- `stage(container, opts)` → cena three.js r160 transparente sobre a “mesa de desenho” quadriculada.
  opts: `camera:[x,y,z]`, `target`, `fov`, `ortho` (altura da vista, câmera ortográfica), `zoom` (padrão false),
  `pan` (false), `controls` (true; OrbitControls com damping), `autoRotate`, `label` (aria), `hint`.
  Retorna `null` sem WebGL (mostra aviso). API: `scene`, `camera`, `renderer`, `controls`, `el`, `width`, `height`,
  `onFrame(fn(t, dt))`, `add(...)`, `label(html, [x,y,z], {cls:'math'|'plain', parent, onClick})` (rótulo HTML preso
  a um ponto 3D; com `onClick` vira botão clicável `.lbl.hot`), `hue()` (cor do capítulo em rgb), `color('--ink')`, `render()`.
  O laço de animação só roda quando o palco está visível na tela.
- `slider({id, label, min, max, step, value, format})` → `{el, input, value, on(fn)}` (já com `<label>` e `<output>`).
- `segmented({label, options:[{value,label}], value})` → `{el, value, set(v), on(fn)}` (botões `aria-pressed`).
- `hueColor(h)` → cor rgb do matiz `h` no tema atual. `color(token, escopo)`. `onTheme(fn)` avisa troca claro/escuro.
- `mat(cor)` MeshStandardMaterial; `line(pontos, cor)`; `tube(pontos, cor, raio)`; `floorGrid(tam, div)`.
- `tween(a, b, ms, fn, done)` (instantâneo com movimento reduzido); `ease(x)`; `br(v, casas)` → “5,25”; `fmt(seg)` → “02:05”.
- `reduced` — true se o usuário pediu menos movimento: **sem animação ambiente/automática** nesse caso
  (interações disparadas pelo usuário continuam).

## Componentes CSS prontos (use-os; não reinvente)
`.topic` (modelo + explicação em 2 colunas; `.topic.flip` inverte; `.topic.wide` uma coluna), `.stage-col`, `.explain`,
`.kicker`, `.stage` (4:3; `.stage.tall` 1:1; `.stage.short` 16:9), `.stage-cap`, `.controls`, `.ctl`, `.seg`, `.btn`, `.btn.sm`,
`.btn-row`, `.formula` (tipografia matemática STIX; use `<i>x</i>` para variáveis, `<sup>`, `.frac` = `<span class="frac"><span>a</span><span>b</span></span>`),
`.math` (inline), `.readout`, `.stats` + `.stat` (`<div class="stat"><b>5,25</b><span>média</span></div>`), `.note`, `.note.fact`,
`.note.errata`, `.pick` (cartão de detalhe ao clicar num elemento 3D), `.lbl` (rótulos 3D), `.muted`.
Cores: só por tokens — `var(--hue)` (cor do capítulo), `--hue-soft`, `--ink`, `--muted`, `--line`, `--surface`, `--paper`,
`--mark` (correções), `--on-hue` (texto sobre `--hue`). Outro matiz num elemento: `style="--h:150"` (ganha `--hue` próprio).
Nada de cor literal que só funcione em um tema. Em SVG use classes/`style="fill:var(--hue)"`, não o atributo `fill="var(..)"`.

## Regras de conteúdo
1. Cubra **todos** os itens da sua lista de verificação, na ordem do vídeo. Cada `.topic` tem pelo menos um `vlink`
   e cada elemento 3D que representa um conceito oferece o seu marcador (rótulo clicável que mostra um `.pick` com `vlink`,
   ou o marcador ao lado do controle). O segundo do link = o início da fala na transcrição.
2. Fidelidade ao vídeo. Quando o vídeo arredonda ou erra, mostre o valor correto numa `.note` curta e educada
   (ex.: diferença real dos ovos). Fatos extras só se forem corretos e úteis; marque com `.note.fact`.
3. Texto em pt-BR, frases curtas e diretas, voz ativa. Sem travessões como aparte, sem “não X, mas Y”, sem emoji.
   Pode manter o humor do vídeo em uma frase aqui e ali.
4. Números no formato brasileiro (`br()`), vírgula decimal.

## Regras de qualidade
- Pelo menos um modelo 3D (three.js) **interativo** por capítulo; os demais tópicos podem ser 3D, SVG ou canvas 2D,
  sempre com algo para mexer (controle, clique, arrastar). Animação com propósito, suave, com `ease`.
- Responsivo: nada com largura fixa maior que 360px; o palco usa `aspect-ratio`. Toque: arrastar na horizontal gira.
- Acessível: todo controle com rótulo; botões de verdade (`<button>`); palcos com `label`; foco visível já vem do CSS.
- Desempenho: reutilize geometrias/materiais; nada de alocar objetos novos a cada quadro; poucos milhares de vértices.
- Tema claro/escuro: pegue cores com `s.hue()`, `s.color('--ink')`, `hueColor(h)`; se usar tinta/linhas, recolora em `onTheme`.
- Sem bibliotecas além de `three` e `three/addons/...` (já no importmap). Sem fetch externo, sem fontes 3D (use `s.label`).
- Lógica matemática não trivial (áreas, desvio padrão, raízes…) ganha `console.assert` de autoverificação no módulo.
- Verificação mínima antes de terminar: `node --check js/<id>.js` sem erros.
