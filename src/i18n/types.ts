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
  status: { cleaning: string; animating: string; ready: string; exported: string; loaded: string };
  errors: { invalidSvg: string; emptySvg: string; readFile: string };
  footer: { note: string };
}
