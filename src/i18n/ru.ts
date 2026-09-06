import type { TranslationSchema } from './types';

export const ru = {
  app: {
    name: 'AI SVG Animator',
    tagline: 'Превращает идеи в живые векторы.'
  },
  language: {
    english: 'English',
    russian: 'Русский'
  },
  input: {
    promptLabel: 'Промпт',
    promptPlaceholder: 'Опишите вектор, который хотите создать…',
    svgLabel: 'SVG',
    uploadSvg: 'Загрузить SVG'
  },
  actions: {
    generate: 'Создать SVG',
    animate: 'Анимировать',
    exportHtml: 'Экспорт HTML',
    downloadSvg: 'Скачать SVG',
    reset: 'Сбросить'
  },
  presets: {
    reveal: 'Проявление',
    draw: 'Прорисовка',
    float: 'Парение'
  },
  controls: {
    duration: 'Длительность',
    intensity: 'Интенсивность',
    loop: 'Цикл'
  },
  status: {
    generating: 'Генерируем SVG…',
    normalizing: 'Очищаем SVG…',
    animating: 'Анимируем…',
    ready: 'Готово'
  },
  errors: {
    invalidSvg: 'Не удалось проверить этот SVG.',
    generationFailed: 'Не удалось создать SVG. Попробуйте ещё раз.',
    network: 'Ошибка сети. Попробуйте ещё раз.'
  }
} satisfies TranslationSchema;
