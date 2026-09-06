<p align="right"><a href="./README.ru.md"><strong>Русский</strong></a></p>

<p align="center">
  <img src="./assets/hero-en.svg" alt="AI SVG Animator hero" width="100%" />
</p>

<h1 align="center">AI SVG Animator</h1>
<p align="center"><strong>Turn ideas into living vectors.</strong></p>
<p align="center">SVG → Motion-Ready Map → AI Motion → Web · Visual + structural understanding · Auto variants</p>

<p align="center">
  <a href="https://ai-svg-animator.conradipui.workers.dev"><strong>Open live app</strong></a> ·
  <a href="./docs/PRODUCT_PLAN.md">Product Plan</a> ·
  <a href="./docs/MILESTONE_2_2.md">Milestone 2.2</a> ·
  <a href="./docs/MOTION_SPEC.md">Motion Spec</a> ·
  <a href="./docs/MODEL_ROUTING.md">Model Routing</a>
</p>

## Current build

**Static Animator, AI Motion 2.1, and the technical implementation of Motion-Ready SVG Preparation 2.2 are live in production.**

The live app can:

- paste or upload an SVG and sanitize unsafe markup with DOMPurify;
- normalize sizing / `viewBox` and assign stable IDs to graphic nodes and existing SVG groups;
- preview the vector on a live canvas;
- apply deterministic **Reveal**, **Draw**, and **Float** presets;
- tune duration, intensity, and looping;
- switch the complete UI between **English / Russian** without losing work;
- build a local **Motion-Ready Scene Map** after SVG normalization;
- score motion readiness and expose logical groups, semantic hints, pivot hints, motion potential, and likely split candidates;
- infer conservative semantics from SVG IDs, labels, titles, classes, and metadata in English or Russian;
- optionally press **Analyze parts with AI** to enrich existing SVG IDs using both the rendered artwork and structural scene map;
- reject semantic IDs invented by the model instead of applying them;
- surface advisory separation suggestions when an eye, hand, wing, wheel, branch, cloth section, or other useful part is visually present but merged into a larger path/group;
- choose a currently available free B.AI model;
- describe motion in natural language and press **Animate with AI** once;
- use an empty prompt for tasteful automatic motion;
- send the model both a rendered PNG reference and structural SVG context;
- allow AI Motion to target a whole logical `<g>` or an individual shape;
- respect semantic pivot hints for articulated rotation;
- validate returned **Motion Spec v1** against real motion-target IDs;
- keep valid tracks even when part of an AI response is malformed;
- automatically play a valid AI animation through GSAP;
- generate **Subtle / Natural / Expressive** animation variants;
- inspect provider/model/validation diagnostics under **Technical details**;
- download the prepared SVG;
- export the currently active preset or AI animation as a self-contained HTML file, including semantic pivot behavior.

### Production AI status

Production smoke tests currently pass against:

`https://ai-svg-animator.conradipui.workers.dev`

- B.AI health/model discovery: OK;
- four configured free B.AI models visible to the credential;
- AI Motion generation: HTTP 200, valid Motion Spec;
- Motion-Ready semantic preparation: HTTP 200, existing-ID-only semantic map accepted;
- three-way auto-variant generation: HTTP 200;
- provider keys remain server-side in Cloudflare Worker Secrets.

Milestone 2.2 now needs browser/author QA on several real-world SVG fixtures, especially an articulated character and a flat/monolithic illustration. See [`docs/MILESTONE_2_2.md`](./docs/MILESTONE_2_2.md).

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
SVG normalizer + stable shape/group targets
   │
   ▼
Motion-Ready Scene Map
roles · hierarchy · pivots · split candidates
   │
   ├──────── deterministic presets ────────────────┐
   │                                                │
   ├──► rendered PNG visual reference              │
   │                                                │
   └──► semantic SVG structure / IDs / geometry     │
                │                                   │
                ▼                                   │
       B.AI multimodal model                        │
       + Cloudflare fallback                        │
                │                                   │
                ├──► semantic preparation           │
                ├──► single Motion Spec             │
                └──► 3 auto variants                │
                │                                   │
                ▼                                   │
      allowlist + clamps + validation               │
                │                                   │
                └────────► GSAP renderer ◄──────────┘
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

> **Describe or bring a vector → understand its parts → make it move → ship it to the web.**

The longer-term direction is an **AI Motion Director** that understands a scene semantically, prepares artwork for motion, proposes several animation strategies, and can eventually restructure vector geometry when the original file is not animation-ready.

## Safety boundary

Milestone 2.2 intentionally does **not** let the model perform destructive path surgery.

- AI never writes executable JavaScript or CSS.
- AI can annotate only IDs that already exist in the sanitized SVG.
- Motion Spec accepts only registered motion targets.
- Local preparation does not alter path geometry.
- If a visible articulated part is merged into a monolithic shape, the system reports a separation suggestion rather than pretending the part already exists.

Actual vector decomposition/regeneration is a separate future stage.

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
- browser **Web Animations API** — dependency-free standalone HTML export

## Project structure

```text
src/
├── ai.ts             # AI API client + semantic visual/structural context
├── animator.ts       # presets + pivot-aware Motion Spec GSAP executor
├── export.ts         # standalone preset / AI animation HTML export
├── main.ts           # app state, Motion-Ready UI, AI motion and variants
├── motion-spec.ts    # tolerant Motion Spec v1 parser / validator
├── scene-map.ts      # semantic map, pivots, readiness and split candidates
├── readiness.css     # Motion-Ready panel styles
├── sample.ts         # built-in demo vector
├── styles.css        # Vector Laboratory × Motion Studio UI
├── svg.ts            # sanitization + shape/group normalization
└── i18n/
    ├── index.ts
    ├── en.ts
    ├── ru.ts
    └── types.ts

worker/
└── index.ts           # B.AI motion/prepare/variants/vision + Cloudflare fallback
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

### 🟢 Milestone 2.1 — AI Motion + Auto Variants
- live B.AI motion route;
- one-click **Animate with AI** flow;
- visual + structural SVG context;
- tolerant Motion Spec validation;
- automatic GSAP playback;
- Subtle / Natural / Expressive variants;
- diagnostics / partial validation;
- standalone AI animation export;
- broader manual browser acceptance remains useful.

### 🟢 Milestone 2.2 — Motion-Ready SVG Preparation
- stable shape + group motion targets;
- local semantic scene map;
- motion-readiness scoring;
- semantic labels, motion potential and pivot hints;
- optional AI part analysis using visual + SVG context;
- existing-ID-only semantic validation;
- advisory split candidates for merged parts;
- group-level Motion Specs and pivot-aware GSAP/export;
- production `/api/ai/prepare` smoke test passed;
- real-world browser fixture QA pending.

### ▶ Milestone 3 — Semantic Motion Director
- richer scene/object hierarchy;
- relationship-aware choreography across parent/child parts;
- motion roles such as primary subject, secondary motion, atmosphere and static anchors;
- semantic motion recipes for characters, vehicles, nature and interface graphics;
- automatic strategy selection from visual meaning;
- prepare the boundary for controlled vector decomposition/regeneration.

### Later decomposition / input / generation layers
- preserve-and-regroup existing SVG geometry;
- regenerate a motion-friendly layered SVG;
- raster image → motion-ready vector or hybrid layered scene;
- prompt → SVG generation;
- Universal Import Layer for SVG/SVGZ, EPS/PS/AI/PDF and later additional vector formats;
- layered / hybrid SVG + PNG/WebP scenes.

### Public MVP polish
- responsive QA;
- real demo asset / animated README example made with the tool itself;
- broader browser fixture tests;
- Lottie / video export experiments.

## Docs

- [`docs/PRODUCT_PLAN.md`](./docs/PRODUCT_PLAN.md) — product thesis, architecture and milestones.
- [`docs/MILESTONE_2_1.md`](./docs/MILESTONE_2_1.md) — AI Motion acceptance specification.
- [`docs/MILESTONE_2_2.md`](./docs/MILESTONE_2_2.md) — Motion-Ready SVG preparation and safety boundary.
- [`docs/MOTION_SPEC.md`](./docs/MOTION_SPEC.md) — controlled AI-to-renderer motion contract.
- [`docs/MODEL_ROUTING.md`](./docs/MODEL_ROUTING.md) — B.AI + Cloudflare routing policy.
- [`docs/DEPLOY.md`](./docs/DEPLOY.md) — secure Cloudflare deployment.
- [`docs/LOCALIZATION.md`](./docs/LOCALIZATION.md) — RU / EN strategy.

## Vision

> Type an idea. Get a clean SVG. Understand its parts. Make it move. Ship it to the web.