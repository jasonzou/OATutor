// Translation composable — port of useTranslation: dotted-key lookup into the
// locale JSON for the active language. Reuses the React app's locale files.
// Unlike the React version (which returns undefined for missing keys), t()
// always returns a string: active-language value, else English, else the key.
import en from '@core/locales/en.json'
import es from '@core/locales/es.json'
import se from '@core/locales/se.json'
import { useLocaleStore } from '@/shared/store/locale'

const maps: Record<string, unknown> = { en, es, se }

function lookup(lang: string, key: string): unknown {
  const map = maps[lang] ?? maps.en
  return key
    .split('.')
    .reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), map)
}

export function useTranslation() {
  const locale = useLocaleStore()

  function t(key: string): string {
    const v = lookup(locale.activeLanguage, key) ?? lookup('en', key)
    return typeof v === 'string' ? v : key
  }

  return { t, locale }
}
