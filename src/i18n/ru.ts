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
    analyze: '1 · Разобрать части с AI',
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
    promptPlaceholder: 'Например: персонаж делает колесо, затем фиксируется в йога-асане; руки и ноги двигаются по суставам…',
    autoHint: 'Подготовка частей — это анализ, а не сама анимация. Здесь опиши движение. Пустой запрос = автоматическая анимация ключевых элементов.',
    generate: '2 · ✨ Создать и запустить анимацию',
    generating: 'ИИ создаёт анимацию…',
    suggestVariants: '2 · Создать 3 варианта и запустить',
    generatingVariants: 'ИИ готовит варианты…',
    variantsTitle: 'Варианты анимации',
    applyVariant: 'Показать на холсте',
    activeVariant: 'Сейчас играет',
    technicalDetails: 'Технические детали',
    rawResponse: 'Сырой ответ модели',
    noModels: 'Список бесплатных моделей недоступен; backend использует маршрут по умолчанию.',
    fallback: 'использован резерв',
    partial: 'частично применено',
    waitHint: 'Запрос отправлен. Обычно это занимает от нескольких секунд до минуты; после ответа результат запустится на холсте автоматически.',
    resultTitle: 'РЕЗУЛЬТАТ AI',
    motionPlaying: 'AI-анимация уже играет на холсте',
    variantsPlaying: 'Варианты готовы — один уже запущен',
    resultHint: 'Нажми другой вариант — холст переключится сразу.',
    semanticReady: 'Части распознаны — это ещё не анимация',
    semanticReadyHint: 'Теперь опиши движение в AI Motion Director и нажми кнопку создания анимации.'
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
    variantsReady: 'Варианты готовы; выбранный вариант уже играет'
  },
  errors: {
    invalidSvg: 'Введённая разметка не является корректным SVG.',
    emptySvg: 'Сначала вставь или загрузи SVG.',
    readFile: 'Не удалось прочитать SVG-файл.',
    aiUnavailable: 'AI-анимация сейчас недоступна.',
    aiNeedsSvg: 'Сначала примени SVG, а затем запусти AI-анимацию.',
    aiInvalidSpec: 'Модель ответила, но не удалось получить исполняемую анимацию.',
    aiNoVariants: 'Модель ответила, но ни один вариант не удалось превратить в исполняемую анимацию.',
    motionPreparationEmpty: 'AI ответил, но не смог дополнить ни одного существующего узла SVG.'
  },
  footer: { note: 'Motion-Ready SVG + AI Motion Director' }
} satisfies TranslationSchema;