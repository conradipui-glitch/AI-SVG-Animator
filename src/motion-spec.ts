export type MotionEffect = 'translate' | 'rotate' | 'scale' | 'opacity' | 'pulse' | 'draw';

export interface MotionValues {
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
  opacity?: number;
}

export interface MotionTrack {
  target: string;
  effect: MotionEffect;
  duration: number;
  delay: number;
  ease: string;
  yoyo: boolean;
  from: MotionValues;
  to: MotionValues;
}

export interface MotionSpec {
  version: 1;
  loop: boolean;
  tracks: MotionTrack[];
}

const EFFECTS = new Set<MotionEffect>(['translate', 'rotate', 'scale', 'opacity', 'pulse', 'draw']);
const SAFE_EASES = new Set([
  'none',
  'linear',
  'sine.in',
  'sine.out',
  'sine.inOut',
  'power1.in',
  'power1.out',
  'power1.inOut',
  'power2.in',
  'power2.out',
  'power2.inOut',
  'back.out',
]);

export function parseMotionSpec(text: string, svgMarkup: string): MotionSpec | null {
  const parsed = parseJsonObject(text);
  if (!parsed) return null;

  const tracksValue = parsed.tracks;
  if (!Array.isArray(tracksValue)) return null;

  const allowedTargets = targetIds(svgMarkup);
  const tracks = tracksValue
    .map((value) => normalizeTrack(value, allowedTargets))
    .filter((track): track is MotionTrack => Boolean(track))
    .slice(0, 16);

  if (!tracks.length) return null;

  return {
    version: 1,
    loop: parsed.loop !== false,
    tracks,
  };
}

function normalizeTrack(value: unknown, allowedTargets: Set<string>): MotionTrack | null {
  if (!isRecord(value)) return null;

  const rawTarget = typeof value.target === 'string' ? value.target.trim() : '';
  const target = rawTarget.startsWith('#') ? rawTarget : rawTarget ? `#${rawTarget}` : '';
  const id = target.slice(1);
  if (!id || !allowedTargets.has(id)) return null;

  const rawEffect = typeof value.effect === 'string' ? value.effect.trim().toLowerCase() : '';
  const effect = normalizeEffect(rawEffect);
  if (!effect) return null;

  const duration = clampNumber(value.duration, 0.12, 8, 1.4);
  const delay = clampNumber(value.delay, 0, 8, 0);
  const ease = typeof value.ease === 'string' && SAFE_EASES.has(value.ease) ? value.ease : 'sine.inOut';
  const yoyo = value.yoyo !== false;
  const from = normalizeValues(value.from);
  const to = normalizeValues(value.to);

  applyEffectDefaults(effect, from, to);

  return { target, effect, duration, delay, ease, yoyo, from, to };
}

function normalizeEffect(value: string): MotionEffect | null {
  if (EFFECTS.has(value as MotionEffect)) return value as MotionEffect;
  if (value === 'move' || value === 'float') return 'translate';
  if (value === 'fade') return 'opacity';
  if (value === 'stroke-draw' || value === 'stroke_draw') return 'draw';
  return null;
}

function normalizeValues(value: unknown): MotionValues {
  if (!isRecord(value)) return {};
  const result: MotionValues = {};

  if (typeof value.x === 'number' && Number.isFinite(value.x)) result.x = clamp(value.x, -200, 200);
  if (typeof value.y === 'number' && Number.isFinite(value.y)) result.y = clamp(value.y, -200, 200);
  if (typeof value.rotation === 'number' && Number.isFinite(value.rotation)) result.rotation = clamp(value.rotation, -180, 180);
  if (typeof value.scale === 'number' && Number.isFinite(value.scale)) result.scale = clamp(value.scale, 0.05, 4);
  if (typeof value.opacity === 'number' && Number.isFinite(value.opacity)) result.opacity = clamp(value.opacity, 0, 1);

  return result;
}

function applyEffectDefaults(effect: MotionEffect, from: MotionValues, to: MotionValues): void {
  if (effect === 'translate') {
    from.x ??= 0;
    from.y ??= 0;
    to.x ??= 0;
    to.y ??= -8;
  } else if (effect === 'rotate') {
    from.rotation ??= 0;
    to.rotation ??= 4;
  } else if (effect === 'scale') {
    from.scale ??= 1;
    to.scale ??= 1.06;
  } else if (effect === 'opacity') {
    from.opacity ??= 0;
    to.opacity ??= 1;
  } else if (effect === 'pulse') {
    from.scale ??= 1;
    to.scale ??= 1.06;
    from.opacity ??= 1;
    to.opacity ??= 1;
  }
}

function targetIds(svgMarkup: string): Set<string> {
  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
  return new Set(
    Array.from(doc.querySelectorAll<SVGGraphicsElement>('[data-animator-target="true"]'))
      .map((element) => element.id)
      .filter(Boolean),
  );
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const candidates = [text.trim()];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  if (fenced) candidates.unshift(fenced);

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(text.slice(firstBrace, lastBrace + 1));

  for (const candidate of candidates) {
    try {
      const value: unknown = JSON.parse(candidate);
      if (isRecord(value)) return value;
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
