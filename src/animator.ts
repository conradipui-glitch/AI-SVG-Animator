import { gsap } from 'gsap';
import { getAnimatableElements } from './svg';

export type Preset = 'reveal' | 'draw' | 'float';

export interface MotionOptions {
  preset: Preset;
  duration: number;
  intensity: number;
  loop: boolean;
}

let activeTimeline: gsap.core.Timeline | null = null;

export function stopAnimation(): void {
  activeTimeline?.kill();
  activeTimeline = null;
}

export function animateSvg(svg: SVGSVGElement, options: MotionOptions): void {
  stopAnimation();
  const elements = getAnimatableElements(svg);
  if (!elements.length) return;

  gsap.killTweensOf(elements);
  gsap.set(elements, { clearProps: 'transform,opacity,transformOrigin' });

  activeTimeline = options.preset === 'reveal'
    ? reveal(elements, options)
    : options.preset === 'draw'
      ? draw(elements, options)
      : float(elements, options);
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
