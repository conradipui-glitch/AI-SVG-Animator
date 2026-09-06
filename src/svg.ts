import DOMPurify from 'dompurify';

const GRAPHIC_SELECTOR = 'path, circle, ellipse, rect, line, polyline, polygon, text';

export interface NormalizedSvg {
  markup: string;
  elementCount: number;
  groupCount: number;
}

export function normalizeSvg(raw: string): NormalizedSvg {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('empty-svg');

  const sanitized = DOMPurify.sanitize(trimmed, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onload', 'onclick', 'onerror', 'onmouseenter', 'onmouseover']
  });

  const doc = new DOMParser().parseFromString(sanitized, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('invalid-svg');

  const svg = doc.documentElement;
  if (svg.localName.toLowerCase() !== 'svg') throw new Error('invalid-svg');

  const sourceWidth = svg.getAttribute('width');
  const sourceHeight = svg.getAttribute('height');

  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', svg.getAttribute('preserveAspectRatio') || 'xMidYMid meet');
  svg.removeAttribute('style');

  if (!svg.hasAttribute('viewBox')) {
    const width = Number.parseFloat(sourceWidth || '0');
    const height = Number.parseFloat(sourceHeight || '0');
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    } else {
      svg.setAttribute('viewBox', '0 0 512 512');
    }
  }

  const groups = Array.from(svg.querySelectorAll<SVGGElement>('g'));
  groups.forEach((group, index) => {
    if (!group.id) group.id = `animator-group-${index + 1}`;
    group.dataset.animatorGroup = 'true';
    group.dataset.animatorMotionTarget = 'true';
  });

  const elements = Array.from(svg.querySelectorAll<SVGGraphicsElement>(GRAPHIC_SELECTOR));
  elements.forEach((element, index) => {
    if (!element.id) element.id = `animator-node-${index + 1}`;
    element.dataset.animatorTarget = 'true';
    element.dataset.animatorMotionTarget = 'true';
  });

  return {
    markup: new XMLSerializer().serializeToString(svg),
    elementCount: elements.length,
    groupCount: groups.length,
  };
}

export function getAnimatableElements(svg: SVGSVGElement): SVGGraphicsElement[] {
  return Array.from(svg.querySelectorAll<SVGGraphicsElement>('[data-animator-target="true"]'));
}

export function getMotionTargetElements(svg: SVGSVGElement): SVGGraphicsElement[] {
  return Array.from(svg.querySelectorAll<SVGGraphicsElement>('[data-animator-motion-target="true"]'));
}
