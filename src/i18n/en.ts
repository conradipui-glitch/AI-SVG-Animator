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
  ai: {
    section: '05 · AI MOTION DIRECTOR',
    model: 'Free model',
    prompt: 'Describe the animation',
    promptPlaceholder: 'e.g. Make the main character breathe subtly, blink, and let the secondary shapes drift very gently…',
    autoHint: 'Leave the prompt empty for automatic motion. The AI is instructed to animate only key elements by default.',
    generate: 'Generate Motion Plan',
    generating: 'Planning motion…',
    planTitle: 'Motion Plan',
    noModels: 'Free-model list is unavailable; the backend will use its default route.',
    fallback: 'fallback used'
  },
  status: {
    cleaning: 'Cleaning SVG…',
    animating: 'Animating…',
    ready: 'Ready',
    exported: 'HTML exported',
    loaded: 'SVG loaded',
    aiReady: 'AI motion plan ready'
  },
  errors: {
    invalidSvg: 'The input is not a valid SVG.',
    emptySvg: 'Paste or upload an SVG first.',
    readFile: 'Could not read this SVG file.',
    aiUnavailable: 'AI motion planning is temporarily unavailable.',
    aiNeedsSvg: 'Apply an SVG before asking AI for a motion plan.'
  },
  footer: { note: 'Static Animator + AI Motion routing' }
} satisfies TranslationSchema;