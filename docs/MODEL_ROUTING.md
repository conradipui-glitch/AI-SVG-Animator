# AI SVG Animator — Model Routing Strategy

> Working routing policy for semantic SVG analysis, scene understanding and AI Motion Director features.

## Goals

The product must not depend on one provider or one model. Model selection is based on **capability + current price + availability**, with currently free models preferred during MVP development.

The routing layer separates two main jobs:

1. **Reasoning / Motion planning** — understand SVG structure, produce SceneGraph / Motion Spec, interpret animation prompts.
2. **Vision / Scene understanding** — inspect raster images or rendered SVGs, identify objects/layers, rank animation targets and propose scene decomposition.

## Primary provider — B.AI

Base URL:

```text
https://api.b.ai/v1
```

The Worker uses B.AI's OpenAI-compatible `/chat/completions` endpoint and can query `GET /models` to see which models are currently available for the configured credential.

### Current free model pool

These model IDs are configured as the MVP free pool:

| Model | Text | Vision | Intended role |
| --- | --- | --- | --- |
| `glm-5.3-flash` | yes | yes | default reasoning + scene analysis |
| `qwen3.8-flash` | yes | yes | multimodal fallback / alternative |
| `mimo-v2.5` | yes | yes | multimodal fallback / alternative |
| `hy3` | yes | no | text reasoning / Motion Spec only |

Current B.AI documentation marks all four as `0 Credits` offers at the time of this update. These are promotions, not permanent pricing guarantees, so runtime availability and pricing should be treated as dynamic.

## Default routes

### Reasoning / Motion Spec

Default:

```text
glm-5.3-flash
```

Fallback order inside the B.AI pool:

```text
glm-5.3-flash
→ qwen3.8-flash
→ mimo-v2.5
→ hy3
→ Cloudflare Workers AI
```

Use for:
- SVG semantic reasoning from structured descriptions;
- Motion Spec generation;
- animation-prompt interpretation;
- ranking motion alternatives;
- SceneGraph post-processing;
- structured planning.

### Vision / Scene Understanding

Default:

```text
glm-5.3-flash
```

Vision-capable B.AI pool:

```text
glm-5.3-flash
→ qwen3.8-flash
→ mimo-v2.5
→ Cloudflare Workers AI
```

`hy3` is explicitly excluded from vision routes because it is text-only.

Use vision routes for:
- raster scene analysis;
- rendered-SVG inspection;
- object / character identification;
- background / foreground / depth reasoning;
- selecting key animation targets;
- recommending scene decomposition;
- interpreting a user's prompt such as “animate the smoke and train, keep the building still.”

## User-selectable model

The API accepts an optional `model` field for `/api/ai/reason` and `/api/ai/vision`.

If the requested model exists in the configured pool and supports the required capability, it is tried first. If it fails, the router continues through other eligible free models and then Cloudflare fallback.

If the requested model does not support the requested modality — for example `hy3` on a vision request — the router ignores that preference and chooses an eligible model.

## Dynamic availability check

`GET /api/ai/models` queries B.AI's `/v1/models` endpoint when a Worker secret is configured.

The application can therefore expose model choices based on both:
- our known capability registry;
- the model IDs currently returned for the active B.AI credential.

This is preferred over assuming that a limited-time free model will remain available forever.

## Cloudflare fallback chain

Cloudflare Workers AI remains the independent reserve provider.

### Reasoning fallback

1. `@cf/zai-org/glm-4.7-flash`
2. `@cf/google/gemma-4-26b-a4b-it`

### Vision fallback

1. `@cf/qwen/qwen3.8-27b`
2. `@cf/google/gemma-4-26b-a4b-it`
3. `@cf/moondream/moondream3.1-9B-A2B`

Moondream is intended mainly as a lightweight detector / pointing / OCR stage rather than the default deep scene-understanding model.

## Runtime rules

### 1. Capability first

Never route only by model name. The adapter registry declares:
- provider;
- model ID;
- text capability;
- vision capability;
- intended role.

### 2. Free-first during MVP

Prefer B.AI models that are currently free, while keeping Cloudflare fallback available from day one.

A free promotion ending must not require a frontend rewrite: change the routing configuration / registry instead.

### 3. Fail fast and continue

For provider failures such as:
- unsupported modality;
- authentication failure;
- model unavailable;
- rate limit;
- provider 5xx;
- timeout;

continue to the next eligible route instead of failing the whole user flow immediately.

### 4. Preserve provider metadata

Every successful AI response returned to the application includes routing metadata:

```json
{
  "provider": "bai",
  "model": "glm-5.3-flash",
  "fallbackUsed": false,
  "latencyMs": 812
}
```

This is useful for debugging, future quality comparison, latency analysis and routing optimization. It does not need to be prominent in the default UI.

### 5. No secrets in repository or client

The real B.AI API key must exist only as:
- a Cloudflare Worker secret in deployment;
- a local `.dev.vars` value during development.

The repository contains only:

```text
BAI_API_KEY=replace_with_bai_key
```

Never:
- commit provider API keys;
- place them in `wrangler.jsonc` vars;
- expose them through `VITE_*` variables;
- log Authorization headers;
- return credentials or raw provider headers to the browser.

The browser communicates only with our own `/api/ai/*` endpoints.

## API routes

### `GET /api/ai/models`

Returns:
- the configured B.AI model registry;
- capabilities;
- preferred defaults;
- whether each known model appears in B.AI's `/models` response for the active credential;
- Cloudflare fallback IDs.

### `POST /api/ai/reason`

Example body:

```json
{
  "model": "hy3",
  "prompt": "Build a Motion Spec for the supplied SVG element map."
}
```

### `POST /api/ai/vision`

Example body:

```json
{
  "model": "qwen3.8-flash",
  "image": "data:image/png;base64,...",
  "prompt": "Identify the key subjects and suggest what should move."
}
```

## Security note

Provider credentials are temporary infrastructure secrets. If a key has been pasted into a conversation or another non-secret surface, rotate it after integration/testing before treating the deployment as production-ready.
