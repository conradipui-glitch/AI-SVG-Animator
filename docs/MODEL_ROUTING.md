# AI SVG Animator — Model Routing Strategy

> Working routing policy for semantic SVG analysis, scene understanding and AI Motion Director features.

## Goals

The product should not depend on one provider or one model. Model selection is based on **capability + cost + availability**, with free models preferred during MVP development.

The current routing design separates two core jobs:

1. **Reasoning / Motion planning** — understand SVG structure, produce SceneGraph / Motion Spec, interpret animation prompts.
2. **Vision / Scene understanding** — inspect raster images or rendered SVGs, identify objects/layers, rank animation targets and propose scene decomposition.

## Current primary routes

### Reasoning / Motion Spec

**Primary:** TokenRouter `z-ai/glm-5.3-free`

Use for:
- SVG semantic reasoning from structured descriptions;
- Motion Spec generation;
- animation prompt interpretation;
- ranking motion alternatives;
- scene-plan post-processing;
- JSON-like structured planning.

Important: TokenRouter currently lists this model as **Text**. Do not send images to it unless a live capability probe later proves otherwise.

**Fallback:** Cloudflare Workers AI `@cf/zai-org/glm-4.7-flash`

Use when TokenRouter is unavailable, rate-limited or the free route disappears.

### Vision / Scene Understanding

**Primary candidate:** TokenRouter `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`

NVIDIA documents the upstream model as omni-modal with **image, video, audio and text input**. It is therefore our preferred free candidate for Scene Understanding.

However, TokenRouter currently labels its routed entry as **Text**. This creates a gateway-capability mismatch that must be treated as **unverified until a real image request succeeds through TokenRouter**.

Routing policy:
- attempt TokenRouter Nemotron Omni first when `TOKENROUTER_API_KEY` is configured;
- if the gateway rejects image content, mark the attempt as failed and continue immediately to Cloudflare Workers AI;
- never fail the user flow only because TokenRouter's free vision route is unavailable.

### Cloudflare vision fallback chain

1. `@cf/qwen/qwen3.8-27b`
   - vision;
   - reasoning;
   - function calling;
   - preferred general scene-understanding fallback.

2. `@cf/google/gemma-4-26b-a4b-it`
   - vision;
   - reasoning;
   - multilingual;
   - strong fallback for detailed semantic analysis.

3. `@cf/moondream/moondream3.1-9B-A2B`
   - fast vision model;
   - useful for detection, pointing, OCR and lightweight structured vision tasks;
   - use as a low-cost detector / pre-analysis stage where appropriate.

## Routing table

| Task | Primary | Fallback 1 | Fallback 2 | Fallback 3 |
| --- | --- | --- | --- | --- |
| Motion planning | TokenRouter GLM-5.3 Free | CF GLM-4.7 Flash | CF Gemma 4 | — |
| SVG semantic reasoning | TokenRouter GLM-5.3 Free | CF GLM-4.7 Flash | CF Gemma 4 | — |
| Raster scene analysis | TokenRouter Nemotron Omni Free* | CF Qwen 3.8 27B | CF Gemma 4 | CF Moondream 3.1 |
| Object detection / pointing | CF Moondream 3.1 | CF Qwen 3.8 27B | CF Gemma 4 | — |
| Prompt-to-motion interpretation | TokenRouter GLM-5.3 Free | CF GLM-4.7 Flash | CF Gemma 4 | — |

`*` Upstream NVIDIA model is vision-capable; TokenRouter gateway vision support must be confirmed by live probe.

## Runtime rules

### 1. Capability first

Never route based only on the model name. A provider adapter must declare:
- provider;
- model id;
- text capability;
- vision capability;
- reasoning capability;
- structured-output support;
- current availability confidence.

### 2. Free-first during MVP

Prefer the current free TokenRouter routes while they are available, but keep Cloudflare fallback enabled from day one.

### 3. Fail fast

For provider errors such as:
- unsupported modality;
- 401 / 403;
- 404 model unavailable;
- 429 rate limit;
- 5xx provider failure;
- timeout;

continue to the next eligible route rather than surfacing the first provider failure to the user.

### 4. Preserve provider metadata

Every AI response returned to the application should include internal metadata:

```json
{
  "provider": "tokenrouter",
  "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "fallbackUsed": false,
  "latencyMs": 812
}
```

This metadata is useful for debugging, cost analysis and later routing optimization. It does not need to be shown in the default UI.

### 5. No secrets in the client

`TOKENROUTER_API_KEY` must exist only as a Cloudflare Worker secret.

The browser talks only to our own `/api/ai/*` routes.

## Cloudflare free-tier assumptions

Workers AI currently provides a daily free allocation. The fallback should therefore be treated as a **budgeted reserve**, not infinite free capacity.

Policy for MVP:
- TokenRouter free route first where suitable;
- Cloudflare Workers AI as automatic reserve;
- lightweight Moondream analysis before larger vision models when a simple detection pass is enough;
- add usage telemetry before public scale.

## Capability probe

Before enabling TokenRouter Nemotron as confirmed vision-primary, run this acceptance test from the deployed Worker:

1. send a tiny known PNG through OpenAI-compatible `image_url` content;
2. ask for two visually verifiable properties;
3. require a normal completion rather than an unsupported-modality error;
4. record provider/model/latency/status;
5. if the request fails, keep Nemotron configured as `vision: unverified` and use Cloudflare vision routes.

## Security note

Provider API keys are temporary infrastructure secrets. Never:
- commit them;
- expose them through Vite environment variables;
- log Authorization headers;
- return raw provider request objects to the browser.

Rotate temporary keys after integration/testing or whenever a key has been shared outside the secret store.
