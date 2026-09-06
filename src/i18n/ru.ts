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
  ai: {
    section: '05 · AI MOTION DIRECTOR',
    model: 'Бесплатная модель',
    prompt: 'Опиши анимацию',
    promptPlaceholder: 'Например: главный персонаж слегка дышит и моргает, а второстепенные элементы очень мягко покачиваются…',
    autoHint: 'Оставь поле пустым для автоматической анимации. По умолчанию ИИ должен оживлять только ключевые элементы.',
    generate: 'Создать Motion Plan',
    generating: 'Продумываем движение…',
    planTitle: 'Motion Plan',
    noModels: 'Список бесплатных моделей недоступен; backend использует маршрут по умолчанию.',
    fallback: 'использован резерв'
  },
  status: {
    cleaning: 'Очищаем SVG…',
    animating: 'Анимируем…',
    ready: 'Готово',
    exported: 'HTML экспортирован',
    loaded: 'SVG загружен',
    aiReady: 'AI Motion Plan готов'
  },
  errors: {
    invalidSvg: 'Введённая разметка не является корректным SVG.',
    emptySvg: 'Сначала вставь или загрузи SVG.',
    readFile: 'Не удалось прочитать SVG-файл.',
    aiUnavailable: 'AI-планирование движения временно недоступно.',
    aiNeedsSvg: 'Сначала примени SVG, а затем попроси ИИ построить Motion Plan.'
  },
  footer: { note: 'Static Animator + AI Motion routing' }
} satisfies TranslationSchema;