export type Locale = 'en' | 'ru';

export interface TranslationSchema {
  app: {
    name: string;
    tagline: string;
  };
  language: {
    english: string;
    russian: string;
  };
  input: {
    promptLabel: string;
    promptPlaceholder: string;
    svgLabel: string;
    uploadSvg: string;
  };
  actions: {
    generate: string;
    animate: string;
    exportHtml: string;
    downloadSvg: string;
    reset: string;
  };
  presets: {
    reveal: string;
    draw: string;
    float: string;
  };
  controls: {
    duration: string;
    intensity: string;
    loop: string;
  };
  status: {
    generating: string;
    normalizing: string;
    animating: string;
    ready: string;
  };
  errors: {
    invalidSvg: string;
    generationFailed: string;
    network: string;
  };
}
