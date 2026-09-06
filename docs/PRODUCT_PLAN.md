# AI SVG Animator — Product & MVP Plan

> Working plan for the product. The near-term goal is to ship a simple, impressive and technically clean service that turns an idea or SVG into a controllable vector animation. The strategic direction is broader: evolve the product into an **AI Motion Director** that can understand images and scenes semantically, decompose them into meaningful layers and objects, decide what should move, and create motion automatically or from a user prompt.

## 1. Product thesis

**AI SVG Animator** converts a text idea, raster reference or existing SVG into an animated vector or layered scene that can be previewed live and exported for the web.

Near-term core promise:

> **Describe it → generate SVG → animate it → export it.**

Strategic promise:

> **Show the AI an image or scene → let it understand what is important → decompose it into meaningful motion-ready elements → animate the right things automatically or exactly as described.**

The product should optimize for four things:

1. **Fast first result** — a user should reach a visible animation in under a minute.
2. **Controllability** — animation is not a black box; motion remains editable through presets/specs/prompts.
3. **Semantic motion** — the system should understand *what* an SVG path or image region represents, not only its geometry.
4. **Web-native output** — SVG/HTML/GSAP first, then Lottie/video and hybrid scene formats.

## 2. Working target audience

Primary:
- frontend developers who need animated illustrations, icons and hero assets;
- product/UI designers who want motion without a full After Effects workflow;
- indie hackers / AI builders who need fast visual assets for MVPs;
- motion designers who want AI-assisted ideation and repetitive-work reduction.

Secondary:
- marketers / content creators;
- game and interactive-web developers;
- brand designers creating animated logos and identity elements;
- creators who want to turn a flat illustration or scene into a lightweight web animation.

## 3. User journeys

### Path A — Prompt to animation
1. User enters a text prompt.
2. Recraft Vector via RouterAI generates an editable SVG.
3. SVG is cleaned/normalized.
4. User selects an animation preset or accepts automatic motion.
5. Live preview starts immediately.
6. User adjusts speed/intensity/loop or describes desired motion in text.
7. User exports HTML bundle / SVG.

### Path B — Existing SVG to animation
1. User uploads or pastes SVG.
2. SVG is validated and normalized.
3. Semantic groups / paths are detected.
4. Vision / language reasoning identifies logical objects where possible.
5. AI automatically proposes motion for the key elements or user supplies a motion prompt.
6. User previews, chooses a variation and exports.

### Path C — Raster image to motion-ready illustration
1. User uploads PNG/JPG/WebP.
2. Vision model analyzes the image and identifies key subjects, objects, background and scene structure.
3. System chooses one of two transformation strategies:
   - **Preserve style** — keep the source appearance as close as possible;
   - **Optimize for animation** — simplify/recompose the image into cleaner motion-ready shapes and layers.
4. Image is vectorized or converted into a hybrid layered scene.
5. AI selects the important objects to animate by default.
6. User receives one or more animation variants.

### Path D — Full scene animation
1. User uploads a complete illustration / scene.
2. Vision model constructs a semantic scene map.
3. System separates the scene into meaningful layers, for example:
   - background;
   - middle ground;
   - foreground;
   - characters;
   - vehicles;
   - atmosphere such as smoke/clouds/water/light;
   - secondary props.
4. Depending on the scene, the representation may be:
   - pure SVG;
   - layered SVG;
   - hybrid SVG + transparent PNG assets + background image.
5. AI chooses the most useful motion targets and creates a Motion Spec.
6. User accepts automatic animation, chooses a variant, changes intensity, or describes the desired motion in natural language.
7. Renderer produces a live animated scene.

## 4. Functional scope

### P0 — Required for first public build
- prompt input;
- SVG generation through RouterAI / Recraft Vector;
- paste/upload existing SVG;
- SVG sanitization + normalization;
- live preview;
- 3 deterministic motion presets:
  - **Reveal** — fade / scale / stagger;
  - **Draw** — path drawing / stroke reveal;
  - **Float** — subtle looping motion;
- controls: duration, intensity, loop;
- export self-contained HTML;
- download original/normalized SVG;
- Cloudflare deployment;
- no secrets in repository.

### P1 — Semantic SVG + AI Motion Planner
- SVG semantic analyzer;
- generated stable element IDs / roles;
- semantic mapping from raw SVG groups/paths to logical objects where possible;
- Motion Spec JSON format;
- AI Motion Planner that produces Motion Spec instead of raw animation code;
- automatic animation by default;
- prompt-to-motion for an already generated/uploaded SVG;
- 2–3 motion variations on request;
- editable generated motion plan;
- animation history / regenerate variations.

### P2 — Vision scene understanding
- raster image upload;
- vision-model scene analysis;
- object / subject identification;
- foreground/background understanding;
- saliency / importance ranking;
- animation-potential scoring;
- automatic selection of the most meaningful motion targets;
- user prompt such as “animate only the train, smoke and coat” to override the automatic selection.

### P3 — Scene decomposition + hybrid animation
- scene decomposition into logical layers/objects;
- clean-background generation when foreground objects are extracted;
- isolated transparent assets for key subjects/objects;
- separate background asset;
- pure SVG, layered SVG and hybrid SVG/PNG scene strategies;
- optional image-model preprocessing to create a more animation-friendly source image;
- multi-object and full-scene animation.

### P4 — AI Motion Director
- automatic semantic motion based on object type and scene context;
- natural-language motion direction;
- several animation concepts/variants on demand;
- scene-wide motion planning;
- object-aware animation templates;
- intensity policies: **Minimum / Normal / High**;
- optional **Static+** mode for extremely subtle motion;
- user-selectable scope:
  - key objects only;
  - selected objects;
  - full scene;
  - custom prompt.

### P5 — Export ecosystem
- Lottie JSON export;
- animated SVG export where feasible;
- GIF / WebM / MP4 preview export;
- reusable presets library;
- shareable animation links.

### P6 — Product layer
- accounts / projects;
- saved assets;
- brand style presets;
- batch generation;
- API endpoint / SDK;
- community motion templates.

## 5. AI Motion Director — product behavior

The default experience should be useful without requiring the user to understand layers, SVG paths or animation terminology.

### Default automatic behavior

By default, AI should animate **only the most important characters/objects and a small amount of environmental motion**. It should avoid making every available element move.

Examples:
- character → breathing, blink, subtle head/body movement;
- hair / cloth → gentle sway;
- vehicle → wheel/position/bob/smoke motion where appropriate;
- water → wave/ripple motion;
- smoke / steam → drift;
- trees / plants → wind sway;
- clouds → slow drift;
- lights → subtle flicker/glow;
- background → small parallax only when it improves depth.

### Motion intensity presets

#### Static+
Almost static:
- reveal;
- tiny parallax;
- subtle lighting/breathing effects.

#### Minimum
Animate only the key subject(s):
- main character/object;
- minimal secondary motion;
- little or no background animation.

#### Normal — default
Balanced motion:
- primary object(s);
- one or two secondary elements;
- modest atmosphere/depth motion;
- no unnecessary visual noise.

#### High
More expressive scene animation:
- several semantic objects;
- environment loops;
- particles/atmosphere where appropriate;
- stronger parallax and scene depth.

## 6. Image transformation strategy

A complex image should **not automatically be forced into one monolithic SVG**.

The system should choose the most useful representation for animation.

### Strategy A — Preserve style
Use when the source already looks good and visual fidelity matters.

Possible output:
- background PNG/WebP;
- transparent foreground object assets;
- vector overlays / masks / paths where useful.

### Strategy B — Optimize for animation
Use when the image is too complex or poorly separated for good motion.

An image model can create an animation-ready reinterpretation that:
- simplifies shapes;
- separates silhouettes more clearly;
- reduces unnecessary visual noise;
- creates cleaner object boundaries;
- preserves the visual concept while making extraction/vectorization easier.

### Strategy C — Pure vector
Best for:
- logos;
- icons;
- flat illustrations;
- simple characters;
- diagrammatic or graphic art.

### Strategy D — Hybrid scene
Best for:
- detailed illustrations;
- painterly scenes;
- semi-realistic compositions;
- images where forcing every detail into SVG would reduce quality or increase complexity.

## 7. Scene Graph direction

For scene-aware animation, the internal model should eventually move beyond raw SVG nodes.

Example conceptual structure:

```json
{
  "scene": {
    "type": "railway_station",
    "layers": [
      { "id": "background", "depth": 0, "role": "environment" },
      { "id": "train", "depth": 2, "role": "primary_subject" },
      { "id": "character", "depth": 3, "role": "secondary_subject" },
      { "id": "smoke", "depth": 4, "role": "atmosphere" }
    ]
  }
}
```

Each semantic node may later include:
- label / role;
- importance score;
- animation-potential score;
- depth;
- parent-child relation;
- motion constraints;
- source asset / SVG selector;
- optional mask or anchor information.

## 8. Technical architecture

```text
Prompt / SVG / Raster / Full Scene
        │
        ▼
Input Gateway
        │
        ├── text → Vector/Image Provider
        ├── SVG → validation
        └── raster → Vision Analysis
        │
        ▼
Representation Strategy
        │
        ├── Pure SVG
        ├── Layered SVG
        └── Hybrid Scene (SVG + PNG/WebP)
        │
        ▼
Sanitizer + Normalizer
        │
        ▼
Semantic Analyzer / Vision Model
        │
        ▼
Scene Graph
        │
        ▼
Motion Director
  auto / prompt / variants
        │
        ▼
Motion Spec JSON
        │
        ▼
Renderer
      GSAP / Web Animations
        │
        ├── Live Preview
        ├── HTML export
        ├── SVG export
        ├── Hybrid scene export
        └── Lottie / video exporters (later)
```

## 9. Proposed stack

### Frontend
- Vite
- TypeScript
- start framework-light for MVP; React can be introduced if UI complexity justifies it
- GSAP for runtime animation
- Web Animations API for dependency-free exported HTML where practical

### Worker / backend
- Cloudflare Workers
- RouterAI proxy calls from the Worker so provider keys never reach the browser
- validation / limits / error normalization at the Worker boundary
- provider adapters so vector, vision and image models can be swapped independently

### SVG processing
- SVGO or equivalent deterministic normalization step
- safe SVG sanitization before inline rendering
- stable ID generation for animatable elements

### AI roles
Different models can be used for different jobs:
- **vector model** — prompt/image → SVG;
- **vision model** — semantic scene understanding and target selection;
- **image model** — optional motion-ready restyling, object extraction, background reconstruction or asset generation;
- **language/reasoning model** — Motion Spec planning and prompt-to-motion interpretation.

The architecture should avoid hard-coding one vendor/model wherever possible.

## 10. Motion Spec direction

The intermediate format should describe **intent**, not implementation.

Example:

```json
{
  "version": 1,
  "tracks": [
    {
      "target": "#character-coat",
      "semanticRole": "cloth",
      "effect": "sway",
      "duration": 2.4,
      "intensity": 0.35,
      "loop": true,
      "ease": "sine.inOut"
    },
    {
      "target": "#smoke",
      "semanticRole": "atmosphere",
      "effect": "drift",
      "duration": 4.8,
      "loop": true
    }
  ]
}
```

Benefits:
- deterministic renderer;
- easier validation;
- editable AI output;
- semantic reasoning without allowing a model to emit arbitrary runtime code;
- future compatibility with several exporters.

## 11. Motion prompting

After an SVG or scene is ready, the user should be able to describe motion directly in natural language.

Examples:
- “Make the bird take off slowly and then hover.”
- “Animate only the water and clouds.”
- “The train begins moving, smoke drifts upward, the character remains still except for the coat.”
- “Make this feel cinematic but subtle.”

The AI Motion Director should translate that request into a validated Motion Spec rather than uncontrolled JavaScript.

## 12. UX principles

- **Canvas first.** The animation should dominate the interface.
- **Automatic by default.** A useful motion plan should appear without requiring configuration.
- **Prompt second.** Users can refine the automatic result with natural language.
- **No timeline complexity in early MVP.** Start with preset cards + a few controls.
- **Show what AI understood.** Key semantic objects/layers should become inspectable/selectable.
- **Offer variations rather than forcing one answer.** Especially for semantic motion.
- **Keep the AI visible but not magical.** Users should see and edit what the AI decided.
- **Dark interface by default**, but avoid generic neon-cyberpunk overload.

## 13. README / repository presentation plan

README should function as both technical documentation and mini landing page.

Recommended structure:

1. Hero artwork / animated visual identity
2. One-line product promise
3. Short demo GIF / animated SVG / MP4 link
4. “How it works” visual pipeline
5. Feature cards
6. Current MVP status
7. Architecture diagram
8. Local development
9. Environment variables / security notes
10. Cloudflare deployment
11. Roadmap
12. Contributing / license

Once the working tool can generate a useful animation, its own output should be used as the README before/after demo. This makes the README a proof-of-work for the product.

## 14. Visual direction

The accepted design direction is:

> **70% Vector Laboratory + 30% Motion Studio**

Principles:
- graphite / deep navy background;
- thin technical grid;
- Bézier handles, anchor points, paths and motion trajectories;
- restrained electric accent;
- interface language that combines creative-tool aesthetics with developer credibility;
- avoid generic “AI magic” visual clichés.

## 15. README image asset set

Create original project-owned assets instead of borrowing screenshots from other products:

- `hero.svg` — main illustration;
- `pipeline.svg` — Prompt → Vector → Motion → Export;
- `presets.svg` — Reveal / Draw / Float examples;
- `architecture.svg` — technical architecture diagram;
- `demo.gif` / animated SVG / `demo.webm` — real product-generated before/after preview once the tool can create it.

All visual assets should use one coherent design system so the README and app feel like the same product.

## 16. Milestones

### Milestone 0 — Repository foundation ✅
- product plan;
- README visual direction;
- project structure;
- localization strategy.

### Milestone 1 — Static Animator ✅
- SVG input;
- sanitization/normalization;
- three deterministic presets;
- live preview;
- HTML/SVG export;
- RU/EN interface;
- CI build check.

### Milestone 2 — AI SVG generation ▶
- Cloudflare Worker provider proxy;
- RouterAI / Recraft integration;
- prompt → SVG → animation end-to-end;
- errors and rate handling;
- deployed first public working flow.

### Milestone 3 — Semantic SVG + prompt-to-motion
- semantic SVG analyzer;
- stable semantic IDs/roles;
- Motion Spec v1;
- AI Motion Planner;
- automatic motion selection;
- natural-language prompt-to-motion;
- motion variations.

### Milestone 4 — Vision Scene Understanding
- raster upload;
- vision scene analysis;
- subject/object/background detection;
- importance and animation-potential scoring;
- Minimum / Normal / High policies;
- user-selectable animation targets.

### Milestone 5 — Scene Decomposition
- animation-ready image preprocessing;
- background/foreground separation;
- isolated transparent object assets;
- background reconstruction where required;
- pure vector vs hybrid representation strategy;
- multi-object scene assembly.

### Milestone 6 — AI Motion Director
- full-scene semantic animation;
- object-aware motion logic;
- automatic motion by default;
- custom motion prompts;
- multiple creative variants;
- key-objects-only vs full-scene modes.

### Milestone 7 — Export + public product polish
- responsive polish;
- Lottie / video exporters;
- README product-generated demo;
- saved/shareable projects where useful;
- deployment hardening;
- smoke tests.

## 17. First public release definition of done

The first public MVP is complete when a new user can:

1. open the deployed site;
2. type a prompt or paste/upload an SVG;
3. receive a valid vector result;
4. apply automatic motion or one of the deterministic presets;
5. see it animate live;
6. change basic motion parameters;
7. export a working HTML/SVG asset;
8. do all of this in RU or EN;
9. do all of this without exposing provider secrets in the client or repository.

## 18. Strategic definition of done

The broader AI Motion Director vision is realized when a user can:

1. upload a complete image or illustration;
2. have AI correctly identify the scene, main subjects and logical objects;
3. receive an automatically selected animation plan that focuses on the meaningful elements rather than moving everything;
4. choose Minimum / Normal / High intensity;
5. optionally describe exactly what should move in natural language;
6. have the system decompose/rebuild the scene into an appropriate pure-vector or hybrid representation;
7. preview multiple motion variants;
8. export a lightweight web-ready animated result.
