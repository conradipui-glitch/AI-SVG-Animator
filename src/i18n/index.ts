import { en } from './en';
import { ru } from './ru';
import type { Locale, TranslationSchema } from './types';

export type { Locale, TranslationSchema } from './types';

export const translations: Record<Locale, TranslationSchema> = { en, ru };

const STORAGE_KEY = 'ai-svg-animator.locale';
const RU_FALLBACK_COUNTRIES = new Set([
  'RU', 'BY', 'KZ', 'KG', 'AM', 'AZ', 'MD', 'TJ', 'UZ', 'TM'
]);

function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'ru';
}

export function getSavedLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return isLocale(value) ? value : null;
}

export function detectBrowserLocale(): Locale | null {
  if (typeof navigator === 'undefined') return null;
  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const language of languages) {
    if (language?.toLowerCase().startsWith('ru')) return 'ru';
    if (language?.toLowerCase().startsWith('en')) return 'en';
  }

  return null;
}

export function localeFromCountry(country?: string | null): Locale | null {
  if (!country) return null;
  return RU_FALLBACK_COUNTRIES.has(country.toUpperCase()) ? 'ru' : null;
}

export function resolveLocale(country?: string | null): Locale {
  return getSavedLocale()
    ?? detectBrowserLocale()
    ?? localeFromCountry(country)
    ?? 'en';
}

export function saveLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, locale);
  window.dispatchEvent(new CustomEvent('ai-svg-animator:locale-change', {
    detail: { locale }
  }));
}

export function t(locale: Locale): TranslationSchema {
  return translations[locale];
}
