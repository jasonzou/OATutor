<script setup lang="ts">
import { useAppStore } from '@/shared/store/app'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const app = useAppStore()

// Sync UnoCSS `dark:` variants with the Naive UI theme toggle.
watchEffect(() => {
  document.documentElement.classList.toggle('dark', app.isDark)
})
</script>

<template>
  <NConfigProvider :theme="app.theme" :theme-overrides="app.themeOverrides" inline-theme-disabled>
    <NLoadingBarProvider>
      <NDialogProvider>
        <NMessageProvider>
          <NNotificationProvider>
            <DefaultLayout />
          </NNotificationProvider>
        </NMessageProvider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
