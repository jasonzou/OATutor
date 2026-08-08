// Translation composable — port of useTranslation: dotted-key lookup into the
// locale JSON for the active language. Reuses the React app's locale files.
import en from '@core/locales/en.json'
import es from '@core/locales/es.json'
import se from '@core/locales/se.json'
import { useLocaleStore } from '@/shared/store/locale'

const maps: Record<string, unknown> = { en, es, se }

export function useTranslation() {
  const locale = useLocaleStore()

  function t(key: string): unknown {
    const map = maps[locale.activeLanguage] ?? maps.en
    return key
      .split('.')
      .reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), map)
  }

  return { t, locale }
}
