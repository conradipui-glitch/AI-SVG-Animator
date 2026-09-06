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

export interface AiRouteResult {
  text: string;
  provider: 'bai' | 'cloudflare';
  model: string;
  fallbackUsed: boolean;
  latencyMs: number;
}

export async function fetchAiModels(): Promise<AiModelsResponse> {
  const response = await fetch('/api/ai/models', { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('models-unavailable');
  return response.json() as Promise<AiModelsResponse>;
}

export async function requestMotionPlan(
  svgMarkup: string,
  animationPrompt: string,
  model?: string,
): Promise<AiRouteResult> {
  const response = await fetch('/api/ai/reason', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      ...(model ? { model } : {}),
      prompt: buildMotionPrompt(svgMarkup, animationPrompt),
    }),
  });

  if (!response.ok) throw new Error('motion-plan-failed');
  return response.json() as Promise<AiRouteResult>;
}

function buildMotionPrompt(svgMarkup: string, animationPrompt: string): string {
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
    }));

  const viewBox = svg.getAttribute('viewBox') || 'unknown';
  const intent = animationPrompt.trim() || 'Choose a tasteful automatic animation for the key visual elements only.';

  return [
    'Create a Motion Spec proposal for this SVG.',
    `User animation intent: ${intent}`,
    `SVG viewBox: ${viewBox}`,
    `Animatable nodes (${nodes.length} listed): ${JSON.stringify(nodes)}`,
    'Use only target IDs present in the node list. Prefer a small number of meaningful targets, not every node.',
    'Return JSON only when possible.',
  ].join('\n');
}
