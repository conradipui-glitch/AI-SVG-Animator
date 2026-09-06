type ProviderName = 'bai' | 'cloudflare';
type Capability = 'text' | 'vision';

type AiBinding = {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
};

type AssetsBinding = {
  fetch(request: Request): Promise<Response>;
};

interface Env {
  AI: AiBinding;
  ASSETS: AssetsBinding;
  BAI_API_KEY?: string;
  BAI_BASE_URL?: string;
  BAI_REASON_MODEL?: string;
  BAI_VISION_MODEL?: string;
}

interface RouteResult {
  text: string;
  provider: ProviderName;
  model: string;
  fallbackUsed: boolean;
  latencyMs: number;
}

interface RouteFailure {
  provider: ProviderName;
  model: string;
  message: string;
  status?: number;
}

interface BaiModelDefinition {
  id: string;
  label: string;
  capabilities: Capability[];
}

class ProviderError extends Error {
  constructor(
    message: string,
    readonly provider: ProviderName,
    readonly model: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

class AllRoutesFailedError extends Error {
  constructor(readonly failures: RouteFailure[]) {
    super('All configured AI routes failed.');
  }
}

const BAI_MODELS: BaiModelDefinition[] = [
  { id: 'glm-5.3-flash', label: 'GLM-5.3-Flash', capabilities: ['text', 'vision'] },
  { id: 'qwen3.8-flash', label: 'Qwen3.8-Flash', capabilities: ['text', 'vision'] },
  { id: 'mimo-v2.5', label: 'MiMo-V2.5', capabilities: ['text', 'vision'] },
  { id: 'hy3', label: 'Hy3', capabilities: ['text'] },
];

const DEFAULTS = {
  baiBaseUrl: 'https://api.b.ai/v1',
  baiReasonModel: 'glm-5.3-flash',
  baiVisionModel: 'glm-5.3-flash',
  cloudflareTextModel: '@cf/zai-org/glm-4.7-flash',
  cloudflareVisionModel: '@cf/qwen/qwen3.8-27b',
  cloudflareVisionFallback: '@cf/google/gemma-4-26b-a4b-it',
  cloudflareDetectorModel: '@cf/moondream/moondream3.1-9B-A2B',
} as const;

const MOTION_SPEC_RULES = `Return JSON only. The response MUST use exactly this executable Motion Spec v1 shape:
{
  "version": 1,
  "loop": true,
  "tracks": [
    {
      "target": "#existing-element-id",
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
Allowed effects: translate, rotate, scale, opacity, pulse, draw.
Allowed easing values: none, linear, sine.in, sine.out, sine.inOut, power1.in, power1.out, power1.inOut, power2.in, power2.out, power2.inOut, back.out.
Use ONLY target IDs explicitly supplied by the user input. Never invent selectors.
Groups may be valid targets for whole-object motion when their IDs are supplied.
Avoid conflicting transforms on a group and one of its descendants unless that hierarchy is deliberate.
Prefer 1-8 meaningful tracks. Do not animate every path unless the user explicitly requests full-scene motion.
Use conservative physically plausible values. Do not return JavaScript, CSS, markdown, prose, explanations, comments, or code fences.`;

const MOTION_SYSTEM_PROMPT = `You are the AI Motion Director for AI SVG Animator.
Understand the supplied artwork as a visual scene AND as a structured SVG document. Match semantic objects visible in the artwork to the supplied SVG element IDs and geometry metadata. Follow the user's animation intent. If no explicit intent is given, animate only key subjects plus a small amount of environment.
Respect semantic pivot hints. Prefer a logical group target over separately moving all of its paths when the group represents one object.
${MOTION_SPEC_RULES}`;

const VARIANTS_SYSTEM_PROMPT = `You are the AI Motion Director for AI SVG Animator.
Understand the supplied artwork as a visual scene AND as a structured SVG document. Produce three genuinely different, tasteful animation directions for the same artwork.
Return JSON only with this exact top-level shape:
{
  "variants": [
    { "id": "subtle", "title": "Subtle", "description": "...", "motionSpec": { "version": 1, "loop": true, "tracks": [] } },
    { "id": "natural", "title": "Natural", "description": "...", "motionSpec": { "version": 1, "loop": true, "tracks": [] } },
    { "id": "expressive", "title": "Expressive", "description": "...", "motionSpec": { "version": 1, "loop": true, "tracks": [] } }
  ]
}
Subtle: minimal elegant motion focused on the primary subject.
Natural: balanced believable motion for key subjects and limited secondary motion.
Expressive: visibly stronger choreography while preserving readability and avoiding chaotic motion.
Each motionSpec must follow these rules:
${MOTION_SPEC_RULES}`;

const PREPARATION_SYSTEM_PROMPT = `You are the Motion-Ready SVG Preparation module for AI SVG Animator.
Analyze the supplied rendered artwork AND SVG structure as a motion-design scene.
Map visible logical objects and articulated parts to existing SVG IDs only. Never invent IDs or selectors.
If a useful moving part such as an eye, hand, elbow, wheel, branch, wing, cloth section, hair section or other joint is visible but cannot be independently targeted because it is merged into a larger SVG path or group, add a separation suggestion instead of inventing a selector.
Do not rewrite the SVG. Do not produce animation code.
Return JSON only with exactly this shape:
{
  "version": 1,
  "sceneSummary": "short description",
  "nodes": [
    {
      "id": "existing-id",
      "label": "human-readable object or part",
      "role": "character",
      "confidence": 0.9,
      "pivot": "bottom-center",
      "motionPotential": 0.85,
      "recommendedEffects": ["translate", "rotate"]
    }
  ],
  "separationSuggestions": [
    {
      "target": "#existing-id",
      "reason": "why an independent part would improve articulated motion",
      "priority": "medium"
    }
  ]
}
Allowed roles: background, character, body, head, eye, arm, hand, leg, foot, wing, hair, cloth, vehicle, wheel, plant, branch, leaf, cloud, smoke, water, light, text, decoration, unknown.
Allowed pivots: center, bottom-center, top-center, left-center, right-center.
Allowed effects: translate, rotate, scale, opacity, pulse, draw.
Use values from 0 to 1 for confidence and motionPotential.
Prefer a compact map of meaningful objects and parts instead of labeling every decorative path.
For articulated parts choose a plausible joint-side pivot: limbs and wings pivot near their attachment, cloth/hair usually near the attached edge, wheels around center.
No markdown, prose outside JSON, comments, code fences, JavaScript or CSS.`;

const SCENE_SYSTEM_PROMPT = `You are the Scene Understanding module for AI SVG Animator.
Analyze the supplied image as a motion-design scene, not merely as a captioning task.
Identify meaningful objects, characters, foreground/background layers, likely semantic parts, depth order, and which elements are appropriate to animate.
Default policy: animate only key subjects and a small amount of environment; do not animate everything.
Return JSON only with keys: summary, sceneType, keySubjects, layers, animationCandidates, keepStatic, suggestedIntensity, decompositionNotes.`;

let baiModelCache: { ids: string[]; expiresAt: number } | null = null;

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function contentText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return '';
  return value
    .filter(isRecord)
    .map((part) => {
      if (typeof part.text === 'string') return part.text;
      if (typeof part.content === 'string') return part.content;
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function extractText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return JSON.stringify(value);

  if (typeof value.response === 'string') return value.response;
  if (typeof value.result === 'string') return value.result;

  const choices = value.choices;
  if (Array.isArray(choices) && choices.length > 0 && isRecord(choices[0])) {
    const message = choices[0].message;
    if (isRecord(message)) {
      const text = contentText(message.content);
      if (text) return text;
    }
    if (typeof choices[0].text === 'string') return choices[0].text;
  }

  const output = value.output;
  if (Array.isArray(output)) {
    const parts = output
      .filter(isRecord)
      .flatMap((item) => Array.isArray(item.content) ? item.content : [])
      .filter(isRecord)
      .map((part) => typeof part.text === 'string' ? part.text : '')
      .filter(Boolean);
    if (parts.length) return parts.join('\n');
  }

  return JSON.stringify(value);
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > 12 * 1024 * 1024) throw new Error('Request body is too large.');
  const value: unknown = await request.json();
  if (!isRecord(value)) throw new Error('Expected a JSON object.');
  return value;
}

function baiModel(id: string): BaiModelDefinition | undefined {
  return BAI_MODELS.find((model) => model.id === id);
}

function requestedModel(body: Record<string, unknown>, capability: Capability): string | undefined {
  if (typeof body.model !== 'string' || !body.model.trim()) return undefined;
  const id = body.model.trim();
  const model = baiModel(id);
  return model?.capabilities.includes(capability) ? id : undefined;
}

function eligibleBaiModels(
  capability: Capability,
  preferred: string | undefined,
  discovered: string[],
): BaiModelDefinition[] {
  const discoveredSet = new Set(discovered);
  const eligible = BAI_MODELS.filter((model) =>
    model.capabilities.includes(capability) && (!discovered.length || discoveredSet.has(model.id))
  );
  if (!preferred) return eligible;
  const selected = eligible.find((model) => model.id === preferred);
  return selected ? [selected, ...eligible.filter((model) => model.id !== preferred)] : eligible;
}

async function baiChat(env: Env, model: string, messages: unknown[]): Promise<string> {
  if (!env.BAI_API_KEY) throw new ProviderError('B.AI key is not configured.', 'bai', model);

  const baseUrl = (env.BAI_BASE_URL ?? DEFAULTS.baiBaseUrl).replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.BAI_API_KEY}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });

    const raw = await response.text();
    let payload: unknown;
    try { payload = JSON.parse(raw); } catch { payload = raw; }

    if (!response.ok) {
      const detail = isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === 'string'
        ? payload.error.message.slice(0, 300)
        : `HTTP ${response.status}`;
      throw new ProviderError(`B.AI ${detail}`, 'bai', model, response.status);
    }

    const text = extractText(payload).trim();
    if (!text) throw new ProviderError('B.AI returned an empty response.', 'bai', model);
    return text;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError(
      error instanceof Error ? error.message : 'B.AI request failed.',
      'bai',
      model,
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function listBaiModels(env: Env, force = false): Promise<string[]> {
  if (!env.BAI_API_KEY) return [];
  const now = Date.now();
  if (!force && baiModelCache && baiModelCache.expiresAt > now) return baiModelCache.ids;

  const baseUrl = (env.BAI_BASE_URL ?? DEFAULTS.baiBaseUrl).replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { authorization: `Bearer ${env.BAI_API_KEY}`, accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) return [];

    const payload: unknown = await response.json();
    if (!isRecord(payload) || !Array.isArray(payload.data)) return [];

    const ids = payload.data
      .filter(isRecord)
      .map((item) => item.id)
      .filter((id): id is string => typeof id === 'string');
    baiModelCache = { ids, expiresAt: now + 60_000 };
    return ids;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function cloudflareChat(env: Env, model: string, messages: unknown[]): Promise<string> {
  try {
    const result = await env.AI.run(model, { messages, max_tokens: 2048 });
    const text = extractText(result).trim();
    if (!text) throw new Error('Workers AI returned an empty response.');
    return text;
  } catch (error) {
    throw new ProviderError(
      error instanceof Error ? error.message : 'Workers AI request failed.',
      'cloudflare',
      model,
    );
  }
}

async function cloudflareMoondream(env: Env, image: string, question: string): Promise<string> {
  const model = DEFAULTS.cloudflareDetectorModel;
  try {
    const result = await env.AI.run(model, { task: 'query', image, question });
    const text = extractText(result).trim();
    if (!text) throw new Error('Workers AI detector returned an empty response.');
    return text;
  } catch (error) {
    throw new ProviderError(
      error instanceof Error ? error.message : 'Workers AI detector request failed.',
      'cloudflare',
      model,
    );
  }
}

async function withRoute(
  attempts: Array<{ provider: ProviderName; model: string; run: () => Promise<string> }>,
): Promise<RouteResult> {
  const failures: RouteFailure[] = [];

  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index];
    if (!attempt) continue;
    const started = Date.now();
    try {
      const text = await attempt.run();
      return {
        text,
        provider: attempt.provider,
        model: attempt.model,
        fallbackUsed: index > 0,
        latencyMs: Date.now() - started,
      };
    } catch (error) {
      if (error instanceof ProviderError) {
        failures.push({
          provider: error.provider,
          model: error.model,
          message: error.message,
          ...(error.status === undefined ? {} : { status: error.status }),
        });
      } else {
        failures.push({
          provider: attempt.provider,
          model: attempt.model,
          message: error instanceof Error ? error.message : 'Unknown provider error.',
        });
      }
    }
  }

  throw new AllRoutesFailedError(failures);
}

function textMessages(system: string, prompt: string): unknown[] {
  return [
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ];
}

function multimodalMessages(system: string, prompt: string, image: string): unknown[] {
  return [
    { role: 'system', content: system },
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: image } },
      ],
    },
  ];
}

async function routeMotionRequest(
  body: Record<string, unknown>,
  env: Env,
  systemPrompt: string,
): Promise<RouteResult> {
  const prompt = body.prompt;
  if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('prompt is required');
  const image = typeof body.image === 'string' && body.image.trim() ? body.image.trim() : '';
  const discovered = await listBaiModels(env);
  const preferred = requestedModel(body, 'text') ?? env.BAI_REASON_MODEL ?? DEFAULTS.baiReasonModel;
  const models = eligibleBaiModels('text', preferred, discovered);

  const baiAttempts = models.map((model) => ({
    provider: 'bai' as const,
    model: model.id,
    run: () => baiChat(
      env,
      model.id,
      image && model.capabilities.includes('vision')
        ? multimodalMessages(systemPrompt, prompt.trim(), image)
        : textMessages(systemPrompt, prompt.trim()),
    ),
  }));

  const fallbackMessages = textMessages(systemPrompt, prompt.trim());
  return withRoute([
    ...baiAttempts,
    {
      provider: 'cloudflare',
      model: DEFAULTS.cloudflareTextModel,
      run: () => cloudflareChat(env, DEFAULTS.cloudflareTextModel, fallbackMessages),
    },
    {
      provider: 'cloudflare',
      model: DEFAULTS.cloudflareVisionFallback,
      run: () => cloudflareChat(env, DEFAULTS.cloudflareVisionFallback, fallbackMessages),
    },
  ]);
}

async function handleReason(request: Request, env: Env): Promise<Response> {
  const body = await readJsonBody(request);
  return json(await routeMotionRequest(body, env, MOTION_SYSTEM_PROMPT));
}

async function handleMotion(request: Request, env: Env): Promise<Response> {
  const body = await readJsonBody(request);
  return json(await routeMotionRequest(body, env, MOTION_SYSTEM_PROMPT));
}

async function handleVariants(request: Request, env: Env): Promise<Response> {
  const body = await readJsonBody(request);
  return json(await routeMotionRequest(body, env, VARIANTS_SYSTEM_PROMPT));
}

async function handlePrepare(request: Request, env: Env): Promise<Response> {
  const body = await readJsonBody(request);
  return json(await routeMotionRequest(body, env, PREPARATION_SYSTEM_PROMPT));
}

async function handleVision(request: Request, env: Env): Promise<Response> {
  const body = await readJsonBody(request);
  const image = body.image;
  const userPrompt = typeof body.prompt === 'string' && body.prompt.trim()
    ? body.prompt.trim()
    : 'Analyze this scene for animation.';

  if (typeof image !== 'string' || !image.trim()) {
    return json({ error: 'image is required as a public HTTPS URL or base64 data URI' }, { status: 400 });
  }

  const discovered = await listBaiModels(env);
  const preferred = requestedModel(body, 'vision') ?? env.BAI_VISION_MODEL ?? DEFAULTS.baiVisionModel;
  const models = eligibleBaiModels('vision', preferred, discovered);
  const messages = multimodalMessages(SCENE_SYSTEM_PROMPT, userPrompt, image.trim());

  const baiAttempts = models.map((model) => ({
    provider: 'bai' as const,
    model: model.id,
    run: () => baiChat(env, model.id, messages),
  }));

  const result = await withRoute([
    ...baiAttempts,
    {
      provider: 'cloudflare',
      model: DEFAULTS.cloudflareVisionModel,
      run: () => cloudflareChat(env, DEFAULTS.cloudflareVisionModel, messages),
    },
    {
      provider: 'cloudflare',
      model: DEFAULTS.cloudflareVisionFallback,
      run: () => cloudflareChat(env, DEFAULTS.cloudflareVisionFallback, messages),
    },
    {
      provider: 'cloudflare',
      model: DEFAULTS.cloudflareDetectorModel,
      run: () => cloudflareMoondream(env, image.trim(), `${SCENE_SYSTEM_PROMPT}\n\nUser request: ${userPrompt}`),
    },
  ]);

  return json(result);
}

async function handleModels(env: Env): Promise<Response> {
  const discovered = await listBaiModels(env, true);
  const discoveredSet = new Set(discovered);
  return json({
    provider: {
      name: 'bai',
      configured: Boolean(env.BAI_API_KEY),
    },
    selectable: BAI_MODELS.map((model) => ({
      ...model,
      availableForCredential: discovered.length ? discoveredSet.has(model.id) : null,
    })),
    discoveredModelIds: discovered,
    defaults: {
      reason: env.BAI_REASON_MODEL ?? DEFAULTS.baiReasonModel,
      vision: env.BAI_VISION_MODEL ?? DEFAULTS.baiVisionModel,
    },
    cloudflareFallbacks: {
      reason: [DEFAULTS.cloudflareTextModel, DEFAULTS.cloudflareVisionFallback],
      vision: [DEFAULTS.cloudflareVisionModel, DEFAULTS.cloudflareVisionFallback, DEFAULTS.cloudflareDetectorModel],
    },
  });
}

async function handleHealth(env: Env): Promise<Response> {
  const discovered = await listBaiModels(env, true);
  return json({
    ok: true,
    baiConfigured: Boolean(env.BAI_API_KEY),
    knownFreeModelsVisible: BAI_MODELS.filter((model) => discovered.includes(model.id)).map((model) => model.id),
    discoveredCount: discovered.length,
    timestamp: new Date().toISOString(),
  });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname === '/api/ai/models') return handleModels(env);
  if (request.method === 'GET' && url.pathname === '/api/ai/health') return handleHealth(env);
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  try {
    if (url.pathname === '/api/ai/reason') return await handleReason(request, env);
    if (url.pathname === '/api/ai/motion') return await handleMotion(request, env);
    if (url.pathname === '/api/ai/variants') return await handleVariants(request, env);
    if (url.pathname === '/api/ai/prepare') return await handlePrepare(request, env);
    if (url.pathname === '/api/ai/vision') return await handleVision(request, env);
    return json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    if (error instanceof AllRoutesFailedError) {
      console.error('AI routes failed', JSON.stringify(error.failures));
      return json({
        error: 'ai-providers-unavailable',
        message: 'All configured AI routes failed.',
        attempts: error.failures,
      }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : 'Unknown AI error';
    console.error('AI route failed', message);
    return json({ error: 'ai-request-failed', message }, { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  },
};
