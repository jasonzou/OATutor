<script setup lang="ts">
// App shell (Phase A): Naive UI sidebar layout with the two modes + settings.
// - Question mode  -> /            (lesson picker -> Platform)
// - Reading mode   -> /read        (textbook browser -> section reader)
// - Settings       -> /settings
// Collapse state persists via localStorage (@vueuse useStorage).
import { RouterLink } from 'vue-router'
import { useStorage } from '@vueuse/core'
import { useAppStore } from '@/shared/store/app'
import { useLocaleStore } from '@/shared/store/locale'

const app = useAppStore()
const locale = useLocaleStore()
const route = useRoute()

const collapsed = useStorage('oatutor-sider-collapsed', false)
const langOptions = locale.supportedLanguages.map(l => ({ label: l.toUpperCase(), value: l }))

const menuOptions = [
  {
    label: () => h(RouterLink, { to: { path: '/' } }, { default: () => 'Question' }),
    icon: () => h('span', { class: 'i-lucide-list-checks text-16px' }),
    key: 'question',
  },
  {
    label: () => h(RouterLink, { to: { path: '/read' } }, { default: () => 'Reading' }),
    icon: () => h('span', { class: 'i-lucide-book-open text-16px' }),
    key: 'reading',
  },
  {
    label: () => h(RouterLink, { to: { path: '/settings' } }, { default: () => 'Settings' }),
    icon: () => h('span', { class: 'i-lucide-settings text-16px' }),
    key: 'settings',
  },
]

// Active menu entry derived from the route group.
const activeKey = computed(() => {
  const p = route.path
  if (p.startsWith('/read')) return 'reading'
  if (p.startsWith('/settings')) return 'settings'
  return 'question'
})
</script>

<template>
  <NLayout has-sider class="h-screen">
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed="collapsed"
      :collapsed-width="64"
      :width="200"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="flex flex-col h-full">
        <RouterLink
          to="/"
          class="flex-y-center gap-2 no-underline color-inherit h-14 px-4 border-b border-gray-200 dark:border-gray-700"
        >
          <span class="i-lucide-graduation-cap text-xl text-[#1976D2] shrink-0" />
          <span v-if="!collapsed" class="font-bold truncate">OATutor</span>
        </RouterLink>

        <NMenu
          :value="activeKey"
          :options="menuOptions"
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="20"
          class="flex-1 !border-none"
        />

        <div
          v-if="!collapsed"
          class="p-3 border-t border-gray-200 dark:border-gray-700 flex-y-center gap-2"
        >
          <NSelect
            :value="locale.platformLanguage"
            :options="langOptions"
            size="tiny"
            class="flex-1"
            @update:value="locale.setPlatformLanguage($event)"
          />
          <NButton quaternary circle size="tiny" aria-label="Toggle dark mode" @click="app.toggleDark">
            <span :class="app.isDark ? 'i-lucide-moon' : 'i-lucide-sun'" />
          </NButton>
        </div>
      </div>
    </NLayoutSider>

    <NLayout>
      <main class="h-screen overflow-auto">
        <RouterView />
      </main>
    </NLayout>
  </NLayout>
</template>
