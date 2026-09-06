<p align="right"><a href="./README.md"><strong>English</strong></a></p>

<p align="center">
  <img src="./assets/hero-ru.svg" alt="AI SVG Animator hero" width="100%" />
</p>

<h1 align="center">AI SVG Animator</h1>
<p align="center"><strong>Превращает идеи в живые векторы.</strong></p>

<p align="center">Промпт → SVG → Движение → Анимация</p>

<p align="center">
  <a href="./docs/PRODUCT_PLAN.md">План продукта</a> ·
  <a href="./docs/LOCALIZATION.md">Локализация</a>
</p>

## Что это такое?

**AI SVG Animator** — веб-инструмент, который превращает текстовую идею, растровый референс или существующий SVG в управляемый анимированный векторный ассет.

Первый публичный MVP строится вокруг простого пайплайна:

- генерация SVG через **RouterAI / Recraft Vector**;
- очистка и нормализация SVG;
- применение анимации сначала через пресеты, затем через Motion Spec / AI-planner;
- live preview результата;
- экспорт **HTML + SVG** для веба.

Цель проекта — не магия AI сама по себе, а процесс, который одновременно **быстрый**, **редактируемый** и **веб-нативный**.

## Как это работает

<p align="center">
  <img src="./assets/pipeline-ru.svg" alt="AI SVG Animator pipeline" width="100%" />
</p>

1. **Промпт или SVG на входе** — пользователь описывает идею или приносит свой SVG.
2. **Генерация и очистка SVG** — создаётся редактируемый вектор и затем нормализуется.
3. **Добавление движения** — сначала через простые пресеты, позже через AI-generated Motion Spec.
4. **Превью и экспорт** — базовая настройка параметров и выгрузка готового результата.

## Зачем нужен этот проект

Создание анимированных SVG-ассетов часто попадает в неудобную серую зону: AI-генераторы изображений обычно заканчиваются на растровом результате, дизайн-инструменты умеют отдавать вектор, но плохо автоматизируют motion, а полноценные motion-пакеты тяжеловаты для быстрых продуктовых задач. Разработчику или дизайнеру часто нужен просто **чистый анимированный ассет прямо сейчас**.

AI SVG Animator пытается закрыть именно этот разрыв.

## Фокус MVP

### P0 — первый публичный билд

- ввод промпта;
- вставка / загрузка существующего SVG;
- интеграция RouterAI / Recraft Vector;
- sanitization + normalization SVG;
- live preview;
- 3 motion-пресета: **Reveal**, **Draw**, **Float**;
- управление длительностью, интенсивностью и циклом;
- экспорт самодостаточного HTML;
- скачивание исходного / нормализованного SVG;
- деплой на Cloudflare без утечки секретов в клиент или репозиторий.

### Следующие улучшения

- семантический анализ SVG;
- Motion Spec JSON;
- AI motion planner;
- экспорт в Lottie;
- animated SVG / GIF / WebM export;
- библиотека пресетов;
- сохранение и шаринг проектов.

## Планируемая архитектура

```text
Промпт / SVG / Растр
        │
        ▼
Input Gateway
        │
        ├── text → RouterAI / Recraft Vector
        ├── SVG → validation
        └── raster → vectorizer (later)
        │
        ▼
SVG Sanitizer + Normalizer
        │
        ▼
SVG Analyzer
        │
        ▼
Motion Planner
   presets / AI
        │
        ▼
Motion Spec JSON
        │
        ▼
Renderer (GSAP)
        │
        ├── Live Preview
        ├── HTML export
        ├── SVG export
        └── Lottie / video exporters (later)
```

## Визуальное направление

В основе оформления репозитория и продукта лежит направление:

> **Vector Laboratory × Motion Studio**

Глубокая navy / graphite база, сдержанные electric-blue акценты, Bézier-кривые, anchor points, motion paths и ощущение гибрида дизайн-инструмента и developer tool.

Сознательно избегаем стандартной эстетики «магический неоновый AI SaaS» 😄

## Статус репозитория

Текущая стадия: **foundation + documentation + visual direction**.

Следующий технический шаг — реальный каркас MVP: SVG input, normalizer, deterministic presets, preview, export, затем RouterAI generation и Cloudflare deployment.

## Локализация

Сервис двуязычный уже в первом MVP:

- **English**
- **Русский**

Главный сигнал для языка по умолчанию — язык браузера / системы. География используется только как fallback. Ручной выбор всегда важнее автоопределения и сохраняется локально.

Подробности: [`docs/LOCALIZATION.md`](./docs/LOCALIZATION.md).

## Документы

- [`docs/PRODUCT_PLAN.md`](./docs/PRODUCT_PLAN.md) — продуктовая гипотеза, архитектура, этапы, объём MVP.
- [`docs/LOCALIZATION.md`](./docs/LOCALIZATION.md) — стратегия RU / EN для приложения и репозитория.

## Дорожная карта

### Milestone 0 — foundation
- план продукта;
- стратегия локализации;
- README / brand direction;
- структура проекта;
- Cloudflare config.

### Milestone 1 — static animator
- SVG input;
- normalizer;
- deterministic presets;
- preview;
- HTML export.

### Milestone 2 — AI SVG generation
- RouterAI / Recraft integration;
- prompt → SVG → animation end-to-end.

### Milestone 3 — AI motion
- semantic analyzer;
- Motion Spec;
- AI motion planner.

### Milestone 4 — public MVP polish
- responsive UI;
- real demo assets;
- deployment;
- smoke tests.

## Видение

> Опиши идею. Получи чистый SVG. Оживи его. Отправь в веб.
