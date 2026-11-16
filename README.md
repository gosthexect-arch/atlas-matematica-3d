# Atlas da Matemática 3D

Site interativo em 3D que percorre todo o conteúdo do vídeo
[“TODA A MATEMÁTICA Explicada em 25 minutos”](https://youtu.be/obKEn1KkMUI), do canal Ciência Mapeada.

Cada capítulo do vídeo virou uma região do atlas, com modelos 3D que você gira, controles que mudam os números ao vivo
e marcadores **▶ mm:ss** que abrem o vídeo no segundo exato de cada explicação.

| # | Capítulo | O que tem para mexer |
|---|----------|----------------------|
| 1 | Introdução | Globo com a origem de cada ideia; campo do Nilo dividido em lotes |
| 2 | Aritmética | Conjuntos numéricos em camadas, números complexos, MMC dos ovos, cubos de soma → potência, porcentagem |
| 3 | Álgebra | Balança que descobre o x, (a + b)² em ladrilhos, perímetro com bananas e maçãs |
| 4 | Geometria | Tipos de triângulo, soma de 180°, área, Pitágoras com tanques de água, lei dos cossenos |
| 5 | Trigonometria | Seno, cosseno e tangente no círculo unitário, hélice no tempo, identidade fundamental |
| 6 | Estatística e probabilidade | Gangorra da média, moda, mediana, desvio padrão, moeda, pote de bolas, Mega-Sena |
| 7 | Funções | Pistão de gás, preço do carro, bactérias, máquina de funções, reta y = ax + b |
| 8 | Limites | Polígonos que viram círculo, limites laterais da tangente |
| 9 | Derivada | Simulador de carro com velocímetro, secante que vira tangente |
| 10 | Integral | Piscina que enche, somas de Riemann, derivada × integral |

## Como abrir no seu computador

O site é feito só de arquivos estáticos (HTML, CSS e JavaScript), mas usa módulos JavaScript, que os navegadores
não carregam com dois cliques no `index.html`. Por isso ele vem com um servidor local mínimo, que não instala nada.

**1. Baixe o projeto.** No GitHub, clique em **Code → Download ZIP** e descompacte. Ou use o git:

```bash
git clone https://github.com/gosthexect-arch/atlas-matematica-3d.git
```

**2. Inicie.**

- **Windows:** clique duas vezes em `iniciar.bat`.
- **macOS / Linux:** no terminal, dentro da pasta, rode:

  ```bash
  ./iniciar.sh
  ```

O navegador abre sozinho em `http://localhost:8000`. Para parar, feche a janela do terminal ou aperte `Ctrl+C`.

**Requisitos**

- **Python 3** (já vem no Linux e na maioria dos Macs; no Windows instale em [python.org](https://www.python.org/downloads/)).
  Sem Python, os scripts tentam o **Node.js** (`npx http-server`).
- Um navegador atual com WebGL (Chrome, Edge, Firefox ou Safari).
- **Internet** para carregar a biblioteca 3D [three.js](https://threejs.org/) (via jsDelivr) e as fontes do Google Fonts.

Prefere outro servidor? Qualquer servidor de arquivos estáticos funciona, por exemplo:

```bash
python -m http.server 8000
```

## Estrutura

```
index.html        página e cabeçalhos dos capítulos
style.css         identidade visual (temas claro e escuro)
js/core.js        kit compartilhado: palcos 3D, links do vídeo, controles
js/app.js         navegação, linha do tempo e carregamento dos capítulos
js/hero.js        mapa 3D da abertura
js/<capitulo>.js  um módulo por capítulo
servidor.py       servidor local (Python 3 padrão)
ref/CONTRATO.md   API do núcleo e regras para escrever um capítulo
```

Todos os palcos 3D desenham por um único renderer WebGL compartilhado, então a página não esbarra no limite de
contextos WebGL do navegador.

## Créditos

Material de estudo independente, sem vínculo com o canal ou com o patrocinador do vídeo. Os textos foram escritos
a partir do vídeo, e cada marcador ▶ leva ao trecho original no YouTube. Assista e apoie o canal
[Ciência Mapeada](https://www.youtube.com/watch?v=obKEn1KkMUI).
