# AI SVG Animator — Cloudflare deployment

The application is deployed as a Cloudflare Worker with static assets and a Workers AI binding.

## Security model

Provider keys are never committed and never exposed to the browser.

The frontend calls only our own routes:

- `GET /api/ai/models`
- `POST /api/ai/reason`
- `POST /api/ai/vision`

The Worker reads the B.AI key from the Cloudflare secret store as `BAI_API_KEY`.

## First deployment

Install dependencies and verify both bundles:

```bash
npm install
npm run build
npm run check:worker
```

Authenticate Wrangler with the Cloudflare account used for the MVP, then store the provider key directly in Cloudflare:

```bash
npx wrangler secret put BAI_API_KEY
```

Wrangler prompts for the secret value interactively. Do not put the value in a shell command, README, `.env` committed to Git, GitHub workflow, issue, or log.

Deploy:

```bash
npm run deploy
```

## Local Worker testing

Copy the template:

```bash
cp .dev.vars.example .dev.vars
```

Then edit `.dev.vars` locally:

```text
BAI_API_KEY=<local temporary key>
```

`.dev.vars` is ignored by Git and must stay local.

Run:

```bash
npm run dev:worker
```

## Model routing

The Worker currently knows these B.AI candidates:

- `glm-5.3-flash` — text + vision;
- `qwen3.8-flash` — text + vision;
- `mimo-v2.5` — text + vision;
- `hy3` — text only.

`GET /api/ai/models` also calls B.AI `GET /v1/models` when the Worker secret is configured, so the UI can distinguish a configured route from a model that is not available to the current credential.

Cloudflare Workers AI remains the automatic reserve route.

## Secret rotation

To replace a temporary B.AI key:

```bash
npx wrangler secret put BAI_API_KEY
```

The new value replaces the Worker secret without changing source code.

If a key has ever been pasted into a public location, logs, repository content, or another uncontrolled surface, rotate it before production use.
