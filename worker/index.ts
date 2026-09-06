type ProviderName = 'tokenrouter' | 'cloudflare';

type AiBinding = {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
};

type AssetsBinding = {
  fetch(request: Request): Promise<Response>;
};

interface Env {
  AI: AiBinding;
  ASSETS: AssetsBinding;
  TOKENROUTER_API_KEY?: string;
  TOKENROUTER_BASE_URL?: string;
  TOKENROUTER_TEXT_MODEL?: string;
  TOKENROUTER_VISION_MODEL?: string;
}

interface RouteResult {
  text: string;
  provider: ProviderName;
  model: string;
  fallbackUsed: boolean;
  latencyMs: number;
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

const DEFAULTS = {
  tokenRouterBaseUrl: 'https://api.tokenrouter.com/v1',
  tokenRouterTextModel: 'z-ai/glm-5.3-free',
  tokenRouterVisionModel: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
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

async function tokenRouterChat(
  env: Env,
  model: string,
  messages: unknown[],
): Promise<string> {
  if (!env.TOKENROUTER_API_KEY) {
    throw new ProviderError('TokenRouter key is not configured.', 'tokenrouter', model);
  }

  const baseUrl = (env.TOKENROUTER_BASE_URL ?? DEFAULTS.tokenRouterBaseUrl).replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.TOKENROUTER_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model, messages, stream: false }),
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
        `TokenRouter returned HTTP ${response.status}.`,
        'tokenrouter',
        model,
        response.status,
      );
    }

    const text = extractText(payload);
    if (!text) throw new ProviderError('TokenRouter returned an empty response.', 'tokenrouter', model);
    return text;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError(
      error instanceof Error ? error.message : 'TokenRouter request failed.',
      'tokenrouter',
      model,
    );
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

  const tokenModel = env.TOKENROUTER_TEXT_MODEL ?? DEFAULTS.tokenRouterTextModel;
  const messages = [
    { role: 'system', content: MOTION_SYSTEM_PROMPT },
    { role: 'user', content: prompt.trim() },
  ];

  const result = await withRoute([
    {
      provider: 'tokenrouter',
      model: tokenModel,
      run: () => tokenRouterChat(env, tokenModel, messages),
    },
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

  const tokenModel = env.TOKENROUTER_VISION_MODEL ?? DEFAULTS.tokenRouterVisionModel;
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

  const result = await withRoute([
    {
      provider: 'tokenrouter',
      model: tokenModel,
      run: () => tokenRouterChat(env, tokenModel, messages),
    },
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

function handleModels(env: Env): Response {
  return json({
    reason: [
      { provider: 'tokenrouter', model: env.TOKENROUTER_TEXT_MODEL ?? DEFAULTS.tokenRouterTextModel, capability: 'text/reasoning' },
      { provider: 'cloudflare', model: DEFAULTS.cloudflareTextModel, capability: 'text/reasoning' },
      { provider: 'cloudflare', model: DEFAULTS.cloudflareVisionFallback, capability: 'text/vision/reasoning' },
    ],
    vision: [
      {
        provider: 'tokenrouter',
        model: env.TOKENROUTER_VISION_MODEL ?? DEFAULTS.tokenRouterVisionModel,
        capability: 'upstream omni; TokenRouter vision transport unverified',
      },
      { provider: 'cloudflare', model: DEFAULTS.cloudflareVisionModel, capability: 'vision/reasoning' },
      { provider: 'cloudflare', model: DEFAULTS.cloudflareVisionFallback, capability: 'vision/reasoning' },
      { provider: 'cloudflare', model: DEFAULTS.cloudflareDetectorModel, capability: 'vision/detect/point/OCR' },
    ],
    tokenRouterConfigured: Boolean(env.TOKENROUTER_API_KEY),
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
