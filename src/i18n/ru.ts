import type { TranslationSchema } from './types';

export const ru = {
  app: {
    name: 'AI SVG Animator',
    tagline: 'Превращает идеи в живые векторы.',
    lab: 'VECTOR LABORATORY',
    studio: 'MOTION STUDIO'
  },
  language: { english: 'English', russian: 'Русский' },
  input: {
    section: '01 · SVG НА ВХОДЕ',
    svgLabel: 'Вставь SVG',
    svgHint: 'Скрипты и небезопасная разметка удаляются до превью.',
    uploadSvg: 'Загрузить SVG',
    loadSample: 'Загрузить пример',
    placeholder: '<svg viewBox="0 0 400 400">…</svg>'
  },
  workspace: {
    section: '02 · ЖИВОЙ ХОЛСТ',
    emptyTitle: 'Ждём вектор',
    emptyBody: 'Вставь SVG, загрузи файл или открой пример.',
    cleanBadge: 'ОЧИЩЕННЫЙ SVG'
  },
  actions: {
    applySvg: 'Применить SVG',
    animate: 'Анимировать',
    replay: 'Повторить',
    exportHtml: 'Экспорт HTML',
    downloadSvg: 'Скачать SVG',
    reset: 'Сбросить'
  },
  presets: {
    section: '03 · ПРЕСЕТ ДВИЖЕНИЯ',
    reveal: 'Появление',
    revealDesc: 'Плавное появление, масштаб и stagger.',
    draw: 'Прорисовка',
    drawDesc: 'Обводка геометрии с возвратом заливки.',
    float: 'Парение',
    floatDesc: 'Мягкий подъём и вращение по циклу.'
  },
  controls: {
    section: '04 · НАСТРОЙКИ ДВИЖЕНИЯ',
    duration: 'Длительность',
    intensity: 'Интенсивность',
    loop: 'Цикл'
  },
  status: {
    cleaning: 'Очищаем SVG…',
    animating: 'Анимируем…',
    ready: 'Готово',
    exported: 'HTML экспортирован',
    loaded: 'SVG загружен'
  },
  errors: {
    invalidSvg: 'Введённая разметка не является корректным SVG.',
    emptySvg: 'Сначала вставь или загрузи SVG.',
    readFile: 'Не удалось прочитать SVG-файл.'
  },
  footer: { note: 'Static Animator · Milestone 1' }
} satisfies TranslationSchema;
