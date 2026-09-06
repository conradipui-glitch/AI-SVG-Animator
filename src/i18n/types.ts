export type Locale = 'en' | 'ru';

export interface TranslationSchema {
  app: { name: string; tagline: string; lab: string; studio: string };
  language: { english: string; russian: string };
  input: {
    section: string;
    svgLabel: string;
    svgHint: string;
    uploadSvg: string;
    loadSample: string;
    placeholder: string;
  };
  workspace: {
    section: string;
    emptyTitle: string;
    emptyBody: string;
    cleanBadge: string;
  };
  actions: {
    applySvg: string;
    animate: string;
    replay: string;
    exportHtml: string;
    downloadSvg: string;
    reset: string;
  };
  presets: {
    section: string;
    reveal: string;
    revealDesc: string;
    draw: string;
    drawDesc: string;
    float: string;
    floatDesc: string;
  };
  controls: { section: string; duration: string; intensity: string; loop: string };
  readiness: {
    section: string;
    score: string;
    groups: string;
    semantic: string;
    splitCandidates: string;
    analyze: string;
    analyzing: string;
    enriched: string;
    detected: string;
    separationTitle: string;
    noSeparation: string;
    low: string;
    medium: string;
    high: string;
  };
  ai: {
    section: string;
    model: string;
    prompt: string;
    promptPlaceholder: string;
    autoHint: string;
    generate: string;
    generating: string;
    suggestVariants: string;
    generatingVariants: string;
    variantsTitle: string;
    applyVariant: string;
    activeVariant: string;
    technicalDetails: string;
    rawResponse: string;
    noModels: string;
    fallback: string;
    partial: string;
  };
  status: {
    cleaning: string;
    animating: string;
    ready: string;
    exported: string;
    loaded: string;
    motionPreparing: string;
    motionPrepared: string;
    aiPreparing: string;
    aiRequesting: string;
    aiValidating: string;
    aiApplying: string;
    aiReady: string;
    variantsReady: string;
  };
  errors: {
    invalidSvg: string;
    emptySvg: string;
    readFile: string;
    aiUnavailable: string;
    aiNeedsSvg: string;
    aiInvalidSpec: string;
    aiNoVariants: string;
    motionPreparationEmpty: string;
  };
  footer: { note: string };
}