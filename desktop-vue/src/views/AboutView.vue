<script setup lang="ts">
// About: app identity, build info, and content credits.
import pkg from '../../package.json'
import { openExternal } from '@core/util/openExternal'
import { BUILD_TIMESTAMP, IS_DESKTOP, SITE_NAME } from '@/shared/config'
import { COMMIT_HASH } from '@core/util/runtimeEnv'

const repoUrl = 'https://github.com/CAHLR/OATutor'
const openstaxUrl = 'https://openstax.org'
const jasonZouUrl = 'https://github.com/jasonzou/OATutor-Desktop'

const rows = [
  { label: 'Version', value: `v${pkg.version}` },
  { label: 'Build', value: BUILD_TIMESTAMP || 'development build' },
  { label: 'Commit', value: COMMIT_HASH || '—' },
  { label: 'Platform', value: IS_DESKTOP ? 'Desktop (Tauri)' : 'Web' },
  { label: 'Github', value: `${jasonZouUrl}` },
  { label: 'Desktop App', value: "by Jason Zou" }
]
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <div class="flex-y-center gap-3 mb-2">
      <span class="i-lucide-graduation-cap text-3xl text-[#1976D2]" />
      <h2 class="text-2xl font-bold m-0">
        {{ SITE_NAME + " App"  }}
      </h2>
    </div>
<p class="text-gray-500 mt-0 mb-1">
      Open Adaptive Tutor — an open-source adaptive math tutor from the CAHLR lab.
    </p>

    <NCard size="small" class="mb-4">
      <div
        v-for="row in rows"
        :key="row.label"
        class="flex-y-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-none"
      >
        <span class="text-gray-500">{{ row.label }}</span>
        <span class="font-mono text-sm">{{ row.value }}</span>
      </div>
    </NCard>

    <NCard title="Content & licenses" size="small" class="mb-4">
      <ul class="list-disc pl-5 m-0 flex flex-col gap-2">
        <li>
          Application: MIT License —
          <a class="text-[#1976D2]" @click.prevent="openExternal(repoUrl)" :href="repoUrl">CAHLR/OATutor</a>
        </li>
        <li>
          Tutoring content: CC BY 4.0 (OATutor content sources)
        </li>
        <li>
          Textbook sections: OpenStax
          <em>Calculus Volume 1</em> — CC BY-NC-SA 4.0 —
          <a class="text-[#1976D2]" @click.prevent="openExternal(openstaxUrl)" :href="openstaxUrl">openstax.org</a>
        </li>
      </ul>
    </NCard>

    <div class="flex gap-2">
      <NButton size="small" tertiary @click="openExternal(repoUrl)">
        <template #icon>
          <span class="i-lucide-github" />
        </template>
        GitHub
      </NButton>
      <NButton size="small" tertiary @click="openExternal(openstaxUrl)">
        <template #icon>
          <span class="i-lucide-external-link" />
        </template>
        OpenStax
      </NButton>
    </div>
  </div>
</template>
