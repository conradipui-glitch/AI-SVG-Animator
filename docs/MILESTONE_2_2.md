# Milestone 2.2 — Motion-Ready SVG Preparation

AI SVG Animator can already generate and execute a safe Motion Spec against existing SVG element IDs. Milestone 2.2 adds the structural layer needed for semantic, articulated motion: the application can reason about logical SVG groups, motion pivots and parts that should be separated before more advanced animation.

## Scope

### 1. Deterministic structural preparation

Every sanitized SVG receives stable motion targets for both graphic leaf nodes and existing `<g>` groups. Static presets remain leaf-based, while AI Motion can target a logical group when moving a complete object is more appropriate than animating every path independently.

### 2. Local semantic hints

The client derives conservative semantic hints from existing SVG metadata such as IDs, labels, titles and classes. It recognizes common motion-design roles including characters, body parts, wings, wheels, vegetation, clouds, smoke, water, light and background elements. English and Russian labels are supported by the local heuristic layer.

Each prepared node can carry:

- human-readable label;
- semantic role;
- confidence;
- motion potential;
- recommended effect families;
- pivot hint for articulated rotation.

### 3. AI semantic enrichment

The optional **Analyze parts with AI** action sends both a rendered view of the artwork and its structural motion map to the configured vision-capable model. The model may enrich existing IDs with semantic roles and pivots.

The model is not allowed to invent selectors. Unknown IDs are rejected by the client before any metadata is applied.

### 4. Separation candidates

The deterministic analyzer identifies potentially difficult structures such as:

- many ungrouped root shapes;
- dense flat groups;
- semantically generic groups;
- very large monolithic paths.

The AI preparation pass may additionally say that a visible moving part should be separated if it is currently merged into a larger path or group. These suggestions are advisory only.

### 5. Motion planner integration

The normal AI Motion and AI Variants prompts now receive the compact Motion-Ready Scene Map. The planner can therefore prefer whole-object group targets, choose meaningful parts and respect pivot hints instead of treating the SVG as an undifferentiated list of paths.

## Safety model

Milestone 2.2 deliberately does **not** perform destructive path surgery.

- AI never writes executable JavaScript or CSS.
- AI can only annotate IDs that already exist in the sanitized SVG.
- Motion Spec validation accepts only registered motion targets.
- Automatic structural analysis does not alter path geometry.
- Suggested splitting remains advisory until a dedicated vector decomposition/regeneration stage is implemented.

This keeps the visual source stable while still exposing enough semantic structure for substantially better motion planning.

## Acceptance criteria

- [x] Existing SVG groups receive stable motion-target IDs.
- [x] Leaf nodes remain compatible with the existing static presets.
- [x] A local Motion-Ready Scene Map is generated after SVG normalization.
- [x] The map contains readiness score, groups, semantic hints, pivots and separation candidates.
- [x] AI semantic preparation can enrich only existing SVG IDs.
- [x] Unknown IDs returned by the model are ignored and reported.
- [x] AI Motion Spec can target logical groups as well as leaf shapes.
- [x] Semantic pivots flow into GSAP transform origins.
- [x] Motion and variants prompts consume the semantic scene map.
- [x] Production deployment smoke test covers the semantic preparation route.
- [ ] Browser acceptance on several real-world SVGs, including an articulated character and a flat/monolithic illustration.

## Next boundary

The next decomposition milestone may turn selected separation suggestions into actual editable assets through one of three controlled strategies:

1. preserve and regroup existing SVG geometry;
2. regenerate a motion-friendly layered SVG;
3. extract a hybrid scene into background + independently animatable SVG/PNG/WebP objects.

That stage should remain separate from Milestone 2.2 because it can modify the artwork rather than only describe it.
