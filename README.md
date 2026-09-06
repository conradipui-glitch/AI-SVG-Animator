<p align="right"><a href="./README.ru.md"><strong>Русский</strong></a></p>

<p align="center">
  <img src="./assets/hero-en.svg" alt="AI SVG Animator hero" width="100%" />
</p>

<h1 align="center">AI SVG Animator</h1>
<p align="center"><strong>Turn ideas into living vectors.</strong></p>
<p align="center">SVG → Motion → Web · AI Motion Director now wired · Prompt → SVG next</p>

<p align="center">
  <a href="./docs/PRODUCT_PLAN.md">Product Plan</a> ·
  <a href="./docs/MOTION_SPEC.md">Motion Spec</a> ·
  <a href="./docs/MODEL_ROUTING.md">Model Routing</a> ·
  <a href="./docs/DEPLOY.md">Deploy</a> ·
  <a href="./docs/LOCALIZATION.md">Localization</a>
</p>

## Current build

**Static Animator is implemented, and the first AI Motion Director path is now wired end-to-end.**

The app can:

- paste or upload an SVG;
- sanitize unsafe SVG markup with DOMPurify;
- normalize sizing / `viewBox` and assign stable animation targets;
- preview it on a live canvas;
- apply **Reveal**, **Draw**, or **Float** presets;
- tune duration, intensity, and looping;
- switch the full UI between **English / Russian** without losing work;
- choose a currently available free B.AI model;
- describe an animation in natural language or leave the prompt empty for automatic motion;
- send a compact SVG node map to the AI Motion Planner;
- validate returned **Motion Spec v1** against real SVG target IDs;
- automatically execute a valid AI motion plan through GSAP;
- fall back safely to deterministic presets when AI output is invalid or unavailable;
- download the normalized SVG;
- export a self-contained preset-based HTML file.

The next major product milestone connects **RouterAI / Recraft Vector**, so a user can start from a text prompt instead of bringing an SVG.

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
   ├──────── deterministic presets ────────┐
   │                                        │
   ▼                                        │
compact node map                            │
   │                                        │
   ▼                                        │
B.AI / Cloudflare AI fallback               │
   │                                        │
   ▼                                        │
Motion Spec v1                              │
   │                                        │
   ▼                                        │
allowlist + clamps + target validation      │
   │                                        │
   └──────────────► GSAP renderer ◄─────────┘
                         │
                         ▼
                    Live preview
```

## Why this project exists

Animated SVG assets sit in an awkward gap. AI image tools usually stop at raster output, design tools can export vectors but do not automate motion well, and full motion suites can be too heavy for quick product work.

AI SVG Animator is aiming for a simpler path:

> **Describe or bring a vector → make it move → ship it to the web.**

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
- **GSAP 3.15** — SVG animation runtime
- **DOMPurify 3.4** — SVG sanitization before inline rendering
- **Cloudflare Workers** — API boundary + static deployment
- **Cloudflare Workers AI** — reserve AI route
- **B.AI OpenAI-compatible API** — free-model pool during MVP development
- browser **Web Animations API** — dependency-free exported preset HTML

## Project structure

```text
src/
├── ai.ts             # frontend AI API client + compact node-map prompt
├── animator.ts       # presets + Motion Spec GSAP executor
├── export.ts         # standalone HTML + file downloads
├── main.ts           # app state, UI and interactions
├── motion-spec.ts    # Motion Spec v1 parser / validator
├── sample.ts         # built-in demo vector
├── styles.css        # Vector Laboratory × Motion Studio UI
├── svg.ts            # sanitization + normalization
└── i18n/
    ├── index.ts
    ├── en.ts
    ├── ru.ts
    └── types.ts

worker/
└── index.ts           # B.AI routes + Cloudflare fallback
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

### 🟡 AI Motion foundation — implemented
- B.AI model routing;
- Cloudflare fallback chain;
- natural-language motion prompt;
- compact SVG node map;
- Motion Spec v1;
- target/effect validation;
- automatic GSAP execution of a valid AI plan.

### ▶ Milestone 2 — AI SVG generation
- RouterAI / Recraft Vector adapter;
- prompt → SVG;
- prompt → SVG → animation end-to-end;
- provider error / rate handling;
- public Cloudflare deployment.

### Milestone 3+ — Semantic scene motion
- vision scene understanding;
- semantic SVG groups;
- automatic key-object selection;
- image / scene decomposition;
- layered and hybrid scene animation;
- motion variations.

### Public MVP polish
- responsive QA;
- real demo asset / animated README example;
- smoke tests;
- Lottie / video export experiments.

## Docs

- [`docs/PRODUCT_PLAN.md`](./docs/PRODUCT_PLAN.md) — product thesis, architecture and milestones.
- [`docs/MOTION_SPEC.md`](./docs/MOTION_SPEC.md) — controlled AI-to-renderer motion contract.
- [`docs/MODEL_ROUTING.md`](./docs/MODEL_ROUTING.md) — B.AI + Cloudflare routing policy.
- [`docs/DEPLOY.md`](./docs/DEPLOY.md) — secure Cloudflare deployment.
- [`docs/LOCALIZATION.md`](./docs/LOCALIZATION.md) — RU / EN strategy.

## Vision

> Type an idea. Get a clean SVG. Make it move. Ship it to the web.