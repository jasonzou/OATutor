import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { router } from './router'

import App from './App.vue'
import { hydrateFromDesktop } from '@core/util/desktopStorage'

import '@unocss/reset/tailwind.css'
import '@/assets/styles/main.scss'
import 'virtual:uno.css'

async function bootstrap() {
  const app = createApp(App)

  // Pull durable state (userID, lesson progress) from the Tauri store on
  // desktop; no-op in the browser (localStorage is the source there).
  await hydrateFromDesktop(['oatutor-user_id', 'oatutor-progress'])

  app.use(createPinia())
  app.use(router)

  // Prevent external styles from overriding naive-ui component styles.
  // https://www.naiveui.com/os-theme/docs/style-conflict
  const meta = document.createElement('meta')
  meta.name = 'naive-ui-style'
  document.head.appendChild(meta)

  await router.isReady()
  app.mount('#app')
}

bootstrap()
