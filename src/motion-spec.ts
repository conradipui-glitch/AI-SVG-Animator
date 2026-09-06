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

interface TargetInfo {
  id: string;
  role: string;
  isGroup: boolean;
  graphicsCount: number;
}

type FallbackStyle = 'subtle' | 'natural' | 'expressive';

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
  const catalog = targetCatalog(svgMarkup);
  const fallback = buildFallbackMotionSpec(catalog, 'natural');
  const parsed = unwrapMotionSpec(value);
  if (!parsed) {
    return {
      spec: fallback,
      receivedTracks: 0,
      acceptedTracks: fallback.tracks.length,
      rejectedTracks: 0,
      warnings: ['AI response did not contain a Motion Spec object. A safe local fallback was generated.'],
    };
  }

  const tracksValue = firstArray(parsed, ['tracks', 'motions', 'animations', 'steps']);
  if (!tracksValue) {
    return {
      spec: fallback,
      receivedTracks: 0,
      acceptedTracks: fallback.tracks.length,
      rejectedTracks: 0,
      warnings: ['Motion Spec did not contain a tracks array. A safe local fallback was generated.'],
    };
  }

  const warnings: string[] = [];
  const tracks: MotionTrack[] = [];

  tracksValue.slice(0, 24).forEach((trackValue, index) => {
    const result = normalizeTrack(trackValue, catalog);
    if (result.track) {
      tracks.push(result.track);
      if (result.warning) warnings.push(`Track ${index + 1}: ${result.warning}`);
    } else {
      warnings.push(`Track ${index + 1}: ${result.reason || 'rejected'}`);
    }
  });

  const receivedTracks = Math.min(tracksValue.length, 24);
  if (!tracks.length) {
    warnings.push('No AI tracks were executable. A safe local fallback was generated.');
    return {
      spec: fallback,
      receivedTracks,
      acceptedTracks: fallback.tracks.length,
      rejectedTracks: receivedTracks,
      warnings,
    };
  }

  return {
    spec: { version: 1, loop: parsed.loop !== false, tracks },
    receivedTracks,
    acceptedTracks: tracks.length,
    rejectedTracks: receivedTracks - tracks.length,
    warnings,
  };
}

export function parseMotionVariants(text: string, svgMarkup: string): MotionVariant[] {
  const parsed = parseJsonValue(text);
  const items = variantItems(parsed);
  const catalog = targetCatalog(svgMarkup);
  const variants: MotionVariant[] = [];

  items.slice(0, 6).forEach((item, index) => {
    if (!isRecord(item)) return;
    const candidate = item.motionSpec
      ?? item.motion_spec
      ?? item.spec
      ?? item.animation
      ?? item.plan
      ?? item;
    const validation = validateMotionSpecValue(candidate, svgMarkup);
    if (!validation.spec) return;
    variants.push({
      id: safeString(item.id) || safeString(item.key) || `variant-${index + 1}`,
      title: safeString(item.title) || safeString(item.name) || safeString(item.style) || `Variant ${index + 1}`,
      description: safeString(item.description) || safeString(item.summary) || safeString(item.note) || '',
      spec: validation.spec,
      validation,
    });
  });

  const desired: Array<{ id: FallbackStyle; title: string; description: string }> = [
    { id: 'subtle', title: 'Subtle', description: 'Safe restrained motion generated locally.' },
    { id: 'natural', title: 'Natural', description: 'Balanced safe motion generated locally.' },
    { id: 'expressive', title: 'Expressive', description: 'Stronger safe motion generated locally.' },
  ];

  for (const preset of desired) {
    const alreadyPresent = variants.some((variant) =>
      variant.id.toLowerCase() === preset.id || variant.title.toLowerCase() === preset.title.toLowerCase());
    if (alreadyPresent) continue;
    const spec = buildFallbackMotionSpec(catalog, preset.id);
    variants.push({
      id: preset.id,
      title: preset.title,
      description: preset.description,
      spec,
      validation: {
        spec,
        receivedTracks: 0,
        acceptedTracks: spec.tracks.length,
        rejectedTracks: 0,
        warnings: ['AI variant was missing or invalid; safe local variant generated.'],
      },
    });
  }

  return variants.slice(0, 3);
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
  if (Array.isArray(value)) return { tracks: value };
  if (!isRecord(value)) return null;
  if (firstArray(value, ['tracks', 'motions', 'animations', 'steps'])) return value;
  for (const key of ['motionSpec', 'motion_spec', 'spec', 'animation', 'plan']) {
    const nested = value[key];
    if (Array.isArray(nested)) return { tracks: nested };
    if (isRecord(nested)) return nested;
  }
  return null;
}

function normalizeTrack(
  value: unknown,
  catalog: TargetInfo[],
): { track: MotionTrack | null; reason?: string; warning?: string } {
  if (!isRecord(value)) return { track: null, reason: 'not an object' };

  const targetValue = value.target ?? value.selector ?? value.id;
  const rawTarget = typeof targetValue === 'string' ? targetValue.trim() : '';
  if (!rawTarget) return { track: null, reason: 'missing target' };

  const resolved = resolveTarget(rawTarget, catalog);
  if (!resolved) return { track: null, reason: `unknown target ${rawTarget}` };
  const target = `#${resolved.id}`;

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
  constrainTrack(resolved, effect, from, to);

  const warning = normalizeTargetText(rawTarget) !== normalizeTargetText(resolved.id)
    ? `repaired target ${rawTarget} → #${resolved.id}`
    : undefined;

  return {
    track: { target, effect, duration, delay, ease, yoyo, from, to },
    ...(warning ? { warning } : {}),
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

function constrainTrack(target: TargetInfo, effect: MotionEffect, from: MotionValues, to: MotionValues): void {
  const id = target.id.toLowerCase();
  const isRoot = id === 'root' || id === 'scene' || id === 'world';
  const isMajor = isRoot
    || target.role === 'character'
    || target.role === 'body'
    || target.graphicsCount >= 12
    || /(^|[-_])(torso|pelvis|body)([-_]|$)/.test(id);

  if (effect === 'translate') {
    const limit = isRoot ? 8 : isMajor ? 24 : 96;
    from.x = clamp(from.x ?? 0, -limit, limit);
    from.y = clamp(from.y ?? 0, -limit, limit);
    to.x = clamp(to.x ?? 0, -limit, limit);
    to.y = clamp(to.y ?? 0, -limit, limit);
  } else if (effect === 'rotate') {
    const limit = isRoot ? 6 : isMajor ? 24 : 360;
    from.rotation = clamp(from.rotation ?? 0, -limit, limit);
    to.rotation = clamp(to.rotation ?? 0, -limit, limit);
  } else if (effect === 'scale' || effect === 'pulse') {
    const min = isRoot ? 0.98 : isMajor ? 0.9 : 0.65;
    const max = isRoot ? 1.02 : isMajor ? 1.12 : 1.5;
    from.scale = clamp(from.scale ?? 1, min, max);
    to.scale = clamp(to.scale ?? 1, min, max);
  }
}

function resolveTarget(raw: string, catalog: TargetInfo[]): TargetInfo | null {
  const clean = raw.replace(/^#/, '').trim();
  if (!clean) return null;

  const exact = catalog.find((target) => target.id === clean);
  if (exact) return exact;
  const caseInsensitive = catalog.find((target) => target.id.toLowerCase() === clean.toLowerCase());
  if (caseInsensitive) return caseInsensitive;

  const wanted = targetTokens(clean);
  let best: TargetInfo | null = null;
  let bestScore = 0;
  let tied = false;

  for (const target of catalog) {
    const candidate = targetTokens(target.id);
    let score = 0;
    wanted.forEach((token) => {
      if (candidate.has(token)) score += token === 'left' || token === 'right' ? 1.25 : 1;
    });
    if (score > bestScore) {
      best = target;
      bestScore = score;
      tied = false;
    } else if (score > 0 && Math.abs(score - bestScore) < 0.001) {
      tied = true;
    }
  }

  const threshold = wanted.size <= 1 ? 1 : 2;
  return best && bestScore >= threshold && !tied ? best : null;
}

function targetTokens(value: string): Set<string> {
  const expanded = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/(^|[_\-\s])l(?=$|[_\-\s])/gi, '$1 left ')
    .replace(/(^|[_\-\s])r(?=$|[_\-\s])/gi, '$1 right ')
    .replace(/forearm/gi, 'forearm arm')
    .replace(/upperarm/gi, 'upper arm')
    .replace(/lowerarm/gi, 'lower arm')
    .replace(/upperleg/gi, 'upper leg')
    .replace(/lowerleg/gi, 'lower leg')
    .toLowerCase();
  return new Set(expanded.split(/[^a-z0-9]+/).filter((token) => token && token !== 'animator'));
}

function normalizeTargetText(value: string): string {
  return value.replace(/^#/, '').trim().toLowerCase();
}

function targetCatalog(svgMarkup: string): TargetInfo[] {
  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
  return Array.from(doc.querySelectorAll<SVGGraphicsElement>('[data-animator-motion-target="true"]'))
    .map((element) => ({
      id: element.id,
      role: element.dataset.animatorRole || 'unknown',
      isGroup: element.dataset.animatorGroup === 'true',
      graphicsCount: element.dataset.animatorGroup === 'true'
        ? element.querySelectorAll('path, circle, ellipse, rect, line, polyline, polygon, text').length
        : 1,
    }))
    .filter((target) => Boolean(target.id));
}

function buildFallbackMotionSpec(catalog: TargetInfo[], style: FallbackStyle): MotionSpec {
  const amount = style === 'subtle' ? 0.6 : style === 'expressive' ? 1.45 : 1;
  const tracks: MotionTrack[] = [];
  const used = new Set<string>();

  const find = (...patterns: RegExp[]): TargetInfo | undefined => catalog.find((target) =>
    !used.has(target.id) && patterns.some((pattern) => pattern.test(target.id)));
  const add = (target: TargetInfo | undefined, effect: MotionEffect, to: MotionValues, duration: number, delay = 0): void => {
    if (!target || used.has(target.id)) return;
    const from: MotionValues = effect === 'scale' || effect === 'pulse'
      ? { scale: 1, opacity: 1 }
      : effect === 'opacity'
        ? { opacity: 1 }
        : effect === 'rotate'
          ? { rotation: 0 }
          : { x: 0, y: 0 };
    const adjusted = { ...to };
    if (typeof adjusted.x === 'number') adjusted.x *= amount;
    if (typeof adjusted.y === 'number') adjusted.y *= amount;
    if (typeof adjusted.rotation === 'number') adjusted.rotation *= amount;
    if (typeof adjusted.scale === 'number') adjusted.scale = 1 + (adjusted.scale - 1) * amount;
    constrainTrack(target, effect, from, adjusted);
    tracks.push({
      target: `#${target.id}`,
      effect,
      duration: clamp(duration / Math.max(0.75, amount), 0.7, 4),
      delay,
      ease: 'sine.inOut',
      yoyo: true,
      from,
      to: adjusted,
    });
    used.add(target.id);
  };

  add(find(/^torso$/i, /torso/i, /body/i), 'translate', { x: 0, y: -5 }, 2.2);
  add(find(/^head$/i, /head/i), 'rotate', { rotation: 5 }, 1.8, 0.1);
  add(find(/upper[_-]?arm[_-]?l/i, /left.*arm/i), 'rotate', { rotation: -12 }, 1.55, 0.1);
  add(find(/upper[_-]?arm[_-]?r/i, /right.*arm/i), 'rotate', { rotation: 12 }, 1.55, 0.1);
  add(find(/thigh[_-]?l/i, /left.*thigh/i, /left.*leg/i), 'rotate', { rotation: 8 }, 1.8, 0.25);
  add(find(/thigh[_-]?r/i, /right.*thigh/i, /right.*leg/i), 'rotate', { rotation: -8 }, 1.8, 0.25);
  add(find(/shield/i, /sword/i, /weapon/i), 'rotate', { rotation: 7 }, 1.6, 0.2);

  if (!tracks.length) {
    const groups = catalog.filter((target) => target.isGroup && !/^(root|scene|world)$/i.test(target.id));
    const primary = groups[0] ?? catalog.find((target) => !/^(root|scene|world)$/i.test(target.id)) ?? catalog[0];
    const secondary = groups[1] ?? catalog.find((target) => target.id !== primary?.id);
    add(primary, 'translate', { x: 0, y: -7 }, 2.1);
    add(secondary, 'rotate', { rotation: 5 }, 1.9, 0.15);
  }

  if (!tracks.length && catalog[0]) {
    add(catalog[0], 'opacity', { opacity: 0.75 }, 1.8);
  }

  return { version: 1, loop: true, tracks };
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
