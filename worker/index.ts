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

const BAI_MODELS: BaiModelDefinition[] = [
  {
    id: 'glm-5.3-flash',
    label: 'GLM-5.3-Flash',
    capabilities: ['text', 'vision'],
  },
  {
    id: 'qwen3.8-flash',
    label: 'Qwen3.8-Flash',
    capabilities: ['text', 'vision'],
  },
  {
    id: 'mimo-v2.5',
    label: 'MiMo-V2.5',
    capabilities: ['text', 'vision'],
  },
  {
    id: 'hy3',
    label: 'Hy3',
    capabilities: ['text'],
  },
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

const SCENE_SYSTEM_PROMPT = `You are the Scene Understanding module for AI SVG Animator.
Analyze the supplied image as a motion-design scene, not merely as a captioning task.
Identify meaningful objects, characters, foreground/background layers, likely semantic parts, depth order, and which elements are appropriate to animate.
Default policy: animate only key subjects and a small amount of environment; do not animate everything.
Prefer a JSON object with keys: summary, sceneType, keySubjects, layers, animationCandidates, keepStatic, suggestedIntensity, decompositionNotes.`;

const MOTION_SYSTEM_PROMPT = `You are the Motion Planner for AI SVG Animator.
Turn the user's SVG/scene description and animation intent into a concise, implementation-neutral motion plan.
Default policy: animate only semantically important objects unless the user explicitly asks for full-scene motion.
Prefer a JSON object with keys: intent, targets, tracks, timing, intensity, loop, notes. Never invent selectors that were not provided in the input.`;

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return JSON.stringify(value);

  if (typeof value.response === 'string') return value.response;
  if (typeof value.result === 'string') return value.result;

  const choices = value.choices;
  if (Array.isArray(choices) && choices.length > 0 && isRecord(choices[0])) {
    const message = choices[0].message;
    if (isRecord(message) && typeof message.content === 'string') return message.content;
    if (typeof choices[0].text === 'string') return choices[0].text;
  }

  return JSON.stringify(value);
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > 12 * 1024 * 1024) {
    throw new Error('Request body is too large.');
  }

  const value: unknown = await request.json();
  if (!isRecord(value)) throw new Error('Expected a JSON object.');
  return value;
}

function baiModel(id: string): BaiModelDefinition | undefined {
  return BAI_MODELS.find((model) => model.id === id);
}

function eligibleBaiModels(capability: Capability, preferred?: string): BaiModelDefinition[] {
  const eligible = BAI_MODELS.filter((model) => model.capabilities.includes(capability));
  if (!preferred) return eligible;

  const selected = baiModel(preferred);
  if (!selected || !selected.capabilities.includes(capability)) return eligible;

  return [selected, ...eligible.filter((model) => model.id !== preferred)];
}

function requestedModel(body: Record<string, unknown>, capability: Capability): string | undefined {
  if (typeof body.model !== 'string' || !body.model.trim()) return undefined;
  const id = body.model.trim();
  const model = baiModel(id);
  if (!model) return undefined;
  return model.capabilities.includes(capability) ? id : undefined;
}

async function baiChat(
  env: Env,
  model: string,
  messages: unknown[],
): Promise<string> {
  if (!env.BAI_API_KEY) {
    throw new ProviderError('B.AI key is not configured.', 'bai', model);
  }

  const baseUrl = (env.BAI_BASE_URL ?? DEFAULTS.baiBaseUrl).replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40_000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.BAI_API_KEY}`,
        'content-type': 'application/json',
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
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }

    if (!response.ok) {
      throw new ProviderError(
        `B.AI returned HTTP ${response.status}.`,
        'bai',
        model,
        response.status,
      );
    }

    const text = extractText(payload);
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

async function listBaiModels(env: Env): Promise<string[]> {
  if (!env.BAI_API_KEY) return [];

  const baseUrl = (env.BAI_BASE_URL ?? DEFAULTS.baiBaseUrl).replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { authorization: `Bearer ${env.BAI_API_KEY}` },
      signal: controller.signal,
    });
    if (!response.ok) return [];

    const payload: unknown = await response.json();
    if (!isRecord(payload) || !Array.isArray(payload.data)) return [];

    return payload.data
      .filter(isRecord)
      .map((item) => item.id)
      .filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function cloudflareChat(
  env: Env,
  model: string,
  messages: unknown[],
): Promise<string> {
  try {
    const result = await env.AI.run(model, {
      messages,
      max_completion_tokens: 2048,
    });
    return extractText(result);
  } catch (error) {
    throw new ProviderError(
      error instanceof Error ? error.message : 'Workers AI request failed.',
      'cloudflare',
      model,
    );
  }
}

async function cloudflareMoondream(
  env: Env,
  image: string,
  question: string,
): Promise<string> {
  const model = DEFAULTS.cloudflareDetectorModel;
  try {
    const result = await env.AI.run(model, {
      task: 'query',
      image,
      question,
    });
    return extractText(result);
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
  const errors: Array<{ provider: ProviderName; model: string; message: string; status?: number }> = [];

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
        errors.push({
          provider: error.provider,
          model: error.model,
          message: error.message,
          ...(error.status === undefined ? {} : { status: error.status }),
        });
      } else {
        errors.push({
          provider: attempt.provider,
          model: attempt.model,
          message: error instanceof Error ? error.message : 'Unknown provider error.',
        });
      }
    }
  }

  throw new Error(`All AI routes failed: ${JSON.stringify(errors)}`);
}

async function handleReason(request: Request, env: Env): Promise<Response> {
  const body = await readJsonBody(request);
  const prompt = body.prompt;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return json({ error: 'prompt is required' }, { status: 400 });
  }

  const preferred = requestedModel(body, 'text')
    ?? env.BAI_REASON_MODEL
    ?? DEFAULTS.baiReasonModel;
  const messages = [
    { role: 'system', content: MOTION_SYSTEM_PROMPT },
    { role: 'user', content: prompt.trim() },
  ];

  const baiAttempts = eligibleBaiModels('text', preferred).map((model) => ({
    provider: 'bai' as const,
    model: model.id,
    run: () => baiChat(env, model.id, messages),
  }));

  const result = await withRoute([
    ...baiAttempts,
    {
      provider: 'cloudflare',
      model: DEFAULTS.cloudflareTextModel,
      run: () => cloudflareChat(env, DEFAULTS.cloudflareTextModel, messages),
    },
    {
      provider: 'cloudflare',
      model: DEFAULTS.cloudflareVisionFallback,
      run: () => cloudflareChat(env, DEFAULTS.cloudflareVisionFallback, messages),
    },
  ]);

  return json(result);
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

  const preferred = requestedModel(body, 'vision')
    ?? env.BAI_VISION_MODEL
    ?? DEFAULTS.baiVisionModel;
  const messages = [
    { role: 'system', content: SCENE_SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: image.trim() } },
      ],
    },
  ];

  const baiAttempts = eligibleBaiModels('vision', preferred).map((model) => ({
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
  const discovered = await listBaiModels(env);
  const discoveredSet = new Set(discovered);

  return json({
    provider: {
      name: 'bai',
      baseUrl: env.BAI_BASE_URL ?? DEFAULTS.baiBaseUrl,
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
      vision: [
        DEFAULTS.cloudflareVisionModel,
        DEFAULTS.cloudflareVisionFallback,
        DEFAULTS.cloudflareDetectorModel,
      ],
    },
  });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname === '/api/ai/models') {
    return handleModels(env);
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    if (url.pathname === '/api/ai/reason') return await handleReason(request, env);
    if (url.pathname === '/api/ai/vision') return await handleVision(request, env);
    return json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('AI route failed', error instanceof Error ? error.message : 'Unknown error');
    return json({ error: 'AI providers are temporarily unavailable.' }, { status: 503 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  },
};
