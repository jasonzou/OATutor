import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { router } from './router'

import App from './App.vue'

import '@unocss/reset/tailwind.css'
import '@/assets/styles/main.scss'
import 'virtual:uno.css'

async function bootstrap() {
  const app = createApp(App)
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
