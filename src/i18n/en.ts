import type { TranslationSchema } from './types';

export const en = {
  app: {
    name: 'AI SVG Animator',
    tagline: 'Turn ideas into living vectors.',
    lab: 'VECTOR LABORATORY',
    studio: 'MOTION STUDIO'
  },
  language: { english: 'English', russian: 'Russian' },
  input: {
    section: '01 · SVG INPUT',
    svgLabel: 'Paste SVG',
    svgHint: 'Scripts and unsafe markup are removed before preview.',
    uploadSvg: 'Upload SVG',
    loadSample: 'Load sample',
    placeholder: '<svg viewBox="0 0 400 400">…</svg>'
  },
  workspace: {
    section: '02 · LIVE CANVAS',
    emptyTitle: 'Waiting for a vector',
    emptyBody: 'Paste an SVG, upload a file, or load the sample.',
    cleanBadge: 'SANITIZED SVG'
  },
  actions: {
    applySvg: 'Apply SVG',
    animate: 'Animate',
    replay: 'Replay',
    exportHtml: 'Export HTML',
    downloadSvg: 'Download SVG',
    reset: 'Reset'
  },
  presets: {
    section: '03 · MOTION PRESET',
    reveal: 'Reveal',
    revealDesc: 'Fade, scale and stagger into view.',
    draw: 'Draw',
    drawDesc: 'Trace vector geometry, then restore fills.',
    float: 'Float',
    floatDesc: 'Add subtle looping lift and rotation.'
  },
  controls: {
    section: '04 · MOTION CONTROLS',
    duration: 'Duration',
    intensity: 'Intensity',
    loop: 'Loop'
  },
  readiness: {
    section: '05 · MOTION-READY MAP',
    score: 'Ready score',
    groups: 'Groups',
    semantic: 'Semantic nodes',
    splitCandidates: 'Needs splitting',
    analyze: 'Analyze parts with AI',
    analyzing: 'Analyzing parts…',
    enriched: 'AI-enriched map',
    detected: 'Detected parts',
    separationTitle: 'Needs separation',
    noSeparation: 'No obvious structural split is required.',
    low: 'Low',
    medium: 'Medium',
    high: 'High'
  },
  ai: {
    section: '06 · AI MOTION DIRECTOR',
    model: 'Free model',
    prompt: 'Describe the animation',
    promptPlaceholder: 'e.g. Make the main character breathe subtly, blink, and let the secondary shapes drift very gently…',
    autoHint: 'Empty prompt = automatic motion for key elements. AI receives both SVG structure and a visual render.',
    generate: '✨ Animate with AI',
    generating: 'AI is creating motion…',
    suggestVariants: 'Suggest 3 variants',
    generatingVariants: 'AI is preparing variants…',
    variantsTitle: 'Animation variants',
    applyVariant: 'Apply',
    activeVariant: 'Selected',
    technicalDetails: 'Technical details',
    rawResponse: 'Model response',
    noModels: 'Free-model list is unavailable; the backend will use its default route.',
    fallback: 'fallback used',
    partial: 'partially applied'
  },
  status: {
    cleaning: 'Cleaning SVG…',
    animating: 'Animating…',
    ready: 'Ready',
    exported: 'HTML exported',
    loaded: 'SVG loaded',
    motionPreparing: 'AI is mapping objects, joints and pivots…',
    motionPrepared: 'Motion-ready semantic map applied',
    aiPreparing: 'Preparing SVG and visual render…',
    aiRequesting: 'AI is analyzing the scene and planning motion…',
    aiValidating: 'Validating Motion Spec…',
    aiApplying: 'Applying animation…',
    aiReady: 'AI animation applied',
    variantsReady: 'Variants are ready — choose one'
  },
  errors: {
    invalidSvg: 'The input is not a valid SVG.',
    emptySvg: 'Paste or upload an SVG first.',
    readFile: 'Could not read this SVG file.',
    aiUnavailable: 'AI animation is currently unavailable.',
    aiNeedsSvg: 'Apply an SVG before running AI animation.',
    aiInvalidSpec: 'The model responded, but no executable animation could be produced.',
    aiNoVariants: 'The model did not return any usable animation variants.',
    motionPreparationEmpty: 'AI responded, but no existing SVG nodes could be enriched.'
  },
  footer: { note: 'Motion-Ready SVG + AI Motion Director' }
} satisfies TranslationSchema;