# AI SVG Animator — Motion Spec v1

Motion Spec is the controlled intermediate format between an AI motion planner and the deterministic SVG animation renderer.

The model never writes executable JavaScript. It proposes motion intent in JSON; the application validates that JSON and only then maps it to GSAP.

## Goals

- keep AI output editable and inspectable;
- prevent arbitrary code execution;
- guarantee that AI can target only elements that exist in the current normalized SVG;
- make the motion planner provider-agnostic;
- allow the same spec to support future exporters.

## v1 schema

```json
{
  "version": 1,
  "loop": true,
  "tracks": [
    {
      "target": "#animator-node-3",
      "effect": "translate",
      "duration": 1.6,
      "delay": 0,
      "ease": "sine.inOut",
      "yoyo": true,
      "from": { "x": 0, "y": 0 },
      "to": { "x": 8, "y": -4 }
    }
  ]
}
```

## Allowed effects

| Effect | Values | Typical use |
| --- | --- | --- |
| `translate` | `x`, `y` | breathing drift, floating, environmental motion |
| `rotate` | `rotation` | head tilt, wheel, pendulum, subtle object rotation |
| `scale` | `scale` | breathing, emphasis, perspective accent |
| `opacity` | `opacity` | fades, blinking, atmospheric changes |
| `pulse` | `scale`, optional `opacity` | lights, UI accents, sparks |
| `draw` | no numeric values required | path / line drawing |

Synonyms accepted by the parser are intentionally limited. For example `move` / `float` map to `translate`, and `fade` maps to `opacity`.

## Validation rules

The application validates every AI response before it reaches GSAP:

1. response must contain parseable JSON;
2. `tracks` must be an array;
3. target must resolve to an element ID that exists in the normalized SVG;
4. effect must be on the allowlist;
5. durations, delays, translation, rotation, scale and opacity are clamped to safe ranges;
6. easing must be on a small allowlist;
7. at most 16 validated tracks are executed in v1.

Unknown targets and unsupported tracks are dropped rather than executed.

## Default AI policy

When the user does not provide a motion prompt, the planner should:

- animate only the key visual elements;
- prefer 1–8 meaningful targets;
- keep background/supporting geometry mostly static;
- use conservative motion amplitudes;
- produce a loop suitable for a web illustration.

The user can explicitly ask for broader or more expressive scene motion.

## Pipeline

```text
normalized SVG
    │
    ├── compact node map: id / tag / fill / stroke / parent
    │
    ▼
AI Motion Planner
    │
    ▼
Motion Spec JSON
    │
    ▼
parser + allowlist + clamps + target validation
    │
    ▼
GSAP deterministic renderer
```

## Current status

Implemented:

- compact SVG node-map prompt;
- Motion Spec v1 prompt schema;
- JSON / fenced-JSON extraction;
- target validation;
- effect allowlist;
- numeric clamping;
- GSAP execution for all v1 effects;
- automatic execution when a valid AI spec is returned;
- graceful fallback to deterministic presets when an AI response is invalid.

Future versions may add semantic groups, anchor points, path-following, masks, scene layers and exporter-specific metadata without allowing raw executable AI output.
