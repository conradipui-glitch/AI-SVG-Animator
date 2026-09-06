<p align="right"><a href="./README.md"><strong>English</strong></a></p>

<p align="center">
  <img src="./assets/hero-ru.svg" alt="AI SVG Animator hero" width="100%" />
</p>

<h1 align="center">AI SVG Animator</h1>
<p align="center"><strong>Превращает идеи в живые векторы.</strong></p>
<p align="center">SVG → AI Motion → Веб · Визуальный + структурный анализ · Автоварианты</p>

<p align="center">
  <a href="https://ai-svg-animator.conradipui.workers.dev"><strong>Открыть приложение</strong></a> ·
  <a href="./docs/PRODUCT_PLAN.md">План продукта</a> ·
  <a href="./docs/MILESTONE_2_1.md">Milestone 2.1</a> ·
  <a href="./docs/MOTION_SPEC.md">Motion Spec</a> ·
  <a href="./docs/MODEL_ROUTING.md">Маршрутизация моделей</a>
</p>

## Текущий билд

**Static Animator завершён, а Milestone 2.1 AI Motion сейчас находится в состоянии production candidate.**

Живое приложение уже умеет:

- вставлять SVG-код или загружать `.svg`;
- удалять небезопасную разметку через DOMPurify;
- нормализовать `viewBox` и назначать стабильные animation targets;
- показывать результат на живом холсте;
- применять deterministic presets **Reveal / Draw / Float**;
- настраивать длительность, интенсивность и цикл;
- переключать весь UI **RU / EN** без потери текущей работы;
- выбирать доступную бесплатную модель B.AI;
- описывать движение естественным языком и один раз нажимать **«✨ Анимировать с AI»**;
- использовать пустой промпт для автоматической умеренной анимации;
- рендерить SVG в PNG и передавать визуальный образ мультимодальной модели, когда она это поддерживает;
- передавать одновременно структурный контекст SVG: target IDs, иерархию, стили и фрагменты геометрии;
- валидировать возвращённый **Motion Spec v1** по реальным ID текущего SVG;
- сохранять рабочие tracks, даже если часть AI-ответа некорректна;
- автоматически запускать корректную AI-анимацию через GSAP без второй кнопки применения;
- генерировать три автоматических направления: **Subtle / Natural / Expressive**;
- применять выбранный вариант прямо из его карточки;
- показывать provider/model/validation diagnostics в раскрываемом блоке **«Технические детали»**;
- скачивать нормализованный SVG;
- экспортировать текущую preset- или AI-анимацию в автономный HTML.

### Статус production AI

Автоматические production smoke-tests сейчас проходят на:

`https://ai-svg-animator.conradipui.workers.dev`

- B.AI health / model discovery: OK;
- `glm-5.3-flash` motion generation: HTTP 200, получен валидный Motion Spec;
- генерация трёх auto variants: HTTP 200, получены Subtle / Natural / Expressive;
- provider keys остаются только на серверной стороне в Cloudflare Worker Secrets.

Перед окончательным закрытием Milestone 2.1 остаётся авторский browser QA на нескольких реальных SVG. Подробности: [`docs/MILESTONE_2_1.md`](./docs/MILESTONE_2_1.md).

## Как это работает

<p align="center">
  <img src="./assets/pipeline-ru.svg" alt="AI SVG Animator pipeline" width="100%" />
</p>

```text
SVG на входе
   │
   ▼
DOMPurify sanitizer
   │
   ▼
SVG normalizer + стабильные animation targets
   │
   ├──────── deterministic presets ───────────────┐
   │                                               │
   ├──► PNG-рендер для визуального анализа         │
   │                                               │
   └──► структура SVG / IDs / геометрия            │
                │                                  │
                ▼                                  │
       мультимодальная модель B.AI                 │
       + резерв Cloudflare                         │
                │                                  │
                ├──► один Motion Spec              │
                └──► 3 auto variants               │
                │                                  │
                ▼                                  │
      allowlist + clamps + validation              │
                │                                  │
                └────────► GSAP renderer ◄─────────┘
                                 │
                                 ▼
                           Живое превью
                                 │
                                 ▼
                         автономный HTML
```

## Зачем нужен этот проект

Анимированный SVG находится в неудобной промежуточной зоне: AI-генераторы обычно заканчиваются на растре, дизайн-инструменты умеют экспортировать вектор, но плохо автоматизируют motion, а полноценные motion-пакеты избыточны для быстрой продуктовой работы.

AI SVG Animator строит более короткий путь:

> **Опиши или принеси вектор → оживи его → отправь в веб.**

Долгосрочная цель — **AI Motion Director**, который понимает сцену по смыслу, готовит изображение к движению, предлагает несколько сценариев и в дальнейшем сможет перестраивать векторную геометрию, если исходник плохо подготовлен к анимации.

## Маршрутизация AI

Во время разработки MVP Worker предпочитает актуальные бесплатные маршруты B.AI, а Cloudflare Workers AI держит как резерв.

Сейчас в пуле:

- `glm-5.3-flash` — text + vision;
- `qwen3.8-flash` — text + vision;
- `mimo-v2.5` — text + vision;
- `hy3` — только text.

Браузер никогда не получает provider API keys. Подробности: [`docs/MODEL_ROUTING.md`](./docs/MODEL_ROUTING.md).

## Локальный запуск

Нужна современная версия Node.js, поддерживаемая Vite 8.

```bash
git clone https://github.com/conradipui-glitch/AI-SVG-Animator.git
cd AI-SVG-Animator
npm install
npm run dev
```

Локальный Worker:

```bash
cp .dev.vars.example .dev.vars
npm run dev:worker
```

Production checks:

```bash
npm run build
npm run check:worker
```

Деплой описан в [`docs/DEPLOY.md`](./docs/DEPLOY.md).

## Стек

- **Vite 8** — frontend build / dev server
- **TypeScript 7** — типизированный application layer
- **GSAP 3.15** — runtime живой SVG-анимации
- **DOMPurify 3.4** — очистка SVG перед inline-рендером
- **Cloudflare Workers** — API boundary + static deployment
- **Cloudflare Workers AI** — резервный AI-маршрут
- **B.AI OpenAI-compatible API** — пул бесплатных моделей для MVP
- browser **Canvas** — SVG → PNG visual context для мультимодального анализа
- browser **Web Animations API** — автономный HTML-export preset- и AI Motion Spec-анимаций

## Структура

```text
src/
├── ai.ts             # AI API client + visual/structural scene context
├── animator.ts       # presets + Motion Spec GSAP executor
├── export.ts         # standalone preset / AI animation HTML export
├── main.ts           # состояние, one-click AI motion, UI и variants
├── motion-spec.ts    # tolerant Motion Spec v1 parser / validator
├── sample.ts         # встроенный демонстрационный вектор
├── styles.css        # Vector Laboratory × Motion Studio UI
├── svg.ts            # sanitization + normalization
└── i18n/
    ├── index.ts
    ├── en.ts
    ├── ru.ts
    └── types.ts

worker/
└── index.ts           # B.AI motion/variants/vision routes + Cloudflare fallback
```

## Визуальное направление

Продукт использует стиль **Vector Laboratory × Motion Studio**:

- глубокая navy / graphite база;
- сдержанный electric-blue;
- язык Bézier-кривых, anchor points и motion paths;
- ощущение гибрида дизайн-инструмента и developer tool.

И да — без обязательного мистического неонового AI-мозга 😄

## Локализация

MVP двуязычный:

- **English**
- **Русский**

Приоритет: сохранённый ручной выбор → язык браузера / системы → географический fallback → English. Ручной выбор всегда главный и сохраняется локально.

Подробности: [`docs/LOCALIZATION.md`](./docs/LOCALIZATION.md).

## Дорожная карта

### ✅ Milestone 0 — foundation
- план продукта;
- двуязычный README и visual identity;
- архитектура локализации.

### ✅ Milestone 1 — Static Animator
- вставка / загрузка SVG;
- sanitizer + normalizer;
- Reveal / Draw / Float;
- live preview;
- duration / intensity / loop;
- экспорт очищенного SVG;
- автономный preset HTML export.

### 🟢 Milestone 2.1 — AI Motion Fix + Auto Variants
- live B.AI motion route проверен;
- one-click **«Анимировать с AI»**;
- визуальный рендер + структурный SVG-контекст;
- strict/tolerant Motion Spec validation;
- автоматическое GSAP-воспроизведение;
- варианты Subtle / Natural / Expressive;
- диагностика / partial validation;
- автономный export AI-анимации;
- остаётся финальный ручной browser acceptance.

### ▶ Milestone 2.2 — Motion-Ready SVG Preparation
- semantic grouping;
- подготовка pivot points с учётом геометрии;
- определение элементов, которые надо разделить перед анимацией;
- редактируемые semantic labels;
- основа AI-assisted topology reconstruction.

### Milestone 3 — Semantic Motion Director
- более глубокое понимание сцены;
- семантика персонажей / объектов;
- интеллектуальная перестройка элементов под анимацию;
- сценическая хореография;
- prompt-driven и automatic motion на основе смысла изображения.

### Поздние input / generation layers
- prompt → SVG generation;
- raster image → motion-ready vector;
- Universal Import Layer для SVG/SVGZ, EPS/PS/AI/PDF и затем дополнительных vector-форматов;
- layered / hybrid SVG + raster scenes.

### Public MVP polish
- responsive QA;
- реальный demo asset / анимированный README-пример, сделанный самим инструментом;
- расширенные browser fixture tests;
- эксперименты с Lottie / video export.

## Документы

- [`docs/PRODUCT_PLAN.md`](./docs/PRODUCT_PLAN.md) — гипотеза, архитектура и этапы.
- [`docs/MILESTONE_2_1.md`](./docs/MILESTONE_2_1.md) — текущее ТЗ и acceptance AI Motion.
- [`docs/MOTION_SPEC.md`](./docs/MOTION_SPEC.md) — контролируемый контракт AI → renderer.
- [`docs/MODEL_ROUTING.md`](./docs/MODEL_ROUTING.md) — B.AI + Cloudflare routing.
- [`docs/DEPLOY.md`](./docs/DEPLOY.md) — безопасный Cloudflare deployment.
- [`docs/LOCALIZATION.md`](./docs/LOCALIZATION.md) — стратегия RU / EN.

## Видение

> Опиши идею. Получи чистый SVG. Оживи его. Отправь в веб.