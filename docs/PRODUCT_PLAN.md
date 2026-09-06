# AI SVG Animator — Product & MVP Plan

> Working plan for the first public MVP. The goal is to ship a simple, impressive and technically clean service that turns an idea or SVG into a controllable vector animation.

## 1. Product thesis

**AI SVG Animator** converts a text idea, raster reference or existing SVG into an animated vector asset that can be previewed live and exported for the web.

Core promise:

> **Describe it → generate SVG → animate it → export it.**

The MVP should optimize for three things:

1. **Fast first result** — a user should reach a visible animation in under a minute.
2. **Controllability** — animation is not a black box; motion remains editable through presets/specs.
3. **Web-native output** — SVG/HTML/GSAP first, then Lottie/video formats.

## 2. Working target audience

Primary:
- frontend developers who need animated illustrations, icons and hero assets;
- product/UI designers who want motion without a full After Effects workflow;
- indie hackers / AI builders who need fast visual assets for MVPs;
- motion designers who want AI-assisted ideation and repetitive-work reduction.

Secondary:
- marketers / content creators;
- game and interactive-web developers;
- brand designers creating animated logos and identity elements.

## 3. MVP user journey

### Path A — Prompt to animation
1. User enters a text prompt.
2. Recraft Vector via RouterAI generates an editable SVG.
3. SVG is cleaned/normalized.
4. User selects an animation preset.
5. Live preview starts immediately.
6. User adjusts speed/intensity/loop.
7. User exports HTML bundle / SVG.

### Path B — Existing SVG to animation
1. User uploads or pastes SVG.
2. SVG is validated and normalized.
3. Semantic groups / paths are detected.
4. User applies a preset or asks AI to propose motion.
5. User previews and exports.

### Path C — Raster to animation (post-MVP / optional MVP extension)
1. User uploads PNG/JPG/WebP.
2. Image is vectorized.
3. Result continues through the same SVG animation pipeline.

## 4. MVP functional scope

### P0 — Required for first public build
- prompt input;
- SVG generation through RouterAI / Recraft Vector;
- paste/upload existing SVG;
- SVG sanitization + normalization;
- live preview;
- 3 motion presets:
  - **Reveal** — fade / scale / stagger;
  - **Draw** — path drawing / stroke reveal;
  - **Float** — subtle looping motion;
- controls: duration, intensity, loop;
- export self-contained HTML;
- download original/normalized SVG;
- Cloudflare deployment;
- no secrets in repository.

### P1 — First meaningful upgrade
- SVG semantic analyzer;
- generated stable element IDs / roles;
- Motion Spec JSON format;
- AI Motion Planner that produces Motion Spec instead of raw animation code;
- editable generated motion plan;
- animation history / regenerate variations.

### P2 — Export ecosystem
- Lottie JSON export;
- animated SVG export where feasible;
- GIF / WebM / MP4 preview export;
- reusable presets library;
- shareable animation links.

### P3 — Product layer
- accounts / projects;
- saved assets;
- brand style presets;
- batch generation;
- API endpoint / SDK;
- community motion templates.

## 5. Technical architecture

```text
Prompt / SVG / Raster
        │
        ▼
Input Gateway
        │
        ├── text → RouterAI / Recraft Vector
        ├── SVG → validation
        └── raster → vectorizer (later)
        │
        ▼
SVG Sanitizer + Normalizer
        │
        ▼
SVG Analyzer
        │
        ▼
Motion Planner
   presets / AI
        │
        ▼
Motion Spec JSON
        │
        ▼
Renderer
      GSAP
        │
        ├── Live Preview
        ├── HTML export
        ├── SVG export
        └── Lottie / video exporters (later)
```

## 6. Proposed stack

### Frontend
- Vite
- TypeScript
- start framework-light for MVP; React can be introduced if UI complexity justifies it
- GSAP for runtime animation

### Worker / backend
- Cloudflare Workers
- RouterAI proxy calls from the Worker so provider keys never reach the browser
- validation / limits / error normalization at the Worker boundary

### SVG processing
- SVGO or equivalent deterministic normalization step
- safe SVG sanitization before inline rendering
- stable ID generation for animatable elements

## 7. Motion Spec direction

The intermediate format should describe **intent**, not implementation.

Example:

```json
{
  "version": 1,
  "tracks": [
    {
      "target": "#logo-main",
      "effect": "reveal",
      "duration": 0.8,
      "delay": 0,
      "ease": "power2.out"
    },
    {
      "target": ".spark",
      "effect": "stagger-pop",
      "duration": 0.4,
      "stagger": 0.08
    }
  ]
}
```

Benefits:
- deterministic renderer;
- easier validation;
- editable AI output;
- future compatibility with several exporters.

## 8. UX principles

- **Canvas first.** The animation should dominate the interface.
- **Prompt second.** One large input, minimal configuration before first result.
- **No timeline complexity in MVP.** Start with preset cards + 2–4 controls.
- **Show the pipeline.** SVG → Motion → Export should be understandable at a glance.
- **Keep the AI visible but not magical.** Users should see and edit what the AI decided.
- **Dark interface by default**, but avoid generic neon-cyberpunk overload.

## 9. README / repository presentation plan

README should function as both technical documentation and mini landing page.

Recommended structure:

1. Hero artwork / animated visual identity
2. One-line product promise
3. Short demo GIF / animated SVG / MP4 link
4. “How it works” — 3-step visual pipeline
5. Feature cards
6. Current MVP status
7. Architecture diagram
8. Local development
9. Environment variables / security notes
10. Cloudflare deployment
11. Roadmap
12. Contributing / license

## 10. Visual directions to evaluate

### Direction A — Motion Studio
- near-black canvas;
- warm off-white typography;
- vivid vector gradients only inside artwork;
- timeline / nodes / handles as visual motifs;
- feels like a modern design tool rather than an AI landing page.

Best for: designers + motion designers.

### Direction B — Vector Laboratory
- graphite / deep navy background;
- thin technical grid;
- Bézier handles, anchor points, paths and motion trajectories;
- one signature electric accent + restrained gradients;
- combines creative-tool aesthetics with developer credibility.

Best for: frontend developers + product designers + AI builders.

### Direction C — Playful Vector Workshop
- light or soft-neutral background;
- bold flat vector mascots / shapes;
- visible before/after animation frames;
- friendly typography and playful motion marks;
- less technical, more accessible.

Best for: creators, marketers, indie makers.

## 11. Recommended visual direction

**Direction B — Vector Laboratory** is the strongest default.

Reasoning:
- the product itself is about SVG structure and motion, so paths/anchors are native visual language rather than decoration;
- it signals both design and engineering;
- it avoids looking like another generic “AI magic” product;
- it can scale from GitHub README to the actual product UI.

A useful blend would be **70% Vector Laboratory + 30% Motion Studio**.

## 12. README image asset set

Create original project-owned assets instead of borrowing screenshots from other products:

- `hero.svg` — main illustration: static SVG turning into animated SVG through a motion path;
- `pipeline.svg` — Prompt → Vector → Motion → Export;
- `presets.svg` — Reveal / Draw / Float examples;
- `architecture.svg` — technical architecture diagram;
- `demo.gif` or `demo.webm` — real product preview once MVP runs.

All visual assets should use one coherent design system so the README and app feel like the same product.

## 13. Milestones

### Milestone 0 — Repository foundation
- product plan;
- README visual direction;
- project structure;
- environment examples;
- Cloudflare config.

### Milestone 1 — Static animator
- SVG input;
- normalizer;
- three deterministic presets;
- preview;
- HTML export.

### Milestone 2 — AI SVG generation
- RouterAI / Recraft integration;
- prompt → SVG → animation end-to-end;
- errors and rate handling.

### Milestone 3 — AI motion
- semantic analyzer;
- Motion Spec;
- AI motion planner;
- motion variations.

### Milestone 4 — Public MVP polish
- responsive UI;
- real demo assets;
- README demo;
- deployment;
- smoke tests.

## 14. First release definition of done

The first public MVP is complete when a new user can:

1. open the deployed site;
2. type a prompt or paste an SVG;
3. receive a valid vector result;
4. apply one of three animations;
5. see it animate live;
6. change basic motion parameters;
7. export a working HTML asset;
8. do all of this without exposing provider secrets in the client or repository.
