<p align="right"><a href="./README.md"><strong>English</strong></a></p>

<p align="center">
  <img src="./assets/hero-ru.svg" alt="AI SVG Animator hero" width="100%" />
</p>

<h1 align="center">AI SVG Animator</h1>
<p align="center"><strong>Превращает идеи в живые векторы.</strong></p>
<p align="center">SVG → Движение → Веб · AI Motion Director уже подключён · Промпт → SVG — следующий этап</p>

<p align="center">
  <a href="./docs/PRODUCT_PLAN.md">План продукта</a> ·
  <a href="./docs/MOTION_SPEC.md">Motion Spec</a> ·
  <a href="./docs/MODEL_ROUTING.md">Маршрутизация моделей</a> ·
  <a href="./docs/DEPLOY.md">Деплой</a> ·
  <a href="./docs/LOCALIZATION.md">Локализация</a>
</p>

## Текущий билд

**Static Animator реализован, а первый контур AI Motion Director уже связан end-to-end.**

Приложение уже умеет:

- вставлять SVG-код или загружать `.svg`;
- удалять небезопасную разметку через DOMPurify;
- нормализовать `viewBox` и назначать стабильные animation targets;
- показывать результат на живом холсте;
- применять **Reveal / Draw / Float**;
- настраивать длительность, интенсивность и цикл;
- переключать весь UI **RU / EN** без потери текущей работы;
- выбирать доступную бесплатную модель B.AI;
- принимать текстовое описание желаемой анимации или работать автоматически при пустом поле;
- отправлять модели компактную карту SVG-узлов вместо всего сырого файла;
- валидировать возвращённый **Motion Spec v1** по реальным ID текущего SVG;
- автоматически исполнять корректный AI motion plan через GSAP;
- безопасно возвращаться к deterministic presets, если AI-ответ некорректен или недоступен;
- скачивать нормализованный SVG;
- экспортировать автономный HTML для preset-анимации.

Следующий крупный этап подключает **RouterAI / Recraft Vector**, после чего пользователь сможет начинать с текстового описания, а не с готового SVG.

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
   ├──────── deterministic presets ────────┐
   │                                        │
   ▼                                        │
compact node map                            │
   │                                        │
   ▼                                        │
B.AI / резерв Cloudflare AI                 │
   │                                        │
   ▼                                        │
Motion Spec v1                              │
   │                                        │
   ▼                                        │
allowlist + clamps + проверка target IDs    │
   │                                        │
   └──────────────► GSAP renderer ◄─────────┘
                         │
                         ▼
                      Превью
```

## Зачем нужен этот проект

Анимированный SVG находится в неудобной промежуточной зоне: AI-генераторы обычно заканчиваются на растре, дизайн-инструменты умеют экспортировать вектор, но плохо автоматизируют motion, а полноценные motion-пакеты избыточны для быстрой продуктовой работы.

AI SVG Animator строит более короткий путь:

> **Опиши или принеси вектор → оживи его → отправь в веб.**

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
- **GSAP 3.15** — SVG animation runtime
- **DOMPurify 3.4** — очистка SVG перед inline-рендером
- **Cloudflare Workers** — API boundary + static deployment
- **Cloudflare Workers AI** — резервный AI-маршрут
- **B.AI OpenAI-compatible API** — пул бесплатных моделей для MVP
- браузерный **Web Animations API** — автономная preset-анимация экспортированного HTML

## Структура

```text
src/
├── ai.ts             # AI API client + compact node-map prompt
├── animator.ts       # presets + Motion Spec GSAP executor
├── export.ts         # автономный HTML + скачивание файлов
├── main.ts           # состояние, UI и взаимодействия
├── motion-spec.ts    # Motion Spec v1 parser / validator
├── sample.ts         # встроенный демонстрационный вектор
├── styles.css        # Vector Laboratory × Motion Studio UI
├── svg.ts            # sanitization + normalization
└── i18n/
    ├── index.ts
    ├── en.ts
    ├── ru.ts
    └── types.ts

worker/
└── index.ts           # B.AI routes + Cloudflare fallback
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
- экспорт автономного preset HTML.

### 🟡 AI Motion foundation — реализован
- B.AI routing;
- Cloudflare fallback chain;
- текстовый motion prompt;
- compact SVG node map;
- Motion Spec v1;
- target/effect validation;
- автоматическое GSAP-исполнение корректного AI-плана.

### ▶ Milestone 2 — AI SVG generation
- RouterAI / Recraft Vector adapter;
- prompt → SVG;
- prompt → SVG → animation end-to-end;
- provider errors / rate handling;
- публичный Cloudflare deployment.

### Milestone 3+ — Semantic scene motion
- vision-анализ сцены;
- semantic SVG groups;
- автоматический выбор ключевых объектов;
- image / scene decomposition;
- layered и hybrid scene animation;
- несколько вариантов motion.

### Public MVP polish
- responsive QA;
- реальный demo asset / анимированный пример README;
- smoke tests;
- эксперименты с Lottie / video export.

## Документы

- [`docs/PRODUCT_PLAN.md`](./docs/PRODUCT_PLAN.md) — гипотеза, архитектура и этапы.
- [`docs/MOTION_SPEC.md`](./docs/MOTION_SPEC.md) — контролируемый контракт AI → renderer.
- [`docs/MODEL_ROUTING.md`](./docs/MODEL_ROUTING.md) — B.AI + Cloudflare routing.
- [`docs/DEPLOY.md`](./docs/DEPLOY.md) — безопасный Cloudflare deployment.
- [`docs/LOCALIZATION.md`](./docs/LOCALIZATION.md) — стратегия RU / EN.

## Видение

> Опиши идею. Получи чистый SVG. Оживи его. Отправь в веб.