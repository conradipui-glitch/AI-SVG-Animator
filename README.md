<p align="right"><a href="./README.ru.md"><strong>Русский</strong></a></p>

<p align="center">
  <img src="./assets/hero-en.svg" alt="AI SVG Animator hero" width="100%" />
</p>

<h1 align="center">AI SVG Animator</h1>
<p align="center"><strong>Turn ideas into living vectors.</strong></p>

<p align="center">Prompt → SVG → Motion → Animation</p>

<p align="center">
  <a href="./docs/PRODUCT_PLAN.md">Product Plan</a> ·
  <a href="./docs/LOCALIZATION.md">Localization</a>
</p>

## What is it?

**AI SVG Animator** is a web-native tool for turning a text idea, raster reference, or existing SVG into a controllable animated vector asset.

The first public MVP is focused on a clean pipeline:

- generate SVG through **RouterAI / Recraft Vector**;
- normalize and sanitize the SVG;
- apply motion through simple presets first, then Motion Spec / AI planning;
- preview the result live;
- export **HTML + SVG** for the web.

The goal is not AI magic for its own sake. The goal is a workflow that is **fast**, **editable**, and **web-native**.

## How it works

<p align="center">
  <img src="./assets/pipeline-en.svg" alt="AI SVG Animator pipeline" width="100%" />
</p>

1. **Prompt or SVG input** — describe an idea or bring your own SVG.
2. **Generate and clean SVG** — create an editable vector and normalize it.
3. **Apply motion** — start with presets, then move toward AI-generated Motion Spec.
4. **Preview and export** — tweak basic parameters and download a working output.

## Why this project exists

Creating animated SVG assets often sits in an awkward gap: static AI image tools usually stop at raster output, design tools can export vectors but do not automate motion well, and full motion suites can be heavy for quick product work. Developers and designers often just need a clean animated asset **now**.

AI SVG Animator aims to close that gap.

## MVP focus

### P0 — first public build

- prompt input;
- existing SVG paste / upload;
- RouterAI / Recraft Vector integration;
- SVG sanitization + normalization;
- live preview;
- 3 motion presets: **Reveal**, **Draw**, **Float**;
- controls for duration, intensity, and loop;
- export self-contained HTML;
- download original / normalized SVG;
- Cloudflare deployment with no exposed provider secrets.

### Next upgrades

- semantic SVG analyzer;
- Motion Spec JSON;
- AI motion planner;
- Lottie export;
- animated SVG / GIF / WebM exports;
- reusable preset library;
- project storage and sharing.

## Planned architecture

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
Renderer (GSAP)
        │
        ├── Live Preview
        ├── HTML export
        ├── SVG export
        └── Lottie / video exporters (later)
```

## Design direction

This repository uses a visual identity we call:

> **Vector Laboratory × Motion Studio**

Deep navy / graphite, restrained electric-blue accents, Bézier handles, anchor points, motion paths, and an interface aesthetic that feels like both a design tool and a developer tool.

We deliberately avoid the generic mystical neon AI SaaS look 😄

## Repository status

Current phase: **foundation + documentation + visual direction**.

The next implementation step is the actual MVP scaffold: SVG input, normalization, deterministic presets, preview, export, then RouterAI generation and Cloudflare deployment.

## Localization

The service is bilingual from the first MVP:

- **English**
- **Russian**

Browser/system locale is the primary default-language signal. Geography is only a fallback. Manual selection always wins and is persisted locally.

See [`docs/LOCALIZATION.md`](./docs/LOCALIZATION.md).

## Docs

- [`docs/PRODUCT_PLAN.md`](./docs/PRODUCT_PLAN.md) — product thesis, architecture, milestones, MVP scope.
- [`docs/LOCALIZATION.md`](./docs/LOCALIZATION.md) — RU / EN strategy for the app and repository.

## Roadmap

### Milestone 0 — foundation
- product plan;
- localization strategy;
- README / brand direction;
- project structure;
- Cloudflare config.

### Milestone 1 — static animator
- SVG input;
- normalizer;
- deterministic presets;
- preview;
- HTML export.

### Milestone 2 — AI SVG generation
- RouterAI / Recraft integration;
- prompt → SVG → animation end-to-end.

### Milestone 3 — AI motion
- semantic analyzer;
- Motion Spec;
- AI motion planner.

### Milestone 4 — public MVP polish
- responsive UI;
- real demo assets;
- deployment;
- smoke tests.

## Vision

> Type an idea. Get a clean SVG. Make it move. Ship it to the web.
