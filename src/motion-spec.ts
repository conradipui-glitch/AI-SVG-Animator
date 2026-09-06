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

export interface MotionSpecValidation {
  spec: MotionSpec | null;
  receivedTracks: number;
  acceptedTracks: number;
  rejectedTracks: number;
  warnings: string[];
}

export interface MotionVariant {
  id: string;
  title: string;
  description: string;
  spec: MotionSpec;
  validation: MotionSpecValidation;
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
  return validateMotionSpecText(text, svgMarkup).spec;
}

export function validateMotionSpecText(text: string, svgMarkup: string): MotionSpecValidation {
  const parsed = parseJsonValue(text);
  return validateMotionSpecValue(parsed, svgMarkup);
}

export function validateMotionSpecValue(value: unknown, svgMarkup: string): MotionSpecValidation {
  const parsed = unwrapMotionSpec(value);
  if (!parsed) {
    return {
      spec: null,
      receivedTracks: 0,
      acceptedTracks: 0,
      rejectedTracks: 0,
      warnings: ['AI response did not contain a Motion Spec object.'],
    };
  }

  const tracksValue = firstArray(parsed, ['tracks', 'motions', 'animations', 'steps']);
  if (!tracksValue) {
    return {
      spec: null,
      receivedTracks: 0,
      acceptedTracks: 0,
      rejectedTracks: 0,
      warnings: ['Motion Spec did not contain a tracks array.'],
    };
  }

  const allowedTargets = targetIds(svgMarkup);
  const warnings: string[] = [];
  const tracks: MotionTrack[] = [];

  tracksValue.slice(0, 24).forEach((trackValue, index) => {
    const result = normalizeTrack(trackValue, allowedTargets);
    if (result.track) tracks.push(result.track);
    else warnings.push(`Track ${index + 1}: ${result.reason || 'rejected'}`);
  });

  const receivedTracks = Math.min(tracksValue.length, 24);
  const acceptedTracks = tracks.length;
  const rejectedTracks = receivedTracks - acceptedTracks;

  return {
    spec: acceptedTracks ? { version: 1, loop: parsed.loop !== false, tracks } : null,
    receivedTracks,
    acceptedTracks,
    rejectedTracks,
    warnings,
  };
}

export function parseMotionVariants(text: string, svgMarkup: string): MotionVariant[] {
  const parsed = parseJsonValue(text);
  const items = variantItems(parsed);
  if (!items.length) return [];

  return items
    .slice(0, 6)
    .map((item, index): MotionVariant | null => {
      if (!isRecord(item)) return null;
      const candidate = item.motionSpec
        ?? item.motion_spec
        ?? item.spec
        ?? item.animation
        ?? item.plan
        ?? item;
      const validation = validateMotionSpecValue(candidate, svgMarkup);
      if (!validation.spec) return null;
      return {
        id: safeString(item.id) || safeString(item.key) || `variant-${index + 1}`,
        title: safeString(item.title) || safeString(item.name) || safeString(item.style) || `Variant ${index + 1}`,
        description: safeString(item.description) || safeString(item.summary) || safeString(item.note) || '',
        spec: validation.spec,
        validation,
      };
    })
    .filter((variant): variant is MotionVariant => Boolean(variant));
}

function variantItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];

  for (const key of ['variants', 'options', 'animations', 'concepts']) {
    const candidate = value[key];
    if (Array.isArray(candidate)) return candidate;
  }

  const named = ['subtle', 'natural', 'expressive']
    .flatMap((key) => {
      const candidate = value[key];
      if (!isRecord(candidate)) return [];
      return [{ id: key, title: key[0]?.toUpperCase() + key.slice(1), ...candidate }];
    });
  if (named.length) return named;

  return [];
}

function unwrapMotionSpec(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  if (firstArray(value, ['tracks', 'motions', 'animations', 'steps'])) return value;
  for (const key of ['motionSpec', 'motion_spec', 'spec', 'animation', 'plan']) {
    const nested = value[key];
    if (isRecord(nested)) return nested;
  }
  return null;
}

function normalizeTrack(
  value: unknown,
  allowedTargets: Set<string>,
): { track: MotionTrack | null; reason?: string } {
  if (!isRecord(value)) return { track: null, reason: 'not an object' };

  const targetValue = value.target ?? value.selector ?? value.id;
  const rawTarget = typeof targetValue === 'string' ? targetValue.trim() : '';
  const target = rawTarget.startsWith('#') ? rawTarget : rawTarget ? `#${rawTarget}` : '';
  const id = target.slice(1);
  if (!id) return { track: null, reason: 'missing target' };
  if (!allowedTargets.has(id)) return { track: null, reason: `unknown target ${target}` };

  const effectValue = value.effect ?? value.type ?? value.motion;
  const rawEffect = typeof effectValue === 'string' ? effectValue.trim().toLowerCase() : '';
  const effect = normalizeEffect(rawEffect);
  if (!effect) return { track: null, reason: `unsupported effect ${rawEffect || '(empty)'}` };

  const duration = clampNumber(value.duration ?? value.seconds ?? value.time, 0.12, 8, 1.4);
  const delay = clampNumber(value.delay ?? value.start, 0, 8, 0);
  const rawEase = typeof value.ease === 'string'
    ? value.ease
    : typeof value.easing === 'string'
      ? value.easing
      : '';
  const ease = SAFE_EASES.has(rawEase) ? rawEase : 'sine.inOut';
  const yoyo = value.yoyo !== false && value.direction !== 'normal';
  const from = normalizeValues(value.from ?? value.startValues ?? value.startState);
  const to = normalizeValues(value.to ?? value.endValues ?? value.endState);

  applyTopLevelValues(effect, value, to);
  applyEffectDefaults(effect, from, to);
  ensurePerceptibleDelta(effect, from, to);

  return {
    track: { target, effect, duration, delay, ease, yoyo, from, to },
  };
}

function normalizeEffect(value: string): MotionEffect | null {
  if (EFFECTS.has(value as MotionEffect)) return value as MotionEffect;
  if (value === 'move' || value === 'float' || value === 'sway' || value === 'drift') return 'translate';
  if (value === 'fade' || value === 'fadein' || value === 'fade-in') return 'opacity';
  if (value === 'stroke-draw' || value === 'stroke_draw' || value === 'drawpath') return 'draw';
  if (value === 'zoom') return 'scale';
  if (value === 'spin' || value === 'turn') return 'rotate';
  return null;
}

function normalizeValues(value: unknown): MotionValues {
  if (!isRecord(value)) return {};
  const result: MotionValues = {};

  if (typeof value.x === 'number' && Number.isFinite(value.x)) result.x = clamp(value.x, -240, 240);
  if (typeof value.y === 'number' && Number.isFinite(value.y)) result.y = clamp(value.y, -240, 240);
  if (typeof value.rotation === 'number' && Number.isFinite(value.rotation)) result.rotation = clamp(value.rotation, -360, 360);
  else if (typeof value.angle === 'number' && Number.isFinite(value.angle)) result.rotation = clamp(value.angle, -360, 360);
  if (typeof value.scale === 'number' && Number.isFinite(value.scale)) result.scale = clamp(value.scale, 0.05, 4);
  if (typeof value.opacity === 'number' && Number.isFinite(value.opacity)) result.opacity = clamp(value.opacity, 0, 1);

  return result;
}

function applyTopLevelValues(effect: MotionEffect, value: Record<string, unknown>, to: MotionValues): void {
  if (effect === 'translate') {
    if (typeof value.x === 'number' && Number.isFinite(value.x)) to.x = clamp(value.x, -240, 240);
    if (typeof value.y === 'number' && Number.isFinite(value.y)) to.y = clamp(value.y, -240, 240);
  }
  if (effect === 'rotate') {
    if (typeof value.rotation === 'number' && Number.isFinite(value.rotation)) to.rotation = clamp(value.rotation, -360, 360);
    else if (typeof value.angle === 'number' && Number.isFinite(value.angle)) to.rotation = clamp(value.angle, -360, 360);
  }
  if ((effect === 'scale' || effect === 'pulse') && typeof value.scale === 'number' && Number.isFinite(value.scale)) {
    to.scale = clamp(value.scale, 0.05, 4);
  }
  if ((effect === 'opacity' || effect === 'pulse') && typeof value.opacity === 'number' && Number.isFinite(value.opacity)) {
    to.opacity = clamp(value.opacity, 0, 1);
  }
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

function ensurePerceptibleDelta(effect: MotionEffect, from: MotionValues, to: MotionValues): void {
  if (effect === 'translate') {
    const dx = Math.abs((to.x ?? 0) - (from.x ?? 0));
    const dy = Math.abs((to.y ?? 0) - (from.y ?? 0));
    if (dx < 0.75 && dy < 0.75) to.y = (from.y ?? 0) - 8;
  } else if (effect === 'rotate') {
    if (Math.abs((to.rotation ?? 0) - (from.rotation ?? 0)) < 0.5) to.rotation = (from.rotation ?? 0) + 5;
  } else if (effect === 'scale') {
    if (Math.abs((to.scale ?? 1) - (from.scale ?? 1)) < 0.008) to.scale = (from.scale ?? 1) * 1.05;
  } else if (effect === 'opacity') {
    if (Math.abs((to.opacity ?? 1) - (from.opacity ?? 1)) < 0.02) {
      from.opacity = 0.35;
      to.opacity = 1;
    }
  } else if (effect === 'pulse') {
    const scaleDelta = Math.abs((to.scale ?? 1) - (from.scale ?? 1));
    const opacityDelta = Math.abs((to.opacity ?? 1) - (from.opacity ?? 1));
    if (scaleDelta < 0.008 && opacityDelta < 0.02) to.scale = (from.scale ?? 1) * 1.05;
  }
}

function targetIds(svgMarkup: string): Set<string> {
  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
  return new Set(
    Array.from(doc.querySelectorAll<SVGGraphicsElement>('[data-animator-motion-target="true"]'))
      .map((element) => element.id)
      .filter(Boolean),
  );
}

function parseJsonValue(text: string): unknown {
  const candidates = [text.trim()];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  if (fenced) candidates.unshift(fenced);

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(text.slice(firstBrace, lastBrace + 1));

  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) candidates.push(text.slice(firstBracket, lastBracket + 1));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function firstArray(record: Record<string, unknown>, keys: string[]): unknown[] | null {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 160) : '';
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}