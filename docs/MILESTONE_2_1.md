# Milestone 2.1 — AI Motion Fix + Auto Variants

Status: **production candidate — automated backend acceptance passed; manual browser acceptance pending**

## Goal

Make AI animation genuinely usable in production:

1. user loads an SVG;
2. user either describes motion or asks for automatic variants;
3. AI receives both the SVG structure and a rendered visual representation;
4. AI returns an executable Motion Spec v1;
5. the spec is validated against real SVG target IDs;
6. valid tracks are applied immediately;
7. the animation starts in the live canvas without an extra action.

## User flows

### Prompted animation

`SVG → prompt → Animate with AI → visual/structural analysis → Motion Spec → validation → playback`

The Motion Spec is implementation detail. It lives in a collapsible technical panel rather than being the primary product result.

### Automatic variants

`SVG → Suggest 3 variants → Subtle / Natural / Expressive → Apply → playback`

- **Subtle** — minimal, elegant motion focused on the primary subject.
- **Natural** — balanced believable motion for key subjects and limited environment.
- **Expressive** — visibly stronger choreography while preserving clarity.

## P0 — reliability

- [x] Remove conflicting backend Motion Spec instructions.
- [x] Return safe route diagnostics (`provider`, `model`, `status`, message) without exposing secrets.
- [x] Keep partial valid Motion Specs instead of rejecting the entire AI response.
- [x] Accept common harmless schema deviations (`easing`, `fade`, `float`, `sway`, `angle`, top-level motion values).
- [x] Production deployment stores `BAI_API_KEY` only in Cloudflare Worker Secrets.
- [x] Add production AI smoke checks to deploy workflow.
- [x] Confirm live B.AI request succeeds after deployment.
- [ ] Confirm at least one Cloudflare fallback route succeeds when B.AI is unavailable.

### Production evidence — 2026-09-06

`https://ai-svg-animator.conradipui.workers.dev`

- `/api/ai/health` → B.AI configured; 48 models discovered; all four intended free candidates visible.
- `/api/ai/motion` → HTTP 200 from `bai / glm-5.3-flash`, no fallback, valid Motion Spec returned.
- `/api/ai/variants` → HTTP 200 from `bai / glm-5.3-flash`, no fallback, three populated variants returned: Subtle / Natural / Expressive.

The production smoke also exposed a real model-format deviation (`angle` instead of `rotation`), which is now normalized by the Motion Spec parser.

## P0 — one-click AI motion UX

- [x] Rename the primary action to **Animate with AI** / **Анимировать с AI**.
- [x] No second action is required after the AI response.
- [x] Show progress states for preparation, AI request, validation and application.
- [x] Automatically play a valid Motion Spec.
- [x] Keep Replay bound to the latest AI Motion Spec.
- [x] Put raw model output and diagnostics under **Technical details**.
- [x] Show partial-validation warnings instead of silently dropping tracks.
- [x] Keep the last actually played AI Motion Spec as the active export state.
- [x] Export active AI animation as standalone HTML using the browser Web Animations API.

## P1 — visual + structural understanding

The AI receives two views of the same SVG:

1. **visual render** — the cleaned SVG is rendered to PNG in the browser and sent to a multimodal model when available;
2. **structural context** — viewBox, target IDs, element types, parent IDs, fill/stroke/transform metadata, path excerpts and cleaned SVG markup.

This is the first bridge between "what the picture means" and "which exact SVG nodes can move".

It is intentionally not yet full semantic restructuring. Splitting a solid arm into shoulder/forearm/hand, generating missing anatomy, rebuilding eyes, or rewriting topology belongs to Motion-Ready SVG Preparation / Semantic Motion Director milestones.

## P1 — automatic variants

- [x] Add `/api/ai/variants`.
- [x] Ask for exactly three directions: Subtle / Natural / Expressive.
- [x] Validate each returned Motion Spec independently.
- [x] Display usable variants as cards.
- [x] Apply the selected card immediately to the live canvas.
- [x] Preserve technical warnings for each variant.
- [x] Verify the production variants endpoint with multiple allowed targets.
- [ ] Complete manual browser QA on simple, character-like and multi-object SVG fixtures.

## Motion Spec safety contract

The AI never executes arbitrary JavaScript or CSS. Renderer input is limited to Motion Spec v1.

Allowed effects:

- `translate`
- `rotate`
- `scale`
- `opacity`
- `pulse`
- `draw`

Aliases such as `float`, `sway`, `move`, `fade`, `zoom` and model-produced rotation `angle` values may be normalized into the safe contract.

Every target must resolve to an ID already present in the sanitized SVG and marked as an animator target. Unknown target IDs are rejected.

## Error model

User-facing status remains concise. Technical details may include:

- provider;
- model;
- HTTP status;
- provider-safe error message;
- accepted/rejected track counts;
- raw model response.

API keys, authorization headers and Cloudflare credentials must never be returned to the client or written to repository files.

## Acceptance criteria

Milestone 2.1 is complete when all of the following are true on the production Workers URL:

1. Upload/load an SVG.
2. Enter a natural-language motion prompt.
3. Press **Animate with AI**.
4. Receive and automatically play an AI-generated animation with no second click.
5. Replay the same AI animation.
6. Ask for automatic variants.
7. Receive at least three usable directions when the model follows the contract.
8. Apply each variant from its card and see it play immediately.
9. Export the currently active AI animation and replay it from the standalone HTML file.
10. A malformed AI response does not break the static animator.
11. Partial valid specs still animate valid tracks.
12. Provider failures expose useful safe diagnostics in Technical details.
13. CI build and Worker dry-run pass.
14. Production deploy succeeds with secrets kept outside the repository.
15. Production AI smoke tests return HTTP 200 for motion and variants.

Automated criteria 13–15 are passing. Criteria 1–12 require final author/browser acceptance before this milestone is marked **closed**.

## Next milestone

### Milestone 2.2 — Motion-Ready SVG Preparation

- semantic grouping;
- geometry-aware grouping and pivot preparation;
- identifying parts that should be split before motion;
- editable semantic labels;
- groundwork for AI-assisted topology reconstruction.

Then:

### Milestone 3 — Semantic Motion Director

- deeper scene understanding;
- character/object semantics;
- intelligent restructuring of animation-ready elements;
- scene-level choreography;
- prompt-driven and automatic motion based on visual meaning.
