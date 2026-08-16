<script setup lang="ts">
// Settings (functional slice; more options land with later phases).
import { AVAILABLE_LANGUAGES, BUILD_TIMESTAMP, SITE_NAME } from '@/shared/config'
import { useAppStore } from '@/shared/store/app'
import { useLocaleStore } from '@/shared/store/locale'
import { useProgressStore } from '@/shared/store/progress'

const app = useAppStore()
const locale = useLocaleStore()
const progress = useProgressStore()
const dialog = useDialog()

const langOptions = AVAILABLE_LANGUAGES.map(l => ({ label: l.toUpperCase(), value: l }))
const buildTime = Number(BUILD_TIMESTAMP)

function confirmReset() {
  dialog?.warning({
    title: 'Reset all progress?',
    content: 'Completed problems and mastery for every lesson will be cleared. This cannot be undone.',
    positiveText: 'Reset',
    negativeText: 'Cancel',
    onPositiveClick: () => progress.resetAll(),
  })
}
</script>

<template>
  <div class="max-w-xl mx-auto p-6">
    <h2 class="text-xl font-bold mb-4">
      Settings
    </h2>

    <NCard size="small">
      <div class="flex-y-center justify-between py-2">
        <div>
          <div class="font-medium">
            Dark mode
          </div>
          <div class="text-xs text-gray-500">
            Use the dark theme across the app.
          </div>
        </div>
        <NSwitch :value="app.isDark" @update:value="app.toggleDark()" />
      </div>

      <NDivider style="margin: 4px 0" />

      <div class="flex-y-center justify-between py-2">
        <div>
          <div class="font-medium">
            Language
          </div>
          <div class="text-xs text-gray-500">
            Platform language ({{ locale.supportedLanguages.join(', ') }}).
          </div>
        </div>
        <NSelect
          :value="locale.platformLanguage"
          :options="langOptions"
          size="small"
          class="w-28"
          @update:value="locale.setPlatformLanguage($event)"
        />
      </div>

      <NDivider style="margin: 4px 0" />

      <div class="flex-y-center justify-between py-2">
        <div>
          <div class="font-medium">
            Reset progress
          </div>
          <div class="text-xs text-gray-500">
            Clear completed problems and mastery for all lessons.
          </div>
        </div>
        <NButton size="small" type="warning" secondary @click="confirmReset">
          Reset
        </NButton>
      </div>
    </NCard>

    <p
      v-if="!Number.isNaN(buildTime)"
      class="text-xs text-gray-400 mt-4"
    >
      {{ SITE_NAME }} · built {{ new Date(buildTime).toUTCString() }}
    </p>
  </div>
</template>
