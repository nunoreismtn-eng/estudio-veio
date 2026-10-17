# Estúdio Veio · código-fonte

Ramo `source`. O site publicado vive no ramo `main` (GitHub Pages): https://nunoreismtn-eng.github.io/estudio-veio/

## Estrutura

- `src/content.js`: biblioteca de exercícios, quizzes, guias e dicas
- `src/engine.js`: análise de voz (tom, ritmo, pausas, dinâmica), texto, pontuação e níveis
- `src/app.js`: interface (abas, estúdio, ferramentas, progresso, definições, comportamento no telemóvel)
- `src/styles.css`, `src/shell.html`: aspeto e estrutura da página
- `build.py`: gera as três versões
  - `dist/estudio-veio.html`: artefacto do Claude (sem microfone, coach e histórico na conta)
  - `dist/estudio-veio-microfone.html`: ficheiro privado com microfone
  - `site/`: versão pública para o GitHub Pages (sem dados pessoais, instalável, funciona sem rede)
- `test/`: testes com Playwright (`node test/<nome>.js`), áudio de teste em `test/fixtures/voice.wav`

## Dados pessoais

O nome e a empresa por omissão das versões privadas vêm de `private.json` (fora do Git):

```json
{"name": "…", "company": "…"}
```

Sem esse ficheiro, ficam em branco e preenchem-se nas Definições da app. O `build.py` recusa gerar o site público se algum desses valores lá aparecer.

## Publicar uma nova versão

1. `python3 build.py`
2. Copiar o conteúdo de `site/` para um clone do ramo `main`, fazer commit e push.
3. O GitHub Pages atualiza em cerca de um minuto. O service worker muda de versão sozinho, e a app instalada recebe a atualização na abertura seguinte.
