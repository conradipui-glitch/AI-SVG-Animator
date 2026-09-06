export interface AiModelOption {
  id: string;
  label: string;
  capabilities: Array<'text' | 'vision'>;
  availableForCredential: boolean | null;
}

export interface AiModelsResponse {
  selectable: AiModelOption[];
  defaults: { reason: string; vision: string };
}

export interface AiRouteFailure {
  provider: 'bai' | 'cloudflare';
  model: string;
  message: string;
  status?: number;
}

export interface AiRouteResult {
  text: string;
  provider: 'bai' | 'cloudflare';
  model: string;
  fallbackUsed: boolean;
  latencyMs: number;
}

interface AiErrorPayload {
  error?: string;
  message?: string;
  attempts?: AiRouteFailure[];
}

export class AiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly attempts: AiRouteFailure[] = [],
  ) {
    super(message);
  }
}

export async function fetchAiModels(): Promise<AiModelsResponse> {
  const response = await fetch('/api/ai/models', { headers: { accept: 'application/json' } });
  if (!response.ok) throw new AiRequestError('Could not load AI model list.', response.status, 'models-unavailable');
  return response.json() as Promise<AiModelsResponse>;
}

export async function requestMotionPlan(
  svgMarkup: string,
  animationPrompt: string,
  model?: string,
): Promise<AiRouteResult> {
  const image = await renderSvgToPngDataUrl(svgMarkup);
  return postAiRoute('/api/ai/motion', {
    ...(model ? { model } : {}),
    ...(image ? { image } : {}),
    prompt: buildMotionPrompt(svgMarkup, animationPrompt),
  });
}

export async function requestMotionVariants(
  svgMarkup: string,
  model?: string,
): Promise<AiRouteResult> {
  const image = await renderSvgToPngDataUrl(svgMarkup);
  return postAiRoute('/api/ai/variants', {
    ...(model ? { model } : {}),
    ...(image ? { image } : {}),
    prompt: buildVariantsPrompt(svgMarkup),
  });
}

async function postAiRoute(path: string, body: Record<string, unknown>): Promise<AiRouteResult> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let payload: AiErrorPayload = {};
    try {
      payload = await response.json() as AiErrorPayload;
    } catch {
      // Keep the generic fallback below.
    }
    throw new AiRequestError(
      payload.message || 'AI request failed.',
      response.status,
      payload.error || 'ai-request-failed',
      Array.isArray(payload.attempts) ? payload.attempts : [],
    );
  }

  return response.json() as Promise<AiRouteResult>;
}

function buildMotionPrompt(svgMarkup: string, animationPrompt: string): string {
  const context = svgContext(svgMarkup);
  const intent = animationPrompt.trim() || 'Choose a tasteful automatic animation for the key visual elements only.';

  return [
    `User animation intent: ${intent}`,
    'The rendered artwork is attached as an image when available. Inspect the picture first, then use the SVG structure below to map semantic objects to exact element IDs.',
    `SVG viewBox: ${context.viewBox}`,
    `Animatable nodes (${context.nodes.length} listed): ${JSON.stringify(context.nodes)}`,
    'Use only target IDs present in the node list. Target must be written as a CSS id selector such as #animator-node-3.',
    'The cleaned SVG markup follows. Use it to understand grouping, geometry, order and relationships. Do not rewrite the SVG in your response.',
    context.markup,
  ].join('\n\n');
}

function buildVariantsPrompt(svgMarkup: string): string {
  const context = svgContext(svgMarkup);
  return [
    'Generate exactly three animation directions for this artwork: subtle, natural and expressive.',
    'The rendered artwork is attached as an image when available. Inspect the picture first, then map semantic objects to the exact SVG IDs below.',
    `SVG viewBox: ${context.viewBox}`,
    `Animatable nodes (${context.nodes.length} listed): ${JSON.stringify(context.nodes)}`,
    'Use only IDs from the node list. Keep the variants genuinely different while preserving the meaning and readability of the artwork.',
    'The cleaned SVG markup follows for structural context. Do not rewrite the SVG in your response.',
    context.markup,
  ].join('\n\n');
}

function svgContext(svgMarkup: string): {
  viewBox: string;
  nodes: Array<Record<string, string | null>>;
  markup: string;
} {
  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
  const svg = doc.documentElement;
  const nodes = Array.from(svg.querySelectorAll<SVGGraphicsElement>('[data-animator-target="true"]'))
    .slice(0, 160)
    .map((element) => ({
      id: element.id,
      tag: element.tagName.toLowerCase(),
      fill: element.getAttribute('fill'),
      stroke: element.getAttribute('stroke'),
      parent: element.parentElement?.id || null,
      transform: element.getAttribute('transform'),
      path: element.tagName.toLowerCase() === 'path' ? truncate(element.getAttribute('d') || '', 420) : null,
    }));

  return {
    viewBox: svg.getAttribute('viewBox') || 'unknown',
    nodes,
    markup: truncate(svgMarkup, 120_000),
  };
}

async function renderSvgToPngDataUrl(svgMarkup: string): Promise<string | undefined> {
  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return undefined;
  const svg = doc.documentElement;
  const viewBox = parseViewBox(svg.getAttribute('viewBox'));
  const sourceWidth = viewBox?.width || Number.parseFloat(svg.getAttribute('width') || '0') || 512;
  const sourceHeight = viewBox?.height || Number.parseFloat(svg.getAttribute('height') || '0') || 512;
  const maxSide = 768;
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('svg-preview-render-failed'));
    image.src = url;
  });
}

function parseViewBox(value: string | null): { width: number; height: number } | null {
  if (!value) return null;
  const parts = value.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return null;
  const width = Math.abs(parts[2] ?? 0);
  const height = Math.abs(parts[3] ?? 0);
  return width > 0 && height > 0 ? { width, height } : null;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}\n<!-- truncated -->`;
}
