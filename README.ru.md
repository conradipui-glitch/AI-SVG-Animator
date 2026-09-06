<p align="right"><a href="./README.md"><strong>English</strong></a></p>

<p align="center">
  <img src="./assets/hero-ru.svg" alt="AI SVG Animator hero" width="100%" />
</p>

<h1 align="center">AI SVG Animator</h1>
<p align="center"><strong>Превращает идеи в живые векторы.</strong></p>
<p align="center">SVG → Движение → Веб · Промпт → SVG — следующий этап</p>

<p align="center">
  <a href="./docs/PRODUCT_PLAN.md">План продукта</a> ·
  <a href="./docs/LOCALIZATION.md">Локализация</a>
</p>

## Текущий билд

**Milestone 1 — Static Animator реализован.**

Приложение уже может взять существующий SVG и превратить его в управляемую веб-анимацию:

- вставить SVG-код или загрузить `.svg` файл;
- удалить небезопасную разметку через DOMPurify;
- нормализовать размеры / `viewBox` и разметить анимируемую геометрию;
- показать результат на живом холсте;
- применить **Появление / Reveal**, **Прорисовку / Draw** или **Парение / Float**;
- настроить длительность, интенсивность и цикл;
- мгновенно переключить весь UI **RU / EN**, не теряя текущую работу;
- скачать очищенный SVG;
- экспортировать **автономный HTML**, которому не нужен CDN во время воспроизведения.

Следующий milestone подключает **RouterAI / Recraft Vector**, после чего начинать можно будет уже с текстового промпта.

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
   ▼
GSAP preview engine
   ├── Reveal
   ├── Draw
   └── Float
   │
   ▼
Live preview + экспорт SVG / автономного HTML
```

## Зачем нужен этот проект

Анимированный SVG находится в неудобной промежуточной зоне: AI-генераторы обычно заканчиваются на растре, дизайн-инструменты умеют экспортировать вектор, но плохо автоматизируют motion, а полноценные motion-пакеты избыточны для быстрой продуктовой работы.

AI SVG Animator строит более короткий путь:

> **Опиши или принеси вектор → оживи его → отправь в веб.**

## Локальный запуск

Нужна современная версия Node.js, поддерживаемая Vite 8.

```bash
git clone https://github.com/conradipui-glitch/AI-SVG-Animator.git
cd AI-SVG-Animator
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Стек

- **Vite 8** — frontend build / dev server
- **TypeScript 7** — типизированный application layer
- **GSAP 3.15** — live SVG animation runtime
- **DOMPurify 3.4** — очистка SVG перед inline-рендером
- браузерный **Web Animations API** — автономная анимация экспортированного HTML

## Структура

```text
src/
├── animator.ts       # Reveal / Draw / Float на GSAP
├── export.ts         # автономный HTML + скачивание файлов
├── main.ts           # состояние, UI и взаимодействия
├── sample.ts         # встроенный демонстрационный вектор
├── styles.css        # Vector Laboratory × Motion Studio UI
├── svg.ts            # sanitization + normalization
└── i18n/
    ├── index.ts      # определение языка + сохранение выбора
    ├── en.ts
    ├── ru.ts
    └── types.ts
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
- экспорт автономного HTML.

### ▶ Milestone 2 — AI SVG generation
- RouterAI / Recraft Vector adapter;
- prompt → SVG;
- prompt → SVG → animation end-to-end;
- обработка ошибок / rate limits;
- Cloudflare Worker boundary для секретов.

### Milestone 3 — AI motion
- semantic SVG analyzer;
- Motion Spec JSON;
- AI motion planner;
- редактируемые motion-вариации.

### Milestone 4 — public MVP polish
- deployment;
- responsive QA;
- реальный demo asset / анимированный пример в README;
- smoke tests;
- эксперименты с Lottie / video export.

## Документы

- [`docs/PRODUCT_PLAN.md`](./docs/PRODUCT_PLAN.md) — гипотеза, архитектура и этапы.
- [`docs/LOCALIZATION.md`](./docs/LOCALIZATION.md) — стратегия RU / EN.

## Видение

> Опиши идею. Получи чистый SVG. Оживи его. Отправь в веб.
