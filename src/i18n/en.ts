import type { TranslationSchema } from './types';

export const en = {
  app: {
    name: 'AI SVG Animator',
    tagline: 'Turn ideas into living vectors.'
  },
  language: {
    english: 'English',
    russian: 'Russian'
  },
  input: {
    promptLabel: 'Prompt',
    promptPlaceholder: 'Describe the vector you want to create…',
    svgLabel: 'SVG',
    uploadSvg: 'Upload SVG'
  },
  actions: {
    generate: 'Generate SVG',
    animate: 'Animate',
    exportHtml: 'Export HTML',
    downloadSvg: 'Download SVG',
    reset: 'Reset'
  },
  presets: {
    reveal: 'Reveal',
    draw: 'Draw',
    float: 'Float'
  },
  controls: {
    duration: 'Duration',
    intensity: 'Intensity',
    loop: 'Loop'
  },
  status: {
    generating: 'Generating SVG…',
    normalizing: 'Cleaning SVG…',
    animating: 'Animating…',
    ready: 'Ready'
  },
  errors: {
    invalidSvg: 'This SVG could not be validated.',
    generationFailed: 'SVG generation failed. Please try again.',
    network: 'Network error. Please try again.'
  }
} satisfies TranslationSchema;
