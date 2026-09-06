# AI SVG Animator — Localization Strategy

> **Implementation status:** the repository now contains typed RU / EN dictionaries and locale resolution in `src/i18n/`.

AI SVG Animator ships with two interface languages from the first public MVP:

- **Русский (RU)** — default for Russian-language browsers and, when browser preference is unavailable, CIS-market geography.
- **English (EN)** — default for the rest of the world.

## Product principle

Language detection should be helpful, not restrictive.

The app may choose an initial language automatically, but the user must always be able to switch between **RU / EN** manually. A manual choice always wins over automatic detection and is persisted locally.

## Language resolution order

Use this priority order on first load:

1. **Saved user choice** (`localStorage`) if present.
2. **Browser language** (`navigator.languages` / `Accept-Language`).
   - `ru-*` → RU;
   - `en-*` → EN.
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

## Implementation

Current structure:

```text
src/
  i18n/
    index.ts
    en.ts
    ru.ts
    types.ts
```

`types.ts` defines the translation schema. `en.ts` and `ru.ts` implement the dictionaries. `index.ts` provides:

- saved-locale lookup;
- browser-locale detection;
- CIS-country fallback;
- locale persistence;
- a locale-change browser event;
- typed access to the active dictionary.

Storage key:

```text
ai-svg-animator.locale
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

GitHub documentation is bilingual, with English as the repository entry point for global discovery:

- `README.md` — English primary README;
- `README.ru.md` — complete Russian version;
- language links at the top of both files;
- localized hero and pipeline SVG assets in `assets/`.

## Acceptance criteria

Localization is ready for the first public release when:

1. a Russian-language visitor normally lands in RU;
2. a CIS-market visitor without an EN/RU browser preference falls back to RU;
3. other visitors normally land in EN;
4. RU/EN can be switched instantly;
5. the selection survives reloads;
6. no core flow contains untranslated UI strings;
7. both languages can complete the full flow: **prompt → SVG → motion → preview → export**.
