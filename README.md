<p align="right"><a href="./README.ru.md"><strong>Русский</strong></a></p>

<p align="center">
  <img src="./assets/hero-en.svg" alt="AI SVG Animator hero" width="100%" />
</p>

<h1 align="center">AI SVG Animator</h1>
<p align="center"><strong>Turn ideas into living vectors.</strong></p>
<p align="center">SVG → AI Motion → Web · Visual + structural understanding · Auto variants</p>

<p align="center">
  <a href="https://ai-svg-animator.conradipui.workers.dev"><strong>Open live app</strong></a> ·
  <a href="./docs/PRODUCT_PLAN.md">Product Plan</a> ·
  <a href="./docs/MILESTONE_2_1.md">Milestone 2.1</a> ·
  <a href="./docs/MOTION_SPEC.md">Motion Spec</a> ·
  <a href="./docs/MODEL_ROUTING.md">Model Routing</a>
</p>

## Current build

**Static Animator is complete and Milestone 2.1 AI Motion is now a production candidate.**

The live app can:

- paste or upload an SVG;
- sanitize unsafe SVG markup with DOMPurify;
- normalize sizing / `viewBox` and assign stable animation targets;
- preview it on a live canvas;
- apply **Reveal**, **Draw**, or **Float** deterministic presets;
- tune duration, intensity, and looping;
- switch the full UI between **English / Russian** without losing work;
- choose a currently available free B.AI model;
- describe motion in natural language and press **Animate with AI** once;
- use an empty prompt for tasteful automatic motion;
- render the SVG to a PNG visual reference and send it to a multimodal model when available;
- send structural SVG context alongside the image: target IDs, hierarchy, style metadata and geometry excerpts;
- validate returned **Motion Spec v1** against real SVG target IDs;
- keep valid tracks even when part of an AI response is malformed;
- automatically play a valid AI animation through GSAP with no second apply step;
- generate three automatic animation directions: **Subtle / Natural / Expressive**;
- apply a selected variant directly from its card;
- inspect provider/model/validation diagnostics under **Technical details**;
- download the normalized SVG;
- export the currently active preset or AI animation as a self-contained HTML file.

### Production AI status

Production smoke tests currently pass against:

`https://ai-svg-animator.conradipui.workers.dev`

- B.AI health/model discovery: OK;
- `glm-5.3-flash` motion generation: HTTP 200, valid Motion Spec;
- three-way auto-variant generation: HTTP 200, Subtle / Natural / Expressive returned;
- provider keys remain server-side in Cloudflare Worker Secrets.

Milestone 2.1 still needs final author/browser QA on several real SVG fixtures before it is marked fully closed. See [`docs/MILESTONE_2_1.md`](./docs/MILESTONE_2_1.md).

## How it works

<p align="center">
  <img src="./assets/pipeline-en.svg" alt="AI SVG Animator pipeline" width="100%" />
</p>

```text
SVG input
   │
   ▼
DOMPurify sanitizer
   │
   ▼
SVG normalizer + stable animation targets
   │
   ├──────── deterministic presets ───────────────┐
   │                                               │
   ├──► rendered PNG visual reference             │
   │                                               │
   └──► SVG structure / IDs / geometry             │
                │                                  │
                ▼                                  │
       B.AI multimodal model                       │
       + Cloudflare fallback                       │
                │                                  │
                ├──► single Motion Spec            │
                └──► 3 auto variants               │
                │                                  │
                ▼                                  │
      allowlist + clamps + validation              │
                │                                  │
                └────────► GSAP renderer ◄─────────┘
                                 │
                                 ▼
                            Live preview
                                 │
                                 ▼
                         standalone HTML
```

## Why this project exists

Animated SVG assets sit in an awkward gap. AI image tools usually stop at raster output, design tools can export vectors but do not automate motion well, and full motion suites can be too heavy for quick product work.

AI SVG Animator is aiming for a simpler path:

> **Describe or bring a vector → make it move → ship it to the web.**

The longer-term direction is an **AI Motion Director** that understands a scene semantically, prepares artwork for motion, proposes several animation strategies, and can eventually restructure vector geometry when the original file is not animation-ready.

## AI model routing

During MVP development the Worker prefers currently free B.AI routes and keeps Cloudflare Workers AI as reserve.

Current selectable B.AI candidates:

- `glm-5.3-flash` — text + vision;
- `qwen3.8-flash` — text + vision;
- `mimo-v2.5` — text + vision;
- `hy3` — text only.

The browser never receives provider keys. See [`docs/MODEL_ROUTING.md`](./docs/MODEL_ROUTING.md).

## Run locally

Requirements: a modern Node.js release supported by Vite 8.

```bash
git clone https://github.com/conradipui-glitch/AI-SVG-Animator.git
cd AI-SVG-Animator
npm install
npm run dev
```

Worker development:

```bash
cp .dev.vars.example .dev.vars
npm run dev:worker
```

Production checks:

```bash
npm run build
npm run check:worker
```

Deployment details: [`docs/DEPLOY.md`](./docs/DEPLOY.md).

## Stack

- **Vite 8** — frontend build / dev server
- **TypeScript 7** — typed application layer
- **GSAP 3.15** — live SVG animation runtime
- **DOMPurify 3.4** — SVG sanitization before inline rendering
- **Cloudflare Workers** — API boundary + static deployment
- **Cloudflare Workers AI** — reserve AI route
- **B.AI OpenAI-compatible API** — free-model pool during MVP development
- browser **Canvas** — SVG → PNG visual context for multimodal analysis
- browser **Web Animations API** — dependency-free standalone HTML export for presets and AI Motion Specs

## Project structure

```text
src/
├── ai.ts             # AI API client + visual/structural scene context
├── animator.ts       # presets + Motion Spec GSAP executor
├── export.ts         # standalone preset / AI animation HTML export
├── main.ts           # app state, UI, one-click AI motion and variants
├── motion-spec.ts    # tolerant Motion Spec v1 parser / validator
├── sample.ts         # built-in demo vector
├── styles.css        # Vector Laboratory × Motion Studio UI
├── svg.ts            # sanitization + normalization
└── i18n/
    ├── index.ts
    ├── en.ts
    ├── ru.ts
    └── types.ts

worker/
└── index.ts           # B.AI motion/variants/vision routes + Cloudflare fallback
```

## Design direction

The product uses a visual identity we call **Vector Laboratory × Motion Studio**:

- deep navy / graphite surfaces;
- restrained electric-blue accents;
- Bézier / anchor / motion-path visual language;
- a hybrid of a design tool and a developer tool.

No mystical neon AI brain required 😄

## Localization

The MVP is bilingual:

- **English**
- **Русский**

Resolution order: saved manual choice → browser/system language → country fallback → English. A manual choice always wins and is persisted locally.

See [`docs/LOCALIZATION.md`](./docs/LOCALIZATION.md).

## Roadmap

### ✅ Milestone 0 — foundation
- product plan;
- bilingual README and visual identity;
- localization architecture.

### ✅ Milestone 1 — Static Animator
- SVG paste / upload;
- sanitizer + normalizer;
- Reveal / Draw / Float;
- live preview;
- duration / intensity / loop controls;
- normalized SVG export;
- standalone preset HTML export.

### 🟢 Milestone 2.1 — AI Motion Fix + Auto Variants
- live B.AI motion route verified;
- one-click **Animate with AI** flow;
- rendered visual + structural SVG context;
- strict/tolerant Motion Spec validation;
- automatic GSAP playback;
- Subtle / Natural / Expressive variants;
- diagnostics / partial validation;
- standalone AI animation export;
- final manual browser acceptance pending.

### ▶ Milestone 2.2 — Motion-Ready SVG Preparation
- semantic grouping;
- geometry-aware pivot preparation;
- identify elements that should be split before motion;
- editable semantic labels;
- groundwork for AI-assisted topology reconstruction.

### Milestone 3 — Semantic Motion Director
- deeper scene understanding;
- character/object semantics;
- intelligent restructuring of animation-ready elements;
- scene-level choreography;
- prompt-driven and automatic motion based on visual meaning.

### Later input / generation layers
- prompt → SVG generation;
- raster image → motion-ready vector;
- Universal Import Layer for SVG/SVGZ, EPS/PS/AI/PDF and later additional vector formats;
- layered / hybrid SVG + raster scenes.

### Public MVP polish
- responsive QA;
- real demo asset / animated README example made with the tool itself;
- broader browser fixture tests;
- Lottie / video export experiments.

## Docs

- [`docs/PRODUCT_PLAN.md`](./docs/PRODUCT_PLAN.md) — product thesis, architecture and milestones.
- [`docs/MILESTONE_2_1.md`](./docs/MILESTONE_2_1.md) — current AI Motion acceptance specification.
- [`docs/MOTION_SPEC.md`](./docs/MOTION_SPEC.md) — controlled AI-to-renderer motion contract.
- [`docs/MODEL_ROUTING.md`](./docs/MODEL_ROUTING.md) — B.AI + Cloudflare routing policy.
- [`docs/DEPLOY.md`](./docs/DEPLOY.md) — secure Cloudflare deployment.
- [`docs/LOCALIZATION.md`](./docs/LOCALIZATION.md) — RU / EN strategy.

## Vision

> Type an idea. Get a clean SVG. Make it move. Ship it to the web.