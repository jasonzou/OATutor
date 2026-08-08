import { createRouter, createWebHashHistory } from 'vue-router'

// Hash history so routing works under the Tauri webview (mirrors the React app's
// HashRouter). Routes grow as screens are ported (Phase 1+ of the conversion).
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'lessons', component: () => import('@/views/LessonSelection.vue') },
  ],
})
