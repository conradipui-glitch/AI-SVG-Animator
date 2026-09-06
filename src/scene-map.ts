export type MotionNodeKind = 'group' | 'shape';
export type PivotHint = 'center' | 'bottom-center' | 'top-center' | 'left-center' | 'right-center';

export type SemanticRole =
  | 'background'
  | 'character'
  | 'body'
  | 'head'
  | 'eye'
  | 'arm'
  | 'hand'
  | 'leg'
  | 'foot'
  | 'wing'
  | 'hair'
  | 'cloth'
  | 'vehicle'
  | 'wheel'
  | 'plant'
  | 'branch'
  | 'leaf'
  | 'cloud'
  | 'smoke'
  | 'water'
  | 'light'
  | 'text'
  | 'decoration'
  | 'unknown';

export interface MotionSceneNode {
  id: string;
  kind: MotionNodeKind;
  tag: string;
  parentId: string | null;
  depth: number;
  sourceLabel: string;
  semanticHint: SemanticRole;
  confidence: number;
  pivot: PivotHint;
  motionPotential: number;
  recommendedEffects: string[];
  childCount: number;
  graphicsCount: number;
}

export interface SeparationCandidate {
  target: string;
  reason: 'ungrouped-root' | 'dense-group' | 'generic-group' | 'monolithic-path';
  priority: 'low' | 'medium' | 'high';
  note: string;
}

export interface MotionSceneMap {
  version: 1;
  viewBox: string;
  totalGraphics: number;
  groupCount: number;
  motionTargetCount: number;
  namedNodeCount: number;
  semanticNodeCount: number;
  readinessScore: number;
  readinessLabel: 'low' | 'medium' | 'high';
  nodes: MotionSceneNode[];
  separationCandidates: SeparationCandidate[];
  warnings: string[];
}

export interface SemanticPreparationNode {
  id: string;
  label: string;
  role: SemanticRole;
  confidence: number;
  pivot: PivotHint;
  motionPotential: number;
  recommendedEffects: string[];
}

export interface SemanticPreparation {
  version: 1;
  sceneSummary: string;
  nodes: SemanticPreparationNode[];
  separationSuggestions: Array<{
    target: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export interface AppliedSemanticPreparation {
  markup: string;
  map: MotionSceneMap;
  preparation: SemanticPreparation;
  appliedCount: number;
  warnings: string[];
}

const SHAPE_SELECTOR = 'path, circle, ellipse, rect, line, polyline, polygon, text';
const EFFECTS = new Set(['translate', 'rotate', 'scale', 'opacity', 'pulse', 'draw']);
const PIVOTS = new Set<PivotHint>(['center', 'bottom-center', 'top-center', 'left-center', 'right-center']);
const ROLES = new Set<SemanticRole>([
  'background', 'character', 'body', 'head', 'eye', 'arm', 'hand', 'leg', 'foot', 'wing', 'hair', 'cloth',
  'vehicle', 'wheel', 'plant', 'branch', 'leaf', 'cloud', 'smoke', 'water', 'light', 'text', 'decoration', 'unknown',
]);

const ROLE_PATTERNS: Array<{ role: SemanticRole; patterns: RegExp[] }> = [
  { role: 'background', patterns: [/\bbackground\b/i, /\bbg\b/i, /\bbackdrop\b/i, /фон/i] },
  { role: 'eye', patterns: [/\beye\b/i, /\beyes\b/i, /глаз/i] },
  { role: 'head', patterns: [/\bhead\b/i, /\bface\b/i, /голов/i, /лиц/i] },
  { role: 'hand', patterns: [/\bhand\b/i, /\bpalm\b/i, /\bwrist\b/i, /кист/i, /ладон/i] },
  { role: 'arm', patterns: [/\barm\b/i, /\belbow\b/i, /рук/i, /локт/i] },
  { role: 'foot', patterns: [/\bfoot\b/i, /\bfeet\b/i, /\bankle\b/i, /стоп/i, /ступн/i] },
  { role: 'leg', patterns: [/\bleg\b/i, /\bknee\b/i, /ног/i, /колен/i] },
  { role: 'wing', patterns: [/\bwing\b/i, /крыл/i] },
  { role: 'hair', patterns: [/\bhair\b/i, /волос/i] },
  { role: 'cloth', patterns: [/\bcloth\b/i, /\bcoat\b/i, /\bcape\b/i, /\bshirt\b/i, /\bdress\b/i, /\bfabric\b/i, /ткан/i, /одежд/i, /плащ/i] },
  { role: 'wheel', patterns: [/\bwheel\b/i, /\btire\b/i, /колес/i] },
  { role: 'vehicle', patterns: [/\btrain\b/i, /\bcar\b/i, /\bvehicle\b/i, /\bbike\b/i, /\bship\b/i, /поезд/i, /машин/i, /авто/i, /кораб/i] },
  { role: 'branch', patterns: [/\bbranch\b/i, /ветк/i] },
  { role: 'leaf', patterns: [/\bleaf\b/i, /\bleaves\b/i, /лист/i] },
  { role: 'plant', patterns: [/\bplant\b/i, /\btree\b/i, /\bflower\b/i, /раст/i, /дерев/i, /цвет/i] },
  { role: 'cloud', patterns: [/\bcloud\b/i, /облак/i] },
  { role: 'smoke', patterns: [/\bsmoke\b/i, /\bsteam\b/i, /\bfog\b/i, /дым/i, /\bпар\b/i, /туман/i] },
  { role: 'water', patterns: [/\bwater\b/i, /\bwave\b/i, /\bsea\b/i, /\briver\b/i, /вод/i, /волн/i, /мор/i, /рек/i] },
  { role: 'light', patterns: [/\blight\b/i, /\bglow\b/i, /\blamp\b/i, /\bsun\b/i, /свет/i, /ламп/i, /солн/i] },
  { role: 'body', patterns: [/\bbody\b/i, /\btorso\b/i, /тулов/i, /тело/i] },
  { role: 'character', patterns: [/\bcharacter\b/i, /\bperson\b/i, /\bhuman\b/i, /\bbird\b/i, /\banimal\b/i, /персонаж/i, /человек/i, /птиц/i, /живот/i] },
  { role: 'text', patterns: [/\btext\b/i, /\blabel\b/i, /\btitle\b/i, /текст/i, /надпис/i] },
  { role: 'decoration', patterns: [/\bdecor/i, /\bparticle\b/i, /\bspark/i, /\bstar\b/i, /декор/i, /частиц/i, /искр/i] },
];

export function prepareMotionReadySvg(svgMarkup: string): { markup: string; map: MotionSceneMap } {
  const doc = parseSvg(svgMarkup);
  const svg = doc.documentElement as unknown as SVGSVGElement;
  annotateLocalMetadata(svg);
  const markup = new XMLSerializer().serializeToString(svg);
  return { markup, map: analyzeMotionReadySvg(markup) };
}

export function analyzeMotionReadySvg(svgMarkup: string): MotionSceneMap {
  const doc = parseSvg(svgMarkup);
  const svg = doc.documentElement as unknown as SVGSVGElement;
  const groups = Array.from(svg.querySelectorAll<SVGGElement>('g'));
  const shapes = Array.from(svg.querySelectorAll<SVGGraphicsElement>(SHAPE_SELECTOR));
  const nodes: MotionSceneNode[] = [
    ...groups.map((group) => describeNode(group, 'group')),
    ...shapes.map((shape) => describeNode(shape, 'shape')),
  ];
  const separationCandidates = findSeparationCandidates(svg, groups, shapes);
  const namedNodeCount = nodes.filter((node) => Boolean(node.sourceLabel)).length;
  const semanticNodeCount = nodes.filter((node) => node.semanticHint !== 'unknown').length;
  const motionTargetCount = svg.querySelectorAll('[data-animator-motion-target="true"]').length;
  const warnings: string[] = [];

  if (shapes.length > 12 && groups.length === 0) warnings.push('The SVG has many shapes but no groups, so object-level motion may be difficult.');
  if (semanticNodeCount === 0) warnings.push('No semantic labels were inferred from SVG metadata; vision preparation can enrich the map.');
  if (separationCandidates.some((candidate) => candidate.priority === 'high')) {
    warnings.push('At least one element is visually dense or monolithic and may need splitting before articulated motion.');
  }

  const groupingScore = shapes.length ? clamp(groups.length / Math.max(1, Math.ceil(shapes.length / 5)), 0, 1) : 0;
  const namedScore = nodes.length ? namedNodeCount / nodes.length : 0;
  const semanticScore = nodes.length ? semanticNodeCount / nodes.length : 0;
  const separationPenalty = clamp(separationCandidates.filter((candidate) => candidate.priority === 'high').length * 0.09, 0, 0.27);
  const readinessScore = round2(clamp(0.25 + groupingScore * 0.2 + namedScore * 0.2 + semanticScore * 0.25 + (shapes.length ? 0.1 : 0) - separationPenalty, 0, 1));

  return {
    version: 1,
    viewBox: svg.getAttribute('viewBox') || 'unknown',
    totalGraphics: shapes.length,
    groupCount: groups.length,
    motionTargetCount,
    namedNodeCount,
    semanticNodeCount,
    readinessScore,
    readinessLabel: readinessScore >= 0.72 ? 'high' : readinessScore >= 0.46 ? 'medium' : 'low',
    nodes,
    separationCandidates,
    warnings,
  };
}

export function applySemanticPreparation(svgMarkup: string, text: string): AppliedSemanticPreparation {
  const doc = parseSvg(svgMarkup);
  const svg = doc.documentElement as unknown as SVGSVGElement;
  const allowedIds = new Set(Array.from(svg.querySelectorAll<SVGGraphicsElement>('[id]')).map((element) => element.id).filter(Boolean));
  const parsed = parseJsonValue(text);
  const warnings: string[] = [];
  const preparation = normalizePreparation(parsed, allowedIds, warnings);
  let appliedCount = 0;

  for (const node of preparation.nodes) {
    const element = svg.querySelector<SVGGraphicsElement>(`#${CSS.escape(node.id)}`);
    if (!element) continue;
    element.dataset.animatorLabel = node.label;
    element.dataset.animatorRole = node.role;
    element.dataset.animatorConfidence = node.confidence.toFixed(2);
    element.dataset.animatorPivot = node.pivot;
    element.dataset.animatorMotionPotential = node.motionPotential.toFixed(2);
    element.dataset.animatorRecommendedEffects = node.recommendedEffects.join(',');
    element.dataset.animatorSemanticSource = 'ai';
    element.dataset.animatorMotionTarget = 'true';
    appliedCount += 1;
  }

  const markup = new XMLSerializer().serializeToString(svg);
  return {
    markup,
    map: analyzeMotionReadySvg(markup),
    preparation,
    appliedCount,
    warnings,
  };
}

export function compactSceneMap(map: MotionSceneMap, maxNodes = 80): Record<string, unknown> {
  return {
    version: map.version,
    viewBox: map.viewBox,
    readiness: { score: map.readinessScore, label: map.readinessLabel },
    totals: {
      graphics: map.totalGraphics,
      groups: map.groupCount,
      motionTargets: map.motionTargetCount,
      semanticNodes: map.semanticNodeCount,
    },
    nodes: map.nodes.slice(0, maxNodes).map((node) => ({
      id: node.id,
      kind: node.kind,
      tag: node.tag,
      parent: node.parentId,
      depth: node.depth,
      label: node.sourceLabel || null,
      role: node.semanticHint,
      confidence: node.confidence,
      pivot: node.pivot,
      motionPotential: node.motionPotential,
      effects: node.recommendedEffects,
      graphicsCount: node.graphicsCount,
    })),
    separationCandidates: map.separationCandidates.slice(0, 16),
  };
}

function annotateLocalMetadata(svg: SVGSVGElement): void {
  const groups = Array.from(svg.querySelectorAll<SVGGElement>('g'));
  groups.forEach((group, index) => {
    if (!group.id) group.id = `animator-group-${index + 1}`;
    group.dataset.animatorGroup = 'true';
    group.dataset.animatorMotionTarget = 'true';
    annotateElement(group);
  });

  const shapes = Array.from(svg.querySelectorAll<SVGGraphicsElement>(SHAPE_SELECTOR));
  shapes.forEach((shape) => {
    shape.dataset.animatorMotionTarget = 'true';
    annotateElement(shape);
  });
}

function annotateElement(element: SVGGraphicsElement): void {
  const existingRole = normalizeRole(element.dataset.animatorRole);
  const sourceLabel = humanLabel(element);
  const role = existingRole !== 'unknown' ? existingRole : inferRole(sourceLabel);
  const confidence = existingRole !== 'unknown'
    ? clamp(Number.parseFloat(element.dataset.animatorConfidence || '0.95') || 0.95, 0, 1)
    : role === 'unknown' ? 0 : 0.86;
  const pivot = normalizePivot(element.dataset.animatorPivot) ?? inferPivot(role, sourceLabel);
  const motionPotential = clamp(Number.parseFloat(element.dataset.animatorMotionPotential || '') || roleMotionPotential(role), 0, 1);
  const effects = recommendedEffects(role, element.tagName.toLowerCase());

  if (sourceLabel) element.dataset.animatorLabel = element.dataset.animatorLabel || sourceLabel;
  element.dataset.animatorRole = role;
  element.dataset.animatorConfidence = confidence.toFixed(2);
  element.dataset.animatorPivot = pivot;
  element.dataset.animatorMotionPotential = motionPotential.toFixed(2);
  element.dataset.animatorRecommendedEffects = effects.join(',');
  element.dataset.animatorSemanticSource = element.dataset.animatorSemanticSource || (role === 'unknown' ? 'none' : 'svg');
}

function describeNode(element: SVGGraphicsElement, kind: MotionNodeKind): MotionSceneNode {
  const sourceLabel = element.dataset.animatorLabel || humanLabel(element);
  const existingRole = normalizeRole(element.dataset.animatorRole);
  const role = existingRole !== 'unknown' ? existingRole : inferRole(sourceLabel);
  const confidence = clamp(Number.parseFloat(element.dataset.animatorConfidence || '') || (role === 'unknown' ? 0 : 0.7), 0, 1);
  const pivot = normalizePivot(element.dataset.animatorPivot) ?? inferPivot(role, sourceLabel);
  const motionPotential = clamp(Number.parseFloat(element.dataset.animatorMotionPotential || '') || roleMotionPotential(role), 0, 1);
  const graphicsCount = kind === 'group' ? element.querySelectorAll(SHAPE_SELECTOR).length : 1;
  const childCount = kind === 'group' ? element.children.length : 0;
  const effects = (element.dataset.animatorRecommendedEffects || '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => EFFECTS.has(value));

  return {
    id: element.id,
    kind,
    tag: element.tagName.toLowerCase(),
    parentId: nearestParentId(element),
    depth: nodeDepth(element),
    sourceLabel,
    semanticHint: role,
    confidence: round2(confidence),
    pivot,
    motionPotential: round2(motionPotential),
    recommendedEffects: effects.length ? effects : recommendedEffects(role, element.tagName.toLowerCase()),
    childCount,
    graphicsCount,
  };
}

function findSeparationCandidates(
  svg: SVGSVGElement,
  groups: SVGGElement[],
  shapes: SVGGraphicsElement[],
): SeparationCandidate[] {
  const candidates: SeparationCandidate[] = [];
  const directRootShapes = shapes.filter((shape) => shape.parentNode === svg);

  if (directRootShapes.length >= 6) {
    candidates.push({
      target: '#svg-root',
      reason: 'ungrouped-root',
      priority: directRootShapes.length >= 12 ? 'high' : 'medium',
      note: `${directRootShapes.length} graphic nodes sit directly under the SVG root; logical grouping would improve object-level animation.`,
    });
  }

  for (const group of groups) {
    const graphicsCount = group.querySelectorAll(SHAPE_SELECTOR).length;
    const nestedGroups = group.querySelectorAll('g').length;
    const role = normalizeRole(group.dataset.animatorRole);
    if (graphicsCount >= 10 && nestedGroups === 0) {
      candidates.push({
        target: `#${group.id}`,
        reason: 'dense-group',
        priority: graphicsCount >= 18 ? 'high' : 'medium',
        note: `${graphicsCount} shapes share one flat group; articulated parts may need subgroups.`,
      });
    } else if (graphicsCount >= 6 && role === 'unknown') {
      candidates.push({
        target: `#${group.id}`,
        reason: 'generic-group',
        priority: 'low',
        note: 'This group has several shapes but no semantic label. Vision preparation can decide whether it represents one object or multiple parts.',
      });
    }
  }

  for (const shape of shapes) {
    if (shape.tagName.toLowerCase() !== 'path') continue;
    const pathLength = shape.getAttribute('d')?.length || 0;
    if (pathLength < 1800) continue;
    candidates.push({
      target: `#${shape.id}`,
      reason: 'monolithic-path',
      priority: pathLength >= 4500 ? 'high' : 'medium',
      note: 'A very complex path cannot be safely separated into joints or objects deterministically. If it contains multiple moving parts, vector regeneration or manual splitting is recommended.',
    });
  }

  return candidates.slice(0, 24);
}

function normalizePreparation(value: unknown, allowedIds: Set<string>, warnings: string[]): SemanticPreparation {
  const record = isRecord(value) ? value : {};
  const nodesValue = Array.isArray(record.nodes) ? record.nodes : [];
  const nodes: SemanticPreparationNode[] = [];

  nodesValue.slice(0, 120).forEach((value, index) => {
    if (!isRecord(value)) {
      warnings.push(`Semantic node ${index + 1}: not an object.`);
      return;
    }
    const rawId = safeString(value.id || value.target).replace(/^#/, '');
    if (!rawId || !allowedIds.has(rawId)) {
      warnings.push(`Semantic node ${index + 1}: unknown target ${rawId || '(empty)'}.`);
      return;
    }
    const role = normalizeRole(safeString(value.role || value.semanticRole));
    const label = safeString(value.label || value.name || role).slice(0, 80) || role;
    const confidence = clampNumber(value.confidence, 0, 1, role === 'unknown' ? 0.35 : 0.75);
    const pivot = normalizePivot(safeString(value.pivot || value.anchor)) ?? inferPivot(role, label);
    const motionPotential = clampNumber(value.motionPotential ?? value.animationPotential, 0, 1, roleMotionPotential(role));
    const recommended = Array.isArray(value.recommendedEffects)
      ? value.recommendedEffects.map(safeString).map((effect) => effect.toLowerCase()).filter((effect) => EFFECTS.has(effect)).slice(0, 5)
      : recommendedEffects(role, '');

    nodes.push({
      id: rawId,
      label,
      role,
      confidence: round2(confidence),
      pivot,
      motionPotential: round2(motionPotential),
      recommendedEffects: recommended.length ? recommended : recommendedEffects(role, ''),
    });
  });

  const separationValue = Array.isArray(record.separationSuggestions) ? record.separationSuggestions : [];
  const separationSuggestions: SemanticPreparation['separationSuggestions'] = separationValue.slice(0, 24).flatMap((value) => {
    if (!isRecord(value)) return [];
    const rawTarget = safeString(value.target || value.id);
    const target = rawTarget.startsWith('#') ? rawTarget : rawTarget ? `#${rawTarget}` : '';
    const id = target.replace(/^#/, '');
    if (!target || (id !== 'svg-root' && !allowedIds.has(id))) return [];
    const priorityRaw = safeString(value.priority).toLowerCase();
    const priority: 'low' | 'medium' | 'high' = priorityRaw === 'high' || priorityRaw === 'low' ? priorityRaw : 'medium';
    return [{ target, reason: safeString(value.reason || value.note).slice(0, 280), priority }];
  });

  return {
    version: 1,
    sceneSummary: safeString(record.sceneSummary || record.summary).slice(0, 500),
    nodes,
    separationSuggestions,
  };
}

function humanLabel(element: Element): string {
  const title = element.querySelector(':scope > title')?.textContent?.trim() || '';
  const values = [
    element.getAttribute('aria-label') || '',
    element.getAttribute('data-name') || '',
    element.getAttribute('inkscape:label') || '',
    title,
    element.id || '',
    element.getAttribute('class') || '',
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => !/^animator-(?:node|group)-\d+$/.test(value));
  return values.join(' ').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}

function inferRole(label: string): SemanticRole {
  if (!label) return 'unknown';
  for (const entry of ROLE_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(label))) return entry.role;
  }
  return 'unknown';
}

function normalizeRole(value: string | undefined): SemanticRole {
  if (!value) return 'unknown';
  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, '-');
  if (ROLES.has(normalized as SemanticRole)) return normalized as SemanticRole;
  if (normalized === 'person' || normalized === 'animal' || normalized === 'subject') return 'character';
  if (normalized === 'torso') return 'body';
  if (normalized === 'fabric' || normalized === 'coat' || normalized === 'cape') return 'cloth';
  if (normalized === 'steam' || normalized === 'fog') return 'smoke';
  if (normalized === 'tree' || normalized === 'flower') return 'plant';
  return 'unknown';
}

function inferPivot(role: SemanticRole, label: string): PivotHint {
  const lower = label.toLowerCase();
  if (role === 'hair' || role === 'cloth') return 'top-center';
  if (role === 'body' || role === 'character' || role === 'plant' || role === 'branch' || role === 'leg') return 'bottom-center';
  if (role === 'arm' || role === 'hand' || role === 'wing') {
    if (/\bleft\b|лев/i.test(lower)) return 'right-center';
    if (/\bright\b|прав/i.test(lower)) return 'left-center';
  }
  return 'center';
}

function normalizePivot(value: string | undefined): PivotHint | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/[\s_]+/g, '-');
  return PIVOTS.has(normalized as PivotHint) ? normalized as PivotHint : null;
}

function roleMotionPotential(role: SemanticRole): number {
  if (['eye', 'arm', 'hand', 'leg', 'foot', 'wing', 'hair', 'cloth', 'wheel', 'branch', 'leaf', 'cloud', 'smoke', 'water', 'light'].includes(role)) return 0.9;
  if (['character', 'body', 'head', 'vehicle', 'plant'].includes(role)) return 0.78;
  if (role === 'background' || role === 'text') return 0.2;
  if (role === 'decoration') return 0.45;
  return 0.5;
}

function recommendedEffects(role: SemanticRole, tag: string): string[] {
  if (role === 'eye') return ['opacity', 'scale'];
  if (role === 'wheel') return ['rotate', 'translate'];
  if (['arm', 'hand', 'leg', 'foot', 'wing', 'branch', 'leaf', 'hair', 'cloth'].includes(role)) return ['rotate', 'translate'];
  if (['cloud', 'smoke', 'water'].includes(role)) return ['translate', 'opacity'];
  if (role === 'light') return ['pulse', 'opacity', 'scale'];
  if (['character', 'body', 'head', 'vehicle', 'plant'].includes(role)) return ['translate', 'rotate', 'scale'];
  if (role === 'background') return ['translate', 'opacity'];
  if (tag === 'path') return ['translate', 'rotate', 'opacity', 'draw'];
  return ['translate', 'rotate', 'scale', 'opacity'];
}

function nearestParentId(element: Element): string | null {
  let parent = element.parentElement;
  while (parent && parent.tagName.toLowerCase() !== 'svg') {
    if (parent.id) return parent.id;
    parent = parent.parentElement;
  }
  return null;
}

function nodeDepth(element: Element): number {
  let depth = 0;
  let parent = element.parentElement;
  while (parent && parent.tagName.toLowerCase() !== 'svg') {
    depth += 1;
    parent = parent.parentElement;
  }
  return depth;
}

function parseSvg(markup: string): XMLDocument {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName.toLowerCase() !== 'svg') {
    throw new Error('invalid-svg');
  }
  return doc;
}

function parseJsonValue(text: string): unknown {
  const candidates = [text.trim()];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  if (fenced) candidates.unshift(fenced);
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(text.slice(firstBrace, lastBrace + 1));
  for (const candidate of candidates) {
    try { return JSON.parse(candidate); } catch { /* try next */ }
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
