import { gsap } from 'gsap';
import type { MotionSpec, MotionTrack } from './motion-spec';
import { getAnimatableElements, getMotionTargetElements } from './svg';

export type Preset = 'reveal' | 'draw' | 'float';

export interface MotionOptions {
  preset: Preset;
  duration: number;
  intensity: number;
  loop: boolean;
}

type MotionGlobal = typeof globalThis & {
  __AI_SVG_ACTIVE_MOTION_SPEC__?: MotionSpec | null;
};

let activeTimeline: gsap.core.Timeline | null = null;

function setActiveMotionSpec(spec: MotionSpec | null): void {
  (globalThis as MotionGlobal).__AI_SVG_ACTIVE_MOTION_SPEC__ = spec;
}

export function getActiveMotionSpec(): MotionSpec | null {
  return (globalThis as MotionGlobal).__AI_SVG_ACTIVE_MOTION_SPEC__ ?? null;
}

export function stopAnimation(): void {
  activeTimeline?.kill();
  activeTimeline = null;
}

export function animateSvg(svg: SVGSVGElement, options: MotionOptions): void {
  stopAnimation();
  setActiveMotionSpec(null);
  const elements = getAnimatableElements(svg);
  if (!elements.length) return;

  gsap.killTweensOf(elements);
  gsap.set(elements, { clearProps: 'transform,opacity,transformOrigin,strokeDasharray,strokeDashoffset,fillOpacity' });

  activeTimeline = options.preset === 'reveal'
    ? reveal(elements, options)
    : options.preset === 'draw'
      ? draw(elements, options)
      : float(elements, options);
}

export function animateMotionSpec(svg: SVGSVGElement, spec: MotionSpec): void {
  stopAnimation();
  setActiveMotionSpec(spec);
  const allElements = getMotionTargetElements(svg);
  gsap.killTweensOf(allElements);
  gsap.set(allElements, { clearProps: 'transform,opacity,transformOrigin,strokeDasharray,strokeDashoffset,fillOpacity' });

  const tl = gsap.timeline({ repeat: spec.loop ? -1 : 0, repeatDelay: spec.loop ? 0.25 : 0 });

  for (const track of spec.tracks) {
    const id = track.target.startsWith('#') ? track.target.slice(1) : track.target;
    const element = svg.querySelector<SVGGraphicsElement>(`#${CSS.escape(id)}`);
    if (!element) continue;
    addMotionTrack(tl, element, track);
  }

  activeTimeline = tl;
}

function addMotionTrack(tl: gsap.core.Timeline, element: SVGGraphicsElement, track: MotionTrack): void {
  if (track.effect === 'draw' && 'getTotalLength' in element) {
    const geometry = element as SVGGeometryElement;
    const length = Math.max(1, geometry.getTotalLength());
    const computed = getComputedStyle(element);
    const originalFill = element.getAttribute('fill') ?? computed.fill;
    const originalStroke = element.getAttribute('stroke') ?? computed.stroke;
    const traceColor = originalStroke && originalStroke !== 'none' ? originalStroke : originalFill || '#7fb3ff';

    gsap.set(element, {
      stroke: traceColor,
      strokeDasharray: length,
      strokeDashoffset: length,
      fillOpacity: 0,
      opacity: 1,
    });
    tl.to(element, {
      strokeDashoffset: 0,
      duration: track.duration,
      ease: track.ease,
    }, track.delay);
    tl.to(element, {
      fillOpacity: originalFill && originalFill !== 'none' ? 1 : 0,
      stroke: originalStroke,
      duration: Math.max(0.18, track.duration * 0.28),
      ease: 'power1.out',
    }, track.delay + track.duration * 0.72);
    return;
  }

  const from = valuesForTrack(track, track.from);
  const to = valuesForTrack(track, track.to);

  tl.fromTo(element, from, {
    ...to,
    transformOrigin: transformOriginFor(element),
    duration: track.duration,
    ease: track.ease,
    yoyo: track.yoyo,
    repeat: track.yoyo ? 1 : 0,
  }, track.delay);
}

function transformOriginFor(element: SVGGraphicsElement): string {
  const pivot = element.dataset.animatorPivot;
  if (pivot === 'bottom-center') return '50% 100%';
  if (pivot === 'top-center') return '50% 0%';
  if (pivot === 'left-center') return '0% 50%';
  if (pivot === 'right-center') return '100% 50%';
  return '50% 50%';
}

function valuesForTrack(track: MotionTrack, values: MotionTrack['from']): gsap.TweenVars {
  if (track.effect === 'translate') return { x: values.x ?? 0, y: values.y ?? 0 };
  if (track.effect === 'rotate') return { rotation: values.rotation ?? 0 };
  if (track.effect === 'scale') return { scale: values.scale ?? 1 };
  if (track.effect === 'opacity') return { opacity: values.opacity ?? 1 };
  if (track.effect === 'pulse') return { scale: values.scale ?? 1, opacity: values.opacity ?? 1 };
  return {};
}

function reveal(elements: SVGGraphicsElement[], options: MotionOptions): gsap.core.Timeline {
  const repeat = options.loop ? -1 : 0;
  const tl = gsap.timeline({ repeat, repeatDelay: Math.max(0.25, options.duration * 0.25) });
  tl.fromTo(
    elements,
    { opacity: 0, scale: 1 - options.intensity * 0.16, transformOrigin: '50% 50%' },
    {
      opacity: 1,
      scale: 1,
      duration: options.duration,
      stagger: Math.min(0.12, options.duration / Math.max(elements.length, 8)),
      ease: 'power2.out'
    }
  );
  return tl;
}

function draw(elements: SVGGraphicsElement[], options: MotionOptions): gsap.core.Timeline {
  const repeat = options.loop ? -1 : 0;
  const drawable = elements.filter((element): element is SVGGeometryElement => 'getTotalLength' in element);
  const tl = gsap.timeline({ repeat, repeatDelay: Math.max(0.3, options.duration * 0.25) });

  drawable.forEach((element, index) => {
    const length = Math.max(1, element.getTotalLength());
    const computed = getComputedStyle(element);
    const originalFill = element.getAttribute('fill') ?? computed.fill;
    const originalStroke = element.getAttribute('stroke') ?? computed.stroke;
    const traceColor = originalStroke && originalStroke !== 'none' ? originalStroke : originalFill || '#7fb3ff';

    gsap.set(element, {
      stroke: traceColor,
      strokeDasharray: length,
      strokeDashoffset: length,
      fillOpacity: 0,
      opacity: 1
    });

    const at = index * Math.min(0.08, options.duration / Math.max(drawable.length, 10));
    tl.to(element, {
      strokeDashoffset: 0,
      duration: options.duration,
      ease: 'power1.inOut'
    }, at);
    tl.to(element, {
      fillOpacity: originalFill && originalFill !== 'none' ? 1 : 0,
      stroke: originalStroke,
      duration: Math.max(0.18, options.duration * 0.28),
      ease: 'power1.out'
    }, at + options.duration * 0.72);
  });

  return tl;
}

function float(elements: SVGGraphicsElement[], options: MotionOptions): gsap.core.Timeline {
  const amplitude = 4 + options.intensity * 18;
  const rotation = 0.5 + options.intensity * 2.5;
  const tl = gsap.timeline({ repeat: options.loop ? -1 : 1, yoyo: true });
  tl.to(elements, {
    y: () => gsap.utils.random(-amplitude, amplitude),
    rotation: () => gsap.utils.random(-rotation, rotation),
    transformOrigin: '50% 50%',
    duration: options.duration,
    stagger: Math.min(0.08, options.duration / Math.max(elements.length, 12)),
    ease: 'sine.inOut'
  });
  return tl;
}
