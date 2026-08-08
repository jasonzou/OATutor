// Locale store — direct port of the React LocalizationContext: a persisted
// "platform" language plus a per-course "active" language (so entering a course
// can switch to that course's language for the session).
import { defineStore } from 'pinia'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, type Language } from '@/shared/config'

const PLATFORM_KEY = 'platformLanguage'

function readPlatform(): Language {
  const s = localStorage.getItem(PLATFORM_KEY)
  return AVAILABLE_LANGUAGES.includes(s as Language) ? (s as Language) : DEFAULT_LANGUAGE
}

function isLang(x: string | null | undefined): x is Language {
  return !!x && (AVAILABLE_LANGUAGES as readonly string[]).includes(x)
}

export const useLocaleStore = defineStore('locale', () => {
  const platformLanguage = ref<Language>(readPlatform())
  const activeLanguage = ref<Language>(platformLanguage.value)
  const currentCourseName = ref<string | null>(null)
  const supportedLanguages = AVAILABLE_LANGUAGES

  function setPlatformLanguage(lang: Language) {
    if (!isLang(lang)) return
    platformLanguage.value = lang
    localStorage.setItem(PLATFORM_KEY, lang)
    if (!currentCourseName.value) activeLanguage.value = lang
  }

  function enterCourse(courseName: string, courseLanguage?: string) {
    currentCourseName.value = courseName
    const saved = sessionStorage.getItem(`course_lang_${courseName}`)
    if (isLang(saved)) {
      activeLanguage.value = saved
    } else if (isLang(courseLanguage)) {
      activeLanguage.value = courseLanguage
      sessionStorage.setItem(`course_lang_${courseName}`, courseLanguage)
    } else {
      activeLanguage.value = platformLanguage.value
    }
  }

  function exitCourse() {
    currentCourseName.value = null
    activeLanguage.value = platformLanguage.value
  }

  return {
    platformLanguage,
    activeLanguage,
    currentCourseName,
    supportedLanguages,
    setPlatformLanguage,
    enterCourse,
    exitCourse,
  }
})
