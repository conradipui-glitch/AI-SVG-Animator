# AI SVG Animator — Localization Strategy

AI SVG Animator ships with two interface languages from the first public MVP:

- **Русский (RU)** — default for users from CIS markets and Russian-language browsers.
- **English (EN)** — default for the rest of the world.

## Product principle

Language detection should be helpful, not restrictive.

The app may choose an initial language automatically, but the user must always be able to switch between **RU / EN** manually. A manual choice always wins over automatic detection and is persisted locally.

## Language resolution order

Use this priority order on first load:

1. **Saved user choice** (`localStorage`) if present.
2. **Browser language** (`navigator.languages` / `Accept-Language`).
   - `ru-*` → RU.
3. **Country / Cloudflare request metadata** as a fallback.
   - configured CIS-market country set → RU.
4. Everything else → EN.

This avoids relying on IP geography when the browser already tells us the user's preferred language.

## Manual switch

A compact **RU / EN** switch must remain visible in the main UI.

Requirements:

- switch without page reload;
- persist selection locally;
- no account required;
- preserve the current project/prompt/animation while switching language;
- all system errors, generation states and export labels must switch too.

## Scope for MVP

Translate all user-facing interface copy:

- navigation and primary actions;
- prompt hints and examples;
- SVG generation states;
- animation preset names and descriptions;
- motion controls;
- validation and API errors;
- export actions;
- onboarding / empty states;
- privacy/security notes shown in-product.

Do **not** translate:

- SVG/XML code;
- CSS/JS/GSAP identifiers;
- JSON Motion Spec keys;
- file extensions;
- provider/model IDs;
- technical logs intended for developers.

## Prompt handling

Users may write generation prompts in either Russian or English regardless of UI language.

The provider adapter should pass the user's prompt as-is by default. Prompt rewriting or translation, if introduced later, must be an explicit internal step and must preserve user intent.

## Implementation direction

Keep translations as typed dictionaries rather than scattering strings across components.

Suggested structure:

```text
src/
  i18n/
    index.ts
    ru.ts
    en.ts
    types.ts
```

Example:

```ts
export const en = {
  hero: {
    title: 'AI SVG Animator',
    subtitle: 'Turn ideas into living vectors.'
  },
  actions: {
    generate: 'Generate SVG',
    animate: 'Animate',
    export: 'Export'
  }
} as const;
```

```ts
export const ru = {
  hero: {
    title: 'AI SVG Animator',
    subtitle: 'Превращайте идеи в живые векторы.'
  },
  actions: {
    generate: 'Создать SVG',
    animate: 'Анимировать',
    export: 'Экспорт'
  }
} satisfies TranslationSchema;
```

## URLs and SEO

For the MVP, language can be client-side and does not require separate routes.

For a later public marketing site, prefer explicit localized routes:

```text
/en/
/ru/
```

with correct `hreflang` metadata and shareable localized URLs.

## README strategy

GitHub documentation should also be bilingual, but English should remain the repository entry point because GitHub discovery is global.

Recommended layout:

- `README.md` — English primary README;
- `README.ru.md` — complete Russian version;
- language links at the very top of both files: **English | Русский**.

Hero artwork should avoid embedding long language-dependent copy where possible. Shared visual assets should remain usable in both README versions.

## Acceptance criteria

Localization is ready for the first public release when:

1. a Russian-speaking/CIS-market visitor normally lands in RU;
2. other visitors normally land in EN;
3. RU/EN can be switched instantly;
4. the selection survives reloads;
5. no core flow contains untranslated UI strings;
6. both languages can complete the full flow: **prompt → SVG → motion → preview → export**.
