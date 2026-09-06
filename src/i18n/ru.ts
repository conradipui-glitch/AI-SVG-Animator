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
  readiness: {
    section: '05 · ПОДГОТОВКА К ДВИЖЕНИЮ',
    score: 'Готовность',
    groups: 'Группы',
    semantic: 'Семантика',
    splitCandidates: 'Нужно разделить',
    analyze: 'Разобрать части с AI',
    analyzing: 'AI анализирует части…',
    enriched: 'Карта дополнена AI',
    detected: 'Распознано',
    separationTitle: 'Что стоит разделить',
    noSeparation: 'Явного структурного разделения не требуется.',
    low: 'Низкая',
    medium: 'Средняя',
    high: 'Высокая'
  },
  ai: {
    section: '06 · AI MOTION DIRECTOR',
    model: 'Бесплатная модель',
    prompt: 'Опиши анимацию',
    promptPlaceholder: 'Например: главный персонаж слегка дышит и моргает, а второстепенные элементы очень мягко покачиваются…',
    autoHint: 'Пустой запрос = автоматическая анимация ключевых элементов. ИИ получает структуру SVG и визуальный рендер.',
    generate: '✨ Анимировать с AI',
    generating: 'ИИ создаёт анимацию…',
    suggestVariants: 'Предложить 3 варианта',
    generatingVariants: 'ИИ готовит варианты…',
    variantsTitle: 'Варианты анимации',
    applyVariant: 'Применить',
    activeVariant: 'Выбран',
    technicalDetails: 'Технические детали',
    rawResponse: 'Ответ модели',
    noModels: 'Список бесплатных моделей недоступен; backend использует маршрут по умолчанию.',
    fallback: 'использован резерв',
    partial: 'частично применено'
  },
  status: {
    cleaning: 'Очищаем SVG…',
    animating: 'Анимируем…',
    ready: 'Готово',
    exported: 'HTML экспортирован',
    loaded: 'SVG загружен',
    motionPreparing: 'AI сопоставляет объекты, части и точки вращения…',
    motionPrepared: 'Семантическая карта движения применена',
    aiPreparing: 'Готовим SVG и визуальный рендер…',
    aiRequesting: 'ИИ анализирует сцену и строит движение…',
    aiValidating: 'Проверяем Motion Spec…',
    aiApplying: 'Применяем анимацию…',
    aiReady: 'AI-анимация применена',
    variantsReady: 'Варианты готовы — выбери один'
  },
  errors: {
    invalidSvg: 'Введённая разметка не является корректным SVG.',
    emptySvg: 'Сначала вставь или загрузи SVG.',
    readFile: 'Не удалось прочитать SVG-файл.',
    aiUnavailable: 'AI-анимация сейчас недоступна.',
    aiNeedsSvg: 'Сначала примени SVG, а затем запусти AI-анимацию.',
    aiInvalidSpec: 'Модель ответила, но не удалось получить исполняемую анимацию.',
    aiNoVariants: 'Модель не вернула ни одного пригодного варианта анимации.',
    motionPreparationEmpty: 'AI ответил, но не смог дополнить ни одного существующего узла SVG.'
  },
  footer: { note: 'Motion-Ready SVG + AI Motion Director' }
} satisfies TranslationSchema;