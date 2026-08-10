// Runs in the node environment: localStorage/sessionStorage are stubbed with an
// in-memory Storage implementation (Node's built-in localStorage global is a
// stub without --localstorage-file, so tests must not rely on it).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTranslation } from '@/shared/composables/useTranslation'
import { useLocaleStore } from '@/shared/store/locale'

function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size
    },
  } as Storage
}

describe('useTranslation', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('translates a dotted key in the default (English) language', () => {
    const { t } = useTranslation()
    expect(t('problem.Submit')).toBe('Submit')
  })

  it('translates into the active language after entering a course', () => {
    const locale = useLocaleStore()
    locale.enterCourse('Test Course', 'es')
    const { t } = useTranslation()
    expect(t('problem.Submit')).toBe('Entregar')
  })

  it('translates in every supported language (locale files share key sets)', () => {
    const locale = useLocaleStore()
    const { t } = useTranslation()
    const expectations: Record<string, string> = { en: 'Submit', es: 'Entregar', se: 'Skicka in' }
    for (const [lang, expected] of Object.entries(expectations)) {
      // distinct course per language: the first-entered language is remembered
      // per course for the session (sessionStorage)
      locale.enterCourse(`Course ${lang}`, lang)
      expect(t('problem.Submit')).toBe(expected)
    }
  })

  it('returns the key itself for unknown keys', () => {
    const { t } = useTranslation()
    expect(t('no.such.key')).toBe('no.such.key')
  })

  it('exitCourse restores the platform language', () => {
    const locale = useLocaleStore()
    locale.enterCourse('Test Course', 'es')
    locale.exitCourse()
    const { t } = useTranslation()
    expect(t('problem.Submit')).toBe('Submit')
  })
})
