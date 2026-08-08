// App/theme store — mirrors the showy-naive-starter pattern (dark mode +
// Naive UI theme overrides), persisted to localStorage. UnoCSS `dark:` variants
// are synced via the `dark` class on <html> (see App.vue).
import { darkTheme } from 'naive-ui'
import type { GlobalTheme, GlobalThemeOverrides } from 'naive-ui'
import { defineStore } from 'pinia'

const DARK_KEY = 'oatutor-dark'

export const useAppStore = defineStore('app', () => {
  const isDark = ref(localStorage.getItem(DARK_KEY) === '1')

  const theme = computed<GlobalTheme | null>(() => (isDark.value ? darkTheme : null))

  // Material-ish blue, matching the old MUI look; tweak freely.
  const themeOverrides: GlobalThemeOverrides = {
    common: {
      primaryColor: '#1976D2',
      primaryColorHover: '#2196F3',
      primaryColorPressed: '#115293',
      primaryColorSuppl: '#1976D2',
    },
  }

  function toggleDark() {
    isDark.value = !isDark.value
    localStorage.setItem(DARK_KEY, isDark.value ? '1' : '0')
  }

  return { isDark, theme, themeOverrides, toggleDark }
})
