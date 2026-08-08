<script setup lang="ts">
// App shell: header (brand, build time, locale switch, dark toggle) + routed page.
import BrandLogoNav from '@/components/BrandLogoNav.vue'
import BuildTimeIndicator from '@/components/BuildTimeIndicator.vue'
import Spacer from '@/components/Spacer.vue'
import { useAppStore } from '@/shared/store/app'
import { useLocaleStore } from '@/shared/store/locale'

const app = useAppStore()
const locale = useLocaleStore()
const langOptions = locale.supportedLanguages.map(l => ({ label: l.toUpperCase(), value: l }))
</script>

<template>
  <div class="min-h-screen">
    <header class="h-header flex-y-center gap-3 px-6 border-b border-gray-200 dark:border-gray-700">
      <BrandLogoNav />
      <BuildTimeIndicator />
      <Spacer />
      <NSelect
        :value="locale.platformLanguage"
        :options="langOptions"
        size="small"
        class="w-32"
        @update:value="locale.setPlatformLanguage($event)"
      />
      <NButton quaternary circle aria-label="Toggle dark mode" @click="app.toggleDark">
        <span :class="app.isDark ? 'i-lucide-moon' : 'i-lucide-sun'" />
      </NButton>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>
