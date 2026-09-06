# Milestone 1 — Static Animator

Status: **implemented in source**.

## Included

- SVG paste and `.svg` upload;
- DOMPurify sanitization before inline rendering;
- deterministic SVG normalization and animation-target IDs;
- live SVG canvas;
- three GSAP presets: Reveal, Draw, Float;
- duration, intensity and loop controls;
- RU / EN interface with persisted manual choice;
- normalized SVG download;
- standalone HTML export using the browser Web Animations API;
- responsive Vector Laboratory × Motion Studio UI;
- GitHub Actions build check.

## Acceptance test

1. Run `npm install` and `npm run dev`.
2. Click **Load sample / Загрузить пример**.
3. Switch between Reveal, Draw and Float.
4. Change duration, intensity and loop.
5. Switch RU / EN; the current SVG and motion state should remain intact.
6. Download SVG and export HTML.
7. Open the exported HTML locally: the animation must work without a CDN or app server.

## Next

Milestone 2 connects RouterAI / Recraft Vector behind a Cloudflare Worker so the flow becomes:

`prompt → SVG → sanitize → motion → preview → export`.
